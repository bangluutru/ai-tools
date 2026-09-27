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

  // 令和8年分 (令和8年12月1日施行): 489万円以下 104万 / 655万円以下 67万 / 2,350万円以下 62万 / 2,400万 48万 / 2,450万 32万 / 2,500万 16万 / 超 0
  const goldenPhases = [
    { income: 1000000, expected: 1040000, desc: 'Low income' },
    { income: 1320001, expected: 1040000, desc: 'R8: no step at 1.32M' },
    { income: 3360001, expected: 1040000, desc: 'R8: no step at 3.36M' },
    { income: 4890000, expected: 1040000, desc: 'Boundary 4.89M inclusive' },
    { income: 4890001, expected: 670000, desc: 'Boundary 4.89M + 1 step down' },
    { income: 6550000, expected: 670000, desc: 'Boundary 6.55M inclusive' },
    { income: 6550001, expected: 620000, desc: 'Boundary 6.55M + 1 step down' },
    { income: 23500000, expected: 620000, desc: 'Boundary 23.5M inclusive' },
    { income: 23500001, expected: 480000, desc: 'Boundary 23.5M + 1 step down' },
    { income: 24000000, expected: 480000, desc: 'Boundary 24.0M inclusive' },
    { income: 24000001, expected: 320000, desc: 'Boundary 24.0M + 1 step down' },
    { income: 24500000, expected: 320000, desc: 'Boundary 24.5M inclusive' },
    { income: 24500001, expected: 160000, desc: 'Boundary 24.5M + 1 step down' },
    { income: 25000000, expected: 160000, desc: 'Boundary 25.0M inclusive' },
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

  // Calendar year 2026 (社会保険料控除): Jan–Mar at 令和7年度 17,510 + Apr–Dec at 令和8年度 17,920
  assert.equal(result.nationalPension, 17510 * 3 + 17920 * 9, 'Freelancer 2026 national pension paid in calendar 2026 = 213,810 JPY');
  assert.equal(result.isEstimated, true, 'NHI/Freelancer must be marked as estimated');
  assert.match(result.disclosureNote, /市区町村/);
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

  // Monthly 333,333: Jan–Mar 5.5/1000 → 1,833 (50銭以下切捨て) ×3; Apr–Dec 5/1000 → 1,666.665 → 1,667 (50銭超切上げ) ×9
  assert.equal(result.employmentInsurance, 1833 * 3 + 1667 * 9, 'Employment insurance must blend 令和7/8年度 rates by month');
  assert.equal(result.rates.employmentEmployee.map((p) => p.rate).join(','), '0.0055,0.005');
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

  // Monthly 333,333 → 標準報酬月額 340,000 (health & pension)
  // Health: Jan–Feb 令和7年度 10.31%/2 → 17,527 ×2; Mar–Dec 令和8年度 10.11%/2 → 17,187 ×10
  assert.equal(res39.healthInsurance, 17527 * 2 + 17187 * 10, 'Fukuoka health insurance blends R7/R8 by premium month');
  // Child Support 0.23% / 2 = 0.115% from April 2026 premiums: 340,000 * 0.00115 = 391 ×9
  assert.equal(res39.childSupportContribution, 391 * 9, 'Child support only for April–December 2026');
  assert.equal(res39.childSupportMonths, 9);
  // Care Insurance at age 39 = 0
  assert.equal(res39.careInsurance, 0, 'Care insurance at age 39 must be 0');
  // Welfare pension: 340,000 * 9.15% = 31,110 ×12
  assert.equal(res39.welfarePension, 31110 * 12);
  assert.equal(res39.employmentInsurance, 1833 * 3 + 1667 * 9);
  const total39 = 17527 * 2 + 17187 * 10 + 391 * 9 + 31110 * 12 + 1833 * 3 + 1667 * 9;
  assert.equal(res39.totalSocialInsurance, total39);
  assert.equal(res39.isEstimated, true);

  // Case B: Fukuoka, Age 40 — care: Jan–Feb 1.59%/2 → 2,703; Mar–Dec 1.62%/2 → 2,754
  const res40 = calculateSocialInsurance({
    rules,
    profile: 'employee',
    annualSalary: salary,
    prefecture: 'fukuoka',
    age: 40,
  });
  assert.equal(res40.careInsurance, 2703 * 2 + 2754 * 10, 'Care insurance at age 40 blends 1.59% / 1.62%');
  assert.equal(res40.totalSocialInsurance, total39 + 2703 * 2 + 2754 * 10);

  // Case C: Fukuoka, Age 64 (upper inclusive boundary)
  const res64 = calculateSocialInsurance({
    rules,
    profile: 'employee',
    annualSalary: salary,
    prefecture: 'fukuoka',
    age: 64,
  });
  assert.equal(res64.careInsurance, 2703 * 2 + 2754 * 10, 'Care insurance at age 64 must still apply');

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
