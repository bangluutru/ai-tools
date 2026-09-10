/**
 * @file packages/core/tests/regulatory-japan-insurance-golden.test.js
 * @description Golden tests & boundary verification cho Mini-app 1: 社会保険料シミュレーター.
 * Kiểm chứng tính chính xác pháp lý theo các bảng chuẩn của MHLW, Kyokai Kenpo, và JPS.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  lookupKenpoGrade,
  lookupPensionGrade,
  calculateStandardBonus,
  calculateSocialInsuranceSimulation,
  resolveKenpoRate,
  resolveEmploymentInsuranceRate,
  resolveCareInsuranceRate,
  resolveChildSupportRate,
} from '../src/japan/insurance/index.js';

test('Japan Insurance Golden 1: Standard remuneration boundary tests (Kenpo & Pension)', () => {
  // Kenpo Grade 1 boundary: < 63,000 -> 58,000
  const k1 = lookupKenpoGrade(62999);
  assert.equal(k1.grade, 1);
  assert.equal(k1.standardMonthly, 58000);

  // Kenpo Grade 2 boundary: >= 63,000 -> 68,000
  const k2 = lookupKenpoGrade(63000);
  assert.equal(k2.grade, 2);
  assert.equal(k2.standardMonthly, 68000);

  // Pension Grade 1 boundary: < 93,000 -> 88,000
  const p1 = lookupPensionGrade(92999);
  assert.equal(p1.grade, 1);
  assert.equal(p1.standardMonthly, 88000);

  // Pension Grade 2 boundary: >= 93,000 -> 98,000
  const p2 = lookupPensionGrade(93000);
  assert.equal(p2.grade, 2);
  assert.equal(p2.standardMonthly, 98000);

  // Pension Grade 31 vs 32 (Cap): 634,999 vs 635,000 -> 620,000 vs 650,000
  const p31 = lookupPensionGrade(634999);
  assert.equal(p31.grade, 31);
  assert.equal(p31.standardMonthly, 620000);
  assert.equal(p31.isCapped, false);

  const p32 = lookupPensionGrade(635000);
  assert.equal(p32.grade, 32);
  assert.equal(p32.standardMonthly, 650000);
  assert.equal(p32.isCapped, true);

  // Higher salary beyond pension cap (e.g. 1,000,000)
  const pCapped = lookupPensionGrade(1000000);
  assert.equal(pCapped.grade, 32);
  assert.equal(pCapped.standardMonthly, 650000);

  // Kenpo Grade 49 vs 50 (Cap): 1,354,999 vs 1,355,000 -> 1,330,000 vs 1,390,000
  const k49 = lookupKenpoGrade(1354999);
  assert.equal(k49.grade, 49);
  assert.equal(k49.standardMonthly, 1330000);

  const k50 = lookupKenpoGrade(1355000);
  assert.equal(k50.grade, 50);
  assert.equal(k50.standardMonthly, 1390000);
});

test('Japan Insurance Golden 2: Standard bonus limits & rounding rules', () => {
  // Rounding under 1,000 yen
  const b1 = calculateStandardBonus({ actualBonus: 543890 });
  assert.equal(b1.roundedBonus, 543000);
  assert.equal(b1.kenpoStandardBonus, 543000);
  assert.equal(b1.pensionStandardBonus, 543000);

  // Pension single-payment cap: 1,500,000 yen
  const b2 = calculateStandardBonus({ actualBonus: 2000000 });
  assert.equal(b2.roundedBonus, 2000000);
  assert.equal(b2.pensionStandardBonus, 1500000); // capped at 1.5M
  assert.equal(b2.kenpoStandardBonus, 2000000);

  // Kenpo annual cumulative cap: 5,730,000 yen
  const b3 = calculateStandardBonus({
    actualBonus: 2000000,
    previousBonusesInFiscalYear: 4500000,
  });
  // Remaining Kenpo cap = 5,730,000 - 4,500,000 = 1,230,000
  assert.equal(b3.kenpoStandardBonus, 1230000);
  assert.equal(b3.pensionStandardBonus, 1500000);
});

test('Japan Insurance Golden 3: Normal Remuneration (Tokyo, 300,000 JPY, age 30, General)', () => {
  const res = calculateSocialInsuranceSimulation({
    monthlySalary: 300000,
    prefecture: 'tokyo',
    age: 30,
    industryCategory: 'general',
    applicableDate: '2026-04-01',
  });

  // Grade check: 300,000 JPY is Kenpo Grade 22 (standard 300,000) & Pension Grade 19 (standard 300,000)
  assert.equal(res.grades.kenpo.grade, 22);
  assert.equal(res.grades.kenpo.standardMonthly, 300000);
  assert.equal(res.grades.pension.grade, 19);
  assert.equal(res.grades.pension.standardMonthly, 300000);

  // Tokyo Kenpo 2026: 9.98% / 2 = 4.99% -> 300,000 * 0.0499 = 14,970 JPY
  assert.equal(res.monthly.healthInsurance.employee, 14970);
  assert.equal(res.monthly.healthInsurance.employer, 14970);

  // Child support fund 2026: 0.23% / 2 = 0.115% -> 300,000 * 0.00115 = 345 JPY
  assert.equal(res.monthly.childSupportFund.employee, 345);
  assert.equal(res.monthly.childSupportFund.employer, 345);

  // Care insurance: age 30 is under 40 -> 0 JPY
  assert.equal(res.monthly.careInsurance.isApplicable, false);
  assert.equal(res.monthly.careInsurance.employee, 0);

  // Welfare pension: 18.3% / 2 = 9.15% -> 300,000 * 0.0915 = 27,450 JPY
  assert.equal(res.monthly.welfarePension.employee, 27450);
  assert.equal(res.monthly.welfarePension.employer, 27450);

  // Employment insurance 2026 general: 0.5% employee, 0.85% employer on actual 300,000
  // 300,000 * 0.005 = 1,500 JPY employee
  // 300,000 * 0.0085 = 2,550 JPY employer
  assert.equal(res.monthly.employmentInsurance.employee, 1500);
  assert.equal(res.monthly.employmentInsurance.employer, 2550);

  // Child welfare contribution (employer only): 300,000 * 0.0036 = 1,080 JPY
  assert.equal(res.monthly.childWelfareContribution.employee, 0);
  assert.equal(res.monthly.childWelfareContribution.employer, 1080);

  // Total employee deduction = 14970 + 345 + 0 + 27450 + 1500 = 44,265 JPY
  assert.equal(res.monthly.employeeTotal, 44265);

  // Total employer expense = 14970 + 345 + 0 + 27450 + 2550 + 1080 = 46,395 JPY
  assert.equal(res.monthly.employerTotal, 46395);

  // Total employment cost = 300,000 + 46,395 = 346,395 JPY
  assert.equal(res.monthly.totalEmploymentCost, 346395);
});

test('Japan Insurance Golden 4: Care insurance age boundary (39, 40, 64, 65)', () => {
  // Age 39: Not applicable (0%)
  const r39 = resolveCareInsuranceRate(39, '2026-04-01');
  assert.equal(r39.isApplicable, false);
  assert.equal(r39.employeeRate, 0);

  // Age 40: Secondary insured (40-64), 1.62% split 0.81%
  const r40 = resolveCareInsuranceRate(40, '2026-04-01');
  assert.equal(r40.isApplicable, true);
  assert.equal(r40.employeeRate, 0.0081);
  assert.equal(r40.category, 'secondary_insured');

  // Age 64: Secondary insured (still applicable)
  const r64 = resolveCareInsuranceRate(64, '2026-04-01');
  assert.equal(r64.isApplicable, true);
  assert.equal(r64.employeeRate, 0.0081);

  // Age 65: Primary insured (not deducted via Kyokai Kenpo)
  const r65 = resolveCareInsuranceRate(65, '2026-04-01');
  assert.equal(r65.isApplicable, false);
  assert.equal(r65.employeeRate, 0);
  assert.equal(r65.category, 'primary_insured_65plus');
});

test('Japan Insurance Golden 5: Prefecture rate difference (Tokyo vs Fukuoka)', () => {
  const tokyo = resolveKenpoRate('tokyo', '2026-04-01');
  const fukuoka = resolveKenpoRate('fukuoka', '2026-04-01');

  // Tokyo: 9.98%
  assert.equal(tokyo.totalRate, 0.0998);
  assert.equal(tokyo.employeeRate, 0.0499);

  // Fukuoka: 10.11%
  assert.equal(fukuoka.totalRate, 0.1011);
  assert.equal(fukuoka.employeeRate, 0.05055);

  assert.notEqual(tokyo.totalRate, fukuoka.totalRate);
});

test('Japan Insurance Golden 6: Employment insurance industry differences (General vs Construction)', () => {
  const gen = resolveEmploymentInsuranceRate('general', '2026-04-01');
  const con = resolveEmploymentInsuranceRate('construction', '2026-04-01');

  // General: 5/1000 employee, 8.5/1000 employer
  assert.equal(gen.employeeRate, 0.005);
  assert.equal(gen.employerRate, 0.0085);

  // Construction: 6/1000 employee, 10.5/1000 employer
  assert.equal(con.employeeRate, 0.006);
  assert.equal(con.employerRate, 0.0105);
});

test('Japan Insurance Golden 7: Fiscal year boundary (2026-03-31 vs 2026-04-01)', () => {
  // Prior to 2026-04-01 (FY2025): child support is 0, employment is 6/1000
  const child2025 = resolveChildSupportRate('2026-03-31');
  assert.equal(child2025.isIntroduced, false);
  assert.equal(child2025.totalRate, 0);

  const emp2025 = resolveEmploymentInsuranceRate('general', '2026-03-31');
  assert.equal(emp2025.employeeRate, 0.006);

  // From 2026-04-01 (FY2026): child support is 0.23%, employment is 5/1000
  const child2026 = resolveChildSupportRate('2026-04-01');
  assert.equal(child2026.isIntroduced, true);
  assert.equal(child2026.totalRate, 0.0023);

  const emp2026 = resolveEmploymentInsuranceRate('general', '2026-04-01');
  assert.equal(emp2026.employeeRate, 0.005);
});

test('Japan Insurance Golden 8: High Remuneration Case (1.5M JPY/mo + 1M bonus, Age 45, Construction, Fukuoka)', () => {
  const res = calculateSocialInsuranceSimulation({
    monthlySalary: 1500000,
    actualBonus: 1000000,
    prefecture: 'fukuoka',
    age: 45,
    industryCategory: 'construction',
    applicableDate: '2026-04-01',
  });

  // Salary 1,500,000 JPY hits Kenpo Grade 50 (max cap 1,390,000)
  assert.equal(res.grades.kenpo.grade, 50);
  assert.equal(res.grades.kenpo.standardMonthly, 1390000);

  // Salary 1,500,000 JPY hits Pension Grade 32 (max cap 650,000)
  assert.equal(res.grades.pension.grade, 32);
  assert.equal(res.grades.pension.standardMonthly, 650000);
  assert.equal(res.grades.pension.isCapped, true);

  // Care insurance is active for age 45
  assert.equal(res.monthly.careInsurance.isApplicable, true);
  // 1,390,000 * 0.0081 = 11,259 JPY
  assert.equal(res.monthly.careInsurance.employee, 11259);

  // Employment insurance (construction 0.6% on actual 1,500,000 JPY) = 9,000 JPY
  assert.equal(res.monthly.employmentInsurance.employee, 9000);
  // Employer share: 1,500,000 * 0.0105 = 15,750 JPY
  assert.equal(res.monthly.employmentInsurance.employer, 15750);

  // Bonus handling: 1,000,000 JPY bonus
  assert(res.bonus !== null);
  assert.equal(res.bonus.actualBonus, 1000000);
  // Pension on bonus: 1,000,000 * 0.0915 = 91,500 JPY
  assert.equal(res.bonus.welfarePension.employee, 91500);

  // Dual perspective totals check
  assert(res.grandTotals.employeeDeductionTotal > 0);
  assert(res.grandTotals.employerContributionTotal > 0);
  assert.equal(
    res.grandTotals.totalEmploymentCost,
    1500000 + 1000000 + res.grandTotals.employerContributionTotal
  );
});
