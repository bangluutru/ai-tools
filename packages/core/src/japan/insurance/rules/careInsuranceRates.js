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
  effectiveFrom: '2026-03-01',
  effectiveTo: '2027-02-28',
  applicablePeriod: createApplicablePeriod('fiscal-year', 2026, 2026),
  version: '2026.1',
  lastVerifiedAt: '2026-09-10',
  status: 'verified',
  notes: 'Bảo hiểm chăm sóc người già 介護保険 令和8年度 toàn quốc: 1.62% từ phí tháng 3/2026 (chia đôi 50/50: 0.81% mỗi bên). 令和7年度: 1.59%.',
});

/**
 * Tra cứu tỷ lệ bảo hiểm chăm sóc dài hạn theo độ tuổi và thời điểm
 * @param {number} age - Độ tuổi
 * @param {string} [applicableDate='2026-04-01'] - YYYY-MM-DD
 */
export function resolveCareInsuranceRate(age = 30, applicableDate = '2026-04-01') {
  const numericAge = Number(age) || 0;
  // Tỷ lệ 介護 (協会けんぽ) đổi theo tháng phí 3月分, cùng lúc với tỷ lệ BHYT
  const month = applicableDate ? String(applicableDate).substring(0, 7) : '2026-04';

  let totalRate = 0.0162; // 令和8年度 (2026年3月分〜): 1.62%
  let isVerifiedPeriod = true;
  let periodNotice = null;

  if (month >= '2027-03') {
    isVerifiedPeriod = false;
    periodNotice = 'Care insurance rate from March 2027 premiums is unverified. Baseline 1.62% applied with warning.';
    totalRate = 0.0162;
  } else if (month >= '2025-03' && month < '2026-03') {
    totalRate = 0.0159; // 令和7年度 (2025年3月分〜2026年2月分): 1.59%
  } else if (month < '2025-03') {
    totalRate = 0.0160; // 令和6年度: 1.60%
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
