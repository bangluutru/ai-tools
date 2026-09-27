/**
 * @file packages/core/src/utils/tax/engines/socialInsuranceEngine.js
 * @description Deterministic engine ước tính các nghĩa vụ bảo hiểm xã hội (社会保険料) cả năm tại Nhật Bản
 * cho bộ mô phỏng thuế. TÁCH BIỆT RẠCH RÒI với thuế (không gọi bảo hiểm là thuế).
 *
 * - Nhân viên công ty: tính THEO TỪNG THÁNG PHÍ (月分) bằng engine bảo hiểm (標準報酬月額 + tỷ lệ theo tháng):
 *   協会けんぽ/介護 đổi từ phí tháng 3, 子ども・子育て支援金 từ phí tháng 4/2026, 雇用保険 từ tháng 4.
 *   Lương năm được chia đều 12 tháng (không tách thưởng) → kết quả là ƯỚC TÍNH (isEstimated: true).
 * - Tự do/kinh doanh: 国民健康保険 (ước tính, khác nhau theo địa phương) + 国民年金 (theo tháng).
 */

import { calculateSocialInsuranceSimulation } from '../../../japan/insurance/engines/socialInsuranceEngine.js';

const MONTHS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];

/** Gom các tỷ lệ đã dùng trong năm theo tháng: [{ rate, fromMonth, toMonth, months }] */
function collectRatePeriods(entries) {
  const periods = [];
  for (const { month, rate } of entries) {
    const last = periods[periods.length - 1];
    if (last && last.rate === rate) {
      last.toMonth = month;
      last.months += 1;
    } else {
      periods.push({ rate, fromMonth: month, toMonth: month, months: 1 });
    }
  }
  return periods;
}

/**
 * 国民健康保険 賦課限度額 (法定上限, 令和7年度): 基礎分66万 + 後期高齢者支援金分26万 + 介護分17万.
 * 令和8年度の上限額・子ども・子育て支援金分（国保）は未検証のため反映していません。
 */
export const NHI_ESTIMATE_PARAMS = Object.freeze({
  capUnder40: 920000,
  capWithCare: 1090000,
  capsVerifiedFiscalYear: 2025,
  deduction: 430000, // 旧ただし書き所得の基礎控除 43万円
  incomeRateUnder40: 0.078,
  incomeRateWithCare: 0.095,
  flatUnder40: 45000,
  flatWithCare: 58000,
});

/**
 * Tính toán nghĩa vụ bảo hiểm xã hội cho nhân viên công ty (会社員) hoặc cá nhân tự do (フリーランス)
 * @param {object} params
 * @param {object} params.rules - Tax rules của năm
 * @param {string} [params.profile='employee']
 * @param {number} [params.annualSalary=0]
 * @param {number} [params.businessIncome=0]
 * @param {string} [params.prefecture='tokyo']
 * @param {number} [params.age=30]
 * @param {boolean} [params.isEnrolledCompanySocial=true]
 * @param {string} [params.industryCategory='general']
 */
export function calculateSocialInsurance({
  rules: _rules,
  profile = 'employee',
  annualSalary = 0,
  businessIncome = 0,
  prefecture = 'tokyo',
  age = 30,
  isEnrolledCompanySocial = true,
  industryCategory = 'general',
}) {
  const year = Number(_rules?.year) || 2026;
  const numericAge = Number.isFinite(Number(age)) ? Number(age) : 30;
  const isCareAge = numericAge >= 40 && numericAge < 65;
  const isCompanyEmployee =
    profile === 'employee' ||
    profile === 'employee_side' ||
    profile === 'corporate_executive' ||
    (profile === 'part_time' && isEnrolledCompanySocial);

  // -------------------------------------------------------------
  // TRƯỜNG HỢP 1: Nhân viên công ty (労使折半) — tính theo 12 tháng phí
  // -------------------------------------------------------------
  if (isCompanyEmployee && annualSalary > 0) {
    const salary = Math.max(0, Number(annualSalary) || 0);
    const monthlySalary = Math.floor(salary / 12);
    const isExecutive = profile === 'corporate_executive';

    const totals = {
      healthInsurance: 0,
      childSupportContribution: 0,
      careInsurance: 0,
      welfarePension: 0,
      employmentInsurance: 0,
      employer: 0,
    };
    const healthRates = [];
    const careRates = [];
    const childRates = [];
    const employmentRates = [];
    let pensionEmployeeRate = 0;
    let kenpoGrade = null;
    let pensionGrade = null;
    let childSupportMonths = 0;
    const periodNotices = new Set();

    for (const mm of MONTHS) {
      const month = `${year}-${mm}`;
      const sim = calculateSocialInsuranceSimulation({
        monthlySalary,
        prefecture,
        age: numericAge,
        industryCategory,
        applicableDate: `${month}-01`,
      });
      const m = sim.monthly;
      const employment = isExecutive ? 0 : m.employmentInsurance.employee;
      totals.healthInsurance += m.healthInsurance.employee;
      totals.childSupportContribution += m.childSupportFund.employee;
      totals.careInsurance += m.careInsurance.employee;
      totals.welfarePension += m.welfarePension.employee;
      totals.employmentInsurance += employment;
      totals.employer += m.employerTotal - (isExecutive ? m.employmentInsurance.employer : 0);

      healthRates.push({ month, rate: m.healthInsurance.isApplicable ? m.healthInsurance.rate : 0 });
      careRates.push({ month, rate: m.careInsurance.rate });
      childRates.push({ month, rate: m.childSupportFund.rate });
      employmentRates.push({ month, rate: isExecutive ? 0 : m.employmentInsurance.employeeRate });
      if (m.childSupportFund.employee > 0) childSupportMonths += 1;
      pensionEmployeeRate = m.welfarePension.isApplicable ? m.welfarePension.employeeRate : 0;
      kenpoGrade = sim.grades.kenpo;
      pensionGrade = sim.grades.pension;
      if (sim.disclosures.periodNotice) periodNotices.add(sim.disclosures.periodNotice);
    }

    const totalSocialInsurance =
      totals.healthInsurance +
      totals.childSupportContribution +
      totals.careInsurance +
      totals.welfarePension +
      totals.employmentInsurance;

    return {
      type: 'company_employee',
      isCompanyEmployee: true,
      healthInsurance: totals.healthInsurance,
      childSupportContribution: totals.childSupportContribution,
      careInsurance: totals.careInsurance,
      welfarePension: totals.welfarePension,
      employmentInsurance: totals.employmentInsurance,
      nationalHealthInsurance: 0,
      nationalPension: 0,
      totalSocialInsurance,
      employerContribution: totals.employer,
      monthlySalaryAssumed: monthlySalary,
      standardMonthly: {
        kenpo: kenpoGrade?.standardMonthly || 0,
        kenpoGrade: kenpoGrade?.grade || null,
        pension: numericAge < 70 ? (pensionGrade?.standardMonthly || 0) : 0,
        pensionGrade: numericAge < 70 ? (pensionGrade?.grade || null) : null,
      },
      rates: {
        health: collectRatePeriods(healthRates),
        care: isCareAge ? collectRatePeriods(careRates) : [],
        childSupport: collectRatePeriods(childRates),
        pensionEmployee: pensionEmployeeRate,
        employmentEmployee: collectRatePeriods(employmentRates),
      },
      childSupportMonths,
      ageFlags: {
        isCareAge,
        isPensionApplicable: numericAge < 70,
        isHealthApplicable: numericAge < 75,
      },
      isEstimated: true,
      estimatedLabel: 'Estimated (annual salary ÷ 12, standard monthly remuneration grades, no bonus split) / 概算（年収÷12・標準報酬月額・賞与区分なし）',
      periodNotices: Array.from(periodNotices),
      rulesYear: year,
    };
  }

  // -------------------------------------------------------------
  // TRƯỜNG HỢP 2: Cá nhân tự do / Hộ kinh doanh (国民健康保険 + 国民年金)
  // -------------------------------------------------------------
  const netIncome = Math.max(0, Number(businessIncome) || Number(annualSalary) || 0);
  const p = NHI_ESTIMATE_PARAMS;

  // 1. 国民健康保険 (ước tính: 所得割 + 均等割, áp trần 賦課限度額). 75 tuổi trở lên → 後期高齢者医療 (không tính).
  let nationalHealthInsurance = 0;
  if (numericAge < 75) {
    const nhTaxableIncome = Math.max(0, netIncome - p.deduction);
    const incomeRate = isCareAge ? p.incomeRateWithCare : p.incomeRateUnder40;
    const flatAmount = isCareAge ? p.flatWithCare : p.flatUnder40;
    const rawKokuminKenpo = Math.floor(nhTaxableIncome * incomeRate) + flatAmount;
    nationalHealthInsurance = Math.min(isCareAge ? p.capWithCare : p.capUnder40, rawKokuminKenpo);
  }

  // 2. 国民年金: theo tháng (tháng 1〜3 = mức năm tài chính trước, 4〜12 = năm tài chính hiện hành); chỉ 20〜59 tuổi
  const np = _rules?.socialInsurance?.nationalPension || {};
  const currentMonthly = np.monthlyPremium ?? 17920;
  const previousMonthly = np.previousMonthlyPremium ?? currentMonthly;
  const isPensionAge = numericAge >= 20 && numericAge < 60;
  const nationalPension = isPensionAge ? previousMonthly * 3 + currentMonthly * 9 : 0;

  const totalSocialInsurance = nationalHealthInsurance + nationalPension;

  return {
    type: 'national_self_employed',
    isCompanyEmployee: false,
    healthInsurance: 0,
    childSupportContribution: 0,
    careInsurance: 0,
    welfarePension: 0,
    employmentInsurance: 0,
    nationalHealthInsurance,
    nationalPension,
    nationalPensionMonthly: { previous: previousMonthly, current: currentMonthly, previousMonths: 3, currentMonths: 9 },
    totalSocialInsurance,
    employerContribution: 0,
    ageFlags: { isCareAge, isPensionApplicable: isPensionAge, isHealthApplicable: numericAge < 75 },
    isEstimated: true,
    estimatedLabel: 'Estimated National Health Insurance / 国民健康保険（概算）',
    disclosureNote: '国民健康保険料は市区町村ごとに料率・均等割が異なります。上限額は令和7年度の法定上限（基礎分66万円・支援金分26万円・介護分17万円）を仮に適用しており、令和8年度の上限額および国保の子ども・子育て支援金分は反映していません。',
    disclosureNote_vi: 'Phí BHYT quốc dân khác nhau theo từng địa phương. Trần phí đang dùng mức luật định năm tài chính 2025 (66+26+17 vạn yên); trần 2026 và phần tiền hỗ trợ trẻ em của 国保 chưa được xác minh nên chưa phản ánh.',
    rulesYear: year,
  };
}
