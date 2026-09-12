/**
 * @file packages/core/src/vietnam/engines/vietnamInsuranceEngine.js
 * @description Engine tính chi tiết Bảo hiểm bắt buộc (BHXH, BHYT, BHTN, TNLĐ-BNN) tại Việt Nam.
 * Hỗ trợ tái sử dụng cho Salary Calculator, BHXH Calculator và các phân hệ tiền lương.
 */

import { getInsuranceRules } from '../rules/socialInsuranceRules.js';
import { getMinimumWageRules } from '../rules/minimumWageRules.js';
import { getSource } from '../../regulatory/sourceRegistry.js';

/**
 * @typedef {Object} InsuranceCalculationResult
 * @property {number} insuranceBase - Mức lương đóng bảo hiểm khai báo
 * @property {number} cappedBhxhSalary - Mức lương tính BHXH/BHYT sau khi áp trần
 * @property {number} cappedBhtnSalary - Mức lương tính BHTN sau khi áp trần vùng
 * @property {number} bhxhCeiling - Mức trần BHXH/BHYT áp dụng
 * @property {number} bhtnCeiling - Mức trần BHTN áp dụng
 * @property {boolean} isBhxhCapped - Có bị chạm trần BHXH/BHYT không
 * @property {boolean} isBhtnCapped - Có bị chạm trần BHTN không
 * @property {Object} employee - Chi tiết phần người lao động đóng (10.5%)
 * @property {Object} employer - Chi tiết phần người sử dụng lao động đóng (21.5%)
 * @property {number} totalCombined - Tổng đóng cả 2 bên (32%)
 * @property {Object} applicableRules - Thông tin quy tắc và nguồn pháp lý
 * @property {Object} formula - Chuỗi công thức giải thích từng cấu phần
 */

/**
 * Tính chi tiết các khoản bảo hiểm bắt buộc theo mức lương, vùng và ngày tính.
 * @param {number} salaryBase - Mức tiền lương làm căn cứ đóng bảo hiểm
 * @param {number} [region=1] - Vùng lương tối thiểu (1, 2, 3, 4)
 * @param {string|Date} [date='2026-09-01'] - Ngày hoặc tháng/năm áp dụng
 * @returns {InsuranceCalculationResult}
 */
export function calculateVietnamInsurance(salaryBase, region = 1, date = '2026-09-01') {
  const safeSalary = Math.max(0, Math.round(Number(salaryBase) || 0));
  const safeRegion = [1, 2, 3, 4].includes(Number(region)) ? Number(region) : 1;

  const insuranceRule = getInsuranceRules(date);
  const minWageRule = getMinimumWageRules(date);
  const regionConfig = minWageRule.regions[safeRegion] || minWageRule.regions[1];

  const bhxhCeiling = insuranceRule.maxBhxhBhytSalary;
  const bhtnCeiling = regionConfig.maxBhtnSalary;

  const cappedBhxhSalary = Math.min(safeSalary, bhxhCeiling);
  const cappedBhtnSalary = Math.min(safeSalary, bhtnCeiling);

  const isBhxhCapped = safeSalary > bhxhCeiling;
  const isBhtnCapped = safeSalary > bhtnCeiling;

  // 1. Phần Người lao động đóng (NLĐ)
  const empBhxh = Math.round(cappedBhxhSalary * insuranceRule.employeeRates.bhxh);
  const empBhyt = Math.round(cappedBhxhSalary * insuranceRule.employeeRates.bhyt);
  const empBhtn = Math.round(cappedBhtnSalary * insuranceRule.employeeRates.bhtn);
  const employeeTotal = empBhxh + empBhyt + empBhtn;

  // 2. Phần Người sử dụng lao động đóng (NSDLĐ / Doanh nghiệp)
  const compBhxhRetirement = Math.round(cappedBhxhSalary * insuranceRule.employerRates.bhxhRetirement);
  const compBhxhMaternity = Math.round(cappedBhxhSalary * insuranceRule.employerRates.bhxhMaternity);
  const compBhxhTotal = compBhxhRetirement + compBhxhMaternity;
  const compBhyt = Math.round(cappedBhxhSalary * insuranceRule.employerRates.bhyt);
  const compBhtn = Math.round(cappedBhtnSalary * insuranceRule.employerRates.bhtn);
  const compOccupationalAccident = Math.round(cappedBhxhSalary * insuranceRule.employerRates.occupationalAccident);
  const employerTotal = compBhxhTotal + compBhyt + compBhtn + compOccupationalAccident;

  const totalCombined = employeeTotal + employerTotal;

  // Nguồn pháp lý
  const sourceInsurance = getSource(insuranceRule.metadata.sourceId);
  const sourceMinWage = getSource(minWageRule.metadata.sourceId);

  return {
    insuranceBase: safeSalary,
    region: safeRegion,
    regionName: regionConfig.name_vn,
    cappedBhxhSalary,
    cappedBhtnSalary,
    bhxhCeiling,
    bhtnCeiling,
    baseSalaryReference: insuranceRule.baseSalary,
    regionalMinWage: regionConfig.minWage,
    salaryBase: {
      bhxhBase: cappedBhxhSalary,
      bhtnBase: cappedBhtnSalary,
      declared: safeSalary,
    },
    isBhxhCapped,
    isBhtnCapped,
    employee: {
      bhxh: empBhxh,
      bhyt: empBhyt,
      bhtn: empBhtn,
      total: employeeTotal,
      isBhxhCapped,
      isBhtnCapped,
      rateBreakdown: {
        bhxh: insuranceRule.employeeRates.bhxh,
        bhyt: insuranceRule.employeeRates.bhyt,
        bhtn: insuranceRule.employeeRates.bhtn,
        total: insuranceRule.employeeRates.total,
      }
    },
    employer: {
      bhxhRetirement: compBhxhRetirement,
      bhxhMaternity: compBhxhMaternity,
      bhxhSicknessMaternity: compBhxhMaternity,
      bhxhTotal: compBhxhTotal,
      bhyt: compBhyt,
      bhtn: compBhtn,
      occupationalAccident: compOccupationalAccident,
      bhxhAccident: compOccupationalAccident,
      total: employerTotal,
      isBhxhCapped,
      isBhtnCapped,
      rateBreakdown: {
        bhxhRetirement: insuranceRule.employerRates.bhxhRetirement,
        bhxhMaternity: insuranceRule.employerRates.bhxhMaternity,
        bhxhTotal: insuranceRule.employerRates.bhxhTotal,
        bhyt: insuranceRule.employerRates.bhyt,
        bhtn: insuranceRule.employerRates.bhtn,
        occupationalAccident: insuranceRule.employerRates.occupationalAccident,
        total: insuranceRule.employerRates.totalNormal,
      }
    },
    combined: {
      bhxhRetirement: empBhxh + compBhxhRetirement,
      bhxhSicknessMaternity: compBhxhMaternity,
      bhxhAccident: compOccupationalAccident,
      bhxhTotal: empBhxh + compBhxhTotal,
      bhyt: empBhyt + compBhyt,
      bhtn: empBhtn + compBhtn,
      total: totalCombined,
    },
    totalCombined,
    applicableRules: {
      insuranceRuleMeta: insuranceRule.metadata,
      minWageRuleMeta: minWageRule.metadata,
      sources: [sourceInsurance, sourceMinWage].filter(Boolean),
    },
    formula: {
      employeeBhxh: `min(${safeSalary.toLocaleString('vi-VN')}, ${bhxhCeiling.toLocaleString('vi-VN')}) × 8% = ${empBhxh.toLocaleString('vi-VN')} VND`,
      employeeBhyt: `min(${safeSalary.toLocaleString('vi-VN')}, ${bhxhCeiling.toLocaleString('vi-VN')}) × 1.5% = ${empBhyt.toLocaleString('vi-VN')} VND`,
      employeeBhtn: `min(${safeSalary.toLocaleString('vi-VN')}, ${bhtnCeiling.toLocaleString('vi-VN')}) × 1% = ${empBhtn.toLocaleString('vi-VN')} VND`,
      employeeTotal: `${empBhxh.toLocaleString('vi-VN')} + ${empBhyt.toLocaleString('vi-VN')} + ${empBhtn.toLocaleString('vi-VN')} = ${employeeTotal.toLocaleString('vi-VN')} VND`,
      employerTotal: `BHXH 17% (${compBhxhTotal.toLocaleString('vi-VN')}) + BHYT 3% (${compBhyt.toLocaleString('vi-VN')}) + BHTN 1% (${compBhtn.toLocaleString('vi-VN')}) + TNLĐ-BNN 0.5% (${compOccupationalAccident.toLocaleString('vi-VN')}) = ${employerTotal.toLocaleString('vi-VN')} VND`,
    }
  };
}
