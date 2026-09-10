/**
 * @file packages/core/tests/tax-income.test.js
 * @description Unit tests cho incomeTaxEngine (所得税, 復興特別所得税, 給与所得控除, 基礎控除).
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import { getTaxRules } from '../src/utils/tax/taxRulesRegistry.js';
import {
  calculateIncomeTax,
  roundTaxableIncome,
  roundFinalTaxAmount,
} from '../src/utils/tax/engines/incomeTaxEngine.js';

test('roundTaxableIncome cuts off numbers under 1,000 JPY according to National Tax Collection Act Art. 118', () => {
  assert.equal(roundTaxableIncome(1999), 1000);
  assert.equal(roundTaxableIncome(1000), 1000);
  assert.equal(roundTaxableIncome(999), 0);
  assert.equal(roundTaxableIncome(0), 0);
  assert.equal(roundTaxableIncome(5423850), 5423000);
});

test('roundFinalTaxAmount cuts off numbers under 100 JPY according to National Tax Collection Act Art. 119', () => {
  assert.equal(roundFinalTaxAmount(1050), 1000);
  assert.equal(roundFinalTaxAmount(999), 0); // Thuế dưới 1,000 yên thì miễn nộp (Điều 119 khoản 1)
  assert.equal(roundFinalTaxAmount(100), 0); // Dưới 1,000円
  assert.equal(roundFinalTaxAmount(1000), 1000);
  assert.equal(roundFinalTaxAmount(123456), 123400);
});

test('calculateIncomeTax accurately computes brackets for standard 5,000,000 JPY salary in 2025', () => {
  const rules = getTaxRules(2025);
  const result = calculateIncomeTax({
    rules,
    salary: 5000000,
    socialInsurancePaid: 750000,
    dependentsCount: 0,
    hasSpouse: false,
  });

  assert.equal(result.salary, 5000000);
  // 給与所得控除: 5,000,000 * 0.2 + 440,000 = 1,440,000 JPY
  assert.equal(result.employmentDeduction, 1440000);
  assert.equal(result.employmentIncome, 3560000);

  // 基礎控除 480,000 + 社保 750,000 = 1,230,000 JPY
  assert.equal(result.deductions.basic, 480000);
  assert.equal(result.deductions.socialInsurance, 750000);

  // 課税所得 = 3,560,000 - 1,230,000 = 2,330,000 JPY
  assert.equal(result.taxableIncome, 2330000);

  // Thuế cơ sở = 2,330,000 * 10% - 97,500 = 135,500 JPY -> làm tròn xuống 100: 135,500 JPY
  assert.equal(result.baseIncomeTax, 135500);

  // Thuế tái thiết 2.1%: 135,500 * 0.021 = 2,845.5 -> floor = 2,845 JPY
  assert.equal(result.reconstructionTax, 2845);

  // Tổng thuế: 135,500 + 2,845 = 138,345 JPY
  assert.equal(result.totalIncomeTax, 138345);
});

test('calculateIncomeTax calculates sole proprietor with blue return 650,000 JPY', () => {
  const rules = getTaxRules(2025);
  const result = calculateIncomeTax({
    rules,
    businessRevenue: 8000000,
    businessExpenses: 2000000,
    blueReturnOption: 'etax_65',
    socialInsurancePaid: 600000,
  });

  // Net before blue = 6,000,000; blue = 650,000 -> businessIncome = 5,350,000 JPY
  assert.equal(result.businessIncome, 5350000);
  assert.equal(result.blueReturnDeduction, 650000);
  assert.ok(result.totalIncomeTax > 0);
});
