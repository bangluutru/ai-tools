/**
 * @file packages/core/src/japan/employment/engines/overtimeEngine.js
 * @description Engine tính toán tiền làm thêm giờ (割増賃金シミュレーション) theo chuẩn pháp luật Nhật Bản.
 * Tuân thủ Điều 37 Luật Tiêu chuẩn Lao động (労働基準法第37条) & Thông tri hướng dẫn của MHLW.
 */

import {
  OVERTIME_RULES_METADATA,
  STATUTORY_PREMIUM_RATES,
} from '../rules/overtimeRates.js';
import { getSource } from '../../../regulatory/sourceRegistry.js';

/**
 * Tính mức lương giờ làm cơ sở tính phụ trội (割増賃金の基礎となる1時間当たりの賃金).
 * @param {Object} params
 * @param {'monthly' | 'daily' | 'hourly'} [params.wageType='monthly'] - Hình thức trả lương
 * @param {number} params.baseWage - Mức lương cơ sở (Lương tháng / Lương ngày / Lương giờ)
 * @param {number} [params.excludedAllowances=0] - Tổng các khoản phụ cấp loại trừ theo luật (7 khoản)
 * @param {number} [params.averageMonthlyHours] - Số giờ làm việc quy định bình quân 1 tháng
 * @param {number} [params.annualScheduledDays] - Số ngày làm việc quy định trong năm
 * @param {number} [params.dailyScheduledHours] - Số giờ làm việc quy định 1 ngày
 * @returns {{ baseHourlyWage: number, calculatedPrescribedHours: number, isEstimatedHours: boolean }}
 */
export function calculateBaseHourlyWage(params = {}) {
  const {
    wageType = 'monthly',
    baseWage = 0,
    excludedAllowances = 0,
    averageMonthlyHours,
    annualScheduledDays,
    dailyScheduledHours,
  } = params;

  // Tiền lương tính căn cứ = Lương cơ bản và các phụ cấp hợp lệ - Phụ cấp loại trừ luật định
  const eligibleWage = Math.max(0, Number(baseWage) - Math.max(0, Number(excludedAllowances)));

  if (wageType === 'hourly') {
    return {
      baseHourlyWage: eligibleWage,
      calculatedPrescribedHours: 1,
      isEstimatedHours: false,
    };
  }

  if (wageType === 'daily') {
    const dailyHours = Number(dailyScheduledHours) > 0 ? Number(dailyScheduledHours) : 8;
    return {
      baseHourlyWage: Math.round(eligibleWage / dailyHours),
      calculatedPrescribedHours: dailyHours,
      isEstimatedHours: !dailyScheduledHours,
    };
  }

  // Trường hợp lương tháng (monthly)
  let prescribedHours = 0;
  let isEstimated = false;

  if (Number(averageMonthlyHours) > 0) {
    prescribedHours = Number(averageMonthlyHours);
  } else if (Number(annualScheduledDays) > 0 && Number(dailyScheduledHours) > 0) {
    // Công thức chuẩn: (Số ngày làm việc trong năm * Số giờ làm việc 1 ngày) / 12 tháng
    prescribedHours = (Number(annualScheduledDays) * Number(dailyScheduledHours)) / 12;
  } else {
    // Ước tính chuẩn thông lệ thị trường Nhật (40h/tuần * 52 tuần / 12 tháng = 173.3h, hoặc chuẩn 20 ngày * 8h = 160h)
    prescribedHours = 160;
    isEstimated = true;
  }

  const baseHourlyWage = prescribedHours > 0 ? Math.round(eligibleWage / prescribedHours) : 0;

  return {
    baseHourlyWage,
    calculatedPrescribedHours: Math.round(prescribedHours * 10) / 10,
    isEstimatedHours: isEstimated,
  };
}

/**
 * Tính toán chi tiết tiền làm thêm giờ theo các loại hình lao động.
 * @param {Object} input
 * @param {'monthly' | 'daily' | 'hourly'} [input.wageType='monthly']
 * @param {number} input.baseWage - Mức lương (tháng / ngày / giờ)
 * @param {number} [input.excludedAllowances=0] - Phụ cấp loại trừ (đi lại, gia đình, nhà ở...)
 * @param {number} [input.averageMonthlyHours] - Số giờ làm việc quy định/tháng
 * @param {number} [input.annualScheduledDays] - Số ngày làm việc quy định/năm
 * @param {number} [input.dailyScheduledHours] - Số giờ làm việc quy định/ngày
 * @param {number} [input.normalOvertimeHours=0] - Giờ làm thêm ngoài giờ bình thường (<= 60h)
 * @param {number} [input.overtimeAbove60h=0] - Giờ làm thêm ngoài giờ vượt 60h/tháng
 * @param {number} [input.lateNightHours=0] - Giờ làm việc ban đêm (22h - 5h)
 * @param {number} [input.statutoryHolidayHours=0] - Giờ làm việc vào ngày nghỉ luật định
 * @param {number} [input.holidayLateNightHours=0] - Giờ làm việc vào ngày nghỉ luật định + đêm
 * @returns {Object} Kết quả tính toán phân bổ chi tiết
 */
export function calculateOvertimePay(input = {}) {
  const {
    normalOvertimeHours = 0,
    overtimeAbove60h = 0,
    lateNightHours = 0,
    statutoryHolidayHours = 0,
    holidayLateNightHours = 0,
  } = input;

  const {
    baseHourlyWage,
    calculatedPrescribedHours,
    isEstimatedHours,
  } = calculateBaseHourlyWage(input);

  const nHours = Math.max(0, Number(normalOvertimeHours));
  const above60Hours = Math.max(0, Number(overtimeAbove60h));
  const nightHours = Math.max(0, Number(lateNightHours));
  const holHours = Math.max(0, Number(statutoryHolidayHours));
  const holNightHours = Math.max(0, Number(holidayLateNightHours));

  // 1. Làm thêm giờ thông thường (1.25x: gồm 1.0x lương cơ bản cho giờ làm việc + 0.25x tiền phụ trội)
  const normalRate = STATUTORY_PREMIUM_RATES.normalOvertime;
  const normalPay = Math.round(baseHourlyWage * normalRate.multiplier * nHours);
  const normalPremiumOnly = Math.round(baseHourlyWage * normalRate.rate * nHours);

  // 2. Làm thêm giờ vượt 60h/tháng (1.50x: gồm 1.0x + 0.50x)
  const above60Rate = STATUTORY_PREMIUM_RATES.overtimeAbove60h;
  const above60Pay = Math.round(baseHourlyWage * above60Rate.multiplier * above60Hours);
  const above60PremiumOnly = Math.round(baseHourlyWage * above60Rate.rate * above60Hours);

  // 3. Làm đêm riêng biệt (Phụ trội thêm +0.25x)
  const lateNightRate = STATUTORY_PREMIUM_RATES.lateNight;
  const lateNightPremiumOnly = Math.round(baseHourlyWage * lateNightRate.rate * nightHours);

  // 4. Ngày nghỉ luật định (1.35x: gồm 1.0x + 0.35x)
  const holidayRate = STATUTORY_PREMIUM_RATES.statutoryHoliday;
  const holidayPay = Math.round(baseHourlyWage * holidayRate.multiplier * holHours);
  const holidayPremiumOnly = Math.round(baseHourlyWage * holidayRate.rate * holHours);

  // 5. Ngày nghỉ luật định + Ban đêm (1.60x: gồm 1.0x + 0.60x)
  const holNightRate = STATUTORY_PREMIUM_RATES.holidayAndLateNight;
  const holNightPay = Math.round(baseHourlyWage * holNightRate.multiplier * holNightHours);
  const holNightPremiumOnly = Math.round(baseHourlyWage * holNightRate.rate * holNightHours);

  // Tổng tiền làm thêm giờ (Total Overtime Earnings)
  const totalOvertimePay = normalPay + above60Pay + lateNightPremiumOnly + holidayPay + holNightPay;
  const totalPremiumOnly = normalPremiumOnly + above60PremiumOnly + lateNightPremiumOnly + holidayPremiumOnly + holNightPremiumOnly;
  const totalOvertimeHours = nHours + above60Hours + holHours + holNightHours;

  const sources = [
    getSource(OVERTIME_RULES_METADATA.sourceId),
    getSource(OVERTIME_RULES_METADATA.secondarySourceId),
  ].filter(Boolean);

  return {
    baseHourlyWage,
    calculatedPrescribedHours,
    isEstimatedHours,
    totalOvertimeHours,
    totalOvertimePay,
    totalPremiumOnly,
    breakdown: {
      normalOvertime: {
        hours: nHours,
        rate: normalRate.rate,
        multiplier: normalRate.multiplier,
        premiumOnly: normalPremiumOnly,
        totalPay: normalPay,
        labelJa: normalRate.labelJa,
        labelVn: normalRate.labelVn,
      },
      overtimeAbove60h: {
        hours: above60Hours,
        rate: above60Rate.rate,
        multiplier: above60Rate.multiplier,
        premiumOnly: above60PremiumOnly,
        totalPay: above60Pay,
        labelJa: above60Rate.labelJa,
        labelVn: above60Rate.labelVn,
      },
      lateNight: {
        hours: nightHours,
        rate: lateNightRate.rate,
        multiplier: lateNightRate.multiplier,
        premiumOnly: lateNightPremiumOnly,
        totalPay: lateNightPremiumOnly,
        labelJa: lateNightRate.labelJa,
        labelVn: lateNightRate.labelVn,
      },
      statutoryHoliday: {
        hours: holHours,
        rate: holidayRate.rate,
        multiplier: holidayRate.multiplier,
        premiumOnly: holidayPremiumOnly,
        totalPay: holidayPay,
        labelJa: holidayRate.labelJa,
        labelVn: holidayRate.labelVn,
      },
      holidayLateNight: {
        hours: holNightHours,
        rate: holNightRate.rate,
        multiplier: holNightRate.multiplier,
        premiumOnly: holNightPremiumOnly,
        totalPay: holNightPay,
        labelJa: holNightRate.labelJa,
        labelVn: holNightRate.labelVn,
      },
    },
    metadata: OVERTIME_RULES_METADATA,
    sources,
  };
}
