/**
 * @file packages/core/src/japan/immigration/permanentResidence/prRules.js
 * @description
 * Quy định pháp lý và tiêu chuẩn chính thức của Cục Quản lý Xuất nhập cảnh Nhật Bản (ISA)
 * về Cấp phép Vĩnh trú (永住許可に関するガイドライン - Guidelines for Permission for Permanent Residence).
 * Căn cứ:
 * - Điều 22 Luật Kiểm soát Xuất nhập cảnh & Công nhận Người tị nạn (出入国管理及び難民認定法第22条).
 * - Tiêu chuẩn thẩm định Vĩnh trú sửa đổi cập nhật của Bộ Tư pháp Nhật Bản (法務省).
 * - Lệnh thu phí Luật Nhập quản (手数料令第2条).
 */

import { defineRuleMetadata } from '../../../regulatory/ruleMetadata.js';
import { JAPAN_JURISDICTION } from '../../../regulatory/jurisdiction.js';

export const PERMANENT_RESIDENCE_RULE = defineRuleMetadata({
  id: 'jp-imm-permanent-residence-2026',
  jurisdiction: JAPAN_JURISDICTION,
  sourceId: 'isa-pr-guidelines',
  effectiveFrom: '2006-03-31',
  applicablePeriod: { type: 'calendar-year', from: 2006, to: 2099 },
  version: '2026.1',
  lastVerifiedAt: '2026-09-11',
  status: 'verified',
  ruleNature: 'administrative-discretion',
  notes: 'Cấp phép Vĩnh trú thuộc toàn quyền tự do xem xét của Bộ trưởng Tư pháp. 5 chiều kích pháp định phải được đáp ứng đồng thời.',
});

/**
 * 4 Tuyến xin cấp Vĩnh trú chính thức
 */
export const PR_APPLICATION_ROUTES = {
  // 1. Tuyến Tiêu chuẩn (Standard 10-Year Route)
  STANDARD_10_YEAR: {
    id: 'standard_10_year',
    name_ja: '原則10年在留ルート（就労資格・一般）',
    name_vn: 'Tuyến tiêu chuẩn 10 năm cư trú liên tục (Trong đó tối thiểu 5 năm đi làm)',
    name_en: 'Standard 10-Year Continuous Residence Route (Min. 5 years on work status)',
    minYearsContinuousStay: 10,
    minYearsWorkStay: 5,
    taxCheckYears: 5,
    pensionCheckYears: 2,
    incomeCheckYears: 5,
    guidance_ja: '引き続き10年以上日本に在留し、このうち就労資格（技能実習・特定技能1号を除く）または居住資格をもって引き続き5年以上在留していること。',
    guidance_vn: 'Phải ở Nhật liên tục từ 10 năm trở lên, trong đó có ít nhất 5 năm cư trú theo visa lao động (không tính Thực tập sinh và Kỹ năng đặc định số 1) hoặc visa nhân thân.',
    guidance_en: 'Must have resided in Japan continuously for 10+ years, including at least 5 years under a work status (excluding TITP and SSW 1).'
  },

  // 2. Tuyến Vợ/Chồng công dân Nhật hoặc Người Vĩnh trú (Spouse Route)
  SPOUSE_OF_JAPANESE_OR_PR: {
    id: 'spouse_of_japanese_or_pr',
    name_ja: '日本人・永住者の配偶者・子特例ルート',
    name_vn: 'Tuyến ưu tiên Vợ/Chồng của Công dân Nhật hoặc Người Vĩnh trú',
    name_en: 'Spouse or Child of Japanese National / Permanent Resident Route',
    minYearsMarriage: 3,
    minYearsContinuousStay: 1,
    taxCheckYears: 3,
    pensionCheckYears: 2,
    incomeCheckYears: 3,
    guidance_ja: '実態を伴った婚姻生活が3年以上継続し、かつ引き続き1年以上日本に在留していること（実子・特別養子の場合は1年以上継続在留）。独立生計要件および素行要件は法律上緩和されます。',
    guidance_vn: 'Hôn nhân thực tế duy trì từ 3 năm trở lên và đã cư trú liên tục tại Nhật từ 1 năm trở lên. Tiêu chí độc lập kinh tế được xem xét trên tổng thu nhập hộ gia đình.',
    guidance_en: 'Substantive marital life of 3+ years and 1+ year continuous stay in Japan. Economic self-sufficiency is evaluated based on household income.'
  },

  // 3. Tuyến Lao động Chất lượng cao 80 điểm (HSP 80 Points Route)
  HSP_80_POINTS: {
    id: 'hsp_80_points',
    name_ja: '高度専門職（80点以上）特例ルート（最短1年）',
    name_vn: 'Tuyến Lao động chất lượng cao đạt từ 80 điểm (Tối thiểu 1 năm)',
    name_en: 'Highly Skilled Professional 80+ Points Route (Fast-track 1 year)',
    minYearsContinuousStay: 1,
    minYearsWorkStay: 1,
    taxCheckYears: 1,
    pensionCheckYears: 1,
    incomeCheckYears: 1,
    guidance_ja: '高度人材ポイント計算で80点以上を有し、申請の1年前から継続して80点以上を維持していること。最短1年の在留で永住申請が可能。',
    guidance_vn: 'Đạt từ 80 điểm trở lên theo thang điểm HSP và duy trì liên tục từ 80 điểm trong suốt 1 năm trước ngày nộp đơn.',
    guidance_en: 'Score 80+ points under HSP system and maintained 80+ points continuously for at least 1 year prior to application.'
  },

  // 4. Tuyến Lao động Chất lượng cao 70 điểm (HSP 70 Points Route)
  HSP_70_POINTS: {
    id: 'hsp_70_points',
    name_ja: '高度専門職（70点以上）特例ルート（最短3年）',
    name_vn: 'Tuyến Lao động chất lượng cao đạt từ 70 điểm (Tối thiểu 3 năm)',
    name_en: 'Highly Skilled Professional 70+ Points Route (Fast-track 3 years)',
    minYearsContinuousStay: 3,
    minYearsWorkStay: 3,
    taxCheckYears: 3,
    pensionCheckYears: 2,
    incomeCheckYears: 3,
    guidance_ja: '高度人材ポイント計算で70点以上を有し、申請の3年前から継続して70点以上を維持していること。',
    guidance_vn: 'Đạt từ 70 điểm trở lên theo thang điểm HSP và duy trì liên tục từ 70 điểm trong suốt 3 năm trước ngày nộp đơn.',
    guidance_en: 'Score 70+ points under HSP system and maintained 70+ points continuously for at least 3 years prior to application.'
  }
};

/**
 * Tiêu chuẩn thu nhập hàng năm theo quy chuẩn thực tế của ISA
 */
export const PR_INCOME_BENCHMARKS = {
  SINGLE_APPLICANT_MINIMUM: 3000000, // Tối thiểu 3.000.000 JPY/năm cho đương đơn độc thân
  ADDITIONAL_PER_DEPENDENT: 700000, // Thêm 700.000 - 800.000 JPY cho mỗi người phụ thuộc
};

/**
 * Ngưỡng thời gian rời khỏi Nhật Bản (Absence thresholds)
 */
export const PR_ABSENCE_LIMITS = {
  MAX_CONSECUTIVE_DAYS_ABROAD: 90, // Xuất cảnh liên tục trên 90 ngày sẽ bị đứt đoạn thời gian cư trú
  MAX_TOTAL_DAYS_PER_YEAR: 100, // Tổng số ngày rời Nhật quá 100 - 150 ngày/năm sẽ bị xem xét nghiêm ngặt
};

/**
 * Quy định về lệ phí cấp thẻ Vĩnh trú
 */
export function getPermanentResidenceFeeSchedule(applicationDate = new Date().toISOString().slice(0, 10)) {
  const cutoff = '2026-10-01';
  const isPostOct2026 = applicationDate >= cutoff;
  const amount = isPostOct2026 ? 10000 : 8000;

  return {
    applicationFee: 0, // Nộp hồ sơ miễn phí
    grantFee: amount, // Lệ phí khi được cấp thẻ
    currency: 'JPY',
    paymentMethod: '収入印紙 (Revenue Stamp)',
    condition_ja: '永住許可の決定を受け、新しい在留カードを受領する際のみ納付（不許可の場合は0円）。',
    condition_vn: 'Chỉ nộp khi nhận thẻ Vĩnh trú chính thức (Từ chối nộp 0 JPY).',
    condition_en: 'Payable exclusively upon receiving the Permanent Resident card (0 JPY if denied).',
    statutoryBasis: '出入国管理及び難民認定法関係手数料令第2条',
    note: isPostOct2026
      ? '2026年10月1日以降の手数料改定（10,000円）が適用されます。'
      : '2026年9月30日までの現行手数料（8,000円）が適用されます。'
  };
}

/**
 * Cảnh báo pháp lý về Cải cách Luật Nhập cảnh 2024/2026
 * (Quy định thu hồi vĩnh trú nếu cố tình trốn thuế / an sinh xã hội)
 */
export const PR_2026_REFORM_CONTEXT = {
  title_ja: '【法改正情報】永住許可後の在留資格取消制度（2024年成立・2026〜2027年施行見込み）',
  title_vn: '【Thông tin cải cách pháp luật】Cơ chế thu hồi tư cách Vĩnh trú nếu trốn thuế / an sinh xã hội',
  title_en: '【Legal Reform】Revocation of Permanent Residence for Intentional Tax/Social Insurance Evasion',
  content_ja: '2024年に入管法が改正され、永住者であっても故意に公租公課（税金や国民健康保険・年金）を納付しない場合や、特定の重大な法令違反があった場合に、永住許可を取り消して別の在留資格へ変更できる規定が導入されました。永住権取得後も納税義務の適正な履行が継続して求められます。',
  content_vn: 'Quốc hội Nhật Bản đã thông qua Luật Nhập cảnh sửa đổi (dự kiến có hiệu lực khoảng 2026-2027), bổ sung chế tài: Ngay cả khi đã có Vĩnh trú, nếu cố tình trốn nộp thuế hoặc trốn đóng BHYT/Nenkin kéo dài, Cục Nhập cảnh có quyền THU HỒI TƯ CÁCH VĨNH TRÚ và hạ cấp xuống visa lao động thông thường.',
  content_en: 'The 2024 revised Immigration Act introduces powers to revoke Permanent Resident status if an individual intentionally and repeatedly fails to pay taxes or social security contributions.'
};
