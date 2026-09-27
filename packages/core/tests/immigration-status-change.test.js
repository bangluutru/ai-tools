/**
 * @file packages/core/tests/immigration-status-change.test.js
 * @description
 * Bộ kiểm thử pháp lý (Legal Golden Tests) cho M4: 在留資格変更ガイド (Status Change Guide).
 * 
 * Kiểm tra:
 * 1. Tiêu chí chuyển đổi Du học sang Lao động (留学 -> 技人国: Bằng cấp, ngành học, mức thù lao).
 * 2. Cấm chuyển đổi trực tiếp từ Du lịch/Ngắn hạn nếu không có COE (Điều 20 Khoản 2).
 * 3. Tiêu chí chuyển sang Visa Quản lý / Khởi nghiệp (経営・管理: Văn phòng, vốn 5M JPY, kế hoạch kinh doanh).
 * 4. Tiêu chí chuyển sang Visa Kết hôn (日本人の配偶者等: Hôn nhân 2 nước, cùng chung sống, người bảo lãnh).
 * 5. Thời hạn đặc lệ (特例期間: Điều 20 Khoản 6).
 * 6. Lệ phí 4.000 JPY (trước 01/10/2026) -> 6.000 JPY (từ 01/10/2026).
 * 7. Cảnh báo cấm làm việc trước khi có kết quả và Án lệ McLean về quyền tự do thẩm định.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  evaluateStatusChange,
  getStatusChangeFeeSchedule,
  STATUS_TRANSITION_ROUTES,
  STATUS_CHANGE_DOCUMENT_CATEGORIES
} from '../src/japan/immigration/index.js';

test('Status Change Guide: Student to Engineer/Specialist in Humanities (技人国) with full criteria', () => {
  const result = evaluateStatusChange({
    currentStatusId: 'student',
    targetStatusId: 'engineer_specialist',
    currentExpirationDate: '2026-10-15',
    applicationDate: '2026-08-01',
    applicantProfile: {
      educationLevel: 'university_degree',
      jobMatchesMajor: true,
      salaryEquivalentToJapanese: true,
      hasJobOffer: true,
      employerCategory: 2
    }
  });

  assert.equal(result.readinessStatus, 'ready');
  assert.equal(result.routeId, 'student_to_work');
  assert.equal(result.isExceptional, false);
  assert.ok(result.prerequisites.every(p => p.met === true));

  // Category 2 document checklist
  assert.ok(result.documentChecklist.length >= 4);

  // Tokurei calculation
  assert.ok(result.tokureiInfo);
  assert.equal(result.tokureiInfo.tokureiExpirationDate, '2026-12-15');

  // Hồ sơ tiếp nhận trước 01/10/2026: 6.000 JPY tại quầy
  assert.equal(result.feeSchedule.amount, 6000);
});

test('Status Change Guide: Student to Gijinkoku with missing degree or mismatched major', () => {
  const result = evaluateStatusChange({
    currentStatusId: 'student',
    targetStatusId: 'engineer_specialist',
    currentExpirationDate: '2026-10-15',
    applicantProfile: {
      educationLevel: 'high_school', // Không đạt học vấn
      jobMatchesMajor: false, // Ngành học không khớp
      salaryEquivalentToJapanese: true,
      hasJobOffer: true
    }
  });

  assert.equal(result.readinessStatus, 'missing_requirements');
  const eduReq = result.prerequisites.find(p => p.id === 'education_level');
  assert.equal(eduReq.met, false);
  const majorReq = result.prerequisites.find(p => p.id === 'major_relevance');
  assert.equal(majorReq.met, false);
});

test('Status Change Guide: Temporary Visitor to Mid/Long-Term strictly restricted without COE (Art. 20 Para. 2)', () => {
  const result = evaluateStatusChange({
    currentStatusId: 'temporary_visitor',
    targetStatusId: 'engineer_specialist',
    applicantProfile: {
      hasCOE: false
    }
  });

  assert.equal(result.readinessStatus, 'restricted');
  assert.equal(result.isExceptional, true);
  const tempWarn = result.warnings.find(w => w.code === 'TEMPORARY_VISITOR_RESTRICTION');
  assert.ok(tempWarn, 'Phải có cảnh báo cấm đổi từ visa ngắn hạn');
  assert.equal(tempWarn.severity, 'danger');
});

test('Status Change Guide: Temporary Visitor to Mid/Long-Term with issued COE is accepted', () => {
  const result = evaluateStatusChange({
    currentStatusId: 'temporary_visitor',
    targetStatusId: 'engineer_specialist',
    applicantProfile: {
      hasCOE: true,
      educationLevel: 'university_degree',
      jobMatchesMajor: true,
      salaryEquivalentToJapanese: true,
      hasJobOffer: true
    }
  });

  assert.equal(result.readinessStatus, 'ready');
  const coeReq = result.prerequisites.find(p => p.id === 'coe_or_exceptional_circumstance');
  assert.equal(coeReq.met, true);
});

test('Status Change Guide: Transition to Business Manager (経営・管理) — 2025-10-16 standards', () => {
  // Tiêu chuẩn cũ (vốn 5 triệu yên) không còn đủ
  const oldStandard = evaluateStatusChange({
    currentStatusId: 'engineer_specialist',
    targetStatusId: 'business_manager',
    applicantProfile: { hasPhysicalOffice: true, capitalAtLeast5M: true, hasFeasibleBusinessPlan: true }
  });
  assert.equal(oldStandard.readinessStatus, 'missing_requirements');
  assert.ok(oldStandard.warnings.some((w) => w.code === 'BUSINESS_MANAGER_2025_STANDARDS'));

  const result = evaluateStatusChange({
    currentStatusId: 'engineer_specialist',
    targetStatusId: 'business_manager',
    applicantProfile: {
      hasPhysicalOffice: true,
      capitalAtLeast30M: true,
      hasFullTimeEmployee: true,
      hasJapaneseB2: true,
      hasManagementExperienceOrDegree: true,
      planCheckedByExpert: true,
      hasFeasibleBusinessPlan: true
    }
  });

  assert.equal(result.readinessStatus, 'ready');
  assert.equal(result.routeId, 'work_to_business_manager');
  const officeReq = result.prerequisites.find(p => p.id === 'physical_office');
  assert.equal(officeReq.met, true);
  const capReq = result.prerequisites.find(p => p.id === 'capital_investment');
  assert.equal(capReq.met, true);
});

test('Status Change Guide: Transition to Spouse of Japanese National (日本人の配偶者等)', () => {
  const result = evaluateStatusChange({
    currentStatusId: 'student',
    targetStatusId: 'spouse_japanese',
    applicantProfile: {
      hasLegalMarriage: true,
      livingTogether: true,
      hasGuarantor: true
    }
  });

  assert.equal(result.readinessStatus, 'ready');
  assert.equal(result.routeId, 'any_to_spouse_japanese');
});

test('Status Change Guide: Fee schedule transition on 2026-10-01 (6,000 flat → period-based)', () => {
  const preChange = getStatusChangeFeeSchedule('2026-09-30');
  assert.equal(preChange.amount, 6000);
  assert.equal(getStatusChangeFeeSchedule('2026-09-30', { method: 'online' }).amount, 5500);

  const postChange = getStatusChangeFeeSchedule('2026-10-01');
  assert.equal(postChange.amount, 33000, 'Mặc định dự kiến 1 năm, nộp tại quầy');
  assert.deepEqual(postChange.range, { min: 10000, max: 75000 });
  assert.equal(getStatusChangeFeeSchedule('2026-10-01', { expectedPeriod: '5yPlus', method: 'online' }).amount, 65000);
  assert.equal(getStatusChangeFeeSchedule('2026-10-01', { expectedPeriod: '3yUnder5y' }).amount, 64000);
});

test('Status Change Guide: Activity prohibition & McLean doctrine warnings are always present', () => {
  const result = evaluateStatusChange({
    currentStatusId: 'student',
    targetStatusId: 'engineer_specialist'
  });

  const actWarn = result.warnings.find(w => w.code === 'ACTIVITY_PROHIBITION');
  assert.ok(actWarn, 'Phải có cảnh báo cấm đi làm trước khi có kết quả');

  const discWarn = result.warnings.find(w => w.code === 'MINISTERIAL_DISCRETION');
  assert.ok(discWarn, 'Phải có lưu ý về thẩm quyền của Bộ trưởng Tư pháp theo án lệ McLean');
});

test('Status Change Guide: Tokurei end clamps to month end and the expiry day is not "expired"', () => {
  const lastDay = evaluateStatusChange({
    currentStatusId: 'student',
    targetStatusId: 'engineer_specialist',
    currentExpirationDate: '2026-12-31',
    currentDate: '2026-12-31',
    applicationDate: '2026-12-31',
  });
  assert.equal(lastDay.tokureiInfo.tokureiExpirationDate, '2027-02-28');
  assert.equal(lastDay.tokureiInfo.daysRemaining, 0);
  assert.ok(!lastDay.warnings.some((w) => w.code === 'ALREADY_EXPIRED'), 'Ngày hết hạn vẫn còn hợp lệ');
  assert.ok(lastDay.warnings.some((w) => w.code === 'EXPIRATION_TODAY'));

  const dayAfter = evaluateStatusChange({
    currentStatusId: 'student',
    targetStatusId: 'engineer_specialist',
    currentExpirationDate: '2026-12-31',
    currentDate: '2027-01-01',
  });
  assert.ok(dayAfter.warnings.some((w) => w.code === 'ALREADY_EXPIRED'));
  assert.equal(dayAfter.readinessStatus, 'restricted');
});
