/**
 * @file packages/core/src/japan/immigration/shared/localDate.js
 * @description
 * Tiện ích ngày theo LỊCH ĐỊA PHƯƠNG (calendar-day) dùng chung cho miền Immigration.
 *
 * Lý do: `new Date('YYYY-MM-DD')` được JS hiểu là 00:00 UTC, và `toISOString()` trả về ngày UTC.
 * Ở múi giờ Nhật (UTC+9) hay múi giờ âm, điều này làm lệch 1 ngày (ví dụ ngày hết hạn bị coi là "đã quá hạn").
 * Mọi so sánh hạn chót trong miền này phải so theo NGÀY LỊCH, và ngày hết hạn vẫn là ngày hợp lệ.
 */

const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Chuyển đầu vào thành Date ở 00:00 giờ địa phương.
 * - 'YYYY-MM-DD' được hiểu là ngày lịch địa phương (KHÔNG phải UTC).
 * - Date được cắt về 00:00 địa phương của cùng ngày lịch.
 * @param {string|Date|number|null|undefined} input
 * @returns {Date|null} null nếu không hợp lệ / rỗng
 */
export function parseLocalDate(input) {
  if (input === null || input === undefined || input === '') return null;
  if (input instanceof Date) {
    if (isNaN(input.getTime())) return null;
    return new Date(input.getFullYear(), input.getMonth(), input.getDate());
  }
  if (typeof input === 'string') {
    const m = ISO_DATE_RE.exec(input.trim().slice(0, 10));
    if (m) {
      const y = Number(m[1]);
      const mo = Number(m[2]) - 1;
      const d = Number(m[3]);
      const date = new Date(y, mo, d);
      // Loại bỏ ngày không tồn tại (vd: 2026-02-30)
      if (date.getFullYear() !== y || date.getMonth() !== mo || date.getDate() !== d) return null;
      return date;
    }
  }
  const fallback = new Date(input);
  if (isNaN(fallback.getTime())) return null;
  return new Date(fallback.getFullYear(), fallback.getMonth(), fallback.getDate());
}

/**
 * Định dạng 'YYYY-MM-DD' theo giờ địa phương (không dùng toISOString).
 * @param {Date} date
 * @returns {string}
 */
export function formatLocalDate(date) {
  if (!(date instanceof Date) || isNaN(date.getTime())) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Ngày hôm nay theo giờ địa phương dạng 'YYYY-MM-DD'.
 * @returns {string}
 */
export function todayLocalISO() {
  return formatLocalDate(new Date());
}

/**
 * Cộng số ngày (theo lịch).
 * @param {Date} date
 * @param {number} days
 * @returns {Date}
 */
export function addDaysLocal(date, days) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/**
 * Cộng số tháng, kẹp về ngày cuối tháng nếu tràn (31/12 + 2 tháng → 28/02 hoặc 29/02).
 * @param {Date} date
 * @param {number} months
 * @returns {Date}
 */
export function addMonthsClamped(date, months) {
  const targetMonthIndex = date.getMonth() + months;
  const firstOfTarget = new Date(date.getFullYear(), targetMonthIndex, 1);
  const lastDay = new Date(firstOfTarget.getFullYear(), firstOfTarget.getMonth() + 1, 0).getDate();
  return new Date(firstOfTarget.getFullYear(), firstOfTarget.getMonth(), Math.min(date.getDate(), lastDay));
}

/**
 * Số ngày lịch từ `from` đến `to` (to - from). Không bị ảnh hưởng bởi giờ/DST.
 * @param {Date} from
 * @param {Date} to
 * @returns {number}
 */
export function diffCalendarDays(from, to) {
  const a = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const b = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((b - a) / 86400000);
}

/**
 * Chuẩn hóa ngày tham chiếu "hôm nay" (cho phép truyền vào để test).
 * @param {string|Date|undefined|null} currentDate
 * @returns {Date}
 */
export function resolveCurrentDate(currentDate) {
  return parseLocalDate(currentDate) || parseLocalDate(new Date());
}
