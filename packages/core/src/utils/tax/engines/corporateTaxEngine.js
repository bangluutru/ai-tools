/**
 * @file packages/core/src/utils/tax/engines/corporateTaxEngine.js
 * @description Deterministic engine tính trọn gói các loại thuế doanh nghiệp vừa và nhỏ tại Nhật Bản.
 * Bao gồm: 法人税 (quốc gia), 地方法人税 (10.3%), 法人住民税 (法人税割 + 均等割 tối thiểu 70,000円 kể cả lỗ),
 * 法人事業税 (theo bậc lợi nhuận), và 特別法人事業税 (37%).
 */

import { roundTaxableIncome, roundFinalTaxAmount } from './incomeTaxEngine.js';

/**
 * Tính toán trọn gói các loại thuế doanh nghiệp
 * @param {object} params
 * @param {object} params.rules - Tax rules của năm
 * @param {number} params.corporateIncome - Thu nhập tính thuế của công ty (Lợi nhuận kế toán trước thuế sau điều chỉnh)
 * @param {number} [params.capital=10000000] - Vốn điều lệ (mặc định <= 1,000万円)
 * @param {number} [params.employeeCount=10] - Số lượng nhân viên
 * @returns {object} Chi tiết từng loại thuế doanh nghiệp
 */
export function calculateCorporateTax({
  rules,
  corporateIncome = 0,
  capital = 10000000,
  employeeCount = 10,
}) {
  const safeIncome = Math.max(0, Number(corporateIncome) || 0);
  const taxableIncome = roundTaxableIncome(safeIncome);
  const safeCapital = Number(capital) || 10000000;
  const safeEmployees = Number(employeeCount) || 1;

  // 1. 法人税 (National Corporate Tax) - Dành cho SME vốn <= 1億円
  let nationalTaxBeforeRounding = 0;
  if (taxableIncome > 0) {
    if (taxableIncome <= 8000000) {
      nationalTaxBeforeRounding = taxableIncome * (rules.corporateTax.nationalRateBelow8M || 0.15);
    } else {
      const lowerPart = 8000000 * (rules.corporateTax.nationalRateBelow8M || 0.15);
      const upperPart = (taxableIncome - 8000000) * (rules.corporateTax.nationalRateAbove8M || 0.232);
      nationalTaxBeforeRounding = lowerPart + upperPart;
    }
  }
  const corporateTax = roundFinalTaxAmount(nationalTaxBeforeRounding);

  // 2. 地方法人税 (Local Corporate Tax) = 法人税 * 10.3%
  const localCorporateTax = corporateTax > 0
    ? roundFinalTaxAmount(corporateTax * (rules.corporateTax.localCorporateTaxRate || 0.103))
    : 0;

  // 3. 法人住民税 (Corporate Inhabitant Tax)
  // 3.1. 法人税割 = 法人税 * ~7.0%
  const residentIncomeLevy = corporateTax > 0
    ? roundFinalTaxAmount(corporateTax * (rules.corporateTax.residentTaxInhabitantRate || 0.07))
    : 0;

  // 3.2. 均等割 (Per Capita Flat Rate) - Phải nộp cả khi doanh nghiệp không có lãi (赤字)
  // Chuẩn: Vốn <= 1,000万円 & NV <= 50 người là 70,000円 (Tỉnh 20,000 + Xã 50,000)
  let residentPerCapita = 70000;
  if (safeCapital > 10000000 && safeCapital <= 100000000) {
    residentPerCapita = safeEmployees <= 50 ? 180000 : 200000;
  }
  const corporateResidentTax = residentIncomeLevy + residentPerCapita;

  // 4. 法人事業税 (Corporate Enterprise Tax - 所得割)
  // Lũy tiến: <= 400万 (3.5%), 400万〜800万 (5.3%), > 800万 (7.0%)
  let rawEnterpriseTax = 0;
  if (taxableIncome > 0) {
    if (taxableIncome <= 4000000) {
      rawEnterpriseTax = taxableIncome * 0.035;
    } else if (taxableIncome <= 8000000) {
      rawEnterpriseTax = 4000000 * 0.035 + (taxableIncome - 4000000) * 0.053;
    } else {
      rawEnterpriseTax =
        4000000 * 0.035 +
        4000000 * 0.053 +
        (taxableIncome - 8000000) * 0.070;
    }
  }
  const enterpriseTax = roundFinalTaxAmount(rawEnterpriseTax);

  // 5. 特別法人事業税 (Special Corporate Enterprise Tax) = 法人事業税所得割 * 37%
  const specialEnterpriseTax = enterpriseTax > 0
    ? roundFinalTaxAmount(enterpriseTax * (rules.corporateTax.specialEnterpriseTaxRate || 0.37))
    : 0;

  // 6. Tổng thuế doanh nghiệp
  const totalCorporateTax =
    corporateTax +
    localCorporateTax +
    corporateResidentTax +
    enterpriseTax +
    specialEnterpriseTax;

  // Tỷ lệ thực tế (Effective corporate tax rate)
  const effectiveRate = safeIncome > 0 ? totalCorporateTax / safeIncome : 0;

  return {
    taxableIncome,
    capital: safeCapital,
    employeeCount: safeEmployees,
    corporateTax,
    localCorporateTax,
    residentIncomeLevy,
    residentPerCapita,
    corporateResidentTax,
    enterpriseTax,
    specialEnterpriseTax,
    totalCorporateTax,
    effectiveRate,
  };
}
