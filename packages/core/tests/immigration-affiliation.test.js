/**
 * @file packages/core/tests/immigration-affiliation.test.js
 * @description
 * Bộ kiểm thử pháp lý (Legal Golden Tests) cho M3: Thay đổi cơ quan trực thuộc / Chuyển việc (所属機関変更).
 * Kiểm chứng thời hạn 14 ngày theo Điều 19-16, nguy cơ thu hồi sau 3 tháng theo Điều 22-4,
 * miễn trừ cho Biểu 2, khuyến nghị Giấy chứng nhận tư cách làm việc (1.200 JPY) và an toàn thẩm quyền.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  checkAffiliationChange,
  NOTIFICATION_14_DAYS_RULE,
  REVOCATION_3_MONTHS_RULE,
  AUTHORIZED_EMPLOYMENT_CERT_RULE,
} from '../src/japan/immigration/index.js';

test('M3: Rule metadata adheres to regulatory foundation standards', () => {
  assert.equal(NOTIFICATION_14_DAYS_RULE.id, 'jp-imm-affiliation-14days');
  assert.equal(NOTIFICATION_14_DAYS_RULE.ruleNature, 'prerequisite');
  assert.equal(NOTIFICATION_14_DAYS_RULE.effectiveBy, 'eventDate');

  assert.equal(REVOCATION_3_MONTHS_RULE.id, 'jp-imm-revocation-3months');
  assert.equal(REVOCATION_3_MONTHS_RULE.ruleNature, 'administrative-discretion');

  assert.equal(AUTHORIZED_EMPLOYMENT_CERT_RULE.id, 'jp-imm-authorized-employment-cert');
  assert.equal(AUTHORIZED_EMPLOYMENT_CERT_RULE.ruleNature, 'guidance');
});

test('M3: 14-day statutory notification deadline calculation and overdue detection', () => {
  // Nghỉ việc ngày 01/10/2026 -> Hạn chót là 15/10/2026
  const eventDate = '2026-10-01';

  // 1. Kiểm tra khi còn trong hạn (Ngày 10/10/2026: còn 5 ngày)
  const inTimeResult = checkAffiliationChange({
    residenceStatus: 'engineer-humanities-international',
    eventType: 'left-company',
    eventDate,
    currentDate: '2026-10-10',
    hasFiled14DayNotice: false,
  });

  assert.equal(inTimeResult.notificationDeadline, '2026-10-15');
  assert.equal(inTimeResult.daysRemainingForNotification, 5);
  assert.equal(inTimeResult.isNotificationOverdue, false);
  assert.ok(inTimeResult.warnings.some((w) => w.code === 'NOTIFICATION_14_DAYS_PENDING'));

  // 2. Kiểm tra khi đã quá hạn 14 ngày mà chưa nộp thông báo (Ngày 20/10/2026)
  const overdueResult = checkAffiliationChange({
    residenceStatus: 'engineer-humanities-international',
    eventType: 'left-company',
    eventDate,
    currentDate: '2026-10-20',
    hasFiled14DayNotice: false,
  });

  assert.equal(overdueResult.isNotificationOverdue, true);
  assert.ok(overdueResult.warnings.some((w) => w.code === 'NOTIFICATION_14_DAYS_OVERDUE'));

  // 3. Đã nộp thông báo thì không bị cảnh báo quá hạn
  const filedResult = checkAffiliationChange({
    residenceStatus: 'engineer-humanities-international',
    eventType: 'left-company',
    eventDate,
    currentDate: '2026-10-20',
    hasFiled14DayNotice: true,
  });

  assert.equal(filedResult.isNotificationOverdue, false);
  assert.equal(filedResult.warnings.some((w) => w.code === 'NOTIFICATION_14_DAYS_OVERDUE'), false);
});

test('M3: 3-month continuous inactivity and revocation risk mitigation via Hello Work', () => {
  const eventDate = '2026-06-01';
  // Hạn 3 tháng: 2026-09-01

  // 1. Trong vòng 3 tháng (Ngày 15/07/2026), đang tìm việc -> rủi ro thấp
  const within3MoResult = checkAffiliationChange({
    residenceStatus: 'engineer-humanities-international',
    eventType: 'left-company',
    eventDate,
    currentDate: '2026-07-15',
    isJobHunting: true,
  });

  assert.equal(within3MoResult.threeMonthRevocationLimit, '2026-09-01');
  assert.equal(within3MoResult.revocationRisk, 'low');

  // 2. Quá 3 tháng (Ngày 15/09/2026) và KHÔNG tìm việc -> rủi ro cao bị thu hồi
  const highRiskResult = checkAffiliationChange({
    residenceStatus: 'engineer-humanities-international',
    eventType: 'left-company',
    eventDate,
    currentDate: '2026-09-15',
    isJobHunting: false,
    isHelloWorkRegistered: false,
  });

  assert.equal(highRiskResult.revocationRisk, 'high-risk');
  assert.ok(highRiskResult.warnings.some((w) => w.code === 'REVOCATION_RISK_HIGH'));

  // 3. Quá 3 tháng nhưng có đăng ký Hello Work & tích cực tìm việc -> có lý do chính đáng (mitigated)
  const mitigatedResult = checkAffiliationChange({
    residenceStatus: 'engineer-humanities-international',
    eventType: 'left-company',
    eventDate,
    currentDate: '2026-09-15',
    isJobHunting: true,
    isHelloWorkRegistered: true,
  });

  assert.equal(mitigatedResult.revocationRisk, 'mitigated');
  assert.ok(mitigatedResult.warnings.some((w) => w.code === 'REVOCATION_RISK_MITIGATED'));
});

test('M3: Table 2 status residents are completely exempt from affiliation notification', () => {
  // Người vĩnh trú đổi việc
  const prResult = checkAffiliationChange({
    residenceStatus: 'permanent-resident',
    eventType: 'transferred',
    eventDate: '2026-10-01',
    currentDate: '2026-11-01',
  });

  assert.equal(prResult.isExemptFromNotification, true);
  assert.equal(prResult.isNotificationOverdue, false);
  assert.equal(prResult.revocationRisk, 'none');
  assert.equal(prResult.warnings.length, 0);

  // Vợ/chồng người Nhật
  const spouseResult = checkAffiliationChange({
    residenceStatus: 'spouse-of-japanese',
    eventType: 'left-company',
    eventDate: '2026-05-01',
    currentDate: '2026-10-01',
  });

  assert.equal(spouseResult.isExemptFromNotification, true);
  assert.equal(spouseResult.revocationRisk, 'none');
});

test('M3: Job scope mismatch triggers mandatory status change requirement', () => {
  // Kỹ sư IT chuyển sang làm phục vụ nhà hàng (khác scope)
  const mismatchResult = checkAffiliationChange({
    residenceStatus: 'engineer-humanities-international',
    eventType: 'transferred',
    eventDate: '2026-10-01',
    isSameJobScope: false,
  });

  assert.equal(mismatchResult.requiresStatusChange, true);
  assert.ok(mismatchResult.warnings.some((w) => w.code === 'SCOPE_MISMATCH_STATUS_CHANGE_MANDATORY'));

  // Cùng chuyên môn kỹ sư -> không cần đổi visa, khuyến nghị Giấy chứng nhận tư cách làm việc (1.200 JPY)
  const matchResult = checkAffiliationChange({
    residenceStatus: 'engineer-humanities-international',
    eventType: 'transferred',
    eventDate: '2026-10-01',
    isSameJobScope: true,
  });

  assert.equal(matchResult.requiresStatusChange, false);
  assert.ok(matchResult.certificateOfAuthorizedEmployment.recommended);
  assert.equal(matchResult.certificateOfAuthorizedEmployment.fee.amount, 1200);
});

test('M3: Discretion Safety Policy - Zero pseudo-legal promises or percentage certainty', () => {
  const result = checkAffiliationChange({
    residenceStatus: 'engineer-humanities-international',
    eventType: 'transferred',
    eventDate: '2026-10-01',
  });

  assert.ok(result.regulatoryNotice);
  assert.equal(result.regulatoryNotice.nature, 'administrative-discretion');

  const fullText = JSON.stringify(result);
  const forbiddenPatterns = [
    /guaranteed approval/i,
    /chắc chắn đỗ/i,
    /bảo đảm đậu/i,
    /100% (thành công|được cấp|đậu)/i,
    /visa approved/i,
    /tỷ lệ đỗ \d+%/i,
    /chắc chắn 100%/i,
  ];

  for (const pattern of forbiddenPatterns) {
    assert.equal(
      pattern.test(fullText),
      false,
      `Output vi phạm Discretion Safety: chứa mẫu cấm "${pattern}"`
    );
  }
});
