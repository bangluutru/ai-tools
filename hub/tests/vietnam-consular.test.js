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
