/**
 * @file packages/core/tests/tax-social-insurance.test.js
 * @description Unit tests cho socialInsuranceEngine (健康保険, 厚生年金, 雇用保険, 国保, 国年).
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import { getTaxRules } from '../src/utils/tax/taxRulesRegistry.js';
import { calculateSocialInsurance } from '../src/utils/tax/engines/socialInsuranceEngine.js';

test('calculateSocialInsurance computes employee share (Kenpo, Pension, Employment) for 4M JPY salary', () => {
  const rules = getTaxRules(2025);
  const result = calculateSocialInsurance({
    rules,
    profile: 'employee',
    annualSalary: 4000000,
    prefecture: 'tokyo',
    age: 30,
  });

  assert.equal(result.isCompanyEmployee, true);
  // Tokyo Kenpo 9.98% / 2 = 4.99% -> 4,000,000 * 0.0499 = 199,600 JPY
  assert.equal(result.healthInsurance, 199600);
  // Age 30: Care insurance = 0
  assert.equal(result.careInsurance, 0);
  // Welfare pension: 4,000,000 * 9.15% = 366,000 JPY
  assert.equal(result.welfarePension, 366000);
  // Employment insurance: 4,000,000 * 0.6% = 24,000 JPY
  assert.equal(result.employmentInsurance, 24000);

  // Total: 199,600 + 366,000 + 24,000 = 589,600 JPY (~14.7% of salary)
  assert.equal(result.totalSocialInsurance, 589600);
  assert.ok(result.employerContribution > 0);
});

test('calculateSocialInsurance adds Care Insurance (介護保険) for age 45', () => {
  const rules = getTaxRules(2025);
  const result = calculateSocialInsurance({
    rules,
    profile: 'employee',
    annualSalary: 4000000,
    prefecture: 'tokyo',
    age: 45,
  });

  // Care insurance (1.6% / 2 = 0.8%): 4,000,000 * 0.008 = 32,000 JPY
  assert.equal(result.careInsurance, 32000);
  assert.equal(result.totalSocialInsurance, 589600 + 32000);
});

test('calculateSocialInsurance computes national health & pension for freelancer', () => {
  const rules = getTaxRules(2025);
  const result = calculateSocialInsurance({
    rules,
    profile: 'freelance',
    businessIncome: 4000000,
    prefecture: 'tokyo',
    age: 30,
  });

  assert.equal(result.isCompanyEmployee, false);
  assert.ok(result.nationalHealthInsurance > 0);
  // National pension: 17,510 * 12 = 210,120 JPY
  assert.equal(result.nationalPension, 210120);
});
