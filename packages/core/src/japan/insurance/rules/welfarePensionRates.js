/**
 * @file packages/core/src/japan/insurance/rules/welfarePensionRates.js
 * @description Tỷ lệ đóng Hưu trí Phúc lợi (厚生年金保険料率).
 * Cố định 18.300% (chia đôi 50/50: người lao động 9.150%, người sử dụng lao động 9.150%).
 * Nguồn: 日本年金機構 (jps-welfare-pension-table-2026)
 */

import { defineRuleMetadata } from '../../../regulatory/ruleMetadata.js';
import { JAPAN_JURISDICTION } from '../../../regulatory/jurisdiction.js';
import { createApplicablePeriod } from '../../../regulatory/effectivePeriod.js';

export const WELFARE_PENSION_METADATA_2026 = defineRuleMetadata({
  id: 'jp-welfare-pension-rates-2026',
  jurisdiction: JAPAN_JURISDICTION,
  sourceId: 'jps-welfare-pension-table-2026',
  effectiveFrom: '2026-04-01',
  effectiveTo: '2027-03-31',
  applicablePeriod: createApplicablePeriod('fiscal-year', 2026, 2026),
  version: '2026.1',
  lastVerifiedAt: '2026-09-10',
  status: 'verified',
  notes: 'Tỷ lệ Hưu trí phúc lợi 厚生年金: 18.300% (chia đôi 50/50: 9.150% mỗi bên), áp dụng cho chuẩn thù lao 1〜32等級.',
});

export function resolveWelfarePensionRate(_applicableDate = '2026-04-01') {
  const totalRate = 0.183;
  const employeeRate = 0.0915;
  const employerRate = 0.0915;

  return {
    totalRate,
    employeeRate,
    employerRate,
    metadata: WELFARE_PENSION_METADATA_2026,
    notesJa: '厚生年金保険料率は18.3%で固定（労使折半9.15%）。標準報酬月額は上限65万円（第32等級）です。',
  };
}
