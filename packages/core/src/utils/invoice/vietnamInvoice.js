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

import { parseLocalizedNumber } from '../numbers.js';
import { analyzeVietnameseAmountWords } from './amountWords.js';

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

/** Mã số thuế Việt Nam: 10 chữ số, đơn vị phụ thuộc thêm 3 chữ số, hoặc 12 chữ số (CCCD / hộ kinh doanh). */
export const TAX_CODE_PATTERN = /\b(\d{10})(?:[-\s]?(\d{3}))?\b|\b(\d{12})\b/;

/** Dạng đầy đủ của một mã số thuế: 10, 10-3 (13) hoặc 12 chữ số, không lẫn gì khác. */
const TAX_CODE_EXACT = /^(?:(\d{10})(?:-?\d{3})?|\d{12})$/;

/**
 * Trọng số kiểm tra chữ số thứ 10 của mã số thuế doanh nghiệp theo thuật toán
 * mod 11 của Tổng cục Thuế: N10 = 10 - (Σ Ni * Wi mod 11). Kết quả 10 (tổng chia
 * hết cho 11) không phải chữ số nên mã đó không hợp lệ.
 */
const TAX_CODE_WEIGHTS = [31, 29, 23, 19, 17, 13, 7, 5, 3];

/**
 * Kiểm tra chữ số kiểm tra của mã số thuế 10 chữ số (hoặc phần 10 chữ số đầu
 * của mã đơn vị phụ thuộc 13 chữ số). Mã 12 chữ số (số định danh cá nhân) không
 * có chữ số kiểm tra theo thuật toán này nên luôn trả về true. Trả về null khi
 * không phải dạng mã số thuế.
 */
export function isValidTaxCodeChecksum(value) {
  const compact = String(value ?? '').replace(/[\s.]/g, '');
  const match = TAX_CODE_EXACT.exec(compact);
  if (!match) return null;
  if (!match[1]) return true;

  const digits = match[1].split('').map(Number);
  const sum = TAX_CODE_WEIGHTS.reduce((acc, weight, index) => acc + weight * digits[index], 0);
  const check = 10 - (sum % 11);
  return check === digits[9];
}

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
  if (!value) return '';
  // Sáp nhập các chữ số bị ngắt bởi khoảng trắng: "1 6 0 2 0 6 6 7 0 8" -> "1602066708"
  const collapsed = String(value).replace(/(\d)\s+(?=\d)/g, '$1');
  const match = TAX_CODE_PATTERN.exec(collapsed.replace(/[.\s]/g, ' '));
  if (!match) return '';
  if (match[3]) return match[3]; // 12-digit CCCD/personal tax code
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

/**
 * Cụm chữ số kèm dấu phân nhóm. Các phần mềm phát hành dùng cả ba kiểu nhóm
 * nghìn: "4.246.000", "4,246,000" và "4 246 000" — kiểu dấu cách khá phổ biến
 * trên bản thể hiện vé máy bay.
 */
const MONEY_BODY = '\\d{1,3}(?:[ .,]\\d{3})+(?:[.,]\\d{1,2})?|\\d+(?:[.,]\\d{1,2})?';
// Hóa đơn điều chỉnh giảm in số âm dạng "-1.080.000" hoặc kế toán "(1.080.000)".
// Dấu trừ chỉ được nhận khi dính liền chữ số và không đứng sau chữ/số khác, để
// gạch nối như "0101234567-001" hay "Tổng - 1.000" không biến thành số âm.
const MONEY_TOKEN = new RegExp(`\\((?:${MONEY_BODY})\\)|(?:(?<![\\w.,])-)?(?:${MONEY_BODY})`, 'g');

const isGroupedMoney = (token) => /[ .,]\d{3}/.test(token);

/**
 * Số tiền đầu tiên trong một đoạn text.
 *
 * Cụm có dấu phân nhóm được ưu tiên hơn số trơ đứng cùng dòng: dòng bảng của
 * bản thể hiện thường bắt đầu bằng số thứ tự hoặc số lượng, nếu lấy số đầu tiên
 * thì "1 2.859.000" thành 1 và "2 859 000" bị cắt ở dấu cách thành 2.
 */
const firstAmountIn = (text) => {
  const tokens = String(text ?? '').match(MONEY_TOKEN);
  if (!tokens) return null;
  const amount = parseLocalizedNumber(tokens.find(isGroupedMoney) ?? tokens[0]);
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
    // Cách ghi của hóa đơn hàng không.
    'tong tien truoc thue',
    'tien truoc thue',
    'amount before vat',
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
  // Khoản hãng hàng không thu hộ nhà chức trách (phí sân bay, phí soi chiếu).
  // Không chịu thuế GTGT nhưng vẫn nằm trong tổng tiền khách phải trả, nên
  // thiếu nó thì phép cộng trên hóa đơn không bao giờ khớp.
  authorityCollection: [
    'cac khoan thu ho nha chuc trach',
    'khoan thu ho nha chuc trach',
    'thu ho nha chuc trach',
    'tong tien thu ho',
    'tien thu ho',
    'thu ho',
    'authorized collection',
  ],
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

  // Lọc bỏ các dòng thông tin đơn vị giải pháp phần mềm/T-VAN để không lấy nhầm MST của đơn vị giải pháp
  const sanitizedLinesForSeller = lines.map((l) => {
    const folded = foldText(l);
    if (
      folded.includes('cung cap giai phap') ||
      folded.includes('don vi khoi tao') ||
      folded.includes('t-van') ||
      folded.includes('giai phap hoa don') ||
      folded.includes('truyen va cung cap giai phap')
    ) {
      return '';
    }
    return l;
  });

  const sellerTaxHit = findLabeledValue(sanitizedLinesForSeller, LABELS.taxCode, { endIndex: boundary });
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
  const authorityHit = findLabeledAmount(lines, LABELS.authorityCollection);
  const authorityCollection = authorityHit?.amount ?? 0;
  const wordsAnalysis = amountInWords ? analyzeVietnameseAmountWords(amountInWords) : null;
  const amountInWordsValue = wordsAnalysis?.value ?? null;
  const amountInWordsConfident = Boolean(wordsAnalysis?.confident);

  // "Số tiền viết bằng chữ" là tiêu thức bắt buộc và là bản ghi độc lập của
  // tổng thanh toán. Chữ không có dấu phân nhóm nên không bị đọc lệch hệ số như
  // cột số; khi hai bên lệch nhau theo đúng dạng lỗi đọc số (xem bên dưới) thì
  // lấy theo chữ và báo lại cả hai — đây là cách bắt được lỗi đọc nhầm dấu chấm
  // nghìn thành hàng tỷ. Lệch kiểu khác thì chỉ cảnh báo, không tự sửa.
  const numericTotal = totalHit?.amount ?? null;
  const beforeTax = beforeTaxHit?.amount ?? 0;
  const vat = vatHit?.amount ?? 0;

  let totalAmount = numericTotal ?? 0;
  let totalSource = totalHit ? 'label' : '';

  if (amountInWordsValue !== null && amountInWordsValue !== undefined) {
    if (numericTotal === null) {
      totalAmount = amountInWordsValue;
      totalSource = 'words';
    } else if (Math.abs(amountInWordsValue - numericTotal) > AMOUNT_TOLERANCE) {
      // Bảng thuế là nhân chứng thứ hai cho cột số: khi chưa thuế + tiền thuế
      // đúng bằng cột số thì cột số mới là bên đáng tin, chỉ cảnh báo.
      const hasBreakdown = beforeTax !== 0 || vat !== 0;
      const addsUpTo = (target) => hasBreakdown
        && (Math.abs(beforeTax + vat - target) <= AMOUNT_TOLERANCE
          || Math.abs(beforeTax + vat + authorityCollection - target) <= AMOUNT_TOLERANCE);
      const numericCorroborated = addsUpTo(numericTotal);
      // Chữ chỉ được thay cột số khi đọc chữ chắc chắn VÀ sai lệch có dạng của
      // một lỗi đọc số điển hình: lệch hệ số 10^k (dấu phân nhóm đọc nhầm), chỉ
      // lệch dấu (mất dấu trừ), hoặc chính bảng thuế xác nhận số bằng chữ. Mọi
      // trường hợp khác giữ cột số và để cảnh báo lệch cho người dùng soát.
      const wordsCorroborated = addsUpTo(amountInWordsValue);
      if (amountInWordsConfident && !numericCorroborated
        && (wordsCorroborated || isScaleOrSignMisread(numericTotal, amountInWordsValue))) {
        totalAmount = amountInWordsValue;
        totalSource = 'words-override';
      }
    }
  }

  return {
    ruleVersion: INVOICE_RULE_VERSION,
    symbol,
    invoiceNo,
    date,
    dateSource,
    totalSource,
    seller: parties.seller,
    sellerTax: parties.sellerTax,
    buyer: parties.buyer,
    buyerTax: parties.buyerTax,
    buyerAddress: parties.buyerAddress,
    amountBeforeTax: beforeTax,
    vatAmount: vat,
    authorityCollection,
    totalAmount,
    numericTotal,
    taxRate: rateHit?.amount ?? null,
    amountInWords,
    amountInWordsValue,
    amountInWordsConfident,
  };
}

/**
 * Hai số lệch nhau đúng một hệ số 10^k (k = 1..9), hoặc chỉ khác dấu — dạng lỗi
 * điển hình khi đọc cột số: dấu phân nhóm/thập phân bị hiểu nhầm, hoặc mất dấu
 * trừ của hóa đơn điều chỉnh giảm.
 */
function isScaleOrSignMisread(numeric, words) {
  if (!numeric || !words) return false;
  if (Math.abs(Math.abs(numeric) - Math.abs(words)) <= AMOUNT_TOLERANCE) return true;
  if (Math.sign(numeric) !== Math.sign(words)) return false;
  const big = Math.max(Math.abs(numeric), Math.abs(words));
  const small = Math.min(Math.abs(numeric), Math.abs(words));
  for (let power = 1; power <= 9; power += 1) {
    const factor = 10 ** power;
    if (Math.abs(big - small * factor) <= AMOUNT_TOLERANCE * factor) return true;
  }
  return false;
}

/** Sai lệch làm tròn chấp nhận được giữa các cột tiền trên hóa đơn. */
export const AMOUNT_TOLERANCE = 1;

/** Nhận ra cảnh báo lệch phép cộng để tính lại khi người dùng sửa tay số tiền. */
export const AMOUNT_BALANCE_WARNING_PREFIX = 'Các cột tiền không khớp';

/**
 * Đối chiếu phép cộng của các cột tiền: chưa thuế + tiền thuế + thu hộ nhà
 * chức trách phải bằng tổng thanh toán. Trả về câu cảnh báo, hoặc null khi
 * khớp hoặc khi thiếu dữ liệu để đối chiếu.
 */
export function amountBalanceWarning(fields) {
  const beforeTax = Number(fields?.amountBeforeTax) || 0;
  const vat = Number(fields?.vatAmount) || 0;
  const authority = Number(fields?.authorityCollection) || 0;
  const total = Number(fields?.totalAmount) || 0;

  if (!beforeTax || !vat || !total) return null;

  const sum = beforeTax + vat + authority;
  if (Math.abs(sum - total) <= AMOUNT_TOLERANCE) return null;

  const parts = authority
    ? `chưa thuế + tiền thuế + thu hộ nhà chức trách (${sum})`
    : `chưa thuế + tiền thuế (${sum})`;
  return `${AMOUNT_BALANCE_WARNING_PREFIX}: ${parts} khác tổng thanh toán (${total}).`;
}

/**
 * Đối chiếu chéo các trường đã đọc với nhau theo đúng ràng buộc của biểu mẫu.
 * Trả về cảnh báo để người dùng kiểm tra chứng từ gốc, không tự sửa số liệu.
 */
export function validateInvoiceFields(fields) {
  const warnings = [];
  const { symbol, date, vatAmount, totalAmount } = fields;

  if (symbol && date) {
    const year = Number(date.slice(-4));
    if (year && year !== symbol.year) {
      warnings.push(`Năm trên ký hiệu (${symbol.year}) khác năm của ngày lập (${year}).`);
    }
  }

  const balance = amountBalanceWarning(fields);
  if (balance) warnings.push(balance);

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

  if (fields.sellerTax) {
    const checksum = isValidTaxCodeChecksum(fields.sellerTax);
    if (checksum === null) {
      warnings.push('Mã số thuế người bán không đúng dạng 10, 12 hoặc 13 chữ số.');
    } else if (checksum === false) {
      warnings.push(`Mã số thuế người bán ${fields.sellerTax} sai chữ số kiểm tra (thuật toán mod 11 của cơ quan thuế), cần đối chiếu chứng từ gốc.`);
    }
  }

  if (Number(totalAmount) < 0) {
    warnings.push('Tổng thanh toán âm: đây là hóa đơn điều chỉnh giảm, cần đối chiếu với hóa đơn gốc trước khi đưa vào đề nghị thanh toán.');
  }

  if (fields.dateSource === 'scan') {
    warnings.push('Ngày lập lấy từ chuỗi ngày đầu tiên trong tài liệu, cần đối chiếu lại.');
  }

  if (fields.totalSource === 'words') {
    warnings.push('Không đọc được dòng tổng thanh toán; số tiền lấy từ "Số tiền viết bằng chữ".');
  }

  if (fields.totalSource === 'words' && fields.amountInWordsConfident === false) {
    warnings.push('Số tiền bằng chữ có từ không nhận ra được, cần đối chiếu chứng từ gốc.');
  }

  if (fields.totalSource === 'words-override') {
    warnings.push(
      `Cột số đọc được ${fields.numericTotal} nhưng "Số tiền viết bằng chữ" là ${totalAmount}; đã lấy theo chữ, cần đối chiếu chứng từ gốc.`,
    );
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
