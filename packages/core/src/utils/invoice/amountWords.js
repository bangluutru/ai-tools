/**
 * Đọc ngược "Số tiền viết bằng chữ" trên hóa đơn thành số.
 *
 * Mẫu hiển thị tại Phụ lục V Thông tư 91/2026/TT-BTC bắt buộc có dòng "Số tiền
 * viết bằng chữ". Dòng này là bản sao độc lập của tổng tiền thanh toán, nên đối
 * chiếu hai giá trị là cách rẻ nhất để phát hiện đọc sai cột tiền.
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
}));

const SKIP = new Set(['linh', 'le', 'chan', 'va', 'don', 'vi', 'dong']);

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
 * Trả về số tiền, hoặc null nếu chuỗi không chứa chữ số tiếng Việt nào nhận ra
 * được — khi đó phần đối chiếu sẽ bỏ qua thay vì báo sai.
 */
export function parseVietnameseAmountWords(text) {
  const folded = fold(text);
  // Cắt phần đuôi "đồng ./." và mọi ghi chú phía sau.
  const head = folded.split(/\bdong\b/)[0];
  const tokens = head.split(/[^a-z]+/).filter(Boolean);
  if (tokens.length === 0) return null;

  let total = 0;
  let current = 0;
  let pending = null;
  let recognised = false;

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];

    if (DIGITS.has(token)) {
      // Hai chữ số liền nhau không xuất hiện trong cách đọc chuẩn; nếu gặp thì
      // dồn chữ số trước vào nhóm hiện tại thay vì ghi đè mất giá trị.
      if (pending !== null) current += pending;
      pending = DIGITS.get(token);
      recognised = true;
      continue;
    }

    if (token === 'tram') {
      current += (pending ?? 0) * 100;
      pending = null;
      recognised = true;
      continue;
    }

    // Sau khi bỏ dấu, "mười" và "mươi" trùng nhau; phân biệt bằng ngữ cảnh:
    // có chữ số đứng trước là hàng chục nhân lên, không có là đúng số mười.
    if (token === 'muoi') {
      current += pending === null ? 10 : pending * 10;
      pending = null;
      recognised = true;
      continue;
    }

    if (SCALES.has(token)) {
      current += pending ?? 0;
      pending = null;
      // "một tỷ hai trăm triệu": nhóm nhỏ hơn cộng dồn vào phần đã có cùng bậc.
      total += current * SCALES.get(token);
      current = 0;
      recognised = true;
      continue;
    }

    if (SKIP.has(token)) continue;
  }

  if (!recognised) return null;
  return total + current + (pending ?? 0);
}

export default parseVietnameseAmountWords;
