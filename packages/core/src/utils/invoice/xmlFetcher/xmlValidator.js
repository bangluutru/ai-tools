/**
 * XML Validation and Mismatch Detection for E-Invoices
 */

/**
 * Validates whether a text string is a genuine, valid electronic invoice XML document.
 * Detects HTML masquerading, parser errors, and extracts core metadata.
 *
 * @param {string} xmlText
 * @param {Object} [pdfMetadata] - Expected metadata from PDF to cross-check
 * @param {string} [pdfMetadata.taxCode]
 * @param {string} [pdfMetadata.symbol]
 * @param {string|number} [pdfMetadata.invoiceNumber]
 * @returns {{
 *   isValid: boolean,
 *   reason?: string,
 *   parsedMetadata?: { taxCode?: string, symbol?: string, invoiceNumber?: string },
 *   hasMismatch?: boolean,
 *   mismatchDetails?: string[]
 * }}
 */
export function validateInvoiceXml(xmlText, pdfMetadata = null) {
  if (!xmlText || typeof xmlText !== 'string') {
    return { isValid: false, reason: 'Nội dung XML rỗng hoặc không phải chuỗi' };
  }

  const trimmed = xmlText.trim();

  // 1. Check for HTML masquerading as XML (e.g. error page, captcha page, login page)
  if (/^<!DOCTYPE\s+html/i.test(trimmed) || /<html[\s>]/i.test(trimmed)) {
    return {
      isValid: false,
      reason: 'Phản hồi từ website là trang HTML (đăng nhập hoặc mã xác thực), không phải tệp XML hóa đơn',
    };
  }

  // 2. Parse XML
  let doc;
  if (typeof DOMParser !== 'undefined') {
    const parser = new DOMParser();
    doc = parser.parseFromString(trimmed, 'application/xml');
    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      return {
        isValid: false,
        reason: `Cấu trúc XML không hợp lệ: ${parserError.textContent.slice(0, 100)}`,
      };
    }
  } else {
    // Node.js test environment fallback
    if (!trimmed.startsWith('<?xml') && !trimmed.startsWith('<')) {
      return { isValid: false, reason: 'Tệp không bắt đầu bằng thẻ XML hợp lệ' };
    }
    // Basic tag balancing check in Node.js
    const rootMatch = trimmed.match(/<([a-zA-Z0-9_:-]+)[\s>]/);
    if (!rootMatch) {
      return { isValid: false, reason: 'Không tìm thấy thẻ gốc XML' };
    }
  }

  // 3. Extract core invoice fields from XML (supports Circular 78 & Circular 91 standard schemas)
  // Tags commonly found in VN e-invoices:
  // - Seller tax code: <MST>, <NBan><MST>, <Seller><TaxCode>, <SellerTaxCode>
  // - Symbol: <KHieu>, <KHMSHDon>, <InvoiceSeries>, <Serial>
  // - Number: <SHDon>, <InvoiceNumber>, <Number>
  const parsedMetadata = extractMetadataFromXmlString(trimmed);

  // 4. Cross-check with PDF metadata if available
  const mismatchDetails = [];
  let hasMismatch = false;

  if (pdfMetadata) {
    // Check Tax code
    if (pdfMetadata.taxCode && parsedMetadata.taxCode) {
      const cleanPdfTax = String(pdfMetadata.taxCode).replace(/[^0-9]/g, '');
      const cleanXmlTax = String(parsedMetadata.taxCode).replace(/[^0-9]/g, '');
      if (cleanPdfTax && cleanXmlTax && cleanPdfTax !== cleanXmlTax) {
        hasMismatch = true;
        mismatchDetails.push(
          `Mã số thuế người bán không khớp (PDF: ${pdfMetadata.taxCode}, XML: ${parsedMetadata.taxCode})`
        );
      }
    }

    // Check Invoice Number
    if (pdfMetadata.invoiceNumber && parsedMetadata.invoiceNumber) {
      const cleanPdfNum = parseInt(String(pdfMetadata.invoiceNumber).replace(/\D/g, ''), 10);
      const cleanXmlNum = parseInt(String(parsedMetadata.invoiceNumber).replace(/\D/g, ''), 10);
      if (!isNaN(cleanPdfNum) && !isNaN(cleanXmlNum) && cleanPdfNum !== cleanXmlNum) {
        hasMismatch = true;
        mismatchDetails.push(
          `Số hóa đơn không khớp (PDF: ${pdfMetadata.invoiceNumber}, XML: ${parsedMetadata.invoiceNumber})`
        );
      }
    }

    // Check Symbol (ignoring case and whitespace)
    if (pdfMetadata.symbol && parsedMetadata.symbol) {
      const cleanPdfSym = String(pdfMetadata.symbol).replace(/[^A-Za-z0-9]/g, '').toUpperCase();
      const cleanXmlSym = String(parsedMetadata.symbol).replace(/[^A-Za-z0-9]/g, '').toUpperCase();
      if (cleanPdfSym && cleanXmlSym && cleanPdfSym !== cleanXmlSym) {
        // Some systems separate form and symbol e.g. 1 + C26TAA vs C26TAA
        if (!cleanPdfSym.endsWith(cleanXmlSym) && !cleanXmlSym.endsWith(cleanPdfSym)) {
          hasMismatch = true;
          mismatchDetails.push(
            `Ký hiệu hóa đơn không khớp (PDF: ${pdfMetadata.symbol}, XML: ${parsedMetadata.symbol})`
          );
        }
      }
    }
  }

  return {
    isValid: true,
    parsedMetadata,
    hasMismatch,
    mismatchDetails,
  };
}

/**
 * Extracts metadata fields from XML string using fast regex patterns.
 * @param {string} xml
 * @returns {{ taxCode?: string, symbol?: string, invoiceNumber?: string }}
 */
function extractMetadataFromXmlString(xml) {
  const metadata = {};

  // Tax code
  const mstMatch =
    xml.match(/<(?:NBan|Seller)[\s\S]*?<MST>([^<]+)<\/MST>/i) ||
    xml.match(/<MST>([^<]+)<\/MST>/i) ||
    xml.match(/<(?:SellerTaxCode|TaxCode)>([^<]+)<\/(?:SellerTaxCode|TaxCode)>/i);
  if (mstMatch) metadata.taxCode = mstMatch[1].trim();

  // Invoice Symbol
  const symMatch =
    xml.match(/<KHieu>([^<]+)<\/KHieu>/i) ||
    xml.match(/<(?:InvoiceSeries|Serial)>([^<]+)<\/(?:InvoiceSeries|Serial)>/i) ||
    xml.match(/<KHMSHDon>([^<]+)<\/KHMSHDon>/i);
  if (symMatch) metadata.symbol = symMatch[1].trim();

  // Invoice Number
  const numMatch =
    xml.match(/<SHDon>([^<]+)<\/SHDon>/i) ||
    xml.match(/<(?:InvoiceNumber|Number)>([^<]+)<\/(?:InvoiceNumber|Number)>/i) ||
    xml.match(/<SoHDon>([^<]+)<\/SoHDon>/i);
  if (numMatch) metadata.invoiceNumber = numMatch[1].trim();

  return metadata;
}
