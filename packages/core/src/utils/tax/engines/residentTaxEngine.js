/**
 * @file packages/core/src/utils/tax/engines/residentTaxEngine.js
 * @description Deterministic engine tính thuế cư trú cá nhân (個人住民税) và thuế môi trường rừng (森林環境税).
 * Bao gồm tính 所得割 (thuế theo thu nhập), 均等割 (thuế đồng đều theo đầu người),
 * 森林環境税 (1,000円 từ Reiwa 6) và xét tiêu chuẩn hộ miễn thuế cư trú (非課税判定).
 */

import { getLocationRules } from '../taxRulesRegistry.js';
import { roundTaxableIncome, roundFinalTaxAmount } from './incomeTaxEngine.js';

/**
 * Kiểm tra xem người dùng có thuộc diện miễn thuế cư trú (非課税) hay không.
 * Tiêu chuẩn cấp 1 (Tokyo, các thành phố lớn):
 * - Độc thân: Tổng thu nhập <= 45万円 (tương đương lương 100万円 với mức giảm trừ cũ hoặc theo quy định chuẩn)
 * - Có gia đình: 35万円 * (số người gồm bản thân + phụ thuộc) + 10万円 + 21万円 (nếu có người phụ thuộc)
 */
export function isResidentTaxExempt({ totalGrossIncome, dependentsCount = 0, hasSpouse = false }) {
  const familyCount = 1 + (hasSpouse ? 1 : 0) + dependentsCount;
  let nonTaxableLimit = 450000;

  if (familyCount > 1) {
    nonTaxableLimit = 350000 * familyCount + 100000 + 210000;
  }

  return totalGrossIncome <= nonTaxableLimit;
}

/**
 * Tính thuế cư trú chi tiết
 * @param {object} params
 * @param {object} params.rules - Tax rules của năm
 * @param {string} [params.prefecture='tokyo'] - Mã tỉnh thành
 * @param {number} params.totalGrossIncome - Tổng thu nhập gộp (lương sau giảm trừ lương + kinh doanh sau trừ chi phí)
 * @param {number} [params.socialInsurancePaid=0] - Tiền BHXH đã nộp
 * @param {number} [params.idecoMonthly=0] - Tiền iDeCo hàng tháng
 * @param {number} [params.dependentsCount=0] - Số người phụ thuộc
 * @param {boolean} [params.hasSpouse=false] - Có vợ/chồng
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
}) {
  const loc = getLocationRules(prefecture);
  const safeGross = Math.max(0, Number(totalGrossIncome) || 0);
  const safeShaho = Math.max(0, Number(socialInsurancePaid) || 0);
  const safeIdeco = Math.max(0, Number(idecoMonthly) || 0) * 12;
  const safeDeps = Math.max(0, Number(dependentsCount) || 0);

  // 1. Kiểm tra tiêu chuẩn miễn thuế (非課税判定)
  const exempt = isResidentTaxExempt({
    totalGrossIncome: safeGross,
    dependentsCount: safeDeps,
    hasSpouse,
  });

  if (exempt || safeGross === 0) {
    return {
      isExempt: true,
      exemptReason: '合計所得金額が非課税基準以下のため、住民税は非課税となります。',
      exemptReason_vi: 'Tổng thu nhập nằm dưới ngưỡng tiêu chuẩn miễn thuế cư trú tại địa phương.',
      exemptReason_en: 'Total gross income is within the municipal tax exemption threshold.',
      prefectureName_ja: loc.name_ja,
      prefectureName_vi: loc.name_vi,
      prefectureName_en: loc.name_en,
      taxableIncome: 0,
      incomeLevy: 0,
      prefectureIncomeLevy: 0,
      municipalIncomeLevy: 0,
      perCapitaFlat: 0,
      forestryTax: 0,
      totalResidentTax: 0,
    };
  }

  // 2. 所得控除 cho thuế cư trú (thường thấp hơn thuế quốc gia 5 vạn yên: 基礎控除 43万円, 扶養控除 33万円)
  const basicDeductionResident = rules.residentTax.basicDeductionResident || 430000;
  const spouseDeductionResident = hasSpouse ? 330000 : 0;
  const dependentDeductionResident = safeDeps * 330000;

  const totalDeductionsResident =
    basicDeductionResident +
    safeShaho +
    safeIdeco +
    spouseDeductionResident +
    dependentDeductionResident;

  // 3. Thu nhập chịu thuế cư trú (課税標準額)
  const rawTaxable = Math.max(0, safeGross - totalDeductionsResident);
  const taxableIncome = roundTaxableIncome(rawTaxable);

  // 4. Tính 所得割 (Income Levy)
  const incomeLevyRate = loc.residentTax.incomeLevyRate || 0.10;
  const prefRate = loc.residentTax.prefectureRate || 0.04;
  const muniRate = loc.residentTax.municipalRate || 0.06;

  // Phân chia tỉnh và xã/phường
  const rawPrefLevy = Math.floor(taxableIncome * prefRate);
  const rawMuniLevy = Math.floor(taxableIncome * muniRate);
  const incomeLevy = roundFinalTaxAmount(rawPrefLevy + rawMuniLevy);

  // 5. Tính 均等割 (Per Capita Flat Rate)
  const perCapitaFlat = loc.residentTax.perCapitaFlat || 5000;

  // 6. 森林環境税 (Thuế môi trường rừng quốc gia)
  const forestryTax = loc.residentTax.forestryTax || 1000;

  // 7. Tổng số thuế cư trú
  const totalResidentTax = incomeLevy + perCapitaFlat + forestryTax;

  return {
    isExempt: false,
    prefectureName_ja: loc.name_ja,
    prefectureName_vi: loc.name_vi,
    prefectureName_en: loc.name_en,
    deductionsResident: {
      basic: basicDeductionResident,
      socialInsurance: safeShaho,
      ideco: safeIdeco,
      spouse: spouseDeductionResident,
      dependents: dependentDeductionResident,
      total: totalDeductionsResident,
    },
    taxableIncome,
    incomeLevyRate,
    prefectureIncomeLevy: rawPrefLevy,
    municipalIncomeLevy: rawMuniLevy,
    incomeLevy,
    perCapitaFlat,
    forestryTax,
    totalResidentTax,
  };
}
