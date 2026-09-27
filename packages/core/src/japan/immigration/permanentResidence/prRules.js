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
import { getResidencePermitFee } from '../shared/immigrationFeeTable.js';

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
 * Mốc thu nhập hàng năm — ƯỚC TÍNH THỰC TẾ của giới hành nghề (gyoseishoshi),
 * KHÔNG phải tiêu chuẩn do ISA công bố. Ghi nhãn rõ ràng trên UI.
 */
export const PR_INCOME_BENCHMARKS = {
  isOfficialStandard: false,
  SINGLE_APPLICANT_MINIMUM: 3000000, // ~3.000.000 JPY/năm (ước tính thực tế)
  ADDITIONAL_PER_DEPENDENT: 700000, // ~700.000 JPY cho mỗi người phụ thuộc (ước tính thực tế)
};

/**
 * Ngưỡng thời gian rời khỏi Nhật Bản — ƯỚC TÍNH THỰC TẾ, không phải tiêu chuẩn ISA công bố.
 * Chỉ dùng để CẢNH BÁO, không kết luận "không đạt".
 */
export const PR_ABSENCE_LIMITS = {
  isOfficialStandard: false,
  MAX_CONSECUTIVE_DAYS_ABROAD: 90, // Một chuyến đi dài (thường được nhắc ~3 tháng) có thể bị xem là gián đoạn cư trú
  MAX_TOTAL_DAYS_PER_YEAR: 100, // Tổng ~100 ngày/năm trở lên thường bị xem xét kỹ
};

/**
 * Hướng dẫn cấp phép Vĩnh trú (永住許可に関するガイドライン) — bản sửa đổi ngày 24/02/2026.
 * Nguồn: https://www.moj.go.jp/isa/applications/resources/nyukan_nyukan50.html
 * - Đến hết 31/03/2027: thời hạn "3 năm" được coi là "thời hạn dài nhất" (最長の在留期間).
 * - Sau đó: cần thời hạn dài nhất thực tế của tư cách (thường là 5 năm); người đang giữ 3 năm
 *   vào ngày đó được ưu đãi một lần ở lần xét đầu tiên.
 * - Phải tiếp tục phù hợp tiêu chuẩn cấp phép nhập cảnh (上陸許可基準) của tư cách hiện tại.
 */
export const PR_GUIDELINE_2026 = Object.freeze({
  revisedOn: '2026-02-24',
  threeYearTreatedAsLongestUntil: '2027-03-31',
  officialUrl: 'https://www.moj.go.jp/isa/applications/resources/nyukan_nyukan50.html',
  title_ja: '永住許可に関するガイドライン（令和8年2月24日改訂）',
  title_vn: 'Hướng dẫn cấp phép Vĩnh trú (sửa đổi ngày 24/02/2026)',
  title_en: 'Guidelines for Permission for Permanent Residence (revised 24 Feb 2026)',
  content_ja: '令和9年3月31日までの間は、在留期間「3年」を「最長の在留期間」として取り扱います。それ以降は、現に有する在留資格の実際の最長の在留期間（多くは5年）が必要となります（同日時点で3年を有する方は、その後最初の処分に限り従前どおり扱われます）。また、現に有する在留資格について上陸許可基準等に適合していることが求められます。',
  content_vn: 'Đến hết ngày 31/03/2027, visa thời hạn "3 năm" vẫn được coi là "thời hạn dài nhất". Từ sau mốc đó, cần giữ thời hạn dài nhất thực tế của tư cách hiện tại (thường là 5 năm) — người đang có visa 3 năm vào ngày đó được xét theo cách cũ một lần ở lần xét đầu tiên. Ngoài ra, bạn phải tiếp tục đáp ứng tiêu chuẩn cấp phép nhập cảnh (上陸許可基準) của tư cách đang có.',
  content_en: 'Until 31 Mar 2027 a 3-year period of stay is treated as the "longest period". After that, the actual longest period for your status (usually 5 years) is required (holders of 3 years on that date get the old treatment once, at their first decision). Applicants must also continue to meet the landing standards of their current status.',
});

/**
 * DỰ THẢO sửa đổi Hướng dẫn Vĩnh trú (công bố 04/08/2026, lấy ý kiến công chúng đến 04/09/2026).
 * CHƯA CHÍNH THỨC — nội dung và ngày áp dụng có thể thay đổi.
 * Nguồn: e-Gov パブリック・コメント (永住許可に関するガイドライン改定案、令和8年8月4日 出入国在留管理庁)
 */
export const PR_GUIDELINE_DRAFT_2026_08 = Object.freeze({
  status: 'draft',
  publishedOn: '2026-08-04',
  publicCommentClosedOn: '2026-09-04',
  proposedIncomeApplicationFrom: '2026-10',
  proposedOtherApplicationFrom: '2027-04',
  officialUrl: 'https://public-comment.e-gov.go.jp/pcm/detail?CLASSNAME=PCMMSTDETAIL&id=315000140&Mode=0',
  title_ja: '【案・未確定】永住許可に関するガイドライン改定案（2026年8月公表）',
  title_vn: '【DỰ THẢO – CHƯA CHÍNH THỨC】Đề xuất sửa đổi Hướng dẫn Vĩnh trú (công bố 08/2026)',
  title_en: '【DRAFT – NOT FINAL】Proposed revision of the PR Guidelines (published Aug 2026)',
  content_ja: '改定案（2026年8月4日公表、意見募集は9月4日締切）では、①世帯人数に応じた日本人世帯の平均収入を上回る年収（収入要素は2026年10月から適用予定）、②厚生年金に30年加入した水準に相当する年金見込額（不足分は金融資産で補填可）、③日本語能力CEFR B1相当、④日本人・永住者の配偶者等の特例を婚姻5年・在留3年に延長（収入以外は2027年4月から適用予定）等が示されています。最終決定ではありません。',
  content_vn: 'Theo dự thảo (công bố 04/08/2026, hết hạn lấy ý kiến 04/09/2026): (1) thu nhập hộ gia đình phải CAO HƠN mức trung bình của hộ người Nhật cùng số người (dự kiến áp dụng yếu tố thu nhập từ 10/2026); (2) lương hưu dự kiến nhận tương đương mức tham gia 厚生年金 30 năm (thiếu có thể bù bằng tài sản tài chính); (3) tiếng Nhật tương đương CEFR B1; (4) diện vợ/chồng người Nhật/Vĩnh trú nâng lên 5 năm hôn nhân + 3 năm ở Nhật (các nội dung ngoài thu nhập dự kiến từ 04/2027). ĐÂY LÀ DỰ THẢO, CHƯA PHẢI QUY ĐỊNH CHÍNH THỨC.',
  content_en: 'The draft (published 4 Aug 2026; public comment closed 4 Sep 2026) proposes: (1) household income above the average Japanese household income for the household size (income element planned from Oct 2026); (2) expected pension equivalent to 30 years of Employees\' Pension (shortfall may be covered by financial assets); (3) Japanese at CEFR B1; (4) spouse route extended to 5 years of marriage + 3 years in Japan (non-income items planned from Apr 2027). This is a draft, not final.',
});

/**
 * Lệ phí cấp phép Vĩnh trú (永住許可) — đọc từ bảng phí dùng chung.
 * - Hồ sơ TIẾP NHẬN đến 30/09/2026: 10.000 JPY (kể cả khi được cấp phép sau 01/10/2026).
 * - Hồ sơ tiếp nhận từ 01/10/2026: 200.000 JPY (có thể giảm còn 20.000 JPY nếu thuộc diện khó khăn, chỉ tại quầy).
 * Vĩnh trú chỉ nộp tại quầy (窓口). Nộp phí bằng tem 収入印紙 khi được cấp phép.
 * @param {string|Date} [applicationDate]
 */
export function getPermanentResidenceFeeSchedule(applicationDate) {
  const fee = getResidencePermitFee({ procedure: 'permanent', acceptanceDate: applicationDate, method: 'counter' });
  const isPost = fee.regime === 'post-2026-10';
  return {
    ...fee,
    applicationFee: 0, // Nộp hồ sơ miễn phí
    grantFee: fee.amount, // Lệ phí khi được cấp phép
    paymentMethod: '収入印紙 (Revenue Stamp)',
    condition_ja: '永住許可の決定を受け、新しい在留カードを受領する際のみ納付（不許可の場合は0円）。',
    condition_vn: 'Chỉ nộp khi được cấp phép Vĩnh trú và nhận thẻ mới (bị từ chối: 0 JPY).',
    condition_en: 'Payable only upon grant of permanent residence (0 JPY if denied).',
    statutoryBasis: fee.legalBasis,
    note: isPost
      ? '2026年10月1日以降に受付された申請：永住許可手数料は200,000円です（減額対象者は20,000円、窓口申請のみ）。'
      : '2026年9月30日までに受付された申請：許可が10月1日以降でも手数料は10,000円です（10月1日以降の受付分は200,000円）。',
    note_vn: isPost
      ? 'Hồ sơ tiếp nhận từ 01/10/2026: lệ phí Vĩnh trú là 200.000 yên (diện khó khăn được giảm còn 20.000 yên, chỉ khi nộp tại quầy).'
      : 'Hồ sơ được tiếp nhận đến hết 30/09/2026: lệ phí 10.000 yên kể cả khi có kết quả sau 01/10/2026. Hồ sơ tiếp nhận từ 01/10/2026: 200.000 yên.',
  };
}

/**
 * Cơ chế hủy tư cách Vĩnh trú (改正入管法 2024) — có hiệu lực từ 01/04/2027.
 * Trên thực tế ISA cho biết thường sẽ chuyển sang tư cách khác (thường là 定住者) theo thẩm quyền,
 * không phải trục xuất; sơ suất nhỏ, vô ý không phải là đối tượng.
 */
export const PR_2026_REFORM_CONTEXT = {
  effectiveFrom: '2027-04-01',
  title_ja: '【法改正情報】永住許可の取消し制度（2024年改正入管法・2027年4月1日施行）',
  title_vn: '【Thông tin cải cách pháp luật】Cơ chế hủy tư cách Vĩnh trú (Luật sửa đổi 2024, hiệu lực từ 01/04/2027)',
  title_en: '【Legal Reform】Revocation of Permanent Residence (2024 amendment, effective 1 Apr 2027)',
  content_ja: '2024年改正入管法により、2027年4月1日から、永住者が故意に公租公課（税金・社会保険料等）の支払をしない場合や一定の刑罰法令違反等の場合に、永住許可を取り消すことができるようになります。取り消す場合でも、原則として職権で他の在留資格（多くは「定住者」）への変更が行われ、直ちに退去強制となるものではありません。うっかりした一時的な遅れなど軽微なものは対象とされていません。永住許可後も納税等の義務を継続して履行してください。',
  content_vn: 'Theo Luật Nhập cảnh sửa đổi năm 2024, từ ngày 01/04/2027, nếu người Vĩnh trú CỐ Ý không nộp thuế / phí bảo hiểm xã hội, hoặc vi phạm một số tội hình sự nhất định, tư cách Vĩnh trú có thể bị hủy. Ngay cả khi bị hủy, về nguyên tắc Cục XNC sẽ chuyển sang một tư cách lưu trú khác theo thẩm quyền (thường là 定住者 – Định trú), không phải trục xuất ngay. Sơ suất nhỏ, chậm nộp tạm thời do vô ý không phải là đối tượng. Sau khi có Vĩnh trú vẫn cần tiếp tục nộp thuế, bảo hiểm đầy đủ.',
  content_en: 'Under the 2024 amendment, from 1 Apr 2027 permanent residence may be revoked if the holder intentionally fails to pay taxes or social insurance, or commits certain crimes. Even then, the status is in principle changed ex officio to another status (usually Long-Term Resident) rather than deportation; minor, inadvertent slips are not targeted. Keep meeting tax and insurance obligations after obtaining PR.',
};
