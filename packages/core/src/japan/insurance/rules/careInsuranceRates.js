/**
 * @file packages/core/src/japan/insurance/rules/careInsuranceRates.js
 * @description Biểu tỷ lệ và quy định độ tuổi Bảo hiểm Chăm sóc Dài hạn (介護保険料率).
 * Nguồn: 全国健康保険協会 (kyoukaikenpo-care-insurance-2026)
 */

import { defineRuleMetadata } from '../../../regulatory/ruleMetadata.js';
import { JAPAN_JURISDICTION } from '../../../regulatory/jurisdiction.js';
import { createApplicablePeriod } from '../../../regulatory/effectivePeriod.js';

export const CARE_INSURANCE_METADATA_2026 = defineRuleMetadata({
  id: 'jp-care-insurance-rates-2026',
  jurisdiction: JAPAN_JURISDICTION,
  sourceId: 'kyoukaikenpo-care-insurance-2026',
  effectiveFrom: '2026-04-01',
  effectiveTo: '2027-03-31',
  applicablePeriod: createApplicablePeriod('fiscal-year', 2026, 2026),
  version: '2026.1',
  lastVerifiedAt: '2026-09-10',
  status: 'verified',
  notes: 'Bảo hiểm chăm sóc người già 介護保険 令和8年度 toàn quốc: 1.62% (chia đôi 50/50: 0.81% mỗi bên).',
});

/**
 * Tra cứu tỷ lệ bảo hiểm chăm sóc dài hạn theo độ tuổi và thời điểm
 * @param {number} age - Độ tuổi
 * @param {string} [applicableDate='2026-04-01'] - YYYY-MM-DD
 */
export function resolveCareInsuranceRate(age = 30, applicableDate = '2026-04-01') {
  const numericAge = Number(age) || 0;
  const dateStr = applicableDate ? String(applicableDate).substring(0, 10) : '2026-04-01';

  let totalRate = 0.0162; // FY2026: 1.62%
  let isVerifiedPeriod = true;
  let periodNotice = null;

  if (dateStr >= '2027-04-01') {
    isVerifiedPeriod = false;
    periodNotice = 'Care insurance rate for FY2027 onwards is unverified. Baseline 1.62% applied with warning.';
    totalRate = 0.0162;
  } else if (dateStr < '2026-04-01') {
    totalRate = 0.0160; // FY2025: 1.60%
  }

  // Phân loại chế độ theo độ tuổi
  if (numericAge < 40) {
    return {
      isApplicable: false,
      category: 'under_40',
      categoryLabelJa: '40歳未満（対象外）',
      totalRate: 0,
      employeeRate: 0,
      employerRate: 0,
      isVerifiedPeriod,
      periodNotice,
      metadata: CARE_INSURANCE_METADATA_2026,
      notes: '40歳未満は介護保険料の徴収対象外です。',
    };
  }

  if (numericAge >= 40 && numericAge < 65) {
    return {
      isApplicable: true,
      category: 'secondary_insured',
      categoryLabelJa: '第2号被保険者（40歳〜64歳）',
      totalRate,
      employeeRate: totalRate / 2,
      employerRate: totalRate / 2,
      isVerifiedPeriod,
      periodNotice,
      metadata: CARE_INSURANCE_METADATA_2026,
      notes: '健康保険料と合算して労使折半で給与から控除されます。',
    };
  }

  // Từ 65 tuổi trở lên (第1号被保険者)
  return {
    isApplicable: false, // Không thu qua BHYT công ty
    category: 'primary_insured_65plus',
    categoryLabelJa: '第1号被保険者（65歳以上）',
    totalRate: 0,
    employeeRate: 0,
    employerRate: 0,
    isVerifiedPeriod,
    periodNotice,
    metadata: CARE_INSURANCE_METADATA_2026,
    notes: '65歳以上は市区町村が直接年金から天引き等で徴収（第1号被保険者）するため、会社の健康保険料（協会けんぽ）からは控除されません。',
  };
}
