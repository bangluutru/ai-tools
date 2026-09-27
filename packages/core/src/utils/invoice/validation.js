/** Sai lệch làm tròn chấp nhận được giữa các cột tiền trên hóa đơn. */
const ROUNDING_TOLERANCE = 1;

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
 * Tên tệp gốc bỏ đuôi, kèm thư mục nén và đường dẫn bên trong ZIP. Hai tệp chỉ
 * được coi là cặp XML/PDF khi nằm cùng chỗ: "thang6/hd1.xml" và "thang7/hd1.pdf"
 * trong cùng một ZIP là hai hóa đơn khác nhau.
 */
function getPairingName(item) {
  const path = String(item?.entryPath || item?.rawFileName || item?.fileName || '').trim().replace(/\\/g, '/');
  const base = path.replace(/\.(xml|pdf|zip)$/i, '').toLowerCase();
  if (!base) return '';
  return `${String(item?.zipName ?? '').trim().toLowerCase()}::${base}`;
}

/** So số hóa đơn không phụ thuộc số 0 đứng đầu: XML ghi "123", PDF in "00000123". */
function sameInvoiceNumber(left, right) {
  const clean = (value) => String(value).trim().toUpperCase().replace(/^0+(?=\d)/, '');
  return clean(left) === clean(right);
}

const cleanTax = (value) => String(value ?? '').replace(/[^0-9]/g, '');

/**
 * Bản thể hiện PDF và file XML của cùng một hóa đơn được coi là trùng khi:
 * 1. Cùng tên tệp gốc ở cùng vị trí (ví dụ: hoa_don_1.xml và hoa_don_1.pdf) VÀ
 *    ít nhất một trong số hóa đơn / MST người bán / tổng tiền khớp nhau, không
 *    tiêu thức nào mâu thuẫn. Chỉ trùng tên thì chưa đủ: nhiều phần mềm đặt tên
 *    tệp theo ngày hoặc theo số thứ tự nên hai hóa đơn khác nhau vẫn trùng tên.
 * 2. Hoặc khớp số hóa đơn + số tiền + mã số thuế người bán.
 * 3. Hoặc cùng ngày + cùng số tiền + cùng người bán/MST khi PDF không bóc tách được số hóa đơn.
 */
export function isSameInvoiceDocument(left, right) {
  if (!left || !right) return false;

  const bothNumbers = isKnownInvoiceNumber(left?.invoiceNo) && isKnownInvoiceNumber(right?.invoiceNo);
  const numberAgrees = bothNumbers && sameInvoiceNumber(left.invoiceNo, right.invoiceNo);
  const numberConflicts = bothNumbers && !numberAgrees;

  const leftTax = cleanTax(left.sellerTax);
  const rightTax = cleanTax(right.sellerTax);
  const taxAgrees = Boolean(leftTax && rightTax && leftTax === rightTax);
  const taxConflicts = Boolean(leftTax && rightTax && leftTax !== rightTax);

  const leftAmount = Number(left.totalAmount) || 0;
  const rightAmount = Number(right.totalAmount) || 0;
  const totalAgrees = leftAmount !== 0 && leftAmount === rightAmount;
  const totalConflicts = leftAmount !== 0 && rightAmount !== 0 && leftAmount !== rightAmount;

  if (numberConflicts || taxConflicts) return false;

  // 1. Trùng tên tệp gốc (chỉ khác đuôi .xml và .pdf) và có tiêu thức xác nhận.
  const leftName = getPairingName(left);
  const rightName = getPairingName(right);
  if (leftName && rightName && leftName === rightName) {
    if ((numberAgrees || taxAgrees || totalAgrees) && !(totalConflicts && !numberAgrees)) return true;
  }

  // 2. Cả hai đọc được số hóa đơn
  if (bothNumbers) {
    return numberAgrees && leftAmount === rightAmount;
  }

  // 3. Khớp theo ngày + số tiền + người bán khi PDF chưa rõ số hóa đơn
  if (totalAgrees) {
    const leftDate = String(left.date ?? '').trim();
    const rightDate = String(right.date ?? '').trim();
    if (leftDate && rightDate && leftDate !== '-' && leftDate === rightDate && taxAgrees) return true;
  }

  return false;
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

  // Đếm theo kết quả cuối: PDF nạp trước rồi bị XML cùng mẻ thay thế thì không tính là thêm mới.
  const incomingSet = new Set(incoming);
  const finalAdded = invoices.filter((item) => incomingSet.has(item)).length;

  return { invoices: linkRelatedInvoices(invoices), added: Math.min(added, finalAdded) };
}

export const REPLACED_WARNING_PREFIX = 'Hóa đơn này đã bị thay thế';

const normalizeSymbol = (value) => String(value ?? '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();

/** Hai ký hiệu khớp khi giống hệt, hoặc một bên thiếu mẫu số đứng đầu (1C26TAA / C26TAA). */
function sameSymbol(left, right) {
  const a = normalizeSymbol(left);
  const b = normalizeSymbol(right);
  if (!a || !b) return true;
  return a === b || a.endsWith(b) || b.endsWith(a);
}

/**
 * Nối hóa đơn thay thế / điều chỉnh (TT78: TTChung > TTHDLQuan, TCHDon = 1
 * thay thế, 2 điều chỉnh) với hóa đơn gốc có trong cùng danh sách.
 *
 * - Hóa đơn gốc đã bị thay thế thì không còn giá trị: bỏ chọn và cảnh báo để
 *   không cộng hai lần số tiền của cùng một giao dịch.
 * - Hóa đơn điều chỉnh là phần chênh cộng/trừ vào hóa đơn gốc: giữ cả hai
 *   nhưng đánh dấu cần kiểm tra để người dùng thấy mối liên hệ.
 *
 * Hàm không đổi các dòng không liên quan và gọi lại nhiều lần không nhân đôi cảnh báo.
 */
export function linkRelatedInvoices(invoices) {
  const related = invoices.filter((item) => item?.relation?.invoiceNo);
  if (related.length === 0) return invoices;

  const updates = new Map();
  for (const child of related) {
    const { relation } = child;
    const original = invoices.find((item) => item !== child
      && isKnownInvoiceNumber(item.invoiceNo)
      && sameInvoiceNumber(item.invoiceNo, relation.invoiceNo)
      && sameSymbol(item.invoiceSymbol, relation.symbol)
      && (!child.sellerTax || !item.sellerTax || cleanTax(child.sellerTax) === cleanTax(item.sellerTax)));
    if (!original) continue;

    const label = `${relation.symbol ? `${relation.symbol} ` : ''}số ${relation.invoiceNo}`;
    const childLabel = `${child.invoiceSymbol ? `${child.invoiceSymbol} ` : ''}số ${child.invoiceNo}`;

    if (relation.kind === 'replacement') {
      const current = updates.get(original.id) ?? original;
      const message = `${REPLACED_WARNING_PREFIX} bởi hóa đơn ${childLabel}; đã bỏ chọn để không tính trùng.`;
      if (!(current.warnings ?? []).includes(message)) {
        updates.set(original.id, {
          ...current,
          replacedBy: child.id,
          isConfirmed: false,
          needsReview: true,
          status: 'Cần kiểm tra',
          warnings: [...(current.warnings ?? []), message],
        });
      }
    }

    const childCurrent = updates.get(child.id) ?? child;
    const childMessage = relation.kind === 'replacement'
      ? `Hóa đơn thay thế cho hóa đơn ${label} (đã có trong danh sách).`
      : `Hóa đơn điều chỉnh cho hóa đơn ${label} (đã có trong danh sách); số tiền là phần chênh so với hóa đơn gốc.`;
    if (!(childCurrent.warnings ?? []).includes(childMessage)) {
      updates.set(child.id, {
        ...childCurrent,
        relatedTo: original.id,
        needsReview: true,
        status: 'Cần kiểm tra',
        warnings: [...(childCurrent.warnings ?? []), childMessage],
      });
    }
  }

  if (updates.size === 0) return invoices;
  return invoices.map((item) => updates.get(item.id) ?? item);
}

/** Các mức thuế suất GTGT hiện hành (kể cả mức giảm 8% theo Nghị quyết). */
export const VAT_RATES = Object.freeze([0, 5, 8, 10]);

/** Sai số khi đối chiếu tiền thuế suy ra với chưa thuế × thuế suất. */
function vatTolerance(expected) {
  return Math.max(2, Math.abs(expected) * 0.005);
}

/**
 * Thuế suất mà `vat` khớp với `beforeTax`, hoặc null nếu không mức nào khớp.
 * Hóa đơn nhiều dòng làm tròn tiền thuế theo từng dòng nên cho phép lệch vài
 * đồng hoặc 0,5%.
 */
export function matchingVatRate(beforeTax, vat) {
  const base = Number(beforeTax) || 0;
  const tax = Number(vat) || 0;
  if (!base) return null;
  if (tax !== 0 && Math.sign(tax) !== Math.sign(base)) return null;
  for (const rate of VAT_RATES) {
    const expected = (base * rate) / 100;
    if (Math.abs(tax - expected) <= vatTolerance(expected)) return rate;
  }
  return null;
}

/**
 * `authorityCollection` là khoản thu hộ nhà chức trách trên hóa đơn hàng không
 * (phí sân bay, phí soi chiếu). Khoản này không chịu thuế GTGT nhưng vẫn nằm
 * trong số tiền khách phải trả, nên khi phải tự cộng ra tổng thanh toán thì
 * thiếu nó là thiếu tiền thật.
 *
 * Số âm (hóa đơn điều chỉnh giảm) được giữ nguyên dấu; mọi phép suy luận so
 * sánh theo độ lớn cùng dấu.
 *
 * Kết quả có thêm `vatAmountDerived` (tiền thuế do tự trừ ra) và `warnings`
 * (câu cảnh báo khi phần chênh không khớp mức thuế suất nào nên bị bỏ trống).
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
  let authority = Number(authorityCollection) || 0;
  let authorityDerived = false;
  let vatDerived = false;
  const warnings = [];

  if (!total && beforeTax && vat) total = beforeTax + vat + authority;

  if (total && beforeTax && !vat) {
    const residual = total - beforeTax - authority;
    const sameSign = residual === 0 || Math.sign(residual) === Math.sign(beforeTax);
    // Phần chênh chỉ là tiền thuế khi nó đúng bằng chưa thuế × một mức thuế
    // suất. Hóa đơn hàng không có khoản thu hộ chưa đọc được sẽ làm phần chênh
    // phình ra (ví dụ 486.364 thay vì 236.364) — khi đó để trống và cảnh báo.
    if (sameSign && residual !== 0 && matchingVatRate(beforeTax, residual) !== null) {
      vat = residual;
      vatDerived = true;
    } else if (residual !== 0) {
      warnings.push(
        `Không đọc được tiền thuế GTGT; phần chênh giữa tổng thanh toán và tiền chưa thuế (${residual}) không khớp mức thuế suất 0/5/8/10% nên chưa ghi nhận, cần nhập tay theo chứng từ gốc.`,
      );
    }
  }

  // Không phần mềm phát hành nào đặt tên trường giống nhau, nên khi không đọc
  // được khoản thu hộ mà hóa đơn vẫn ghi rõ cả ba cột tiền thì phần dôi ra
  // chính là khoản không chịu thuế GTGT đã nằm sẵn trong tổng thanh toán. Tổng
  // thanh toán là con số đọc thẳng từ chứng từ nên phần dôi này là số thật, ghi
  // nhận đúng nó vẫn hơn là báo lệch một hóa đơn hợp lệ.
  if (!authority && !vatDerived && total && beforeTax && vat) {
    const residual = total - beforeTax - vat;
    // Thu hộ là khoản phụ thu cùng dấu với tiền hàng; lớn hơn cả tiền hàng thì
    // đó là đọc sai, giữ nguyên cảnh báo thay vì lấp liếm.
    if (Math.sign(residual) === Math.sign(beforeTax)
      && Math.abs(residual) > ROUNDING_TOLERANCE && Math.abs(residual) < Math.abs(beforeTax)) {
      authority = residual;
      authorityDerived = true;
    }
  }

  return {
    totalAmount: total,
    amountBeforeTax: beforeTax,
    vatAmount: vat,
    authorityCollection: authority,
    authorityCollectionDerived: authorityDerived,
    vatAmountDerived: vatDerived,
    warnings,
  };
}
