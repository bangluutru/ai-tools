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
  assert.equal(result.isEstimated, true);
  // Monthly 333,333 → 標準報酬月額 340,000. Tokyo 令和7年度 9.91% / 2 → 16,847/month ×12
  // (Jan–Feb 2025 are 令和6年度 premium months; R6 rate not stored → R7 rate with unverified notice)
  assert.equal(result.standardMonthly.kenpo, 340000);
  assert.equal(result.healthInsurance, 16847 * 12);
  assert.ok(result.periodNotices.length > 0);
  // Age 30: Care insurance = 0
  assert.equal(result.careInsurance, 0);
  // No child support levy in 2025
  assert.equal(result.childSupportContribution, 0);
  // Welfare pension: 340,000 * 9.15% = 31,110 ×12
  assert.equal(result.welfarePension, 31110 * 12);
  // Employment insurance: Jan–Mar 令和6年度 6/1000 → 2,000 ×3; Apr–Dec 令和7年度 5.5/1000 → 1,833 ×9
  assert.equal(result.employmentInsurance, 2000 * 3 + 1833 * 9);

  assert.equal(result.totalSocialInsurance, 16847 * 12 + 31110 * 12 + 2000 * 3 + 1833 * 9);
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

  // Care insurance: Jan–Feb 令和6年度 1.60%/2 → 2,720 ×2; Mar–Dec 令和7年度 1.59%/2 → 2,703 ×10
  assert.equal(result.careInsurance, 2720 * 2 + 2703 * 10);
  assert.equal(result.totalSocialInsurance, 16847 * 12 + 31110 * 12 + 2000 * 3 + 1833 * 9 + 2720 * 2 + 2703 * 10);
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
  // National pension paid in calendar 2025: Jan–Mar 令和6年度 16,980 + Apr–Dec 令和7年度 17,510
  assert.equal(result.nationalPension, 16980 * 3 + 17510 * 9);
});

test('calculateSocialInsurance: age gates — no welfare pension from 70, no health/care/child levy from 75', () => {
  const rules = getTaxRules(2026);
  const r70 = calculateSocialInsurance({ rules, profile: 'employee', annualSalary: 4000000, prefecture: 'tokyo', age: 70 });
  assert.equal(r70.welfarePension, 0);
  assert.ok(r70.healthInsurance > 0);
  const r75 = calculateSocialInsurance({ rules, profile: 'employee', annualSalary: 4000000, prefecture: 'tokyo', age: 75 });
  assert.equal(r75.healthInsurance, 0);
  assert.equal(r75.childSupportContribution, 0);
  assert.equal(r75.careInsurance, 0);
  assert.equal(r75.welfarePension, 0);
  assert.ok(r75.employmentInsurance > 0);
});
