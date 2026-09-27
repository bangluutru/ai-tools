/**
 * @file packages/core/src/vietnam/rules/vatRules.js
 * @description Quy tắc thuế giá trị gia tăng (VAT) độc lập cho điện sinh hoạt và dịch vụ tại Việt Nam.
 */

import { defineRuleMetadata } from '../../regulatory/ruleMetadata.js';

export const ELECTRICITY_VAT_RULE = Object.freeze({
  metadata: defineRuleMetadata({
    id: 'vn-vat-electricity-current',
    jurisdiction: { country: 'VN' },
    sourceId: 'vn-bct-dec-1279-2025',
    effectiveFrom: '2025-07-01',
    // NQ 204/2025/QH15 chỉ giảm 10% → 8% đến hết 31/12/2026; sau đó quay về 10%.
    // https://vanban.chinhphu.vn/?pageid=27160&docid=214209&classid=1
    effectiveTo: '2026-12-31',
    applicablePeriod: {
      type: 'calendar-year',
      from: 2025,
      to: 2026,
    },
    version: '2026.1',
    lastVerifiedAt: '2026-09-12',
    status: 'verified',
    legalDocument: 'Luật Thuế GTGT 48/2024/QH15 & Nghị quyết 204/2025/QH15',
    sourceTitle: 'Thuế suất thuế GTGT áp dụng cho điện thương phẩm',
    notes: 'Thuế suất chuẩn 10% (Luật Thuế GTGT). NQ 204/2025/QH15 giảm còn 8% từ 01/07/2025 đến hết 31/12/2026.'
  }),
  defaultRate: 0.08, // 8% chính sách hỗ trợ hiện hành
  standardRate: 0.10, // 10% mức chuẩn
  allowedRates: Object.freeze([
    { rate: 0.08, label_vn: '8% (Mức ưu đãi/giảm thuế GTGT)', label_en: '8% (Reduced rate)', label_ja: '8% (減税率)' },
    { rate: 0.10, label_vn: '10% (Mức tiêu chuẩn)', label_en: '10% (Standard rate)', label_ja: '10% (標準税率)' },
    // Điện sinh hoạt không thuộc diện không chịu thuế GTGT; 0% chỉ để xem giá trước thuế.
    { rate: 0.00, label_vn: '0% (Xem giá chưa gồm VAT)', label_en: '0% (Show price before VAT)', label_ja: '0% (税抜表示)' }
  ])
});

const REDUCED_VAT_END = '2026-12-31';

/**
 * Lấy quy tắc thuế VAT áp dụng cho điện sinh hoạt tại ngày `date` (YYYY-MM hoặc YYYY-MM-DD).
 * Sau 31/12/2026 mức mặc định trở về 10%.
 * @param {string} [date='2026-09-01']
 * @returns {typeof ELECTRICITY_VAT_RULE}
 */
export function getElectricityVATRule(date = '2026-09-01') {
  const day = String(date || '').slice(0, 10);
  if (day && day.padEnd(10, '-01').slice(0, 10) > REDUCED_VAT_END) {
    return Object.freeze({ ...ELECTRICITY_VAT_RULE, defaultRate: ELECTRICITY_VAT_RULE.standardRate });
  }
  return ELECTRICITY_VAT_RULE;
}
