export const INVOICE_LIMITS = Object.freeze({
  maxFiles: 200,
  maxFileBytes: 20 * 1024 * 1024,
  // Một thư mục nén cả tháng nặng hơn hẳn một hóa đơn lẻ nên có ngưỡng riêng.
  maxZipBytes: 200 * 1024 * 1024,
  maxPdfPages: 100,
  maxZipEntries: 500,
  maxZipUncompressedBytes: 400 * 1024 * 1024,
  // Hóa đơn hay được gửi dưới dạng zip lồng zip (mỗi nhà cung cấp một thư mục
  // nén); mở lồng nhau có giới hạn để không sập vì zip bomb.
  maxZipDepth: 4,
  maxDocuments: 2000,
});

export function isKnownInvoiceNumber(value) {
  return Boolean(value) && !['N/A', 'Chưa rõ số', 'Lỗi đọc'].includes(value);
}

export function isUnsafeZipPath(name) {
  const normalized = String(name).replace(/\\/g, '/');
  return normalized.startsWith('/') || normalized.split('/').includes('..');
}

/**
 * Khóa nhận dạng một hóa đơn để khử trùng lặp.
 *
 * Số hóa đơn chỉ duy nhất trong phạm vi một người bán và một ký hiệu, nên khóa
 * phải gồm cả mã số thuế người bán — nếu chỉ so số hóa đơn thì hai hóa đơn thật
 * của hai nhà cung cấp khác nhau sẽ bị coi là trùng và biến mất khỏi bảng.
 *
 * Chứng từ không đọc được số hóa đơn thì định danh theo nguồn tệp, kèm tên thư
 * mục nén để hai file trùng tên trong hai ZIP khác nhau không bị gộp làm một.
 */
export function invoiceIdentityKey(invoice) {
  if (isKnownInvoiceNumber(invoice?.invoiceNo)) {
    return [
      'hd',
      String(invoice.sellerTax ?? '').trim(),
      String(invoice.invoiceSymbol ?? '').trim().toUpperCase(),
      String(invoice.invoiceNo).trim().toUpperCase(),
      Number(invoice.totalAmount) || 0,
    ].join('|');
  }

  return [
    'tep',
    String(invoice?.zipName ?? '').trim(),
    String(invoice?.rawFileName ?? invoice?.fileName ?? '').trim(),
    Number(invoice?.totalAmount) || 0,
  ].join('|');
}

/**
 * Bản thể hiện PDF và file XML của cùng một hóa đơn phải khớp cả người bán lẫn
 * số tiền mới được coi là một. Khi PDF không đọc được mã số thuế thì chỉ đối
 * chiếu số hóa đơn và số tiền, chứ không mặc định là trùng.
 */
export function isSameInvoiceDocument(left, right) {
  if (!isKnownInvoiceNumber(left?.invoiceNo) || !isKnownInvoiceNumber(right?.invoiceNo)) return false;
  if (String(left.invoiceNo).trim().toUpperCase() !== String(right.invoiceNo).trim().toUpperCase()) return false;
  if ((Number(left.totalAmount) || 0) !== (Number(right.totalAmount) || 0)) return false;

  const leftTax = String(left.sellerTax ?? '').trim();
  const rightTax = String(right.sellerTax ?? '').trim();
  if (leftTax && rightTax && leftTax !== rightTax) return false;

  return true;
}

/**
 * Một tệp có phải bản thể hiện hóa đơn hay không.
 *
 * Số hóa đơn và mã số thuế người bán đều là tiêu thức bắt buộc (Phụ lục V
 * Thông tư 91/2026/TT-BTC), nên tệp không có cả hai thì không phải hóa đơn:
 * thường là lịch trình bay, thẻ lên tàu hay bản sao đính kèm trong cùng thư mục
 * nén. Xếp riêng những tệp này để bảng hóa đơn không bị lặp bởi các bản đính
 * kèm của cùng một chuyến đi.
 */
export function isInvoiceDocument(document) {
  if (!document) return false;
  if (document.forcedAsInvoice) return true;
  if (document.missingFields?.includes('readError')) return false;
  return isKnownInvoiceNumber(document.invoiceNo)
    || Boolean(String(document.sellerTax ?? '').trim());
}

/**
 * Gộp mẻ chứng từ vừa đọc vào danh sách đang có.
 *
 * Trả về cả số dòng thực sự thêm mới để báo lại cho người dùng biết mẻ vừa nạp
 * đã vào được bao nhiêu chứng từ.
 */
export function mergeInvoiceBatch(existing, incoming) {
  const kept = [...existing];
  const seen = new Set(kept.map(invoiceIdentityKey));
  let added = 0;

  for (const item of incoming) {
    // Bản thể hiện PDF bị bỏ khi đã có file XML của đúng hóa đơn đó.
    if (item.rawType === 'PDF'
      && kept.some((other) => other.rawType === 'XML' && isSameInvoiceDocument(other, item))) {
      continue;
    }

    const key = invoiceIdentityKey(item);
    if (seen.has(key)) continue;
    seen.add(key);
    kept.push(item);
    added += 1;
  }

  // File XML đọc sau vẫn phải thay được bản thể hiện PDF đã nạp trước đó.
  const invoices = kept.filter((item) => !(
    item.rawType === 'PDF'
    && kept.some((other) => other.rawType === 'XML' && isSameInvoiceDocument(other, item))
  ));

  return { invoices, added };
}

/**
 * `authorityCollection` là khoản thu hộ nhà chức trách trên hóa đơn hàng không
 * (phí sân bay, phí soi chiếu). Khoản này không chịu thuế GTGT nhưng vẫn nằm
 * trong số tiền khách phải trả, nên khi phải tự cộng ra tổng thanh toán thì
 * thiếu nó là thiếu tiền thật.
 */
export function deriveInvoiceAmounts({
  totalAmount = 0,
  amountBeforeTax = 0,
  vatAmount = 0,
  authorityCollection = 0,
}) {
  let total = Number(totalAmount) || 0;
  let beforeTax = Number(amountBeforeTax) || 0;
  let vat = Number(vatAmount) || 0;
  const authority = Number(authorityCollection) || 0;

  if (!total && beforeTax && vat) total = beforeTax + vat + authority;
  if (total && beforeTax && !vat && total >= beforeTax + authority) vat = total - beforeTax - authority;

  return { totalAmount: total, amountBeforeTax: beforeTax, vatAmount: vat, authorityCollection: authority };
}
