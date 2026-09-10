/**
 * @file packages/core/tests/tax-boundary-and-rounding.test.js
 * @description Strict Boundary and Rounding tests (¥1 below threshold, exact threshold, ¥1 above threshold).
 * Kiểm tra các ngưỡng giới hạn quan trọng và quy tắc làm tròn theo Luật thuế Nhật Bản.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import { getTaxRules } from '../src/utils/tax/taxRulesRegistry.js';
import { roundTaxableIncome, roundFinalTaxAmount } from '../src/utils/tax/engines/incomeTaxEngine.js';
import { calculateEnterpriseTax } from '../src/utils/tax/engines/enterpriseTaxEngine.js';
import { determineTaxableStatus } from '../src/utils/tax/engines/consumptionTaxEngine.js';
import { assessFilingNecessity } from '../src/utils/tax/engines/taxContextEngine.js';
import { calculateCorporateTax } from '../src/utils/tax/engines/corporateTaxEngine.js';

test('Boundary Test: 10,000,000 JPY consumption tax threshold (¥9,999,999, ¥10,000,000, ¥10,000,001)', () => {
  // 1 JPY below threshold: Exempt
  const below = determineTaxableStatus({ basePeriodSales: 9999999, isInvoiceRegistered: false });
  assert.equal(below.isTaxable, false);

  // Exact threshold: 10,000,000 JPY is still <= 10M, so Exempt under Japanese consumption tax law
  const exact = determineTaxableStatus({ basePeriodSales: 10000000, isInvoiceRegistered: false });
  assert.equal(exact.isTaxable, false);

  // 1 JPY above threshold: Taxable
  const above = determineTaxableStatus({ basePeriodSales: 10000001, isInvoiceRegistered: false });
  assert.equal(above.isTaxable, true);
});

test('Boundary Test: 2,900,000 JPY individual enterprise tax deduction (¥2,899,999, ¥2,900,000, ¥2,900,001)', () => {
  const rules = getTaxRules(2025);

  // 1 JPY below: Taxable income = 0, Tax = 0
  const below = calculateEnterpriseTax({ rules, businessIncome: 2899999, operatingMonths: 12 });
  assert.equal(below.taxableIncome, 0);
  assert.equal(below.enterpriseTax, 0);

  // Exact 2.9M: Taxable income = 0, Tax = 0
  const exact = calculateEnterpriseTax({ rules, businessIncome: 2900000, operatingMonths: 12 });
  assert.equal(exact.taxableIncome, 0);
  assert.equal(exact.enterpriseTax, 0);

  // 1 JPY above: rawTaxable = 1 JPY. But rounded to 1,000 JPY unit -> taxableIncome = 0 -> Tax = 0!
  const above1 = calculateEnterpriseTax({ rules, businessIncome: 2900001, operatingMonths: 12 });
  assert.equal(above1.rawTaxableIncome, 1);
  assert.equal(above1.taxableIncome, 0);
  assert.equal(above1.enterpriseTax, 0);

  // 1,000 JPY above: rawTaxable = 1,000 JPY. Tax = 1,000 * 5% = 50 JPY.
  // BUT Art. 119 states tax under 1,000 JPY is not collected -> Tax = 0!
  const above1k = calculateEnterpriseTax({ rules, businessIncome: 2901000, operatingMonths: 12 });
  assert.equal(above1k.taxableIncome, 1000);
  assert.equal(above1k.enterpriseTax, 0); // Exempt under 1,000 yen!

  // High enough: 2,900,000 + 100,000 = 3,000,000 JPY -> taxable = 100,000 -> 100,000 * 5% = 5,000 JPY
  const valid = calculateEnterpriseTax({ rules, businessIncome: 3000000, operatingMonths: 12 });
  assert.equal(valid.taxableIncome, 100000);
  assert.equal(valid.enterpriseTax, 5000);
});

test('Boundary Test: 200,000 JPY side income rule (¥199,999, ¥200,000, ¥200,001)', () => {
  // 1 JPY below 200,000 JPY: NOT_REQUIRED for income tax
  const below = assessFilingNecessity({
    profile: 'employee_side',
    annualSalary: 4000000,
    hasYearEndAdjustment: true,
    sideIncomeProfit: 199999,
  });
  assert.equal(below.status, 'NOT_REQUIRED');

  // Exact 200,000 JPY: NOT_REQUIRED (<= 200,000 JPY is exempt from income tax filing)
  const exact = assessFilingNecessity({
    profile: 'employee_side',
    annualSalary: 4000000,
    hasYearEndAdjustment: true,
    sideIncomeProfit: 200000,
  });
  assert.equal(exact.status, 'NOT_REQUIRED');

  // 1 JPY above: 200,001 JPY -> REQUIRED
  const above = assessFilingNecessity({
    profile: 'employee_side',
    annualSalary: 4000000,
    hasYearEndAdjustment: true,
    sideIncomeProfit: 200001,
  });
  assert.equal(above.status, 'REQUIRED');
});

test('Boundary Test: 8,000,000 JPY corporate tax bracket (15% below vs 23.2% above)', () => {
  const rules = getTaxRules(2025);

  // Exact 8,000,000 JPY: 8,000,000 * 15% = 1,200,000 JPY
  const exact = calculateCorporateTax({ rules, corporateIncome: 8000000 });
  assert.equal(exact.corporateTax, 1200000);

  // 8,001,000 JPY (rounded to 1,000 unit): 8,000,000 * 15% + 1,000 * 23.2% = 1,200,000 + 232 = 1,200,232 -> round 100 = 1,200,200 JPY
  const above = calculateCorporateTax({ rules, corporateIncome: 8001000 });
  assert.equal(above.corporateTax, 1200200);
});

test('Boundary Test: Rounding rules under National Tax Collection Act Art. 118 & 119', () => {
  // Taxable income: less than 1,000 JPY -> 0
  assert.equal(roundTaxableIncome(0), 0);
  assert.equal(roundTaxableIncome(1), 0);
  assert.equal(roundTaxableIncome(999), 0);
  assert.equal(roundTaxableIncome(1000), 1000);
  assert.equal(roundTaxableIncome(1001), 1000);

  // Final tax payable: less than 1,000 JPY -> 0 (Art. 119 Par. 1)
  assert.equal(roundFinalTaxAmount(0), 0);
  assert.equal(roundFinalTaxAmount(500), 0);
  assert.equal(roundFinalTaxAmount(999), 0);
  assert.equal(roundFinalTaxAmount(1000), 1000);
  assert.equal(roundFinalTaxAmount(1099), 1000);
  assert.equal(roundFinalTaxAmount(1100), 1100);
});
