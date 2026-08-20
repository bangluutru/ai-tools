/**
 * Bóc tách hóa đơn điện tử Việt Nam từ bản thể hiện dạng text (PDF).
 *
 * Căn cứ Thông tư 91/2026/TT-BTC:
 *  - Điều 4 và Phụ lục I: ký hiệu mẫu số hóa đơn là một chữ số 1-9; ký hiệu hóa
 *    đơn là đúng sáu ký tự C/K + hai chữ số năm + một chữ loại + hai ký tự tự đặt.
 *  - Phụ lục V: các mẫu hiển thị quy định nhãn trường thông tin trên bản thể
 *    hiện ("Ký hiệu", "Số", "Ngày ... tháng ... năm", "Tên người bán", "Mã số
 *    thuế", "Tên người mua", "Tổng tiền chưa có thuế GTGT", "Tiền thuế GTGT",
 *    "Tổng tiền thanh toán", "Số tiền viết bằng chữ").
 *
 * Nhờ vậy việc đọc bám theo nhãn do pháp luật quy định thay vì đoán theo vị trí,
 * và mọi trường thiếu đều được đánh dấu thay vì suy diễn.
 */

import { parseLocalizedNumber } from '../accounting/reconcile.js';
import { parseVietnameseAmountWords } from './amountWords.js';

export const INVOICE_RULE_VERSION = 'tt91-2026-invoice-v1';

/** Phụ lục I mục 1: ký hiệu mẫu hóa đơn phản ánh loại hóa đơn. */
export const INVOICE_FORM_TYPES = Object.freeze({
  1: { code: 'GTGT', name: 'Hóa đơn giá trị gia tăng', expectsVat: true },
  2: { code: 'BH', name: 'Hóa đơn bán hàng', expectsVat: false },
  3: { code: 'BTSC', name: 'Hóa đơn bán tài sản công', expectsVat: false },
  4: { code: 'DTQG', name: 'Hóa đơn bán hàng dự trữ quốc gia', expectsVat: false },
  5: { code: 'KHAC', name: 'Tem, vé, thẻ, phiếu thu điện tử', expectsVat: false },
  6: { code: 'XKNB', name: 'Phiếu xuất kho điện tử', expectsVat: false },
  7: { code: 'TMDT', name: 'Hóa đơn thương mại điện tử', expectsVat: false },
  8: { code: 'GTGT-BL', name: 'Hóa đơn GTGT tích hợp biên lai', expectsVat: true },
  9: { code: 'BH-BL', name: 'Hóa đơn bán hàng tích hợp biên lai', expectsVat: false },
});

/** Phụ lục I mục 2: chữ cái thứ tư của ký hiệu cho biết loại hóa đơn được dùng. */
export const INVOICE_USAGE_TYPES = Object.freeze({
  T: 'Doanh nghiệp, tổ chức đăng ký sử dụng',
  D: 'Bán tài sản công / dự trữ quốc gia / đặc thù',
  L: 'Cơ quan thuế cấp theo từng lần phát sinh',
  M: 'Khởi tạo từ máy tính tiền',
  N: 'Phiếu xuất kho kiêm vận chuyển nội bộ',
  B: 'Phiếu xuất kho hàng gửi bán đại lý',
  G: 'Tem, vé, thẻ điện tử là hóa đơn GTGT',
  H: 'Tem, vé, thẻ điện tử là hóa đơn bán hàng',
  X: 'Hóa đơn thương mại điện tử',
  F: 'Hóa đơn GTGT kiêm tờ khai hoàn thuế',
});

const USAGE_CHARS = Object.keys(INVOICE_USAGE_TYPES).join('');

/**
 * Ký hiệu đầy đủ trên bản thể hiện thường gồm mẫu số dính liền ký hiệu, ví dụ
 * "1C26TAA". Hai ký tự cuối theo quy định là chữ viết, nhưng thực tế nhiều phần
 * mềm phát hành dùng cả chữ số nên chấp nhận cả hai để không bỏ sót hóa đơn thật.
 */
export const INVOICE_SYMBOL_PATTERN = new RegExp(
  `\\b([1-9])?([CK])(\\d{2})([${USAGE_CHARS}])([A-Z0-9]{2})\\b`,
);

/** Mã số thuế Việt Nam: 10 chữ số, đơn vị phụ thuộc thêm 3 chữ số. */
export const TAX_CODE_PATTERN = /\b(\d{10})(?:[-\s]?(\d{3}))?\b/;

/**
 * Bỏ dấu theo từng ký tự để độ dài chuỗi không đổi. Nhờ vậy vị trí tìm được
 * trên chuỗi đã bỏ dấu trỏ đúng vị trí tương ứng trên chuỗi gốc, và giá trị cắt
 * ra vẫn giữ nguyên tiếng Việt có dấu (tên người bán, tên hàng hóa).
 */
export function foldText(value) {
  if (value === null || value === undefined) return '';
  return [...String(value)]
    .map((char) => {
      if (char.length > 1) return char;
      if (char === 'đ') return 'd';
      if (char === 'Đ') return 'D';
      return char.normalize('NFD')[0];
    })
    .join('')
    .toLowerCase();
}

/** Dòng đã gộp khoảng trắng — dùng chung cho cả bản gốc và bản bỏ dấu. */
export function tidyLine(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

export function normalizeText(value) {
  return foldText(tidyLine(value));
}

export function parseInvoiceSymbol(text) {
  const match = INVOICE_SYMBOL_PATTERN.exec(String(text ?? '').toUpperCase());
  if (!match) return null;

  const [raw, formDigit, codeChar, yearDigits, usageChar, custom] = match;
  const form = formDigit ? INVOICE_FORM_TYPES[Number(formDigit)] : null;

  return {
    raw,
    symbol: `${codeChar}${yearDigits}${usageChar}${custom}`,
    formDigit: formDigit ?? '',
    formCode: form?.code ?? '',
    formName: form?.name ?? '',
    expectsVat: form?.expectsVat ?? null,
    hasTaxAuthorityCode: codeChar === 'C',
    year: 2000 + Number(yearDigits),
    usageChar,
    usageName: INVOICE_USAGE_TYPES[usageChar] ?? '',
  };
}

export function normalizeTaxCode(value) {
  const match = TAX_CODE_PATTERN.exec(String(value ?? '').replace(/[.\s]/g, ' '));
  if (!match) return '';
  return match[2] ? `${match[1]}-${match[2]}` : match[1];
}

/**
 * Bỏ phần dẫn giữa nhãn và giá trị: bản dịch tiếng Anh trong ngoặc theo khoản 2
 * Điều 5 Thông tư 91/2026/TT-BTC ("Đơn vị bán hàng (Seller):"), dấu hai chấm và
 * các dấu chấm/gạch mà biểu mẫu dùng để kẻ dòng.
 */
const stripLeader = (value) => {
  let result = String(value ?? '').trim();
  let previous;
  do {
    previous = result;
    result = result
      .replace(/^[\s:.\-–—…_]+/, '')
      .replace(/^\([^)]*\)/, '')
      .trim();
  } while (result !== previous);
  return result;
};

const isFillerOnly = (value) => !value || /^[.\-–—…_\s:]*$/.test(value);

/** Nhãn dài nhất khớp trên dòng, để "Họ tên người mua hàng" thắng "Tên người mua". */
function bestLabelOnLine(folded, labels) {
  let best = null;
  for (const label of labels) {
    const at = folded.indexOf(label);
    if (at < 0) continue;
    if (!best || label.length > best.label.length) best = { label, at };
  }
  return best;
}

/**
 * Tìm giá trị của một nhãn. Bản thể hiện PDF hay tách nhãn và giá trị thành hai
 * dòng nên khi dòng chứa nhãn không có giá trị, hàm nhìn sang dòng kế tiếp.
 */
export function findLabeledValue(lines, labels, options = {}) {
  const { startIndex = 0, endIndex = lines.length, allowNextLine = true } = options;

  for (let index = Math.max(0, startIndex); index < Math.min(lines.length, endIndex); index += 1) {
    const line = tidyLine(lines[index]);
    const folded = foldText(line);
    if (!folded) continue;

    const hit = bestLabelOnLine(folded, labels);
    if (!hit) continue;

    const value = stripLeader(line.slice(hit.at + hit.label.length));
    if (!isFillerOnly(value)) return { value, lineIndex: index, label: hit.label };

    if (allowNextLine && index + 1 < lines.length) {
      const next = stripLeader(tidyLine(lines[index + 1]));
      if (!isFillerOnly(next)) return { value: next, lineIndex: index + 1, label: hit.label };
    }
  }

  return null;
}

const firstAmountIn = (text) => {
  const numberMatch = String(text ?? '').match(/-?\d[\d.,]*\d|\d/);
  if (!numberMatch) return null;
  const amount = parseLocalizedNumber(numberMatch[0]);
  return amount !== null && Number.isFinite(amount) ? amount : null;
};

/**
 * Số tiền đứng sau nhãn, tìm cả trên dòng kế tiếp khi cột số bị tách dòng.
 *
 * Nhãn đứng đầu dòng được ưu tiên hơn nhãn nằm giữa dòng: dòng tổng kết luôn
 * bắt đầu bằng nhãn của nó, còn phần khớp giữa dòng thường chỉ là bản dịch
 * tiếng Anh trong ngoặc của một chỉ tiêu khác (ví dụ "Cộng tiền hàng (Total
 * amount)" không phải tổng thanh toán).
 */
export function findLabeledAmount(lines, labels, options = {}) {
  const { startIndex = 0 } = options;
  let fallback = null;

  for (const label of labels) {
    for (let index = Math.max(0, startIndex); index < lines.length; index += 1) {
      const line = tidyLine(lines[index]);
      const at = foldText(line).indexOf(label);
      if (at < 0) continue;

      const amount = firstAmountIn(line.slice(at + label.length))
        ?? firstAmountIn(tidyLine(lines[index + 1] ?? ''));
      if (amount === null) continue;

      const hit = { amount, lineIndex: index, label };
      if (at === 0) return hit;
      if (!fallback) fallback = hit;
    }
  }

  return fallback;
}

// Nhãn theo Phụ lục V, kèm biến thể của các phần mềm phát hành và bản song ngữ.
export const LABELS = Object.freeze({
  symbol: ['ky hieu hoa don', 'ky hieu', 'serial'],
  invoiceNo: ['so hoa don', 'so hd', 'invoice no', 'invoice number'],
  date: ['ngay lap hoa don', 'ngay lap', 'ngay hoa don', 'invoice date'],
  seller: [
    'ten don vi ban hang',
    'don vi ban hang',
    'ten nguoi ban',
    'don vi ban',
    'nguoi ban',
    'nha cung cap',
    'seller',
  ],
  buyer: [
    'ho ten nguoi mua hang',
    'ten don vi nguoi mua',
    'don vi mua hang',
    'ho ten nguoi mua',
    'ten nguoi mua',
    'nguoi mua hang',
    'nguoi mua',
    'buyer',
  ],
  taxCode: ['ma so thue', 'mst', 'tax code'],
  address: ['dia chi', 'address'],
  totalAmount: [
    'tong cong tien thanh toan',
    'tong tien thanh toan da co thue gtgt',
    'tong so tien thanh toan',
    'tong tien thanh toan',
    'tong cong thanh toan',
    'tong thanh toan',
    'total payment',
    'total amount',
  ],
  amountBeforeTax: [
    'tong tien chua co thue gtgt',
    'thanh tien chua co thue gtgt',
    'cong tien hang chua co thue gtgt',
    'cong tien hang',
    'cong tien ban hang',
    'tong tien hang',
    'total excluding vat',
    'amount excluding vat',
  ],
  vatAmount: [
    'tong tien thue gia tri gia tang',
    'tien thue gia tri gia tang',
    'tong so tien thue gtgt',
    'tong tien thue gtgt',
    'tien thue gtgt',
    'thue gtgt',
    'vat amount',
  ],
  taxRate: ['thue suat gia tri gia tang', 'thue suat gtgt', 'thue suat'],
  amountInWords: [
    'so tien viet bang chu',
    'so tien bang chu',
    'bang chu',
    'amount in words',
    'in words',
  ],
});

function findInvoiceNumber(lines) {
  const labelled = findLabeledValue(lines, LABELS.invoiceNo);
  let raw = labelled ? labelled.value : '';

  // Mẫu Phụ lục V dùng nhãn "Số:" đứng riêng một dòng. Chỉ nhận khi nhãn nằm
  // đầu dòng, nếu không sẽ dính "Mã số thuế", "Số tài khoản" hay "Số lượng".
  if (!raw) {
    for (let index = 0; index < lines.length; index += 1) {
      const line = tidyLine(lines[index]);
      // Chấp nhận cả "Số:" lẫn dạng song ngữ "Số (No.):" của các phần mềm phát hành.
      const bare = /^so\s*(?:\([^)]*\))?\s*[:.]/.exec(foldText(line));
      if (!bare) continue;

      const inline = stripLeader(line.slice(bare[0].length));
      raw = isFillerOnly(inline) ? stripLeader(tidyLine(lines[index + 1] ?? '')) : inline;
      if (!isFillerOnly(raw)) break;
      raw = '';
    }
  }

  const cleaned = String(raw).split(/\s+/)[0]?.replace(/[^A-Za-z0-9/-]/g, '') ?? '';

  // Số hóa đơn theo quy định là chữ số Ả Rập, tối đa tám chữ số.
  if (/^\d{1,8}$/.test(cleaned)) return cleaned;
  if (/^[A-Za-z0-9/-]{3,15}$/.test(cleaned)) return cleaned;
  return '';
}

function findInvoiceDate(lines) {
  const joined = lines.join('\n');

  // "Ngày 05 tháng 07 năm 2026" theo mẫu hiển thị, chấp nhận bản dịch xen giữa
  // như "Ngày (Date) 05 tháng (month) 07 năm (year) 2026".
  const gap = '\\s*(?:\\([^)]*\\))?\\s*';
  const spelled = joined.match(
    new RegExp(`[Nn]g[àa]y${gap}(\\d{1,2})${gap}th[áa]ng${gap}(\\d{1,2})${gap}n[ăa]m${gap}(\\d{4})`),
  );
  if (spelled) {
    return {
      date: `${spelled[1].padStart(2, '0')}/${spelled[2].padStart(2, '0')}/${spelled[3]}`,
      source: 'label',
    };
  }

  const labelled = findLabeledValue(lines, LABELS.date);
  const candidates = [labelled?.value, joined].filter(Boolean);
  for (const candidate of candidates) {
    const iso = candidate.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
    if (iso) return { date: `${iso[3]}/${iso[2]}/${iso[1]}`, source: 'label' };

    const dmy = candidate.match(/\b(\d{1,2})[/-](\d{1,2})[/-](\d{4})\b/);
    if (dmy) {
      const day = Number(dmy[1]);
      const month = Number(dmy[2]);
      if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
        return {
          date: `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${dmy[3]}`,
          source: candidate === joined ? 'scan' : 'label',
        };
      }
    }
  }

  return { date: '', source: '' };
}

/**
 * Mã số thuế người bán và người mua đều mang nhãn "Mã số thuế". Theo thứ tự của
 * mẫu hiển thị, khối người bán đứng trước khối người mua, nên mốc phân chia là
 * dòng đầu tiên nhắc tới người mua.
 */
function findParties(lines) {
  const buyerLine = lines.findIndex((line) => {
    const normalized = normalizeText(line);
    return LABELS.buyer.some((label) => normalized.includes(label));
  });
  const boundary = buyerLine < 0 ? lines.length : buyerLine;

  const seller = findLabeledValue(lines, LABELS.seller, { endIndex: boundary + 1 });
  const buyer = buyerLine < 0 ? null : findLabeledValue(lines, LABELS.buyer, { startIndex: buyerLine });

  const sellerTaxHit = findLabeledValue(lines, LABELS.taxCode, { endIndex: boundary });
  const buyerTaxHit = buyerLine < 0
    ? null
    : findLabeledValue(lines, LABELS.taxCode, { startIndex: buyerLine });

  // Địa chỉ người mua dùng để điền khối tiêu đề của Giấy đề nghị thanh toán.
  const buyerAddressHit = buyerLine < 0
    ? null
    : findLabeledValue(lines, LABELS.address, { startIndex: buyerLine });

  return {
    seller: seller?.value ?? '',
    buyer: buyer?.value ?? '',
    sellerTax: normalizeTaxCode(sellerTaxHit?.value ?? ''),
    buyerTax: normalizeTaxCode(buyerTaxHit?.value ?? ''),
    buyerAddress: buyerAddressHit?.value ?? '',
  };
}

/**
 * Đọc toàn bộ trường bắt buộc từ text của một bản thể hiện hóa đơn.
 * Không suy diễn giá trị thiếu; mọi nghi vấn được trả về trong `warnings`.
 */
export function extractInvoiceFields(rawText) {
  const lines = String(rawText ?? '')
    .split('\n')
    // Bản thể hiện PDF hay chèn no-break space và thin space giữa các chữ số.
    .map((line) => line.replace(/[\u00a0\u2007\u202f\u2009]/g, ' ').trim())
    .filter((line) => line.length > 0);

  const symbolHit = findLabeledValue(lines, LABELS.symbol);
  const symbol = parseInvoiceSymbol(symbolHit?.value ?? '') ?? parseInvoiceSymbol(lines.join(' '));

  const invoiceNo = findInvoiceNumber(lines);
  const { date, source: dateSource } = findInvoiceDate(lines);
  const parties = findParties(lines);

  const totalHit = findLabeledAmount(lines, LABELS.totalAmount);
  const beforeTaxHit = findLabeledAmount(lines, LABELS.amountBeforeTax);
  const vatHit = findLabeledAmount(lines, LABELS.vatAmount);

  const wordsHit = findLabeledValue(lines, LABELS.amountInWords);
  const amountInWords = wordsHit?.value ?? '';

  const rateHit = findLabeledAmount(lines, LABELS.taxRate);
  const amountInWordsValue = amountInWords ? parseVietnameseAmountWords(amountInWords) : null;

  // "Số tiền viết bằng chữ" là tiêu thức bắt buộc và là bản ghi độc lập của
  // tổng thanh toán. Khi cột số không đọc được, đọc chữ vẫn là đọc dữ liệu trên
  // chứng từ chứ không phải suy đoán — nhưng vẫn phải báo để người dùng soát.
  const totalFromWords = totalHit === null && amountInWordsValue ? amountInWordsValue : null;

  return {
    ruleVersion: INVOICE_RULE_VERSION,
    symbol,
    invoiceNo,
    date,
    dateSource,
    totalSource: totalHit ? 'label' : (totalFromWords ? 'words' : ''),
    seller: parties.seller,
    sellerTax: parties.sellerTax,
    buyer: parties.buyer,
    buyerTax: parties.buyerTax,
    buyerAddress: parties.buyerAddress,
    amountBeforeTax: beforeTaxHit?.amount ?? 0,
    vatAmount: vatHit?.amount ?? 0,
    totalAmount: totalHit?.amount ?? totalFromWords ?? 0,
    taxRate: rateHit?.amount ?? null,
    amountInWords,
    amountInWordsValue,
  };
}

/** Sai lệch làm tròn chấp nhận được giữa các cột tiền trên hóa đơn. */
export const AMOUNT_TOLERANCE = 1;

/**
 * Đối chiếu chéo các trường đã đọc với nhau theo đúng ràng buộc của biểu mẫu.
 * Trả về cảnh báo để người dùng kiểm tra chứng từ gốc, không tự sửa số liệu.
 */
export function validateInvoiceFields(fields) {
  const warnings = [];
  const { symbol, date, amountBeforeTax, vatAmount, totalAmount } = fields;

  if (symbol && date) {
    const year = Number(date.slice(-4));
    if (year && year !== symbol.year) {
      warnings.push(`Năm trên ký hiệu (${symbol.year}) khác năm của ngày lập (${year}).`);
    }
  }

  if (amountBeforeTax && vatAmount && totalAmount) {
    const diff = Math.abs(amountBeforeTax + vatAmount - totalAmount);
    if (diff > AMOUNT_TOLERANCE) {
      warnings.push(
        `Chưa thuế + tiền thuế (${amountBeforeTax + vatAmount}) không khớp tổng thanh toán (${totalAmount}).`,
      );
    }
  }

  if (fields.amountInWordsValue !== null && fields.amountInWordsValue !== undefined && totalAmount) {
    if (Math.abs(fields.amountInWordsValue - totalAmount) > AMOUNT_TOLERANCE) {
      warnings.push(
        `Số tiền bằng chữ (${fields.amountInWordsValue}) không khớp tổng thanh toán (${totalAmount}).`,
      );
    }
  }

  if (symbol?.expectsVat === false && vatAmount > 0) {
    warnings.push(`${symbol.formName} không có thuế GTGT nhưng đọc được tiền thuế.`);
  }

  if (fields.sellerTax && !TAX_CODE_PATTERN.test(fields.sellerTax)) {
    warnings.push('Mã số thuế người bán không đúng dạng 10 hoặc 13 chữ số.');
  }

  if (fields.dateSource === 'scan') {
    warnings.push('Ngày lập lấy từ chuỗi ngày đầu tiên trong tài liệu, cần đối chiếu lại.');
  }

  if (fields.totalSource === 'words') {
    warnings.push('Không đọc được dòng tổng thanh toán; số tiền lấy từ "Số tiền viết bằng chữ".');
  }

  return warnings;
}

/** Trường bắt buộc theo mẫu hiển thị; thiếu thì phải đánh dấu để người dùng soát. */
export function missingInvoiceFields(fields) {
  const missing = [];
  if (!fields.invoiceNo) missing.push('invoiceNo');
  if (!fields.date) missing.push('date');
  if (!fields.sellerTax) missing.push('sellerTax');
  if (!fields.seller) missing.push('seller');
  if (!fields.totalAmount) missing.push('totalAmount');
  if (fields.symbol?.expectsVat && !fields.vatAmount && !fields.amountBeforeTax) {
    missing.push('taxBreakdown');
  }
  return missing;
}
