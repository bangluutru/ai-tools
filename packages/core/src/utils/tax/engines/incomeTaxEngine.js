/**
 * @file packages/core/src/utils/tax/engines/incomeTaxEngine.js
 * @description Deterministic engine tính toán thuế thu nhập cá nhân (所得税) và thuế tái thiết (復興特別所得税) Nhật Bản.
 * Tuân thủ đầy đủ quy tắc tính toán và làm tròn theo Luật Quản lý thuế Quốc gia (国税通則法第118条・第119条).
 */

/**
 * Làm tròn thu nhập chịu thuế xuống bội số 1,000 yên (国税通則法第118条)
 */
export function roundTaxableIncome(amount) {
  if (!amount || amount < 1000) return 0;
  return Math.floor(amount / 1000) * 1000;
}

/**
 * Làm tròn số tiền thuế phải nộp xuống bội số 100 yên (国税通則法第119条)
 * Nếu số thuế dưới 1,000 yên thì được miễn nộp (bằng 0).
 */
export function roundFinalTaxAmount(amount) {
  if (!amount || amount < 1000) return 0;
  return Math.floor(amount / 100) * 100;
}

/**
 * Tính toán thuế thu nhập chi tiết
 * @param {object} params
 * @param {object} params.rules - Tax rules của năm được chọn (2025 hoặc 2026)
 * @param {number} [params.salary=0] - Lương gộp hàng năm (給与収入)
 * @param {number} [params.businessRevenue=0] - Doanh thu kinh doanh (事業売上)
 * @param {number} [params.businessExpenses=0] - Chi phí kinh doanh (必要経費)
 * @param {string} [params.blueReturnOption='white_0'] - Khấu trừ thuế xanh (etax_65, paper_55, simple_10, white_0)
 * @param {number} [params.sideIncomeRevenue=0] - Doanh thu việc phụ (副業売上)
 * @param {number} [params.sideIncomeExpenses=0] - Chi phí việc phụ (副業経費)
 * @param {number} [params.socialInsurancePaid=0] - Tiền BHXH đã nộp trong năm (社会保険料控除)
 * @param {number} [params.idecoMonthly=0] - Tiền đóng iDeCo hàng tháng
 * @param {number} [params.dependentsCount=0] - Số người phụ thuộc chung
 * @param {boolean} [params.hasSpouse=false] - Có vợ/chồng được giảm trừ
 * @returns {object} Kết quả tính toán kèm diễn giải từng bước
 */
export function calculateIncomeTax({
  rules,
  salary = 0,
  businessRevenue = 0,
  businessExpenses = 0,
  blueReturnOption = 'white_0',
  sideIncomeRevenue = 0,
  sideIncomeExpenses = 0,
  socialInsurancePaid = 0,
  idecoMonthly = 0,
  dependentsCount = 0,
  hasSpouse = false,
}) {
  const safeSalary = Math.max(0, Number(salary) || 0);
  const safeBizRev = Math.max(0, Number(businessRevenue) || 0);
  const safeBizExp = Math.max(0, Number(businessExpenses) || 0);
  const safeSideRev = Math.max(0, Number(sideIncomeRevenue) || 0);
  const safeSideExp = Math.max(0, Number(sideIncomeExpenses) || 0);
  const safeShaho = Math.max(0, Number(socialInsurancePaid) || 0);
  const safeIdeco = Math.max(0, Number(idecoMonthly) || 0) * 12;
  const safeDeps = Math.max(0, Number(dependentsCount) || 0);

  // 1. 給与所得控除 (Khấu trừ tiền lương)
  const employmentDeduction = safeSalary > 0
    ? rules.incomeTax.employmentDeduction.calc(safeSalary)
    : 0;
  const employmentIncome = Math.max(0, safeSalary - employmentDeduction);

  // 2. 青色申告特別控除 (Khấu trừ thuế xanh)
  let blueDeductionAmount = 0;
  if (blueReturnOption === 'etax_65') {
    blueDeductionAmount = rules.incomeTax.blueReturnDeduction.eTaxFull;
  } else if (blueReturnOption === 'paper_55') {
    blueDeductionAmount = rules.incomeTax.blueReturnDeduction.paperFull;
  } else if (blueReturnOption === 'simple_10') {
    blueDeductionAmount = rules.incomeTax.blueReturnDeduction.simplified;
  }

  // Thu nhập kinh doanh (không âm, tối đa khấu trừ bằng lợi nhuận ròng)
  const netBizBeforeBlue = Math.max(0, safeBizRev - safeBizExp);
  const actualBlueApplied = Math.min(netBizBeforeBlue, blueDeductionAmount);
  const businessIncome = Math.max(0, netBizBeforeBlue - actualBlueApplied);

  // 3. Thu nhập việc phụ (副業 - 雑所得)
  const sideIncome = Math.max(0, safeSideRev - safeSideExp);

  // 4. Tổng thu nhập (合計所得金額)
  const totalGrossIncome = employmentIncome + businessIncome + sideIncome;

  // 5. 基礎控除 (Khấu trừ cơ bản theo mức thu nhập)
  let basicDeduction = rules.incomeTax.basicDeduction.standard;
  for (const phase of rules.incomeTax.basicDeduction.phases) {
    if (totalGrossIncome <= (phase.maxTotalIncome || Infinity)) {
      basicDeduction = phase.amount;
      break;
    }
  }

  // 6. Các khoản khấu trừ khác
  const spouseDeduction = hasSpouse ? rules.incomeTax.deductions.spouseStandard : 0;
  const dependentDeduction = safeDeps * rules.incomeTax.deductions.dependentGeneral;
  const totalIncomeDeductions =
    basicDeduction +
    safeShaho +
    safeIdeco +
    spouseDeduction +
    dependentDeduction;

  // 7. Thu nhập tính thuế (課税所得金額)
  const rawTaxableIncome = Math.max(0, totalGrossIncome - totalIncomeDeductions);
  const taxableIncome = roundTaxableIncome(rawTaxableIncome);

  // 8. Áp biểu thuế lũy tiến 7 bậc (速算表)
  let baseIncomeTaxBeforeRounding = 0;
  let appliedBracket = rules.incomeTax.brackets[0];

  if (taxableIncome > 0) {
    for (const b of rules.incomeTax.brackets) {
      if (taxableIncome <= b.limit) {
        appliedBracket = b;
        baseIncomeTaxBeforeRounding = Math.max(0, Math.floor(taxableIncome * b.rate - b.deduction));
        break;
      }
    }
  }

  // 9. Làm tròn thuế cơ sở (国税通則法第119条: làm tròn xuống bội số 100円)
  const baseIncomeTax = roundFinalTaxAmount(baseIncomeTaxBeforeRounding);

  // 10. Thuế tái thiết 復興特別所得税 (2.1% của thuế thu nhập cơ sở)
  // Tính trên số thuế cơ sở trước khi làm tròn hoặc sau làm tròn theo thông tư NTA
  const rawReconstruction = baseIncomeTax * rules.incomeTax.reconstructionTaxRate;
  const reconstructionTax = baseIncomeTax > 0 ? Math.floor(rawReconstruction) : 0;

  // 11. Tổng thuế thu nhập thực tế
  const totalIncomeTax = baseIncomeTax + reconstructionTax;

  return {
    salary: safeSalary,
    employmentDeduction,
    employmentIncome,
    businessRevenue: safeBizRev,
    businessExpenses: safeBizExp,
    blueReturnDeduction: actualBlueApplied,
    businessIncome,
    sideIncomeRevenue: safeSideRev,
    sideIncomeExpenses: safeSideExp,
    sideIncome,
    totalGrossIncome,
    deductions: {
      basic: basicDeduction,
      socialInsurance: safeShaho,
      ideco: safeIdeco,
      spouse: spouseDeduction,
      dependents: dependentDeduction,
      total: totalIncomeDeductions,
    },
    rawTaxableIncome,
    taxableIncome,
    bracket: {
      rate: appliedBracket.rate,
      deduction: appliedBracket.deduction,
    },
    baseIncomeTax,
    reconstructionTax,
    totalIncomeTax,
  };
}
