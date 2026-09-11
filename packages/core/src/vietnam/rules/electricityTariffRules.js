/**
 * @file packages/core/src/vietnam/rules/electricityTariffRules.js
 * @description Biểu giá bán lẻ điện sinh hoạt 6 bậc lũy tiến tại Việt Nam.
 * Căn cứ pháp lý: Quyết định số 1279/QĐ-BCT ngày 09/05/2025 của Bộ Công Thương (áp dụng từ 10/05/2025).
 */

import { defineRuleMetadata } from '../../regulatory/ruleMetadata.js';

export const ELECTRICITY_TARIFF_RULE_2025 = Object.freeze({
  metadata: defineRuleMetadata({
    id: 'vn-electricity-tariff-2025',
    jurisdiction: { country: 'VN' },
    sourceId: 'vn-bct-dec-1279-2025',
    effectiveFrom: '2025-05-10',
    effectiveTo: null,
    applicablePeriod: {
      type: 'effective-date-range',
      from: '2025-05-10',
      to: '2030-12-31',
    },
    version: '2025.1',
    lastVerifiedAt: '2026-09-12',
    status: 'verified',
    legalDocument: 'Quyết định số 1279/QĐ-BCT',
    sourceTitle: 'Quy định về giá bán điện sinh hoạt bậc thang',
    notes: 'Biểu giá bán lẻ điện sinh hoạt 6 bậc trước thuế GTGT (VAT) áp dụng từ ngày 10/05/2025.'
  }),
  tiers: Object.freeze([
    {
      tier: 1,
      min: 0,
      max: 50,
      bandwidth: 50,
      unitPrice: 1_984, // VND/kWh
      label_vn: 'Bậc 1 (0 – 50 kWh)',
      label_en: 'Tier 1 (0 – 50 kWh)',
      label_ja: '第1段階 (0〜50 kWh)',
    },
    {
      tier: 2,
      min: 50,
      max: 100,
      bandwidth: 50,
      unitPrice: 2_050, // VND/kWh
      label_vn: 'Bậc 2 (51 – 100 kWh)',
      label_en: 'Tier 2 (51 – 100 kWh)',
      label_ja: '第2段階 (51〜100 kWh)',
    },
    {
      tier: 3,
      min: 100,
      max: 200,
      bandwidth: 100,
      unitPrice: 2_380, // VND/kWh
      label_vn: 'Bậc 3 (101 – 200 kWh)',
      label_en: 'Tier 3 (101 – 200 kWh)',
      label_ja: '第3段階 (101〜200 kWh)',
    },
    {
      tier: 4,
      min: 200,
      max: 300,
      bandwidth: 100,
      unitPrice: 2_998, // VND/kWh
      label_vn: 'Bậc 4 (201 – 300 kWh)',
      label_en: 'Tier 4 (201 – 300 kWh)',
      label_ja: '第4段階 (201〜300 kWh)',
    },
    {
      tier: 5,
      min: 300,
      max: 400,
      bandwidth: 100,
      unitPrice: 3_350, // VND/kWh
      label_vn: 'Bậc 5 (301 – 400 kWh)',
      label_en: 'Tier 5 (301 – 400 kWh)',
      label_ja: '第5段階 (301〜400 kWh)',
    },
    {
      tier: 6,
      min: 400,
      max: Infinity,
      bandwidth: Infinity,
      unitPrice: 3_460, // VND/kWh
      label_vn: 'Bậc 6 (Trên 400 kWh)',
      label_en: 'Tier 6 (> 400 kWh)',
      label_ja: '第6段階 (400 kWh超)',
    },
  ])
});

/**
 * Lấy biểu giá bán lẻ điện sinh hoạt áp dụng theo ngày.
 * @param {string} [date='2026-09-01']
 * @returns {typeof ELECTRICITY_TARIFF_RULE_2025}
 */
export function getElectricityTariff(date = '2026-09-01') {
  return ELECTRICITY_TARIFF_RULE_2025;
}
