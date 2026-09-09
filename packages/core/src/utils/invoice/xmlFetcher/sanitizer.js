/**
 * Utilities for cleaning, normalizing, and formatting URLs, lookup codes, and file names.
 */

/**
 * Normalizes and cleans lookup URLs extracted from PDF text.
 * Handles wrapped lines, trailing punctuation, and missing protocols.
 * @param {string} rawUrl
 * @returns {string}
 */
export function sanitizeLookupUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return '';

  let cleaned = rawUrl.trim();

  // Remove internal linebreaks and surrounding whitespace often caused by PDF layout
  cleaned = cleaned.replace(/[\r\n]+/g, '').replace(/\s+/g, '');

  // Strip trailing punctuation often found at the end of sentences in PDF footers
  cleaned = cleaned.replace(/[.,;:()\]'"<>]+$/, '');

  // Strip leading punctuation or noise
  cleaned = cleaned.replace(/^[.,;:([{\'"<>]+/, '');

  // If missing protocol, add https://
  if (/^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/.test(cleaned)) {
    cleaned = `https://${cleaned}`;
  }

  try {
    const parsed = new URL(cleaned);
    // Ensure valid HTTP/HTTPS protocol
    if (!['http:', 'https:'].includes(parsed.protocol)) return '';
    return parsed.href;
  } catch {
    return '';
  }
}

/**
 * Normalizes lookup code by removing noise characters, surrounding colons, or quotes.
 * @param {string} rawCode
 * @returns {string}
 */
export function sanitizeLookupCode(rawCode) {
  if (!rawCode || typeof rawCode !== 'string') return '';

  let code = rawCode.trim();

  // Remove leading/trailing colons, dashes, quotes, brackets (NEVER strip asterisk *)
  code = code.replace(/^[:\-\s'"`()\[\]]+/, '').replace(/[:\-\s'"`()\[\]]+$/, '');

  // Strip trailing sentence period or comma if present (e.g. "ABC123*." -> "ABC123*")
  code = code.replace(/[.,;]+$/, '');

  // Remove internal line breaks
  code = code.replace(/[\r\n\t]+/g, '');

  return code;
}

/**
 * Standardizes XML filename following the pattern:
 * YYYY-MM-DD_MST_SYMBOL_INVOICE-NUMBER.xml
 * Example: 2026-08-14_1700166450_C26TQA_00000807.xml
 *
 * @param {Object} params
 * @param {string} [params.issueDate] - ISO date or string YYYY-MM-DD
 * @param {string} [params.taxCode] - Seller tax code
 * @param {string} [params.symbol] - Invoice symbol
 * @param {string|number} [params.invoiceNumber] - Invoice number
 * @param {string} [params.fallbackName] - Base name if fields are missing
 * @returns {string}
 */
export function buildStandardXmlFilename(params = {}) {
  const issueDate = params.issueDate || params.invoiceDate;
  const taxCode = params.taxCode || params.sellerTaxCode;
  const symbol = params.symbol || params.invoiceSymbol;
  const invoiceNumber = params.invoiceNumber;
  const fallbackName = params.fallbackName;

  // Normalize date to YYYY-MM-DD
  let datePart = '0000-00-00';
  if (issueDate) {
    const dateMatch = String(issueDate).match(/(\d{4})[-/.](\d{2})[-/.](\d{2})/);
    if (dateMatch) {
      datePart = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
    } else {
      const dmyMatch = String(issueDate).match(/(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
      if (dmyMatch) {
        const dd = dmyMatch[1].padStart(2, '0');
        const mm = dmyMatch[2].padStart(2, '0');
        const yyyy = dmyMatch[3];
        datePart = `${yyyy}-${mm}-${dd}`;
      }
    }
  }

  const mstPart = taxCode ? String(taxCode).replace(/[^0-9-]/g, '') : 'NOMST';
  const symbolPart = symbol ? String(symbol).replace(/[^A-Za-z0-9]/g, '').toUpperCase() : 'NOSYMBOL';
  
  let numberPart = '00000000';
  if (invoiceNumber !== undefined && invoiceNumber !== null && invoiceNumber !== '') {
    const numStr = String(invoiceNumber).trim();
    numberPart = /^\d+$/.test(numStr) ? numStr.padStart(8, '0') : numStr.replace(/[^A-Za-z0-9]/g, '');
  }

  // If key parts are missing, fall back to sanitized original filename
  if (mstPart === 'NOMST' && symbolPart === 'NOSYMBOL' && numberPart === '00000000' && fallbackName) {
    const cleanFallback = String(fallbackName)
      .replace(/\.(pdf|xml)$/i, '')
      .replace(/[/\\?%*:|"<>]/g, '_');
    return `${cleanFallback}.xml`;
  }

  const rawFilename = `${datePart}_${mstPart}_${symbolPart}_${numberPart}.xml`;
  return rawFilename.replace(/[/\\?%*:|"<>]/g, '_');
}
