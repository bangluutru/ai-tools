/**
 * @file packages/core/tests/insurance-2026-fixes.test.js
 * @description Regression tests: 国民年金 前納 (令和8年度 official), FY2027 schedule, 一部免除 rounding,
 * 被扶養者 150万円 (19〜22歳), 適用拡大 schedule by date, 雇用保険 rules, 50銭 rounding, kenpo 3月分 boundary.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  calculateNationalPension,
  evaluateDependentInsuranceEligibility,
  evaluateSocialInsuranceEligibility,
  resolveKenpoRate,
  resolveCareInsuranceRate,
  resolveEmploymentInsuranceRate,
  roundEmployeeShare,
  calculateSocialInsuranceSimulation,
} from '../src/japan/insurance/index.js';

test('National pension 令和8年度 前納 matches 日本年金機構 official amounts', () => {
  const cases = [
    ['six_months', 'account_transfer', 106300],
    ['one_year', 'account_transfer', 210530],
    ['two_years', 'account_transfer', 417150],
    ['six_months', 'cash', 106650],
    ['one_year', 'credit_card', 211220],
    ['two_years', 'cash', 418510],
  ];
  for (const [plan, method, expected] of cases) {
    const r = calculateNationalPension({ applicableDate: '2026-05-01', advancePaymentPlan: plan, advancePaymentMethod: method });
    assert.equal(r.advanceCalculation.netPayableAmount, expected, `${plan}/${method}`);
  }
  // 付加保険料 2年前納 口座振替: 9,600 − 380 = 9,220
  const add = calculateNationalPension({ applicableDate: '2026-05-01', withAdditionalPension: true, advancePaymentPlan: 'two_years' });
  assert.equal(add.advanceCalculation.additionalDiscountAmount, 380);
  assert.equal(add.advanceCalculation.netPayableAmount, 417150 + 9220);
});

test('National pension FY2027 (18,290/month) returns a schedule; unverified discounts are not invented', () => {
  const r = calculateNationalPension({ applicableDate: '2027-04-01', advancePaymentPlan: 'one_year' });
  assert.equal(r.success, true);
  assert.equal(r.baseMonthlyPremium, 18290);
  assert.equal(r.advanceCalculation.grossAmount, 18290 * 12);
  assert.equal(r.advanceCalculation.isDiscountVerified, false);
  assert.equal(r.advanceCalculation.netPayableAmount, null);
  const two = calculateNationalPension({ applicableDate: '2027-04-01', advancePaymentPlan: 'two_years' });
  assert.equal(two.advanceCalculation.grossAmount, null);
});

test('National pension 令和7年度 partial exemptions use official 10-yen amounts', () => {
  const q = calculateNationalPension({ applicableDate: '2025-05-01', exemptionType: 'quarter_exempt' });
  const h = calculateNationalPension({ applicableDate: '2025-05-01', exemptionType: 'half_exempt' });
  const t = calculateNationalPension({ applicableDate: '2025-05-01', exemptionType: 'three_quarters_exempt' });
  assert.deepEqual([q.totalMonthlyContribution, h.totalMonthlyContribution, t.totalMonthlyContribution], [13130, 8760, 4380]);
  const r8 = calculateNationalPension({ applicableDate: '2026-05-01', exemptionType: 'quarter_exempt' });
  assert.equal(r8.totalMonthlyContribution, 13440);
});

test('Dependent: 150万円 ceiling for non-spouse aged 19-22 from 2025-10-01', () => {
  const base = { dependentFutureAnnualIncome: 1400000, insuredAnnualIncome: 6000000, isCohabiting: true };
  const child20 = evaluateDependentInsuranceEligibility({ ...base, relationship: 'child', dependentAge: 20, certificationDate: '2026-05-01' });
  assert.equal(child20.ceiling, 1500000);
  assert.notEqual(child20.status, 'likely_ineligible');
  const spouse20 = evaluateDependentInsuranceEligibility({ ...base, relationship: 'spouse', dependentAge: 20, certificationDate: '2026-05-01' });
  assert.equal(spouse20.ceiling, 1300000);
  assert.equal(spouse20.status, 'likely_ineligible');
  const before = evaluateDependentInsuranceEligibility({ ...base, relationship: 'child', dependentAge: 20, certificationDate: '2025-09-30' });
  assert.equal(before.ceiling, 1300000);
  const age23 = evaluateDependentInsuranceEligibility({ ...base, relationship: 'child', dependentAge: 23, certificationDate: '2026-05-01' });
  assert.equal(age23.ceiling, 1300000);
  // Age from birth date: turns 19 in Nov 2025 → age at 2025-12-31 is 19
  const byBirth = evaluateDependentInsuranceEligibility({ ...base, relationship: 'child', dependentBirthDate: '2006-11-15', certificationDate: '2025-10-15' });
  assert.equal(byBirth.ceiling, 1500000);
});

test('Dependent: employer certification relief has no 150万 cap; empty input → insufficient_info', () => {
  const r = evaluateDependentInsuranceEligibility({
    relationship: 'spouse', dependentAge: 35, isCohabiting: true,
    dependentFutureAnnualIncome: 1600000, insuredAnnualIncome: 6000000, hasEmployerOvertimeProof: true,
  });
  assert.equal(r.status, 'case_dependent');
  const empty = evaluateDependentInsuranceEligibility({ relationship: 'spouse', dependentAge: 35 });
  assert.equal(empty.status, 'insufficient_info');
  const contract = evaluateDependentInsuranceEligibility({
    relationship: 'spouse', dependentAge: 35, dependentFutureAnnualIncome: 1000000, insuredAnnualIncome: 5000000, certificationDate: '2026-04-01',
  });
  assert.ok(contract.checks.some((c) => c.id === 'contract_based_income'));
});

test('Eligibility: wage requirement and company-size threshold follow applicableDate', () => {
  const worker = { employmentType: 'part_time', weeklyHours: 22, monthlyWage: 80000, contractDurationMonths: 12, age: 30 };
  // 2026-09-30: 51人, wage 8.8万 still applies → not mandatory (wage below)
  const sep = evaluateSocialInsuranceEligibility({ ...worker, companySize: 60, applicableDate: '2026-09-30' });
  assert.equal(sep.status, 'likely_not_mandatory');
  // 2026-10-01: wage requirement abolished (scheduled) → mandatory
  const oct = evaluateSocialInsuranceEligibility({ ...worker, companySize: 60, applicableDate: '2026-10-01' });
  assert.equal(oct.status, 'likely_mandatory');
  assert.equal(oct.appliedRules.wageRequirementActive, false);
  // 40-person company: 2027-09-30 case_dependent, 2027-10-01 mandatory (36人)
  const small1 = evaluateSocialInsuranceEligibility({ ...worker, companySize: 40, applicableDate: '2027-09-30' });
  assert.equal(small1.status, 'case_dependent');
  const small2 = evaluateSocialInsuranceEligibility({ ...worker, companySize: 40, applicableDate: '2027-10-01' });
  assert.equal(small2.status, 'likely_mandatory');
  assert.equal(evaluateSocialInsuranceEligibility({ ...worker, companySize: 5, applicableDate: '2035-10-01' }).status, 'likely_mandatory');
});

test('Eligibility: 雇用保険 excludes 役員 and daytime students; 31 days; age 75 headline', () => {
  const exec = evaluateSocialInsuranceEligibility({ employmentType: 'executive', age: 50 });
  assert.equal(exec.applicableInsurances.employmentInsurance, false);
  const student = evaluateSocialInsuranceEligibility({ employmentType: 'part_time', weeklyHours: 25, monthlyWage: 100000, isStudent: true, studentType: 'daytime', contractDurationMonths: 12, applicableDate: '2026-09-01' });
  assert.equal(student.applicableInsurances.employmentInsurance, false);
  const shortContract = evaluateSocialInsuranceEligibility({ employmentType: 'part_time', weeklyHours: 25, monthlyWage: 100000, expectedEmploymentDays: 30, contractDurationMonths: 1, applicableDate: '2026-09-01' });
  assert.equal(shortContract.applicableInsurances.employmentInsurance, false);
  const old = evaluateSocialInsuranceEligibility({ employmentType: 'regular', age: 76 });
  assert.equal(old.status, 'likely_not_mandatory');
  assert.equal(old.applicableInsurances.healthInsurance, false);
  assert.doesNotMatch(old.headlineJa, /加入対象です$/);
  const zeroAge = evaluateSocialInsuranceEligibility({ employmentType: 'regular', age: 0 });
  assert.equal(zeroAge.applicableInsurances.welfarePension, true);
  assert.ok(Array.isArray(old.specialNotesLocalized) && old.specialNotesLocalized[0].vi);
});

test('Rates: kenpo/care switch at 2026年3月分; R7 care 1.59%; R7 employment 5.5/9.0, 6.5/10.0, 6.5/11.0', () => {
  assert.equal(resolveKenpoRate('tokyo', '2026-02-01').totalRate, 0.0991);
  assert.equal(resolveKenpoRate('tokyo', '2026-03-01').totalRate, 0.0985);
  assert.equal(resolveCareInsuranceRate(45, '2025-06-01').totalRate, 0.0159);
  assert.equal(resolveCareInsuranceRate(45, '2026-03-01').totalRate, 0.0162);
  const g = resolveEmploymentInsuranceRate('general', '2025-06-01');
  const a = resolveEmploymentInsuranceRate('agriculture_forestry_fishery', '2025-06-01');
  const c = resolveEmploymentInsuranceRate('construction', '2025-06-01');
  assert.deepEqual([g.employeeRate, g.employerRate], [0.0055, 0.009]);
  assert.deepEqual([a.employeeRate, a.employerRate], [0.0065, 0.01]);
  assert.deepEqual([c.employeeRate, c.employerRate], [0.0065, 0.011]);
});

test('Employee share rounding: 50銭以下切捨て / 50銭超切上げ; age gates in insurance engine', () => {
  assert.equal(roundEmployeeShare(100.5), 100);
  assert.equal(roundEmployeeShare(100.51), 101);
  assert.equal(roundEmployeeShare(100.49), 100);
  // 98,000 × 9.85% = 9,653 → employee 4,826.5 → 4,826, employer 4,827
  const r = calculateSocialInsuranceSimulation({ monthlySalary: 98000, prefecture: 'tokyo', age: 30, applicableDate: '2026-04-01' });
  assert.equal(r.monthly.healthInsurance.employee, 4826);
  assert.equal(r.monthly.healthInsurance.employer, 4827);
  const r70 = calculateSocialInsuranceSimulation({ monthlySalary: 300000, age: 70, applicableDate: '2026-04-01' });
  assert.equal(r70.monthly.welfarePension.employee, 0);
  assert.ok(r70.monthly.healthInsurance.employee > 0);
  const r75 = calculateSocialInsuranceSimulation({ monthlySalary: 300000, age: 75, applicableDate: '2026-04-01' });
  assert.equal(r75.monthly.healthInsurance.employee, 0);
  assert.equal(r75.monthly.childSupportFund.employee, 0);
  assert.equal(r75.ageStatus.notes.length, 1);
});
