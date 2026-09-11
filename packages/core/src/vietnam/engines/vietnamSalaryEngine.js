/**
 * @file packages/core/src/vietnam/engines/vietnamSalaryEngine.js
 * @description Engine tính chuyển đổi lương Gross ↔ Net 2 chiều và chi phí doanh nghiệp (Employer Cost) tại Việt Nam.
 * Tái sử dụng trực tiếp vietnamInsuranceEngine và vietnamPITEngine.
 */

import { calculateVietnamInsurance } from './vietnamInsuranceEngine.js';
import { calculateVietnamPIT } from './vietnamPITEngine.js';

/**
 * Tính Gross -> Net cho người lao động tại Việt Nam.
 * @param {Object} params
 * @param {number} params.grossSalary - Thu nhập Gross tháng
 * @param {number} [params.insuranceSalary] - Tiền lương làm căn cứ đóng BHXH (nếu để trống hoặc null, mặc định bằng Gross)
 * @param {number} [params.region=1] - Vùng lương tối thiểu (1, 2, 3, 4)
 * @param {number} [params.dependents=0] - Số người phụ thuộc
 * @param {number} [params.otherDeductions=0] - Khoản giảm trừ khác
 * @param {string|Date} [params.date='2026-09-01'] - Thời điểm áp dụng
 * @returns {Object} Kết quả bóc tách chi tiết lương Gross, BHXH, Thuế TNCN, Net và Chi phí doanh nghiệp
 */
export function calculateGrossToNet({
  grossSalary = 0,
  insuranceSalary = null,
  region = 1,
  dependents = 0,
  otherDeductions = 0,
  date = '2026-09-01',
}) {
  const safeGross = Math.max(0, Math.round(Number(grossSalary) || 0));
  const safeInsuranceBase = insuranceSalary !== null && insuranceSalary !== undefined
    ? Math.max(0, Math.round(Number(insuranceSalary) || 0))
    : safeGross;
  const safeRegion = [1, 2, 3, 4].includes(Number(region)) ? Number(region) : 1;
  const safeDependents = Math.max(0, Math.floor(Number(dependents) || 0));
  const safeOther = Math.max(0, Math.round(Number(otherDeductions) || 0));

  // Kiểm tra cảnh báo nếu mức lương đóng bảo hiểm lớn hơn Gross salary
  const isInsuranceBaseHigherThanGross = safeInsuranceBase > safeGross;
  const warning = isInsuranceBaseHigherThanGross
    ? 'Mức lương đóng bảo hiểm đang lớn hơn Gross salary. Vui lòng kiểm tra lại dữ liệu.'
    : null;

  // 1. Tính bảo hiểm (NLĐ và Doanh nghiệp)
  const insurance = calculateVietnamInsurance(safeInsuranceBase, safeRegion, date);

  // 2. Thu nhập trước giảm trừ gia cảnh (Gross trừ bảo hiểm người lao động đóng)
  const incomeBeforeFamilyDeduction = Math.max(0, safeGross - insurance.employee.total);

  // 3. Tính thuế thu nhập cá nhân (PIT)
  const pit = calculateVietnamPIT(
    safeGross,
    insurance.employee.total,
    safeDependents,
    safeOther,
    date
  );

  // 4. Lương thực nhận (Net)
  const netSalary = safeGross - insurance.employee.total - pit.totalTax;

  // 5. Chi phí ước tính của Doanh nghiệp (Employer cost)
  const employerCost = safeGross + insurance.employer.total;

  return {
    mode: 'grossToNet',
    grossSalary: safeGross,
    insuranceSalary: safeInsuranceBase,
    isCustomInsuranceBase: insuranceSalary !== null && insuranceSalary !== undefined && insuranceSalary !== safeGross,
    isInsuranceBaseHigherThanGross,
    warning,
    region: safeRegion,
    regionName: insurance.regionName,
    dependents: safeDependents,
    otherDeductions: safeOther,
    date,

    // Bảo hiểm người lao động
    employeeInsurance: {
      bhxh: insurance.employee.bhxh,
      bhyt: insurance.employee.bhyt,
      bhtn: insurance.employee.bhtn,
      total: insurance.employee.total,
      isBhxhCapped: insurance.isBhxhCapped,
      isBhtnCapped: insurance.isBhtnCapped,
    },

    // Giảm trừ và thuế
    incomeBeforeFamilyDeduction,
    personalDeduction: pit.personalDeduction,
    dependentDeduction: pit.dependentDeduction,
    totalDeductions: pit.totalDeductions,
    taxableIncome: pit.taxableIncome,
    pitTax: pit.totalTax,
    pitBracketsBreakdown: pit.bracketsBreakdown,
    effectiveTaxRate: pit.effectiveRate,

    // Kết quả cuối cùng
    netSalary,
    employerCost,
    employerInsurance: insurance.employer,

    // Nguồn & Metadata
    sources: insurance.applicableRules.sources,
  };
}

/**
 * Tính Net -> Gross (Thuật toán giải ngược chính xác từng đồng VND bằng tìm kiếm nhị phân).
 * @param {Object} params
 * @param {number} params.netSalary - Thu nhập thực nhận mong muốn
 * @param {number} [params.insuranceSalary] - Mức đóng bảo hiểm cố định (nếu có; nếu null, lương đóng bảo hiểm sẽ tự tìm theo Gross)
 * @param {number} [params.region=1]
 * @param {number} [params.dependents=0]
 * @param {number} [params.otherDeductions=0]
 * @param {string|Date} [params.date='2026-09-01']
 * @returns {Object} Kết quả tính Gross tương ứng
 */
export function calculateNetToGross({
  netSalary = 0,
  insuranceSalary = null,
  region = 1,
  dependents = 0,
  otherDeductions = 0,
  date = '2026-09-01',
}) {
  const targetNet = Math.max(0, Math.round(Number(netSalary) || 0));
  if (targetNet === 0) {
    return calculateGrossToNet({
      grossSalary: 0,
      insuranceSalary,
      region,
      dependents,
      otherDeductions,
      date,
    });
  }

  // Tìm kiếm nhị phân (Binary Search) tìm Gross chính xác
  let low = targetNet;
  let high = Math.max(targetNet * 2, targetNet + 150_000_000);
  let bestGross = targetNet;

  // Thu hẹp khoảng tìm kiếm
  for (let i = 0; i < 70; i++) {
    const mid = Math.round((low + high) / 2);
    const sim = calculateGrossToNet({
      grossSalary: mid,
      insuranceSalary: insuranceSalary !== null ? insuranceSalary : null,
      region,
      dependents,
      otherDeductions,
      date,
    });

    if (sim.netSalary === targetNet) {
      bestGross = mid;
      break;
    } else if (sim.netSalary < targetNet) {
      low = mid + 1;
      bestGross = mid;
    } else {
      high = mid - 1;
      bestGross = mid;
    }
  }

  // Tinh chỉnh từng bước 1 VND quanh nghiệm
  let finalGross = bestGross;
  let minDiff = Infinity;
  for (let delta = -5; delta <= 5; delta++) {
    const candidateGross = Math.max(0, bestGross + delta);
    const sim = calculateGrossToNet({
      grossSalary: candidateGross,
      insuranceSalary: insuranceSalary !== null ? insuranceSalary : null,
      region,
      dependents,
      otherDeductions,
      date,
    });
    const diff = Math.abs(sim.netSalary - targetNet);
    if (diff < minDiff) {
      minDiff = diff;
      finalGross = candidateGross;
    }
  }

  const result = calculateGrossToNet({
    grossSalary: finalGross,
    insuranceSalary: insuranceSalary !== null ? insuranceSalary : null,
    region,
    dependents,
    otherDeductions,
    date,
  });

  result.mode = 'netToGross';
  result.targetNet = targetNet;
  return result;
}
