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
