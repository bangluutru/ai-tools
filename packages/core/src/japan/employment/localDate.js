/**
 * @file packages/core/src/japan/employment/localDate.js
 * @description
 * Tiện ích xử lý ngày dạng lịch 'YYYY-MM-DD' (không múi giờ) dùng chung cho các miniapp Lao động & Gia đình.
 *
 * Lý do: `new Date('YYYY-MM-DD')` được parse theo UTC, còn `toISOString()` trả về ngày UTC.
 * Ở múi giờ âm (Mỹ) ngày bị lùi 1 ngày; ở Nhật từ 00:00–09:00 JST "hôm nay" lại bị tính là hôm qua.
 * Mọi phép cộng/trừ ngày ở đây thực hiện trên trục UTC thuần (Date.UTC + getUTC*) nên không phụ thuộc múi giờ/DST.
 */

const ISO_RE = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;

function pad2(n) {
  return String(n).padStart(2, '0');
}

/**
 * Parse 'YYYY-MM-DD' thành { y, m, d } (m: 1-12). Trả về null nếu không hợp lệ.
 * @param {string} iso
 * @returns {{ y: number, m: number, d: number } | null}
 */
export function parseISODateParts(iso) {
  if (typeof iso !== 'string') return null;
  const match = ISO_RE.exec(iso.trim());
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  if (m < 1 || m > 12 || d < 1 || d > daysInMonth(y, m)) return null;
  return { y, m, d };
}

/**
 * Kiểm tra chuỗi ngày 'YYYY-MM-DD' có hợp lệ không.
 * @param {string} iso
 * @returns {boolean}
 */
export function isValidISODate(iso) {
  return parseISODateParts(iso) !== null;
}

/**
 * Số ngày trong tháng (m: 1-12).
 * @param {number} y
 * @param {number} m
 * @returns {number}
 */
export function daysInMonth(y, m) {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/**
 * Định dạng { y, m, d } thành 'YYYY-MM-DD'.
 * @param {number} y
 * @param {number} m
 * @param {number} d
 * @returns {string}
 */
export function formatISODateParts(y, m, d) {
  return `${String(y).padStart(4, '0')}-${pad2(m)}-${pad2(d)}`;
}

/**
 * Chuyển một đối tượng Date thành 'YYYY-MM-DD' theo ngày LỊCH ĐỊA PHƯƠNG (không dùng toISOString).
 * @param {Date} [date=new Date()]
 * @returns {string}
 */
export function toLocalISODate(date = new Date()) {
  return formatISODateParts(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

/**
 * Hôm nay theo lịch địa phương của thiết bị, dạng 'YYYY-MM-DD'.
 * @returns {string}
 */
export function todayLocalISO() {
  return toLocalISODate(new Date());
}

/**
 * Số ngày tuyệt đối (epoch day) của một ngày lịch, dùng để so sánh/trừ ngày.
 * @param {string} iso
 * @returns {number} NaN nếu không hợp lệ
 */
export function toEpochDay(iso) {
  const p = parseISODateParts(iso);
  if (!p) return NaN;
  return Math.round(Date.UTC(p.y, p.m - 1, p.d) / 86400000);
}

/**
 * Chuyển epoch day về 'YYYY-MM-DD'.
 * @param {number} epochDay
 * @returns {string}
 */
export function fromEpochDay(epochDay) {
  const dt = new Date(epochDay * 86400000);
  return formatISODateParts(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
}

/**
 * Cộng n ngày vào ngày lịch. Trả về '' nếu đầu vào không hợp lệ.
 * @param {string} iso
 * @param {number} days
 * @returns {string}
 */
export function addDaysISO(iso, days) {
  const base = toEpochDay(iso);
  if (Number.isNaN(base)) return '';
  return fromEpochDay(base + Math.trunc(Number(days) || 0));
}

/**
 * Cộng n tháng theo "ngày tương ứng" (応当日). Nếu tháng đích không có ngày tương ứng
 * (VD 31/08 + 6 tháng → tháng 2 không có ngày 31) thì kẹp về NGÀY CUỐI THÁNG (民法第143条第2項).
 * @param {string} iso
 * @param {number} months
 * @returns {string}
 */
export function addMonthsClampISO(iso, months) {
  const p = parseISODateParts(iso);
  if (!p) return '';
  const total = p.y * 12 + (p.m - 1) + Math.trunc(Number(months) || 0);
  const y = Math.floor(total / 12);
  const m = (total % 12 + 12) % 12 + 1;
  const d = Math.min(p.d, daysInMonth(y, m));
  return formatISODateParts(y, m, d);
}

/**
 * Số ngày chênh lệch (b - a) giữa hai ngày lịch.
 * @param {string} a
 * @param {string} b
 * @returns {number} NaN nếu không hợp lệ
 */
export function diffDaysISO(a, b) {
  return toEpochDay(b) - toEpochDay(a);
}

/**
 * Tuổi tròn (満年齢) tại một ngày.
 * @param {string} birthDate
 * @param {string} onDate
 * @returns {number} NaN nếu không hợp lệ
 */
export function ageOnDate(birthDate, onDate) {
  const b = parseISODateParts(birthDate);
  const o = parseISODateParts(onDate);
  if (!b || !o) return NaN;
  let age = o.y - b.y;
  if (o.m < b.m || (o.m === b.m && o.d < b.d)) age -= 1;
  return age;
}
