/**
 * @file packages/core/tests/regulatory-japan-employment-golden.test.js
 * @description Bộ kiểm thử chuẩn pháp quy (Regulatory Golden Tests) cho tên miền Lao động Nhật Bản (Japan Employment).
 * Căn cứ: 労働基準法 (Luật Tiêu chuẩn Lao động) & 雇用保険法 (Luật Bảo hiểm Việc làm / Thất nghiệp).
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  calculateBaseHourlyWage,
  calculateOvertimePay,
  STATUTORY_PREMIUM_RATES,
  STATUTORY_EXCLUDED_ALLOWANCES,
  calculatePaidLeaveEntitlement,
  lookupStatutoryGrantDays,
  isProportionalGrant,
  calculateServiceDuration,
  checkUnemploymentEligibility,
  classifySeparationReason,
  calculateUnemploymentBenefit,
  calculatePrescribedBenefitDays,
} from '../src/japan/employment/index.js';

test('Golden Test 1: Base hourly wage calculation for monthly salaried worker', () => {
  // Lương tháng 320,000円, số giờ quy định 160h/tháng -> Lương giờ = 2,000円
  const res = calculateBaseHourlyWage({
    wageType: 'monthly',
    baseWage: 320000,
    averageMonthlyHours: 160,
  });

  assert.equal(res.baseHourlyWage, 2000);
  assert.equal(res.calculatedPrescribedHours, 160);
  assert.equal(res.isEstimatedHours, false);
});

test('Golden Test 2: Excluded allowances (7 statutory items) are deducted from wage base', () => {
  // Tổng lương 350,000円, gồm 20,000円 phụ cấp đi lại (通勤手当) và 30,000円 phụ cấp gia đình (家族手当)
  // Lương làm căn cứ = 350,000 - 50,000 = 300,000円. Số giờ 160h -> Lương giờ = 1,875円
  const res = calculateBaseHourlyWage({
    wageType: 'monthly',
    baseWage: 350000,
    excludedAllowances: 50000,
    averageMonthlyHours: 160,
  });

  assert.equal(res.baseHourlyWage, 1875);
});

test('Golden Test 3: Standard overtime (<= 60 hours/month) at 25% premium (1.25x)', () => {
  // Lương giờ 2,000円, làm thêm 30 giờ ngoài giờ bình thường
  // Tiền làm thêm = 2,000 * 1.25 * 30 = 75,000円 (trong đó phần phụ trội là 2,000 * 0.25 * 30 = 15,000円)
  const res = calculateOvertimePay({
    wageType: 'hourly',
    baseWage: 2000,
    normalOvertimeHours: 30,
  });

  assert.equal(res.baseHourlyWage, 2000);
  assert.equal(res.breakdown.normalOvertime.hours, 30);
  assert.equal(res.breakdown.normalOvertime.totalPay, 75000);
  assert.equal(res.breakdown.normalOvertime.premiumOnly, 15000);
  assert.equal(res.totalOvertimePay, 75000);
});

test('Golden Test 4: Overtime boundary around 60 hours/month (月60時間超 50%割増)', () => {
  // Lương giờ 2,000円, làm thêm 70 giờ (60 giờ đầu 1.25x, 10 giờ sau 1.50x)
  // 60h * 2,000 * 1.25 = 150,000円
  // 10h * 2,000 * 1.50 = 30,000円
  // Tổng = 180,000円
  const res = calculateOvertimePay({
    wageType: 'hourly',
    baseWage: 2000,
    normalOvertimeHours: 60,
    overtimeAbove60h: 10,
  });

  assert.equal(res.breakdown.normalOvertime.totalPay, 150000);
  assert.equal(res.breakdown.overtimeAbove60h.totalPay, 30000);
  assert.equal(res.totalOvertimePay, 180000);
});

test('Golden Test 5: Late-night work premium (22:00 - 05:00) at +25%', () => {
  // Lương giờ 2,000円, 8 giờ làm đêm (phụ trội 25%) = 2,000 * 0.25 * 8 = 4,000円
  const res = calculateOvertimePay({
    wageType: 'hourly',
    baseWage: 2000,
    lateNightHours: 8,
  });

  assert.equal(res.breakdown.lateNight.premiumOnly, 4000);
  assert.equal(res.totalOvertimePay, 4000);
});

test('Golden Test 6: Statutory holiday work (法定休日労働) at 35% premium (1.35x)', () => {
  // Lương giờ 2,000円, 8 giờ làm ngày nghỉ luật định = 2,000 * 1.35 * 8 = 21,600円
  const res = calculateOvertimePay({
    wageType: 'hourly',
    baseWage: 2000,
    statutoryHolidayHours: 8,
  });

  assert.equal(res.breakdown.statutoryHoliday.totalPay, 21600);
  assert.equal(res.breakdown.statutoryHoliday.premiumOnly, 5600);
  assert.equal(res.totalOvertimePay, 21600);
});

test('Golden Test 7: Statutory holiday + Late-night work combo (法定休日 ＋ 深夜) at 60% premium (1.60x)', () => {
  // Lương giờ 2,000円, 4 giờ làm ngày nghỉ vào ca đêm = 2,000 * 1.60 * 4 = 12,800円
  const res = calculateOvertimePay({
    wageType: 'hourly',
    baseWage: 2000,
    holidayLateNightHours: 4,
  });

  assert.equal(res.breakdown.holidayLateNight.totalPay, 12800);
  assert.equal(res.breakdown.holidayLateNight.premiumOnly, 4800);
  assert.equal(res.totalOvertimePay, 12800);
});

test('Golden Test 8: Hourly worker and daily worker base wage derivation', () => {
  // Lương ngày 12,000円, ngày 8 giờ -> Lương giờ 1,500円
  const daily = calculateBaseHourlyWage({
    wageType: 'daily',
    baseWage: 12000,
    dailyScheduledHours: 8,
  });
  assert.equal(daily.baseHourlyWage, 1500);

  // Lương giờ 1,250円 -> Lương giờ 1,250円
  const hourly = calculateBaseHourlyWage({
    wageType: 'hourly',
    baseWage: 1250,
  });
  assert.equal(hourly.baseHourlyWage, 1250);
});

test('Golden Test 9: Full-time standard progression across service milestones (10 to 20 days)', () => {
  // Bảng chuẩn toàn thời gian: 6 tháng (10), 1.5 năm (11), 2.5 năm (12), 3.5 năm (14), 4.5 năm (16), 5.5 năm (18), 6.5 năm+ (20)
  assert.equal(lookupStatutoryGrantDays({ proportional: false, serviceMonths: 6 }), 10);
  assert.equal(lookupStatutoryGrantDays({ proportional: false, serviceMonths: 18 }), 11);
  assert.equal(lookupStatutoryGrantDays({ proportional: false, serviceMonths: 30 }), 12);
  assert.equal(lookupStatutoryGrantDays({ proportional: false, serviceMonths: 42 }), 14);
  assert.equal(lookupStatutoryGrantDays({ proportional: false, serviceMonths: 54 }), 16);
  assert.equal(lookupStatutoryGrantDays({ proportional: false, serviceMonths: 66 }), 18);
  assert.equal(lookupStatutoryGrantDays({ proportional: false, serviceMonths: 78 }), 20);
  assert.equal(lookupStatutoryGrantDays({ proportional: false, serviceMonths: 120 }), 20);
});

test('Golden Test 10: Service duration under 6 months grants 0 days', () => {
  // Người mới vào làm 3 tháng chưa có quyền nghỉ phép năm
  assert.equal(lookupStatutoryGrantDays({ proportional: false, serviceMonths: 3 }), 0);

  const res = calculatePaidLeaveEntitlement({
    hireDate: '2026-06-01',
    asOfDate: '2026-09-01', // 3 tháng
    weeklyHours: 40,
    weeklyDays: 5,
  });

  assert.equal(res.currentGrantDays, 0);
  assert.equal(res.warnings.some((w) => w.code === 'UNDER_SIX_MONTHS'), true);
});

test('Golden Test 11: Part-time proportional grant (週4日 / 169-216日: 7, 8, 9, 10, 12, 13, 15 days)', () => {
  assert.equal(isProportionalGrant({ weeklyHours: 25, weeklyDays: 4 }), true);
  assert.equal(isProportionalGrant({ weeklyHours: 35, weeklyDays: 4 }), false); // >= 30h là thông thường

  assert.equal(lookupStatutoryGrantDays({ proportional: true, weeklyDays: 4, serviceMonths: 6 }), 7);
  assert.equal(lookupStatutoryGrantDays({ proportional: true, weeklyDays: 4, serviceMonths: 18 }), 8);
  assert.equal(lookupStatutoryGrantDays({ proportional: true, weeklyDays: 4, serviceMonths: 30 }), 9);
  assert.equal(lookupStatutoryGrantDays({ proportional: true, weeklyDays: 4, serviceMonths: 42 }), 10);
  assert.equal(lookupStatutoryGrantDays({ proportional: true, weeklyDays: 4, serviceMonths: 54 }), 12);
  assert.equal(lookupStatutoryGrantDays({ proportional: true, weeklyDays: 4, serviceMonths: 66 }), 13);
  assert.equal(lookupStatutoryGrantDays({ proportional: true, weeklyDays: 4, serviceMonths: 78 }), 15);
});

test('Golden Test 12: Part-time proportional grant for 1 day/week and 2 days/week', () => {
  // 1 ngày/tuần: 0.5y: 1, 1.5y: 2, 2.5y: 2, 3.5y: 2, 4.5y: 3, 5.5y: 3, 6.5y+: 3
  assert.equal(lookupStatutoryGrantDays({ proportional: true, weeklyDays: 1, serviceMonths: 6 }), 1);
  assert.equal(lookupStatutoryGrantDays({ proportional: true, weeklyDays: 1, serviceMonths: 18 }), 2);
  assert.equal(lookupStatutoryGrantDays({ proportional: true, weeklyDays: 1, serviceMonths: 78 }), 3);

  // 2 ngày/tuần: 0.5y: 3, 1.5y: 4, 2.5y: 4, 3.5y: 5, 4.5y: 6, 5.5y: 6, 6.5y+: 7
  assert.equal(lookupStatutoryGrantDays({ proportional: true, weeklyDays: 2, serviceMonths: 6 }), 3);
  assert.equal(lookupStatutoryGrantDays({ proportional: true, weeklyDays: 2, serviceMonths: 18 }), 4);
  assert.equal(lookupStatutoryGrantDays({ proportional: true, weeklyDays: 2, serviceMonths: 78 }), 7);
});

test('Golden Test 13: 80% Attendance rule (出勤率8割要件)', () => {
  // Đi làm đầy đủ 1 năm 6 tháng, tỷ lệ chuyên cần 85% -> Được cấp 11 ngày
  const resPass = calculatePaidLeaveEntitlement({
    hireDate: '2025-03-01',
    asOfDate: '2026-09-01', // 1.5 năm
    attendanceRate: 0.85,
    weeklyHours: 40,
    weeklyDays: 5,
  });
  assert.equal(resPass.currentGrantDays, 11);
  assert.equal(resPass.isAttendanceQualified, true);

  // Đi làm 1 năm 6 tháng nhưng chỉ đạt 75% chuyên cần (< 80%) -> 0 ngày
  const resFail = calculatePaidLeaveEntitlement({
    hireDate: '2025-03-01',
    asOfDate: '2026-09-01',
    attendanceRate: 0.75,
    weeklyHours: 40,
    weeklyDays: 5,
  });
  assert.equal(resFail.currentGrantDays, 0);
  assert.equal(resFail.isAttendanceQualified, false);
  assert.equal(resFail.warnings.some((w) => w.code === 'ATTENDANCE_RATE_BELOW_80'), true);
});

test('Golden Test 14: Statutory 5-day mandatory leave obligation trigger (>= 10 days granted)', () => {
  // Cấp 10 ngày (full-time 6 tháng), đã nghỉ 2 ngày -> Còn thiếu 3 ngày bắt buộc phải nghỉ
  const res = calculatePaidLeaveEntitlement({
    hireDate: '2026-03-01',
    asOfDate: '2026-09-05',
    attendanceRate: 1.0,
    weeklyHours: 40,
    weeklyDays: 5,
    usedDaysCurrent: 2,
  });

  assert.equal(res.mandatory5Days.isApplicable, true);
  assert.equal(res.mandatory5Days.targetDays, 5);
  assert.equal(res.mandatory5Days.usedDays, 2);
  assert.equal(res.mandatory5Days.remainingDays, 3);
  assert.equal(res.warnings.some((w) => w.code === 'MANDATORY_5_DAYS_PENDING'), true);

  // Đã nghỉ đủ 5 ngày -> Hết cảnh báo nghĩa vụ
  const resFulfilled = calculatePaidLeaveEntitlement({
    hireDate: '2026-03-01',
    asOfDate: '2026-09-05',
    attendanceRate: 1.0,
    weeklyHours: 40,
    weeklyDays: 5,
    usedDaysCurrent: 5,
  });
  assert.equal(resFulfilled.mandatory5Days.remainingDays, 0);
  assert.equal(resFulfilled.warnings.some((w) => w.code === 'MANDATORY_5_DAYS_PENDING'), false);
});

test('Golden Test 15: Carryover balance calculation and 2-year statute of limitations', () => {
  // Thâm niên 2.5 năm (cấp mới 12 ngày), năm trước còn tồn chuyển tiếp 8 ngày
  // Tổng quỹ phép được hưởng = 12 + 8 = 20 ngày. Đã dùng 4 ngày -> Còn khả dụng 16 ngày
  const res = calculatePaidLeaveEntitlement({
    hireDate: '2024-03-01',
    asOfDate: '2026-09-05',
    attendanceRate: 1.0,
    weeklyHours: 40,
    weeklyDays: 5,
    carriedOverDays: 8,
    usedDaysCurrent: 4,
  });

  assert.equal(res.currentGrantDays, 12);
  assert.equal(res.carriedOverDays, 8);
  assert.equal(res.totalEntitledDays, 20);
  assert.equal(res.remainingAvailableDays, 16);
  assert.equal(res.statuteOfLimitationsYears, 2);
  assert.equal(res.sources.includes('mhlw-paid-leave-guidelines'), true);
  assert.equal(res.sources.includes('egov-labor-standards-act-39'), true);
});

test('Golden Test 16: Part-time worker receiving under 10 days does not trigger 5-day mandatory leave', () => {
  // Part-time 2 ngày/tuần, thâm niên 2.5 năm -> cấp mới 4 ngày (< 10 ngày)
  const res = calculatePaidLeaveEntitlement({
    hireDate: '2024-03-01',
    asOfDate: '2026-09-05',
    weeklyHours: 15,
    weeklyDays: 2,
  });

  assert.equal(res.isProportional, true);
  assert.equal(res.currentGrantDays, 4);
  assert.equal(res.mandatory5Days.isApplicable, false);
  assert.equal(res.mandatory5Days.targetDays, 0);
});

test('Golden Test 17: Company Cause (特定受給資格者) requires 6 months, 0 restriction months, 7 days waiting', () => {
  const res = checkUnemploymentEligibility({
    reasonId: 'dismissal_restructure',
    totalInsuredMonths: 8,
    isAbleToWorkImmediately: true,
  });

  assert.equal(res.status, 'QUALIFIED');
  assert.equal(res.categoryKey, 'COMPANY_CAUSE');
  assert.equal(res.requiredInsuredMonths, 6);
  assert.equal(res.timeline.waitingPeriodDays, 7);
  assert.equal(res.timeline.benefitRestrictionMonths, 0);
  assert.equal(res.timeline.hasBenefitRestriction, false);
  assert.equal(res.sources.includes('mhlw-hellowork-unemployment-guide'), true);
});

test('Golden Test 18: Specific Justified Cause (特定理由離職者 - 雇止め) requires 6 months, 0 restriction', () => {
  const res = checkUnemploymentEligibility({
    reasonId: 'contract_expired_refused',
    totalInsuredMonths: 6,
    isAbleToWorkImmediately: true,
  });

  assert.equal(res.status, 'QUALIFIED');
  assert.equal(res.categoryKey, 'SPECIFIC_REASONS');
  assert.equal(res.requiredInsuredMonths, 6);
  assert.equal(res.timeline.benefitRestrictionMonths, 0);
});

test('Golden Test 19: Personal Voluntary Resignation (一般離職者) requires 12 months, 2 months restriction', () => {
  const res = checkUnemploymentEligibility({
    reasonId: 'personal_choice',
    totalInsuredMonths: 14,
    isAbleToWorkImmediately: true,
  });

  assert.equal(res.status, 'QUALIFIED');
  assert.equal(res.categoryKey, 'PERSONAL_VOLUNTARY');
  assert.equal(res.requiredInsuredMonths, 12);
  assert.equal(res.timeline.waitingPeriodDays, 7);
  assert.equal(res.timeline.benefitRestrictionMonths, 2);
  assert.equal(res.timeline.hasBenefitRestriction, true);
});

test('Golden Test 20: Personal Voluntary Resignation with under 12 months -> NOT_QUALIFIED', () => {
  const res = checkUnemploymentEligibility({
    reasonId: 'personal_choice',
    totalInsuredMonths: 10,
    isAbleToWorkImmediately: true,
  });

  assert.equal(res.status, 'NOT_QUALIFIED');
  assert.equal(res.isInsuredMonthsSufficient, false);
  assert.equal(res.warnings.some((w) => w.code === 'INSUFFICIENT_INSURED_MONTHS'), true);
});

test('Golden Test 21: Gross Disciplinary Dismissal (重責解雇) incurs 3 months restriction', () => {
  const res = checkUnemploymentEligibility({
    reasonId: 'disciplinary_dismissal',
    totalInsuredMonths: 24,
    isAbleToWorkImmediately: true,
  });

  assert.equal(res.status, 'QUALIFIED');
  assert.equal(res.categoryKey, 'DISCIPLINARY');
  assert.equal(res.timeline.benefitRestrictionMonths, 3);
});

test('Golden Test 22: Unable to work due to temporary illness -> ACTION_EXTENSION_REQUIRED', () => {
  const res = checkUnemploymentEligibility({
    reasonId: 'illness_injury',
    totalInsuredMonths: 12,
    isAbleToWorkImmediately: false,
    isInabilityTemporary: true,
  });

  assert.equal(res.status, 'EXTENSION_REQUIRED');
  assert.equal(res.warnings.some((w) => w.code === 'ACTION_EXTENSION_REQUIRED'), true);
});

test('Golden Test 23: Low wage worker receives statutory maximum 80% benefit rate', () => {
  // Lương 150.000 JPY/tháng -> 6 tháng = 900.000 JPY -> Tiền lương ngày = 5.000 JPY (<= 5.280 JPY ngưỡng A)
  // Tỷ lệ hưởng luật định = 80% -> Trợ cấp ngày = 4.000 JPY/ngày
  const res = calculateUnemploymentBenefit({
    monthlyWage: 150000,
    age: 26,
    insuredYears: 2,
    separationCategory: 'COMPANY_CAUSE',
    targetDate: '2026-09-01',
  });

  assert.equal(res.dailyWage, 5000);
  assert.equal(res.basicDailyBenefit, 4000);
  assert.equal(res.effectiveBenefitRatePercent, 80);
  assert.equal(res.prescribedBenefitDays, 90);
  assert.equal(res.totalBenefitAmount, 4000 * 90); // 360,000 JPY
});

test('Golden Test 24: Middle wage worker receives statutory sliding scale benefit rate (50%〜80%)', () => {
  // Lương 300.000 JPY/tháng -> 6 tháng = 1.800.000 JPY -> Tiền lương ngày = 10.000 JPY (giữa 5.280 và 12.980)
  // Công thức: 0.8 - (0.3 * (10000 - 5280) / (12980 - 5280)) = 0.8 - (0.3 * 4720 / 7700) = 0.8 - 0.18389 = 0.6161
  // Trợ cấp ngày = Math.floor(10000 * 0.6161) = 6.161 JPY
  const res = calculateUnemploymentBenefit({
    monthlyWage: 300000,
    age: 35,
    insuredYears: 6,
    separationCategory: 'COMPANY_CAUSE',
    targetDate: '2026-09-01',
  });

  assert.equal(res.dailyWage, 10000);
  assert.equal(res.basicDailyBenefit, 6161);
  assert.equal(res.effectiveBenefitRatePercent, 61.6);
  assert.equal(res.prescribedBenefitDays, 180); // 35-44 tuổi, 6 năm tham gia diện công ty = 180 ngày
  assert.equal(res.totalBenefitAmount, 6161 * 180);
});

test('Golden Test 25: High wage worker capped at statutory maximum benefit amount', () => {
  // Lương 800.000 JPY/tháng -> 6 tháng = 4.800.000 JPY -> Tiền lương ngày tính thô = 26.666 JPY
  // Tuổi 35 (nhóm age_30_44) -> Trần lương ngày = 15.940 JPY (kỳ 2026_08)
  // Trần trợ cấp ngày = 7.970 JPY
  const res = calculateUnemploymentBenefit({
    monthlyWage: 800000,
    age: 35,
    insuredYears: 12,
    separationCategory: 'PERSONAL_VOLUNTARY',
    targetDate: '2026-09-01',
  });

  assert.equal(res.dailyWage, 15940);
  assert.equal(res.basicDailyBenefit, 7970);
  assert.equal(res.isCapped, true);
  assert.equal(res.prescribedBenefitDays, 120); // Tự nguyện, 12 năm = 120 ngày
  assert.equal(res.totalBenefitAmount, 7970 * 120);
});

test('Golden Test 26: Minimum floor protection prevents benefits below statutory minimum', () => {
  // Lương thấp bất thường 50.000 JPY/tháng -> Tiền lương ngày tính thô = 1.666 JPY (< sàn 2.869 JPY)
  // Sàn bảo hộ tối thiểu = 2.295 JPY/ngày
  const res = calculateUnemploymentBenefit({
    monthlyWage: 50000,
    age: 22,
    insuredYears: 1,
    separationCategory: 'COMPANY_CAUSE',
    targetDate: '2026-09-01',
  });

  assert.equal(res.dailyWage, 2869);
  assert.equal(res.basicDailyBenefit, 2295);
  assert.equal(res.isFloored, true);
});

test('Golden Test 27: Dual effective period resolution (pre vs post 2026-08-01 MHLW revisions)', () => {
  // Kỳ trước 01/08/2026 (VD: 2026-05-01) -> Trần nhóm 30-44 tuổi là 7.910 JPY
  const resOld = calculateUnemploymentBenefit({
    monthlyWage: 800000,
    age: 35,
    insuredYears: 5,
    targetDate: '2026-05-01',
  });
  assert.equal(resOld.effectivePeriod.id, '2025_08');
  assert.equal(resOld.basicDailyBenefit, 7910);

  // Kỳ sau 01/08/2026 (VD: 2026-09-01) -> Trần nhóm 30-44 tuổi là 7.970 JPY
  const resNew = calculateUnemploymentBenefit({
    monthlyWage: 800000,
    age: 35,
    insuredYears: 5,
    targetDate: '2026-09-01',
  });
  assert.equal(resNew.effectivePeriod.id, '2026_08');
  assert.equal(resNew.basicDailyBenefit, 7970);
});

test('Golden Test 28: Prescribed duration for Type A Company Cause (Age 48, 22 years insured -> 330 days)', () => {
  const { prescribedDays } = calculatePrescribedBenefitDays({
    age: 48,
    insuredYears: 22,
    separationCategory: 'COMPANY_CAUSE',
  });
  assert.equal(prescribedDays, 330);
});

test('Golden Test 29: Prescribed duration for Type C Personal Voluntary (Age 48, 22 years insured -> 150 days)', () => {
  const { prescribedDays } = calculatePrescribedBenefitDays({
    age: 48,
    insuredYears: 22,
    separationCategory: 'PERSONAL_VOLUNTARY',
  });
  assert.equal(prescribedDays, 150);
});

test('Golden Test 30: Prescribed duration for Difficult to Employ (Age 35, 3 years insured -> 300 days)', () => {
  const { prescribedDays } = calculatePrescribedBenefitDays({
    age: 35,
    insuredYears: 3,
    isDifficultToEmploy: true,
  });
  assert.equal(prescribedDays, 300);
});



