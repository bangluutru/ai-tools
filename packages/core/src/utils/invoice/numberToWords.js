const DIGITS = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
const SCALES = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ', 'triệu tỷ'];

/**
 * Đọc một nhóm ba chữ số.
 *
 * `isLeading` đánh dấu nhóm có nghĩa lớn nhất của cả số: nhóm này không được
 * đọc "không trăm" hay "linh" ở đầu, còn các nhóm phía sau thì bắt buộc phải có
 * để giữ đúng giá trị (ví dụ 2.000.005 đọc là "hai triệu không trăm linh năm").
 */
function readTriple(group, isLeading) {
  const hundreds = Math.floor(group / 100);
  const tens = Math.floor((group % 100) / 10);
  const units = group % 10;
  const parts = [];

  if (hundreds > 0 || !isLeading) parts.push(`${DIGITS[hundreds]} trăm`);

  if (tens === 0) {
    if (units > 0) {
      if (hundreds > 0 || !isLeading) parts.push('linh');
      parts.push(DIGITS[units]);
    }
  } else if (tens === 1) {
    parts.push('mười');
    if (units === 5) parts.push('lăm');
    else if (units > 0) parts.push(DIGITS[units]);
  } else {
    parts.push(`${DIGITS[tens]} mươi`);
    if (units === 1) parts.push('mốt');
    else if (units === 5) parts.push('lăm');
    else if (units > 0) parts.push(DIGITS[units]);
  }

  return parts.join(' ').trim();
}

/**
 * Đọc số tiền VND thành chữ theo cách viết trên chứng từ kế toán Việt Nam.
 * Trả về chuỗi đã viết hoa chữ đầu và kết thúc bằng "đồng ./.".
 */
export function numberToWordsVN(value) {
  const amount = Math.round(Math.abs(Number(value) || 0));
  if (amount === 0) return 'Không đồng ./.';

  const groups = [];
  let remaining = amount;
  while (remaining > 0) {
    groups.push(remaining % 1000);
    remaining = Math.floor(remaining / 1000);
  }

  if (groups.length > SCALES.length) return '';

  const leadingIndex = groups.length - 1;
  const words = [];
  for (let index = leadingIndex; index >= 0; index -= 1) {
    if (groups[index] === 0) continue;
    const triple = readTriple(groups[index], index === leadingIndex);
    words.push(SCALES[index] ? `${triple} ${SCALES[index]}` : triple);
  }

  const sentence = words.join(' ').replace(/\s+/g, ' ').trim();
  const signed = Number(value) < 0 ? `Âm ${sentence}` : sentence;
  return `${signed.charAt(0).toUpperCase()}${signed.slice(1)} đồng ./.`;
}

export default numberToWordsVN;
