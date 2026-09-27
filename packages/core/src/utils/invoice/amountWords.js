/**
 * Đọc ngược "Số tiền viết bằng chữ" trên hóa đơn thành số.
 *
 * Mẫu hiển thị tại Phụ lục V Thông tư 91/2026/TT-BTC bắt buộc có dòng "Số tiền
 * viết bằng chữ". Dòng này là bản sao độc lập của tổng tiền thanh toán, nên đối
 * chiếu hai giá trị là cách rẻ nhất để phát hiện đọc sai cột tiền.
 *
 * Hỗ trợ các cách đọc thông dụng: "tỷ"/"tỉ", "nghìn"/"ngàn", "nghìn tỷ",
 * "linh"/"lẻ", "mười"/"mươi", "lăm"/"năm"/"nhăm", "mốt", "tư", và tiền tố "Âm"
 * của hóa đơn điều chỉnh giảm.
 */

const DIGITS = new Map(Object.entries({
  khong: 0,
  mot: 1,
  hai: 2,
  ba: 3,
  bon: 4,
  tu: 4,
  nam: 5,
  lam: 5,
  nham: 5,
  sau: 6,
  bay: 7,
  tam: 8,
  chin: 9,
}));

const SCALES = new Map(Object.entries({
  nghin: 1000,
  ngan: 1000,
  trieu: 1000000,
  ty: 1000000000,
  ti: 1000000000,
}));

/** Từ nối không mang giá trị số. */
const SKIP = new Set(['linh', 'le', 'chan', 'va', 'don', 'vi', 'dong']);

/** Nhãn/ghi chú có thể lọt vào đầu hoặc cuối chuỗi, không làm giảm độ tin cậy. */
const NOISE = new Set([
  'so', 'tien', 'viet', 'bang', 'chu', 'in', 'words', 'amount', 'total', 'la', 'vnd', 'vn',
]);

function fold(value) {
  return [...String(value ?? '')]
    .map((char) => {
      if (char.length > 1) return char;
      if (char === 'đ') return 'd';
      if (char === 'Đ') return 'D';
      return char.normalize('NFD')[0];
    })
    .join('')
    .toLowerCase();
}

/**
 * Phân tích chi tiết: trả về giá trị kèm độ tin cậy.
 *
 * `confident` = true khi mọi từ đều nhận ra được và cấu trúc hợp lệ (không có
 * hai chữ số liền nhau, không có từ lạ xen giữa các từ số). Chỉ khi tin cậy
 * thì số tiền bằng chữ mới được phép thay cột số.
 *
 * @returns {{ value: number|null, confident: boolean, negative: boolean, unknownTokens: string[] }}
 */
export function analyzeVietnameseAmountWords(text) {
  const folded = fold(text);
  // Cắt phần đuôi "(Việt Nam) đồng ./." và mọi ghi chú phía sau. Phải cắt cả
  // "Việt Nam" trước "đồng", nếu không "nam" bị đọc thành chữ số 5.
  const head = folded.split(/\b(?:viet\s+nam\s+)?dong\b/)[0];
  const tokens = head.split(/[^a-z]+/).filter(Boolean);
  const empty = { value: null, confident: false, negative: false, unknownTokens: [] };
  if (tokens.length === 0) return empty;

  // Mỗi phần tử: giá trị đã nhân bậc và bậc lớn nhất đã áp dụng.
  const segments = [];
  let current = 0;
  let pending = null;
  let recognised = false;
  let negative = false;
  let structuralIssue = false;
  let seenNumberWord = false;
  const unknownTokens = [];

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];

    if (token === 'am' && !seenNumberWord) {
      negative = true;
      continue;
    }

    if (DIGITS.has(token)) {
      // Hai chữ số liền nhau không xuất hiện trong cách đọc chuẩn; dồn chữ số
      // trước vào nhóm hiện tại nhưng hạ độ tin cậy.
      if (pending !== null) {
        current += pending;
        structuralIssue = true;
      }
      pending = DIGITS.get(token);
      recognised = true;
      seenNumberWord = true;
      continue;
    }

    if (token === 'tram') {
      current += (pending ?? 0) * 100;
      pending = null;
      recognised = true;
      seenNumberWord = true;
      continue;
    }

    // Sau khi bỏ dấu, "mười" và "mươi" trùng nhau; phân biệt bằng ngữ cảnh:
    // có chữ số đứng trước là hàng chục nhân lên, không có là đúng số mười.
    if (token === 'muoi') {
      current += pending === null ? 10 : pending * 10;
      pending = null;
      recognised = true;
      seenNumberWord = true;
      continue;
    }

    if (SCALES.has(token)) {
      const scale = SCALES.get(token);
      const group = current + (pending ?? 0);
      current = 0;
      pending = null;
      recognised = true;
      seenNumberWord = true;

      // Bậc lớn hơn gom mọi phần đã đọc có bậc nhỏ hơn: "một nghìn tỷ" = 10^12,
      // "hai nghìn năm trăm tỷ" = 2.500 * 10^9. Bậc nhỏ hơn đứng sau bậc lớn thì
      // chỉ là nhóm tiếp theo: "một tỷ hai trăm triệu".
      let lower = 0;
      while (segments.length > 0 && segments.at(-1).scale < scale) {
        lower += segments.pop().value;
      }
      if (group === 0 && lower === 0) {
        // "tỷ" đứng trơ không có số đứng trước.
        structuralIssue = true;
        continue;
      }
      segments.push({ value: (lower + group) * scale, scale });
      continue;
    }

    if (SKIP.has(token)) continue;
    if (NOISE.has(token)) continue;
    unknownTokens.push(token);
  }

  if (!recognised) return empty;
  const magnitude = segments.reduce((sum, segment) => sum + segment.value, 0) + current + (pending ?? 0);
  const value = negative && magnitude !== 0 ? -magnitude : magnitude;

  return {
    value,
    confident: !structuralIssue && unknownTokens.length === 0,
    negative: negative && magnitude !== 0,
    unknownTokens,
  };
}

/**
 * Trả về số tiền, hoặc null nếu chuỗi không chứa chữ số tiếng Việt nào nhận ra
 * được — khi đó phần đối chiếu sẽ bỏ qua thay vì báo sai. "Âm ..." trả số âm.
 */
export function parseVietnameseAmountWords(text) {
  return analyzeVietnameseAmountWords(text).value;
}

export default parseVietnameseAmountWords;
