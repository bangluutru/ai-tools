/**
 * @file packages/core/src/japan/insurance/rules/employmentInsuranceRates.js
 * @description Tỷ lệ bảo hiểm thất nghiệp (雇用保険料率) phân theo ngành nghề và năm tài chính.
 * Nguồn: 厚生労働省 (mhlw-employment-rate-2026)
 */

import { defineRuleMetadata } from '../../../regulatory/ruleMetadata.js';
import { JAPAN_JURISDICTION } from '../../../regulatory/jurisdiction.js';
import { createApplicablePeriod } from '../../../regulatory/effectivePeriod.js';

export const EMPLOYMENT_INSURANCE_METADATA_2026 = defineRuleMetadata({
  id: 'jp-employment-insurance-rates-2026',
  jurisdiction: JAPAN_JURISDICTION,
  sourceId: 'mhlw-employment-rate-2026',
  effectiveFrom: '2026-04-01',
  effectiveTo: '2027-03-31',
  applicablePeriod: createApplicablePeriod('fiscal-year', 2026, 2026),
  version: '2026.1',
  lastVerifiedAt: '2026-09-10',
  status: 'verified',
  notes: 'Tỷ lệ bảo hiểm thất nghiệp 令和8年度 (01/04/2026 - 31/03/2027): Ngành chung 5/1000 NLĐ, 8.5/1000 NSDLĐ.',
});

export const INDUSTRY_CATEGORIES = Object.freeze({
  general: {
    id: 'general',
    name_ja: '一般の事業',
    name_vi: 'Ngành nghề thông thường / Chung',
    name_en: 'General Business',
    rates2026: {
      employeeRate: 0.005, // 5/1000
      employerRate: 0.0085, // 8.5/1000
      totalRate: 0.0135,
    },
    rates2025: {
      employeeRate: 0.006, // 6/1000
      employerRate: 0.0095, // 9.5/1000
      totalRate: 0.0155,
    },
  },
  agriculture_forestry_fishery: {
    id: 'agriculture_forestry_fishery',
    name_ja: '農林水産・清酒製造の事業',
    name_vi: 'Nông lâm thủy sản / Sản xuất rượu Sake',
    name_en: 'Agriculture, Forestry, Fisheries & Sake Brewing',
    rates2026: {
      employeeRate: 0.006, // 6/1000
      employerRate: 0.0095, // 9.5/1000
      totalRate: 0.0155,
    },
    rates2025: {
      employeeRate: 0.007,
      employerRate: 0.0105,
      totalRate: 0.0175,
    },
  },
  construction: {
    id: 'construction',
    name_ja: '建設の事業',
    name_vi: 'Ngành xây dựng',
    name_en: 'Construction',
    rates2026: {
      employeeRate: 0.006, // 6/1000
      employerRate: 0.0105, // 10.5/1000
      totalRate: 0.0165,
    },
    rates2025: {
      employeeRate: 0.007,
      employerRate: 0.0115,
      totalRate: 0.0185,
    },
  },
});

export const INDUSTRY_LIST = Object.freeze(Object.values(INDUSTRY_CATEGORIES));

/**
 * Tra cứu tỷ lệ bảo hiểm thất nghiệp theo ngành và thời điểm
 * @param {string} industryId - 'general' | 'agriculture_forestry_fishery' | 'construction'
 * @param {string} [applicableDate='2026-04-01'] - YYYY-MM-DD
 */
export function resolveEmploymentInsuranceRate(industryId = 'general', applicableDate = '2026-04-01') {
  const ind = INDUSTRY_CATEGORIES[industryId] || INDUSTRY_CATEGORIES.general;
  const dateStr = applicableDate ? String(applicableDate).substring(0, 10) : '2026-04-01';

  let rates = ind.rates2026;
  let isVerifiedPeriod = true;
  let periodNotice = null;

  if (dateStr >= '2027-04-01') {
    isVerifiedPeriod = false;
    periodNotice = 'Employment insurance rates for FY2027 onwards are not yet published. Using FY2026 baseline with unverified flag.';
    rates = ind.rates2026;
  } else if (dateStr < '2026-04-01') {
    rates = ind.rates2025;
  }

  return {
    industry: ind,
    employeeRate: rates.employeeRate,
    employerRate: rates.employerRate,
    totalRate: rates.totalRate,
    isVerifiedPeriod,
    periodNotice,
    metadata: EMPLOYMENT_INSURANCE_METADATA_2026,
  };
}
