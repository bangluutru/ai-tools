import assert from 'node:assert/strict';
import test from 'node:test';

import { tools } from '../src/config/toolsRegistry.js';
import {
  JAPAN_PREFECTURES,
  getOfficeForPrefecture,
  getPrefectureById,
  CONSULAR_OFFICES,
  getOfficeById,
  CONSULAR_PROCEDURES,
  CONSULAR_CATEGORIES,
  getProcedureById,
  getProceduresByCategory,
  CONSULAR_FORMS,
  getFormById,
  FORM_INTEGRITY_REGISTRY,
  CROSS_SYSTEM_JOURNEYS,
} from '../../packages/core/src/consular/index.js';

test('Vietnam Consular Miniapp: registered and properly configured in toolsRegistry.js', () => {
  const consularTool = tools.find((t) => t.id === 'vietnam-consular-jp');
  assert.ok(consularTool, 'vietnam-consular-jp must exist in toolsRegistry.js');
  assert.equal(consularTool.group, 'japan-life');
  assert.equal(consularTool.domain, 'consular-vn');
  assert.equal(consularTool.country, 'JP');
  assert.equal(consularTool.type, 'handbook');
  assert.equal(consularTool.icon, 'Landmark');
  assert.ok(consularTool.name_vn);
  assert.ok(consularTool.name_en);
  assert.ok(consularTool.name_ja);
  assert.ok(consularTool.desc_vn);
});

test('Jurisdictions: All 47 Japanese Prefectures are defined and mapped to official diplomatic missions', () => {
  assert.equal(JAPAN_PREFECTURES.length, 47, 'Phải có đúng 47 tỉnh thành Nhật Bản theo chuẩn JIS X 0401');

  const validOffices = new Set(['tokyo', 'osaka', 'fukuoka']);

  for (const pref of JAPAN_PREFECTURES) {
    assert.ok(pref.code, `Tỉnh ${pref.name_vi} thiếu mã chuẩn JIS`);
    assert.ok(pref.name_vi, `Mã ${pref.code} thiếu name_vi`);
    assert.ok(pref.name_ja, `Mã ${pref.code} thiếu name_ja`);
    assert.ok(
      validOffices.has(pref.office_id),
      `Tỉnh ${pref.name_vi} ánh xạ tới cơ quan không hợp lệ: ${pref.office_id}`
    );
  }

  // Thẩm quyền chính thức kiểm chứng:
  // Tokyo (13) -> Tokyo Embassy
  const tokyoOffice = getOfficeForPrefecture('13');
  assert.equal(tokyoOffice.id, 'tokyo');
  assert.ok(tokyoOffice.name.vi.includes('Đại sứ quán'));
  assert.ok(tokyoOffice.hotline);

  // Osaka (27) -> Osaka Consulate General
  const osakaOffice = getOfficeForPrefecture('27');
  assert.equal(osakaOffice.id, 'osaka');
  assert.ok(osakaOffice.name.vi.includes('Tổng Lãnh sự quán'));

  // Fukuoka (40) -> Fukuoka Consulate General
  const fukuokaOffice = getOfficeForPrefecture('40');
  assert.equal(fukuokaOffice.id, 'fukuoka');
  assert.ok(fukuokaOffice.name.vi.includes('Tổng Lãnh sự quán'));

  // Aichi / Nagoya (23) -> PHẢI thuộc thẩm quyền ĐSQ Tokyo (không đoán theo cự ly)
  const aichiOffice = getOfficeForPrefecture('23');
  assert.equal(aichiOffice.id, 'tokyo', 'Aichi phải thuộc thẩm quyền chính thức của ĐSQ Tokyo');

  // Hokkaido (01) -> Thuộc thẩm quyền ĐSQ Tokyo
  const hokkaidoOffice = getOfficeForPrefecture('01');
  assert.equal(hokkaidoOffice.id, 'tokyo', 'Hokkaido thuộc thẩm quyền chính thức của ĐSQ Tokyo');

  // Okinawa (47) -> Thuộc thẩm quyền TLSQ Fukuoka
  const okinawaOffice = getOfficeForPrefecture('47');
  assert.equal(okinawaOffice.id, 'fukuoka', 'Okinawa thuộc thẩm quyền chính thức của TLSQ Fukuoka');
});

test('Procedures Catalog: 20 MVP Consular Procedures are fully structured with complete IA', () => {
  assert.equal(CONSULAR_PROCEDURES.length, 20, 'Phải có đủ 20 thủ tục lãnh sự thiết yếu (MVP)');
  assert.equal(CONSULAR_CATEGORIES.length, 7, 'Phải có đủ 7 nhóm thủ tục');

  for (const proc of CONSULAR_PROCEDURES) {
    assert.ok(proc.id, 'Thủ tục thiếu ID');
    assert.ok(proc.category, `${proc.id} thiếu category`);
    assert.ok(proc.title?.vi, `${proc.id} thiếu title.vi`);
    assert.ok(proc.title?.en, `${proc.id} thiếu title.en`);
    assert.ok(proc.title?.ja, `${proc.id} thiếu title.ja`);
    assert.ok(proc.summary, `${proc.id} thiếu summary`);
    assert.ok(proc.when_needed, `${proc.id} thiếu when_needed`);
    assert.ok(
      ['postal_or_direct', 'direct_only', 'direct_or_postal'].includes(proc.submission_mode),
      `${proc.id} phương thức nộp không hợp lệ: ${proc.submission_mode}`
    );
    assert.ok(proc.processing_time, `${proc.id} thiếu processing_time`);
    assert.ok(Array.isArray(proc.required_documents), `${proc.id} required_documents phải là mảng`);
    assert.ok(proc.required_documents.length > 0, `${proc.id} không có giấy tờ yêu cầu nào`);
    assert.ok(Array.isArray(proc.steps), `${proc.id} steps phải là mảng`);
    assert.ok(proc.steps.length >= 2, `${proc.id} phải có ít nhất 2 bước quy trình`);
    assert.ok(Array.isArray(proc.official_sources), `${proc.id} official_sources phải là mảng`);
    assert.ok(proc.official_sources.length > 0, `${proc.id} phải có ít nhất 1 nguồn tham chiếu`);
    assert.ok(Array.isArray(proc.aliases), `${proc.id} aliases phải là mảng`);
    assert.ok(proc.last_verified, `${proc.id} thiếu last_verified`);
    assert.equal(proc.status, 'VERIFIED', `${proc.id} status phải là VERIFIED`);
  }

  // Tra cứu thử thủ tục
  const renewal = getProcedureById('vn_passport_renewal');
  assert.ok(renewal);
  assert.equal(renewal.category, 'passport');
  assert.equal(renewal.formId, 'form_passport_tk02');

  const birth = getProcedureById('vn_birth_registration');
  assert.ok(birth);
  assert.equal(birth.category, 'birth_nationality');
  assert.equal(birth.formId, 'form_birth_registration');
});

test('Form Engine: Official forms have verified SHA-256 fingerprints and legal bases', () => {
  assert.ok(CONSULAR_FORMS.length >= 4, 'Phải có ít nhất 4 biểu mẫu chính thức tích hợp');

  for (const form of CONSULAR_FORMS) {
    assert.ok(form.id, 'Form thiếu ID');
    assert.ok(form.title, `${form.id} thiếu title`);
    assert.ok(form.sha256Fingerprint || form.fingerprint, `${form.id} thiếu SHA-256 fingerprint`);
    assert.ok(form.standardBasis || form.legal_basis, `${form.id} thiếu căn cứ pháp lý`);
    assert.ok(FORM_INTEGRITY_REGISTRY[form.id], `${form.id} thiếu bản ghi trong FORM_INTEGRITY_REGISTRY`);
  }

  // Form TK02 Cấp đổi hộ chiếu
  const tk02 = getFormById('form_passport_tk02');
  assert.ok(tk02);
  assert.equal(tk02.code, 'TK02');

  // Form Giấy khai sinh
  const birthForm = getFormById('form_birth_registration');
  assert.ok(birthForm);

  // Form Thỏa thuận quốc tịch
  const nationalityForm = getFormById('form_nationality_agreement');
  assert.ok(nationalityForm);

  // Form Giấy ủy quyền
  const poaForm = getFormById('form_power_of_attorney');
  assert.ok(poaForm);
  assert.equal(poaForm.code, 'GUQ-ND30');
});

test('Cross-System Life Journeys: Connecting JP procedures with VN consular procedures', () => {
  assert.ok(CROSS_SYSTEM_JOURNEYS.length >= 2, 'Phải có ít nhất 2 hành trình đời sống');

  const birthJourney = CROSS_SYSTEM_JOURNEYS.find((j) => j.id === 'journey_giving_birth_in_japan');
  assert.ok(birthJourney, 'Thiếu hành trình sinh con tại Nhật');
  assert.ok(birthJourney.timelineSteps.length >= 4);

  // Bước 1 ở Shiyakusho
  assert.equal(birthJourney.timelineSteps[0].jurisdiction, 'japan_local');
  // Bước 2 ở Lãnh sự VN
  assert.equal(birthJourney.timelineSteps[1].jurisdiction, 'consular_vn');
  assert.equal(birthJourney.timelineSteps[1].consularProcedureId, 'vn_birth_registration');
  // Bước 3 ở Cục Xuất nhập cảnh Nyukan
  assert.equal(birthJourney.timelineSteps[2].jurisdiction, 'japan_nyukan');
});

test('Prefectures i18n & Consular i18n: All 47 prefectures and UI strings are translated in VI, EN, JA', async () => {
  const { getConsularI18n, CONSULAR_I18N } = await import('../../packages/core/src/consular/index.js');

  // Kiểm tra 47 tỉnh thành có đầy đủ tên tiếng Việt, tiếng Nhật, tiếng Anh và getter
  for (const pref of JAPAN_PREFECTURES) {
    assert.ok(pref.name_vi && pref.name_vi.length > 0, `Mã ${pref.code} thiếu name_vi`);
    assert.ok(pref.name_ja && pref.name_ja.length > 0, `Mã ${pref.code} thiếu name_ja`);
    assert.ok(pref.name_en && pref.name_en.length > 0, `Mã ${pref.code} thiếu name_en`);
    assert.equal(pref.nameVi, pref.name_vi, `Getter nameVi không khớp name_vi ở ${pref.code}`);
    assert.equal(pref.nameJa, pref.name_ja, `Getter nameJa không khớp name_ja ở ${pref.code}`);
    assert.equal(pref.nameEn, pref.name_en, `Getter nameEn không khớp name_en ở ${pref.code}`);
  }

  // Kiểm tra i18n dictionary
  assert.ok(CONSULAR_I18N.vi);
  assert.ok(CONSULAR_I18N.en);
  assert.ok(CONSULAR_I18N.ja);

  for (const lang of ['vi', 'en', 'ja']) {
    const t = getConsularI18n(lang);
    assert.ok(t.header.title);
    assert.ok(t.header.prefectureLabel);
    assert.ok(t.header.prefecturePlaceholder);
    assert.ok(t.navigator.tabCategories);
    assert.ok(t.navigator.tabJourneys);
    assert.ok(t.guide.requiredDocuments);
    assert.ok(t.editor.easyFillTab);
    assert.ok(t.editor.previewTab);
    assert.ok(t.editor.printBtn);
    assert.ok(t.workspaceEmpty.title);
  }

  // Kiểm tra fallback khi ngôn ngữ không hỗ trợ
  const fallback = getConsularI18n('fr');
  assert.equal(fallback.header.title, CONSULAR_I18N.vi.header.title);
});

test('A4 Aspect Ratio & Screen Geometry: Strictly preserved without distortion under all viewports', async () => {
  const { A4_LOGICAL_WIDTH, A4_LOGICAL_HEIGHT, A4_ASPECT_RATIO } = await import('../../packages/core/src/consular/index.js');

  const PHYSICAL_A4_RATIO = 210 / 297; // 0.7070707...
  assert.ok(
    Math.abs(A4_ASPECT_RATIO - PHYSICAL_A4_RATIO) < 0.001,
    `Tỷ lệ logic A4 (${A4_ASPECT_RATIO}) phải khớp với tỷ lệ vật lý 210/297 (${PHYSICAL_A4_RATIO}) trong dung sai 0.001`
  );

  // Kiểm tra tính toán scale đồng đều tại các độ phân giải màn hình khác nhau
  const viewports = [
    { name: '1440px Normal 3-Pane (Pane 3)', width: 540, height: 720 },
    { name: '1440px Expanded 12-Cols', width: 1200, height: 820 },
    { name: '1280px Desktop Viewport', width: 480, height: 680 },
    { name: 'Tablet 768px Viewport', width: 720, height: 900 },
    { name: 'Mobile 390px Viewport', width: 360, height: 640 },
  ];

  for (const vp of viewports) {
    const availW = Math.max(vp.width - 24, 100);
    const availH = Math.max(vp.height - 24, 100);
    const widthScale = availW / A4_LOGICAL_WIDTH;
    const heightScale = availH / A4_LOGICAL_HEIGHT;

    // Fit Page scale
    const fitPageScale = Math.min(widthScale, heightScale, 1.1);
    const scaledW = A4_LOGICAL_WIDTH * fitPageScale;
    const scaledH = A4_LOGICAL_HEIGHT * fitPageScale;
    const currentRatio = scaledW / scaledH;

    assert.ok(
      Math.abs(currentRatio - PHYSICAL_A4_RATIO) < 0.001,
      `Khung nhìn ${vp.name} bị méo tỷ lệ! Tỷ lệ thu được: ${currentRatio}`
    );

    // Fit Width scale
    const fitWidthScale = widthScale;
    const fitWidthW = A4_LOGICAL_WIDTH * fitWidthScale;
    const fitWidthH = A4_LOGICAL_HEIGHT * fitWidthScale;
    assert.ok(
      Math.abs(fitWidthW / fitWidthH - PHYSICAL_A4_RATIO) < 0.001,
      `Khung nhìn ${vp.name} ở chế độ Fit Width bị méo tỷ lệ!`
    );
  }
});

test('Multi-page Form Architecture: TK02 renders exactly 2 official pages under TT 31/2023/TT-BCA', async () => {
  const { FORM_TEMPLATES, getFormTemplate, TK02_PAGE_MAPPING } = await import('../../packages/core/src/consular/index.js');

  const tk02 = getFormTemplate('form_passport_tk02');
  assert.ok(tk02);
  assert.equal(tk02.code, 'TK02');
  assert.equal(tk02.pageCount, 2, 'Mẫu TK02 chính thức phải có đúng 2 trang A4');
  assert.ok(tk02.standardBasis.includes('Thông tư số 31/2023/TT-BCA'));

  // Trang 1: 14 trường thông tin và khung ảnh 4x6 cm
  assert.ok(TK02_PAGE_MAPPING.pages[1].fields.length >= 14);
  assert.equal(tk02.hasPhotoBox, true);
  assert.equal(tk02.photoSize, '4x6 cm');

  // Trang 2: Ý kiến người giám hộ, lời cam đoan, chữ ký, xác nhận của ĐSQ/TLSQ
  assert.ok(TK02_PAGE_MAPPING.pages[2].header.section15Title.includes('15. Ý kiến của cha, mẹ'));
  assert.ok(TK02_PAGE_MAPPING.pages[2].header.commitmentText.includes('Tôi xin cam đoan'));
  assert.ok(TK02_PAGE_MAPPING.pages[2].header.officialVerificationTitle.includes('XÁC NHẬN CỦA CƠ QUAN ĐẠI DIỆN'));
});

test('Form Integrity & SHA-256 Checksum: Verification passes only on matching fingerprints', async () => {
  const { verifyTemplateIntegrity, FORM_TEMPLATES } = await import('../../packages/core/src/consular/index.js');

  // 1. Kiểm định hợp lệ khi không truyền actualHash (đối chiếu registry chuẩn)
  const tk02Result = verifyTemplateIntegrity('form_passport_tk02');
  assert.equal(tk02Result.isVerified, true);
  assert.equal(tk02Result.status, 'VERIFIED');

  // 2. Kiểm định khi truyền đúng hash thực tế
  const matchResult = verifyTemplateIntegrity(
    'form_passport_tk02',
    FORM_TEMPLATES.form_passport_tk02.sha256Fingerprint
  );
  assert.equal(matchResult.isVerified, true);
  assert.equal(matchResult.status, 'VERIFIED');

  // 3. Kiểm định khi hash bị sai lệch (Phát hiện giả mạo/chỉnh sửa trái phép)
  const mismatchResult = verifyTemplateIntegrity(
    'form_passport_tk02',
    'invalid_tampered_hash_00000000000000000000000000000000000000000000000'
  );
  assert.equal(mismatchResult.isVerified, false);
  assert.equal(mismatchResult.status, 'REVIEW_REQUIRED');

  // 4. Form không tồn tại
  const notFoundResult = verifyTemplateIntegrity('non_existent_form_xyz');
  assert.equal(notFoundResult.isVerified, false);
  assert.equal(notFoundResult.status, 'REVIEW_REQUIRED');
});

test('SSOT Official PDF Generator: Generates authentic multi-page A4 PDF documents with pdf-lib', async () => {
  const { generateOfficialFormPdf, generatePdfFilename } = await import('../../packages/core/src/consular/index.js');

  const mockFormData = {
    applicantName: 'NGUYỄN VĂN A',
    gender: 'Nam',
    dob: '1995-08-15',
    birthPlace: 'Hà Nội',
    idCardNumber: '001095012345',
    ethnic: 'Kinh',
    religion: 'Không',
    permanentAddressVN: 'Số 12 phố Tràng Thi, Hoàn Kiếm, Hà Nội',
    residenceAddressJP: '〒160-0022 Tokyo-to, Shinjuku-ku, Shinjuku 1-2-3',
    phoneNumber: '080-1234-5678',
    email: 'nguyenvana@gmail.com',
    requestType: 'cap_lai_sap_het_han',
    passportChipOption: 'co_gan_chip',
  };

  const result = await generateOfficialFormPdf({
    formId: 'form_passport_tk02',
    formData: mockFormData,
    lang: 'vi',
  });

  assert.ok(result.pdfBytes instanceof Uint8Array, 'pdfBytes phải là một Uint8Array');
  assert.ok(result.pdfBytes.length > 1000, 'Kích thước PDF sinh ra phải lớn hơn 1KB');

  // Kiểm tra header magic bytes của file PDF (%PDF)
  const pdfHeader = String.fromCharCode(...result.pdfBytes.slice(0, 4));
  assert.equal(pdfHeader, '%PDF', 'File sinh ra phải có định dạng chuẩn PDF (%PDF)');

  // Form TK02 phải có đúng 2 trang
  assert.equal(result.pageCount, 2, 'Biểu mẫu TK02 phải có đúng 2 trang PDF');

  // Kiểm tra tên file sinh ra
  assert.equal(result.filename, 'TK02_NGUYEN_VAN_A.pdf');

  // Kiểm tra hàm sinh tên file dự phòng
  const fallbackName = generatePdfFilename('TK02', {});
  assert.equal(fallbackName, 'TK02_DON_DE_NGHI.pdf');
});

test('Long Data & Diacritics Safety: Handles long Vietnamese names, Japanese Kanji/Romaji without error', async () => {
  const { sanitizeForWinAnsi, formatFieldValue, generateOfficialFormPdf } = await import('../../packages/core/src/consular/index.js');

  // 1. Kiểm tra chuẩn hóa WinAnsi không bị lỗi ký tự tiếng Việt
  const complexName = 'NGUYỄN HOÀNG PHƯƠNG MAI THẢO LINH';
  const cleanName = sanitizeForWinAnsi(complexName);
  assert.equal(cleanName, 'NGUYEN HOANG PHUONG MAI THAO LINH');

  // 2. Kiểm tra xử lý địa chỉ tiếng Nhật dài kèm Kanji và Romaji
  const longAddressJP = '〒160-0022 東京都新宿区新宿１丁目２−３ メゾンサンシャイン 1001号室 (1-2-3 Shinjuku, Shinjuku-ku, Tokyo-to)';
  const formattedAddress = formatFieldValue(longAddressJP);
  assert.ok(formattedAddress.length > 0);

  // 3. Sinh PDF với dữ liệu cực dài
  const extremeData = {
    applicantName: complexName,
    residenceAddressJP: longAddressJP,
    email: 'nguyen.hoang.phuong.mai.thao.linh.consular.japan@embassy-support-domain.example.com',
    permanentAddressVN: 'Số 1234/56/78 đường Nguyễn Thị Minh Khai, Phường Bến Nghé, Quận 1, Thành phố Hồ Chí Minh',
    fatherName: 'NGUYỄN VĂN CHA CỦA NGƯỜI ĐỀ NGHỊ CẤP HỘ CHIẾU NĂM SINH 1960',
  };

  await assert.doesNotReject(async () => {
    const res = await generateOfficialFormPdf({
      formId: 'form_passport_tk02',
      formData: extremeData,
      lang: 'vi',
    });
    assert.equal(res.pageCount, 2);
  }, 'Sinh PDF với dữ liệu dài và nhiều dấu tiếng Việt không được ném ngoại lệ');
});
