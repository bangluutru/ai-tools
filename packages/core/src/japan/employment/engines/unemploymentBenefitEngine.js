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
  UNEMPLOYMENT_BENEFIT_SOURCES,
  SENIOR_JOB_SEEKER_BENEFIT
} from '../rules/unemploymentBenefitTables.js';
import { todayLocalISO, isValidISODate } from '../localDate.js';

/**
 * Xác định giai đoạn hiệu lực MHLW từ ngày tính toán.
 * Ngày trước 01/08/2025 không có bảng riêng trong hệ thống → dùng bảng Reiwa 7 (cũ nhất đang lưu).
 * @param {string} [targetDate] - YYYY-MM-DD (mặc định: hôm nay theo lịch địa phương)
 * @returns {Object} Giai đoạn hiệu lực phù hợp
 */
export function resolveEffectivePeriod(targetDate) {
  const date = isValidISODate(targetDate) ? targetDate : todayLocalISO();
  if (date >= EFFECTIVE_PERIODS.PERIOD_2026_08.startDate) return EFFECTIVE_PERIODS.PERIOD_2026_08;
  return EFFECTIVE_PERIODS.PERIOD_2025_08;
}

/**
 * Tính 基本手当日額 từ 賃金日額 (w) đã kẹp sàn/trần, theo đúng công thức MHLW
 * (1円未満切捨て). Dùng số học nguyên để tránh sai số dấu phẩy động ở ranh giới làm tròn.
 *
 * Dưới 60 tuổi (và 65+):
 *   w < A            : y = 0.8w
 *   A ≤ w ≤ B        : y = 0.8w − 0.3·((w−A)/(B−A))·w
 *   B < w ≤ trần     : y = 0.5w
 *   w > trần         : y = trần 基本手当日額
 * 60–64 tuổi (B = B60):
 *   A ≤ w ≤ B60      : y = min(0.8w − 0.35·((w−A)/(B60−A))·w, 0.05w + 0.4·B60)
 *   B60 < w ≤ trần   : y = 0.45w
 *
 * @param {number} dailyWage - 賃金日額 (số nguyên, đã kẹp sàn/trần)
 * @param {Object} period - Kỳ hiệu lực (EFFECTIVE_PERIODS.*)
 * @param {string} ageBracketKey - 'under_30' | 'age_30_44' | 'age_45_59' | 'age_60_64'
 * @returns {{ benefit: number, tier: 'flat80' | 'sliding' | 'flatLow' | 'cap' }}
 */
export function computeBasicDailyBenefit(dailyWage, period, ageBracketKey) {
  const w = Math.floor(Number(dailyWage) || 0);
  const bracket = period.ageBrackets[ageBracketKey] || period.ageBrackets.age_30_44;
  const A = period.thresholdA;
  const B = bracket.thresholdB ?? period.thresholdB;
  const is60to64 = ageBracketKey === 'age_60_64';

  if (w > bracket.maxDailyWage) {
    return { benefit: bracket.maxDailyBenefit, tier: 'cap' };
  }
  if (w < A) {
    // y = 0.8w = 8w/10
    return { benefit: Math.floor((8 * w) / 10), tier: 'flat80' };
  }
  if (w <= B) {
    const span = B - A;
    if (is60to64) {
      // 0.8w − 0.35(w−A)w/(B−A) = (16w(B−A) − 7(w−A)w) / (20(B−A))
      const sliding = Math.floor((16 * w * span - 7 * (w - A) * w) / (20 * span));
      // 0.05w + 0.4·B = (w + 8B) / 20
      const alt = Math.floor((w + 8 * B) / 20);
      return { benefit: Math.min(sliding, alt), tier: 'sliding' };
    }
    // 0.8w − 0.3(w−A)w/(B−A) = (8w(B−A) − 3(w−A)w) / (10(B−A))
    return { benefit: Math.floor((8 * w * span - 3 * (w - A) * w) / (10 * span)), tier: 'sliding' };
  }
  // B < w ≤ trần: 0.5w (dưới 60) / 0.45w (60–64)
  const low = is60to64 ? Math.floor((9 * w) / 20) : Math.floor(w / 2);
  return { benefit: Math.min(low, bracket.maxDailyBenefit), tier: 'flatLow' };
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
  const rawAge = Number(age);
  const inputAge = Number.isFinite(rawAge) && rawAge > 0 ? rawAge : 30;

  // 0. Người từ 65 tuổi trở lên: 高年齢求職者給付金 (một lần 30 hoặc 50 ngày, không phân biệt lý do nghỉ)
  if (inputAge >= SENIOR_JOB_SEEKER_BENEFIT.minAge) {
    const days = yrs < 1 ? SENIOR_JOB_SEEKER_BENEFIT.daysUnder1Year : SENIOR_JOB_SEEKER_BENEFIT.days1YearOrMore;
    return {
      prescribedDays: days,
      durationCategoryJa: `高年齢求職者給付金（65歳以上・加入${yrs < 1 ? '1年未満' : '1年以上'}：${days}日分を一時金で支給）`,
      durationCategoryVi: `Trợ cấp một lần cho người tìm việc cao tuổi (65+, thâm niên ${yrs < 1 ? 'dưới 1 năm' : 'từ 1 năm'}: ${days} ngày)`,
      isSeniorJobSeekerBenefit: true
    };
  }

  const userAge = Math.max(15, Math.min(64, inputAge));

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
 * @param {number} params.age - Tuổi tại thời điểm thôi việc (65+ → 高年齢求職者給付金)
 * @param {number} params.insuredYears - Số năm tham gia bảo hiểm việc làm (0 là giá trị hợp lệ)
 * @param {string} [params.separationCategory='PERSONAL_VOLUNTARY'] - Phân loại thôi việc
 * @param {boolean} [params.isFavorableDuration=false] - Hưởng số ngày diện ưu đãi
 * @param {boolean} [params.isDifficultToEmploy=false] - Đối tượng khó tìm việc
 * @param {string} [params.targetDate] - Ngày áp dụng bảng MHLW (YYYY-MM-DD, mặc định: hôm nay)
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
  targetDate
}) {
  const effectiveTargetDate = isValidISODate(targetDate) ? targetDate : todayLocalISO();
  const period = resolveEffectivePeriod(effectiveTargetDate);
  const rawAge = Number(age);
  const normalizedAge = Number.isFinite(rawAge) && rawAge > 0 ? rawAge : 30;
  const isSeniorJobSeeker = normalizedAge >= SENIOR_JOB_SEEKER_BENEFIT.minAge;
  // 65+ dùng trần của mức gốc (nhóm dưới 30 tuổi) và công thức dưới 60 tuổi
  const ageBracketKey = isSeniorJobSeeker ? SENIOR_JOB_SEEKER_BENEFIT.capBracketKey : resolveAgeBracket(normalizedAge);
  const ageBracketConfig = period.ageBrackets[ageBracketKey];

  // 1. Tính tổng lương 6 tháng trước khi nghỉ việc
  let wages6Months = 0;
  if (totalWagesLast6Months !== undefined && totalWagesLast6Months !== null && totalWagesLast6Months !== '') {
    wages6Months = Math.max(0, Number(totalWagesLast6Months) || 0);
  } else if (monthlyWage !== undefined && monthlyWage !== null) {
    wages6Months = Math.max(0, Number(monthlyWage) || 0) * 6;
  }

  // 2. Tính tiền lương ngày (賃金日額: Tổng lương 6 tháng / 180, 1円未満切捨て)
  const rawDailyWage = wages6Months > 0 ? wages6Months / 180 : 0;
  const flooredDailyWage = Math.floor(rawDailyWage);
  // Giới hạn theo sàn tối thiểu và trần tối đa theo độ tuổi
  const clampedDailyWage = Math.min(
    ageBracketConfig.maxDailyWage,
    Math.max(period.minDailyWage, flooredDailyWage)
  );

  // 3. Tính mức trợ cấp cơ bản hàng ngày (基本手当日額) theo đường cong luật định (80%〜50%/45%)
  const { benefit: computedBenefit } = computeBasicDailyBenefit(clampedDailyWage, period, ageBracketKey);
  // Sàn/trần của trợ cấp ngày (sàn 3,203×0.8 → 2,562 tự khớp; giữ kẹp để an toàn)
  const basicDailyBenefit = Math.min(
    ageBracketConfig.maxDailyBenefit,
    Math.max(period.minDailyBenefit, computedBenefit)
  );

  const effectiveBenefitRatePercent = clampedDailyWage > 0
    ? parseFloat(((basicDailyBenefit / clampedDailyWage) * 100).toFixed(1))
    : 0;

  // 4. Tính số ngày hưởng trợ cấp (所定給付日数)
  const { prescribedDays, durationCategoryJa, durationCategoryVi } = calculatePrescribedBenefitDays({
    age: normalizedAge,
    insuredYears,
    separationCategory,
    isFavorableDuration,
    isDifficultToEmploy
  });

  // 5. Tính toán tổng số tiền và quy đổi theo chu kỳ 4 tuần (28 ngày)
  const totalBenefitAmount = basicDailyBenefit * prescribedDays;
  const fourWeekCycleAmount = isSeniorJobSeeker ? 0 : basicDailyBenefit * 28; // 65+: nhận một lần, không có chu kỳ 4 tuần
  const approxMonthlyEquivalent = isSeniorJobSeeker ? 0 : Math.round(basicDailyBenefit * 30);

  // Cảnh báo & Ghi chú pháp lý
  const isCapped = flooredDailyWage > ageBracketConfig.maxDailyWage;
  const isFloored = flooredDailyWage < period.minDailyWage;

  const rawInsuredYears = Number(insuredYears);
  const normalizedInsuredYears = Number.isFinite(rawInsuredYears) ? Math.max(0, rawInsuredYears) : 0;

  return {
    effectivePeriod: period,
    targetDate: effectiveTargetDate,
    age: normalizedAge,
    ageBracketKey,
    isSeniorJobSeeker,
    insuredYears: normalizedInsuredYears,
    separationCategory,
    wagesLast6Months: wages6Months,
    dailyWage: clampedDailyWage,
    rawDailyWage: flooredDailyWage,
    dailyWageMin: period.minDailyWage,
    dailyWageMax: ageBracketConfig.maxDailyWage,
    thresholdA: period.thresholdA,
    thresholdB: ageBracketConfig.thresholdB ?? period.thresholdB,
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
