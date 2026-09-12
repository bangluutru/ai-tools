import test from 'node:test';
import assert from 'node:assert/strict';

import {
  calculateVietnamInsurance,
  calculatePITFromTaxableIncome,
  calculateVietnamPIT,
  calculateGrossToNet,
  calculateNetToGross,
  calculateVietnamElectricity,
  getInsuranceRules,
  getPITRules,
  getMinimumWageRules,
  getElectricityTariff,
} from '../src/vietnam/index.js';

// ============================================================================
// PIT TESTS
// ============================================================================
test('TC-PIT-01: Taxable income 10,000,000 produces 500,000 PIT', () => {
  const res = calculatePITFromTaxableIncome(10_000_000);
  assert.equal(res.totalTax, 500_000);
  assert.equal(res.bracketsBreakdown[0].taxAmount, 500_000);
  assert.equal(res.bracketsBreakdown[1].taxAmount, 0);
});

test('TC-PIT-02: Taxable income 30,000,000 produces 2,500,000 PIT', () => {
  const res = calculatePITFromTaxableIncome(30_000_000);
  assert.equal(res.totalTax, 2_500_000);
  assert.equal(res.bracketsBreakdown[0].taxAmount, 500_000);
  assert.equal(res.bracketsBreakdown[1].taxAmount, 2_000_000);
  assert.equal(res.bracketsBreakdown[2].taxAmount, 0);
});

test('TC-PIT-03: Taxable income 50,000,000 produces 6,500,000 PIT', () => {
  const res = calculatePITFromTaxableIncome(50_000_000);
  assert.equal(res.totalTax, 6_500_000);
  assert.equal(res.bracketsBreakdown[0].taxAmount, 500_000);
  assert.equal(res.bracketsBreakdown[1].taxAmount, 2_000_000);
  assert.equal(res.bracketsBreakdown[2].taxAmount, 4_000_000);
});

test('PIT Boundaries: Continuity and Precision at 10M, 30M, 60M, 100M', () => {
  const at9999999 = calculatePITFromTaxableIncome(9_999_999).totalTax;
  const at10000000 = calculatePITFromTaxableIncome(10_000_000).totalTax;
  const at10000001 = calculatePITFromTaxableIncome(10_000_001).totalTax;

  assert.equal(at9999999, Math.round(9_999_999 * 0.05));
  assert.equal(at10000000, 500_000);
  assert.equal(at10000001, 500_000 + Math.round(1 * 0.10));

  // 30M boundary
  assert.equal(calculatePITFromTaxableIncome(30_000_000).totalTax, 2_500_000);
  assert.equal(calculatePITFromTaxableIncome(30_000_001).totalTax, 2_500_000);

  // 60M boundary
  assert.equal(calculatePITFromTaxableIncome(60_000_000).totalTax, 8_500_000); // 500k + 2m + 6m = 8.5m

  // 100M boundary
  assert.equal(calculatePITFromTaxableIncome(100_000_000).totalTax, 20_500_000); // 8.5m + 12m = 20.5m
});

// ============================================================================
// SALARY TESTS
// ============================================================================
test('TC-SALARY-01: 09/2026, Gross 30M, Insurance base 30M, 0 Dependents', () => {
  const res = calculateGrossToNet({
    grossSalary: 30_000_000,
    insuranceSalary: 30_000_000,
    region: 1,
    dependents: 0,
    date: '2026-09-01',
  });

  assert.equal(res.employeeInsurance.bhxh, 2_400_000);
  assert.equal(res.employeeInsurance.bhyt, 450_000);
  assert.equal(res.employeeInsurance.bhtn, 300_000);
  assert.equal(res.employeeInsurance.total, 3_150_000);

  assert.equal(res.incomeBeforeFamilyDeduction, 26_850_000);
  assert.equal(res.personalDeduction, 15_500_000);
  assert.equal(res.dependentDeduction, 0);
  assert.equal(res.taxableIncome, 11_350_000);

  // PIT: 10m @ 5% (500k) + 1.35m @ 10% (135k) = 635,000
  assert.equal(res.pitTax, 635_000);
  assert.equal(res.netSalary, 26_215_000);

  // Employer cost
  assert.equal(res.employerInsurance.total, 6_450_000);
  assert.equal(res.employerCost, 36_450_000);
});

test('Salary Round-trip: Gross -> Net -> Gross matches within 1 VND', () => {
  const testGrossList = [15_000_000, 25_000_000, 30_000_000, 45_000_000, 80_000_000, 120_000_000];

  for (const gross of testGrossList) {
    const forward = calculateGrossToNet({
      grossSalary: gross,
      region: 1,
      dependents: 1,
      date: '2026-09-01',
    });

    const backward = calculateNetToGross({
      netSalary: forward.netSalary,
      region: 1,
      dependents: 1,
      date: '2026-09-01',
    });

    const diff = Math.abs(backward.grossSalary - gross);
    assert.ok(diff <= 1, `Roundtrip for Gross ${gross} produced ${backward.grossSalary}, diff: ${diff}`);
  }
});

// ============================================================================
// BHXH TESTS
// ============================================================================
test('TC-BHXH-01: 09/2026, salary base 30M', () => {
  const res = calculateVietnamInsurance(30_000_000, 1, '2026-09-01');

  assert.equal(res.employee.bhxh, 2_400_000);
  assert.equal(res.employee.bhyt, 450_000);
  assert.equal(res.employee.bhtn, 300_000);
  assert.equal(res.employee.total, 3_150_000);

  assert.equal(res.employer.total, 6_450_000);
  assert.equal(res.totalCombined, 9_600_000);
});

test('TC-BHXH-02: 09/2026, insurance salary 100M ceiling test', () => {
  const res = calculateVietnamInsurance(100_000_000, 1, '2026-09-01');

  // Base must cap at 50,600,000 for BHXH/BHYT
  assert.equal(res.cappedBhxhSalary, 50_600_000);
  assert.equal(res.isBhxhCapped, true);

  // Vùng I BHTN ceiling is 106,200,000, so 100M is not capped
  assert.equal(res.cappedBhtnSalary, 100_000_000);
  assert.equal(res.isBhtnCapped, false);

  // Vùng II BHTN ceiling is 94,600,000, so 100M is capped at 94.6M
  const resVung2 = calculateVietnamInsurance(100_000_000, 2, '2026-09-01');
  assert.equal(resVung2.cappedBhtnSalary, 94_600_000);
  assert.equal(resVung2.isBhtnCapped, true);
});

test('TC-BHXH-03: Date Switch: 30/06/2026 vs 01/07/2026 reference amounts', () => {
  const beforeJuly = calculateVietnamInsurance(100_000_000, 1, '2026-06-30');
  const fromJuly = calculateVietnamInsurance(100_000_000, 1, '2026-07-01');

  assert.equal(beforeJuly.baseSalaryReference, 2_340_000);
  assert.equal(beforeJuly.bhxhCeiling, 46_800_000);
  assert.equal(beforeJuly.cappedBhxhSalary, 46_800_000);

  assert.equal(fromJuly.baseSalaryReference, 2_530_000);
  assert.equal(fromJuly.bhxhCeiling, 50_600_000);
  assert.equal(fromJuly.cappedBhxhSalary, 50_600_000);
});

// ============================================================================
// ELECTRICITY TESTS
// ============================================================================
test('TC-ELEC-01: 50 kWh produces 99,200 before VAT', () => {
  const res = calculateVietnamElectricity({ kwh: 50 });
  assert.equal(res.subtotalBeforeVat, 99_200);
  assert.equal(res.tiersBreakdown[0].amount, 99_200);
  assert.equal(res.tiersBreakdown[1].amount, 0);
});

test('TC-ELEC-02: 100 kWh produces 201,700 before VAT', () => {
  const res = calculateVietnamElectricity({ kwh: 100 });
  assert.equal(res.subtotalBeforeVat, 201_700);
  assert.equal(res.tiersBreakdown[0].amount, 99_200);
  assert.equal(res.tiersBreakdown[1].amount, 102_500);
  assert.equal(res.tiersBreakdown[2].amount, 0);
});

test('TC-ELEC-03: 250 kWh produces 589,600 before VAT', () => {
  const res = calculateVietnamElectricity({ kwh: 250 });
  assert.equal(res.subtotalBeforeVat, 589_600);
  assert.equal(res.tiersBreakdown[0].amount, 99_200);
  assert.equal(res.tiersBreakdown[1].amount, 102_500);
  assert.equal(res.tiersBreakdown[2].amount, 238_000);
  assert.equal(res.tiersBreakdown[3].amount, 149_900);
  assert.equal(res.tiersBreakdown[4].amount, 0);
});

test('Electricity Boundaries: 50, 51, 100, 101, 200, 201, 300, 301, 400, 401 kWh', () => {
  const b50 = calculateVietnamElectricity({ kwh: 50 }).subtotalBeforeVat;
  const b51 = calculateVietnamElectricity({ kwh: 51 }).subtotalBeforeVat;
  assert.equal(b51 - b50, 2_050);

  const b100 = calculateVietnamElectricity({ kwh: 100 }).subtotalBeforeVat;
  const b101 = calculateVietnamElectricity({ kwh: 101 }).subtotalBeforeVat;
  assert.equal(b101 - b100, 2_380);

  const b200 = calculateVietnamElectricity({ kwh: 200 }).subtotalBeforeVat;
  const b201 = calculateVietnamElectricity({ kwh: 201 }).subtotalBeforeVat;
  assert.equal(b201 - b200, 2_998);

  const b300 = calculateVietnamElectricity({ kwh: 300 }).subtotalBeforeVat;
  const b301 = calculateVietnamElectricity({ kwh: 301 }).subtotalBeforeVat;
  assert.equal(b301 - b300, 3_350);

  const b400 = calculateVietnamElectricity({ kwh: 400 }).subtotalBeforeVat;
  const b401 = calculateVietnamElectricity({ kwh: 401 }).subtotalBeforeVat;
  assert.equal(b401 - b400, 3_460);
});

test('Electricity Meter Reading Calculation: newReading - oldReading', () => {
  const res = calculateVietnamElectricity({ oldReading: 1200, newReading: 1450 });
  assert.equal(res.kwh, 250);
  assert.equal(res.subtotalBeforeVat, 589_600);
  assert.equal(res.validationError, null);

  const invalid = calculateVietnamElectricity({ oldReading: 1500, newReading: 1400 });
  assert.equal(invalid.kwh, 0);
  assert.ok(invalid.validationError);
});

test('TC-BHXH-04: UI Contract Shape for SocialInsuranceCalculatorVNView', () => {
  const res = calculateVietnamInsurance(30_000_000, 1, '2026-09-01');
  assert.ok(res.combined, 'res.combined must exist');
  assert.equal(res.combined.total, 9_600_000);
  assert.equal(res.totalCombined, 9_600_000);
  assert.ok(res.salaryBase, 'res.salaryBase must exist');
  assert.equal(typeof res.salaryBase.bhxhBase, 'number');
  assert.equal(typeof res.salaryBase.bhtnBase, 'number');
  assert.equal(typeof res.employee.total, 'number');
  assert.equal(typeof res.employer.total, 'number');
});

