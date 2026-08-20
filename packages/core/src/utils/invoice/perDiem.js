/**
 * Công tác phí khoán theo ngày trên Giấy đề nghị thanh toán.
 *
 * Đây là khoản chi không có hóa đơn: người đi công tác được thanh toán một mức
 * khoán cho mỗi ngày của đợt công tác, ghi thành một dòng riêng ngay sau các
 * dòng hóa đơn.
 */

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

/** "2026-06-09" (input type=date) → Date theo giờ địa phương, hoặc null. */
export function parseIsoDate(value) {
  const match = ISO_DATE.exec(String(value ?? '').trim());
  if (!match) return null;
  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  if (date.getMonth() !== Number(month) - 1 || date.getDate() !== Number(day)) return null;
  return date;
}

const formatDate = (date) => [
  String(date.getDate()).padStart(2, '0'),
  String(date.getMonth() + 1).padStart(2, '0'),
  date.getFullYear(),
].join('/');

/**
 * Số ngày công tác được thanh toán, tính trọn ngày: kể cả ngày đi và ngày về,
 * nên đi và về trong cùng một ngày vẫn được một ngày khoán.
 * Trả về 0 khi thiếu ngày hoặc ngày kết thúc nằm trước ngày bắt đầu.
 */
export function perDiemDays(from, to) {
  const start = parseIsoDate(from);
  const end = parseIsoDate(to);
  if (!start || !end) return 0;
  const days = Math.round((end - start) / MILLISECONDS_PER_DAY) + 1;
  return days > 0 ? days : 0;
}

export function perDiemAmount({ amountPerDay, from, to }) {
  const rate = Number(amountPerDay) || 0;
  if (rate <= 0) return 0;
  return perDiemDays(from, to) * rate;
}

/**
 * Dòng công tác phí để nối vào cuối bảng kê của một giấy đề nghị. Ngày ghi trên
 * dòng là ngày lập giấy đề nghị, vì khoản khoán này không gắn với chứng từ nào.
 * Trả về null khi chưa đủ dữ liệu để tính.
 */
export function buildPerDiemRow({ amountPerDay, from, to, issuedAt = new Date() }) {
  const amount = perDiemAmount({ amountPerDay, from, to });
  if (amount <= 0) return null;

  return {
    date: formatDate(issuedAt),
    description: `Công tác phí từ ${formatDate(parseIsoDate(from))} đến ${formatDate(parseIsoDate(to))}`,
    amount,
    invoiceNo: '',
    isPerDiem: true,
  };
}
