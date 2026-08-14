export const INVOICE_LIMITS = Object.freeze({
  maxFiles: 50,
  maxFileBytes: 20 * 1024 * 1024,
  maxZipEntries: 100,
  maxZipUncompressedBytes: 100 * 1024 * 1024,
});

export function isKnownInvoiceNumber(value) {
  return Boolean(value) && !['N/A', 'Chưa rõ số', 'Lỗi đọc'].includes(value);
}

export function isUnsafeZipPath(name) {
  const normalized = String(name).replace(/\\/g, '/');
  return normalized.startsWith('/') || normalized.split('/').includes('..');
}

export function deriveInvoiceAmounts({ totalAmount = 0, amountBeforeTax = 0, vatAmount = 0 }) {
  let total = Number(totalAmount) || 0;
  let beforeTax = Number(amountBeforeTax) || 0;
  let vat = Number(vatAmount) || 0;

  if (!total && beforeTax && vat) total = beforeTax + vat;
  if (total && beforeTax && !vat && total >= beforeTax) vat = total - beforeTax;

  return { totalAmount: total, amountBeforeTax: beforeTax, vatAmount: vat };
}
