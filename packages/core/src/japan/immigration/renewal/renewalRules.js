/**
 * @file packages/core/src/japan/immigration/renewal/renewalRules.js
 * @description
 * Quy định pháp lý và quy tắc nghiệp vụ cho thủ tục Gia hạn thời hạn lưu trú (在留期間更新 - Extension of Period of Stay).
 * Căn cứ: Luật Quản lý Xuất nhập cảnh & Công nhận Tị nạn (Điều 21) và các văn bản hướng dẫn của Cục Quản lý Xuất nhập cảnh Nhật Bản (ISA).
 */

import { defineRuleMetadata } from '../../../regulatory/ruleMetadata.js';
import { JAPAN_JURISDICTION } from '../../../regulatory/jurisdiction.js';

export const RENEWAL_SOURCES = {
  IMMIGRATION_ACT_ART21: 'isa-act-art21',
  RENEWAL_FEE_ORDER: 'isa-fee-table',
  TOKUREI_KIKAN: 'isa-act-art20-para5',
  PHOTO_SPEC: 'isa-photo-guidelines',
  RENEWAL_DOCUMENTS: 'isa-renewal-doc-requirements',
};

/**
 * Metadata cho quy tắc lệ phí gia hạn
 * Lệ phí thay đổi từ 4.000 JPY lên 6.000 JPY áp dụng theo ngày nộp hồ sơ (applicationDate) từ 2026-10-01.
 */
export const RENEWAL_FEE_RULE = defineRuleMetadata({
  id: 'jp-imm-renewal-fee-2026',
  jurisdiction: JAPAN_JURISDICTION,
  sourceId: 'isa-fee-table',
  effectiveFrom: '1990-06-01',
  applicablePeriod: { type: 'calendar-year', from: 1990, to: 2099 },
  version: '2026.1',
  lastVerifiedAt: '2026-09-11',
  status: 'verified',
  effectiveBy: 'applicationDate',
  ruleNature: 'deterministic',
  notes: 'Lệ phí nộp bằng tem doanh thu (収入印紙) khi nhận kết quả cấp phép mới. Mức phí xác định theo ngày nộp đơn.',
});

/**
 * Tính toán mức lệ phí gia hạn cư trú dựa trên ngày nộp hồ sơ.
 * @param {string|Date} applicationDate - Ngày nộp hồ sơ
 * @returns {{ amount: number, currency: string, payableOn: string, effectivePeriod: string, legalBasis: string }}
 */
export function getRenewalFee(applicationDate = new Date()) {
  const appDate = applicationDate instanceof Date ? applicationDate : new Date(applicationDate);
  const cutoff = new Date('2026-10-01T00:00:00+09:00');

  const isPost2026Revision = appDate >= cutoff;
  const amount = isPost2026Revision ? 6000 : 4000;

  return {
    amount,
    currency: 'JPY',
    payableOn: 'issuance', // Nộp khi nhận kết quả cho phép, nộp đơn ban đầu không mất phí
    effectivePeriod: isPost2026Revision ? '2026-10-01~' : '~2026-09-30',
    legalBasis: isPost2026Revision
      ? '出入国管理及び難民認定法関係手数料令（2026年10月1日施行：6,000円）'
      : '出入国管理及び難民認定法関係手数料令（現行：4,000円）',
  };
}

/**
 * Metadata cho quy định chụp ảnh thẻ hồ sơ cư trú
 */
export const PHOTO_REQUIREMENT_RULE = defineRuleMetadata({
  id: 'jp-imm-photo-rule',
  jurisdiction: JAPAN_JURISDICTION,
  sourceId: 'isa-photo-guidelines',
  effectiveFrom: '1990-06-01',
  applicablePeriod: { type: 'calendar-year', from: 1990, to: 2099 },
  version: '2026.1',
  lastVerifiedAt: '2026-09-11',
  status: 'verified',
  effectiveBy: 'applicationDate',
  ruleNature: 'deterministic',
  notes: 'Kích thước 40mm x 30mm, chụp trong vòng 3 tháng. Miễn nộp ảnh thay đổi theo mốc 2026-06-14.',
});

/**
 * Kiểm tra xem người nộp đơn có phải nộp ảnh thẻ hay không.
 * - Trước 2026-06-14: Người dưới 16 tuổi được miễn nộp ảnh.
 * - Từ 2026-06-14: Chỉ trẻ em dưới 1 tuổi được miễn nộp ảnh (Quy tắc siết chặt nhận diện khuôn mặt).
 * 
 * @param {number} age - Tuổi người nộp đơn
 * @param {string|Date} applicationDate - Ngày nộp đơn
 * @returns {{ required: boolean, reason_ja: string, reason_en: string, reason_vi: string }}
 */
export function checkPhotoRequired(age, applicationDate = new Date()) {
  const appDate = applicationDate instanceof Date ? applicationDate : new Date(applicationDate);
  const photoReformCutoff = new Date('2026-06-14T00:00:00+09:00');

  const isPostReform = appDate >= photoReformCutoff;

  if (isPostReform) {
    if (age < 1) {
      return {
        required: false,
        reason_ja: '2026年6月14日施行規則により、1歳未満の乳児は写真提出が免除されます。',
        reason_en: 'Pursuant to the June 14, 2026 revised rules, infants under 1 year of age are exempt from photograph submission.',
        reason_vi: 'Theo quy định sửa đổi có hiệu lực từ 14/06/2026, trẻ sơ sinh dưới 1 tuổi được miễn nộp ảnh.',
      };
    }
    return {
      required: true,
      reason_ja: '1歳以上の方は縦4cm×横3cmの写真（提出前3か月以内撮影）が必須です。',
      reason_en: 'A 4cm x 3cm photograph taken within 3 months is required for applicants aged 1 and older.',
      reason_vi: 'Người từ 1 tuổi trở lên bắt buộc phải nộp 1 ảnh 4cm x 3cm chụp trong vòng 3 tháng.',
    };
  }

  // Pre-reform
  if (age < 16) {
    return {
      required: false,
      reason_ja: '16歳未満の方は写真提出が免除されています（現行規則）。',
      reason_en: 'Applicants under 16 years of age are exempt from submitting a photo under current rules.',
      reason_vi: 'Người dưới 16 tuổi được miễn nộp ảnh theo quy định hiện hành (trước 14/06/2026).',
    };
  }

  return {
    required: true,
    reason_ja: '16歳以上の方は縦4cm×横3cmの写真（提出前3か月以内撮影）が必須です。',
    reason_en: 'A 4cm x 3cm photograph taken within 3 months is required for applicants aged 16 and older.',
    reason_vi: 'Người từ 16 tuổi trở lên bắt buộc phải nộp 1 ảnh 4cm x 3cm chụp trong vòng 3 tháng.',
  };
}

/**
 * Metadata cho Thời gian mở nộp hồ sơ & Thời kỳ đặc lệ (Tokurei Kikan)
 */
export const TOKUREI_KIKAN_RULE = defineRuleMetadata({
  id: 'jp-imm-tokurei-kikan',
  jurisdiction: JAPAN_JURISDICTION,
  sourceId: 'isa-act-art20-para5',
  effectiveFrom: '1990-06-01',
  applicablePeriod: { type: 'calendar-year', from: 1990, to: 2099 },
  version: '2026.1',
  lastVerifiedAt: '2026-09-11',
  status: 'verified',
  effectiveBy: 'calendarDate',
  ruleNature: 'deterministic',
  notes: 'Nộp đơn trước khi hết hạn cho phép lưu trú hợp pháp tối đa 2 tháng sau ngày hết hạn hoặc đến khi có quyết định.',
});

/**
 * Danh mục các giấy tờ hồ sơ cập nhật theo từng tư cách lưu trú
 */
export const STATUS_DOCUMENTS_CATALOG = {
  'engineer-specialist': [
    {
      id: 'doc-application-form',
      name_ja: '在留期間更新許可申請書（1通）',
      name_en: 'Application for Extension of Period of Stay (1 copy)',
      name_vi: 'Đơn xin gia hạn thời hạn lưu trú (1 bản)',
      purpose: 'Đơn hành chính theo mẫu quy định của Bộ Tư pháp Nhật Bản',
      issuer: 'ISA (Cục Quản lý Xuất nhập cảnh)',
      required: true,
      validityPeriodMonths: null,
      officialUrl: 'https://www.moj.go.jp/isa/applications/procedures/16-3-1.html',
    },
    {
      id: 'doc-photo',
      name_ja: '写真（縦4cm×横3cm、無帽・無背景・3か月以内撮影）',
      name_en: 'Photograph (4cm x 3cm, taken within 3 months, plain background)',
      name_vi: 'Ảnh thẻ (4cm x 3cm, chụp trong 3 tháng, nền sáng, không đội mũ)',
      purpose: 'Nhận diện sinh trắc học và in lên thẻ cư trú mới',
      issuer: 'Cơ sở chụp ảnh / Tự chụp đúng tiêu chuẩn',
      required: true,
      validityPeriodMonths: 3,
      officialUrl: 'https://www.moj.go.jp/isa/applications/procedures/photo_info_00002.html',
    },
    {
      id: 'doc-passport-card-presentation',
      name_ja: 'パスポート及び在留カード（原本提示）',
      name_en: 'Passport and Residence Card (Presentation of originals)',
      name_vi: 'Hộ chiếu và Thẻ cư trú hiện tại (Xuất trình bản gốc)',
      purpose: 'Xác thực nhân thân và đóng dấu tiếp nhận hồ sơ',
      issuer: 'Chính phủ nước sở tại & Cục XNC Nhật',
      required: true,
      validityPeriodMonths: null,
      officialUrl: 'https://www.moj.go.jp/isa/applications/procedures/16-3-1.html',
    },
    {
      id: 'doc-tax-withholding-slip',
      name_ja: '直近年度の前年分給与所得の源泉徴収票（写し）',
      name_en: 'Copy of withholding slip for salary income for the previous year',
      name_vi: 'Bản sao phiếu khấu trừ thuế thu nhập năm gần nhất (源泉徴収票)',
      purpose: 'Chứng minh thu nhập thực tế từ công việc chuyên môn',
      issuer: 'Doanh nghiệp đang làm việc',
      required: true,
      validityPeriodMonths: 12,
      officialUrl: 'https://www.moj.go.jp/isa/applications/procedures/nyuukokukanri07_00095.html',
    },
    {
      id: 'doc-resident-tax-cert',
      name_ja: '直近1年分の住民税の課税（又は非課税）証明書及び納税証明書',
      name_en: 'Municipal tax assessment and payment certificates for the most recent 1 year',
      name_vi: 'Giấy chứng nhận mức thuế và tình trạng nộp thuế cư trú 1 năm gần nhất (課税・納税証明書)',
      purpose: 'Chứng minh thực hiện đầy đủ nghĩa vụ thuế với địa phương',
      issuer: 'UBND quận/thị xã (市区町村役所)',
      required: true,
      validityPeriodMonths: 3,
      officialUrl: 'https://www.moj.go.jp/isa/applications/procedures/nyuukokukanri07_00095.html',
    },
    {
      id: 'doc-statutory-statement',
      name_ja: '前年分の給与所得の源泉徴収票等の法定調書合計表（受領印のある写し）',
      name_en: 'Copy of Total Statutory Tax Withholding Statements for the preceding year (with reception stamp)',
      name_vi: 'Bản sao Bảng tổng hợp tờ khai quyết toán thuế thu nhập doanh nghiệp (法定調書合計表 có dấu tiếp nhận)',
      purpose: 'Xác định phân loại doanh nghiệp (Category 1, 2, 3 hoặc 4)',
      issuer: 'Cơ quan thuế quản lý doanh nghiệp (税務署)',
      required: false,
      conditional: true,
      conditionDescription: 'Miễn nộp nếu công ty thuộc Category 1 (doanh nghiệp niêm yết)',
      validityPeriodMonths: 12,
      officialUrl: 'https://www.moj.go.jp/isa/applications/procedures/nyuukokukanri07_00095.html',
    },
  ],
  'dependent': [
    {
      id: 'doc-application-form-dep',
      name_ja: '在留期間更新許可申請書（家族滞在用 1通）',
      name_en: 'Application for Extension of Period of Stay (Dependent - 1 copy)',
      name_vi: 'Đơn xin gia hạn thời hạn lưu trú (Mẫu Người phụ thuộc - 1 bản)',
      purpose: 'Đơn hành chính chính thức',
      issuer: 'ISA (Cục Quản lý Xuất nhập cảnh)',
      required: true,
      validityPeriodMonths: null,
      officialUrl: 'https://www.moj.go.jp/isa/applications/procedures/16-3-1.html',
    },
    {
      id: 'doc-photo-dep',
      name_ja: '写真（縦4cm×横3cm）',
      name_en: 'Photograph (4cm x 3cm)',
      name_vi: 'Ảnh thẻ (4cm x 3cm)',
      purpose: 'Nhận diện nhân thân',
      issuer: 'Tự chuẩn bị theo quy cách',
      required: true,
      validityPeriodMonths: 3,
      officialUrl: 'https://www.moj.go.jp/isa/applications/procedures/photo_info_00002.html',
    },
    {
      id: 'doc-relationship-proof',
      name_ja: '申請人と扶養者との身分関係を証する文書（結婚証明書・出生証明書等）',
      name_en: 'Documents certifying relationship between applicant and supporter (Marriage/Birth certificate)',
      name_vi: 'Giấy tờ chứng minh quan hệ gia đình (Giấy đăng ký kết hôn, Giấy khai sinh kèm bản dịch tiếng Nhật)',
      purpose: 'Chứng minh quan hệ hôn nhân hoặc cha mẹ - con cái hợp pháp',
      issuer: 'Cơ quan hộ tịch sở tại kèm bản dịch',
      required: true,
      validityPeriodMonths: null,
      officialUrl: 'https://www.moj.go.jp/isa/applications/procedures/nyuukokukanri07_00097.html',
    },
    {
      id: 'doc-supporter-card-passport',
      name_ja: '扶養者の在留カード及び旅券（写し）',
      name_en: 'Copy of Supporter Residence Card and Passport',
      name_vi: 'Bản sao Thẻ cư trú và Hộ chiếu của người bảo lãnh',
      purpose: 'Xác minh tư cách lưu trú hợp pháp của người bảo lãnh',
      issuer: 'Người bảo lãnh cung cấp',
      required: true,
      validityPeriodMonths: null,
      officialUrl: 'https://www.moj.go.jp/isa/applications/procedures/nyuukokukanri07_00097.html',
    },
    {
      id: 'doc-supporter-employment-cert',
      name_ja: '扶養者の在職証明書（又は事業を営むことを証する文書）',
      name_en: 'Supporter Certificate of Employment or proof of business operation',
      name_vi: 'Giấy xác nhận công tác (在職証明書) của người bảo lãnh',
      purpose: 'Chứng minh nguồn thu nhập nuôi dưỡng gia đình',
      issuer: 'Doanh nghiệp người bảo lãnh công tác',
      required: true,
      validityPeriodMonths: 3,
      officialUrl: 'https://www.moj.go.jp/isa/applications/procedures/nyuukokukanri07_00097.html',
    },
    {
      id: 'doc-supporter-tax-cert',
      name_ja: '扶養者の住民税の課税・納税証明書（直近1年分）',
      name_en: 'Supporter Municipal Tax Assessment and Payment Certificates (most recent 1 year)',
      name_vi: 'Giấy chứng nhận thuế và nộp thuế cư trú của người bảo lãnh (1 năm gần nhất)',
      purpose: 'Chứng minh năng lực tài chính và nghĩa vụ thuế của người bảo trợ',
      issuer: 'UBND quận/huyện nơi người bảo lãnh cư trú',
      required: true,
      validityPeriodMonths: 3,
      officialUrl: 'https://www.moj.go.jp/isa/applications/procedures/nyuukokukanri07_00097.html',
    },
  ],
  'student': [
    {
      id: 'doc-application-form-stu',
      name_ja: '在留期間更新許可申請書（留学用 1通）',
      name_en: 'Application for Extension of Period of Stay (Student - 1 copy)',
      name_vi: 'Đơn xin gia hạn thời hạn lưu trú (Du học sinh - 1 bản)',
      purpose: 'Đơn hành chính chuẩn',
      issuer: 'ISA (Cục Quản lý Xuất nhập cảnh)',
      required: true,
      validityPeriodMonths: null,
      officialUrl: 'https://www.moj.go.jp/isa/applications/procedures/16-3-1.html',
    },
    {
      id: 'doc-enrollment-cert',
      name_ja: '在学証明書及び成績証明書',
      name_en: 'Certificate of Enrollment and Official Academic Transcript',
      name_vi: 'Giấy chứng nhận đang theo học và Bảng điểm chính thức',
      purpose: 'Chứng minh đang duy trì hoạt động học tập liên tục và kết quả học tập',
      issuer: 'Trường Đại học / Cao đẳng / Trường tiếng Nhật đang theo học',
      required: true,
      validityPeriodMonths: 3,
      officialUrl: 'https://www.moj.go.jp/isa/applications/procedures/16-3-1.html',
    },
    {
      id: 'doc-attendance-cert',
      name_ja: '出席状況証明書（専門学校・日本語学校等の場合）',
      name_en: 'Certificate of Attendance Rate (for vocational and Japanese language schools)',
      name_vi: 'Giấy chứng nhận tỷ lệ điểm danh / chuyên cần (với trường chuyên môn, trường tiếng)',
      purpose: 'Kiểm tra tỷ lệ chuyên cần (thường yêu cầu trên 80%)',
      issuer: 'Nhà trường',
      required: true,
      validityPeriodMonths: 3,
      officialUrl: 'https://www.moj.go.jp/isa/applications/procedures/16-3-1.html',
    },
    {
      id: 'doc-financial-support',
      name_ja: '経費支弁書及び預金残高証明書等',
      name_en: 'Statement of Financial Support and Bank Balance Certificate',
      name_vi: 'Giấy cam kết chi trả kinh phí du học và Giấy xác nhận số dư tài khoản ngân hàng',
      purpose: 'Chứng minh khả năng chi trả học phí và sinh hoạt phí hợp pháp',
      issuer: 'Ngân hàng / Người bảo lãnh tài chính',
      required: true,
      validityPeriodMonths: 3,
      officialUrl: 'https://www.moj.go.jp/isa/applications/procedures/16-3-1.html',
    },
  ],
  'spouse-japanese': [
    {
      id: 'doc-application-form-spouse',
      name_ja: '在留期間更新許可申請書（日本人の配偶者等用 1通）',
      name_en: 'Application for Extension of Period of Stay (Spouse of Japanese National - 1 copy)',
      name_vi: 'Đơn xin gia hạn thời hạn lưu trú (Vợ/Chồng người Nhật - 1 bản)',
      purpose: 'Đơn hành chính theo mẫu',
      issuer: 'ISA (Cục Quản lý Xuất nhập cảnh)',
      required: true,
      validityPeriodMonths: null,
      officialUrl: 'https://www.moj.go.jp/isa/applications/procedures/16-3-1.html',
    },
    {
      id: 'doc-koseki-tohon',
      name_ja: '配偶者（日本人）の戸籍謄本（全部事項証明書、3か月以内発行）',
      name_en: 'Family Register of Japanese Spouse (Koseki Tohon, issued within 3 months)',
      name_vi: 'Trích lục hộ tịch của vợ/chồng người Nhật (Bản toàn bộ thông tin - phát hành trong 3 tháng)',
      purpose: 'Chứng minh hôn nhân vẫn duy trì hiệu lực pháp lý',
      issuer: 'UBND nơi đặt hộ tịch gốc (本籍地役所)',
      required: true,
      validityPeriodMonths: 3,
      officialUrl: 'https://www.moj.go.jp/isa/applications/procedures/nyuukokukanri07_00024.html',
    },
    {
      id: 'doc-juminhyo',
      name_ja: '世帯全員の記載のある住民票の写し（マイナンバー省略、3か月以内発行）',
      name_en: 'Copy of Certificate of Residence for all household members (omitting My Number)',
      name_vi: 'Phiếu cư dân bao gồm tất cả thành viên trong gia đình (bỏ mã My Number, phát hành trong 3 tháng)',
      purpose: 'Chứng minh đang chung sống cùng một hộ gia đình thực tế',
      issuer: 'UBND quận/huyện nơi cư trú',
      required: true,
      validityPeriodMonths: 3,
      officialUrl: 'https://www.moj.go.jp/isa/applications/procedures/nyuukokukanri07_00024.html',
    },
    {
      id: 'doc-guarantor-letter',
      name_ja: '身元保証書（配偶者が署名したもの）',
      name_en: 'Letter of Guarantee (signed by spouse as guarantor)',
      name_vi: 'Giấy bảo lãnh thân nhân (do vợ/chồng người Nhật ký tên)',
      purpose: 'Cam kết trách nhiệm bảo lãnh đạo đức và sinh hoạt',
      issuer: 'Người bảo lãnh (Mẫu ISA)',
      required: true,
      validityPeriodMonths: null,
      officialUrl: 'https://www.moj.go.jp/isa/applications/procedures/nyuukokukanri07_00024.html',
    },
    {
      id: 'doc-spouse-tax-cert',
      name_ja: '直近1年分の住民税の課税・納税証明書（夫婦双方または主たる生計維持者）',
      name_en: 'Municipal tax assessment and payment certificates for the previous year',
      name_vi: 'Giấy nộp thuế cư trú và mức thuế năm gần nhất của hai vợ chồng',
      purpose: 'Chứng minh thu nhập ổn định bảo đảm sinh kế gia đình',
      issuer: 'UBND quận/thị xã',
      required: true,
      validityPeriodMonths: 3,
      officialUrl: 'https://www.moj.go.jp/isa/applications/procedures/nyuukokukanri07_00024.html',
    },
  ],
};

// Canonical status ID aliases
STATUS_DOCUMENTS_CATALOG['engineer-humanities-international'] = STATUS_DOCUMENTS_CATALOG['engineer-specialist'];
STATUS_DOCUMENTS_CATALOG['spouse-of-japanese'] = STATUS_DOCUMENTS_CATALOG['spouse-japanese'];

