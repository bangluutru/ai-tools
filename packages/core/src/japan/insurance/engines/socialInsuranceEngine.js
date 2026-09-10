/**
 * @file packages/core/src/japan/insurance/engines/socialInsuranceEngine.js
 * @description Deterministic engine tính phí bảo hiểm xã hội chuẩn Nhật Bản (社会保険料シミュレーター).
 * Phân định chính xác:
 * - 給与 (Actual gross remuneration) vs 標準報酬月額 (Standard monthly remuneration grade)
 * - 賞与 (Actual bonus) vs 標準賞与額 (Standard bonus with annual/per-payment caps)
 * - Tách bạch rõ 5 hạng mục:
 *   1. 健康保険 (協会けんぽ 47 tỉnh thành)
 *   2. 子ども・子育て支援金 (Mới từ 2026)
 *   3. 介護保険 (Độ tuổi 40〜64 tuổi)
 *   4. 厚生年金 (1〜32等級)
 *   5. 雇用保険 (3 khối ngành nghề)
 *   + 子ども・子育て拠出金 (100% NSDLĐ)
 * - Đầy đủ 2 góc nhìn: Người lao động (従業員控除) vs Người sử dụng lao động (会社負担).
 */

import { lookupKenpoGrade, lookupPensionGrade, calculateStandardBonus } from './standardRemunerationEngine.js';
import { resolveKenpoRate } from '../rules/kyokaiKenpoRates.js';
import { resolveCareInsuranceRate } from '../rules/careInsuranceRates.js';
import { resolveChildSupportRate } from '../rules/childSupportRates.js';
import { resolveWelfarePensionRate } from '../rules/welfarePensionRates.js';
import { resolveEmploymentInsuranceRate } from '../rules/employmentInsuranceRates.js';

/**
 * Tính toán toàn diện nghĩa vụ bảo hiểm xã hội
 * @param {object} params
 * @param {number} params.monthlySalary - Tiền lương thực tế hàng tháng (円)
 * @param {number} [params.actualBonus=0] - Tiền thưởng mỗi lần (円)
 * @param {string} [params.prefecture='tokyo'] - Mã tỉnh thành (tokyo, fukuoka, osaka, v.v.)
 * @param {number} [params.age=30] - Tuổi của người lao động
 * @param {string} [params.industryCategory='general'] - 'general' | 'agriculture_forestry_fishery' | 'construction'
 * @param {string} [params.applicableDate='2026-04-01'] - Ngày/thời điểm áp dụng (YYYY-MM-DD)
 * @param {number} [params.previousBonusesInFiscalYear=0] - Tổng thưởng Kenpo đã nhận trong năm tài chính
 * @returns {object} Chi tiết từng khoản phí và tổng hợp 2 góc nhìn
 */
export function calculateSocialInsuranceSimulation({
  monthlySalary = 0,
  actualBonus = 0,
  prefecture = 'tokyo',
  age = 30,
  industryCategory = 'general',
  applicableDate = '2026-04-01',
  previousBonusesInFiscalYear = 0,
}) {
  const salary = Math.max(0, Number(monthlySalary) || 0);
  const bonus = Math.max(0, Number(actualBonus) || 0);
  const empAge = Number(age) || 0;
  const dateStr = applicableDate ? String(applicableDate).substring(0, 10) : '2026-04-01';

  // 1. Xác định bậc chuẩn thù lao tháng
  const kenpoGrade = lookupKenpoGrade(salary);
  const pensionGrade = lookupPensionGrade(salary);
  const kenpoMonthlyBase = salary > 0 ? kenpoGrade.standardMonthly : 0;
  const pensionMonthlyBase = salary > 0 ? pensionGrade.standardMonthly : 0;

  // 2. Xác định tiền thưởng chuẩn
  const bonusInfo = calculateStandardBonus({
    actualBonus: bonus,
    previousBonusesInFiscalYear,
  });

  // 3. Tra cứu biểu tỷ lệ theo quy chuẩn chính thức
  const kenpoRule = resolveKenpoRate(prefecture, dateStr);
  const careRule = resolveCareInsuranceRate(empAge, dateStr);
  const childRule = resolveChildSupportRate(dateStr);
  const pensionRule = resolveWelfarePensionRate(dateStr);
  const empRule = resolveEmploymentInsuranceRate(industryCategory, dateStr);

  // -------------------------------------------------------------
  // A. PHẦN TÍNH THEO LƯƠNG HÀNG THÁNG (Monthly Remuneration)
  // -------------------------------------------------------------

  // 1. 健康保険 (Health Insurance)
  const healthMonthlyEmployee = Math.floor(kenpoMonthlyBase * kenpoRule.employeeRate);
  const healthMonthlyEmployer = Math.floor(kenpoMonthlyBase * kenpoRule.employerRate);

  // 2. 子ども・子育て支援金 (Child Support Fund - Tách riêng từ 2026)
  const childSupportMonthlyEmployee = Math.floor(kenpoMonthlyBase * childRule.employeeRate);
  const childSupportMonthlyEmployer = Math.floor(kenpoMonthlyBase * childRule.employerRate);

  // 3. 介護保険 (Nursing Care Insurance - 40〜64 tuổi)
  const careMonthlyEmployee = Math.floor(kenpoMonthlyBase * careRule.employeeRate);
  const careMonthlyEmployer = Math.floor(kenpoMonthlyBase * careRule.employerRate);

  // 4. 厚生年金 (Welfare Pension)
  const pensionMonthlyEmployee = Math.floor(pensionMonthlyBase * pensionRule.employeeRate);
  const pensionMonthlyEmployer = Math.floor(pensionMonthlyBase * pensionRule.employerRate);

  // 5. 雇用保険 (Employment Insurance - Tính trên tổng tiền lương thực tế, làm tròn 50 sen)
  const employmentMonthlyEmployee = Math.round(salary * empRule.employeeRate);
  const employmentMonthlyEmployer = Math.round(salary * empRule.employerRate);

  // 6. 子ども・子育て拠出金 (Child Welfare Contribution - 100% NSDLĐ)
  const childWelfareMonthlyEmployer = Math.floor(pensionMonthlyBase * childRule.childWelfareEmployerOnlyRate);

  const monthlyEmployeeTotal =
    healthMonthlyEmployee +
    childSupportMonthlyEmployee +
    careMonthlyEmployee +
    pensionMonthlyEmployee +
    employmentMonthlyEmployee;

  const monthlyEmployerTotal =
    healthMonthlyEmployer +
    childSupportMonthlyEmployer +
    careMonthlyEmployer +
    pensionMonthlyEmployer +
    employmentMonthlyEmployer +
    childWelfareMonthlyEmployer;

  // -------------------------------------------------------------
  // B. PHẦN TÍNH THEO THƯỞNG (Bonus, nếu có)
  // -------------------------------------------------------------
  const healthBonusEmployee = Math.floor(bonusInfo.kenpoStandardBonus * kenpoRule.employeeRate);
  const healthBonusEmployer = Math.floor(bonusInfo.kenpoStandardBonus * kenpoRule.employerRate);

  const childSupportBonusEmployee = Math.floor(bonusInfo.kenpoStandardBonus * childRule.employeeRate);
  const childSupportBonusEmployer = Math.floor(bonusInfo.kenpoStandardBonus * childRule.employerRate);

  const careBonusEmployee = Math.floor(bonusInfo.kenpoStandardBonus * careRule.employeeRate);
  const careBonusEmployer = Math.floor(bonusInfo.kenpoStandardBonus * careRule.employerRate);

  const pensionBonusEmployee = Math.floor(bonusInfo.pensionStandardBonus * pensionRule.employeeRate);
  const pensionBonusEmployer = Math.floor(bonusInfo.pensionStandardBonus * pensionRule.employerRate);

  const employmentBonusEmployee = Math.round(bonus * empRule.employeeRate);
  const employmentBonusEmployer = Math.round(bonus * empRule.employerRate);

  const childWelfareBonusEmployer = Math.floor(bonusInfo.pensionStandardBonus * childRule.childWelfareEmployerOnlyRate);

  const bonusEmployeeTotal =
    healthBonusEmployee +
    childSupportBonusEmployee +
    careBonusEmployee +
    pensionBonusEmployee +
    employmentBonusEmployee;

  const bonusEmployerTotal =
    healthBonusEmployer +
    childSupportBonusEmployer +
    careBonusEmployer +
    pensionBonusEmployer +
    employmentBonusEmployer +
    childWelfareBonusEmployer;

  // -------------------------------------------------------------
  // C. TỔNG HỢP (Grand Totals & Breakdown)
  // -------------------------------------------------------------
  const totalEmployeeDeduction = monthlyEmployeeTotal + bonusEmployeeTotal;
  const totalEmployerExpense = monthlyEmployerTotal + bonusEmployerTotal;
  const totalEmploymentCost = salary + bonus + totalEmployerExpense;
  const estimatedTakeHomeBeforeTax = salary + bonus - totalEmployeeDeduction;

  return {
    applicableDate: dateStr,
    prefecture: kenpoRule.prefecture,
    age: empAge,
    industryCategory: empRule.industry,
    confidence: 'official-table based',

    // Thông tin các bậc chuẩn
    grades: {
      kenpo: kenpoGrade,
      pension: pensionGrade,
      bonus: bonusInfo,
    },

    // Chi tiết từng loại bảo hiểm (Lương tháng)
    monthly: {
      actualSalary: salary,
      healthInsurance: {
        id: 'health_insurance',
        nameJa: '健康保険料（基本分）',
        nameVi: 'Bảo hiểm Y tế (Phần cơ bản)',
        nameEn: 'Health Insurance (Basic)',
        standardBase: kenpoMonthlyBase,
        rate: kenpoRule.totalRate,
        employeeRate: kenpoRule.employeeRate,
        employerRate: kenpoRule.employerRate,
        employee: healthMonthlyEmployee,
        employer: healthMonthlyEmployer,
        total: healthMonthlyEmployee + healthMonthlyEmployer,
      },
      childSupportFund: {
        id: 'child_support_fund',
        nameJa: '子ども・子育て支援金',
        nameVi: 'Tiền đóng góp hỗ trợ nuôi dạy trẻ em',
        nameEn: 'Child & Family Support Fund',
        standardBase: kenpoMonthlyBase,
        rate: childRule.totalRate,
        employeeRate: childRule.employeeRate,
        employerRate: childRule.employerRate,
        employee: childSupportMonthlyEmployee,
        employer: childSupportMonthlyEmployer,
        total: childSupportMonthlyEmployee + childSupportMonthlyEmployer,
        isIntroduced: childRule.isIntroduced,
      },
      careInsurance: {
        id: 'care_insurance',
        nameJa: '介護保険料',
        nameVi: 'Bảo hiểm chăm sóc dài hạn',
        nameEn: 'Long-term Care Insurance',
        standardBase: careRule.isApplicable ? kenpoMonthlyBase : 0,
        rate: careRule.totalRate,
        employeeRate: careRule.employeeRate,
        employerRate: careRule.employerRate,
        employee: careMonthlyEmployee,
        employer: careMonthlyEmployer,
        total: careMonthlyEmployee + careMonthlyEmployer,
        isApplicable: careRule.isApplicable,
        category: careRule.category,
        categoryLabelJa: careRule.categoryLabelJa,
        notes: careRule.notes,
      },
      welfarePension: {
        id: 'welfare_pension',
        nameJa: '厚生年金保険料',
        nameVi: 'Hưu trí Phúc lợi',
        nameEn: 'Welfare Pension Insurance',
        standardBase: pensionMonthlyBase,
        rate: pensionRule.totalRate,
        employeeRate: pensionRule.employeeRate,
        employerRate: pensionRule.employerRate,
        employee: pensionMonthlyEmployee,
        employer: pensionMonthlyEmployer,
        total: pensionMonthlyEmployee + pensionMonthlyEmployer,
        isCapped: pensionGrade.isCapped,
      },
      employmentInsurance: {
        id: 'employment_insurance',
        nameJa: '雇用保険料',
        nameVi: 'Bảo hiểm Thất nghiệp',
        nameEn: 'Employment Insurance',
        actualBase: salary,
        employeeRate: empRule.employeeRate,
        employerRate: empRule.employerRate,
        employee: employmentMonthlyEmployee,
        employer: employmentMonthlyEmployer,
        total: employmentMonthlyEmployee + employmentMonthlyEmployer,
      },
      childWelfareContribution: {
        id: 'child_welfare_contribution',
        nameJa: '子ども・子育て拠出金（旧児童手当拠出金）',
        nameVi: 'Tiền đóng góp phúc lợi trẻ em (Công ty chịu 100%)',
        nameEn: 'Child Welfare Contribution (Employer 100%)',
        standardBase: pensionMonthlyBase,
        rate: childRule.childWelfareEmployerOnlyRate,
        employeeRate: 0,
        employerRate: childRule.childWelfareEmployerOnlyRate,
        employee: 0,
        employer: childWelfareMonthlyEmployer,
        total: childWelfareMonthlyEmployer,
        isEmployerOnly: true,
      },
      employeeTotal: monthlyEmployeeTotal,
      employerTotal: monthlyEmployerTotal,
      totalEmploymentCost: salary + monthlyEmployerTotal,
      netBeforeTax: salary - monthlyEmployeeTotal,
    },

    // Chi tiết từng loại bảo hiểm (Thưởng)
    bonus: bonus > 0 ? {
      actualBonus: bonus,
      healthInsurance: {
        standardBase: bonusInfo.kenpoStandardBonus,
        employee: healthBonusEmployee,
        employer: healthBonusEmployer,
        total: healthBonusEmployee + healthBonusEmployer,
      },
      childSupportFund: {
        standardBase: bonusInfo.kenpoStandardBonus,
        employee: childSupportBonusEmployee,
        employer: childSupportBonusEmployer,
        total: childSupportBonusEmployee + childSupportBonusEmployer,
      },
      careInsurance: {
        standardBase: careRule.isApplicable ? bonusInfo.kenpoStandardBonus : 0,
        employee: careBonusEmployee,
        employer: careBonusEmployer,
        total: careBonusEmployee + careBonusEmployer,
      },
      welfarePension: {
        standardBase: bonusInfo.pensionStandardBonus,
        employee: pensionBonusEmployee,
        employer: pensionBonusEmployer,
        total: pensionBonusEmployee + pensionBonusEmployer,
      },
      employmentInsurance: {
        actualBase: bonus,
        employee: employmentBonusEmployee,
        employer: employmentBonusEmployer,
        total: employmentBonusEmployee + employmentBonusEmployer,
      },
      childWelfareContribution: {
        standardBase: bonusInfo.pensionStandardBonus,
        employee: 0,
        employer: childWelfareBonusEmployer,
        total: childWelfareBonusEmployer,
      },
      employeeTotal: bonusEmployeeTotal,
      employerTotal: bonusEmployerTotal,
      totalEmploymentCost: bonus + bonusEmployerTotal,
      netBeforeTax: bonus - bonusEmployeeTotal,
    } : null,

    // Tổng cộng (Lương + Thưởng)
    grandTotals: {
      grossIncome: salary + bonus,
      employeeDeductionTotal: totalEmployeeDeduction,
      employerContributionTotal: totalEmployerExpense,
      totalEmploymentCost,
      estimatedTakeHomeBeforeTax,
    },

    // Công bố pháp lý & Nguồn trích dẫn
    disclosures: {
      confidence: 'official-table based',
      disclosureJa:
        '本試算は全国健康保険協会（協会けんぽ）および日本年金機構の公式料率・標準報酬月額等級表に基づいています。実際の給与計算では、定時決定（4〜6月の算定基礎）や随時改定（月額変更）、50銭端数処理ルールにより、若干の差異が生じる場合があります。',
      disclosureVi:
        'Kết quả tính dựa trên bảng chuẩn thù lao chính thức của Kyokai Kenpo & Japan Pension Service. Thực tế bảng lương có thể chênh lệch nhỏ do chu kỳ xác định thù lao định kỳ hoặc quy tắc làm tròn 50 sen.',
      disclosureEn:
        'Estimates are calculated using official tables from Kyokai Kenpo and Japan Pension Service. Actual payroll amounts may slightly vary due to regular determination timing and fractional rounding.',
      officialSources: [
        'kyokai-kenpo-monthly-table-2026',
        'jps-welfare-pension-table-2026',
        'kyoukaikenpo-rates-2026',
        'mhlw-employment-rate-2026',
        'kyoukaikenpo-care-insurance-2026',
        'cfa-child-support-2026',
      ],
      periodNotice: kenpoRule.periodNotice || empRule.periodNotice || careRule.periodNotice || null,
    },
  };
}
