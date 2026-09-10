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
  checkChildcareLeaveEligibility,
  ELIGIBILITY_STATUS,
  CHILDCARE_BENEFIT_SCHEMES,
  calculateChildcareBenefit,
  CHILDCARE_BENEFIT_CONSTANTS,
  calculateChildAllowance,
  CHILD_ALLOWANCE_CONSTANTS,
  calculateChildbirthLumpSumGrant,
  BIRTH_GRANT_CONSTANTS,
  getRoadmapStages,
  calculateChecklistStats,
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

test('Milestone 2: 育児休業・給付チェッカー (Childcare Leave & Benefit Eligibility Golden Tests)', async (t) => {
  // Case 1: Lao động chính quy (Regular employee) - Mẹ đủ điều kiện nghỉ con & Trợ cấp tiêu chuẩn
  await t.test('M2-01: Mẹ đi làm chính quy đủ 12 tháng BHTN, con 6 tháng: đủ điều kiện nghỉ việc và nhận trợ cấp tiêu chuẩn', () => {
    const result = checkChildcareLeaveEligibility({
      userRole: 'mother',
      employmentStatus: 'regular',
      isEnrolledEmploymentInsurance: true,
      employmentInsuranceMonthsInPast2Years: 18,
      childAgeMonths: 6,
    });

    assert.equal(result.statutoryLeaveRight.isEligible, true);
    assert.equal(result.statutoryLeaveRight.status, ELIGIBILITY_STATUS.LIKELY_ELIGIBLE);
    assert.equal(result.schemes.standardBenefit.status, ELIGIBILITY_STATUS.LIKELY_ELIGIBLE);
    // Mẹ trong 8 tuần đầu hay sau sinh không dùng Papa Ikukyu
    assert.equal(result.schemes.postBirthPapaBenefit.status, ELIGIBILITY_STATUS.NOT_APPLICABLE);
  });

  // Case 2: Bố xin nghỉ sau sinh (産後パパ育休) trong 8 tuần đầu
  await t.test('M2-02: Bố xin nghỉ sau sinh trong 8 tuần đầu (con 1 tháng, nghỉ 14 ngày, đủ BHTN): đủ điều kiện Papa Ikukyu', () => {
    const result = checkChildcareLeaveEligibility({
      userRole: 'father',
      employmentStatus: 'regular',
      isEnrolledEmploymentInsurance: true,
      employmentInsuranceMonthsInPast2Years: 24,
      childAgeMonths: 1,
      isRequestingPostBirthPapaIkukyu: true,
      postBirthLeaveDays: 14,
    });

    assert.equal(result.statutoryLeaveRight.isEligible, true);
    assert.equal(result.schemes.postBirthPapaBenefit.status, ELIGIBILITY_STATUS.LIKELY_ELIGIBLE);
    assert.equal(result.schemes.standardBenefit.status, ELIGIBILITY_STATUS.LIKELY_ELIGIBLE);
  });

  // Case 3: Thưởng hỗ trợ sau sinh 13% khi cả 2 vợ chồng cùng nghỉ >= 14 ngày
  await t.test('M2-03: Cả hai vợ chồng cùng nghỉ >= 14 ngày: đủ điều kiện hưởng thưởng hỗ trợ sau sinh 13% (tổng 80% lương)', () => {
    const result = checkChildcareLeaveEligibility({
      userRole: 'father',
      employmentStatus: 'regular',
      isEnrolledEmploymentInsurance: true,
      employmentInsuranceMonthsInPast2Years: 24,
      childAgeMonths: 1,
      postBirthLeaveDays: 14,
      spouseStatus: {
        takesQualifyingLeave: true,
        isException: false,
      },
    });

    assert.equal(result.schemes.postBirthSupportBonus.status, ELIGIBILITY_STATUS.LIKELY_ELIGIBLE);
  });

  // Case 4: Thưởng hỗ trợ sau sinh 13% theo diện ngoại lệ người phối ngẫu (Single parent / Spouse unemployed)
  await t.test('M2-04: Nghỉ >= 14 ngày thuộc diện đơn thân hoặc vợ/chồng không đi làm: đủ điều kiện hưởng thưởng 13%', () => {
    const result = checkChildcareLeaveEligibility({
      userRole: 'mother',
      employmentStatus: 'regular',
      isEnrolledEmploymentInsurance: true,
      employmentInsuranceMonthsInPast2Years: 12,
      childAgeMonths: 1,
      postBirthLeaveDays: 14,
      spouseStatus: {
        takesQualifyingLeave: false,
        isException: true,
        exceptionType: 'single_parent',
      },
    });

    assert.equal(result.schemes.postBirthSupportBonus.status, ELIGIBILITY_STATUS.LIKELY_ELIGIBLE);
  });

  // Case 5: Thưởng hỗ trợ sau sinh cần xác nhận khi chưa rõ phối ngẫu có nghỉ >= 14 ngày hay không
  await t.test('M2-05: Bản thân nghỉ >= 14 ngày nhưng chưa rõ vợ/chồng có nghỉ hay không: trạng thái cần xác nhận (NEEDS_CONFIRMATION)', () => {
    const result = checkChildcareLeaveEligibility({
      userRole: 'father',
      employmentStatus: 'regular',
      isEnrolledEmploymentInsurance: true,
      employmentInsuranceMonthsInPast2Years: 12,
      childAgeMonths: 1,
      postBirthLeaveDays: 14,
      spouseStatus: {
        takesQualifyingLeave: false,
        isException: false,
        exceptionType: 'none',
      },
    });

    assert.equal(result.schemes.postBirthSupportBonus.status, ELIGIBILITY_STATUS.NEEDS_CONFIRMATION);
  });

  // Case 6: Thưởng hỗ trợ sau sinh không đủ điều kiện khi bản thân nghỉ dưới 14 ngày (<14 days leave)
  await t.test('M2-06: Bản thân nghỉ dưới 14 ngày (10 ngày): không đủ điều kiện hưởng thưởng 13%', () => {
    const result = checkChildcareLeaveEligibility({
      userRole: 'father',
      employmentStatus: 'regular',
      isEnrolledEmploymentInsurance: true,
      employmentInsuranceMonthsInPast2Years: 12,
      childAgeMonths: 1,
      postBirthLeaveDays: 10,
      spouseStatus: {
        takesQualifyingLeave: true,
      },
    });

    assert.equal(result.schemes.postBirthSupportBonus.status, ELIGIBILITY_STATUS.LIKELY_NOT_ELIGIBLE);
  });

  // Case 7: Con tròn 1 tuổi - gia hạn thành công khi có xác nhận trượt nhà trẻ (isDaycareRejected: true)
  await t.test('M2-07: Con 13 tháng có giấy xác nhận trượt nhà trẻ: được gia hạn quyền nghỉ và trợ cấp lên tối đa 2 tuổi', () => {
    const result = checkChildcareLeaveEligibility({
      userRole: 'mother',
      employmentStatus: 'regular',
      isEnrolledEmploymentInsurance: true,
      employmentInsuranceMonthsInPast2Years: 18,
      childAgeMonths: 13,
      isDaycareRejected: true,
    });

    assert.equal(result.statutoryLeaveRight.isEligible, true);
    assert.equal(result.statutoryLeaveRight.status, ELIGIBILITY_STATUS.LIKELY_ELIGIBLE);
    assert.equal(result.schemes.standardBenefit.status, ELIGIBILITY_STATUS.LIKELY_ELIGIBLE);
  });

  // Case 8: Con tròn 1 tuổi - chưa có giấy trượt nhà trẻ thì cần xác nhận
  await t.test('M2-08: Con 13 tháng chưa có giấy trượt nhà trẻ: quyền nghỉ và trợ cấp ở trạng thái cần xác nhận (NEEDS_CONFIRMATION)', () => {
    const result = checkChildcareLeaveEligibility({
      userRole: 'mother',
      employmentStatus: 'regular',
      isEnrolledEmploymentInsurance: true,
      employmentInsuranceMonthsInPast2Years: 18,
      childAgeMonths: 13,
      isDaycareRejected: false,
    });

    assert.equal(result.statutoryLeaveRight.isEligible, false);
    assert.equal(result.statutoryLeaveRight.status, ELIGIBILITY_STATUS.NEEDS_CONFIRMATION);
    assert.equal(result.schemes.standardBenefit.status, ELIGIBILITY_STATUS.NEEDS_CONFIRMATION);
  });

  // Case 9: Con đủ 2 tuổi - hết hạn nghỉ và trợ cấp tối đa theo luật
  await t.test('M2-09: Con đủ 24 tháng (2 tuổi): đã vượt quá thời hạn nghỉ và trợ cấp tối đa theo luật', () => {
    const result = checkChildcareLeaveEligibility({
      userRole: 'mother',
      employmentStatus: 'regular',
      isEnrolledEmploymentInsurance: true,
      employmentInsuranceMonthsInPast2Years: 18,
      childAgeMonths: 24,
      isDaycareRejected: true,
    });

    assert.equal(result.statutoryLeaveRight.isEligible, false);
    assert.equal(result.statutoryLeaveRight.status, ELIGIBILITY_STATUS.LIKELY_NOT_ELIGIBLE);
    assert.equal(result.schemes.standardBenefit.status, ELIGIBILITY_STATUS.LIKELY_NOT_ELIGIBLE);
  });

  // Case 10: Hợp đồng có thời hạn (Fixed-term) không được gia hạn trước khi con 1.5 tuổi
  await t.test('M2-10: HĐLĐ có thời hạn không được tái ký trước khi con 1.5 tuổi: không đủ điều kiện nghỉ theo luật', () => {
    const result = checkChildcareLeaveEligibility({
      userRole: 'mother',
      employmentStatus: 'fixed_term',
      isFixedTermContractRenewable: false,
      isEnrolledEmploymentInsurance: true,
      employmentInsuranceMonthsInPast2Years: 18,
      childAgeMonths: 3,
    });

    assert.equal(result.statutoryLeaveRight.isEligible, false);
    assert.equal(result.statutoryLeaveRight.status, ELIGIBILITY_STATUS.LIKELY_NOT_ELIGIBLE);
    assert.equal(result.schemes.standardBenefit.status, ELIGIBILITY_STATUS.LIKELY_NOT_ELIGIBLE);
  });

  // Case 11: Freelancer / Tự do hoặc Thất nghiệp không thuộc đối tượng áp dụng
  await t.test('M2-11: Lao động tự do (Freelancer) không thuộc đối tượng của Luật Nghỉ chăm con', () => {
    const result = checkChildcareLeaveEligibility({
      userRole: 'father',
      employmentStatus: 'self_employed_freelance',
      isEnrolledEmploymentInsurance: false,
      childAgeMonths: 2,
    });

    assert.equal(result.statutoryLeaveRight.isEligible, false);
    assert.equal(result.statutoryLeaveRight.status, ELIGIBILITY_STATUS.NOT_APPLICABLE);
    assert.equal(result.schemes.standardBenefit.status, ELIGIBILITY_STATUS.LIKELY_NOT_ELIGIBLE);
  });

  // Case 12: Không tham gia BHTN hoặc không đủ 12 tháng BHTN trong 2 năm qua
  await t.test('M2-12: Tham gia BHTN dưới 12 tháng (8 tháng): quyền nghỉ vẫn có nhưng trợ cấp BHTN không đủ điều kiện', () => {
    const result = checkChildcareLeaveEligibility({
      userRole: 'mother',
      employmentStatus: 'regular',
      isEnrolledEmploymentInsurance: true,
      employmentInsuranceMonthsInPast2Years: 8,
      childAgeMonths: 3,
    });

    assert.equal(result.statutoryLeaveRight.isEligible, true);
    assert.equal(result.schemes.standardBenefit.status, ELIGIBILITY_STATUS.LIKELY_NOT_ELIGIBLE);
  });

  // Case 13: Trợ cấp làm việc rút ngắn giờ (育児時短就業給付金) khi đi làm lại và nuôi con dưới 2 tuổi
  await t.test('M2-13: Đi làm lại và rút ngắn giờ nuôi con dưới 2 tuổi (từ 04/2025): đủ điều kiện hưởng trợ cấp rút ngắn giờ', () => {
    const result = checkChildcareLeaveEligibility({
      userRole: 'mother',
      employmentStatus: 'regular',
      isEnrolledEmploymentInsurance: true,
      employmentInsuranceMonthsInPast2Years: 18,
      childAgeMonths: 14,
      isShortTimeWork: true,
    });

    assert.equal(result.schemes.shortTimeWorkBenefit.status, ELIGIBILITY_STATUS.LIKELY_ELIGIBLE);
  });
});

test('Milestone 3: 育児休業給付シミュレーター (Childcare Benefit Simulator Golden Tests)', async (t) => {
  // Case 1: Lương chuẩn 300,000円/tháng, nghỉ 300 ngày (180 ngày 67% + 120 ngày 50%)
  await t.test('M3-01: Lương 300,000円 nghỉ 300 ngày: tính chính xác mức 67% cho 180 ngày đầu và 50% cho 120 ngày sau', () => {
    const result = calculateChildcareBenefit({
      monthlySalary: 300000,
      plannedLeaveDays: 300,
    });

    assert.equal(result.isEligible, true);
    assert.equal(result.wageDailyBasis.rawDailyWage, 10000);
    assert.equal(result.wageDailyBasis.statutoryDailyWage, 10000);
    assert.equal(result.wageDailyBasis.isCappedByMaxLimit, false);
    assert.equal(result.wageDailyBasis.isFlooredByMinLimit, false);

    // Tier 1 (180 ngày đầu): 10,000 * 67% = 6,700円/ngày -> 1,206,000円
    assert.equal(result.benefitBreakdown.tier1.days, 180);
    assert.equal(result.benefitBreakdown.tier1.dailyAmount, 6700);
    assert.equal(result.benefitBreakdown.tier1.totalAmount, 1206000);

    // Tier 2 (120 ngày sau): 10,000 * 50% = 5,000円/ngày -> 600,000円
    assert.equal(result.benefitBreakdown.tier2.days, 120);
    assert.equal(result.benefitBreakdown.tier2.dailyAmount, 5000);
    assert.equal(result.benefitBreakdown.tier2.totalAmount, 600000);

    assert.equal(result.financialsTotals?.totalStandardBenefit || result.financialTotals.totalStandardBenefit, 1806000);
    assert.equal(result.financialTotals.grandTotalBenefit, 1806000);
  });

  // Case 2: Lương cao bị khống chế trần MHLW 16,210円/ngày
  await t.test('M3-02: Lương cao (600,000円/tháng) bị khống chế trần mức lương ngày MHLW (16,210円)', () => {
    const result = calculateChildcareBenefit({
      monthlySalary: 600000,
      plannedLeaveDays: 180,
    });

    assert.equal(result.wageDailyBasis.isCappedByMaxLimit, true);
    assert.equal(result.wageDailyBasis.statutoryDailyWage, 16210);
    // 16,210 * 67% = 10,860.7 -> 10,860円/ngày
    assert.equal(result.benefitBreakdown.tier1.dailyAmount, 10860);
    assert.equal(result.benefitBreakdown.tier1.totalAmount, 10860 * 180);
  });

  // Case 3: Lương thấp được áp mức sàn MHLW 2,978円/ngày
  await t.test('M3-03: Lương thấp (80,000円/tháng) được áp mức sàn bảo đảm MHLW (2,978円)', () => {
    const result = calculateChildcareBenefit({
      monthlySalary: 80000,
      plannedLeaveDays: 180,
    });

    assert.equal(result.wageDailyBasis.isFlooredByMinLimit, true);
    assert.equal(result.wageDailyBasis.statutoryDailyWage, 2978);
    // 2,978 * 67% = 1,995.26 -> 1,995円/ngày
    assert.equal(result.benefitBreakdown.tier1.dailyAmount, 1995);
    assert.equal(result.benefitBreakdown.tier1.totalAmount, 1995 * 180);
  });

  // Case 4: Thưởng hỗ trợ sau sinh 13% trong 28 ngày đầu (出生後休業支援給付金)
  await t.test('M3-04: Đủ điều kiện thưởng hỗ trợ sau sinh 13%: cộng thêm 1,300円/ngày trong 28 ngày (tổng 80% lương)', () => {
    const result = calculateChildcareBenefit({
      monthlySalary: 300000,
      plannedLeaveDays: 300,
      qualifiesForPostBirthBonus: true,
      postBirthBonusDays: 28,
    });

    assert.equal(result.benefitBreakdown.postBirthBonus.isApplied, true);
    assert.equal(result.benefitBreakdown.postBirthBonus.days, 28);
    assert.equal(result.benefitBreakdown.postBirthBonus.dailyAmount, 1300);
    assert.equal(result.benefitBreakdown.postBirthBonus.totalAmount, 36400);

    // Tổng cộng = 1,806,000 + 36,400 = 1,842,400円
    assert.equal(result.financialTotals.grandTotalBenefit, 1842400);
  });

  // Case 5: Trợ cấp làm việc rút ngắn giờ nuôi con dưới 2 tuổi (育児時短就業給付金 - 10%)
  await t.test('M3-05: Đi làm lại và rút ngắn giờ nuôi con dưới 2 tuổi: nhận thêm trợ cấp 10% lương mỗi tháng', () => {
    const result = calculateChildcareBenefit({
      monthlySalary: 300000,
      plannedLeaveDays: 300,
      isShortTimeWork: true,
      shortTimeMonths: 6,
    });

    assert.equal(result.benefitBreakdown.shortTimeWork.isApplied, true);
    assert.equal(result.benefitBreakdown.shortTimeWork.monthlyAmount, 30000);
    assert.equal(result.benefitBreakdown.shortTimeWork.totalAmount, 180000);
    assert.equal(result.financialTotals.grandTotalBenefit, 1806000 + 180000);
  });

  // Case 6: Công ty trả lương trong thời gian nghỉ <= 13% không bị giảm trừ
  await t.test('M3-06: Công ty trả lương trong kỳ nghỉ <= 13% lương chuẩn: không bị giảm trừ trợ cấp', () => {
    const result = calculateChildcareBenefit({
      monthlySalary: 300000,
      plannedLeaveDays: 180,
      monthlySalaryDuringLeave: 30000, // 10% < 13%
    });

    assert.equal(result.financialTotals.isSalaryOffsetApplied, false);
    assert.equal(result.benefitBreakdown.tier1.monthlyAmount, 201000);
  });

  // Case 7: Công ty trả lương >= 80% lương chuẩn thì trợ cấp = 0円
  await t.test('M3-07: Công ty trả lương trong kỳ nghỉ >= 80% lương chuẩn: trợ cấp bị giảm về 0円', () => {
    const result = calculateChildcareBenefit({
      monthlySalary: 300000,
      plannedLeaveDays: 180,
      monthlySalaryDuringLeave: 250000, // > 80% (240,000円)
    });

    assert.equal(result.financialTotals.isSalaryOffsetApplied, true);
    assert.equal(result.financialTotals.isFullSalaryOffset, true);
    assert.equal(result.benefitBreakdown.tier1.monthlyAmount, 0);
    assert.equal(result.financialTotals.grandTotalBenefit, 0);
  });

  // Case 8: Công ty trả lương từ 13% đến 80% được bù phần chênh lệch
  await t.test('M3-08: Công ty trả lương trong khoảng 13% - 80%: trợ cấp được bù đắp sao cho tổng không vượt quá 80%', () => {
    const result = calculateChildcareBenefit({
      monthlySalary: 300000,
      plannedLeaveDays: 180,
      monthlySalaryDuringLeave: 120000, // 40% lương chuẩn
    });

    assert.equal(result.financialTotals.isSalaryOffsetApplied, true);
    assert.equal(result.financialTotals.isFullSalaryOffset, false);
    // 80% của 300k là 240k. 240k - 120k = 120,000円
    assert.equal(result.benefitBreakdown.tier1.monthlyAmount, 120000);
  });

  // Case 9: Timeline stages được xây dựng đầy đủ
  await t.test('M3-09: Xây dựng cấu trúc dữ liệu dòng thời gian (Timeline Stages) chi tiết cho giao diện trực quan', () => {
    const result = calculateChildcareBenefit({
      monthlySalary: 300000,
      plannedLeaveDays: 300,
      qualifiesForPostBirthBonus: true,
      postBirthBonusDays: 28,
      isShortTimeWork: true,
      shortTimeMonths: 6,
    });

    assert.equal(result.timelineStages.length, 4);
    assert.equal(result.timelineStages[0].stageId, 'tier1_initial');
    assert.equal(result.timelineStages[1].stageId, 'post_birth_support_bonus');
    assert.equal(result.timelineStages[2].stageId, 'tier2_subsequent');
    assert.equal(result.timelineStages[3].stageId, 'short_time_work');
  });
});

test('Milestone 4: 児童手当チェッカー (Child Allowance Oct 2024 Reform Golden Tests)', async (t) => {
  // Case 1: Gia đình 1 con 1 tuổi (dưới 3 tuổi)
  await t.test('M4-01: Con dưới 3 tuổi: nhận 15,000円/tháng, 180,000円/năm, mỗi kỳ chẵn nhận 30,000円', () => {
    const result = calculateChildAllowance({
      children: [{ age: 1, name: 'Bé 1 tuổi' }],
    });

    assert.equal(result.eligibleChildrenCount, 1);
    assert.equal(result.countingSiblingsCount, 1);
    assert.equal(result.totalMonthlyAllowance, 15000);
    assert.equal(result.totalAnnualAllowance, 180000);
    assert.equal(result.bimonthlyPayment, 30000);
    assert.equal(result.childrenDetails[0].rateTier, 'under_3');
  });

  // Case 2: Gia đình 1 con 5 tuổi (3 tuổi đến 18 tuổi)
  await t.test('M4-02: Con từ 3 tuổi đến cấp 3: nhận 10,000円/tháng, 120,000円/năm', () => {
    const result = calculateChildAllowance({
      children: [{ age: 5, name: 'Bé 5 tuổi' }],
    });

    assert.equal(result.eligibleChildrenCount, 1);
    assert.equal(result.totalMonthlyAllowance, 10000);
    assert.equal(result.totalAnnualAllowance, 120000);
    assert.equal(result.bimonthlyPayment, 20000);
    assert.equal(result.childrenDetails[0].rateTier, 'age_3_to_high_school');
  });

  // Case 3: Con học sinh cấp 3 (17 tuổi) - Mở rộng mới từ 10/2024
  await t.test('M4-03: Con học cấp 3 (17 tuổi): theo luật cũ nhận 0円, theo luật mới 10/2024 nhận 10,000円/tháng', () => {
    const result = calculateChildAllowance({
      children: [{ age: 17, name: 'Con 17 tuổi' }],
    });

    assert.equal(result.eligibleChildrenCount, 1);
    assert.equal(result.totalMonthlyAllowance, 10000);
    assert.equal(result.reformComparison.preReformMonthlyAllowance, 0);
    assert.equal(result.reformComparison.monthlyGain, 10000);
    assert.equal(result.reformComparison.highSchoolIncluded, true);
  });

  // Case 4: Gia đình 3 con (tuổi 8, 5, 2)
  await t.test('M4-04: Gia đình 3 con (8, 5, 2 tuổi): con thứ 3 hưởng mức đa tử 30,000円/tháng, tổng gia đình 50,000円/tháng', () => {
    const result = calculateChildAllowance({
      children: [
        { age: 8, name: 'Con đầu' },
        { age: 5, name: 'Con hai' },
        { age: 2, name: 'Con út' },
      ],
    });

    assert.equal(result.eligibleChildrenCount, 3);
    assert.equal(result.countingSiblingsCount, 3);

    const c1 = result.childrenDetails.find((c) => c.name === 'Con đầu');
    const c2 = result.childrenDetails.find((c) => c.name === 'Con hai');
    const c3 = result.childrenDetails.find((c) => c.name === 'Con út');

    assert.equal(c1.siblingRank, 1);
    assert.equal(c1.monthlyAllowance, 10000);

    assert.equal(c2.siblingRank, 2);
    assert.equal(c2.monthlyAllowance, 10000);

    assert.equal(c3.siblingRank, 3);
    assert.equal(c3.monthlyAllowance, 30000);
    assert.equal(c3.rateTier, 'third_child_or_above');

    assert.equal(result.totalMonthlyAllowance, 50000);
    assert.equal(result.totalAnnualAllowance, 600000);
    assert.equal(result.bimonthlyPayment, 100000);
  });

  // Case 5: Quy tắc tính anh/chị lớn 20 tuổi (sinh viên có chu cấp) vào thứ tự đếm đa tử
  await t.test('M4-05: Con lớn 20 tuổi có chu cấp: giữ vị trí Rank 1 để em thứ ba (10 tuổi) vẫn được hưởng mức 30,000円', () => {
    const result = calculateChildAllowance({
      children: [
        { age: 20, name: 'Anh cả ĐH (20t)', hasParentalSupport: true },
        { age: 16, name: 'Em hai cấp 3 (16t)' },
        { age: 10, name: 'Em út tiểu học (10t)' },
      ],
    });

    assert.equal(result.eligibleChildrenCount, 2); // Chỉ 2 em <= 18 tuổi nhận trợ cấp
    assert.equal(result.countingSiblingsCount, 3); // Cả 3 anh em đều được đếm thứ tự

    const oldest = result.childrenDetails.find((c) => c.name.includes('Anh cả'));
    const middle = result.childrenDetails.find((c) => c.name.includes('Em hai'));
    const youngest = result.childrenDetails.find((c) => c.name.includes('Em út'));

    assert.equal(oldest.siblingRank, 1);
    assert.equal(oldest.isReceivingAllowance, false);
    assert.equal(oldest.monthlyAllowance, 0);

    assert.equal(middle.siblingRank, 2);
    assert.equal(middle.isReceivingAllowance, true);
    assert.equal(middle.monthlyAllowance, 10000);

    assert.equal(youngest.siblingRank, 3);
    assert.equal(youngest.isReceivingAllowance, true);
    assert.equal(youngest.monthlyAllowance, 30000);

    assert.equal(result.totalMonthlyAllowance, 40000);
  });

  // Case 6: Con lớn tròn 23 tuổi (> 22 tuổi): Rớt khỏi danh sách đếm thứ tự
  await t.test('M4-06: Con lớn 23 tuổi (> 22t): rớt khỏi danh sách đếm, các em bị dịch chuyển thứ hạng (không còn con thứ 3)', () => {
    const result = calculateChildAllowance({
      children: [
        { age: 23, name: 'Anh cả đi làm (23t)', hasParentalSupport: true },
        { age: 16, name: 'Em hai cấp 3 (16t)' },
        { age: 10, name: 'Em út tiểu học (10t)' },
      ],
    });

    assert.equal(result.eligibleChildrenCount, 2);
    assert.equal(result.countingSiblingsCount, 2); // Chỉ còn 2 người được đếm

    const oldest = result.childrenDetails.find((c) => c.name.includes('Anh cả'));
    const middle = result.childrenDetails.find((c) => c.name.includes('Em hai'));
    const youngest = result.childrenDetails.find((c) => c.name.includes('Em út'));

    assert.equal(oldest.countsForSiblingOrder, false);
    assert.equal(oldest.siblingRank, null);

    assert.equal(middle.siblingRank, 1);
    assert.equal(middle.monthlyAllowance, 10000);

    assert.equal(youngest.siblingRank, 2);
    assert.equal(youngest.monthlyAllowance, 10000); // Rớt về con thứ 2 (10,000円 thay vì 30,000円)

    assert.equal(result.totalMonthlyAllowance, 20000);
  });

  // Case 7: Thu nhập hộ gia đình cao (15 triệu Yên/năm)
  await t.test('M4-07: Thu nhập cao 15M JPY: luật cũ bị cắt hoàn toàn (0円), luật mới nhận trọn vẹn 100%', () => {
    const result = calculateChildAllowance({
      children: [{ age: 2, name: 'Bé 2 tuổi' }],
      householdAnnualIncome: 15000000,
    });

    assert.equal(result.totalMonthlyAllowance, 15000);
    assert.equal(result.reformComparison.preReformMonthlyAllowance, 0);
    assert.equal(result.reformComparison.incomeLimitAbolishedBenefit, true);
    assert.equal(result.reformComparison.monthlyGain, 15000);
    assert.equal(result.reformComparison.annualGain, 180000);
  });

  // Case 8: Lịch chi trả 6 kỳ trong năm
  await t.test('M4-08: Lịch chi trả đúng 6 kỳ vào các tháng chẵn (2, 4, 6, 8, 10, 12), mỗi kỳ nhận 2 tháng', () => {
    const result = calculateChildAllowance({
      children: [{ age: 1, name: 'Bé 1' }],
    });

    assert.equal(result.disbursementSchedule.length, 6);
    const months = result.disbursementSchedule.map((d) => d.paymentMonth);
    assert.deepEqual(months, [2, 4, 6, 8, 10, 12]);
    assert.equal(result.disbursementSchedule[0].amount, 30000); // 15,000 x 2
  });

  // Case 9: Trường hợp danh sách rỗng an toàn không gây lỗi
  await t.test('M4-09: Xử lý an toàn khi danh sách con rỗng hoặc không hợp lệ', () => {
    const result = calculateChildAllowance({
      children: [],
    });

    assert.equal(result.hasChildren, false);
    assert.equal(result.totalMonthlyAllowance, 0);
    assert.equal(result.totalAnnualAllowance, 0);
    assert.equal(result.bimonthlyPayment, 0);
  });
});

test('Milestone 5: 妊娠・出産・育児ガイド (Birth Wizard & Life-Event Orchestrator Golden Tests)', async (t) => {
  // Case 1: Đơn thai sinh tại cơ sở có Quỹ bồi thường sản khoa
  await t.test('M5-01: Đơn thai tại cơ sở tham gia Quỹ bồi thường sản khoa: trợ cấp chính xác 500,000円', () => {
    const result = calculateChildbirthLumpSumGrant({
      childCount: 1,
      isParticipatingInObstetricCompensation: true,
      actualHospitalCost: 500000,
    });

    assert.equal(result.grantPerChild, 500000);
    assert.equal(result.totalGrantAmount, 500000);
    assert.equal(result.outOfPocketExpense, 0);
    assert.equal(result.surplusRefund, 0);
    assert.equal(result.isDirectPayment, true);
  });

  // Case 2: Đa thai (Sinh đôi = 2 bé)
  await t.test('M5-02: Đa thai (sinh đôi 2 bé): trợ cấp gấp đôi = 1,000,000円', () => {
    const result = calculateChildbirthLumpSumGrant({
      childCount: 2,
      isParticipatingInObstetricCompensation: true,
      actualHospitalCost: 950000,
    });

    assert.equal(result.grantPerChild, 500000);
    assert.equal(result.totalGrantAmount, 1000000);
    assert.equal(result.outOfPocketExpense, 0);
    assert.equal(result.surplusRefund, 50000); // Viện phí 950k < 1 triệu -> hoàn dư 50k
  });

  // Case 3: Cơ sở không tham gia Quỹ bồi thường sản khoa (488,000円)
  await t.test('M5-03: Cơ sở y tế không tham gia Quỹ bồi thường: mức trợ cấp là 488,000円/bé', () => {
    const result = calculateChildbirthLumpSumGrant({
      childCount: 1,
      isParticipatingInObstetricCompensation: false,
      actualHospitalCost: 500000,
    });

    assert.equal(result.grantPerChild, 488000);
    assert.equal(result.totalGrantAmount, 488000);
    assert.equal(result.outOfPocketExpense, 12000); // 500k - 488k = 12,000円 bù thêm
    assert.equal(result.surplusRefund, 0);
  });

  // Case 4: Viện phí thực tế cao hơn trợ cấp (530,000円)
  await t.test('M5-04: Viện phí thực tế vượt mức trợ cấp (530k vs 500k): người dùng bù thêm 30,000円 tại quầy', () => {
    const result = calculateChildbirthLumpSumGrant({
      childCount: 1,
      isParticipatingInObstetricCompensation: true,
      actualHospitalCost: 530000,
    });

    assert.equal(result.totalGrantAmount, 500000);
    assert.equal(result.outOfPocketExpense, 30000);
    assert.equal(result.surplusRefund, 0);
  });

  // Case 5: Viện phí thực tế thấp hơn trợ cấp (470,000円)
  await t.test('M5-05: Viện phí thực tế thấp hơn trợ cấp (470k vs 500k): được BHYT hoàn trả phần dư 30,000円', () => {
    const result = calculateChildbirthLumpSumGrant({
      childCount: 1,
      isParticipatingInObstetricCompensation: true,
      actualHospitalCost: 470000,
    });

    assert.equal(result.totalGrantAmount, 500000);
    assert.equal(result.outOfPocketExpense, 0);
    assert.equal(result.surplusRefund, 30000);
  });

  // Case 6: Bản đồ lộ trình chuẩn gồm đúng 6 giai đoạn tuần tự
  await t.test('M5-06: Bản đồ lộ trình chuẩn gồm đủ 6 giai đoạn từ mang thai đến con 2 tuổi', () => {
    const stages = getRoadmapStages();

    assert.equal(stages.length, 6);
    assert.equal(stages[0].stageId, 'stage1_early_pregnancy');
    assert.equal(stages[1].stageId, 'stage2_late_pregnancy');
    assert.equal(stages[2].stageId, 'stage3_birth_day');
    assert.equal(stages[3].stageId, 'stage4_immediate_post_birth');
    assert.equal(stages[4].stageId, 'stage5_childcare_leave_period');
    assert.equal(stages[5].stageId, 'stage6_return_to_work');
  });

  // Case 7: Tích hợp dữ liệu đặc thù địa phương Fukuoka City
  await t.test('M5-07: Tùy biến thông tin theo địa phương Fukuoka City (14 phiếu khám thai, quà sinh con 100k, y tế THCS)', () => {
    const stages = getRoadmapStages({ jurisdictionCode: 'JP-40-40130' });

    const s1 = stages.find((s) => s.stageId === 'stage1_early_pregnancy');
    const pregnancyNoticeTask = s1.tasks.find((t) => t.id === 'task_pregnancy_notification');
    const pregnancyGiftTask = s1.tasks.find((t) => t.id === 'task_pregnancy_support_gift');

    assert.match(pregnancyNoticeTask.localNotesVi, /14 phiếu khám thai/);
    assert.match(pregnancyNoticeTask.localNotesVi, /106,000円/);
    assert.match(pregnancyGiftTask.localNotesVi, /100,000円/);

    const s4 = stages.find((s) => s.stageId === 'stage4_immediate_post_birth');
    const medicalSubsidyTask = s4.tasks.find((t) => t.id === 'task_child_medical_subsidy');
    assert.match(medicalSubsidyTask.localNotesVi, /tốt nghiệp THCS/);
  });

  // Case 8: Tính toán thống kê tiến độ Checklist chính xác
  await t.test('M5-08: Thống kê tiến độ Checklist (Checklist Stats) tính toán chính xác số lượng và % hoàn thành', () => {
    const stages = getRoadmapStages();
    // Giả sử hoàn thành 2 task đầu của stage 1
    const completedTaskIds = ['task_pregnancy_notification', 'task_pregnancy_support_gift'];
    const stats = calculateChecklistStats(completedTaskIds, stages);

    assert.equal(stats.totalCompleted, 2);
    assert.equal(stats.totalTasks, 17); // 3 + 2 + 2 + 5 + 3 + 2 = 17 tasks
    assert.equal(stats.isAllCompleted, false);
    assert.equal(stats.stageStats[0].completed, 2);
    assert.equal(stats.stageStats[0].total, 3);
    assert.equal(stats.stageStats[0].percent, 67);
  });
});




