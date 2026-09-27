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
  assert.equal(roundFinalTaxAmount(999), 900); // Chỉ bỏ phần dưới 100 yên (Điều 119)
  assert.equal(roundFinalTaxAmount(100), 100);
  assert.equal(roundFinalTaxAmount(99), 0);
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

  // 基礎控除 (令和7年分, 合計所得 356万円 ≤ 489万円) 680,000 + 社保 750,000 = 1,430,000 JPY
  assert.equal(result.deductions.basic, 680000);
  assert.equal(result.deductions.socialInsurance, 750000);

  // 課税所得 = 3,560,000 - 1,430,000 = 2,130,000 JPY
  assert.equal(result.taxableIncome, 2130000);

  // 基準所得税額 = 2,130,000 * 10% - 97,500 = 115,500 JPY
  assert.equal(result.baseIncomeTax, 115500);

  // 復興特別所得税 2.1%: 115,500 * 0.021 = 2,425.5 -> floor = 2,425 JPY
  assert.equal(result.reconstructionTax, 2425);

  // 合計 117,925 -> 100円未満切捨て = 117,900 JPY
  assert.equal(result.totalIncomeTax, 117900);
  assert.equal(result.roundingAdjustment, -25);
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
