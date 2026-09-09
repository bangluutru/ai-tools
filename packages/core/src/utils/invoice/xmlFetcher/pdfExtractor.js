import { extractInvoiceFields } from '../vietnamInvoice.js';
import { detectProvider } from './providers/index.js';
import { sanitizeLookupUrl, sanitizeLookupCode, buildStandardXmlFilename } from './sanitizer.js';
import { STATUS_TYPES, XML_FETCHER_LIMITS } from './types.js';

let pdfJsPromise = null;

/**
 * Lazy loads PDF.js and sets up worker
 */
export function loadPdfJs() {
  if (!pdfJsPromise) {
    if (typeof window === 'undefined') {
      pdfJsPromise = import('pdfjs-dist/legacy/build/pdf.mjs');
    } else {
      pdfJsPromise = Promise.all([
        import('pdfjs-dist'),
        import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
      ]).then(([pdfjsLib, workerModule]) => {
        pdfjsLib.GlobalWorkerOptions.workerSrc = workerModule.default;
        return pdfjsLib;
      });
    }
  }
  return pdfJsPromise;
}

/**
 * Extracts plain text from an ArrayBuffer of a PDF document
 * Preserves reading order and lines by sorting text items by Y and X coordinates
 * @param {ArrayBuffer} arrayBuffer
 * @returns {Promise<string>}
 */
export async function extractTextFromPdfBuffer(arrayBuffer, pdfjsLibInstance = null) {
  const pdfjsLib = pdfjsLibInstance || (await loadPdfJs());
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  const pageCount = Math.min(pdf.numPages, XML_FETCHER_LIMITS.maxPdfPages);
  let fullText = '';

  for (let i = 1; i <= pageCount; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();

    const items = textContent.items.map((item) => ({
      str: item.str,
      x: item.transform[4],
      y: item.transform[5],
    }));

    // Sort items top-to-bottom (descending Y), then left-to-right (ascending X)
    items.sort((a, b) => {
      if (Math.abs(a.y - b.y) > 5) {
        return b.y - a.y;
      }
      return a.x - b.x;
    });

    let pageText = '';
    let lastY = null;

    for (const item of items) {
      if (lastY !== null && Math.abs(item.y - lastY) > 5) {
        pageText += '\n';
      } else if (lastY !== null) {
        pageText += ' ';
      }
      pageText += item.str.trim();
      lastY = item.y;
    }

    pageText = pageText.replace(/ {2,}/g, ' ');

    // Collect clickable link annotations embedded in PDF
    try {
      const annotations = await page.getAnnotations();
      for (const ann of annotations) {
        if (ann && (ann.url || ann.unsafeUrl)) {
          const u = ann.url || ann.unsafeUrl;
          if (/^https?:\/\//i.test(u) && !pageText.includes(u)) {
            pageText += `\n${u}\n`;
          }
        }
      }
    } catch {
      // Annotations are optional
    }

    fullText += pageText + '\n';
    page.cleanup();
  }

  await loadingTask.destroy();
  return fullText;
}

export const parsePdfToText = extractTextFromPdfBuffer;

/**
 * Extracts all candidate lookup URLs from text, resolving wrapped lines
 * @param {string} text
 * @returns {string[]}
 */
export function extractCandidateUrls(text) {
  if (!text) return [];

  // Normalize URLs wrapped across lines (hyphen '-' at line end, or next line starting with '/')
  // and remove spaces after protocol: "https:// 1602066708..." -> "https://1602066708..."
  const normalizedText = text
    .replace(/(https?:\/\/[^\s]+-)\r?\n\s*([a-zA-Z0-9_.~!*';:@&=+$,/?%#-]+)/gi, '$1$2')
    .replace(/(https?:\/\/[^\s]+)\r?\n\s*(\/[a-zA-Z0-9_.~!*';:@&=+$,/?%#-]+)/gi, '$1$2')
    .replace(/(https?:\/\/)\s+([a-zA-Z0-9_.~!*';:@&=+$,/?%#-]+)/gi, '$1$2');

  const candidates = [];
  const urlRegex = /https?:\/\/[^\s"'<>]+/gi;
  const matches = normalizedText.match(urlRegex) || [];

  for (const m of matches) {
    const sanitized = sanitizeLookupUrl(m);
    if (sanitized && !candidates.includes(sanitized) && !sanitized.endsWith('-/')) {
      candidates.push(sanitized);
    }
  }

  // Handle spaced-out URLs (kerning/font tracking artifacts like "h t t p s : / / t r a c u u h o a d o n . m i n v o i c e . c o m . v n /")
  const textSegments = normalizedText.split(/\s{2,}|\r?\n/);
  for (const seg of textSegments) {
    const spacedMatch = seg.match(/h\s*t\s*t\s*p\s*s?\s*:\s*\/\s*\/[a-zA-Z0-9.\-_/ ]+/i);
    if (spacedMatch) {
      const beforeLabel = spacedMatch[0].split(/(?:m\s*ã|s\s*ố|n\s*g\s*à\s*y|t\s*ê\s*n)/i)[0];
      const cleaned = beforeLabel.replace(/\s+/g, '');
      const sanitized = sanitizeLookupUrl(cleaned);
      if (sanitized && !candidates.includes(sanitized) && !sanitized.endsWith('-/')) {
        candidates.push(sanitized);
      }
    }
  }

  // Also check for common domain-style lookup portals with full subdomains
  const domainRegex = /\b(?:[a-zA-Z0-9_.-]+\.)*(?:tracuu|tracuuhoadon|tra-cuu|einvoice|hoadon|sinvoice|meinvoice|vnpt-invoice|easyinvoice|ehoadon|hilo|minvoice)\.[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[^\s"'<>]*)?/gi;
  const domainMatches = normalizedText.match(domainRegex) || [];
  for (const dm of domainMatches) {
    const sanitized = sanitizeLookupUrl(dm);
    if (sanitized && !candidates.includes(sanitized)) {
      candidates.push(sanitized);
    }
  }

  // Known e-invoice root domains: preserve any preceding subdomains
  const knownDomains = [
    'vnpt-invoice.com.vn',
    'viettel.vn',
    'meinvoice.vn',
    'easyinvoice.com.vn',
    'easyinvoice.vn',
    'fpt.com.vn',
    'ehoadon.vn',
    'hilo.com.vn',
    'einvoice.vn',
    'mobifoneinvoice.vn',
    'vietjetair.com',
    'petrolimex.com.vn',
    'minvoice.com.vn',
    'minvoice.vn',
  ];

  for (const domain of knownDomains) {
    const escapedDomain = domain.replace(/\./g, '\\.');
    const regex = new RegExp(`(?:https?://)?(?:[a-zA-Z0-9_.-]+\\.)?${escapedDomain}(?:/[^\\s"'<>]*)?`, 'gi');
    const dMatches = normalizedText.match(regex) || [];
    for (const dm of dMatches) {
      const sanitized = sanitizeLookupUrl(dm);
      if (sanitized && !candidates.includes(sanitized)) {
        candidates.push(sanitized);
      }
    }
  }

  return candidates;
}

/**
 * Extracts candidate lookup code from text using labels and pattern matching
 * @param {string} text
 * @param {Object} [providerAdapter]
 * @returns {string}
 */
export function extractCandidateLookupCode(text, providerAdapter = null) {
  if (!text) return '';

  // 1. If provider adapter has custom code extraction
  if (providerAdapter && typeof providerAdapter.extractLookupCode === 'function') {
    const customCode = providerAdapter.extractLookupCode(text);
    if (customCode) return sanitizeLookupCode(customCode);
  }

  // 2. Common Vietnamese e-invoice lookup labels (including bilingual brackets like "(Invoice code)")
  const labelPatterns = [
    /(?:mã\s+tra\s+cứu(?:\s+hóa\s+đơn|\s+hđđt)?|mã\s+tra\s+cứu)\s*(?:\([^)]*\))?\s*[:.]?\s*([A-Za-z0-9\-_* ]{5,60})/i,
    /(?:mã\s+nhận\s+hóa\s+đơn|mã\s+nhận\s+hđ)\s*(?:\([^)]*\))?\s*[:.]?\s*([A-Za-z0-9\-_* ]{5,60})/i,
    /(?:mã\s+số\s+bí\s+mật\s*(?:\(access\s*code\))?|mã\s+số\s+bí\s+mật|mã\s+bí\s+mật)\s*(?:\([^)]*\))?\s*[:.]?\s*([A-Za-z0-9\-_* ]{5,60})/i,
    /(?:lookup\s*code|access\s*code|invoice\s*code)\s*(?:\([^)]*\))?\s*[:.]?\s*([A-Za-z0-9\-_* ]{5,60})/i,
    /(?:mã\s+kiểm\s+tra|mã\s+truy\s+cập)\s*(?:\([^)]*\))?\s*[:.]?\s*([A-Za-z0-9\-_* ]{5,60})/i,
  ];

  for (const regex of labelPatterns) {
    const match = text.match(regex);
    if (match && match[1]) {
      let rawCandidate = match[1].trim();
      // Handle kerning/spaced single characters: "J Y R E 6 7 V G 1 2 E T M 8 0 P D B R Y"
      if (rawCandidate.includes(' ')) {
        const tokens = rawCandidate.split(/\s+/);
        if (tokens.every((t) => t.length <= 2)) {
          rawCandidate = rawCandidate.replace(/\s+/g, '');
        } else {
          rawCandidate = tokens[0];
        }
      }
      if (rawCandidate.length >= 5) {
        return sanitizeLookupCode(rawCandidate);
      }
    }
  }

  // 3. Multi-line split label: Label is on line N, code is on line N+1
  const lines = text.split('\n').map((l) => l.trim());
  for (let i = 0; i < lines.length - 1; i++) {
    const line = lines[i].toLowerCase();
    if (
      line.includes('mã tra cứu') ||
      line.includes('mã nhận hóa đơn') ||
      line.includes('mã số bí mật') ||
      line.includes('access code') ||
      line.includes('invoice code')
    ) {
      const nextLine = lines[i + 1].trim();
      const codeCandidate = nextLine.match(/^([A-Za-z0-9\-_* ]{5,60})$/);
      if (codeCandidate) {
        let rawCode = codeCandidate[1];
        if (rawCode.includes(' ')) {
          const tokens = rawCode.split(/\s+/);
          if (tokens.every((t) => t.length <= 2)) {
            rawCode = rawCode.replace(/\s+/g, '');
          } else {
            rawCode = tokens[0];
          }
        }
        if (rawCode.length >= 5) {
          return sanitizeLookupCode(rawCode);
        }
      }
    }
  }

  return '';
}

/**
  * Extracts standard TT78/TT91 metadata fields from PDF invoice text
  * @param {string} text
  * @returns {Object}
  */
export function extractInvoiceMetadataFromText(text) {
  const fields = extractInvoiceFields(text);
  const symbol = fields.symbol?.raw || fields.symbol?.symbol || '';
  let invoiceNumber = fields.invoiceNo ? String(fields.invoiceNo).padStart(8, '0') : '';

  // Fallback for bilingual invoice numbers like "Số (No.) : 73293447" or "Số / No : 00123456"
  if (!invoiceNumber && text) {
    const noMatch = text.match(/(?:Số|Invoice\s*No|Số\s*HĐ)\s*(?:\([^)]*\)|\/[^:]*)?\s*[:.]?\s*(\d{1,8})\b/i);
    if (noMatch && noMatch[1]) {
      invoiceNumber = String(noMatch[1]).padStart(8, '0');
    }
  }

  const invoiceDate = fields.date || '';
  const sellerName = fields.seller || '';
  let sellerTaxCode = fields.sellerTax || '';

  // Fallback for seller tax code if fields.sellerTax is empty or missed
  if (!sellerTaxCode && text) {
    // 1. Search for tax code after "Đơn vị bán hàng", "Người bán", "Seller"
    const sellerBlockMatch = text.match(/(?:Đơn\s+vị\s+bán\s+hàng|Người\s+bán\s+hàng|Đơn\s+vị\s+bán|Seller)[\s\S]{1,400}?(?:Mã\s+số\s+thuế|MST|Tax\s*code)\s*(?:\([^)]*\))?\s*[:.]?\s*([0-9\s-]{10,24})/i);
    if (sellerBlockMatch && sellerBlockMatch[1]) {
      sellerTaxCode = normalizeTaxCode(sellerBlockMatch[1]);
    }
  }

  // 2. Direct tax code match if still empty
  if (!sellerTaxCode && text) {
    const directTaxMatch = text.match(/(?:Mã\s+số\s+thuế|MST|Tax\s*code)\s*(?:\([^)]*\))?\s*[:.]?\s*([0-9\s-]{10,24})/i);
    if (directTaxMatch && directTaxMatch[1]) {
      sellerTaxCode = normalizeTaxCode(directTaxMatch[1]);
    }
  }

  let buyerName = fields.buyer || '';
  if (buyerName) {
    buyerName = buyerName.replace(/^(?:Tên\s+đơn\s+vị|Đơn\s+vị|Công\s+ty)\s*(?:\([^)]*\))?\s*[:.]?\s*/i, '').trim();
  }
  const totalAmount = fields.totalAmount || 0;
  return {
    symbol,
    invoiceSymbol: symbol,
    invoiceNumber,
    invoiceDate,
    sellerName,
    sellerTaxCode,
    buyerName,
    totalAmount,
  };
}

/**
 * High-level invoice PDF parsing pipeline
 * Takes PDF ArrayBuffer or rawText, returns normalized invoice object
 *
 * @param {Object} params
 * @param {ArrayBuffer} [params.arrayBuffer]
 * @param {string} [params.rawText]
 * @param {string} [params.fileName='invoice.pdf']
 * @param {number} [params.fileSize=0]
 * @returns {Promise<Object>}
 */
export async function parsePdfInvoiceDocument({ arrayBuffer, rawText, fileName = 'invoice.pdf', fileSize = 0 }) {
  let text = rawText || '';

  if (!text && arrayBuffer) {
    try {
      text = await extractTextFromPdfBuffer(arrayBuffer);
    } catch (err) {
      return {
        id: crypto.randomUUID(),
        fileName,
        fileSize,
        isScan: false,
        status: STATUS_TYPES.ERROR,
        statusMessage: `Không đọc được tệp PDF: ${err.message || 'Lỗi phân tích cú pháp'}`,
        rawText: '',
      };
    }
  }

  const trimmedText = text.trim();

  // Detect scanned PDF (no text layer)
  if (trimmedText.length < 20) {
    return {
      id: crypto.randomUUID(),
      fileName,
      fileSize,
      isScan: true,
      status: STATUS_TYPES.UNSUPPORTED,
      statusMessage: 'PDF này có thể là file scan. Phiên bản hiện tại chưa hỗ trợ OCR.',
      rawText: text,
      providerId: 'generic',
      providerName: 'Bản scan / Không rõ',
      lookupUrl: '',
      lookupCode: '',
      sellerName: '',
      sellerTaxCode: '',
      invoiceSymbol: '',
      invoiceNumber: '',
      invoiceDate: '',
      buyerName: '',
      totalAmount: 0,
      xmlContent: null,
      xmlFilename: buildStandardXmlFilename({ fallbackName: fileName }),
    };
  }

  // 1. Extract Candidate URLs
  const candidateUrls = extractCandidateUrls(text);
  const primaryUrl = candidateUrls[0] || '';

  // 2. Detect Provider
  const provider = detectProvider(primaryUrl, text);

  // 3. Extract Lookup Code
  const lookupCode = extractCandidateLookupCode(text, provider);

  // 4. Extract Standard Invoice Fields (TT78/TT91)
  const metadata = extractInvoiceMetadataFromText(text);
  const symbol = metadata.invoiceSymbol;
  const invoiceNumber = metadata.invoiceNumber;
  const invoiceDate = metadata.invoiceDate;
  const sellerName = metadata.sellerName;
  const sellerTaxCode = metadata.sellerTaxCode;
  const buyerName = metadata.buyerName;
  const totalAmount = metadata.totalAmount;

  // 5. Build standardized portal URL
  const lookupUrl = provider.buildLookupUrl(primaryUrl, lookupCode, {
    sellerTaxCode,
    invoiceNumber,
    symbol,
  });

  // 6. Compute Initial Status
  let status = provider.getInitialStatus({ url: lookupUrl, code: lookupCode, hasDirectDownload: false });
  let statusMessage = '';

  if (status === STATUS_TYPES.CAPTCHA_REQUIRED) {
    statusMessage = 'Cần xác thực trên website phát hành hóa đơn';
  } else if (status === STATUS_TYPES.MANUAL_REQUIRED) {
    statusMessage = 'Cần mở website phát hành hóa đơn để tra cứu';
  } else if (status === STATUS_TYPES.UNSUPPORTED) {
    statusMessage = 'Không tìm thấy thông tin đường dẫn hoặc mã tra cứu trong PDF';
  }

  const standardFilename = buildStandardXmlFilename({
    issueDate: invoiceDate,
    taxCode: sellerTaxCode,
    symbol,
    invoiceNumber,
    fallbackName: fileName,
  });

  return {
    id: crypto.randomUUID(),
    fileName,
    fileSize,
    isScan: false,
    providerId: provider.id,
    providerName: provider.name,
    lookupUrl,
    lookupCode,
    sellerName,
    sellerTaxCode,
    invoiceSymbol: symbol,
    invoiceNumber,
    invoiceDate,
    buyerName,
    totalAmount,
    status,
    statusMessage,
    xmlContent: null,
    xmlBlob: null,
    xmlFilename: standardFilename,
    rawText: text,
    candidateUrls,
  };
}
