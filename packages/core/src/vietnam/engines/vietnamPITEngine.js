/**
 * @file packages/core/src/vietnam/engines/vietnamPITEngine.js
 * @description Engine tính thuế thu nhập cá nhân (PIT) lũy tiến từng phần 5 bậc 2026 tại Việt Nam.
 * Tái sử dụng chung cho PIT Calculator và Salary Calculator.
 */

import { getPITRules } from '../rules/pitRules.js';
import { getSource } from '../../regulatory/sourceRegistry.js';

/**
 * @typedef {Object} PITTierBreakdown
 * @property {number} tier - Bậc thuế (1-5)
 * @property {string} label_vn - Nhãn tiếng Việt
 * @property {string} label_en - Nhãn tiếng Anh
 * @property {string} label_ja - Nhãn tiếng Nhật
 * @property {number} rate - Thuế suất
 * @property {number} min - Ngưỡng dưới
 * @property {number} max - Ngưỡng trên
 * @property {number} taxableAmount - Thu nhập tính thuế rơi vào bậc này
 * @property {number} taxAmount - Tiền thuế phát sinh tại bậc này
 * @property {string} formula - Chuỗi công thức giải thích
 */

/**
 * Tính thuế TNCN lũy tiến 5 bậc từ Thu nhập tính thuế (Taxable Income).
 * @param {number} taxableIncome - Thu nhập tính thuế sau giảm trừ
 * @param {string|number} [date='2026-09-01'] - Ngày hoặc năm áp dụng
 * @returns {{ totalTax: number, bracketsBreakdown: PITTierBreakdown[], effectiveRate: number, source: any }}
 */
export function calculatePITFromTaxableIncome(taxableIncome, date = '2026-09-01') {
  const safeTaxable = Math.max(0, Math.round(Number(taxableIncome) || 0));
  const pitRule = getPITRules(date);

  let totalTax = 0;
  const bracketsBreakdown = [];

  for (const b of pitRule.brackets) {
    if (safeTaxable <= b.min) {
      bracketsBreakdown.push({
        tier: b.tier,
        label_vn: b.label_vn,
        label_en: b.label_en,
        label_ja: b.label_ja,
        rate: b.rate,
        min: b.min,
        max: b.max,
        taxableAmount: 0,
        taxAmount: 0,
        formula: '0 VND',
      });
      continue;
    }

    const portionInTier = Math.min(safeTaxable - b.min, b.bandwidth);
    const taxInTier = Math.round(portionInTier * b.rate);
    totalTax += taxInTier;

    bracketsBreakdown.push({
      tier: b.tier,
      label_vn: b.label_vn,
      label_en: b.label_en,
      label_ja: b.label_ja,
      rate: b.rate,
      min: b.min,
      max: b.max,
      taxableAmount: portionInTier,
      taxAmount: taxInTier,
      formula: `${portionInTier.toLocaleString('vi-VN')} × ${(b.rate * 100)}% = ${taxInTier.toLocaleString('vi-VN')} VND`,
    });
  }

  const effectiveRate = safeTaxable > 0 ? (totalTax / safeTaxable) : 0;
  const source = getSource(pitRule.metadata.sourceId);

  return {
    taxableIncome: safeTaxable,
    totalTax,
    bracketsBreakdown,
    effectiveRate,
    source,
    metadata: pitRule.metadata,
  };
}

/**
 * Tính thuế TNCN đầy đủ từ Thu nhập gộp (Gross salary), bảo hiểm bắt buộc và người phụ thuộc.
 * @param {number} grossIncome - Thu nhập từ tiền lương, tiền công
 * @param {number} insuranceDeductible - Các khoản bảo hiểm bắt buộc được trừ
 * @param {number} [dependentsCount=0] - Số người phụ thuộc
 * @param {number} [otherDeductions=0] - Các khoản giảm trừ hợp lệ khác (đóng góp từ thiện, hưu trí tự nguyện...)
 * @param {string|number} [date='2026-09-01'] - Ngày hoặc năm áp dụng
 */
export function calculateVietnamPIT(
  grossIncome,
  insuranceDeductible = 0,
  dependentsCount = 0,
  otherDeductions = 0,
  date = '2026-09-01'
) {
  const safeGross = Math.max(0, Math.round(Number(grossIncome) || 0));
  const safeInsurance = Math.max(0, Math.round(Number(insuranceDeductible) || 0));
  const safeDependents = Math.max(0, Math.floor(Number(dependentsCount) || 0));
  const safeOther = Math.max(0, Math.round(Number(otherDeductions) || 0));

  const pitRule = getPITRules(date);
  const personalDeduction = pitRule.deductions.personalMonthly;
  const dependentDeduction = safeDependents * pitRule.deductions.dependentMonthly;
  const totalDeductions = safeInsurance + personalDeduction + dependentDeduction + safeOther;

  // Thu nhập trước giảm trừ gia cảnh (sau khi trừ bảo hiểm bắt buộc)
  const incomeBeforeFamilyDeduction = Math.max(0, safeGross - safeInsurance);

  // Thu nhập tính thuế
  const taxableIncome = Math.max(0, safeGross - totalDeductions);

  // Tính thuế lũy tiến từng phần 5 bậc
  const taxCalc = calculatePITFromTaxableIncome(taxableIncome, date);

  return {
    grossIncome: safeGross,
    insuranceDeductible: safeInsurance,
    incomeBeforeFamilyDeduction,
    personalDeduction,
    dependentDeduction,
    dependentsCount: safeDependents,
    otherDeductions: safeOther,
    totalDeductions,
    taxableIncome,
    totalTax: taxCalc.totalTax,
    bracketsBreakdown: taxCalc.bracketsBreakdown,
    effectiveRate: taxCalc.effectiveRate,
    source: taxCalc.source,
    metadata: pitRule.metadata,
    formula: {
      taxableIncome: `${safeGross.toLocaleString('vi-VN')} - (${safeInsurance.toLocaleString('vi-VN')} + ${personalDeduction.toLocaleString('vi-VN')} + ${dependentDeduction.toLocaleString('vi-VN')}${safeOther > 0 ? ` + ${safeOther.toLocaleString('vi-VN')}` : ''}) = ${taxableIncome.toLocaleString('vi-VN')} VND`,
      totalTaxSummary: taxCalc.bracketsBreakdown
        .filter((b) => b.taxAmount > 0)
        .map((b) => b.formula)
        .join(' + ') || '0 VND',
    }
  };
}
