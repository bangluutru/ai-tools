/**
 * @file packages/core/src/utils/tax/rules/2026/index.js
 * @description Bộ quy tắc thuế & nghĩa vụ xã hội Nhật Bản năm tài chính 2026 (令和8年分 / 令和8年度).
 * Đã thẩm định đối chiếu theo Tier-1 Primary Sources:
 * - 国税庁 No.1410 (給与所得控除 令和8・9年分)
 * - 国税庁 No.1199 (基礎控除 令和8・9年分)
 * - 日本年金機構 (令和8年度 国民年金保険料 17,920円/月)
 * - 厚生労働省 (令和8年度 雇用保険料率: 一般事業 労働者 5/1,000)
 * - 協会けんぽ / こども家庭庁 (令和8年度 保険料率、子ども・子育て支援金 0.23%、介護保険料率 1.62%)
 */

import { defineRuleMetadata } from '../../../../regulatory/ruleMetadata.js';

export const Rules2026 = {
  year: 2026,
  fiscalEra: '令和8年分',
  status: 'active',
  effectiveFrom: '2026-01-01',
  effectiveTo: '2026-12-31',
  verifiedDate: '2026-09-10',
  notes_ja: '基礎控除104万円・給与所得控除最低保障74万円により「178万円の壁」に対応。子ども・子育て支援金（0.23%）は2026年4月施行。国民年金17,920円/月。雇用保険料率0.5%（労働者負担）。',
  notes_vi: 'Áp dụng mức giảm trừ cơ bản 104 vạn yên và mức sàn giảm trừ tiền lương 74 vạn yên (tương đương bức tường 178 vạn yên). Quỹ hỗ trợ trẻ em 0.23% và BHYT/BHXH mới áp dụng từ 04/2026. Hưu trí quốc dân 17,920 yên/tháng.',
  notes_en: 'Fiscal Year 2026 rules: Basic deduction 1.04M JPY, Min employment deduction 740k JPY (1.78M wall). Child Support Contribution 0.23% effective Apr 2026. National Pension 17,920 JPY/mo. Employment insurance 0.5%.',

  metadata: defineRuleMetadata({
    id: 'jp-tax-rules-2026',
    jurisdiction: { country: 'JP' },
    sourceId: 'nta-no1410-2026',
    effectiveFrom: '2026-12-01',
    applicablePeriod: {
      type: 'tax-year',
      from: 2026,
      to: 2027,
    },
    version: '2026.1',
    lastVerifiedAt: '2026-09-10',
    status: 'verified',
    notes: 'Bản quy chuẩn thuế thu nhập cá nhân và bảo hiểm xã hội Nhật Bản 2026',
  }),

  // 1. 所得税 (Income Tax)
  incomeTax: {
    sourceId: 'nta-no2260-brackets',
    // Biểu thuế lũy tiến 7 bậc (所得税の速算表) - 国税庁 No.2260
    brackets: [
      { limit: 1949000, rate: 0.05, deduction: 0 },
      { limit: 3299000, rate: 0.10, deduction: 97500 },
      { limit: 6949000, rate: 0.20, deduction: 427500 },
      { limit: 8999000, rate: 0.23, deduction: 636000 },
      { limit: 17999000, rate: 0.33, deduction: 1536000 },
      { limit: 39999000, rate: 0.40, deduction: 2796000 },
      { limit: 17999000, rate: 0.33, deduction: 1536000 },
      { limit: 39999000, rate: 0.40, deduction: 2796000 },
      { limit: Infinity, rate: 0.45, deduction: 4796000 },
    ],
    // Thuế tái thiết 復興特別所得税 (2.1%)
    reconstructionTaxRate: 0.021,

    // 基礎控除 (Basic Deduction 2026 - 国税庁 No.1199)
    basicDeduction: {
      sourceId: 'nta-no1199-2026',
      standard: 1040000, // 104万円 cho thu nhập <= 132万円
      phases: [
        { maxTotalIncome: 1320000, amount: 1040000 },
        { maxTotalIncome: 3360000, amount: 880000 },
        { maxTotalIncome: 4890000, amount: 680000 },
        { maxTotalIncome: 6550000, amount: 630000 },
        { maxTotalIncome: 23500000, amount: 580000 },
        { maxTotalIncome: 24000000, amount: 480000 },
        { maxTotalIncome: 24500000, amount: 320000 },
        { maxTotalIncome: 25000000, amount: 160000 },
        { maxTotalIncome: Infinity, amount: 0 },
      ],
    },

    // 給与所得控除 (Employment Income Deduction 2026 - 国税庁 No.1410 令和8・9年分)
    employmentDeduction: {
      sourceId: 'nta-no1410-2026',
      minGuarantee: 740000, // Mức bảo đảm tối thiểu nâng lên 74万円 cho thu nhập <= 2.2M
      maxDeduction: 1950000, // Trần tối đa 195万円 cho thu nhập > 8.5M
      calc(salary) {
        const s = Math.max(0, salary);
        if (s <= 2200000) return 740000;
        if (s <= 3600000) return Math.floor(s * 0.30 + 80000);
        if (s <= 6600000) return Math.floor(s * 0.20 + 440000);
        if (s <= 8500000) return Math.floor(s * 0.10 + 1100000);
        return 1950000;
      },
    },

    // Khấu trừ người phụ thuộc & gia cảnh
    deductions: {
      spouseStandard: 380000,
      dependentGeneral: 380000,
      dependentSpecific: 630000,
      dependentElderlyCohabitant: 580000,
      dependentElderlyOther: 480000,
    },

    // Khấu trừ khai thuế xanh 青色申告特別控除
    blueReturnDeduction: {
      eTaxFull: 650000,
      paperFull: 550000,
      simplified: 100000,
      white: 0,
    },
  },

  // 2. 住民税 (Resident Tax - 総務省 / 地方税法)
  residentTax: {
    sourceId: 'soumu-resident-tax-std',
    standardIncomeLevy: 0.10,
    basicDeductionResident: 430000,
    perCapitaFlatStandard: 5000,
    forestryTax: 1000,
  },

  // 3. 社会保険料 (Social Insurance 2026 - Tách riêng biệt theo quy định nhà nước)
  socialInsurance: {
    // 国民年金 (National Pension - 日本年金機構)
    nationalPension: {
      sourceId: 'jps-national-pension-2026',
      monthly: 17920, // 令和8年度: 17,920円/tháng
      monthlyPremium: 17920,
      annual: 215040, // 17,920 * 12 = 215,040円/năm
      annualPremium: 215040,
      effectiveFrom: '2026-04-01',
      effectiveTo: '2027-03-31',
      applicablePeriod: { type: 'fiscal-year', from: 2026 },
    },

    // 雇用保険 (Employment Insurance - 厚生労働省 令和8年度)
    employmentInsurance: {
      sourceId: 'mhlw-employment-rate-2026',
      effectiveFrom: '2026-04-01',
      effectiveTo: '2027-03-31',
      applicablePeriod: { type: 'fiscal-year', from: 2026 },
      categories: {
        general: {
          name: '一般の事業',
          employeeRate: 0.005, // 5/1,000 (0.5%)
          employerRate: 0.0085, // 8.5/1,000 (0.85%)
          totalRate: 0.0135,
        },
        agriculture_forestry_sake: {
          name: '農林水産・清酒製造の事業',
          employeeRate: 0.006,
          employerRate: 0.0095,
          totalRate: 0.0155,
        },
        construction: {
          name: '建設の事業',
          employeeRate: 0.006,
          employerRate: 0.0105,
          totalRate: 0.0165,
        },
      },
      employeeRate: 0.005, // Mặc định ngành thông thường
    },

    // 子ども・子育て支援金 (Child Support Contribution - こども家庭庁 / 厚労省)
    childSupportContribution: {
      sourceId: 'cfa-child-support-2026',
      totalRate: 0.0023, // 0.23% toàn quốc từ 2026-04-01
      employeeRate: 0.00115, // 労使折半 (50%): 0.115%
      employerRate: 0.00115,
      effectiveFrom: '2026-04-01',
    },

    // 介護保険 (Nursing Care Insurance - 協会けんぽ 40-64 tuổi)
    careInsurance: {
      sourceId: 'kyoukaikenpo-care-insurance-2026',
      totalRate: 0.0162, // 1.62% toàn quốc cho 40-64 tuổi
      employeeRate: 0.0081, // 労使折半 (50%): 0.81%
      employerRate: 0.0081,
      minAge: 40,
      maxAge: 64,
    },

    // 厚生年金 (Welfare Pension)
    welfarePension: {
      totalRate: 0.183,
      employeeRate: 0.0915,
      employerRate: 0.0915,
      maxStandardMonthlyRemuneration: 650000,
      maxAnnualBaseSalary: 7800000,
    },
  },

  // 4. 個人事業税 (Individual Enterprise Tax)
  enterpriseTax: {
    proprietorDeductionAnnual: 2900000,
    rates: {
      type1: 0.05,
      type2: 0.04,
      type3_standard: 0.05,
      type3_reduced: 0.03,
      nonTaxable: 0.0,
    },
  },

  // 5. 消費税 (Consumption Tax)
  consumptionTax: {
    standardRate: 0.10,
    reducedRate: 0.08,
    thresholdSales: 10000000,
    simplifiedMaxSales: 50000000,
    deemedPurchaseRates: {
      type1_wholesale: 0.90,
      type2_retail: 0.80,
      type3_manufacturing: 0.70,
      type4_dining_other: 0.60,
      type5_service_it: 0.50,
      type6_realestate: 0.40,
    },
    special20PercentRule: {
      available: true,
      expiresDate: '2026-09-30',
      rate: 0.20,
    },
  },

  // 6. 法人税系 (Corporate Taxes) - Doanh nghiệp vừa và nhỏ (Vốn <= 100M yên)
  corporateTax: {
    nationalRateBelow8M: 0.15,
    nationalRateAbove8M: 0.232,
    localCorporateTaxRate: 0.103,
    residentTaxInhabitantRate: 0.07,
    residentPerCapitaMin: 70000,
    enterpriseTaxIncomeRates: [
      { limit: 4000000, rate: 0.035 },
      { limit: 8000000, rate: 0.053 },
      { limit: Infinity, rate: 0.070 },
    ],
    specialEnterpriseTaxRate: 0.37,
  },
};
