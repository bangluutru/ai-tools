/**
 * @file packages/core/tests/immigration-family.test.js
 * @description
 * Bộ kiểm thử pháp lý (Legal Golden Tests) cho M5: 家族滞在・家族呼寄せガイド (Family Immigration Guide).
 * 
 * Kiểm tra:
 * 1. Tiêu chuẩn bảo lãnh Vợ/Chồng (配偶者) hợp pháp từ nước ngoài qua COE.
 * 2. Cấm bảo lãnh Cha Mẹ ruột / Cha Mẹ vợ chồng theo diện 家族滞在 (Bảng 1-4 Luật Nhập quản).
 * 3. Cấm bảo lãnh Anh Chị Em ruột theo diện 家族滞在.
 * 4. Cấm người giữ visa 特定技能1号 và 技能実習 bảo lãnh gia đình.
 * 5. Tiêu chuẩn thu nhập và rủi ro nợ thuế cư trú.
 * 6. Quy định trẻ em sinh ra tại Nhật Bản (Điều 22-2: hạn 30 ngày / tối đa 60 ngày).
 * 7. Đổi visa sang 家族滞在 cho người đang ở Nhật Bản (4.000 / 6.000 JPY).
 * 8. Giới hạn làm thêm 28 giờ/tuần và ngưỡng phụ thuộc 1.300.000 JPY.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  evaluateFamilyImmigration,
  SPONSOR_STATUS_ELIGIBILITY,
  RELATIONSHIP_SCOPES,
  DEPENDENT_WORK_PERMIT_RULES
} from '../src/japan/immigration/index.js';

test('Family Immigration Guide: Sponsoring legal spouse from overseas (COE) with qualifying income', () => {
  const result = evaluateFamilyImmigration({
    sponsorStatusId: 'engineer_specialist',
    relationshipType: 'spouse',
    sponsorAnnualIncome: 3800000,
    dependentCount: 1,
    sponsorTaxCompliant: true,
    sponsorPensionCompliant: true,
    currentLocation: 'overseas'
  });

  assert.equal(result.readinessStatus, 'ready');
  assert.equal(result.procedureInfo.id, 'coe');
  assert.equal(result.feeSchedule.amount, 0); // COE fee is 0 JPY
  assert.ok(result.prerequisites.every(p => p.met === true));
  assert.ok(result.documents.length >= 6);
  assert.equal(result.financialAnalysis.isSufficient, true);
});

test('Family Immigration Guide: Attempting to sponsor Parents under 家族滞在 is strictly barred', () => {
  const result = evaluateFamilyImmigration({
    sponsorStatusId: 'engineer_specialist',
    relationshipType: 'parent',
    sponsorAnnualIncome: 6000000
  });

  assert.equal(result.readinessStatus, 'ineligible');
  const parentWarn = result.warnings.find(w => w.code === 'PARENT_NOT_ELIGIBLE_FOR_DEPENDENT');
  assert.ok(parentWarn, 'Phải có cảnh báo cấm cha mẹ diện 家族滞在');
  assert.equal(parentWarn.severity, 'danger');
});

test('Family Immigration Guide: Attempting to sponsor Siblings under 家族滞在 is strictly barred', () => {
  const result = evaluateFamilyImmigration({
    sponsorStatusId: 'engineer_specialist',
    relationshipType: 'sibling',
    sponsorAnnualIncome: 5000000
  });

  assert.equal(result.readinessStatus, 'ineligible');
  const siblingWarn = result.warnings.find(w => w.code === 'SIBLING_NOT_ELIGIBLE_FOR_DEPENDENT');
  assert.ok(siblingWarn, 'Phải có cảnh báo cấm anh chị em diện 家族滞在');
  assert.equal(siblingWarn.severity, 'danger');
});

test('Family Immigration Guide: Sponsor on SSW 1 (特定技能1号) is legally barred from bringing dependents', () => {
  const result = evaluateFamilyImmigration({
    sponsorStatusId: 'specified_skilled_1',
    relationshipType: 'spouse',
    sponsorAnnualIncome: 3500000
  });

  assert.equal(result.readinessStatus, 'ineligible');
  const barredWarn = result.warnings.find(w => w.code === 'SPONSOR_STATUS_BARRED');
  assert.ok(barredWarn, 'Phải có cảnh báo 特定技能1号 không được bảo lãnh');
  assert.equal(barredWarn.severity, 'danger');
});

test('Family Immigration Guide: Sponsor on Technical Intern Training (技能実習) is legally barred', () => {
  const result = evaluateFamilyImmigration({
    sponsorStatusId: 'technical_intern',
    relationshipType: 'child',
    sponsorAnnualIncome: 2500000
  });

  assert.equal(result.readinessStatus, 'ineligible');
  const barredWarn = result.warnings.find(w => w.code === 'SPONSOR_STATUS_BARRED');
  assert.ok(barredWarn);
});

test('Family Immigration Guide: Low income and tax arrears trigger warnings and failed prerequisites', () => {
  const result = evaluateFamilyImmigration({
    sponsorStatusId: 'engineer_specialist',
    relationshipType: 'spouse',
    sponsorAnnualIncome: 1800000, // Dưới ngưỡng 2.500.000 JPY
    dependentCount: 1,
    sponsorTaxCompliant: false // Nợ thuế
  });

  assert.equal(result.readinessStatus, 'missing_requirements');
  const taxReq = result.prerequisites.find(p => p.id === 'tax_compliance');
  assert.equal(taxReq.met, false);

  const taxWarn = result.warnings.find(w => w.code === 'TAX_ARREARS_DETECTED');
  assert.ok(taxWarn);

  const incomeWarn = result.warnings.find(w => w.code === 'LOW_SPONSOR_INCOME');
  assert.ok(incomeWarn);
});

test('Family Immigration Guide: Child born in Japan under Art. 22-2 (30-day filing and 60-day limit)', () => {
  const result = evaluateFamilyImmigration({
    sponsorStatusId: 'engineer_specialist',
    relationshipType: 'child',
    currentLocation: 'newborn_in_japan',
    childBirthDate: '2026-05-01'
  });

  assert.equal(result.procedureInfo.id, 'child_born_in_japan');
  assert.equal(result.feeSchedule.amount, 0); // Status Acquisition is free
  assert.ok(result.newbornDeadlines);
  assert.equal(result.newbornDeadlines.filingDeadline30Days, '2026-05-31');
  assert.equal(result.newbornDeadlines.maxStayLimit60Days, '2026-06-30');
});

test('Family Immigration Guide: Family member in Japan changing status to 家族滞在', () => {
  const preOctResult = evaluateFamilyImmigration({
    sponsorStatusId: 'engineer_specialist',
    relationshipType: 'spouse',
    currentLocation: 'in_japan',
    applicationDate: '2026-09-01'
  });
  assert.equal(preOctResult.procedureInfo.id, 'status_change');
  assert.equal(preOctResult.feeSchedule.amount, 4000);

  const postOctResult = evaluateFamilyImmigration({
    sponsorStatusId: 'engineer_specialist',
    relationshipType: 'spouse',
    currentLocation: 'in_japan',
    applicationDate: '2026-10-05'
  });
  assert.equal(postOctResult.feeSchedule.amount, 6000);
});

test('Family Immigration Guide: Part-time work rules and McLean doctrine disclaimer', () => {
  const result = evaluateFamilyImmigration({
    sponsorStatusId: 'engineer_specialist',
    relationshipType: 'spouse',
    intendsToWorkPartTime: true
  });

  assert.equal(result.workAdvisory.intendsToWorkPartTime, true);
  assert.equal(result.workAdvisory.weeklyHourLimit, 28);
  assert.equal(result.workAdvisory.taxDependencyCeiling, 1300000);

  const discWarn = result.warnings.find(w => w.code === 'MINISTERIAL_DISCRETION');
  assert.ok(discWarn, 'Phải có lưu ý về thẩm quyền của Bộ trưởng Tư pháp theo án lệ McLean');
});
