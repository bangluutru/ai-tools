/**
 * @file packages/core/src/japan/employment/engines/unemploymentBenefitEngine.js
 * @description
 * Statutory Unemployment Benefit Calculator Engine (基本手当日額・受給総額シミュレーションエンジン)
 * Implements exact formulas according to:
 * - 雇用保険法 第16条 (基本手当日額の算定: 50%〜80%の逓減スライド式)
 * - 雇用保険法 第22条・第23条 (所定給付日数: 90日〜330日)
 * - 厚生労働省告示 雇用保険基本手当日額等の改定告示 (毎年8月1日改定)
 */

import {
  EFFECTIVE_PERIODS,
  BENEFIT_DURATION_TABLES,
  UNEMPLOYMENT_BENEFIT_SOURCES
} from '../rules/unemploymentBenefitTables.js';

/**
 * Xác định giai đoạn hiệu lực MHLW từ ngày tính toán.
 * @param {string} [targetDate] - YYYY-MM-DD
 * @returns {Object} Giai đoạn hiệu lực phù hợp
 */
export function resolveEffectivePeriod(targetDate) {
  if (!targetDate) return EFFECTIVE_PERIODS.PERIOD_2026_08;
  if (targetDate >= '2026-08-01') return EFFECTIVE_PERIODS.PERIOD_2026_08;
  return EFFECTIVE_PERIODS.PERIOD_2025_08;
}

/**
 * Xác định nhóm tuổi luật định theo MHLW.
 * @param {number} age
 * @returns {'under_30' | 'age_30_44' | 'age_45_59' | 'age_60_64'}
 */
export function resolveAgeBracket(age) {
  const a = Number(age) || 0;
  if (a < 30) return 'under_30';
  if (a <= 44) return 'age_30_44';
  if (a <= 59) return 'age_45_59';
  return 'age_60_64';
}

/**
 * Tra cứu số ngày hưởng trợ cấp thất nghiệp luật định (所定給付日数).
 * @param {Object} params
 * @param {number} params.age - Tuổi khi thôi việc
 * @param {number} params.insuredYears - Số năm tham gia bảo hiểm
 * @param {string} params.separationCategory - 'COMPANY_CAUSE' | 'SPECIFIC_REASONS' | 'PERSONAL_VOLUNTARY' | 'DISCIPLINARY'
 * @param {boolean} [params.isFavorableDuration=false] - Hưởng biểu ưu tiên (áp dụng cho Type A và một số Type B hết hạn hợp đồng)
 * @param {boolean} [params.isDifficultToEmploy=false] - Đối tượng khó tìm việc (khuyết tật...)
 * @returns {{ prescribedDays: number, durationCategoryJa: string, durationCategoryVi: string }}
 */
export function calculatePrescribedBenefitDays({
  age,
  insuredYears,
  separationCategory = 'PERSONAL_VOLUNTARY',
  isFavorableDuration = false,
  isDifficultToEmploy = false
}) {
  const yrs = Math.max(0, Number(insuredYears) || 0);
  const userAge = Math.max(15, Math.min(64, Number(age) || 30));

  // 1. Trường hợp người khó tìm việc (就職困難者)
  if (isDifficultToEmploy) {
    const isUnder45 = userAge < 45;
    const group = isUnder45
      ? BENEFIT_DURATION_TABLES.DIFFICULT_TO_EMPLOY[0]
      : BENEFIT_DURATION_TABLES.DIFFICULT_TO_EMPLOY[1];
    
    const tier = yrs < 1 ? group.tiers[0] : group.tiers[1];
    return {
      prescribedDays: tier.days,
      durationCategoryJa: `就職困難者（${isUnder45 ? '45歳未満' : '45歳以上65歳未満'}・加入${yrs}年）`,
      durationCategoryVi: `Đối tượng khó tìm việc (${isUnder45 ? 'Dưới 45 tuổi' : '45-64 tuổi'}, thâm niên ${yrs} năm)`
    };
  }

  // 2. Trường hợp diện công ty hoặc lý do chính đáng ưu đãi (特定受給資格者・一部特定理由離職者)
  const isCompanyOrFavorable = separationCategory === 'COMPANY_CAUSE' || isFavorableDuration;
  if (isCompanyOrFavorable) {
    let groupIdx = 0;
    if (userAge < 30) groupIdx = 0;
    else if (userAge < 35) groupIdx = 1;
    else if (userAge < 45) groupIdx = 2;
    else if (userAge < 60) groupIdx = 3;
    else groupIdx = 4;

    const group = BENEFIT_DURATION_TABLES.COMPANY_CAUSE[groupIdx];
    const matchTier = group.tiers.find((t) => yrs >= t.minYears && yrs < t.maxYears) || group.tiers[group.tiers.length - 1];

    return {
      prescribedDays: matchTier.days,
      durationCategoryJa: `特定受給資格者等（${group.labelJa}・加入${yrs}年）`,
      durationCategoryVi: `Diện công ty sa thải / Lý do đặc định (${group.labelVi}, thâm niên ${yrs} năm)`
    };
  }

  // 3. Trường hợp tự ý nghỉ việc thông thường (一般離職者・自己都合)
  const generalTable = BENEFIT_DURATION_TABLES.PERSONAL_VOLUNTARY;
  const matchTier = generalTable.find((t) => yrs >= t.minYears && yrs < t.maxYears) || generalTable[generalTable.length - 1];

  return {
    prescribedDays: matchTier.days,
    durationCategoryJa: `一般離職者（自己都合退職等・加入${matchTier.labelJa}）`,
    durationCategoryVi: `Diện tự ý nghỉ việc thông thường (${matchTier.labelVi})`
  };
}

/**
 * Tính toán toàn diện mức trợ cấp cơ bản hàng ngày và tổng số tiền được nhận.
 * @param {Object} params
 * @param {number} [params.totalWagesLast6Months] - Tổng tiền lương 6 tháng trước nghỉ việc (không gồm thưởng)
 * @param {number} [params.monthlyWage] - Tiền lương bình quân hàng tháng (dùng nếu không nhập tổng 6 tháng)
 * @param {number} params.age - Tuổi tại thời điểm thôi việc
 * @param {number} params.insuredYears - Số năm tham gia bảo hiểm việc làm
 * @param {string} [params.separationCategory='PERSONAL_VOLUNTARY'] - Phân loại thôi việc
 * @param {boolean} [params.isFavorableDuration=false] - Hưởng số ngày diện ưu đãi
 * @param {boolean} [params.isDifficultToEmploy=false] - Đối tượng khó tìm việc
 * @param {string} [params.targetDate='2026-09-01'] - Ngày áp dụng (YYYY-MM-DD)
 * @returns {Object} Kết quả tiền lương ngày, trợ cấp ngày, tỷ lệ, số ngày và tổng tiền nhận
 */
export function calculateUnemploymentBenefit({
  totalWagesLast6Months,
  monthlyWage,
  age = 30,
  insuredYears = 1,
  separationCategory = 'PERSONAL_VOLUNTARY',
  isFavorableDuration = false,
  isDifficultToEmploy = false,
  targetDate = '2026-09-01'
}) {
  const period = resolveEffectivePeriod(targetDate);
  const ageBracketKey = resolveAgeBracket(age);
  const ageBracketConfig = period.ageBrackets[ageBracketKey];

  // 1. Tính tổng lương 6 tháng trước khi nghỉ việc
  let wages6Months = 0;
  if (totalWagesLast6Months !== undefined && totalWagesLast6Months !== null && totalWagesLast6Months !== '') {
    wages6Months = Math.max(0, Number(totalWagesLast6Months) || 0);
  } else if (monthlyWage !== undefined && monthlyWage !== null) {
    wages6Months = Math.max(0, Number(monthlyWage) || 0) * 6;
  }

  // 2. Tính tiền lương ngày (賃金日額: Tổng lương 6 tháng / 180)
  const rawDailyWage = wages6Months > 0 ? wages6Months / 180 : 0;
  // Giới hạn theo sàn tối thiểu và trần tối đa theo độ tuổi
  const clampedDailyWage = Math.min(
    ageBracketConfig.maxDailyWage,
    Math.max(period.minDailyWage, Math.floor(rawDailyWage))
  );

  // 3. Tính mức trợ cấp cơ bản hàng ngày (基本手当日額) theo đường cong luật định (50%〜80%)
  const y = clampedDailyWage;
  const A = period.thresholdA;
  const B = period.thresholdB;
  let rawBenefit = 0;
  let benefitRate = 0.5;

  if (ageBracketKey === 'age_60_64') {
    // Độ tuổi 60-64: tỷ lệ trượt từ 80% xuống 45%
    if (y <= A) {
      benefitRate = 0.8;
      rawBenefit = y * 0.8;
    } else if (y <= B) {
      benefitRate = 0.8 - (0.35 * (y - A)) / (B - A);
      rawBenefit = y * benefitRate;
    } else {
      benefitRate = 0.45;
      rawBenefit = y * 0.45;
    }
  } else {
    // Độ tuổi dưới 60: tỷ lệ trượt từ 80% xuống 50%
    if (y <= A) {
      benefitRate = 0.8;
      rawBenefit = y * 0.8;
    } else if (y <= B) {
      benefitRate = 0.8 - (0.3 * (y - A)) / (B - A);
      rawBenefit = y * benefitRate;
    } else {
      benefitRate = 0.5;
      rawBenefit = y * 0.5;
    }
  }

  // Áp dụng trần tối đa và sàn tối thiểu của trợ cấp ngày
  const basicDailyBenefit = Math.min(
    ageBracketConfig.maxDailyBenefit,
    Math.max(period.minDailyBenefit, Math.floor(rawBenefit))
  );

  const effectiveBenefitRatePercent = clampedDailyWage > 0
    ? parseFloat(((basicDailyBenefit / clampedDailyWage) * 100).toFixed(1))
    : 0;

  // 4. Tính số ngày hưởng trợ cấp (所定給付日数)
  const { prescribedDays, durationCategoryJa, durationCategoryVi } = calculatePrescribedBenefitDays({
    age,
    insuredYears,
    separationCategory,
    isFavorableDuration,
    isDifficultToEmploy
  });

  // 5. Tính toán tổng số tiền và quy đổi theo chu kỳ 4 tuần (28 ngày)
  const totalBenefitAmount = basicDailyBenefit * prescribedDays;
  const fourWeekCycleAmount = basicDailyBenefit * 28; // Chu kỳ công nhận thất nghiệp định kỳ thông thường 28 ngày
  const approxMonthlyEquivalent = Math.round(basicDailyBenefit * 30);

  // Cảnh báo & Ghi chú pháp lý
  const isCapped = rawBenefit > ageBracketConfig.maxDailyBenefit || rawDailyWage > ageBracketConfig.maxDailyWage;
  const isFloored = rawDailyWage < period.minDailyWage;

  return {
    effectivePeriod: period,
    targetDate,
    age: Number(age) || 30,
    ageBracketKey,
    insuredYears: Number(insuredYears) || 1,
    separationCategory,
    wagesLast6Months: wages6Months,
    dailyWage: clampedDailyWage,
    rawDailyWage: Math.round(rawDailyWage),
    dailyWageMin: period.minDailyWage,
    dailyWageMax: ageBracketConfig.maxDailyWage,
    basicDailyBenefit,
    dailyBenefitMin: period.minDailyBenefit,
    dailyBenefitMax: ageBracketConfig.maxDailyBenefit,
    effectiveBenefitRatePercent,
    prescribedBenefitDays: prescribedDays,
    durationCategoryJa,
    durationCategoryVi,
    totalBenefitAmount,
    fourWeekCycleAmount,
    approxMonthlyEquivalent,
    isCapped,
    isFloored,
    sources: UNEMPLOYMENT_BENEFIT_SOURCES
  };
}
