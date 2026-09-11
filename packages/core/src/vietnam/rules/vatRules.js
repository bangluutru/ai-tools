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
    effectiveFrom: '2025-05-10',
    effectiveTo: null,
    applicablePeriod: {
      type: 'calendar-year',
      from: 2025,
      to: 2030,
    },
    version: '2026.1',
    lastVerifiedAt: '2026-09-12',
    status: 'verified',
    legalDocument: 'Luật Thuế Giá trị gia tăng & Nghị định hướng dẫn',
    sourceTitle: 'Thuế suất thuế GTGT áp dụng cho điện thương phẩm',
    notes: 'Thuế suất GTGT tiêu chuẩn 8% (theo các chính sách hỗ trợ phục hồi) hoặc 10% theo Luật Thuế GTGT.'
  }),
  defaultRate: 0.08, // 8% chính sách hỗ trợ hiện hành
  standardRate: 0.10, // 10% mức chuẩn
  allowedRates: Object.freeze([
    { rate: 0.08, label_vn: '8% (Mức ưu đãi/giảm thuế GTGT)', label_en: '8% (Reduced rate)', label_ja: '8% (減税率)' },
    { rate: 0.10, label_vn: '10% (Mức tiêu chuẩn)', label_en: '10% (Standard rate)', label_ja: '10% (標準税率)' },
    { rate: 0.00, label_vn: '0% (Không chịu thuế / Miễn thuế)', label_en: '0% (Exempt)', label_ja: '0% (非課税)' }
  ])
});

/**
 * Lấy quy tắc thuế VAT áp dụng cho điện sinh hoạt.
 * @param {string} [date='2026-09-01']
 * @returns {typeof ELECTRICITY_VAT_RULE}
 */
export function getElectricityVATRule(date = '2026-09-01') {
  return ELECTRICITY_VAT_RULE;
}
