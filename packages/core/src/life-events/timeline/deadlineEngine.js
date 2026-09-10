/**
 * @file packages/core/src/life-events/timeline/deadlineEngine.js
 * @description
 * Động cơ tính toán hạn chót có cấu trúc (Structured Deadline Engine) cho các sự kiện đời sống.
 * Hỗ trợ tính toán ngày neo (Anchor Date) cộng/trừ số ngày dương lịch, định dạng ngày theo chuẩn 'YYYY-MM-DD',
 * và cung cấp nhãn mô tả hạn chót tự nhiên theo ngôn ngữ người dùng.
 */

/**
 * Cộng thêm số ngày dương lịch vào chuỗi ngày 'YYYY-MM-DD'
 * @param {string} dateStr
 * @param {number} days
 * @returns {string}
 */
export function addCalendarDays(dateStr, days) {
  if (!dateStr || typeof dateStr !== 'string') return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  d.setDate(d.getDate() + Number(days || 0));
  return d.toISOString().split('T')[0];
}

/**
 * Trừ bớt số ngày dương lịch khỏi chuỗi ngày 'YYYY-MM-DD'
 * @param {string} dateStr
 * @param {number} days
 * @returns {string}
 */
export function subtractCalendarDays(dateStr, days) {
  return addCalendarDays(dateStr, -Number(days || 0));
}

/**
 * Tính toán ngày hạn chót cụ thể dựa trên quy tắc có cấu trúc và ngữ cảnh sự kiện
 * @param {import('../types/lifeEventTypes.js').DeadlineRule} rule Quy tắc tính hạn chót
 * @param {Object} context Ngữ cảnh sự kiện chứa ngày neo
 * @returns {string|null} Chuỗi ngày 'YYYY-MM-DD' hoặc null nếu không có ngày neo
 */
export function calculateDeadlineDate(rule, context = {}) {
  if (!rule || !rule.anchorKey) return null;

  const anchorDate = context[rule.anchorKey];
  if (!anchorDate || typeof anchorDate !== 'string') return null;

  const offset = Number(rule.offsetDays) || 0;
  const direction = rule.direction || 'after';

  if (direction === 'before') {
    return subtractCalendarDays(anchorDate, offset);
  }

  return addCalendarDays(anchorDate, offset);
}

/**
 * Định dạng nhãn hiển thị hạn chót kèm ngày cụ thể nếu có
 * @param {Object} params
 * @param {import('../types/lifeEventTypes.js').DeadlineRule} [params.rule]
 * @param {string} [params.calculatedDate]
 * @param {string} [params.fallbackTextJa]
 * @param {string} [params.fallbackTextVi]
 * @param {string} [params.fallbackTextEn]
 * @param {string} [params.lang='vi']
 * @returns {string}
 */
export function formatDeadlineLabel({
  rule,
  calculatedDate,
  fallbackTextJa = '',
  fallbackTextVi = '',
  fallbackTextEn = '',
  lang = 'vi',
} = {}) {
  if (calculatedDate) {
    if (lang === 'ja') {
      const parts = calculatedDate.split('-');
      if (parts.length === 3) {
        return `${parts[0]}年${parseInt(parts[1], 10)}月${parseInt(parts[2], 10)}日まで` +
          (fallbackTextJa ? `（${fallbackTextJa}）` : '');
      }
      return `${calculatedDate}まで`;
    }

    if (lang === 'en') {
      return `By ${calculatedDate}` + (fallbackTextEn ? ` (${fallbackTextEn})` : '');
    }

    return `Hạn: ${calculatedDate}` + (fallbackTextVi ? ` (${fallbackTextVi})` : '');
  }

  if (lang === 'ja') return fallbackTextJa || rule?.description?.ja || '期日なし';
  if (lang === 'en') return fallbackTextEn || rule?.description?.en || 'No statutory deadline';
  return fallbackTextVi || rule?.description?.vi || 'Không quy định hạn chót cứng';
}
