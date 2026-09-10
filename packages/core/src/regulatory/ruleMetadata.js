/**
 * @file packages/core/src/regulatory/ruleMetadata.js
 * @description Định nghĩa hợp đồng siêu dữ liệu quy chuẩn (Rule Metadata Contract).
 * Mọi hằng số luật, bảng thuế hoặc tỷ lệ bảo hiểm bắt buộc phải gắn với một RuleMetadata hợp lệ.
 */

import { hasSource } from './sourceRegistry.js';
import { isValidJurisdiction } from './jurisdiction.js';

/**
 * @typedef {'research' | 'beta' | 'verified' | 'stale'} RuleStatus
 *
 * @typedef {Object} RuleMetadata
 * @property {string} id - Mã định danh quy tắc (ví dụ: 'jp-employment-income-deduction-2026')
 * @property {Object} jurisdiction - Vùng quyền tài phán ({ country: 'JP', ... })
 * @property {string} sourceId - ID nguồn chính thức trong OfficialSourceRegistry
 * @property {string} effectiveFrom - Ngày bắt đầu hiệu lực (YYYY-MM-DD)
 * @property {string} [effectiveTo] - Ngày kết thúc hiệu lực (YYYY-MM-DD)
 * @property {Object} applicablePeriod - Chu kỳ áp dụng ({ type, from, to })
 * @property {string} version - Phiên bản quy chuẩn (ví dụ: '2026.1')
 * @property {string} lastVerifiedAt - Ngày kiểm chứng đối chiếu nguồn (YYYY-MM-DD)
 * @property {RuleStatus} status - Trạng thái thẩm định
 * @property {string} [notes] - Ghi chú tóm tắt
 */

export const ALLOWED_RULE_STATUSES = Object.freeze(['research', 'beta', 'verified', 'stale']);

/**
 * Tạo một RuleMetadata được kiểm tra hợp lệ.
 * @param {RuleMetadata} def
 * @returns {RuleMetadata}
 */
export function defineRuleMetadata(def) {
  if (!def || typeof def !== 'object') {
    throw new Error('Rule metadata must be a non-null object');
  }
  if (!def.id || typeof def.id !== 'string') {
    throw new Error('Rule metadata must specify a valid string "id"');
  }
  if (!isValidJurisdiction(def.jurisdiction)) {
    throw new Error(`Rule "${def.id}" has invalid jurisdiction`);
  }
  if (!def.sourceId || typeof def.sourceId !== 'string') {
    throw new Error(`Rule "${def.id}" must specify a "sourceId" referencing the OfficialSourceRegistry`);
  }
  if (!def.effectiveFrom || !/^\d{4}-\d{2}-\d{2}$/.test(def.effectiveFrom)) {
    throw new Error(`Rule "${def.id}" must have a valid "effectiveFrom" in YYYY-MM-DD format`);
  }
  if (!def.lastVerifiedAt || !/^\d{4}-\d{2}-\d{2}$/.test(def.lastVerifiedAt)) {
    throw new Error(`Rule "${def.id}" must have a valid "lastVerifiedAt" in YYYY-MM-DD format`);
  }
  if (!def.version) {
    throw new Error(`Rule "${def.id}" must have a "version" string`);
  }

  const status = def.status || 'verified';
  if (!ALLOWED_RULE_STATUSES.includes(status)) {
    throw new Error(`Rule "${def.id}" has invalid status: "${status}". Allowed: ${ALLOWED_RULE_STATUSES.join(', ')}`);
  }

  return Object.freeze({
    ...def,
    status,
  });
}

/**
 * Kiểm tra xem một rule object có metadata đầy đủ và hợp lệ không.
 * @param {Object} ruleMeta
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateRuleMetadata(ruleMeta) {
  const errors = [];
  if (!ruleMeta || typeof ruleMeta !== 'object') {
    return { valid: false, errors: ['Metadata must be an object'] };
  }
  if (!ruleMeta.id) errors.push('Missing "id"');
  if (!isValidJurisdiction(ruleMeta.jurisdiction)) errors.push('Invalid "jurisdiction"');
  if (!ruleMeta.sourceId) errors.push('Missing "sourceId"');
  else if (!hasSource(ruleMeta.sourceId)) errors.push(`Unregistered sourceId: "${ruleMeta.sourceId}"`);
  if (!ruleMeta.effectiveFrom) errors.push('Missing "effectiveFrom"');
  if (!ruleMeta.lastVerifiedAt) errors.push('Missing "lastVerifiedAt"');
  if (!ruleMeta.version) errors.push('Missing "version"');

  return {
    valid: errors.length === 0,
    errors,
  };
}
