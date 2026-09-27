/**
 * @file packages/core/src/utils/tax/engines/residentTaxEngine.js
 * @description Deterministic engine tính thuế cư trú cá nhân (個人住民税) và thuế môi trường rừng (森林環境税).
 * - 所得割: 道府県民税 (4%) và 市町村民税 (6%) tính riêng, trừ 調整控除, làm tròn 100円 từng phần.
 * - 均等割: 標準 4,000円 (道府県1,000 + 市町村3,000) + 超過課税 của tỉnh (nếu có); 森林環境税 1,000円.
 * - 非課税判定: ngưỡng 所得割 và 均等割 tách riêng (1級地).
 * Lưu ý: thu nhập năm N → thuế cư trú 年度 N+1 (nộp từ tháng 6 năm N+1).
 */

import { getLocationRules } from '../taxRulesRegistry.js';
import { roundTaxableIncome, roundFinalTaxAmount } from './incomeTaxEngine.js';
import { calculatePersonalDeductions } from './personalDeductionEngine.js';
import { PERSONAL_DEDUCTION_DIFFERENCES, RESIDENT_TAX_COMMON } from '../rules/shared/deductionTables.js';

/** 住民税の基礎控除 theo 合計所得 (地方税法 第34条第2項) */
export function residentBasicDeduction(totalIncome, standard = 430000) {
  if (totalIncome <= 24000000) return standard;
  if (totalIncome <= 24500000) return 290000;
  if (totalIncome <= 25000000) return 150000;
  return 0;
}

/**
 * Ngưỡng miễn thuế cư trú (非課税限度額, 1級地).
 * - 均等割: 35万円 × 人数 + 10万円 (+21万円 nếu có người phụ thuộc); độc thân 45万円
 * - 所得割: 35万円 × 人数 + 10万円 (+32万円 nếu có người phụ thuộc); độc thân 45万円
 * 人数 = bản thân + 同一生計配偶者 + 扶養親族.
 */
export function getResidentNonTaxableLimits(familyCount = 1, params = RESIDENT_TAX_COMMON.nonTaxable) {
  const n = Math.max(1, Math.floor(Number(familyCount) || 1));
  if (n === 1) {
    return { perCapita: params.singleLimit, incomeLevy: params.singleLimit };
  }
  return {
    perCapita: params.perPerson * n + params.base + params.perCapitaDependentAddition,
    incomeLevy: params.perPerson * n + params.base + params.incomeLevyDependentAddition,
  };
}

/**
 * Kiểm tra miễn thuế cư trú hoàn toàn (cả 均等割 và 所得割).
 * @deprecated Giữ để tương thích; dùng getResidentNonTaxableLimits để tách hai ngưỡng.
 */
export function isResidentTaxExempt({ totalGrossIncome, dependentsCount = 0, hasSpouse = false }) {
  const familyCount = 1 + (hasSpouse ? 1 : 0) + (Number(dependentsCount) || 0);
  return totalGrossIncome <= getResidentNonTaxableLimits(familyCount).perCapita;
}

/** 人的控除額の差の合計 (調整控除用) */
function personalDeductionDifference(personal) {
  const diff = PERSONAL_DEDUCTION_DIFFERENCES;
  let total = diff.basic;
  if (personal.spouseType === 'spouse') total += diff.spouseGeneral;
  if (personal.spouseType === 'spouse_elderly') total += diff.spouseElderly;
  const c = personal.dependentCounts;
  total +=
    c.general * diff.dependentGeneral +
    c.specific * diff.dependentSpecific +
    c.elderlyOther * diff.dependentElderlyOther +
    c.elderlyCohabitant * diff.dependentElderlyCohabitant;
  return total;
}

/**
 * Tính thuế cư trú chi tiết
 * @param {object} params
 * @param {object} params.rules - Tax rules của năm
 * @param {string} [params.prefecture='tokyo']
 * @param {number} params.totalGrossIncome - 合計所得金額
 * @param {number} [params.socialInsurancePaid=0]
 * @param {number} [params.idecoMonthly=0]
 * @param {number} [params.dependentsCount=0] - 一般扶養
 * @param {boolean} [params.hasSpouse=false]
 * @param {number} [params.spouseIncome=0]
 * @param {boolean} [params.spouseIsElderly=false]
 * @param {number} [params.specificDependentsCount=0]
 * @param {number} [params.elderlyDependentsCount=0]
 * @param {number} [params.cohabitingElderlyParentsCount=0]
 * @returns {object} Chi tiết thuế cư trú
 */
export function calculateResidentTax({
  rules,
  prefecture = 'tokyo',
  totalGrossIncome = 0,
  socialInsurancePaid = 0,
  idecoMonthly = 0,
  dependentsCount = 0,
  hasSpouse = false,
  spouseIncome = 0,
  spouseIsElderly = false,
  specificDependentsCount = 0,
  elderlyDependentsCount = 0,
  cohabitingElderlyParentsCount = 0,
}) {
  const loc = getLocationRules(prefecture);
  const rt = { ...RESIDENT_TAX_COMMON, ...(rules?.residentTax || {}) };
  const safeGross = Math.max(0, Number(totalGrossIncome) || 0);
  const safeShaho = Math.max(0, Number(socialInsurancePaid) || 0);
  const safeIdeco = Math.max(0, Number(idecoMonthly) || 0) * 12;

  const personal = calculatePersonalDeductions({
    deductionRules: rules.incomeTax.deductions,
    taxpayerTotalIncome: safeGross,
    hasSpouse,
    spouseIncome,
    spouseIsElderly,
    dependentsCount,
    specificDependentsCount,
    elderlyDependentsCount,
    cohabitingElderlyParentsCount,
    taxType: 'resident',
  });

  // 人数 cho ngưỡng miễn thuế: bản thân + 同一生計配偶者 (合計所得 ≤ 要件) + 扶養親族
  const spouseCounts = hasSpouse && Math.max(0, Number(spouseIncome) || 0) <= rules.incomeTax.deductions.spouseIncomeLimit;
  const familyCount = 1 + (spouseCounts ? 1 : 0) + personal.dependentHeadcount;
  const limits = getResidentNonTaxableLimits(familyCount, rt.nonTaxable);
  const isPerCapitaExempt = safeGross <= limits.perCapita;
  const isIncomeLevyExempt = safeGross <= limits.incomeLevy;

  const base = {
    prefectureName_ja: loc.name_ja,
    prefectureName_vi: loc.name_vi,
    prefectureName_en: loc.name_en,
    familyCount,
    nonTaxableLimits: limits,
    nonTaxableGradeNote_ja: rt.nonTaxable.gradeNote_ja,
    nonTaxableGradeNote_vi: rt.nonTaxable.gradeNote_vi,
    nonTaxableGradeNote_en: rt.nonTaxable.gradeNote_en,
    taxYearLabel_ja: `令和${(rules.year || 2026) - 2018}年度分（${rules.year || 2026}年の所得に対し${(rules.year || 2026) + 1}年6月から納付）`,
    prefectureRate: loc.residentTax.prefectureRate ?? 0.04,
    municipalRate: loc.residentTax.municipalRate ?? 0.06,
    incomeLevyRate: loc.residentTax.incomeLevyRate ?? 0.10,
  };

  if (isPerCapitaExempt) {
    return {
      ...base,
      isExempt: true,
      isIncomeLevyExempt: true,
      isPerCapitaExempt: true,
      exemptReason: '合計所得金額が非課税基準以下のため、住民税（均等割・所得割）および森林環境税は非課税となります。',
      exemptReason_vi: 'Tổng thu nhập nằm dưới ngưỡng miễn thuế cư trú (cả phần đồng đều và phần theo thu nhập).',
      exemptReason_en: 'Total income is within the resident tax exemption threshold (both per-capita and income levy).',
      taxableIncome: 0,
      incomeLevy: 0,
      prefectureIncomeLevy: 0,
      municipalIncomeLevy: 0,
      adjustmentCredit: { prefecture: 0, municipal: 0, total: 0, personalDifference: 0 },
      perCapitaFlat: 0,
      perCapitaSurcharge: 0,
      forestryTax: 0,
      perCapitaTotal: 0,
      totalResidentTax: 0,
    };
  }

  // 1. 所得控除 (住民税基準)
  const basicDeductionResident = residentBasicDeduction(safeGross, rt.basicDeductionResident || 430000);
  const totalDeductionsResident =
    basicDeductionResident + safeShaho + safeIdeco + personal.spouse + personal.dependents;

  // 2. 課税標準額 (1,000円未満切捨て)
  const rawTaxable = Math.max(0, safeGross - totalDeductionsResident);
  const taxableIncome = roundTaxableIncome(rawTaxable);

  // 3. 調整控除 (合計所得 2,500万円以下)
  const adj = rt.adjustmentCredit;
  let adjustmentBase = 0;
  const personalDifference = personalDeductionDifference(personal);
  if (safeGross <= adj.maxTotalIncome && taxableIncome > 0) {
    if (taxableIncome <= adj.thresholdTaxable) {
      adjustmentBase = Math.min(personalDifference, taxableIncome);
    } else {
      adjustmentBase = Math.max(personalDifference - (taxableIncome - adj.thresholdTaxable), adj.minimum / adj.rate);
    }
  }
  const prefCredit = Math.floor(adjustmentBase * adj.prefectureShare);
  const muniCredit = Math.floor(adjustmentBase * adj.municipalShare);

  // 4. 所得割: 道府県・市町村 tính riêng, trừ 調整控除, làm tròn 100円 từng phần
  const prefRate = base.prefectureRate;
  const muniRate = base.municipalRate;
  const grossPrefLevy = Math.floor(taxableIncome * prefRate + 1e-6);
  const grossMuniLevy = Math.floor(taxableIncome * muniRate + 1e-6);
  const prefectureIncomeLevy = isIncomeLevyExempt ? 0 : roundFinalTaxAmount(Math.max(0, grossPrefLevy - prefCredit));
  const municipalIncomeLevy = isIncomeLevyExempt ? 0 : roundFinalTaxAmount(Math.max(0, grossMuniLevy - muniCredit));
  const incomeLevy = prefectureIncomeLevy + municipalIncomeLevy;

  // 5. 均等割 + 森林環境税
  const perCapitaFlat = loc.residentTax.perCapitaFlat ?? rt.perCapitaFlatStandard;
  const perCapitaSurcharge = loc.residentTax.perCapitaSurcharge ?? 0;
  const forestryTax = loc.residentTax.forestryTax ?? rt.forestryTax;
  const perCapitaTotal = perCapitaFlat + forestryTax;

  const totalResidentTax = incomeLevy + perCapitaTotal;

  return {
    ...base,
    isExempt: false,
    isIncomeLevyExempt,
    isPerCapitaExempt: false,
    deductionsResident: {
      basic: basicDeductionResident,
      socialInsurance: safeShaho,
      ideco: safeIdeco,
      spouse: personal.spouse,
      spouseType: personal.spouseType,
      dependents: personal.dependents,
      total: totalDeductionsResident,
    },
    taxableIncome,
    grossPrefectureIncomeLevy: grossPrefLevy,
    grossMunicipalIncomeLevy: grossMuniLevy,
    adjustmentCredit: {
      prefecture: prefCredit,
      municipal: muniCredit,
      total: prefCredit + muniCredit,
      personalDifference,
    },
    prefectureIncomeLevy,
    municipalIncomeLevy,
    incomeLevy,
    perCapitaFlat,
    perCapitaSurcharge,
    forestryTax,
    perCapitaTotal,
    totalResidentTax,
  };
}
