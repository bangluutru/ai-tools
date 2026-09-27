/**
 * @file packages/core/src/japan/employment/rules/unemploymentBenefitTables.js
 * @description
 * Statutory Tables & Dual Effective Periods for Japan Unemployment Benefits (基本手当日額・所定給付日数算定基準)
 * In accordance with:
 * - 雇用保険法 第16条 (基本手当日額の算定)
 * - 雇用保険法 第22条 (一般離職者の所定給付日数)
 * - 雇用保険法 第23条 (特定受給資格者等の所定給付日数)
 * - 厚生労働省告示 雇用保険法に基づく基本手当日額等の改定 (毎年8月1日改定)
 */

export const UNEMPLOYMENT_BENEFIT_SOURCES = [
  'mhlw-basic-allowance-rates-2026',
  'mhlw-hellowork-unemployment-guide',
  'egov-employment-insurance-act'
];

/**
 * Các giai đoạn hiệu lực luật định của MHLW về trần/sàn tiền lương ngày và mức trợ cấp.
 * Số liệu lấy nguyên văn từ tờ rơi chính thức của MHLW:
 * - 令和7年8月1日〜: 「基本手当日額の計算式及び金額（令和７年８月１日～）」
 * - 令和8年8月1日〜: 「基本手当日額の計算式及び金額（令和８年８月１日～）」
 * Mỗi nhóm tuổi có ngưỡng B (thresholdB) riêng: nhóm 60–64 tuổi dùng ngưỡng thấp hơn và hệ số 0.35.
 * Ghi chú: mức mới áp dụng cho phần 基本手当 của các ngày từ 01/08 trở đi (kể cả người đang nhận).
 */
export const EFFECTIVE_PERIODS = {
  PERIOD_2025_08: {
    id: '2025_08',
    nameJa: '令和7年度基準（2025年8月1日〜2026年7月31日）',
    nameVi: 'Kỳ hiệu lực 01/08/2025 - 31/07/2026 (Reiwa 7)',
    nameEn: 'MHLW Rates 2025-08 to 2026-07',
    startDate: '2025-08-01',
    endDate: '2026-07-31',
    minDailyWage: 3014,
    minDailyBenefit: 2411,
    thresholdA: 5340,
    thresholdB: 13140,
    ageBrackets: {
      under_30: {
        thresholdB: 13140,
        maxDailyWage: 14510,
        maxDailyBenefit: 7255
      },
      age_30_44: {
        thresholdB: 13140,
        maxDailyWage: 16110,
        maxDailyBenefit: 8055
      },
      age_45_59: {
        thresholdB: 13140,
        maxDailyWage: 17740,
        maxDailyBenefit: 8870
      },
      age_60_64: {
        thresholdB: 11800,
        maxDailyWage: 16940,
        maxDailyBenefit: 7623
      }
    }
  },
  PERIOD_2026_08: {
    id: '2026_08',
    nameJa: '令和8年度基準（2026年8月1日以降）',
    nameVi: 'Kỳ hiệu lực từ 01/08/2026 trở đi (Reiwa 8)',
    nameEn: 'MHLW Rates 2026-08 onwards',
    startDate: '2026-08-01',
    endDate: '2027-07-31',
    minDailyWage: 3203,
    minDailyBenefit: 2562,
    thresholdA: 5480,
    thresholdB: 13490,
    ageBrackets: {
      under_30: {
        thresholdB: 13490,
        maxDailyWage: 14900,
        maxDailyBenefit: 7450
      },
      age_30_44: {
        thresholdB: 13490,
        maxDailyWage: 16540,
        maxDailyBenefit: 8270
      },
      age_45_59: {
        thresholdB: 13490,
        maxDailyWage: 18220,
        maxDailyBenefit: 9110
      },
      age_60_64: {
        thresholdB: 12120,
        maxDailyWage: 17400,
        maxDailyBenefit: 7830
      }
    }
  }
};

/**
 * 高年齢求職者給付金 (người 65 tuổi trở lên khi nghỉ việc): nhận một lần thay cho 基本手当.
 * Số ngày tính tiền: 30 ngày nếu thời gian tham gia < 1 năm, 50 ngày nếu >= 1 năm (雇用保険法第37条の4).
 * Trần 賃金日額/基本手当日額 áp dụng như nhóm dưới 30 tuổi (第37条の4 loại trừ 第17条第4項第2号 → dùng mức gốc),
 * công thức tỷ lệ 80%〜50% như nhóm dưới 60 tuổi.
 */
export const SENIOR_JOB_SEEKER_BENEFIT = {
  minAge: 65,
  daysUnder1Year: 30,
  days1YearOrMore: 50,
  capBracketKey: 'under_30'
};

/**
 * Bảng số ngày hưởng trợ cấp thất nghiệp luật định (所定給付日数)
 */
export const BENEFIT_DURATION_TABLES = {
  // 1. 特定受給資格者 (Type A - 倒産・解雇等) & 一部特定理由離職者 (雇止め等)
  COMPANY_CAUSE: [
    {
      ageGroup: 'under_30',
      labelJa: '30歳未満',
      labelVi: 'Dưới 30 tuổi',
      tiers: [
        { minYears: 0, maxYears: 1, days: 90 },
        { minYears: 1, maxYears: 5, days: 90 },
        { minYears: 5, maxYears: 10, days: 120 },
        { minYears: 10, maxYears: 99, days: 180 }
      ]
    },
    {
      ageGroup: 'age_30_34',
      labelJa: '30歳以上35歳未満',
      labelVi: 'Từ 30 đến dưới 35 tuổi',
      tiers: [
        { minYears: 0, maxYears: 1, days: 90 },
        { minYears: 1, maxYears: 5, days: 120 },
        { minYears: 5, maxYears: 10, days: 180 },
        { minYears: 10, maxYears: 20, days: 210 },
        { minYears: 20, maxYears: 99, days: 240 }
      ]
    },
    {
      ageGroup: 'age_35_44',
      labelJa: '35歳以上45歳未満',
      labelVi: 'Từ 35 đến dưới 45 tuổi',
      tiers: [
        { minYears: 0, maxYears: 1, days: 90 },
        { minYears: 1, maxYears: 5, days: 150 },
        { minYears: 5, maxYears: 10, days: 180 },
        { minYears: 10, maxYears: 20, days: 240 },
        { minYears: 20, maxYears: 99, days: 270 }
      ]
    },
    {
      ageGroup: 'age_45_59',
      labelJa: '45歳以上60歳未満',
      labelVi: 'Từ 45 đến dưới 60 tuổi',
      tiers: [
        { minYears: 0, maxYears: 1, days: 90 },
        { minYears: 1, maxYears: 5, days: 180 },
        { minYears: 5, maxYears: 10, days: 240 },
        { minYears: 10, maxYears: 20, days: 270 },
        { minYears: 20, maxYears: 99, days: 330 }
      ]
    },
    {
      ageGroup: 'age_60_64',
      labelJa: '60歳以上65歳未満',
      labelVi: 'Từ 60 đến dưới 65 tuổi',
      tiers: [
        { minYears: 0, maxYears: 1, days: 90 },
        { minYears: 1, maxYears: 5, days: 150 },
        { minYears: 5, maxYears: 10, days: 180 },
        { minYears: 10, maxYears: 20, days: 210 },
        { minYears: 20, maxYears: 99, days: 240 }
      ]
    }
  ],

  // 2. 一般離職者 (自己都合退職・定年・重責解雇等)
  PERSONAL_VOLUNTARY: [
    { minYears: 0, maxYears: 10, days: 90, labelJa: '10年未満', labelVi: 'Dưới 10 năm' },
    { minYears: 10, maxYears: 20, days: 120, labelJa: '10年以上20年未満', labelVi: 'Từ 10 năm đến dưới 20 năm' },
    { minYears: 20, maxYears: 99, days: 150, labelJa: '20年以上', labelVi: 'Từ 20 năm trở lên' }
  ],

  // 3. 就職困難者 (障害者・特別な配慮を要する者)
  DIFFICULT_TO_EMPLOY: [
    {
      ageGroup: 'under_45',
      labelJa: '45歳未満',
      labelVi: 'Dưới 45 tuổi',
      tiers: [
        { minYears: 0, maxYears: 1, days: 150 },
        { minYears: 1, maxYears: 99, days: 300 }
      ]
    },
    {
      ageGroup: 'age_45_64',
      labelJa: '45歳以上65歳未満',
      labelVi: 'Từ 45 đến dưới 65 tuổi',
      tiers: [
        { minYears: 0, maxYears: 1, days: 150 },
        { minYears: 1, maxYears: 99, days: 360 }
      ]
    }
  ]
};
