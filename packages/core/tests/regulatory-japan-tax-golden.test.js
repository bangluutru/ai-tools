/**
 * @file packages/core/tests/regulatory-japan-tax-golden.test.js
 * @description Golden Legal Tests for Japan Tax 2026 (令和8年分).
 * Every test verifies exact statutory calculations, boundary thresholds,
 * age thresholds, period applicability, and references official Tier-1 primary source IDs.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import { getTaxRules } from '../src/utils/tax/taxRulesRegistry.js';
import { calculateSocialInsurance } from '../src/utils/tax/engines/socialInsuranceEngine.js';
import { OfficialSourceRegistry } from '../src/regulatory/sourceRegistry.js';
import { EffectivePeriod } from '../src/regulatory/effectivePeriod.js';

// ============================================================================
// 1. Employment Income Deduction (給与所得控除) 2026 - NTA No.1410 Boundary Tests
// ============================================================================
test('GOLDEN: NTA No.1410 Employment Income Deduction 2026 boundary conditions', () => {
  const rules = getTaxRules(2026);
  assert.equal(rules.year, 2026);
  const calc = rules.incomeTax.employmentDeduction.calc;
  const sourceId = 'nta-no1410-2026';
  assert.ok(OfficialSourceRegistry.has(sourceId), `Source ${sourceId} must exist in registry`);

  const goldenCases = [
    // Bracket 1: <= 2,200,000 -> 740,000
    { id: 'salary-2200000-upper', salary: 2200000, expected: 740000, sourceId },
    // Bracket 2: 2,200,001 - 3,600,000 -> 30% + 80,000
    { id: 'salary-2200001-lower', salary: 2200001, expected: 740000, sourceId }, // floor(2200001 * 0.3 + 80000) = 740000
    { id: 'salary-3000000-mid', salary: 3000000, expected: 980000, sourceId },   // 3000000 * 0.3 + 80000 = 980000
    { id: 'salary-3600000-upper', salary: 3600000, expected: 1160000, sourceId }, // 3600000 * 0.3 + 80000 = 1160000
    // Bracket 3: 3,600,001 - 6,600,000 -> 20% + 440,000
    { id: 'salary-3600001-lower', salary: 3600001, expected: 1160000, sourceId }, // floor(3600001 * 0.2 + 440000) = 1160000
    { id: 'salary-5000000-mid', salary: 5000000, expected: 1440000, sourceId },   // 5000000 * 0.2 + 440000 = 1440000
    { id: 'salary-6600000-upper', salary: 6600000, expected: 1760000, sourceId }, // 6600000 * 0.2 + 440000 = 1760000
    // Bracket 4: 6,600,001 - 8,500,000 -> 10% + 1,100,000
    { id: 'salary-6600001-lower', salary: 6600001, expected: 1760000, sourceId }, // floor(6600001 * 0.1 + 1100000) = 1760000
    { id: 'salary-8000000-mid', salary: 8000000, expected: 1900000, sourceId },   // 8000000 * 0.1 + 1100000 = 1900000
    { id: 'salary-8500000-upper', salary: 8500000, expected: 1950000, sourceId }, // 8500000 * 0.1 + 1100000 = 1950000
    // Bracket 5: > 8,500,000 -> Flat cap 1,950,000
    { id: 'salary-8500001-lower', salary: 8500001, expected: 1950000, sourceId },
    { id: 'salary-15000000-high', salary: 15000000, expected: 1950000, sourceId },
  ];

  for (const tc of goldenCases) {
    const actual = calc(tc.salary);
    assert.equal(actual, tc.expected, `Case ${tc.id}: salary ${tc.salary} must produce ${tc.expected}, got ${actual}`);
  }
});

// ============================================================================
// 2. Basic Deduction (基礎控除) 2026 - NTA No.1199 Boundary Tests
// ============================================================================
test('GOLDEN: NTA No.1199 Basic Deduction 2026 step-down boundary conditions', () => {
  const rules = getTaxRules(2026);
  const phases = rules.incomeTax.basicDeduction.phases;
  const sourceId = 'nta-no1199-2026';
  assert.ok(OfficialSourceRegistry.has(sourceId), `Source ${sourceId} must exist in registry`);

  const resolveBasicDeduction = (totalIncome) => {
    for (const phase of phases) {
      if (totalIncome <= phase.maxTotalIncome) {
        return phase.amount;
      }
    }
    return 0;
  };

  const goldenPhases = [
    // Phase 1: <= 1.32M -> 1,040,000 JPY
    { income: 1000000, expected: 1040000, desc: 'Under 1.32M standard' },
    { income: 1320000, expected: 1040000, desc: 'Boundary 1.32M inclusive' },
    // Phase 2: > 1.32M to 3.36M -> 880,000 JPY
    { income: 1320001, expected: 880000, desc: 'Boundary 1.32M + 1 step down' },
    { income: 3360000, expected: 880000, desc: 'Boundary 3.36M inclusive' },
    // Phase 3: > 3.36M to 4.89M -> 680,000 JPY
    { income: 3360001, expected: 680000, desc: 'Boundary 3.36M + 1 step down' },
    { income: 4890000, expected: 680000, desc: 'Boundary 4.89M inclusive' },
    // Phase 4: > 4.89M to 6.55M -> 630,000 JPY
    { income: 4890001, expected: 630000, desc: 'Boundary 4.89M + 1 step down' },
    { income: 6550000, expected: 630000, desc: 'Boundary 6.55M inclusive' },
    // Phase 5: > 6.55M to 23.5M -> 580,000 JPY
    { income: 6550001, expected: 580000, desc: 'Boundary 6.55M + 1 step down' },
    { income: 23500000, expected: 580000, desc: 'Boundary 23.5M inclusive' },
    // Phase 6: > 23.5M to 24.0M -> 480,000 JPY
    { income: 23500001, expected: 480000, desc: 'Boundary 23.5M + 1 step down' },
    { income: 24000000, expected: 480000, desc: 'Boundary 24.0M inclusive' },
    // Phase 7: > 24.0M to 24.5M -> 320,000 JPY
    { income: 24000001, expected: 320000, desc: 'Boundary 24.0M + 1 step down' },
    { income: 24500000, expected: 320000, desc: 'Boundary 24.5M inclusive' },
    // Phase 8: > 24.5M to 25.0M -> 160,000 JPY
    { income: 24500001, expected: 160000, desc: 'Boundary 24.5M + 1 step down' },
    { income: 25000000, expected: 160000, desc: 'Boundary 25.0M inclusive' },
    // Phase 9: > 25.0M -> 0 JPY
    { income: 25000001, expected: 0, desc: 'Over 25M zero deduction' },
    { income: 30000000, expected: 0, desc: 'High income zero deduction' },
  ];

  for (const gp of goldenPhases) {
    const actual = resolveBasicDeduction(gp.income);
    assert.equal(actual, gp.expected, `Basic deduction for ${gp.income} (${gp.desc}) must be ${gp.expected}, got ${actual}`);
  }
});

// ============================================================================
// 3. National Pension (国民年金) FY2026 - Japan Pension Service
// ============================================================================
test('GOLDEN: National Pension 2026 official rate 17,920 JPY/month and FY2026 period', () => {
  const rules = getTaxRules(2026);
  const np = rules.socialInsurance.nationalPension;
  assert.equal(np.sourceId, 'jps-national-pension-2026');
  assert.equal(np.monthlyPremium, 17920, '令和8年度 monthly pension must be 17,920 JPY');
  assert.equal(np.annualPremium, 215040, '令和8年度 annual pension must be 215,040 JPY (17,920 * 12)');

  // Calculation in socialInsuranceEngine for freelancer
  const result = calculateSocialInsurance({
    rules,
    profile: 'freelance',
    businessIncome: 4000000,
    prefecture: 'tokyo',
    age: 30,
  });

  assert.equal(result.nationalPension, 215040, 'Freelancer 2026 national pension must equal 215,040 JPY');
  assert.equal(result.isEstimated, true, 'NHI/Freelancer must be marked as estimated');
  assert.equal(result.disclosureNote, '実際の保険料は市区町村によって異なります。');
});

// ============================================================================
// 4. Employment Insurance (雇用保険) FY2026 - MHLW Official Rate
// ============================================================================
test('GOLDEN: Employment Insurance 2026 employee rate 0.5% (5/1000)', () => {
  const rules = getTaxRules(2026);
  const ei = rules.socialInsurance.employmentInsurance;
  assert.equal(ei.sourceId, 'mhlw-employment-rate-2026');
  assert.equal(ei.employeeRate, 0.005, '令和8年度 employee share must be 0.5% (5/1000)');

  const result = calculateSocialInsurance({
    rules,
    profile: 'employee',
    annualSalary: 4000000,
    prefecture: 'tokyo',
    age: 30,
  });

  // 4,000,000 * 0.005 = 20,000 JPY
  assert.equal(result.employmentInsurance, 20000, '4M salary employment insurance at 0.5% must be 20,000 JPY');
});

// ============================================================================
// 5. Kyokai Kenpo, Fukuoka 10.11%, Child Support 0.23%, Care Insurance Age Tests
// ============================================================================
test('GOLDEN: Kyokai Kenpo Fukuoka 10.11%, Child Support 0.23%, and Care Insurance 40-64 age boundary', () => {
  const rules = getTaxRules(2026);
  const salary = 4000000;

  // Case A: Fukuoka, Age 39 (Under 40 -> Care Insurance = 0)
  const res39 = calculateSocialInsurance({
    rules,
    profile: 'employee',
    annualSalary: salary,
    prefecture: 'fukuoka',
    age: 39,
  });

  // Fukuoka Kenpo 10.11% / 2 = 5.055% -> 4,000,000 * 0.05055 = 202,200 JPY
  assert.equal(res39.healthInsurance, 202200, 'Fukuoka 10.11% / 2 on 4M salary must be 202,200 JPY');
  // Child Support 0.23% / 2 = 0.115% -> 4,000,000 * 0.00115 = 4,600 JPY
  assert.equal(res39.childSupportContribution, 4600, 'Child support 0.23% / 2 on 4M salary must be 4,600 JPY');
  // Care Insurance at age 39 = 0
  assert.equal(res39.careInsurance, 0, 'Care insurance at age 39 must be 0');
  // Welfare pension: 4M * 9.15% = 366,000 JPY
  assert.equal(res39.welfarePension, 366000);
  // Employment insurance: 4M * 0.5% = 20,000 JPY
  assert.equal(res39.employmentInsurance, 20000);
  // Total: 202,200 + 4,600 + 0 + 366,000 + 20,000 = 592,800 JPY
  assert.equal(res39.totalSocialInsurance, 592800);

  // Case B: Fukuoka, Age 40 (Inclusive boundary for Care Insurance 1.62% / 2 = 0.81%)
  const res40 = calculateSocialInsurance({
    rules,
    profile: 'employee',
    annualSalary: salary,
    prefecture: 'fukuoka',
    age: 40,
  });
  // 4,000,000 * 0.0081 = 32,400 JPY
  assert.equal(res40.careInsurance, 32400, 'Care insurance at age 40 (1.62% / 2) must be 32,400 JPY');
  assert.equal(res40.totalSocialInsurance, 592800 + 32400);

  // Case C: Fukuoka, Age 64 (Upper inclusive boundary for Care Insurance 1.62% / 2 = 0.81%)
  const res64 = calculateSocialInsurance({
    rules,
    profile: 'employee',
    annualSalary: salary,
    prefecture: 'fukuoka',
    age: 64,
  });
  assert.equal(res64.careInsurance, 32400, 'Care insurance at age 64 must be 32,400 JPY');

  // Case D: Fukuoka, Age 65 (Care insurance transitions to Category 1 via municipality deduction)
  const res65 = calculateSocialInsurance({
    rules,
    profile: 'employee',
    annualSalary: salary,
    prefecture: 'fukuoka',
    age: 65,
  });
  assert.equal(res65.careInsurance, 0, 'Care insurance in company payroll at age 65 must be 0');
});

// ============================================================================
// 6. Period Tests (Effective Date Range vs Tax Year vs Fiscal Year)
// ============================================================================
test('GOLDEN: EffectivePeriod distinguishes calendar-year, tax-year and fiscal-year', () => {
  // Tax year 2026 rule (NTA No.1410)
  const ntaRule = EffectivePeriod.create({
    type: 'tax-year',
    taxYear: 2026,
    effectiveFrom: '2026-12-01',
    effectiveTo: '2027-12-31',
  });
  assert.equal(EffectivePeriod.isApplicableForTaxYear(ntaRule, 2026), true);
  assert.equal(EffectivePeriod.isApplicableForTaxYear(ntaRule, 2025), false);

  // Fiscal year 2026 rule (Japan Pension Service: 2026-04-01 to 2027-03-31)
  const jpsRule = EffectivePeriod.create({
    type: 'fiscal-year',
    fiscalYear: 2026,
  });
  assert.equal(EffectivePeriod.isApplicableAtDate(jpsRule, '2026-03-31'), false, '2026-03-31 is FY2025');
  assert.equal(EffectivePeriod.isApplicableAtDate(jpsRule, '2026-04-01'), true, '2026-04-01 is FY2026');
  assert.equal(EffectivePeriod.isApplicableAtDate(jpsRule, '2027-03-31'), true, '2027-03-31 is FY2026');
  assert.equal(EffectivePeriod.isApplicableAtDate(jpsRule, '2027-04-01'), false, '2027-04-01 is FY2027');
});
