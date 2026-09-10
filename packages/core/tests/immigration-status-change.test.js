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

  // Fee pre Oct 2026
  assert.equal(result.feeSchedule.amount, 4000);
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

test('Status Change Guide: Transition to Business Manager (経営・管理)', () => {
  const result = evaluateStatusChange({
    currentStatusId: 'engineer_specialist',
    targetStatusId: 'business_manager',
    applicantProfile: {
      hasPhysicalOffice: true,
      capitalAtLeast5M: true,
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

test('Status Change Guide: Fee schedule transition on 2026-10-01 (4,000 to 6,000 JPY)', () => {
  const preChange = getStatusChangeFeeSchedule('2026-09-30');
  assert.equal(preChange.amount, 4000);

  const postChange = getStatusChangeFeeSchedule('2026-10-01');
  assert.equal(postChange.amount, 6000);
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
