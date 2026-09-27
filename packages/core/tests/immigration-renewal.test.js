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
  getResidencePermitFee,
  getOtherImmigrationFee,
  parseLocalDate,
  formatLocalDate,
  addMonthsClamped,
} from '../src/japan/immigration/index.js';

test('M2: Fee determined by acceptance date and granted period (2026-10-01 revision)', () => {
  // 1. Hồ sơ tiếp nhận đến 30/09/2026: 6.000 JPY (quầy) / 5.500 JPY (online), không phụ thuộc thời hạn
  const preRevision1 = getRenewalFee('2026-09-30');
  assert.equal(preRevision1.amount, 6000, 'Tiếp nhận đến 30/09/2026: 6.000 JPY tại quầy');
  assert.equal(preRevision1.currency, 'JPY');
  assert.equal(preRevision1.payableOn, 'issuance');
  assert.equal(preRevision1.dependsOnGrantedPeriod, false);
  assert.equal(getRenewalFee('2026-09-30', { method: 'online' }).amount, 5500);

  const preRevision2 = getRenewalFee('2026-05-15');
  assert.equal(preRevision2.amount, 6000);

  // 2. Tiếp nhận từ 01/10/2026: theo thời hạn được cấp (mặc định dự kiến 1 năm = 33.000 JPY tại quầy)
  const postRevision1 = getRenewalFee('2026-10-01');
  assert.equal(postRevision1.amount, 33000, '1 năm tại quầy: 33.000 JPY');
  assert.equal(postRevision1.payableOn, 'issuance');
  assert.equal(postRevision1.dependsOnGrantedPeriod, true);
  assert.deepEqual(postRevision1.range, { min: 10000, max: 75000 });

  const expected = {
    upTo3m: [10000, 10000], over3mTo6m: [18000, 15000], over6mUnder1y: [25000, 21000], '1y': [33000, 27000],
    over1yUnder3y: [48000, 42000], '3yUnder5y': [64000, 56000], '5yPlus': [75000, 65000],
  };
  for (const [tier, [counter, online]] of Object.entries(expected)) {
    assert.equal(getRenewalFee('2026-12-15', { expectedPeriod: tier }).amount, counter, `counter ${tier}`);
    assert.equal(getRenewalFee('2026-12-15', { expectedPeriod: tier, method: 'online' }).amount, online, `online ${tier}`);
  }
  // Online từ 01/10/2026: cộng phí thanh toán (330 / 550 JPY)
  assert.equal(getRenewalFee('2026-10-01', { method: 'online', expectedPeriod: '1y' }).totalPayable, 27330);
  assert.equal(getRenewalFee('2026-10-01', { method: 'online', expectedPeriod: '5yPlus' }).totalPayable, 65550);
});

test('Shared fee table: permanent residence and other fees', () => {
  assert.equal(getResidencePermitFee({ procedure: 'permanent', acceptanceDate: '2026-09-30' }).amount, 10000);
  assert.equal(getResidencePermitFee({ procedure: 'permanent', acceptanceDate: '2026-10-01' }).amount, 200000);
  const prOnline = getResidencePermitFee({ procedure: 'permanent', acceptanceDate: '2026-10-01', method: 'online' });
  assert.equal(prOnline.onlineNotAvailable, true);
  assert.equal(getOtherImmigrationFee('reentrySingle').amount, 4000);
  assert.equal(getOtherImmigrationFee('reentryMultiple').amount, 7000);
  assert.equal(getOtherImmigrationFee('reentrySingle', { method: 'online' }).amount, 3500);
  assert.equal(getOtherImmigrationFee('reentryMultiple', { method: 'online' }).amount, 6500);
  assert.equal(getOtherImmigrationFee('authorizedEmploymentCertificate').amount, 2000);
  assert.equal(getOtherImmigrationFee('authorizedEmploymentCertificate', { method: 'online' }).amount, 1600);
  assert.equal(getOtherImmigrationFee('authorizedEmploymentCertificate', { method: 'online', acceptanceDate: '2026-10-01' }).totalPayable, 1820);
});

test('Local date helpers: YYYY-MM-DD parsed as local calendar day, month-end clamping', () => {
  const d = parseLocalDate('2026-12-31');
  assert.equal(d.getDate(), 31);
  assert.equal(formatLocalDate(addMonthsClamped(d, 2)), '2027-02-28');
  assert.equal(formatLocalDate(addMonthsClamped(parseLocalDate('2027-12-31'), 2)), '2028-02-29');
  assert.equal(formatLocalDate(addMonthsClamped(parseLocalDate('2026-05-31'), -3)), '2026-02-28');
  assert.equal(parseLocalDate('2026-02-30'), null);
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
  assert.equal(openResult.fee.amount, 33000, 'Tiếp nhận 01/10/2026, dự kiến 1 năm: 33.000 JPY tại quầy');
  assert.ok(openResult.warnings.some((w) => w.code === 'FEE_DEPENDS_ON_GRANTED_PERIOD'));

  // 2b. Ngày hết hạn chính là hôm nay: vẫn còn hợp lệ (không phải overstay)
  const lastDayResult = calculateRenewalSchedule({
    residenceStatus: 'engineer-specialist',
    expirationDate: expDate,
    currentDate: expDate,
  });
  assert.equal(lastDayResult.windowStatus, 'open', 'Ngày hết hạn vẫn là ngày hợp lệ để nộp');
  assert.equal(lastDayResult.daysRemaining, 0);

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

test('M6: Permanent Resident / HSP2 / Temporary Visitor are not ordinary renewals; unknown status is flagged', () => {
  const pr = calculateRenewalSchedule({ residenceStatus: 'permanent-resident', expirationDate: '2027-01-10', currentDate: '2026-11-01' });
  assert.equal(pr.windowStatus, 'not-applicable');
  assert.equal(pr.notApplicable.code, 'PERMANENT_RESIDENT_CARD_RENEWAL_ONLY');
  assert.equal(pr.fee, null);

  const hsp2 = calculateRenewalSchedule({ residenceStatus: 'highly-skilled-professional-2', expirationDate: '2027-01-10', currentDate: '2026-11-01' });
  assert.equal(hsp2.windowStatus, 'not-applicable');

  const tv = calculateRenewalSchedule({ residenceStatus: 'temporary-visitor', expirationDate: '2027-01-10', currentDate: '2026-11-01' });
  assert.equal(tv.windowStatus, 'not-applicable');

  const bm = calculateRenewalSchedule({ residenceStatus: 'business-manager', expirationDate: '2027-01-10', currentDate: '2026-11-01' });
  assert.equal(bm.documentsModeled, false);
  assert.ok(bm.warnings.some((w) => w.code === 'DOCUMENTS_NOT_MODELED'));
  assert.ok(!bm.documents.some((d) => d.id === 'doc-tax-withholding-slip'), 'Không được lặng lẽ dùng giấy tờ 技人国');
});
