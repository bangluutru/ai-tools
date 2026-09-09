import { validateInvoiceXml } from './xmlValidator.js';
import { STATUS_TYPES, XML_FETCHER_LIMITS } from './types.js';

/**
 * Attempts a safe direct XML download from the client browser.
 * Follows strict safety principles:
 * - Never bypasses CORS or Anti-bot protections
 * - Enforces timeout
 * - Validates response is authentic XML (not HTML masquerade or error page)
 * - Detects field mismatch against PDF
 *
 * @param {Object} invoiceItem
 * @param {string} invoiceItem.lookupUrl
 * @param {string} [invoiceItem.lookupCode]
 * @param {string} [invoiceItem.sellerTaxCode]
 * @param {string} [invoiceItem.invoiceNumber]
 * @param {string} [invoiceItem.invoiceSymbol]
 * @param {number} [timeoutMs=XML_FETCHER_LIMITS.directDownloadTimeoutMs]
 * @returns {Promise<{
 *   success: boolean,
 *   xmlContent?: string,
 *   xmlBlob?: Blob,
 *   fallbackStatus?: string,
 *   reason?: string,
 *   hasMismatch?: boolean,
 *   mismatchDetails?: string[]
 * }>}
 */
export async function attemptDirectXmlDownload(invoiceItem, timeoutMs = XML_FETCHER_LIMITS.directDownloadTimeoutMs) {
  const provider = invoiceItem.provider;
  const lookupUrl = invoiceItem.lookupUrl || invoiceItem.url || '';
  const lookupCode = invoiceItem.lookupCode || invoiceItem.code || '';
  const sellerTaxCode =
    invoiceItem.sellerTaxCode || invoiceItem.taxCode || invoiceItem.expectedInvoice?.sellerTaxCode || '';
  const invoiceNumber = invoiceItem.invoiceNumber || invoiceItem.expectedInvoice?.invoiceNumber || '';
  const invoiceSymbol = invoiceItem.invoiceSymbol || invoiceItem.expectedInvoice?.invoiceSymbol || '';

  const metadata = {
    sellerTaxCode,
    taxCode: sellerTaxCode,
    invoiceNumber,
    invoiceSymbol,
    symbol: invoiceSymbol,
    ...(invoiceItem.expectedInvoice || {}),
  };

  // 1. If provider adapter has custom direct XML download (e.g. Minvoice)
  if (provider && typeof provider.tryDirectXml === 'function') {
    try {
      const xmlFromProvider = await provider.tryDirectXml(lookupUrl, lookupCode, metadata);
      if (xmlFromProvider && typeof xmlFromProvider === 'string') {
        const validation = validateInvoiceXml(xmlFromProvider, {
          taxCode: sellerTaxCode,
          symbol: invoiceSymbol,
          invoiceNumber,
        });

        if (validation.isValid) {
          const blob = new Blob([xmlFromProvider], { type: 'application/xml;charset=utf-8' });
          return {
            success: true,
            xmlContent: xmlFromProvider,
            xmlBlob: blob,
            hasMismatch: validation.hasMismatch,
            mismatchDetails: validation.mismatchDetails,
          };
        }
      }
    } catch {
      // Fallback to standard fetch
    }
  }

  if (!lookupUrl) {
    return {
      success: false,
      fallbackStatus: STATUS_TYPES.UNSUPPORTED,
      reason: 'Không tìm thấy đường dẫn tra cứu',
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(lookupUrl, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        Accept: 'application/xml, text/xml, */*',
      },
    });

    clearTimeout(timer);

    if (!response.ok) {
      return {
        success: false,
        fallbackStatus: STATUS_TYPES.MANUAL_REQUIRED,
        reason: `Website phản hồi trạng thái HTTP ${response.status}`,
      };
    }

    const text = await response.text();

    // Validate XML content
    const validation = validateInvoiceXml(text, {
      taxCode: sellerTaxCode,
      symbol: invoiceSymbol,
      invoiceNumber,
    });

    if (!validation.isValid) {
      // If HTML was returned, it's almost certainly a captcha, search form or login page
      const isHtml = /<!DOCTYPE\s+html|<html/i.test(text);
      return {
        success: false,
        fallbackStatus: isHtml ? STATUS_TYPES.CAPTCHA_REQUIRED : STATUS_TYPES.MANUAL_REQUIRED,
        reason: validation.reason,
      };
    }

    // Success! Authentic XML found
    const blob = new Blob([text], { type: 'application/xml;charset=utf-8' });

    return {
      success: true,
      xmlContent: text,
      xmlBlob: blob,
      hasMismatch: validation.hasMismatch,
      mismatchDetails: validation.mismatchDetails,
    };
  } catch (err) {
    clearTimeout(timer);

    if (err.name === 'AbortError') {
      return {
        success: false,
        fallbackStatus: STATUS_TYPES.MANUAL_REQUIRED,
        reason: 'Quá thời gian chờ phản hồi từ cổng hóa đơn (Timeout)',
      };
    }

    // Network / CORS errors in browsers trigger TypeError: Failed to fetch
    return {
      success: false,
      fallbackStatus: STATUS_TYPES.MANUAL_REQUIRED,
      reason: 'Không thể tải tự động từ trình duyệt (Website có bảo mật CORS / Anti-bot). Vui lòng mở website gốc để tải.',
    };
  }
}
