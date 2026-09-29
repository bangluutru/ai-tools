/**
 * @file textFold.js
 * Chuẩn hoá chuỗi cho tìm kiếm giấy tờ/thủ tục.
 *
 * `foldText` giờ là của gói dùng chung @chotto/search: NFKC, chữ thường,
 * katakana → hiragana, bỏ dấu tiếng Việt, đ→d, gộp khoảng trắng. Trước đây
 * repo có hai bản tự viết (bản này và normalizeSearchQuery của navigator),
 * lệch nhau ở NFKC. Giữ file này để các resolver không phải đổi import.
 */
import { foldText } from '@chotto/search';

export { foldText };

/** Độ dài tối thiểu hợp lý để khớp chuỗi con (1 ký tự CJK, 2 ký tự Latin). */
export function minSubstringLength(folded) {
  return /[぀-ヿ㐀-䶿一-鿿]/.test(folded) ? 1 : 2;
}
