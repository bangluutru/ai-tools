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
  lastVerifiedAt: '2026-09-11',
  status: 'verified',
  effectiveBy: 'applicationDate',
  ruleNature: 'guidance',
  notes: 'Thủ tục tự nguyện nhưng được khuyến nghị khi chuyển việc: xác nhận công việc mới phù hợp với visa hiện tại, lệ phí 1.200 JPY tem doanh thu.',
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
