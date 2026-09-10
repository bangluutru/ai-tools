/**
 * @file packages/core/src/japan/immigration/family/familyRules.js
 * @description
 * Quy định pháp lý và quy tắc nghiệp vụ cho thủ tục bảo lãnh gia đình và tư cách 家族滞在 (Dependent).
 * Căn cứ:
 * - Luật Kiểm soát Xuất nhập cảnh & Công nhận Người tị nạn (Điều 2 Khoản 2 Bảng 1-4: 「家族滞在」).
 * - Điều 22-2 (Xin cấp tư cách lưu trú cho trẻ sinh tại Nhật Bản - 在留資格取得許可).
 * - Điều 19 Khoản 2 (Giấy phép hoạt động ngoài tư cách 28h/tuần - 資格外活動許可).
 * - Hướng dẫn của Cục Quản lý Xuất nhập cảnh và Lưu trú Nhật Bản (出入国在留管理庁 - ISA).
 */

import { defineRuleMetadata } from '../../../regulatory/ruleMetadata.js';
import { JAPAN_JURISDICTION } from '../../../regulatory/jurisdiction.js';

export const FAMILY_IMMIGRATION_RULE = defineRuleMetadata({
  id: 'jp-imm-family-dependent-2026',
  jurisdiction: JAPAN_JURISDICTION,
  sourceId: 'isa-family-guidelines',
  effectiveFrom: '1990-06-01',
  applicablePeriod: { type: 'calendar-year', from: 1990, to: 2099 },
  version: '2026.1',
  lastVerifiedAt: '2026-09-11',
  status: 'verified',
  ruleNature: 'deterministic',
  notes: 'Tư cách 家族滞在 chỉ áp dụng cho vợ/chồng hợp pháp và con cái phụ thuộc. Nghiêm cấm áp dụng cho cha mẹ hoặc anh chị em ruột.',
});

/**
 * Danh sách tư cách người bảo lãnh được phép bảo lãnh 家族滞在
 */
export const SPONSOR_STATUS_ELIGIBILITY = {
  // Được phép bảo lãnh vợ/chồng, con cái
  ALLOWED_STATUSES: [
    'professor', // 教授
    'artist', // 芸術
    'religious_activities', // 宗教
    'journalist', // 報道
    'highly_skilled_professional', // 高度専門職
    'business_manager', // 経営・管理
    'legal_accounting_services', // 法律・会計業務
    'medical_services', // 医療
    'researcher', // 研究
    'instructor', // 教育
    'engineer_specialist', // 技術・人文知識・国際業務
    'intra_company_transferee', // 企業内転勤
    'nursing_care', // 介護
    'entertainer', // 興行
    'skilled_labor', // 技能
    'specified_skilled_2', // 特定技能2号 (Được phép bảo lãnh)
    'cultural_activities', // 文化活動
    'student' // 留学 (Trường hợp du học sinh đại học/sau đại học có chứng minh tài chính dồi dào)
  ],

  // Tuyệt đối KHÔNG được bảo lãnh 家族滞在
  BARRED_STATUSES: [
    'specified_skilled_1', // 特定技能1号 (Không được bảo lãnh gia đình)
    'technical_intern', // 技能実習 (Không được bảo lãnh gia đình)
    'trainee', // 研修
    'temporary_visitor', // 短期滞在
    'dependent' // 家族滞在 (Bản thân đang là người phụ thuộc)
  ]
};

/**
 * Mối quan hệ thân nhân và phạm vi chấp thuận theo luật
 */
export const RELATIONSHIP_SCOPES = {
  SPOUSE: {
    id: 'spouse',
    name_ja: '配偶者（法的に婚姻関係にある夫または妻）',
    name_vn: 'Vợ hoặc Chồng hợp pháp (Đã đăng ký kết hôn theo pháp luật)',
    name_en: 'Legal Spouse (Legally married husband or wife)',
    eligibleForKazokuTaizai: true,
    notes_ja: '内縁関係や同性婚（日本法上）は「家族滞在」の対象外です（一部「特定活動」の人道配慮対象となる場合あり）。',
    notes_vn: 'Hôn nhân thực tế không hôn thú (nội duyên) không thuộc diện 家族滞在.',
    notes_en: 'Common-law marriage is not eligible for Dependent status.'
  },
  CHILD: {
    id: 'child',
    name_ja: '子（実子、養子、嫡出子、非嫡出子、認知された子）',
    name_vn: 'Con cái (Con ruột, con nuôi hợp pháp, con được thừa nhận)',
    name_en: 'Child (Biological child, legally adopted child)',
    eligibleForKazokuTaizai: true,
    notes_ja: '親の扶養を受けていることが要件。成人していても親の扶養下にあれば対象となり得ますが審査は厳格化します。',
    notes_vn: 'Phải phụ thuộc kinh tế vào cha mẹ. Nếu đã thành niên, Cục sẽ đối soát khắt khe lý do tiếp tục phụ thuộc.',
    notes_en: 'Must be financially dependent on parents. Stricter scrutiny applies if adult.'
  },
  PARENT: {
    id: 'parent',
    name_ja: '父母・義父母（親族）',
    name_vn: 'Cha mẹ ruột / Cha mẹ vợ hoặc chồng',
    name_en: 'Parents / Parents-in-law',
    eligibleForKazokuTaizai: false,
    alternativeRoute: 'designated_activities_hsp_or_humanitarian',
    notes_ja: '入管法上、「家族滞在」で親を呼ぶことは一切認められません。高度専門職ビザの特例（7歳未満の子の養育等の条件）または人道上の「特定活動」（高齢・重病・本国に身寄りなし）のみが例外検討対象です。',
    notes_vn: 'Theo Luật Nhập cảnh, CHA MẸ KHÔNG THUỘC DIỆN VISA GIA ĐÌNH (家族滞在). Chỉ có thể xem xét diện 特定活動 nếu người bảo lãnh là Lao động chất lượng cao (HSP có con dưới 7 tuổi) hoặc bảo hộ nhân đạo (cha mẹ già yếu, bệnh nặng, không còn ai chăm sóc ở quê nhà).',
    notes_en: 'Parents CANNOT be sponsored under Dependent status. Only available via Designated Activities for HSPs (rearing child under 7) or rare humanitarian protection for elderly/infirm parents with no relatives in home country.'
  },
  SIBLING: {
    id: 'sibling',
    name_ja: '兄弟・姉妹',
    name_vn: 'Anh chị em ruột',
    name_en: 'Brothers / Sisters',
    eligibleForKazokuTaizai: false,
    alternativeRoute: 'none',
    notes_ja: '兄弟姉妹は「家族滞在」の対象外です。留学や就労など本人の独立した在留資格が必要です。',
    notes_vn: 'Anh chị em ruột hoàn toàn không thuộc diện bảo lãnh gia đình. Muốn sang Nhật phải tự xin visa độc lập (Du học, Đi làm...).',
    notes_en: 'Siblings cannot be sponsored as dependents. They must qualify for independent visas (Student, Work, etc.).'
  }
};

/**
 * Ngưỡng thu nhập ước tính và tiêu chuẩn kinh tế của người bảo lãnh
 */
export const SPONSOR_FINANCIAL_BENCHMARKS = {
  BASE_ANNUAL_INCOME_ONE_DEPENDENT: 2500000, // 2.500.000 JPY/năm cho 1 người phụ thuộc
  ADDITIONAL_PER_DEPENDENT: 600000, // Thêm 600.000 JPY cho mỗi người phụ thuộc bổ sung
  RECOMMENDED_MINIMUM_SAVINGS: 1000000, // Tiết kiệm ngân hàng tối thiểu đề xuất
};

/**
 * Các phương thức thủ tục nhập cảnh gia đình
 */
export const FAMILY_APPLICATION_PROCEDURES = {
  COE: {
    id: 'coe',
    name_ja: '在留資格認定証明書交付申請（海外からの呼寄せ）',
    name_vn: 'Xin cấp Giấy chứng nhận tư cách lưu trú (COE - Đưa người thân từ nước ngoài sang)',
    name_en: 'Certificate of Eligibility (COE) Application (Inviting family from abroad)',
    fee: 0,
    feeUnit: 'JPY (Miễn phí)',
    statutoryPeriod: '1か月〜3か月程度',
    steps: [
      'Người bảo lãnh nộp đơn xin cấp COE tại Cục Xuất nhập cảnh quản lý địa bàn cư trú tại Nhật Bản.',
      'Cục Xuất nhập cảnh thẩm định năng lực tài chính và tính xác thực của mối quan hệ nhân thân.',
      'Nhận COE (bản giấy hoặc bản điện tử e-COE) và gửi về cho người thân tại quê nhà.',
      'Người thân nộp COE kèm hộ chiếu xin dán tem thị thực (Visa) tại Đại sứ quán/Lãnh sự quán Nhật Bản.',
      'Nhập cảnh Nhật Bản qua các sân bay quốc tế và nhận Thẻ Cư Trú (在留カード) ngay tại cửa khẩu.'
    ]
  },
  STATUS_CHANGE: {
    id: 'status_change',
    name_ja: '在留資格変更許可申請（既に日本に滞在中の家族）',
    name_vn: 'Xin đổi tư cách lưu trú sang 家族滞在 (Người thân đang có mặt tại Nhật Bản)',
    name_en: 'Change of Status Application (Family member already in Japan)',
    statutoryBasis: '出入国管理及び難民認定法第20条',
    feeNote_ja: '許可時に収入印紙（4,000円、2026年10月1日以降は6,000円）納付。',
    feeNote_vn: 'Nộp lệ phí khi được cấp thẻ (4.000 JPY trước 01/10/2026; 6.000 JPY từ 01/10/2026).',
    steps: [
      'Người thân cùng người bảo lãnh nộp hồ sơ xin đổi tư cách sang 家族滞在 tại Cục Xuất nhập cảnh.',
      'Áp dụng thời hạn đặc lệ (特例期間) ở lại tối đa 2 tháng sau hạn visa cũ nếu nộp trước ngày hết hạn.',
      'Khi có giấy báo nhận kết quả, mang theo hộ chiếu, thẻ cư trú cũ và tem doanh thu để nhận thẻ mới.'
    ]
  },
  CHILD_BORN_IN_JAPAN: {
    id: 'child_born_in_japan',
    name_ja: '在留資格取得許可申請（日本で出生した子ども）',
    name_vn: 'Xin cấp tư cách lưu trú cho trẻ sinh ra tại Nhật Bản (Điều 22-2)',
    name_en: 'Acquisition of Status of Residence for Newborn in Japan (Art. 22-2)',
    fee: 0,
    feeUnit: 'JPY (Miễn phí)',
    deadlineDays: 30,
    statutoryLimitDays: 60,
    statutoryBasis: '出入国管理及び難民認定法第22条の2',
    criticalNotice_ja: '出生後30日以内に入管に「在留資格取得許可申請」を行う必要があります。出生後60日を超えて無資格で滞在した場合は不法滞在となります。',
    criticalNotice_vn: 'PHẢI nộp đơn xin cấp tư cách lưu trú trong vòng 30 ngày kể từ ngày trẻ chào đời nếu trẻ ở lại Nhật quá 60 ngày. Quá 60 ngày không có visa sẽ thành cư trú bất hợp pháp.',
    criticalNotice_en: 'Application for Acquisition of Status of Residence must be filed within 30 days of birth if staying over 60 days. Staying past 60 days without status is illegal.'
  }
};

/**
 * Quy định về việc làm thêm của người phụ thuộc (Part-time work)
 */
export const DEPENDENT_WORK_PERMIT_RULES = {
  DEFAULT_STATUS: '就労不可（原則として就労活動は禁止）',
  PERMIT_NAME: '資格外活動許可（包括許可）',
  WEEKLY_HOUR_LIMIT: 28, // Tối đa 28 giờ/tuần
  FEE: 0, // Miễn phí nộp đơn
  PROHIBITED_INDUSTRIES: [
    '風俗営業（キャバクラ、ホストクラブ、パチンコ店、麻雀店、ゲームセンター等）',
    '性風俗特殊営業',
    '無店舗型性風俗営業'
  ],
  TAX_DEPENDENCY_CEILING: 1300000, // 1.300.000 JPY/năm (ngưỡng mất quyền phụ thuộc BHYT)
  RENEWAL_RISK_WARNING_ja: '週28時間を超える就労（オーバーワーク）や年間収入が扶養の範囲を著しく逸脱した場合、家族滞在ビザの更新不許可や取消の対象となります。',
  RENEWAL_RISK_WARNING_vn: 'Làm quá 28 giờ/tuần hoặc thu nhập vượt quá mức phụ thuộc để thành lao động độc lập sẽ dẫn đến nguy cơ bị từ chối gia hạn hoặc thu hồi thẻ cư trú 家族滞在.',
  RENEWAL_RISK_WARNING_en: 'Working beyond 28 hours/week or substantially exceeding dependent income ceilings may cause renewal denial or status revocation.'
};
