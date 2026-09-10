/**
 * @file packages/core/src/japan/family/engines/childcareBenefitEngine.js
 * @description
 * Công cụ tính toán Trợ cấp Nghỉ chăm con Nhật Bản (育児休業給付金シミュレーター Engine).
 * Căn cứ Điều 61-7 đến Điều 61-10 Luật Bảo hiểm Thất nghiệp (雇用保険法) và biểu mức MHLW.
 */

import {
  CHILDCARE_BENEFIT_CONSTANTS,
  CHILDCARE_BENEFIT_SOURCES,
} from '../rules/childcareBenefitRules.js';

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
} = {}) {
  const { DAILY_WAGE_LIMITS, RATES, PERIOD_DAYS, SALARY_OFFSET_THRESHOLDS } = CHILDCARE_BENEFIT_CONSTANTS;

  const validMonthlySalary = Math.max(0, Number(monthlySalary) || 0);
  const total6MWage = sixMonthsTotalWage > 0 ? Number(sixMonthsTotalWage) : validMonthlySalary * 6;
  const totalLeaveDays = Math.max(0, Math.min(730, Number(plannedLeaveDays) || 0)); // Tối đa 2 năm = 730 ngày
  const validSalaryDuringLeave = Math.max(0, Number(monthlySalaryDuringLeave) || 0);

  // 1. TÍNH MỨC TIỀN LƯƠNG NGÀY BẮT ĐẦU NGHỈ (休業開始時賃金日額)
  // Công thức luật định: Tổng tiền lương 6 tháng trước khi nghỉ ÷ 180 ngày
  const rawDailyWage = total6MWage / 180;

  // Áp dụng trần và sàn MHLW
  const isCappedByMaxLimit = rawDailyWage > DAILY_WAGE_LIMITS.MAX_DAILY_WAGE;
  const isFlooredByMinLimit = rawDailyWage < DAILY_WAGE_LIMITS.MIN_DAILY_WAGE;

  let wageDailyBasis = Math.round(rawDailyWage);
  if (isCappedByMaxLimit) {
    wageDailyBasis = DAILY_WAGE_LIMITS.MAX_DAILY_WAGE;
  } else if (isFlooredByMinLimit) {
    wageDailyBasis = DAILY_WAGE_LIMITS.MIN_DAILY_WAGE;
  }

  // 2. PHÂN BỔ SỐ NGÀY THEO TỪNG GIAI ĐOẠN LUẬT ĐỊNH
  // Giai đoạn 1: 180 ngày đầu tiên (mức 67%)
  const tier1Days = Math.min(totalLeaveDays, PERIOD_DAYS.INITIAL_67_MAX_DAYS);
  // Giai đoạn 2: Từ ngày 181 trở đi (mức 50%)
  const tier2Days = Math.max(0, totalLeaveDays - PERIOD_DAYS.INITIAL_67_MAX_DAYS);

  // Mức trợ cấp ngày tiêu chuẩn (50銭以上四捨五入 hoặc Math.floor theo thông lệ BHTN)
  const tier1StandardDaily = Math.floor(wageDailyBasis * RATES.INITIAL_PERIOD_RATE);
  const tier2StandardDaily = Math.floor(wageDailyBasis * RATES.SUBSEQUENT_PERIOD_RATE);

  // Mức trợ cấp tháng chuẩn (quy đổi 30 ngày)
  const tier1MonthlyAmount = Math.min(
    DAILY_WAGE_LIMITS.MAX_MONTHLY_BENEFIT_67,
    tier1StandardDaily * PERIOD_DAYS.STANDARD_MONTH_DAYS
  );
  const tier2MonthlyAmount = Math.min(
    DAILY_WAGE_LIMITS.MAX_MONTHLY_BENEFIT_50,
    tier2StandardDaily * PERIOD_DAYS.STANDARD_MONTH_DAYS
  );

  // 3. XÉT THƯỞNG HỖ TRỢ NGHỈ SAU SINH (+13% ĐẠT 80% LƯƠNG NGÀY)
  // Căn cứ: 雇用保険法第61条の9 (出生後休業支援給付金)
  let bonusDays = 0;
  let bonusDailyAmount = 0;
  let bonusTotalAmount = 0;

  if (qualifiesForPostBirthBonus) {
    bonusDays = Math.min(
      Math.max(0, Number(postBirthBonusDays) || 0),
      Math.min(tier1Days, PERIOD_DAYS.POST_BIRTH_SUPPORT_MAX_DAYS)
    );
    bonusDailyAmount = Math.floor(wageDailyBasis * RATES.POST_BIRTH_SUPPORT_BONUS);
    bonusTotalAmount = bonusDailyAmount * bonusDays;
  }

  // 4. KIỂM TRA GIẢM TRỪ KHI CÔNG TY TRẢ LƯƠNG TRONG THỜI GIAN NGHỈ (賃金控除)
  // Căn cứ: 雇用保険法第61条の7第5項
  // Chuẩn tháng: wageDailyBasis * 30
  const monthlyWageEquivalent = wageDailyBasis * PERIOD_DAYS.STANDARD_MONTH_DAYS;
  let isSalaryOffsetApplied = false;
  let isFullSalaryOffset = false;
  let tier1NetMonthly = tier1MonthlyAmount;
  let tier2NetMonthly = tier2MonthlyAmount;

  if (validSalaryDuringLeave > 0) {
    const salaryRate = validSalaryDuringLeave / monthlyWageEquivalent;

    if (salaryRate >= SALARY_OFFSET_THRESHOLDS.ZERO_BENEFIT_LIMIT_RATE) {
      // Lương >= 80% mức lương chuẩn -> Trợ cấp = 0円
      isSalaryOffsetApplied = true;
      isFullSalaryOffset = true;
      tier1NetMonthly = 0;
      tier2NetMonthly = 0;
    } else if (salaryRate > SALARY_OFFSET_THRESHOLDS.FULL_BENEFIT_LIMIT_RATE) {
      // Lương từ 13% đến 80% -> Bù sao cho (Lương + Trợ cấp) <= 80%
      isSalaryOffsetApplied = true;
      const maxAllowedTotal = monthlyWageEquivalent * SALARY_OFFSET_THRESHOLDS.REDUCED_BENEFIT_LIMIT_RATE;
      const cappedBenefit = Math.max(0, maxAllowedTotal - validSalaryDuringLeave);
      tier1NetMonthly = Math.min(tier1MonthlyAmount, Math.floor(cappedBenefit));
      tier2NetMonthly = Math.min(tier2MonthlyAmount, Math.floor(cappedBenefit));
    }
  }

  // Quy đổi tỷ lệ net daily nếu có giảm trừ
  const tier1NetDaily = tier1MonthlyAmount > 0
    ? Math.floor(tier1StandardDaily * (tier1NetMonthly / tier1MonthlyAmount))
    : 0;
  const tier2NetDaily = tier2MonthlyAmount > 0
    ? Math.floor(tier2StandardDaily * (tier2NetMonthly / tier2MonthlyAmount))
    : 0;

  const tier1TotalAmount = tier1NetDaily * tier1Days;
  const tier2TotalAmount = tier2NetDaily * tier2Days;

  // 5. TRỢ CẤP LÀM VIỆC RÚT NGẮN GIỜ NUÔI CON DƯỚI 2 TUỔI (育児時短就業給付金)
  // Căn cứ: 雇用保険法第61条の10 (2025年4月新設)
  let shortTimeTotalAmount = 0;
  let shortTimeMonthlyAmount = 0;
  const validShortTimeMonths = isShortTimeWork ? Math.max(0, Math.min(24, Number(shortTimeMonths) || 0)) : 0;

  if (isShortTimeWork && validShortTimeMonths > 0) {
    shortTimeMonthlyAmount = Math.floor(validMonthlySalary * RATES.SHORT_TIME_WORK_RATE);
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
      titleJa: '復職後・育児時短就業給付（給与の約10％）',
      titleVi: 'Đi làm lại rút ngắn giờ làm (Hưởng ~10% lương)',
      titleEn: 'Post-return Short-Time Work Benefit (~10% Wage)',
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
    wageDailyBasis: {
      rawDailyWage: Math.round(rawDailyWage),
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
