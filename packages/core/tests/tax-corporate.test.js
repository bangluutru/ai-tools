/**
 * @file packages/core/tests/tax-corporate.test.js
 * @description Unit tests cho corporateTaxEngine (法人税, 地方法人税, 法人住民税, 法人事業税).
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import { getTaxRules } from '../src/utils/tax/taxRulesRegistry.js';
import { calculateCorporateTax } from '../src/utils/tax/engines/corporateTaxEngine.js';

test('calculateCorporateTax accurately computes taxes for 10M JPY profit SME', () => {
  const rules = getTaxRules(2025);
  const result = calculateCorporateTax({
    rules,
    corporateIncome: 10000000,
    capital: 10000000,
    employeeCount: 5,
  });

  // 1. 法人税: 8,000,000 * 15% + 2,000,000 * 23.2% = 1,200,000 + 464,000 = 1,664,000 JPY
  assert.equal(result.corporateTax, 1664000);

  // 2. 地方法人税: 1,664,000 * 10.3% = 171,392 -> round 100 = 171,300 JPY
  assert.equal(result.localCorporateTax, 171300);

  // 3. 法人住民税: 税割 1,664,000 * 7% = 116,480 -> round 100 = 116,400 JPY + 均等割 70,000 = 186,400 JPY
  assert.equal(result.residentIncomeLevy, 116400);
  assert.equal(result.residentPerCapita, 70000);
  assert.equal(result.corporateResidentTax, 186400);

  // 4. 法人事業税: 4,000,000 * 3.5% + 4,000,000 * 5.3% + 2,000,000 * 7% = 140,000 + 212,000 + 140,000 = 492,000 JPY
  assert.equal(result.enterpriseTax, 492000);

  // 5. 特別法人事業税: 492,000 * 37% = 182,040 -> round 100 = 182,000 JPY
  assert.equal(result.specialEnterpriseTax, 182000);

  // Total: 1,664,000 + 171,300 + 186,400 + 492,000 + 182,000 = 2,695,700 JPY (~27% effective on 10M)
  assert.equal(result.totalCorporateTax, 2695700);
  assert.ok(result.effectiveRate > 0.25 && result.effectiveRate < 0.35);
});

test('calculateCorporateTax charges 70,000 JPY per capita flat fee even when company makes zero profit', () => {
  const rules = getTaxRules(2025);
  const result = calculateCorporateTax({
    rules,
    corporateIncome: 0,
    capital: 10000000,
    employeeCount: 2,
  });

  assert.equal(result.corporateTax, 0);
  assert.equal(result.localCorporateTax, 0);
  assert.equal(result.residentIncomeLevy, 0);
  assert.equal(result.residentPerCapita, 70000); // 均等割
  assert.equal(result.corporateResidentTax, 70000);
  assert.equal(result.enterpriseTax, 0);
  assert.equal(result.totalCorporateTax, 70000);
});
