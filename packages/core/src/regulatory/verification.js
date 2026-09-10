/**
 * @file packages/core/src/regulatory/verification.js
 * @description Các tiện ích kiểm định tính toàn vẹn (Integrity), phát hiện hằng số giả lập (Dummy/Placeholder Detection),
 * và theo dõi độ cũ/lạc hậu của quy tắc luật định (Staleness Monitoring).
 */

import { hasSource, getSource } from './sourceRegistry.js';

// Danh sách các từ khóa cấm xuất hiện trong các file dữ liệu luật/thuế/bảo hiểm
export const FORBIDDEN_REGULATORY_PLACEHOLDERS = Object.freeze([
  'TODO rate',
  'example rate',
  'dummy rate',
  'placeholder rate',
  'average assumed',
  'sample rate',
  'temporary rate',
  'hardcoded approximate',
]);

/**
 * Kiểm tra xem một chuỗi mã nguồn có chứa các từ khóa giả lập/placeholder không an toàn hay không.
 * @param {string} sourceCode
 * @returns {string[]} Danh sách các từ khóa vi phạm tìm thấy
 */
export function scanForForbiddenPlaceholders(sourceCode) {
  if (!sourceCode || typeof sourceCode !== 'string') return [];
  const found = [];
  const lower = sourceCode.toLowerCase();
  for (const pattern of FORBIDDEN_REGULATORY_PLACEHOLDERS) {
    if (lower.includes(pattern.toLowerCase())) {
      found.push(pattern);
    }
  }
  return found;
}

/**
 * Kiểm tra độ lạc hậu (Staleness) của một quy tắc luật dựa trên ngày kiểm chứng.
 * @param {string} lastVerifiedAt - Ngày dạng YYYY-MM-DD
 * @param {Object} [options]
 * @param {number} [options.staleThresholdDays=365] - Số ngày tối đa trước khi coi là cần đánh giá lại
 * @param {string} [options.currentDate] - Ngày hiện tại để so sánh (YYYY-MM-DD)
 * @returns {{ isStale: boolean, daysSinceVerification: number, needsReview: boolean }}
 */
export function checkStaleness(lastVerifiedAt, options = {}) {
  const { staleThresholdDays = 365, currentDate = new Date().toISOString().substring(0, 10) } = options;

  if (!lastVerifiedAt || !/^\d{4}-\d{2}-\d{2}$/.test(lastVerifiedAt)) {
    return { isStale: true, daysSinceVerification: Infinity, needsReview: true };
  }

  const verifiedTime = new Date(lastVerifiedAt).getTime();
  const currentTime = new Date(currentDate).getTime();
  const diffDays = Math.floor((currentTime - verifiedTime) / (1000 * 60 * 60 * 24));

  const isStale = diffDays > staleThresholdDays;
  return {
    isStale,
    daysSinceVerification: Math.max(0, diffDays),
    needsReview: isStale || diffDays > 180, // Cảnh báo xem xét sau 6 tháng
  };
}

/**
 * Kiểm tra tính liên kết toàn vẹn giữa Rule và Source Registry.
 * @param {Object} rule - Rule object có chứa metadata
 * @returns {{ valid: boolean, source: Object|null, error: string|null }}
 */
export function verifyRuleSourceBinding(rule) {
  if (!rule || !rule.metadata) {
    return { valid: false, source: null, error: 'Rule lacks metadata block' };
  }
  const { sourceId } = rule.metadata;
  if (!sourceId) {
    return { valid: false, source: null, error: 'Rule metadata lacks sourceId' };
  }
  if (!hasSource(sourceId)) {
    return { valid: false, source: null, error: `sourceId "${sourceId}" is not registered in OfficialSourceRegistry` };
  }
  const source = getSource(sourceId);
  return {
    valid: true,
    source,
    error: null,
  };
}
