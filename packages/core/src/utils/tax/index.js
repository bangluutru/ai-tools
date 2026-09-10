/**
 * @file packages/core/src/utils/tax/index.js
 * @description Điểm xuất khẩu chính (Unified Public API) cho thư viện tính toán thuế Nhật Bản
 * "日本の税金ガイド・シミュレーター" trên AI-Tools.
 */

import {
  getTaxRules,
  getSupportedYearsMeta,
  getLocationRules,
  getAllPrefectures,
  DEFAULT_TAX_YEAR,
} from './taxRulesRegistry.js';

import {
  calculateIncomeTax,
  roundTaxableIncome,
  roundFinalTaxAmount,
} from './engines/incomeTaxEngine.js';

import {
  calculateResidentTax,
  isResidentTaxExempt,
} from './engines/residentTaxEngine.js';

import {
  calculateEnterpriseTax,
  BusinessCategories,
} from './engines/enterpriseTaxEngine.js';

import {
  calculateConsumptionTax,
  determineTaxableStatus,
  SimplifiedTaxCategories,
} from './engines/consumptionTaxEngine.js';

import {
  calculateCorporateTax,
} from './engines/corporateTaxEngine.js';

import {
  calculateSocialInsurance,
} from './engines/socialInsuranceEngine.js';

import {
  UserProfiles,
  inferApplicableTaxes,
  assessFilingNecessity,
} from './engines/taxContextEngine.js';

import { TaxKnowledgeBase } from './knowledge/taxKnowledgeBase.js';
import { TaxI18nStrings, getTaxI18n } from './knowledge/taxI18n.js';
import { exportTaxSimulationCsv } from './export/csvExporter.js';
import { generateTaxPdfReport } from './export/pdfReportGenerator.js';

/**
 * Hàm mô phỏng tài chính & thuế Nhật Bản toàn diện (Unified Deterministic Tax Simulator)
 * @param {object} formValues
 * @returns {object} Kết quả tính toán toàn diện, tóm tắt KPI và phân tích ngữ cảnh
 */
export function simulateJapanTaxes(formValues = {}) {
  const year = Number(formValues.year) || DEFAULT_TAX_YEAR;
  const rules = getTaxRules(year);
  const profile = formValues.profile || 'employee';
  const prefecture = formValues.prefecture || 'tokyo';

  const salary = Math.max(0, Number(formValues.salary) || 0);
  const businessRevenue = Math.max(0, Number(formValues.businessRevenue) || 0);
  const businessExpenses = Math.max(0, Number(formValues.businessExpenses) || 0);
  const blueReturnOption = formValues.blueReturnOption || (profile === 'sole_proprietor' ? 'etax_65' : 'white_0');
  const sideIncomeRevenue = Math.max(0, Number(formValues.sideIncomeRevenue) || 0);
  const sideIncomeExpenses = Math.max(0, Number(formValues.sideIncomeExpenses) || 0);
  const idecoMonthly = Math.max(0, Number(formValues.idecoMonthly) || 0);
  const dependentsCount = Math.max(0, Number(formValues.dependentsCount) || 0);
  const hasSpouse = Boolean(formValues.hasSpouse);
  const age = Number(formValues.age) || 30;

  // 1. Tính bảo hiểm xã hội trước (vì khoản này được khấu trừ 100% khi tính thuế thu nhập và thuế cư trú)
  const netBizBeforeTax = Math.max(0, businessRevenue - businessExpenses);
  const socialInsurance = calculateSocialInsurance({
    rules,
    profile,
    annualSalary: salary,
    businessIncome: netBizBeforeTax,
    prefecture,
    age,
    isEnrolledCompanySocial: formValues.isEnrolledCompanySocial !== false,
  });

  const socialInsurancePaid = socialInsurance.totalSocialInsurance;

  // 2. Tính thuế thu nhập cá nhân & thuế tái thiết (所得税・復興特別所得税)
  const incomeTax = calculateIncomeTax({
    rules,
    salary,
    businessRevenue,
    businessExpenses,
    blueReturnOption,
    sideIncomeRevenue,
    sideIncomeExpenses,
    socialInsurancePaid,
    idecoMonthly,
    dependentsCount,
    hasSpouse,
  });

  // 3. Tính thuế cư trú cá nhân (住民税)
  const residentTax = calculateResidentTax({
    rules,
    prefecture,
    totalGrossIncome: incomeTax.totalGrossIncome,
    socialInsurancePaid,
    idecoMonthly,
    dependentsCount,
    hasSpouse,
  });

  // 4. Tính thuế kinh doanh cá nhân (個人事業税)
  let enterpriseTax = null;
  if (profile === 'sole_proprietor' || (profile === 'freelance' && netBizBeforeTax > 2900000)) {
    enterpriseTax = calculateEnterpriseTax({
      rules,
      businessIncome: netBizBeforeTax,
      categoryId: formValues.businessCategoryId || 'type1_retail_dining',
      operatingMonths: formValues.operatingMonths || 12,
    });
  }

  // 5. Tính thuế tiêu thụ (消費税)
  let consumptionTax = null;
  if (['sole_proprietor', 'corporate', 'freelance'].includes(profile)) {
    consumptionTax = calculateConsumptionTax({
      rules,
      taxableSales: businessRevenue || formValues.sales || 0,
      taxablePurchases: formValues.taxablePurchases || 0,
      basePeriodSales: formValues.basePeriodSales || 0,
      isInvoiceRegistered: Boolean(formValues.isInvoiceRegistered),
      calcMethod: formValues.consumptionMethod || (formValues.isInvoiceRegistered ? 'special_20' : 'standard'),
      simplifiedCatId: formValues.simplifiedCatId || 'cat5_service_it',
    });
  }

  // 6. Tính thuế doanh nghiệp (法人税系) nếu là profile Pháp nhân
  let corporateTax = null;
  if (profile === 'corporate') {
    corporateTax = calculateCorporateTax({
      rules,
      corporateIncome: formValues.corporateIncome || 0,
      capital: formValues.capital || 10000000,
      employeeCount: formValues.employeeCount || 10,
    });
  }

  // 7. Tổng hợp các chỉ số tài chính (Summary KPIs)
  const grossEarnings = profile === 'corporate'
    ? (Number(formValues.corporateIncome) || 0)
    : (salary + businessRevenue + sideIncomeRevenue);

  const totalTaxes =
    incomeTax.totalIncomeTax +
    residentTax.totalResidentTax +
    (enterpriseTax?.enterpriseTax || 0) +
    (consumptionTax?.payableTax || 0) +
    (corporateTax?.totalCorporateTax || 0);

  const totalFinancialBurden = totalTaxes + socialInsurancePaid;
  const netTakeHome = Math.max(0, grossEarnings - totalFinancialBurden);
  const effectiveBurdenRate = grossEarnings > 0 ? totalFinancialBurden / grossEarnings : 0;

  // 8. Suy luận các loại thuế liên quan theo ngữ cảnh
  const applicableTaxes = inferApplicableTaxes(profile, formValues);

  // 9. Chẩn đoán nghĩa vụ quyết toán thuế (確定申告判定)
  const filingNecessity = assessFilingNecessity({
    profile,
    annualSalary: salary,
    hasYearEndAdjustment: formValues.hasYearEndAdjustment !== false,
    employersCount: Number(formValues.employersCount) || 1,
    sideIncomeProfit: Math.max(0, sideIncomeRevenue - sideIncomeExpenses),
    hasBusinessIncome: businessRevenue > 0,
    businessNetProfit: netBizBeforeTax,
    isBlueReturn: blueReturnOption.startsWith('etax') || blueReturnOption.startsWith('paper'),
    hasMedicalExpensesOver100k: Boolean(formValues.hasMedicalExpensesOver100k),
    hasFurusatoNozeiOver5Cities: Boolean(formValues.hasFurusatoNozeiOver5Cities),
    isFirstYearHousingLoan: Boolean(formValues.isFirstYearHousingLoan),
  });

  return {
    year,
    rules,
    profile,
    prefecture,
    incomeTax,
    residentTax,
    enterpriseTax,
    consumptionTax,
    corporateTax,
    socialInsurance,
    summary: {
      grossEarnings,
      totalTaxes,
      totalSocialInsurance: socialInsurancePaid,
      totalFinancialBurden,
      netTakeHome,
      effectiveBurdenRate,
    },
    applicableTaxes,
    filingNecessity,
  };
}

export {
  getTaxRules,
  getSupportedYearsMeta,
  getLocationRules,
  getAllPrefectures,
  DEFAULT_TAX_YEAR,
  calculateIncomeTax,
  roundTaxableIncome,
  roundFinalTaxAmount,
  calculateResidentTax,
  isResidentTaxExempt,
  calculateEnterpriseTax,
  BusinessCategories,
  calculateConsumptionTax,
  determineTaxableStatus,
  SimplifiedTaxCategories,
  calculateCorporateTax,
  calculateSocialInsurance,
  UserProfiles,
  inferApplicableTaxes,
  assessFilingNecessity,
  TaxKnowledgeBase,
  TaxI18nStrings,
  getTaxI18n,
  exportTaxSimulationCsv,
  generateTaxPdfReport,
};
