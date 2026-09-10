/**
 * @file packages/core/src/japan/family/engines/childAllowanceEngine.js
 * @description
 * Engine tính toán Trợ cấp Trẻ em Nhật Bản (児童手当シミュレーター)
 * Triển khai chính xác cải cách 10/2024 của Cơ quan Trẻ em và Gia đình (こども家庭庁):
 * 1. Bỏ trần thu nhập (所得制限撤廃) - 100% hộ gia đình đều được nhận đầy đủ.
 * 2. Mở rộng đến hết cấp 3 (18歳年度末まで支給).
 * 3. Con thứ 3 trở đi nhận 30,000円/tháng xuyên suốt đến hết cấp 3.
 * 4. Đếm thứ tự con (多子加算のカウント対象) tính con lớn đến hết 22 tuổi (22歳年度末) nếu có chu cấp kinh tế.
 * 5. Chi trả 6 lần/năm (tháng chẵn, mỗi lần 2 tháng).
 */

import { CHILD_ALLOWANCE_CONSTANTS } from '../rules/childAllowanceRules.js';

/**
 * Tính toán trợ cấp trẻ em cho hộ gia đình
 * @param {Object} params
 * @param {Array<Object>} params.children Danh sách các con trong gia đình
 * @param {string|number} [params.children[].id] Mã định danh con
 * @param {string} [params.children[].name] Tên hoặc nhãn con
 * @param {number} params.children[].age Tuổi hiện tại của con (0 đến 25)
 * @param {boolean} [params.children[].hasParentalSupport=true] Cha mẹ có chu cấp kinh tế không (áp dụng cho con 19-22 tuổi)
 * @param {number} [params.householdAnnualIncome=5000000] Thu nhập hộ gia đình (để đối chiếu lợi ích so với luật cũ)
 * @returns {Object} Kết quả chi tiết trợ cấp hàng tháng, năm, kỳ chi trả và so sánh cải cách
 */
export function calculateChildAllowance(params = {}) {
  const rawChildren = Array.isArray(params.children) ? params.children : [];
  const householdAnnualIncome = Number(params.householdAnnualIncome) || 0;

  if (rawChildren.length === 0) {
    return {
      hasChildren: false,
      eligibleChildrenCount: 0,
      countingSiblingsCount: 0,
      childrenDetails: [],
      totalMonthlyAllowance: 0,
      totalAnnualAllowance: 0,
      bimonthlyPayment: 0,
      disbursementSchedule: [],
      reformComparison: {
        preReformMonthlyAllowance: 0,
        postReformMonthlyAllowance: 0,
        monthlyGain: 0,
        annualGain: 0,
        incomeLimitAbolishedBenefit: false,
      },
      summaryTextJa: 'お子様の情報が入力されていません。',
      summaryTextVi: 'Chưa có thông tin con được nhập.',
      summaryTextEn: 'No child information provided.',
    };
  }

  // Chuẩn hóa và sắp xếp các con từ lớn đến nhỏ (giảm dần theo tuổi)
  const normalizedChildren = rawChildren.map((c, index) => ({
    id: c.id || `child-${index + 1}`,
    name: c.name || `Con thứ ${index + 1}`,
    age: Math.max(0, Number(c.age) || 0),
    hasParentalSupport: c.hasParentalSupport !== false,
  })).sort((a, b) => b.age - a.age);

  // Xác định các con được tính vào thứ tự đếm (Counting for sibling order)
  // Quy tắc: Đến 22 tuổi (22歳年度末) và cha mẹ có duy trì gánh nặng kinh tế (chu cấp sinh hoạt/học phí)
  let currentRank = 0;
  let preReformTotalMonthly = 0;

  const childrenDetails = normalizedChildren.map((child) => {
    const isUnder22 = child.age <= CHILD_ALLOWANCE_CONSTANTS.AGE_LIMITS.SIBLING_COUNT_MAX_AGE;
    const countsForSiblingOrder = isUnder22 && child.hasParentalSupport;

    let siblingRank = null;
    if (countsForSiblingOrder) {
      currentRank += 1;
      siblingRank = currentRank;
    }

    // Điều kiện nhận trợ cấp: Đến hết cấp 3 (18 tuổi / 18歳年度末)
    const isReceivingAllowance = child.age <= CHILD_ALLOWANCE_CONSTANTS.AGE_LIMITS.HIGH_SCHOOL_GRADUATION_AGE;

    let monthlyAllowance = 0;
    let rateTier = 'none';

    if (isReceivingAllowance) {
      if (siblingRank !== null && siblingRank >= 3) {
        // Con thứ 3 trở đi: 30,000円/tháng
        monthlyAllowance = CHILD_ALLOWANCE_CONSTANTS.RATES.THIRD_CHILD_AND_ABOVE;
        rateTier = 'third_child_or_above';
      } else if (child.age < 3) {
        // Con thứ 1 hoặc 2, dưới 3 tuổi: 15,000円/tháng
        monthlyAllowance = CHILD_ALLOWANCE_CONSTANTS.RATES.UNDER_3_YEARS;
        rateTier = 'under_3';
      } else {
        // Con thứ 1 hoặc 2, từ 3 tuổi đến 18 tuổi: 10,000円/tháng
        monthlyAllowance = CHILD_ALLOWANCE_CONSTANTS.RATES.AGE_3_TO_HIGH_SCHOOL;
        rateTier = 'age_3_to_high_school';
      }
    }

    // Tính trợ cấp theo LUẬT CŨ (Pre-reform) để người dùng thấy rõ lợi ích của cải cách 10/2024
    let preReformChildMonthly = 0;
    if (child.age <= 15) { // Cũ: Chỉ đến cấp 2 (15 tuổi)
      if (child.age < 3) {
        preReformChildMonthly = 15000;
      } else if (siblingRank !== null && siblingRank >= 3) {
        preReformChildMonthly = 15000; // Cũ: Con thứ 3 chỉ được 15,000円
      } else {
        preReformChildMonthly = 10000;
      }
    }
    preReformTotalMonthly += preReformChildMonthly;

    // Ước tính số tháng còn lại đến khi tốt nghiệp cấp 3
    const remainingYears = Math.max(0, CHILD_ALLOWANCE_CONSTANTS.AGE_LIMITS.HIGH_SCHOOL_GRADUATION_AGE - child.age);
    const remainingMonthsEstimate = remainingYears * 12;
    const remainingLifetimeEstimate = remainingMonthsEstimate * monthlyAllowance;

    return {
      id: child.id,
      name: child.name,
      age: child.age,
      countsForSiblingOrder,
      siblingRank,
      isReceivingAllowance,
      monthlyAllowance,
      annualAllowance: monthlyAllowance * 12,
      rateTier,
      remainingMonthsEstimate,
      remainingLifetimeEstimate,
    };
  });

  const eligibleChildrenCount = childrenDetails.filter((c) => c.isReceivingAllowance).length;
  const countingSiblingsCount = childrenDetails.filter((c) => c.countsForSiblingOrder).length;
  const totalMonthlyAllowance = childrenDetails.reduce((sum, c) => sum + c.monthlyAllowance, 0);
  const totalAnnualAllowance = totalMonthlyAllowance * 12;
  const bimonthlyPayment = totalMonthlyAllowance * CHILD_ALLOWANCE_CONSTANTS.DISBURSEMENT_SCHEDULE.MONTHS_PER_PERIOD;

  // Lịch chi trả 6 kỳ trong năm
  const disbursementSchedule = CHILD_ALLOWANCE_CONSTANTS.DISBURSEMENT_SCHEDULE.PAYMENT_MONTHS.map((month) => ({
    paymentMonth: month,
    labelJa: `${month}月支給（前2ヶ月分）`,
    labelVi: `Tháng ${month} (chi trả cho 2 tháng trước)`,
    labelEn: `Month ${month} (Payment for prior 2 months)`,
    amount: bimonthlyPayment,
  }));

  // Đánh giá tác động thu nhập theo luật cũ (Income Ceiling Impact)
  // Theo luật cũ: Nếu thu nhập cao > 9.6M thì chỉ nhận 5k/tháng (tokurei kyufu), nếu > 12M thì 0円
  let actualPreReformMonthly = preReformTotalMonthly;
  let incomeLimitAbolishedBenefit = false;

  if (householdAnnualIncome >= 12000000) {
    actualPreReformMonthly = 0; // Luật cũ: Bị cắt hoàn toàn
    incomeLimitAbolishedBenefit = true;
  } else if (householdAnnualIncome >= 9600000) {
    actualPreReformMonthly = eligibleChildrenCount * 5000; // Luật cũ: Rớt xuống trợ cấp đặc biệt 5,000円
    incomeLimitAbolishedBenefit = true;
  }

  const monthlyGain = Math.max(0, totalMonthlyAllowance - actualPreReformMonthly);
  const annualGain = monthlyGain * 12;

  // Tổng số tiền ước tính còn nhận được từ nay đến khi tất cả các con tốt nghiệp cấp 3
  const totalRemainingLifetimeEstimate = childrenDetails.reduce((sum, c) => sum + c.remainingLifetimeEstimate, 0);

  return {
    hasChildren: true,
    eligibleChildrenCount,
    countingSiblingsCount,
    childrenDetails,
    totalMonthlyAllowance,
    totalAnnualAllowance,
    bimonthlyPayment,
    disbursementSchedule,
    totalRemainingLifetimeEstimate,
    reformComparison: {
      preReformMonthlyAllowance: actualPreReformMonthly,
      postReformMonthlyAllowance: totalMonthlyAllowance,
      monthlyGain,
      annualGain,
      incomeLimitAbolishedBenefit,
      thirdChildRateDoubled: childrenDetails.some((c) => c.rateTier === 'third_child_or_above'),
      highSchoolIncluded: childrenDetails.some((c) => c.isReceivingAllowance && c.age > 15),
    },
    summaryTextJa: `支給対象のお子様 ${eligibleChildrenCount}名、毎月の児童手当総額は ${totalMonthlyAllowance.toLocaleString()}円（年間 ${totalAnnualAllowance.toLocaleString()}円、偶数月に各 ${bimonthlyPayment.toLocaleString()}円）です。`,
    summaryTextVi: `Có ${eligibleChildrenCount} con đủ điều kiện nhận trợ cấp, tổng số tiền trợ cấp là ${totalMonthlyAllowance.toLocaleString()}円/tháng (hàng năm ${totalAnnualAllowance.toLocaleString()}円, chi trả mỗi 2 tháng vào các tháng chẵn: ${bimonthlyPayment.toLocaleString()}円/lần).`,
    summaryTextEn: `Eligible children: ${eligibleChildrenCount}. Total monthly child allowance is ${totalMonthlyAllowance.toLocaleString()} JPY (${totalAnnualAllowance.toLocaleString()} JPY annually, paid in even-numbered months at ${bimonthlyPayment.toLocaleString()} JPY per disbursement).`,
  };
}
