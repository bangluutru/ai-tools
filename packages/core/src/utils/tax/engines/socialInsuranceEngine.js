/**
 * @file packages/core/src/utils/tax/engines/socialInsuranceEngine.js
 * @description Deterministic engine tính các nghĩa vụ bảo hiểm xã hội (社会保険料) tại Nhật Bản.
 * TÁCH BIỆT RẠCH RÒI với thuế (không gọi bảo hiểm là thuế).
 * Hỗ trợ chế độ nhân viên công ty (健康保険 協会けんぽ, 厚生年金, 雇用保険, 介護保険)
 * và chế độ tự do/kinh doanh (国民健康保険, 国民年金).
 */

import { getLocationRules } from '../taxRulesRegistry.js';

/**
 * Tính toán nghĩa vụ bảo hiểm xã hội cho nhân viên công ty (会社員) hoặc cá nhân tự do (フリーランス)
 * @param {object} params
 * @param {object} params.rules - Tax rules của năm
 * @param {string} [params.profile='employee'] - 'employee' (会社員), 'part_time' (パート), 'freelance' (フリーランス/個人事業主)
 * @param {number} [params.annualSalary=0] - Thu nhập lương gộp năm (cho nhân viên)
 * @param {number} [params.businessIncome=0] - Thu nhập kinh doanh (cho tự do)
 * @param {string} [params.prefecture='tokyo'] - Tỉnh thành
 * @param {number} [params.age=30] - Độ tuổi (nếu >= 40 tuổi sẽ cộng thêm bảo hiểm chăm sóc 介護保険)
 * @param {boolean} [params.isEnrolledCompanySocial=true] - Đối với part-time: có tham gia BHXH công ty không
 * @returns {object} Chi tiết từng loại phí bảo hiểm
 */
export function calculateSocialInsurance({
  rules: _rules,
  profile = 'employee',
  annualSalary = 0,
  businessIncome = 0,
  prefecture = 'tokyo',
  age = 30,
  isEnrolledCompanySocial = true,
}) {
  const loc = getLocationRules(prefecture);
  const isOver40 = Number(age) >= 40 && Number(age) < 65;
  const isCompanyEmployee =
    profile === 'employee' ||
    profile === 'employee_side' ||
    profile === 'corporate_executive' ||
    (profile === 'part_time' && isEnrolledCompanySocial);

  // -------------------------------------------------------------
  // TRƯỜNG HỢP 1: Nhân viên công ty (Bảo hiểm xã hội đoàn thể - 労使折半)
  // -------------------------------------------------------------
  if (isCompanyEmployee && annualSalary > 0) {
    const salary = Math.max(0, Number(annualSalary) || 0);

    // 1. 健康保険 (Health Insurance) - 協会けんぽ (khoảng 9.8% - 10.4%, chia đôi)
    const kenpoTotalRate = loc.socialInsurance.kenpoRate || 0.10;
    const kenpoEmployeeRate = kenpoTotalRate / 2;
    const healthInsurance = Math.floor(salary * kenpoEmployeeRate);

    // 2. 介護保険 (Nursing Care Insurance) - Dành cho người từ 40 - 64 tuổi (~1.60%, chia đôi -> 0.8%)
    const careTotalRate = loc.socialInsurance.careInsuranceRate || 0.0160;
    const careInsurance = isOver40 ? Math.floor(salary * (careTotalRate / 2)) : 0;

    // 3. 厚生年金 (Welfare Pension) - 18.3% chia đôi = 9.15% (Trần mức lương tháng 65万円 = 780万円/năm)
    const PENSION_MAX_BASE = 7800000;
    const pensionBaseSalary = Math.min(salary, PENSION_MAX_BASE);
    const pensionEmployeeRate = (loc.socialInsurance.pensionRate || 0.183) / 2;
    const welfarePension = Math.floor(pensionBaseSalary * pensionEmployeeRate);

    // 4. 雇用保険 (Employment Insurance) - 0.6% phần nhân viên
    const empRate = loc.socialInsurance.employmentRate || 0.006;
    const employmentInsurance = Math.floor(salary * empRate);

    // Tổng phí bảo hiểm người lao động chịu
    const totalSocialInsurance =
      healthInsurance +
      careInsurance +
      welfarePension +
      employmentInsurance;

    return {
      type: 'company_employee',
      isCompanyEmployee: true,
      healthInsurance,
      careInsurance,
      welfarePension,
      employmentInsurance,
      nationalHealthInsurance: 0,
      nationalPension: 0,
      totalSocialInsurance,
      employerContribution: healthInsurance + careInsurance + welfarePension + Math.floor(salary * 0.0095), // Chủ sử dụng trả phần tương đương
    };
  }

  // -------------------------------------------------------------
  // TRƯỜNG HỢP 2: Cá nhân tự do / Hộ kinh doanh (国民健康保険 + 国民年金)
  // -------------------------------------------------------------
  const netIncome = Math.max(0, Number(businessIncome) || Number(annualSalary) || 0);

  // 1. 国民健康保険 (National Health Insurance):
  // Gồm 所得割 (khoảng 8% - 9% thu nhập tính thuế) + 均等割 (khoảng 45,000円) + 介護割 nếu >= 40 tuổi
  // Khấu trừ cơ bản khi tính BHYT Quốc dân: 43万円
  const nhTaxableIncome = Math.max(0, netIncome - 430000);
  const incomeRate = isOver40 ? 0.095 : 0.078;
  const flatAmount = isOver40 ? 58000 : 45000;
  const rawKokuminKenpo = Math.floor(nhTaxableIncome * incomeRate) + flatAmount;
  // Áp dụng trần tối đa (賦課限度額 khoảng 104万円/năm)
  const nationalHealthInsurance = Math.min(1040000, rawKokuminKenpo);

  // 2. 国民年金 (National Pension): Khoảng 17,510円/tháng = 210,120円/năm
  const monthlyPension = loc.socialInsurance.nationalPensionMonthly || 17510;
  const nationalPension = monthlyPension * 12;

  const totalSocialInsurance = nationalHealthInsurance + nationalPension;

  return {
    type: 'national_self_employed',
    isCompanyEmployee: false,
    healthInsurance: 0,
    careInsurance: 0,
    welfarePension: 0,
    employmentInsurance: 0,
    nationalHealthInsurance,
    nationalPension,
    totalSocialInsurance,
    employerContribution: 0,
  };
}
