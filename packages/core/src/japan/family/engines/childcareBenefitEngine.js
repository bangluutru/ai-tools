/**
 * @file packages/core/src/japan/family/engines/childcareBenefitEngine.js
 * @description
 * Công cụ tính toán Trợ cấp Nghỉ chăm con Nhật Bản (育児休業給付金シミュレーター Engine).
 * Căn cứ Điều 61-7 đến Điều 61-10 Luật Bảo hiểm Thất nghiệp (雇用保険法) và biểu mức MHLW.
 */

import {
  CHILDCARE_BENEFIT_CONSTANTS,
  CHILDCARE_BENEFIT_PERIODS,
  CHILDCARE_BENEFIT_SOURCES,
} from '../rules/childcareBenefitRules.js';
import { isValidISODate, todayLocalISO } from '../../employment/localDate.js';

/**
 * Chọn kỳ mức trần/sàn MHLW theo ngày (đổi ngày 1/8 hàng năm).
 * Ngày trước 01/08/2025 dùng kỳ cũ nhất đang lưu (Reiwa 7).
 * @param {string} [date] - YYYY-MM-DD (mặc định: hôm nay theo lịch địa phương)
 * @returns {Object}
 */
export function resolveChildcareBenefitPeriod(date) {
  const d = isValidISODate(date) ? date : todayLocalISO();
  if (d >= CHILDCARE_BENEFIT_PERIODS.PERIOD_2026_08.startDate) return CHILDCARE_BENEFIT_PERIODS.PERIOD_2026_08;
  return CHILDCARE_BENEFIT_PERIODS.PERIOD_2025_08;
}

/**
 * Tiền trợ cấp của một 支給単位期間 có `days` ngày, có xét lương công ty trả (雇用保険法第61条の7第5項).
 * Dùng số nguyên (%) để tránh sai số dấu phẩy động; 1円未満切捨て.
 * @param {number} wageDaily - 休業開始時賃金日額 (đã kẹp trần/sàn)
 * @param {number} days - số ngày của kỳ
 * @param {number} ratePercent - 67 | 50
 * @param {number} wagePaid - lương công ty trả trong kỳ
 * @returns {{ amount: number, standard: number, offsetApplied: boolean, fullOffset: boolean }}
 */
function computePeriodBenefit(wageDaily, days, ratePercent, wagePaid) {
  const base = wageDaily * days; // 賃金日額 × 支給日数
  const standard = Math.floor((base * ratePercent) / 100);
  if (wagePaid <= 0) return { amount: standard, standard, offsetApplied: false, fullOffset: false };
  const ceiling80 = Math.floor((base * 80) / 100);
  if (wagePaid >= ceiling80) return { amount: 0, standard, offsetApplied: true, fullOffset: true };
  // Lương <= (80% − tỷ lệ) → không giảm (13% cho kỳ 67%, 30% cho kỳ 50%)
  if (wagePaid * 100 <= base * (80 - ratePercent)) {
    return { amount: standard, standard, offsetApplied: false, fullOffset: false };
  }
  return { amount: Math.min(standard, ceiling80 - wagePaid), standard, offsetApplied: true, fullOffset: false };
}

/**
 * Tổng trợ cấp cho `totalDays` ngày, chia thành các kỳ 30 ngày (kỳ cuối có thể ngắn hơn).
 * @param {number} wageDaily
 * @param {number} totalDays
 * @param {number} ratePercent
 * @param {number} monthlySalaryDuringLeave - lương công ty trả mỗi 30 ngày
 * @returns {{ total: number, fullPeriodAmount: number, offsetApplied: boolean, fullOffset: boolean }}
 */
function computeTierTotal(wageDaily, totalDays, ratePercent, monthlySalaryDuringLeave) {
  let remaining = totalDays;
  let total = 0;
  let offsetApplied = false;
  let fullOffset = false;
  const full = computePeriodBenefit(wageDaily, 30, ratePercent, monthlySalaryDuringLeave);
  while (remaining > 0) {
    const d = Math.min(30, remaining);
    const paid = d === 30 ? monthlySalaryDuringLeave : Math.floor((monthlySalaryDuringLeave * d) / 30);
    const r = d === 30 ? full : computePeriodBenefit(wageDaily, d, ratePercent, paid);
    total += r.amount;
    offsetApplied = offsetApplied || r.offsetApplied;
    fullOffset = fullOffset || r.fullOffset;
    remaining -= d;
  }
  if (totalDays > 0 && full.offsetApplied) offsetApplied = true;
  if (totalDays > 0 && full.fullOffset) fullOffset = true;
  return { total, fullPeriodAmount: full.amount, offsetApplied, fullOffset };
}

/**
 * Tính 育児時短就業給付 cho một tháng (育児時短就業給付, từ 04/2025).
 * - Lương thực trả ≤ 90% 時短就業開始時賃金月額: 10% × lương thực trả.
 * - 90% < lương < 100%: tỷ lệ giảm dần: lương × {90 × 賃金月額 ÷ lương − 90} ÷ 100 (= 0.9 × (賃金月額 − lương)).
 * - Lương ≥ 100% hoặc ≥ 支給限度額: 0. Lương + trợ cấp > 限度額 → trợ cấp = 限度額 − lương.
 * - Trợ cấp tính ra ≤ 最低限度額 → không chi trả.
 * @param {Object} params
 * @param {number} params.preShortTimeMonthlyWage - 時短就業開始時賃金月額 (đã kẹp trần/sàn)
 * @param {number} params.paidWage - Lương thực trả trong tháng làm giờ ngắn
 * @param {Object} params.period - Kỳ MHLW
 * @returns {number}
 */
export function calculateShortTimeWorkMonthlyBenefit({ preShortTimeMonthlyWage, paidWage, period }) {
  const pre = Math.max(0, Math.floor(Number(preShortTimeMonthlyWage) || 0));
  const wage = Math.max(0, Math.floor(Number(paidWage) || 0));
  if (pre <= 0 || wage >= pre || wage >= period.SHORT_TIME_PAYMENT_LIMIT) return 0;
  let benefit;
  if (wage * 100 <= pre * 90) {
    benefit = Math.floor(wage / 10);
  } else {
    benefit = Math.floor((90 * (pre - wage)) / 100);
  }
  if (wage + benefit > period.SHORT_TIME_PAYMENT_LIMIT) {
    benefit = period.SHORT_TIME_PAYMENT_LIMIT - wage;
  }
  if (benefit <= period.SHORT_TIME_MIN_BENEFIT) return 0;
  return benefit;
}

/**
 * Tính toán số tiền Trợ cấp Nghỉ chăm con, Thưởng hỗ trợ sau sinh và Trợ cấp rút ngắn giờ
 * @param {Object} params
 * @param {number} [params.monthlySalary=300000] - Tiền lương tháng bình quân trước khi nghỉ (Gross salary)
 * @param {number} [params.sixMonthsTotalWage=0] - Tổng tiền lương 6 tháng trước nghỉ (nếu có chi tiết)
 * @param {number} [params.plannedLeaveDays=300] - Tổng số ngày dự kiến nghỉ chăm con
 * @param {boolean} [params.qualifiesForPostBirthBonus=false] - Đủ điều kiện nhận Thưởng hỗ trợ sau sinh 13%
 * @param {number} [params.postBirthBonusDays=28] - Số ngày áp dụng mức thưởng 13% (tối đa 28 ngày)
 * @param {number} [params.monthlySalaryDuringLeave=0] - Tiền lương công ty vẫn trả mỗi tháng trong thời gian nghỉ
 * @param {boolean} [params.isDaycareRejected=false] - Trượt nhà trẻ công lập (để gia hạn sau 1 tuổi)
 * @param {boolean} [params.isShortTimeWork=false] - Có đi làm lại và rút ngắn giờ nuôi con dưới 2 tuổi (từ 04/2025)
 * @param {number} [params.shortTimeMonths=6] - Số tháng làm việc rút ngắn giờ dự kiến
 * @param {number} [params.shortTimeMonthlyWage] - Lương THỰC NHẬN mỗi tháng khi làm giờ ngắn
 *   (nếu không nhập: GIẢ ĐỊNH = 80% lương trước khi nghỉ, trả về cờ isShortTimeWageAssumed)
 * @param {string} [params.leaveStartDate] - Ngày bắt đầu nghỉ (YYYY-MM-DD) để chọn kỳ mức trần/sàn (mặc định: hôm nay)
 * @returns {Object}
 */
export function calculateChildcareBenefit({
  monthlySalary = 300000,
  sixMonthsTotalWage = 0,
  plannedLeaveDays = 300,
  qualifiesForPostBirthBonus = false,
  postBirthBonusDays = 28,
  monthlySalaryDuringLeave = 0,
  isDaycareRejected = false,
  isShortTimeWork = false,
  shortTimeMonths = 6,
  shortTimeMonthlyWage,
  leaveStartDate,
} = {}) {
  const { RATES, PERIOD_DAYS } = CHILDCARE_BENEFIT_CONSTANTS;
  const period = resolveChildcareBenefitPeriod(leaveStartDate);

  const validMonthlySalary = Math.max(0, Number(monthlySalary) || 0);
  const total6MWage = sixMonthsTotalWage > 0 ? Number(sixMonthsTotalWage) : validMonthlySalary * 6;
  const totalLeaveDays = Math.max(0, Math.min(730, Math.floor(Number(plannedLeaveDays) || 0))); // Tối đa 2 năm = 730 ngày
  const validSalaryDuringLeave = Math.max(0, Math.floor(Number(monthlySalaryDuringLeave) || 0));

  // 1. TÍNH MỨC TIỀN LƯƠNG NGÀY BẮT ĐẦU NGHỈ (休業開始時賃金日額)
  // Công thức luật định: Tổng tiền lương 6 tháng trước khi nghỉ ÷ 180 ngày (1円未満切捨て)
  const rawDailyWage = total6MWage / 180;
  const flooredDailyWage = Math.floor(rawDailyWage);

  // Áp dụng trần và sàn MHLW của kỳ tương ứng
  const isCappedByMaxLimit = flooredDailyWage > period.MAX_DAILY_WAGE;
  const isFlooredByMinLimit = flooredDailyWage < period.MIN_DAILY_WAGE;

  let wageDailyBasis = flooredDailyWage;
  if (isCappedByMaxLimit) {
    wageDailyBasis = period.MAX_DAILY_WAGE;
  } else if (isFlooredByMinLimit) {
    wageDailyBasis = period.MIN_DAILY_WAGE;
  }

  // 2. PHÂN BỔ SỐ NGÀY THEO TỪNG GIAI ĐOẠN LUẬT ĐỊNH
  // Giai đoạn 1: 180 ngày đầu tiên (mức 67%)
  const tier1Days = Math.min(totalLeaveDays, PERIOD_DAYS.INITIAL_67_MAX_DAYS);
  // Giai đoạn 2: Từ ngày 181 trở đi (mức 50%)
  const tier2Days = Math.max(0, totalLeaveDays - PERIOD_DAYS.INITIAL_67_MAX_DAYS);

  // Mức trợ cấp ngày tham khảo (1円未満切捨て). Vì wageDailyBasis đã bị kẹp trần nên
  // mức ngày × 30 luôn ≤ trần tháng công bố (VD 16,540 × 30 × 67% = 332,454円).
  const tier1StandardDaily = Math.floor((wageDailyBasis * 67) / 100);
  const tier2StandardDaily = Math.floor((wageDailyBasis * 50) / 100);

  // 3. XÉT THƯỞNG HỖ TRỢ NGHỈ SAU SINH (+13% ĐẠT 80% LƯƠNG NGÀY)
  // Căn cứ: 出生後休業支援給付金 (2025年4月新設), trần 28 ngày = 賃金日額上限 × 28 × 13%
  let bonusDays = 0;
  let bonusDailyAmount = 0;
  let bonusTotalAmount = 0;

  if (qualifiesForPostBirthBonus) {
    bonusDays = Math.min(
      Math.max(0, Math.floor(Number(postBirthBonusDays) || 0)),
      Math.min(tier1Days, PERIOD_DAYS.POST_BIRTH_SUPPORT_MAX_DAYS)
    );
    bonusDailyAmount = Math.floor((wageDailyBasis * 13) / 100);
    bonusTotalAmount = Math.min(
      period.MAX_POST_BIRTH_SUPPORT_28D,
      Math.floor((wageDailyBasis * bonusDays * 13) / 100)
    );
  }

  // 4. TÍNH THEO TỪNG 支給単位期間 30 NGÀY + GIẢM TRỪ KHI CÔNG TY TRẢ LƯƠNG (賃金控除)
  const monthlyWageEquivalent = wageDailyBasis * PERIOD_DAYS.STANDARD_MONTH_DAYS;
  const tier1Calc = computeTierTotal(wageDailyBasis, tier1Days, 67, validSalaryDuringLeave);
  const tier2Calc = computeTierTotal(wageDailyBasis, tier2Days, 50, validSalaryDuringLeave);

  const tier1MonthlyAmount = Math.min(period.MAX_MONTHLY_BENEFIT_67, Math.floor((monthlyWageEquivalent * 67) / 100));
  const tier2MonthlyAmount = Math.min(period.MAX_MONTHLY_BENEFIT_50, Math.floor((monthlyWageEquivalent * 50) / 100));
  const tier1NetMonthly = tier1Days > 0 ? tier1Calc.fullPeriodAmount : tier1MonthlyAmount;
  const tier2NetMonthly = tier2Days > 0 ? tier2Calc.fullPeriodAmount : tier2MonthlyAmount;
  const isSalaryOffsetApplied = tier1Calc.offsetApplied || tier2Calc.offsetApplied;
  const isFullSalaryOffset = validSalaryDuringLeave > 0 && tier1Calc.fullOffset && (tier2Days === 0 || tier2Calc.fullOffset);

  // Mức ngày hiển thị (tham khảo) = mức tháng thực nhận ÷ 30 khi có giảm trừ
  const tier1NetDaily = tier1NetMonthly === tier1MonthlyAmount ? tier1StandardDaily : Math.floor(tier1NetMonthly / 30);
  const tier2NetDaily = tier2NetMonthly === tier2MonthlyAmount ? tier2StandardDaily : Math.floor(tier2NetMonthly / 30);

  const tier1TotalAmount = tier1Calc.total;
  const tier2TotalAmount = tier2Calc.total;

  // 5. TRỢ CẤP LÀM VIỆC RÚT NGẮN GIỜ NUÔI CON DƯỚI 2 TUỔI (育児時短就業給付金)
  // = 10% tiền lương THỰC TRẢ trong tháng làm giờ ngắn (không phải 10% lương trước khi nghỉ)
  let shortTimeTotalAmount = 0;
  let shortTimeMonthlyAmount = 0;
  const validShortTimeMonths = isShortTimeWork ? Math.max(0, Math.min(24, Number(shortTimeMonths) || 0)) : 0;
  // 時短就業開始時賃金月額 (kẹp trần/sàn như 育児休業給付)
  const preShortTimeMonthlyWage = Math.min(
    period.MAX_MONTHLY_WAGE,
    Math.max(period.MIN_MONTHLY_WAGE, Math.floor(total6MWage / 6))
  );
  const hasShortTimeWageInput = shortTimeMonthlyWage !== undefined && shortTimeMonthlyWage !== null
    && shortTimeMonthlyWage !== '' && Number.isFinite(Number(shortTimeMonthlyWage));
  const isShortTimeWageAssumed = !hasShortTimeWageInput;
  const effectiveShortTimeWage = hasShortTimeWageInput
    ? Math.max(0, Math.floor(Number(shortTimeMonthlyWage)))
    : Math.floor((validMonthlySalary * 80) / 100); // Giả định: làm giờ ngắn nhận ~80% lương cũ

  if (isShortTimeWork && validShortTimeMonths > 0) {
    shortTimeMonthlyAmount = calculateShortTimeWorkMonthlyBenefit({
      preShortTimeMonthlyWage,
      paidWage: effectiveShortTimeWage,
      period,
    });
    shortTimeTotalAmount = shortTimeMonthlyAmount * validShortTimeMonths;
  }

  // TỔNG TRỢ CẤP NGHỈ CHĂM CON
  const totalStandardBenefit = tier1TotalAmount + tier2TotalAmount;
  const grandTotalBenefit = totalStandardBenefit + bonusTotalAmount + shortTimeTotalAmount;

  // 6. XÂY DỰNG DANH SÁCH CÁC GIAI ĐOẠN CHO TIMELINE VISUALIZER
  const timelineStages = [
    {
      stageId: 'tier1_initial',
      titleJa: '180日目まで（給付率67％）',
      titleVi: '180 ngày đầu tiên (Hưởng 67% lương)',
      titleEn: 'First 180 Days (67% Wage Rate)',
      ratePercent: 67,
      days: tier1Days,
      dailyAmount: tier1NetDaily,
      monthlyAmount: tier1NetMonthly,
      totalAmount: tier1TotalAmount,
      isBonusApplied: false,
    },
  ];

  if (qualifiesForPostBirthBonus && bonusDays > 0) {
    timelineStages.push({
      stageId: 'post_birth_support_bonus',
      titleJa: '出生後休業支援加算（＋13％・最大28日間）',
      titleVi: 'Thưởng hỗ trợ sau sinh (+13% lương, tối đa 28 ngày)',
      titleEn: 'Post-birth Support Bonus (+13%, max 28 days)',
      ratePercent: 13,
      days: bonusDays,
      dailyAmount: bonusDailyAmount,
      monthlyAmount: bonusDailyAmount * 30,
      totalAmount: bonusTotalAmount,
      isBonusApplied: true,
      combinedRatePercent: 80,
    });
  }

  if (tier2Days > 0) {
    timelineStages.push({
      stageId: 'tier2_subsequent',
      titleJa: '181日目以降（給付率50％・原則1歳まで）',
      titleVi: 'Từ ngày 181 trở đi (Hưởng 50% lương, đến 1 tuổi)',
      titleEn: 'Day 181 Onwards (50% Wage Rate, up to 1 year)',
      ratePercent: 50,
      days: tier2Days,
      dailyAmount: tier2NetDaily,
      monthlyAmount: tier2NetMonthly,
      totalAmount: tier2TotalAmount,
      isBonusApplied: false,
      extensionStatus: totalLeaveDays > 365 ? (isDaycareRejected ? 'extended' : 'pending_proof') : 'none',
    });
  }

  if (isShortTimeWork && validShortTimeMonths > 0) {
    timelineStages.push({
      stageId: 'short_time_work',
      titleJa: '復職後・育児時短就業給付（時短中に支払われた賃金の10％）',
      titleVi: 'Đi làm lại rút ngắn giờ làm (10% lương thực nhận khi làm giờ ngắn)',
      titleEn: 'Post-return Short-Time Work Benefit (10% of reduced wage paid)',
      ratePercent: 10,
      days: validShortTimeMonths * 30,
      months: validShortTimeMonths,
      monthlyAmount: shortTimeMonthlyAmount,
      totalAmount: shortTimeTotalAmount,
      isShortTime: true,
    });
  }

  return {
    isEligible: totalLeaveDays > 0,
    effectivePeriod: period,
    wageDailyBasis: {
      rawDailyWage: flooredDailyWage,
      statutoryDailyWage: wageDailyBasis,
      isCappedByMaxLimit,
      isFlooredByMinLimit,
      statutoryMonthlyEquivalent: monthlyWageEquivalent,
    },
    benefitBreakdown: {
      tier1: {
        rate: RATES.INITIAL_PERIOD_RATE,
        days: tier1Days,
        dailyAmount: tier1NetDaily,
        monthlyAmount: tier1NetMonthly,
        totalAmount: tier1TotalAmount,
      },
      tier2: {
        rate: RATES.SUBSEQUENT_PERIOD_RATE,
        days: tier2Days,
        dailyAmount: tier2NetDaily,
        monthlyAmount: tier2NetMonthly,
        totalAmount: tier2TotalAmount,
      },
      postBirthBonus: {
        isApplied: qualifiesForPostBirthBonus,
        rate: RATES.POST_BIRTH_SUPPORT_BONUS,
        combinedRate: RATES.COMBINED_80_PERCENT_RATE,
        days: bonusDays,
        dailyAmount: bonusDailyAmount,
        totalAmount: bonusTotalAmount,
      },
      shortTimeWork: {
        isApplied: isShortTimeWork,
        rate: RATES.SHORT_TIME_WORK_RATE,
        months: validShortTimeMonths,
        monthlyAmount: shortTimeMonthlyAmount,
        totalAmount: shortTimeTotalAmount,
        paidWage: effectiveShortTimeWage,
        isPaidWageAssumed: isShortTimeWageAssumed,
        preShortTimeMonthlyWage,
        paymentLimit: period.SHORT_TIME_PAYMENT_LIMIT,
      },
    },
    financialTotals: {
      totalLeaveDays,
      totalStandardBenefit,
      bonusTotalAmount,
      shortTimeTotalAmount,
      grandTotalBenefit,
      isSalaryOffsetApplied,
      isFullSalaryOffset,
      monthlySalaryDuringLeave: validSalaryDuringLeave,
    },
    timelineStages,
    takeHomeExplanation: {
      taxExemptionJa: '育児休業給付金は所得税・住民税が非課税であり、休業期間中は社会保険料（健康保険・厚生年金）が全額免除されます。そのため、額面67％支給時の手取りは約80％相当、80％支給時（加算適用時）は手取り約10割（実質100％）に相当します。',
      taxExemptionVi: 'Trợ cấp Nghỉ chăm con BHTN được MIỄN HOÀN TOÀN thuế thu nhập và thuế cư trú, đồng thời người lao động được MIỄN TOÀN BỘ phí BHXH (BHYT & Hưu trí) trong thời gian nghỉ. Do đó mức trợ cấp 67% lương gộp tương đương khoảng 80% thu nhập thực nhận, và mức 80% (khi có thưởng 13%) tương đương gần như 100% lương thực nhận!',
      taxExemptionEn: 'Childcare leave benefits are completely exempt from income and resident taxes, and social insurance premiums are fully waived. Thus, 67% gross benefit equals ~80% take-home pay, and 80% benefit equals ~100% take-home equivalent.',
    },
    regulatorySources: CHILDCARE_BENEFIT_SOURCES,
  };
}
