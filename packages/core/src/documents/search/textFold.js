/**
 * @file textFold.js
 * Chuẩn hóa chuỗi cho tìm kiếm: chữ thường, bỏ dấu tiếng Việt (an toàn NFC/NFD), đ→d,
 * chuẩn hóa full-width → half-width (NFKC) cho chữ Latin/số trong tiếng Nhật, gộp khoảng trắng.
 */
export function foldText(text) {
  if (text === null || text === undefined) return '';
  return String(text)
    .normalize('NFKC')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .normalize('NFC')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Độ dài tối thiểu hợp lý để khớp chuỗi con (1 ký tự CJK, 2 ký tự Latin). */
export function minSubstringLength(folded) {
  return /[぀-ヿ㐀-䶿一-鿿]/.test(folded) ? 1 : 2;
}
