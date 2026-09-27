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
        if (
          !cleanPdfSym.endsWith(cleanXmlSym) &&
          !cleanXmlSym.endsWith(cleanPdfSym) &&
          !cleanPdfSym.includes(cleanXmlSym) &&
          !cleanXmlSym.includes(cleanPdfSym)
        ) {
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
 * Sau khi người dùng sửa thông tin một hóa đơn đã có XML: XML đó còn thuộc về
 * hóa đơn này không? Dùng để giữ trạng thái READY (và giữ trong ZIP tải về)
 * khi thông tin mới vẫn khớp XML, thay vì tính lại trạng thái từ đầu.
 *
 * @param {string} xmlContent
 * @param {{ sellerTaxCode?: string, invoiceSymbol?: string, invoiceNumber?: string|number }} metadata
 * @returns {{ stillMatches: boolean, mismatchDetails: string[] }}
 */
export function checkEditedMetadataAgainstXml(xmlContent, metadata = {}) {
  const result = validateInvoiceXml(xmlContent, {
    taxCode: metadata.sellerTaxCode,
    symbol: metadata.invoiceSymbol,
    invoiceNumber: metadata.invoiceNumber,
  });
  if (!result.isValid) {
    return { stillMatches: false, mismatchDetails: [result.reason] };
  }
  return { stillMatches: !result.hasMismatch, mismatchDetails: result.mismatchDetails };
}

/** Tiền tố namespace tùy chọn, ví dụ "inv:" trong <inv:MST>. */
const NS = '(?:[A-Za-z_][\\w.-]*:)?';

/** Nội dung text của thẻ đầu tiên có localName thuộc danh sách, bỏ qua tiền tố namespace. */
function firstTagText(xml, names) {
  for (const name of names) {
    const pattern = new RegExp(`<${NS}${name}(?:\\s[^>]*)?>([^<]*)</${NS}${name}\\s*>`, 'i');
    const match = pattern.exec(xml);
    if (match && match[1].trim()) return match[1].trim();
  }
  return '';
}

/** Nội dung của khối thẻ (ví dụ NBan), hoặc '' nếu không có. */
function blockContent(xml, names) {
  for (const name of names) {
    const pattern = new RegExp(`<${NS}${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${NS}${name}\\s*>`, 'i');
    const match = pattern.exec(xml);
    if (match) return match[1];
  }
  return null;
}

const SELLER_BLOCKS = ['NBan', 'Seller', 'NguoiBan'];
const BUYER_BLOCKS = ['NMua', 'Buyer', 'NguoiMua'];
const TAX_TAGS = ['MST', 'TaxCode', 'MaSoThue'];

/**
 * Extracts metadata fields from an XML string. Tags are matched by local name so
 * namespaced documents (<inv:MST>) are read the same as plain ones. The seller
 * tax code is taken only from the seller block (or from explicit seller tags);
 * it never falls back to the buyer's MST.
 * @param {string} xml
 * @returns {{ taxCode?: string, symbol?: string, invoiceNumber?: string }}
 */
export function extractMetadataFromXmlString(xml) {
  const metadata = {};

  // Tax code
  const sellerBlock = blockContent(xml, SELLER_BLOCKS);
  let taxCode = '';
  if (sellerBlock !== null) {
    taxCode = firstTagText(sellerBlock, TAX_TAGS);
  }
  if (!taxCode) taxCode = firstTagText(xml, ['SellerTaxCode', 'MSTNBan', 'MaSoThueNguoiBan']);
  if (!taxCode && sellerBlock === null) {
    // Không có khối người bán: chỉ dùng MST chung khi đã loại bỏ khối người mua.
    let withoutBuyer = xml;
    for (const name of BUYER_BLOCKS) {
      withoutBuyer = withoutBuyer.replace(
        new RegExp(`<${NS}${name}(?:\\s[^>]*)?>[\\s\\S]*?</${NS}${name}\\s*>`, 'gi'),
        '',
      );
    }
    taxCode = firstTagText(withoutBuyer, TAX_TAGS);
  }
  if (taxCode) metadata.taxCode = taxCode;

  // Invoice Symbol (Circular 78: <KHMSHDon>1</KHMSHDon> + <KHHDon>C26MBB</KHHDon> => 1C26MBB)
  const khms = firstTagText(xml, ['KHMSHDon']);
  const khh = firstTagText(xml, ['KHHDon']);
  const khieu = firstTagText(xml, ['KHieu', 'InvoiceSeries', 'Serial']);

  if (khms && khh) {
    metadata.symbol = `${khms}${khh}`;
  } else if (khieu) {
    metadata.symbol = khieu;
  } else if (khh) {
    metadata.symbol = khh;
  } else if (khms) {
    metadata.symbol = khms;
  }

  // Invoice Number
  const number = firstTagText(xml, ['SHDon', 'InvoiceNumber', 'Number', 'SoHDon']);
  if (number) metadata.invoiceNumber = number;

  return metadata;
}
