/**
 * @file packages/core/tests/tax-enterprise.test.js
 * @description Unit tests cho enterpriseTaxEngine (個人事業税).
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import { getTaxRules } from '../src/utils/tax/taxRulesRegistry.js';
import {
  calculateEnterpriseTax,
  BusinessCategories,
} from '../src/utils/tax/engines/enterpriseTaxEngine.js';

test('BusinessCategories contains 7 distinct options covering Type 1, 2, 3 and exempt', () => {
  assert.equal(BusinessCategories.length, 7);
  const type1 = BusinessCategories.find((c) => c.type === 'type1');
  assert.equal(type1.rate, 0.05);

  const nonTaxable = BusinessCategories.find((c) => c.type === 'non_taxable');
  assert.equal(nonTaxable.rate, 0.0);
});

test('calculateEnterpriseTax applies 2.9M JPY deduction on 5M JPY income for Type 1 (5%)', () => {
  const rules = getTaxRules(2025);
  const result = calculateEnterpriseTax({
    rules,
    businessIncome: 5000000,
    categoryId: 'type1_retail_dining',
    operatingMonths: 12,
  });

  assert.equal(result.rate, 0.05);
  assert.equal(result.proprietorDeduction, 2900000);
  // 5,000,000 - 2,900,000 = 2,100,000 JPY
  assert.equal(result.taxableIncome, 2100000);
  // 2,100,000 * 5% = 105,000 JPY
  assert.equal(result.enterpriseTax, 105000);
});

test('calculateEnterpriseTax pro-rates deduction for 6 operating months', () => {
  const rules = getTaxRules(2025);
  const result = calculateEnterpriseTax({
    rules,
    businessIncome: 3000000,
    categoryId: 'type1_retail_dining',
    operatingMonths: 6,
  });

  // 2,900,000 * 6 / 12 = 1,450,000 JPY
  assert.equal(result.proprietorDeduction, 1450000);
  // 3,000,000 - 1,450,000 = 1,550,000 JPY
  assert.equal(result.taxableIncome, 1550000);
  // 1,550,000 * 5% = 77,500 JPY
  assert.equal(result.enterpriseTax, 77500);
});

test('calculateEnterpriseTax returns zero for income below 2.9M JPY', () => {
  const rules = getTaxRules(2025);
  const result = calculateEnterpriseTax({
    rules,
    businessIncome: 2800000,
    categoryId: 'type1_retail_dining',
    operatingMonths: 12,
  });

  assert.equal(result.isBelowDeduction, true);
  assert.equal(result.taxableIncome, 0);
  assert.equal(result.enterpriseTax, 0);
});
