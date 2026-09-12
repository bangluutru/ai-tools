import test from 'node:test';
import assert from 'node:assert/strict';

import {
  solveIRR,
  calculateNPV,
  annualizeRate,
  calculateLoanAPRFromCashFlow,
  calculateLoanPaymentAndSchedule,
} from '../src/vietnam/engines/loanAprEngine.js';

// ============================================================================
// TC-LOAN-01: Standard Consumer Installment Loan (Amortized / Reducing Balance)
// ============================================================================
test('TC-LOAN-01: Standard consumer installment loan - 100M, 12M, 12% reducing', () => {
  const res = calculateLoanPaymentAndSchedule({
    principal: 100_000_000,
    termMonths: 12,
    annualInterestRatePercent: 12,
    method: 'amortized',
    upfrontFee: 0,
    monthlyFee: 0,
  });

  // Monthly payment around 8,884,879
  assert.ok(Math.abs(res.firstPayment - 8_884_879) <= 2, `Expected ~8,884,879, got ${res.firstPayment}`);
  assert.ok(Math.abs(res.lastPayment - 8_884_879) <= 5, `Expected ~8,884,879, got ${res.lastPayment}`);
  assert.ok(Math.abs(res.totalInterest - 6_618_547) <= 10, `Expected ~6,618,547, got ${res.totalInterest}`);
  assert.equal(res.totalFees, 0);

  // Nominal APR with 0 fees must be exactly 12%
  assert.ok(Math.abs(res.nominalAPR - 12) < 0.05, `Expected APR ~12%, got ${res.nominalAPR}`);
  // EAR should be (1 + 0.01)^12 - 1 = 12.68%
  assert.ok(Math.abs(res.effectiveAPR - 12.68) < 0.05, `Expected EAR ~12.68%, got ${res.effectiveAPR}`);
  assert.equal(res.schedule.length, 12);
  assert.equal(res.schedule[11].remainingBalance, 0);
});

// ============================================================================
// TC-LOAN-02: Flat-rate Loan Disguised Interest
// ============================================================================
test('TC-LOAN-02: Flat-rate loan disguised interest - 100M, 12M, 12% flat', () => {
  const res = calculateLoanPaymentAndSchedule({
    principal: 100_000_000,
    termMonths: 12,
    annualInterestRatePercent: 12,
    method: 'flat',
    upfrontFee: 0,
    monthlyFee: 0,
  });

  // Monthly payment = 100M/12 + 100M * 1% = 8,333,333 + 1,000,000 = 9,333,333
  assert.equal(res.firstPayment, 9_333_333);
  assert.equal(res.totalInterest, 12_000_000); // 12% of 100M

  // The real nominal APR should be ~21.46%, and EAR ~23.7%
  assert.ok(res.nominalAPR > 21.0 && res.nominalAPR < 22.0, `Expected APR ~21.46%, got ${res.nominalAPR}`);
  assert.ok(res.effectiveAPR > 23.0 && res.effectiveAPR < 24.5, `Expected EAR ~23.7%, got ${res.effectiveAPR}`);
  assert.ok(res.discrepancyAPR > 9, `Expected discrepancy > 9%, got ${res.discrepancyAPR}`);
  assert.equal(res.isFlatRateWarning, true);
});

// ============================================================================
// TC-LOAN-03: Zero-interest Loan with Processing Fees
// ============================================================================
test('TC-LOAN-03: Zero-interest loan with upfront fee - 12M, 0% interest, 1.2M fee', () => {
  const res = calculateLoanAPRFromCashFlow({
    contractPrincipal: 12_000_000,
    termMonths: 12,
    monthlyInstallment: 1_000_000, // 12M / 12 = 1M/month
    upfrontFees: 1_200_000,
    inTermMonthlyFee: 0,
  });

  assert.equal(res.netDisbursed, 10_800_000);
  assert.equal(res.totalPaidToLender, 13_200_000); // 12 * 1M + 1.2M
  assert.equal(res.totalFees, 1_200_000);
  // Periodic rate around 1.64% per month -> nominal APR ~ 19.68%, EAR ~ 21.5%
  assert.ok(res.nominalAPR > 19.0 && res.nominalAPR < 20.5, `Expected nominal APR ~19.7%, got ${res.nominalAPR}`);
  assert.ok(res.effectiveAPR > 21.0 && res.effectiveAPR < 22.5, `Expected EAR ~21.5%, got ${res.effectiveAPR}`);
});

// ============================================================================
// TC-LOAN-04: Mode A Cash Flow with In-term Insurance/Management Fees
// ============================================================================
test('TC-LOAN-04: Mode A with upfront fee and in-term monthly fee', () => {
  const res = calculateLoanAPRFromCashFlow({
    contractPrincipal: 50_000_000,
    termMonths: 12,
    monthlyInstallment: 4_500_000,
    upfrontFees: 1_500_000,
    inTermMonthlyFee: 50_000,
  });

  assert.equal(res.netDisbursed, 48_500_000);
  assert.equal(res.totalPaidToLender, 56_100_000); // 1.5M upfront + 12 * 4.55M
  assert.equal(res.totalFees, 2_100_000); // 1.5M + 12 * 50k
  // Cash flow solved successfully and APR > 0
  assert.ok(res.nominalAPR > 20, `Expected nominal APR > 20%, got ${res.nominalAPR}`);
  assert.ok(res.effectiveAPR > res.nominalAPR, 'EAR must be greater than nominal APR');
});

// ============================================================================
// TC-LOAN-05: Fixed Principal (Reducing Balance)
// ============================================================================
test('TC-LOAN-05: Fixed Principal (Reducing Balance) - 120M, 12M, 10%', () => {
  const res = calculateLoanPaymentAndSchedule({
    principal: 120_000_000,
    termMonths: 12,
    annualInterestRatePercent: 10,
    method: 'fixed_principal',
    upfrontFee: 0,
    monthlyFee: 0,
  });

  // Principal per month = 10,000,000
  // Month 1 interest = 120M * 10% / 12 = 1,000,000 -> payment = 11,000,000
  // Month 12 interest = 10M * 10% / 12 = 83,333 -> payment = 10,083,333
  assert.equal(res.firstPayment, 11_000_000);
  assert.equal(res.lastPayment, 10_083_333);
  assert.ok(res.firstPayment > res.lastPayment);
  assert.ok(Math.abs(res.totalInterest - 6_500_000) <= 10);
  assert.ok(Math.abs(res.nominalAPR - 10) < 0.1, `Expected APR ~10%, got ${res.nominalAPR}`);
});

// ============================================================================
// IRR Solver & Edge Cases
// ============================================================================
test('IRR Solver edge cases: Zero cash flows or invalid inputs', () => {
  assert.equal(solveIRR([]), null);
  assert.equal(solveIRR([100, 100]), null); // No negative cash flows

  // 1 period loan: Borrow 100, repay 110
  const rate = solveIRR([100, -110]);
  assert.ok(Math.abs(rate - 0.10) < 1e-5);
});

test('calculateLoanPaymentAndSchedule with zero loan or term returns safe zeros', () => {
  const zeroRes = calculateLoanPaymentAndSchedule({
    principal: 0,
    termMonths: 12,
    annualInterestRatePercent: 10,
  });
  assert.equal(zeroRes.firstPayment, 0);
  assert.equal(zeroRes.nominalAPR, 0);
  assert.equal(zeroRes.schedule.length, 0);
});
