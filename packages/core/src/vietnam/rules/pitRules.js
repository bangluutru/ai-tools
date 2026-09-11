/**
 * @file packages/core/src/vietnam/rules/pitRules.js
 * @description Quy tắc biểu thuế thu nhập cá nhân (PIT) và mức giảm trừ gia cảnh 2026 tại Việt Nam.
 * Căn cứ pháp lý:
 * - Luật Thuế thu nhập cá nhân số 109/2025/QH15 (Biểu thuế lũy tiến 5 bậc áp dụng từ 2026).
 * - Nghị quyết 110/2025/UBTVQH15 (Mức giảm trừ gia cảnh 15.5tr bản thân, 6.2tr NPT).
 * - Nghị định 253/2026/NĐ-CP (Quy định chi tiết thi hành Luật Thuế TNCN).
 */

import { defineRuleMetadata } from '../../regulatory/ruleMetadata.js';

export const PIT_RULE_2026 = Object.freeze({
  metadata: defineRuleMetadata({
    id: 'vn-pit-2026',
    jurisdiction: { country: 'VN' },
    sourceId: 'vn-na-law-109-2025',
    effectiveFrom: '2026-01-01',
    effectiveTo: null,
    applicablePeriod: {
      type: 'tax-year',
      from: 2026,
      to: 2026,
    },
    version: '2026.1',
    lastVerifiedAt: '2026-09-12',
    status: 'verified',
    legalDocument: 'Luật Thuế TNCN 109/2025/QH15 & Nghị quyết 110/2025/UBTVQH15',
    sourceTitle: 'Biểu thuế lũy tiến từng phần 5 bậc và giảm trừ gia cảnh từ 2026',
    notes: 'Giảm trừ bản thân 15.500.000 VND/tháng, giảm trừ NPT 6.200.000 VND/tháng/người. Biểu thuế 5 bậc (5%, 10%, 20%, 30%, 35%).'
  }),
  deductions: Object.freeze({
    personalMonthly: 15_500_000,   // 15.5 triệu/tháng
    personalAnnual: 186_000_000,   // 186 triệu/năm
    dependentMonthly: 6_200_000,   // 6.2 triệu/người/tháng
    dependentAnnual: 74_400_000,   // 74.4 triệu/người/năm
  }),
  brackets: Object.freeze([
    {
      tier: 1,
      min: 0,
      max: 10_000_000,
      bandwidth: 10_000_000,
      rate: 0.05,
      label_vn: 'Đến 10 triệu',
      label_en: 'Up to 10M',
      label_ja: '1,000万ドン以下',
      maxTax: 500_000, // 10m * 5%
    },
    {
      tier: 2,
      min: 10_000_000,
      max: 30_000_000,
      bandwidth: 20_000_000,
      rate: 0.10,
      label_vn: 'Trên 10 đến 30 triệu',
      label_en: 'Over 10M to 30M',
      label_ja: '1,000万超〜3,000万ドン',
      maxTax: 2_000_000, // 20m * 10%
    },
    {
      tier: 3,
      min: 30_000_000,
      max: 60_000_000,
      bandwidth: 30_000_000,
      rate: 0.20,
      label_vn: 'Trên 30 đến 60 triệu',
      label_en: 'Over 30M to 60M',
      label_ja: '3,000万超〜6,000万ドン',
      maxTax: 6_000_000, // 30m * 20%
    },
    {
      tier: 4,
      min: 60_000_000,
      max: 100_000_000,
      bandwidth: 40_000_000,
      rate: 0.30,
      label_vn: 'Trên 60 đến 100 triệu',
      label_en: 'Over 60M to 100M',
      label_ja: '6,000万超〜1億ドン',
      maxTax: 12_000_000, // 40m * 30%
    },
    {
      tier: 5,
      min: 100_000_000,
      max: Infinity,
      bandwidth: Infinity,
      rate: 0.35,
      label_vn: 'Trên 100 triệu',
      label_en: 'Over 100M',
      label_ja: '1億ドン超',
      maxTax: Infinity,
    }
  ])
});

/**
 * Lấy quy tắc thuế TNCN áp dụng theo ngày hoặc năm.
 * @param {string|number} [dateOrYear='2026-09-01']
 * @returns {typeof PIT_RULE_2026}
 */
export function getPITRules(dateOrYear = '2026-09-01') {
  // Áp dụng biểu thuế 2026 theo Luật 109/2025/QH15
  return PIT_RULE_2026;
}
