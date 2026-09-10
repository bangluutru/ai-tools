/**
 * @file packages/core/tests/regulatory-japan-family-golden.test.js
 * @description
 * Bộ kiểm thử vàng pháp quy (Regulatory Golden Tests) cho tên miền Family & Child (家族・子育て).
 * Xác thực tính toán chính xác tuyệt đối các quy định của Luật BHYT, Luật Nghỉ chăm con, và Luật Trợ cấp Trẻ em.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  calculateMaternityAllowance,
  MATERNITY_STATUTORY_CONSTANTS,
} from '../src/japan/family/index.js';

test('Milestone 1: 出産手当金シミュレーター (Maternity Allowance Golden Tests)', async (t) => {
  // Case 1: Sinh đúng ngày dự sinh (Birth on due date, single pregnancy)
  await t.test('M1-01: Tính chính xác số ngày và số tiền khi sinh đúng ngày dự sinh (42 + 56 = 98 ngày)', () => {
    const result = calculateMaternityAllowance({
      expectedBirthDate: '2026-10-10',
      actualBirthDate: '2026-10-10',
      isMultiplePregnancy: false,
      monthlySalary: 300000, // Tiêu chuẩn 300,000円 (Cấp 22)
      dailySalaryPaidDuringLeave: 0,
    });

    assert.equal(result.isEligible, true);
    assert.equal(result.daysBreakdown.prenatalDays, 42);
    assert.equal(result.daysBreakdown.postnatalDays, 56);
    assert.equal(result.daysBreakdown.delayDays, 0);
    assert.equal(result.daysBreakdown.earlyDays, 0);
    assert.equal(result.eligiblePeriod.totalEligibleDays, 98);

    // Mức trợ cấp ngày: 300,000 / 30 * 2/3 = 6,666.666... -> 6,667円
    assert.equal(result.financials.standardDailyBenefit, 6667);
    assert.equal(result.financials.netDailyBenefit, 6667);
    // Tổng số tiền: 6,667 * 98 = 653,366円
    assert.equal(result.financials.totalNetAmount, 653366);
    assert.equal(result.financials.isPartialSalaryOffset, false);
  });

  // Case 2: Sinh sớm hơn ngày dự kiến (Birth before due date)
  await t.test('M1-02: Sinh sớm hơn ngày dự sinh 9 ngày (33 ngày trước + 56 ngày sau = 89 ngày)', () => {
    const result = calculateMaternityAllowance({
      expectedBirthDate: '2026-10-10',
      actualBirthDate: '2026-10-01', // Sớm 9 ngày
      isMultiplePregnancy: false,
      monthlySalary: 300000,
      dailySalaryPaidDuringLeave: 0,
    });

    assert.equal(result.isEligible, true);
    assert.equal(result.birthDateRelation, 'before_due_date');
    assert.equal(result.daysBreakdown.prenatalDays, 33);
    assert.equal(result.daysBreakdown.earlyDays, 9);
    assert.equal(result.daysBreakdown.postnatalDays, 56);
    assert.equal(result.eligiblePeriod.totalEligibleDays, 89);
    assert.equal(result.financials.totalNetAmount, 6667 * 89);
  });

  // Case 3: Sinh muộn hơn ngày dự kiến (Birth after due date)
  await t.test('M1-03: Sinh muộn hơn ngày dự sinh 5 ngày (42 + 5 + 56 = 103 ngày)', () => {
    const result = calculateMaternityAllowance({
      expectedBirthDate: '2026-10-10',
      actualBirthDate: '2026-10-15', // Muộn 5 ngày
      isMultiplePregnancy: false,
      monthlySalary: 300000,
      dailySalaryPaidDuringLeave: 0,
    });

    assert.equal(result.isEligible, true);
    assert.equal(result.birthDateRelation, 'after_due_date');
    assert.equal(result.daysBreakdown.delayDays, 5);
    assert.equal(result.daysBreakdown.prenatalDays, 47);
    assert.equal(result.daysBreakdown.postnatalDays, 56);
    assert.equal(result.eligiblePeriod.totalEligibleDays, 103);
    assert.equal(result.financials.totalNetAmount, 6667 * 103);
  });

  // Case 4: Đa thai (Multiple pregnancy: 98 ngày trước + 56 ngày sau = 154 ngày)
  await t.test('M1-04: Đa thai sinh đôi/ba được nghỉ trước sinh 98 ngày (tổng 154 ngày)', () => {
    const result = calculateMaternityAllowance({
      expectedBirthDate: '2026-10-10',
      actualBirthDate: '2026-10-10',
      isMultiplePregnancy: true,
      monthlySalary: 300000,
      dailySalaryPaidDuringLeave: 0,
    });

    assert.equal(result.isEligible, true);
    assert.equal(result.daysBreakdown.prenatalDays, 98);
    assert.equal(result.daysBreakdown.postnatalDays, 56);
    assert.equal(result.eligiblePeriod.totalEligibleDays, 154);
    assert.equal(result.financials.totalNetAmount, 6667 * 154);
  });

  // Case 5: Có lịch sử lương 12 tháng đầy đủ (12+ months remuneration history)
  await t.test('M1-05: Áp dụng mức bình quân chính xác của 12 tháng thù lao chuẩn quá khứ', () => {
    const history = [
      280000, 280000, 280000, 280000, 280000, 280000,
      320000, 320000, 320000, 320000, 320000, 320000
    ]; // Bình quân 300,000円
    const result = calculateMaternityAllowance({
      expectedBirthDate: '2026-10-10',
      actualBirthDate: '2026-10-10',
      remunerationHistory: history,
      insuranceMonths: 12,
    });

    assert.equal(result.isEligible, true);
    assert.equal(result.isEstimated, false);
    assert.equal(result.financials.calculationBasisType, '12_months_history');
    assert.equal(result.financials.standardMonthlyRemuneration, 300000);
    assert.equal(result.financials.standardDailyBenefit, 6667);
  });

  // Case 6: Tham gia dưới 12 tháng với trần bình quân Hiệp hội 300,000円 (協会けんぽ上限)
  await t.test('M1-06: Đóng dưới 12 tháng có lương cao bị khống chế trần bình quân toàn hiệp hội (300,000円)', () => {
    const result = calculateMaternityAllowance({
      expectedBirthDate: '2026-10-10',
      actualBirthDate: '2026-10-10',
      monthlySalary: 450000, // Cấp 29: 440,000円 > 300,000円
      insuranceMonths: 6,
      insurerType: 'kyokai_kenpo',
    });

    assert.equal(result.isEligible, true);
    assert.equal(result.financials.isCappedByAssociationLimit, true);
    assert.equal(result.financials.calculationBasisType, 'kyokai_kenpo_capped');
    assert.equal(result.financials.standardMonthlyRemuneration, 300000);
    assert.equal(result.financials.standardDailyBenefit, 6667);
  });

  // Case 7: Lương dưới trần khi đóng dưới 12 tháng
  await t.test('M1-07: Đóng dưới 12 tháng nhưng lương thấp hơn trần toàn hiệp hội thì giữ nguyên mức thực tế', () => {
    const result = calculateMaternityAllowance({
      expectedBirthDate: '2026-10-10',
      actualBirthDate: '2026-10-10',
      monthlySalary: 200000, // Cấp 17: 200,000円 < 300,000円
      insuranceMonths: 5,
      insurerType: 'kyokai_kenpo',
    });

    assert.equal(result.isEligible, true);
    assert.equal(result.financials.isCappedByAssociationLimit, false);
    assert.equal(result.financials.standardMonthlyRemuneration, 200000);
    // 200,000 / 30 * 2/3 = 4,444.444... -> 4,444円
    assert.equal(result.financials.standardDailyBenefit, 4444);
  });

  // Case 8: Công ty trả lương một phần trong thời gian nghỉ (Partial salary offset)
  await t.test('M1-08: Khấu trừ phần bù lương khi công ty trả lương một phần thấp hơn mức trợ cấp', () => {
    const result = calculateMaternityAllowance({
      expectedBirthDate: '2026-10-10',
      actualBirthDate: '2026-10-10',
      monthlySalary: 300000, // Trợ cấp ngày: 6,667円
      dailySalaryPaidDuringLeave: 2500, // Công ty trả 2,500円/ngày
    });

    assert.equal(result.isEligible, true);
    assert.equal(result.financials.isPartialSalaryOffset, true);
    assert.equal(result.financials.isFullSalaryOffset, false);
    assert.equal(result.financials.standardDailyBenefit, 6667);
    assert.equal(result.financials.dailyPaidSalary, 2500);
    assert.equal(result.financials.netDailyBenefit, 6667 - 2500); // 4,167円
    assert.equal(result.financials.totalNetAmount, 4167 * 98);
  });

  // Case 9: Công ty trả lương đầy đủ vượt mức trợ cấp (Full salary offset -> Trợ cấp = 0円)
  await t.test('M1-09: Công ty trả lương cao hơn mức trợ cấp thì số tiền trợ cấp thai sản nhận được là 0円', () => {
    const result = calculateMaternityAllowance({
      expectedBirthDate: '2026-10-10',
      actualBirthDate: '2026-10-10',
      monthlySalary: 300000,
      dailySalaryPaidDuringLeave: 8000, // > 6,667円
    });

    assert.equal(result.isEligible, true);
    assert.equal(result.financials.isFullSalaryOffset, true);
    assert.equal(result.financials.netDailyBenefit, 0);
    assert.equal(result.financials.totalNetAmount, 0);
  });

  // Case 10: Trường hợp thôi việc tiếp tục nhận trợ cấp (健康保険法第104条)
  await t.test('M1-10: Tiếp tục nhận trợ cấp sau khi nghỉ việc nếu đủ thâm niên 1 năm và không đi làm ngày cuối', () => {
    // Đủ điều kiện
    const eligibleLeave = calculateMaternityAllowance({
      expectedBirthDate: '2026-10-10',
      actualBirthDate: '2026-10-10',
      monthlySalary: 300000,
      isLeavingJob: true,
      continuousInsuredYearsBeforeLeaving: 1.5,
      workedOnRetirementDate: false,
    });
    assert.equal(eligibleLeave.isEligible, true);
    assert.equal(eligibleLeave.isRetirementContinuation, true);

    // Không đủ thâm niên 1 năm
    const shortTenure = calculateMaternityAllowance({
      expectedBirthDate: '2026-10-10',
      actualBirthDate: '2026-10-10',
      monthlySalary: 300000,
      isLeavingJob: true,
      continuousInsuredYearsBeforeLeaving: 0.8,
      workedOnRetirementDate: false,
    });
    assert.equal(shortTenure.isEligible, false);
    assert.equal(shortTenure.ineligibleReasonCode, 'RETIREMENT_TENURE_TOO_SHORT');

    // Ngày cuối cùng vẫn đi làm nhận lương
    const workedLastDay = calculateMaternityAllowance({
      expectedBirthDate: '2026-10-10',
      actualBirthDate: '2026-10-10',
      monthlySalary: 300000,
      isLeavingJob: true,
      continuousInsuredYearsBeforeLeaving: 2,
      workedOnRetirementDate: true,
    });
    assert.equal(workedLastDay.isEligible, false);
    assert.equal(workedLastDay.ineligibleReasonCode, 'RETIREMENT_WORKED_LAST_DAY');
  });

  // Case 11: Đối tượng không phải BHYT doanh nghiệp (Quốc bảo / phụ thuộc)
  await t.test('M1-11: Người tham gia BHYT Quốc dân (Quốc bảo) không được hưởng trợ cấp thai sản theo ngày', () => {
    const nhiResult = calculateMaternityAllowance({
      expectedBirthDate: '2026-10-10',
      isEmployedInsured: false,
      insurerType: 'nhi',
    });

    assert.equal(nhiResult.isEligible, false);
    assert.equal(nhiResult.ineligibleReasonCode, 'NOT_EMPLOYED_INSURED');
  });
});
