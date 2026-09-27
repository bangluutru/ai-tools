/**
 * @file packages/core/src/japan/immigration/affiliation/affiliationRules.js
 * @description
 * Quy chuẩn pháp lý và quy tắc nghiệp vụ khi Chuyển việc, Thay đổi đơn vị công tác (所属機関変更).
 * Căn cứ: Luật Nhập quản Điều 19-16 (Nghĩa vụ thông báo trong 14 ngày),
 * Điều 22-4 (Nguy cơ thu hồi tư cách sau 3 tháng không hoạt động),
 * Điều 19-2 (Giấy chứng nhận tư cách làm việc - 就労資格証明書).
 */

import { defineRuleMetadata } from '../../../regulatory/ruleMetadata.js';
import { JAPAN_JURISDICTION } from '../../../regulatory/jurisdiction.js';

export const AFFILIATION_SOURCES = {
  NOTIFICATION_14_DAYS: 'isa-act-art19-16',
  REVOCATION_3_MONTHS: 'isa-act-art22-4-para1-item6',
  AUTHORIZED_EMPLOYMENT_CERT: 'isa-act-art19-2',
};

/**
 * Metadata cho nghĩa vụ thông báo thay đổi cơ quan trực thuộc trong vòng 14 ngày
 */
export const NOTIFICATION_14_DAYS_RULE = defineRuleMetadata({
  id: 'jp-imm-affiliation-14days',
  jurisdiction: JAPAN_JURISDICTION,
  sourceId: 'isa-act-art19-16',
  effectiveFrom: '2012-07-09',
  applicablePeriod: { type: 'calendar-year', from: 2012, to: 2099 },
  version: '2026.1',
  lastVerifiedAt: '2026-09-11',
  status: 'verified',
  effectiveBy: 'eventDate',
  ruleNature: 'prerequisite',
  notes: 'Người có tư cách lưu trú trung và dài hạn phải thông báo cho Bộ trưởng Bộ Tư pháp trong vòng 14 ngày kể từ khi rời khỏi hoặc chuyển sang cơ quan mới (Điều 19-16). Vi phạm có thể bị phạt tiền đến 200.000 JPY (Điều 71-3).',
});

/**
 * Metadata cho quy định thu hồi tư cách lưu trú khi không thực hiện hoạt động liên tục từ 3 tháng trở lên
 */
export const REVOCATION_3_MONTHS_RULE = defineRuleMetadata({
  id: 'jp-imm-revocation-3months',
  jurisdiction: JAPAN_JURISDICTION,
  sourceId: 'isa-act-art22-4-para1-item6',
  effectiveFrom: '2006-05-24',
  applicablePeriod: { type: 'calendar-year', from: 2006, to: 2099 },
  version: '2026.1',
  lastVerifiedAt: '2026-09-11',
  status: 'verified',
  effectiveBy: 'eventDate',
  ruleNature: 'administrative-discretion',
  notes: 'Nếu người giữ visa lao động/du học không hoạt động liên tục từ 3 tháng trở lên mà không có lý do chính đáng (正当な理由), tư cách lưu trú có thể bị thu hồi theo Điều 22-4 khoản 1 mục 6.',
});

/**
 * Metadata cho Giấy chứng nhận tư cách làm việc (就労資格証明書)
 */
export const AUTHORIZED_EMPLOYMENT_CERT_RULE = defineRuleMetadata({
  id: 'jp-imm-authorized-employment-cert',
  jurisdiction: JAPAN_JURISDICTION,
  sourceId: 'isa-act-art19-2',
  effectiveFrom: '1990-06-01',
  applicablePeriod: { type: 'calendar-year', from: 1990, to: 2099 },
  version: '2026.1',
  lastVerifiedAt: '2026-09-27',
  status: 'verified',
  effectiveBy: 'applicationDate',
  ruleNature: 'guidance',
  notes: 'Thủ tục tự nguyện nhưng được khuyến nghị khi chuyển việc: xác nhận công việc mới phù hợp với visa hiện tại. Lệ phí: 2.000 JPY tại quầy (tem 収入印紙) / 1.600 JPY online (từ 01/10/2026 online cộng phí thanh toán 220 JPY). Nguồn: https://www.moj.go.jp/isa/applications/procedures/16-9.html',
});

/**
 * Các hình thức nộp Thông báo cơ quan trực thuộc (3 phương thức chính thức của ISA)
 */
export const FILING_METHODS = [
  {
    id: 'online-portal',
    name_ja: '出入国在留管理庁 電子届出システム（オンライン）',
    name_en: 'ISA Electronic Notification System (Online)',
    name_vi: 'Hệ thống thông báo điện tử trực tuyến của Cục Quản lý Xuất nhập cảnh',
    availability: '24/7 (Miễn phí hoàn toàn, xử lý nhanh nhất)',
    url: 'https://www.ens-immi.moj.go.jp/NA001/NA001Search.html',
    recommended: true,
  },
  {
    id: 'postal-mail',
    name_ja: '郵送による届出（東京出入国在留管理局 在留管理情報部門 届出受付担当）',
    name_en: 'Notification by Postal Mail (Tokyo Regional Immigration Bureau)',
    name_vi: 'Gửi bưu điện bảo đảm (Kèm bản sao 2 mặt thẻ cư trú đến Bộ phận Tiếp nhận thông báo Cục XNC)',
    availability: 'Gửi thư bảo đảm ghi nhận ngày bưu điện đóng dấu',
    url: 'https://www.moj.go.jp/isa/applications/procedures/nyuukokukanri10_00015.html',
    recommended: false,
  },
  {
    id: 'in-person',
    name_ja: '地方出入国在留管理官署への窓口持参',
    name_en: 'In-person Submission at Regional Immigration Bureau / Branch',
    name_vi: 'Trực tiếp mang thẻ cư trú và mẫu thông báo đến quầy Cục Xuất nhập cảnh địa phương',
    availability: 'Ngày làm việc hành chính (9:00 - 16:00)',
    url: 'https://www.moj.go.jp/isa/about/region/index.html',
    recommended: false,
  },
];

/**
 * Loại nghĩa vụ thông báo theo Điều 19-16 (入管法第19条の16) theo tư cách lưu trú (canonical id).
 * Nguồn: https://www.moj.go.jp/isa/applications/procedures/index.html (mục 所属機関等に関する届出)
 * - 'activity-institution' (活動機関): 教授, 高度専門職1号ハ, 経営・管理, 法律・会計業務, 医療, 教育, 企業内転勤, 技能実習, 留学, 研修
 * - 'contract-institution' (契約機関): 高度専門職1号イ・ロ, 研究, 技術・人文知識・国際業務, 介護, 興行, 技能, 特定技能
 * - 'spouse' (配偶者に関する届出 — chỉ khi ly hôn/tử biệt): 家族滞在, 特定活動(配偶者), 日本人の配偶者等, 永住者の配偶者等
 * - Tư cách không có trong bảng → 'none' (永住者, 定住者, 文化活動, 短期滞在, 特定活動 nói chung, 芸術, 宗教, 報道...)
 * Ghi chú: 高度専門職1号/2号 gồm cả ハ (活動機関) và イ・ロ (契約機関) — công cụ gộp vào 'contract-institution'; mẫu đơn khác nhau.
 */
export const NOTIFICATION_TYPE_BY_STATUS = Object.freeze({
  'professor': 'activity-institution',
  'business-manager': 'activity-institution',
  'legal-accounting': 'activity-institution',
  'medical-services': 'activity-institution',
  'instructor': 'activity-institution',
  'intra-company-transferee': 'activity-institution',
  'technical-intern-training': 'activity-institution',
  'student': 'activity-institution',
  'trainee': 'activity-institution',
  'highly-skilled-professional-1': 'contract-institution',
  'highly-skilled-professional-2': 'contract-institution',
  'researcher': 'contract-institution',
  'engineer-humanities-international': 'contract-institution',
  'nursing-care': 'contract-institution',
  'entertainer': 'contract-institution',
  'skilled-labor': 'contract-institution',
  'specified-skilled-worker-1': 'contract-institution',
  'specified-skilled-worker-2': 'contract-institution',
  'dependent': 'spouse',
  'spouse-of-japanese': 'spouse',
  'spouse-of-permanent-resident': 'spouse',
});

export const NOTIFICATION_FORM_URLS = Object.freeze({
  'activity-institution': 'https://www.moj.go.jp/isa/applications/procedures/nyuukokukanri10_00014.html',
  'contract-institution': 'https://www.moj.go.jp/isa/applications/procedures/nyuukokukanri10_00015.html',
  'spouse': 'https://www.moj.go.jp/isa/applications/procedures/nyuukokukanri10_00016.html',
});
