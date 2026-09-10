/**
 * @file packages/core/src/japan/employment/rules/overtimeRates.js
 * @description Biểu tỷ lệ phụ trội làm thêm giờ (割増賃金率) theo Điều 37 Luật Tiêu chuẩn Lao động Nhật Bản (労働基準法第37条).
 * Nguồn chính thống: 厚生労働省 (MHLW) & e-Gov 法令検索.
 */

import { createApplicablePeriod } from '../../../regulatory/effectivePeriod.js';

export const OVERTIME_RULES_METADATA = Object.freeze({
  ruleId: 'jp-overtime-rates-std',
  sourceId: 'mhlw-overtime-rates-notice',
  secondarySourceId: 'egov-labor-standards-act-37',
  effectiveFrom: '2023-04-01',
  effectiveTo: '2099-12-31',
  applicablePeriod: createApplicablePeriod('effective-date-range', '2023-04-01', '2099-12-31'),
  lastVerifiedAt: '2026-09-10',
});

/**
 * Biểu tỷ lệ phụ trội luật định tối thiểu (法定最低割増率).
 * Lưu ý: Tỷ lệ phụ trội được cộng thêm vào mức lương 100% cơ bản.
 * Ví dụ: 25% phụ trội nghĩa là người lao động nhận 125% lương giờ.
 */
export const STATUTORY_PREMIUM_RATES = Object.freeze({
  /** Làm thêm giờ theo luật thông thường (trong hạn mức 60h/tháng) */
  normalOvertime: {
    rate: 0.25,
    multiplier: 1.25,
    labelJa: '時間外労働（月60時間以下）',
    labelVn: 'Làm thêm giờ thông thường (dưới 60h/tháng)',
    labelEn: 'Standard Overtime (<= 60h/mo)',
    lawReference: '労働基準法第37条第1項',
  },

  /** Làm thêm giờ vượt 60 giờ/tháng (Áp dụng bắt buộc cả DN vừa & nhỏ từ 01/04/2023) */
  overtimeAbove60h: {
    rate: 0.50,
    multiplier: 1.50,
    labelJa: '月60時間を超える時間外労働',
    labelVn: 'Làm thêm giờ vượt 60h/tháng',
    labelEn: 'Overtime Exceeding 60h/mo',
    lawReference: '労働基準法第37条第1項但書',
  },

  /** Làm việc vào ban đêm (22:00 đến 05:00 sáng hôm sau) */
  lateNight: {
    rate: 0.25,
    multiplier: 1.25,
    labelJa: '深夜労働（22時〜翌朝5時）',
    labelVn: 'Làm việc ban đêm (22h - 5h sáng)',
    labelEn: 'Late-Night Work (22:00 - 05:00)',
    lawReference: '労働基準法第37条第4項',
  },

  /** Làm việc vào ngày nghỉ theo luật định (法定休日労働 - tối thiểu 1 ngày/tuần hoặc 4 ngày/4 tuần) */
  statutoryHoliday: {
    rate: 0.35,
    multiplier: 1.35,
    labelJa: '法定休日労働',
    labelVn: 'Làm việc vào ngày nghỉ luật định',
    labelEn: 'Statutory Holiday Work',
    lawReference: '労働基準法第37条第1項',
  },

  /** Tổ hợp: Làm thêm giờ thông thường + Làm đêm (25% + 25% = 50%) */
  overtimeAndLateNight: {
    rate: 0.50,
    multiplier: 1.50,
    labelJa: '時間外労働 ＋ 深夜労働',
    labelVn: 'Làm thêm giờ + Làm ban đêm',
    labelEn: 'Standard Overtime + Late-Night',
  },

  /** Tổ hợp: Làm thêm giờ vượt 60h + Làm đêm (50% + 25% = 75%) */
  overtime60hAndLateNight: {
    rate: 0.75,
    multiplier: 1.75,
    labelJa: '月60時間超 ＋ 深夜労働',
    labelVn: 'Làm thêm vượt 60h + Làm ban đêm',
    labelEn: 'Overtime >60h + Late-Night',
  },

  /** Tổ hợp: Ngày nghỉ luật định + Làm đêm (35% + 25% = 60%) */
  holidayAndLateNight: {
    rate: 0.60,
    multiplier: 1.60,
    labelJa: '法定休日 ＋ 深夜労働',
    labelVn: 'Ngày nghỉ luật định + Làm ban đêm',
    labelEn: 'Statutory Holiday + Late-Night',
  },
});

/**
 * 7 khoản phụ cấp LUẬT ĐỊNH BỊ LOẠI TRỪ khỏi cơ sở tính lương giờ làm thêm (除外賃金 - 労働基準法施行規則第21条).
 * Tất cả các khoản phụ cấp khác (chức vụ, chuyên cần, bằng cấp...) BẮT BUỘC PHẢI TÍNH vào cơ sở tính lương giờ.
 */
export const STATUTORY_EXCLUDED_ALLOWANCES = Object.freeze([
  {
    id: 'family',
    nameJa: '家族手当（扶養手当）',
    nameVn: 'Phụ cấp gia đình / người phụ thuộc',
    nameEn: 'Family / Dependent Allowance',
    conditionJa: '扶養家族の人数等に応じて支給されるもの',
    conditionVn: 'Phụ cấp cấp theo số lượng người phụ thuộc thực tế',
  },
  {
    id: 'commute',
    nameJa: '通勤手当',
    nameVn: 'Phụ cấp đi lại',
    nameEn: 'Commuter Allowance',
    conditionJa: '通勤に要する実費や距離に応じて支給されるもの',
    conditionVn: 'Khoản chi trả theo chi phí thực tế hoặc khoảng cách đi lại',
  },
  {
    id: 'separation',
    nameJa: '別居手当（単身赴任手当）',
    nameVn: 'Phụ cấp công tác xa nhà / sống riêng',
    nameEn: 'Separation / Unaccompanied Posting Allowance',
    conditionJa: '単身赴任等で別居生活を送るための追加費用補填',
    conditionVn: 'Bù đắp chi phí do phải sống riêng phục vụ công việc',
  },
  {
    id: 'education',
    nameJa: '子女教育手当',
    nameVn: 'Phụ cấp giáo dục con cái',
    nameEn: 'Child Education Allowance',
    conditionJa: '子どもの教育費等を補填するもの',
    conditionVn: 'Khoản hỗ trợ học phí, giáo dục cho con',
  },
  {
    id: 'housing',
    nameJa: '住宅手当',
    nameVn: 'Phụ cấp nhà ở (theo chi phí thực tế)',
    nameEn: 'Housing Allowance (expense-linked)',
    conditionJa: '賃貸料や住宅費用に定率または実費で連動するもの（一律支給は除外不可）',
    conditionVn: 'Chỉ được loại trừ khi phụ cấp tính theo chi phí thực tế thuê nhà; nếu công ty cấp một khoản tiền cố định ngang nhau cho mọi nhân viên thì KHÔNG được loại trừ',
  },
  {
    id: 'temporary',
    nameJa: '臨時に支払われた賃金',
    nameVn: 'Khoản tiền trả tạm thời, bất thường',
    nameEn: 'Extraordinary / Temporary Payments',
    conditionJa: '結婚祝金、弔慰金、退職手当など',
    conditionVn: 'Tiền mừng cưới, phúng viếng, trợ cấp thôi việc một lần',
  },
  {
    id: 'bonus',
    nameJa: '1か月を超える期間ごとに支払われる賃金（賞与等）',
    nameVn: 'Tiền thưởng định kỳ trên 1 tháng (Bonus)',
    nameEn: 'Bonuses (Paid at intervals > 1 month)',
    conditionJa: '賞与・決算賞与など',
    conditionVn: 'Tiền thưởng vụ hè, thưởng đông, thưởng kết toán',
  },
]);
