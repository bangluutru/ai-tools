/**
 * @file packages/core/src/japan/employment/rules/paidLeaveTables.js
 * @description
 * Statutory Paid Leave Rules & Tables (年次有給休暇の付与基準・比例付与・年5日取得義務)
 * In accordance with:
 * - 労働基準法 第39条 (Labor Standards Act Art. 39)
 * - 労働基準法 第115条 (時効 - 2 years statute of limitations)
 * - 厚生労働省 年次有給休暇取得促進特設サイト・ガイドライン
 */

/**
 * Danh sách nguồn quy chuẩn chính thức
 */
export const PAID_LEAVE_SOURCES = [
  'mhlw-paid-leave-guidelines',
  'egov-labor-standards-act-39'
];

/**
 * Tỷ lệ chuyên cần tối thiểu luật định để được cấp phép năm (80%)
 */
export const MINIMUM_ATTENDANCE_RATE = 0.8;

/**
 * Ngưỡng số ngày phép cấp mới phát sinh nghĩa vụ bắt buộc nghỉ 5 ngày (年5日取得義務)
 */
export const MANDATORY_LEAVE_THRESHOLD_DAYS = 10;

/**
 * Số ngày bắt buộc nghỉ trong 1 năm nếu được cấp từ 10 ngày trở lên
 */
export const MANDATORY_LEAVE_DAYS = 5;

/**
 * Thời hiệu tiêu diệt quyền nghỉ phép (2 năm kể từ ngày phát sinh quyền)
 */
export const STATUTE_OF_LIMITATIONS_YEARS = 2;

/**
 * Bảng cấp phép năm cho người lao động thông thường / toàn thời gian (一般労働者)
 * Điều kiện: Làm từ 30h/tuần trở lên HOẶC từ 5 ngày/tuần trở lên (hoặc >= 217 ngày/năm)
 */
export const FULL_TIME_PAID_LEAVE_TABLE = [
  { serviceMonths: 6, yearsDisplay: '0.5年 (6ヶ月)', grantDays: 10 },
  { serviceMonths: 18, yearsDisplay: '1.5年 (1年6ヶ月)', grantDays: 11 },
  { serviceMonths: 30, yearsDisplay: '2.5年 (2年6ヶ月)', grantDays: 12 },
  { serviceMonths: 42, yearsDisplay: '3.5年 (3年6ヶ月)', grantDays: 14 },
  { serviceMonths: 54, yearsDisplay: '4.5年 (4年6ヶ月)', grantDays: 16 },
  { serviceMonths: 66, yearsDisplay: '5.5年 (5年6ヶ月)', grantDays: 18 },
  { serviceMonths: 78, yearsDisplay: '6.5年以上', grantDays: 20 }
];

/**
 * Bảng cấp phép năm theo tỷ lệ cho người lao động part-time / thời gian ngắn (比例付与対象者)
 * Điều kiện: Dưới 30h/tuần VÀ từ 4 ngày/tuần trở xuống (hoặc <= 216 ngày/năm)
 */
export const PART_TIME_PROPORTIONAL_TABLE = [
  {
    weeklyDays: 4,
    annualDaysRange: { min: 169, max: 216 },
    grants: [
      { serviceMonths: 6, grantDays: 7 },
      { serviceMonths: 18, grantDays: 8 },
      { serviceMonths: 30, grantDays: 9 },
      { serviceMonths: 42, grantDays: 10 },
      { serviceMonths: 54, grantDays: 12 },
      { serviceMonths: 66, grantDays: 13 },
      { serviceMonths: 78, grantDays: 15 }
    ]
  },
  {
    weeklyDays: 3,
    annualDaysRange: { min: 121, max: 168 },
    grants: [
      { serviceMonths: 6, grantDays: 5 },
      { serviceMonths: 18, grantDays: 6 },
      { serviceMonths: 30, grantDays: 6 },
      { serviceMonths: 42, grantDays: 8 },
      { serviceMonths: 54, grantDays: 9 },
      { serviceMonths: 66, grantDays: 10 },
      { serviceMonths: 78, grantDays: 11 }
    ]
  },
  {
    weeklyDays: 2,
    annualDaysRange: { min: 73, max: 120 },
    grants: [
      { serviceMonths: 6, grantDays: 3 },
      { serviceMonths: 18, grantDays: 4 },
      { serviceMonths: 30, grantDays: 4 },
      { serviceMonths: 42, grantDays: 5 },
      { serviceMonths: 54, grantDays: 6 },
      { serviceMonths: 66, grantDays: 6 },
      { serviceMonths: 78, grantDays: 7 }
    ]
  },
  {
    weeklyDays: 1,
    annualDaysRange: { min: 48, max: 72 },
    grants: [
      { serviceMonths: 6, grantDays: 1 },
      { serviceMonths: 18, grantDays: 2 },
      { serviceMonths: 30, grantDays: 2 },
      { serviceMonths: 42, grantDays: 2 },
      { serviceMonths: 54, grantDays: 3 },
      { serviceMonths: 66, grantDays: 3 },
      { serviceMonths: 78, grantDays: 3 }
    ]
  }
];
