/**
 * @file packages/core/tests/immigration-permanent-residence.test.js
 * @description
 * Bộ kiểm thử pháp lý (Legal Golden Tests) cho M6: 永住申請準備度チェッカー (Permanent Residence Readiness Checker).
 * 
 * Kiểm tra:
 * 1. Tuyến chuẩn 10 năm (5 năm đi làm, visa >= 3 năm, thuế & nenkin 100% đúng hạn).
 * 2. Cấm nộp khi đang giữ visa 1 năm (One-year visa disqualifier).
 * 3. Ngưỡng xuất cảnh dài ngày (> 90 ngày liên tục hoặc > 100-150 ngày/năm).
 * 4. Nợ thuế hoặc nộp trễ hạn Nenkin / BHYT (Disqualification trigger).
 * 5. Tuyến ưu tiên Vợ/Chồng (3 năm kết hôn + 1 năm cư trú).
 * 6. Tuyến HSP 80 điểm (1 năm) và HSP 70 điểm (3 năm).
 * 7. Yêu cầu Người bảo lãnh (Guarantor) là Người Nhật hoặc Người Vĩnh trú.
 * 8. Lệ phí 8.000 JPY (trước 01/10/2026) -> 10.000 JPY (từ 01/10/2026).
 * 9. Cảnh báo Án lệ McLean và Cải cách thu hồi Vĩnh trú năm 2026.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  evaluatePermanentResidenceReadiness,
  getPermanentResidenceFeeSchedule,
  PR_APPLICATION_ROUTES,
  PR_INCOME_BENCHMARKS
} from '../src/japan/immigration/index.js';

test('Permanent Residence: Standard 10-year route with pristine record yields high readiness', () => {
  const result = evaluatePermanentResidenceReadiness({
    routeId: 'standard_10_year',
    yearsContinuousStay: 10,
    yearsWorkStay: 5,
    currentVisaPeriodYears: 3,
    maxConsecutiveDaysAbroad: 25,
    totalDaysAbroadPerYear: 35,
    annualIncome: 5000000,
    dependentCount: 0,
    taxPaidOnTimeAllYears: true,
    pensionPaidOnTimeAllYears: true,
    hasGuarantor: true,
    hasCleanCriminalRecord: true
  });

  assert.equal(result.readinessCategory, 'high_readiness');
  assert.equal(result.readinessScore, 100);
  assert.equal(result.passedCount, 6);
  assert.ok(result.dimensions.every(d => d.met === true));
  assert.ok(result.documents.length >= 10);
});

test('Permanent Residence: Holding a 1-year visa is an automatic disqualifier', () => {
  const result = evaluatePermanentResidenceReadiness({
    routeId: 'standard_10_year',
    yearsContinuousStay: 10,
    yearsWorkStay: 5,
    currentVisaPeriodYears: 1, // Đang giữ visa 1 năm
    annualIncome: 5000000
  });

  assert.equal(result.readinessCategory, 'disqualified');
  const visaDim = result.dimensions.find(d => d.id === 'visa_duration');
  assert.equal(visaDim.met, false);
  const visaWarn = result.warnings.find(w => w.code === 'ONE_YEAR_VISA_DISQUALIFIER');
  assert.ok(visaWarn, 'Phải có cảnh báo visa 1 năm không đủ điều kiện');
  assert.equal(visaWarn.severity, 'danger');
});

test('Permanent Residence: Trip abroad exceeding 90 consecutive days flags broken continuity', () => {
  const result = evaluatePermanentResidenceReadiness({
    routeId: 'standard_10_year',
    yearsContinuousStay: 10,
    yearsWorkStay: 5,
    maxConsecutiveDaysAbroad: 120 // Rời Nhật 120 ngày liên tục
  });

  const resDim = result.dimensions.find(d => d.id === 'residence_period');
  assert.equal(resDim.met, false);
  const absenceWarn = result.warnings.find(w => w.code === 'PROLONGED_ABSENCE_FROM_JAPAN');
  assert.ok(absenceWarn);
  assert.equal(absenceWarn.severity, 'danger');
});

test('Permanent Residence: Tax delinquency or late pension payments disqualify applicant', () => {
  const result = evaluatePermanentResidenceReadiness({
    taxPaidOnTimeAllYears: false,
    pensionPaidOnTimeAllYears: false
  });

  assert.equal(result.readinessCategory, 'disqualified');
  const taxWarn = result.warnings.find(w => w.code === 'TAX_DELINQUENCY_DETECTED');
  assert.ok(taxWarn);
  const pensionWarn = result.warnings.find(w => w.code === 'PENSION_DELINQUENCY_DETECTED');
  assert.ok(pensionWarn);
});

test('Permanent Residence: Spouse of Japanese / PR priority route (3 yrs marriage, 1 yr stay)', () => {
  const result = evaluatePermanentResidenceReadiness({
    routeId: 'spouse_of_japanese_or_pr',
    yearsMarriage: 3,
    yearsContinuousStay: 1,
    currentVisaPeriodYears: 3,
    annualIncome: 3500000
  });

  const resDim = result.dimensions.find(d => d.id === 'residence_period');
  assert.equal(resDim.met, true);
});

test('Permanent Residence: HSP 80 points route fast-track (1 year stay)', () => {
  const result = evaluatePermanentResidenceReadiness({
    routeId: 'hsp_80_points',
    yearsContinuousStay: 1,
    currentVisaPeriodYears: 5,
    annualIncome: 8000000
  });

  const resDim = result.dimensions.find(d => d.id === 'residence_period');
  assert.equal(resDim.met, true);
});

test('Permanent Residence: HSP 70 points route fast-track (3 years stay)', () => {
  const result = evaluatePermanentResidenceReadiness({
    routeId: 'hsp_70_points',
    yearsContinuousStay: 3,
    currentVisaPeriodYears: 5,
    annualIncome: 7000000
  });

  const resDim = result.dimensions.find(d => d.id === 'residence_period');
  assert.equal(resDim.met, true);
});

test('Permanent Residence: Missing Guarantor flags disqualification', () => {
  const result = evaluatePermanentResidenceReadiness({
    hasGuarantor: false
  });

  assert.equal(result.readinessCategory, 'disqualified');
  const guarWarn = result.warnings.find(w => w.code === 'NO_GUARANTOR_ALERT');
  assert.ok(guarWarn);
});

test('Permanent Residence: Fee schedule transition on 2026-10-01 (8,000 to 10,000 JPY)', () => {
  const preChange = getPermanentResidenceFeeSchedule('2026-09-30');
  assert.equal(preChange.applicationFee, 0);
  assert.equal(preChange.grantFee, 8000);

  const postChange = getPermanentResidenceFeeSchedule('2026-10-01');
  assert.equal(postChange.applicationFee, 0);
  assert.equal(postChange.grantFee, 10000);
});

test('Permanent Residence: McLean doctrine disclaimer and 2026 reform notice are always present', () => {
  const result = evaluatePermanentResidenceReadiness();

  const discWarn = result.warnings.find(w => w.code === 'MINISTERIAL_DISCRETION');
  assert.ok(discWarn, 'Phải có lưu ý về án lệ McLean');

  assert.ok(result.reform2026Notice, 'Phải có thông tin về cải cách thu hồi Vĩnh trú 2026');
});
