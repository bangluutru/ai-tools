/**
 * @file packages/core/tests/immigration-renewal.test.js
 * @description
 * Bộ kiểm thử pháp lý (Legal Golden Tests) cho M2: Hướng dẫn gia hạn thời hạn lưu trú (在留期間更新).
 * Kiểm chứng tính toán cửa sổ nộp đơn, thời kỳ đặc lệ (Tokurei Kikan), mốc thay đổi lệ phí 2026-10-01,
 * quy định siết chặt ảnh thẻ 2026-06-14, danh mục hồ sơ và an toàn thẩm quyền hành chính.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getRenewalFee,
  checkPhotoRequired,
  calculateRenewalSchedule,
  STATUS_DOCUMENTS_CATALOG,
} from '../src/japan/immigration/index.js';

test('M2: Fee cutoff rule strictly determined by applicationDate (2026-10-01 revision)', () => {
  // 1. Nộp hồ sơ trước ngày 01/10/2026: 4.000 JPY
  const preRevision1 = getRenewalFee('2026-09-30');
  assert.equal(preRevision1.amount, 4000, 'Trước 01/10/2026 lệ phí phải là 4.000 JPY');
  assert.equal(preRevision1.currency, 'JPY');
  assert.equal(preRevision1.payableOn, 'issuance', 'Lệ phí nộp bằng tem doanh thu khi cấp mới thẻ cư trú');

  const preRevision2 = getRenewalFee(new Date('2026-05-15'));
  assert.equal(preRevision2.amount, 4000);

  // 2. Nộp hồ sơ đúng ngày hoặc sau ngày 01/10/2026: 6.000 JPY
  const postRevision1 = getRenewalFee('2026-10-01');
  assert.equal(postRevision1.amount, 6000, 'Từ 01/10/2026 lệ phí phải là 6.000 JPY');
  assert.equal(postRevision1.payableOn, 'issuance');

  const postRevision2 = getRenewalFee('2026-12-15');
  assert.equal(postRevision2.amount, 6000);
});

test('M2: Photo requirement transition on 2026-06-14 (infant exemption vs under 16 exemption)', () => {
  // Trước ngày 14/06/2026: Dưới 16 tuổi được miễn nộp ảnh
  const preChild = checkPhotoRequired(10, '2026-06-13');
  assert.equal(preChild.required, false, 'Trước 14/06/2026 trẻ 10 tuổi được miễn nộp ảnh');

  const preAdult = checkPhotoRequired(28, '2026-06-13');
  assert.equal(preAdult.required, true, 'Người lớn luôn phải nộp ảnh');

  // Từ ngày 14/06/2026: Chỉ trẻ dưới 1 tuổi được miễn nộp ảnh
  const postInfant = checkPhotoRequired(0.5, '2026-06-14');
  assert.equal(postInfant.required, false, 'Từ 14/06/2026 trẻ 6 tháng tuổi được miễn ảnh');

  const postChild = checkPhotoRequired(5, '2026-06-14');
  assert.equal(postChild.required, true, 'Từ 14/06/2026 trẻ 5 tuổi PHẢI nộp ảnh');

  const postTeen = checkPhotoRequired(15, '2026-06-14');
  assert.equal(postTeen.required, true, 'Từ 14/06/2026 người 15 tuổi PHẢI nộp ảnh');
});

test('M2: Renewal window and Tokurei Kikan timeline calculation', () => {
  const expDate = '2026-12-15';

  // 1. Quá sớm: Ngày hiện tại là 2026-08-15 (Trước 3 tháng)
  const tooEarlyResult = calculateRenewalSchedule({
    residenceStatus: 'engineer-specialist',
    expirationDate: expDate,
    currentDate: '2026-08-15',
  });
  assert.equal(tooEarlyResult.windowStatus, 'too-early');
  assert.equal(tooEarlyResult.windowStart, '2026-09-15', 'Cửa sổ mở trước 3 tháng');
  assert.equal(tooEarlyResult.gracePeriodLimit, '2027-02-15', 'Thời kỳ đặc lệ tối đa +2 tháng');
  assert.ok(tooEarlyResult.warnings.some((w) => w.code === 'WINDOW_NOT_OPEN'));

  // 2. Đúng kỳ hạn: Ngày hiện tại là 2026-10-01 (Nằm trong khoảng 3 tháng)
  const openResult = calculateRenewalSchedule({
    residenceStatus: 'engineer-specialist',
    expirationDate: expDate,
    currentDate: '2026-10-01',
    applicationDate: '2026-10-01',
  });
  assert.equal(openResult.windowStatus, 'open');
  assert.equal(openResult.fee.amount, 6000, 'Nộp ngày 01/10/2026 áp dụng mức phí 6.000 JPY');

  // 3. Sắp hết hạn (<= 14 ngày): Ngày hiện tại 2026-12-10
  const urgentResult = calculateRenewalSchedule({
    residenceStatus: 'engineer-specialist',
    expirationDate: expDate,
    currentDate: '2026-12-10',
  });
  assert.equal(urgentResult.windowStatus, 'open');
  assert.equal(urgentResult.daysRemaining, 5);
  assert.ok(urgentResult.warnings.some((w) => w.code === 'DEADLINE_APPROACHING'));

  // 4. Trong thời kỳ đặc lệ (Đã nộp trước hạn, hiện tại là 2027-01-10)
  const graceResult = calculateRenewalSchedule({
    residenceStatus: 'engineer-specialist',
    expirationDate: expDate,
    currentDate: '2027-01-10',
    hasFiled: true,
  });
  assert.equal(graceResult.windowStatus, 'grace-period');
  assert.ok(graceResult.warnings.some((w) => w.code === 'TOKUREI_KIKAN_ACTIVE'));

  // 5. Quá hạn đặc lệ 2 tháng (2027-03-01 > 2027-02-15)
  const graceExpiredResult = calculateRenewalSchedule({
    residenceStatus: 'engineer-specialist',
    expirationDate: expDate,
    currentDate: '2027-03-01',
    hasFiled: true,
  });
  assert.equal(graceExpiredResult.windowStatus, 'grace-period-expired');

  // 6. Quá hạn mà chưa nộp hồ sơ (Overstay nguy hiểm)
  const overstayResult = calculateRenewalSchedule({
    residenceStatus: 'engineer-specialist',
    expirationDate: expDate,
    currentDate: '2026-12-16',
    hasFiled: false,
  });
  assert.equal(overstayResult.windowStatus, 'overstay');
  assert.ok(overstayResult.warnings.some((w) => w.code === 'OVERSTAY_ALERT'));
});

test('M2: Document checklist tailored to status and company category', () => {
  // Engineer Category 1 (Listed Company): Statutory total table is exempt
  const cat1Result = calculateRenewalSchedule({
    residenceStatus: 'engineer-specialist',
    expirationDate: '2026-12-15',
    companyCategory: 1,
  });
  const statutoryDoc1 = cat1Result.documents.find((d) => d.id === 'doc-statutory-statement');
  assert.ok(statutoryDoc1);
  assert.equal(statutoryDoc1.required, false, 'Category 1 được miễn nộp 法定調書合計表');

  // Engineer Category 3: Statutory total table is required
  const cat3Result = calculateRenewalSchedule({
    residenceStatus: 'engineer-specialist',
    expirationDate: '2026-12-15',
    companyCategory: 3,
  });
  const statutoryDoc3 = cat3Result.documents.find((d) => d.id === 'doc-statutory-statement');
  assert.ok(statutoryDoc3);
  assert.equal(statutoryDoc3.required, true, 'Category 3 phải nộp 法定調書合計表');

  // Dependent documents include marriage/birth certificate and supporter proof
  const depResult = calculateRenewalSchedule({
    residenceStatus: 'dependent',
    expirationDate: '2026-12-15',
  });
  assert.ok(depResult.documents.some((d) => d.id === 'doc-relationship-proof'));
  assert.ok(depResult.documents.some((d) => d.id === 'doc-supporter-tax-cert'));

  // Student documents include enrollment and attendance certs
  const studentResult = calculateRenewalSchedule({
    residenceStatus: 'student',
    expirationDate: '2026-12-15',
  });
  assert.ok(studentResult.documents.some((d) => d.id === 'doc-enrollment-cert'));
  assert.ok(studentResult.documents.some((d) => d.id === 'doc-attendance-cert'));

  // Spouse of Japanese includes Koseki tohon and guarantor letter
  const spouseResult = calculateRenewalSchedule({
    residenceStatus: 'spouse-japanese',
    expirationDate: '2026-12-15',
  });
  assert.ok(spouseResult.documents.some((d) => d.id === 'doc-koseki-tohon'));
  assert.ok(spouseResult.documents.some((d) => d.id === 'doc-guarantor-letter'));
});

test('M2: Compliance checks flag resident tax and pension arrears', () => {
  const arrearsResult = calculateRenewalSchedule({
    residenceStatus: 'engineer-specialist',
    expirationDate: '2026-12-15',
    hasTaxArrears: true,
    hasPensionArrears: true,
  });

  assert.ok(arrearsResult.warnings.some((w) => w.code === 'TAX_ARREARS_RISK'));
  assert.ok(arrearsResult.warnings.some((w) => w.code === 'PENSION_ARREARS_RISK'));
});

test('M2: Discretion Safety Policy - Zero pseudo-legal promises or percentage certainty', () => {
  const result = calculateRenewalSchedule({
    residenceStatus: 'engineer-specialist',
    expirationDate: '2026-12-15',
  });

  // Verify regulatory notice exists and cites discretion
  assert.ok(result.regulatoryNotice);
  assert.equal(result.regulatoryNotice.nature, 'administrative-discretion');
  assert.ok(result.regulatoryNotice.legalBasis.includes('出入国管理及び難民認定法第21条'));

  // Serialize all outputs and verify no forbidden certainty terms
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
