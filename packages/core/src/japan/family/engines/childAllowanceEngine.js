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
import {
  addDaysISO,
  ageOnDate,
  formatISODateParts,
  isValidISODate,
  parseISODateParts,
  toEpochDay,
  todayLocalISO,
} from '../../employment/localDate.js';

/**
 * Ngày cuối cùng của 年度 (31/3) đầu tiên sau khi "đạt N tuổi" (N歳に達する日以後の最初の3月31日).
 * Theo 年齢計算ニ関スル法律, "đạt N tuổi" là ngày TRƯỚC sinh nhật thứ N
 * (VD sinh 01/04/2008 → đạt 18 tuổi 31/03/2026 → hết hạn 31/03/2026; sinh 02/04/2008 → 31/03/2027).
 * @param {string} birthDate - YYYY-MM-DD
 * @param {number} years
 * @returns {string} YYYY-03-31
 */
export function fiscalYearEndAfterReachingAge(birthDate, years) {
  const b = parseISODateParts(birthDate);
  if (!b) return '';
  // Sinh nhật thứ N (29/02 → 28/02 nếu năm không nhuận, rồi trừ 1 ngày)
  const y = b.y + years;
  const isLeap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  const bdDay = b.m === 2 && b.d === 29 && !isLeap ? 28 : b.d;
  const reachDate = addDaysISO(formatISODateParts(y, b.m, bdDay), -1);
  const r = parseISODateParts(reachDate);
  const endYear = r.m <= 3 ? r.y : r.y + 1;
  return formatISODateParts(endYear, 3, 31);
}

/**
 * Chuẩn hóa ngày sinh của một con: ưu tiên birthDate; nếu chỉ có birthYear + birthMonth thì giả định ngày 15.
 * @param {Object} c
 * @returns {{ birthDate: string, isBirthDayAssumed: boolean } | null}
 */
function resolveChildBirthDate(c) {
  if (isValidISODate(c.birthDate)) return { birthDate: c.birthDate, isBirthDayAssumed: false };
  const y = Number(c.birthYear);
  const m = Number(c.birthMonth);
  if (Number.isInteger(y) && y > 1900 && Number.isInteger(m) && m >= 1 && m <= 12) {
    return { birthDate: formatISODateParts(y, m, 15), isBirthDayAssumed: true };
  }
  return null;
}

/**
 * Số tháng (tính cả tháng hiện tại) từ asOf đến hết tháng của endDate.
 * @param {string} asOf
 * @param {string} endDate
 * @returns {number}
 */
function monthsInclusive(asOf, endDate) {
  const a = parseISODateParts(asOf);
  const e = parseISODateParts(endDate);
  if (!a || !e) return 0;
  return Math.max(0, (e.y * 12 + e.m) - (a.y * 12 + a.m) + 1);
}

/**
 * Tính toán trợ cấp trẻ em cho hộ gia đình
 * @param {Object} params
 * @param {Array<Object>} params.children Danh sách các con trong gia đình
 * @param {string|number} [params.children[].id] Mã định danh con
 * @param {string} [params.children[].name] Tên hoặc nhãn con
 * @param {number} [params.children[].age] Tuổi hiện tại của con (0 đến 25) – dùng khi không có ngày sinh (ước tính theo tuổi)
 * @param {string} [params.children[].birthDate] Ngày sinh YYYY-MM-DD (khuyến nghị: xét chính xác mốc 31/3 sau 18/22 tuổi)
 * @param {number} [params.children[].birthYear] Năm sinh (dùng cùng birthMonth nếu không có ngày sinh)
 * @param {number} [params.children[].birthMonth] Tháng sinh 1-12
 * @param {boolean} [params.children[].hasParentalSupport=true] Cha mẹ có chu cấp kinh tế không (áp dụng cho con 19-22 tuổi)
 * @param {number} [params.householdAnnualIncome=5000000] Thu nhập hộ gia đình (để đối chiếu lợi ích so với luật cũ)
 * @param {string} [params.asOfDate] Ngày xét (YYYY-MM-DD, mặc định: hôm nay theo lịch địa phương)
 * @returns {Object} Kết quả chi tiết trợ cấp hàng tháng, năm, kỳ chi trả và so sánh cải cách
 */
export function calculateChildAllowance(params = {}) {
  const rawChildren = Array.isArray(params.children) ? params.children : [];
  const householdAnnualIncome = Number(params.householdAnnualIncome) || 0;
  const asOfDate = isValidISODate(params.asOfDate) ? params.asOfDate : todayLocalISO();
  const asOfParts = parseISODateParts(asOfDate);

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

  // Chuẩn hóa và sắp xếp các con từ lớn đến nhỏ.
  // Có ngày sinh → xét theo 年度 (31/3 đầu tiên sau khi đạt 18 / 22 tuổi); chỉ có tuổi → ước tính theo tuổi (tương thích cũ).
  const normalizedChildren = rawChildren.map((c, index) => {
    const birth = resolveChildBirthDate(c);
    const age = birth
      ? Math.max(0, ageOnDate(birth.birthDate, asOfDate))
      : Math.max(0, Number(c.age) || 0);
    let allowanceEndDate = null;
    let siblingCountEndDate = null;
    let under3LastMonth = null;
    if (birth) {
      allowanceEndDate = fiscalYearEndAfterReachingAge(birth.birthDate, CHILD_ALLOWANCE_CONSTANTS.AGE_LIMITS.HIGH_SCHOOL_GRADUATION_AGE);
      siblingCountEndDate = fiscalYearEndAfterReachingAge(birth.birthDate, CHILD_ALLOWANCE_CONSTANTS.AGE_LIMITS.SIBLING_COUNT_MAX_AGE);
      // 15,000円 đến hết tháng chứa ngày "đạt 3 tuổi" (ngày trước sinh nhật thứ 3)
      const b = parseISODateParts(birth.birthDate);
      under3LastMonth = addDaysISO(formatISODateParts(b.y + 3, b.m, b.m === 2 && b.d === 29 ? 28 : b.d), -1).slice(0, 7);
    }
    const sortKey = birth
      ? toEpochDay(birth.birthDate)
      : toEpochDay(asOfDate) - Math.round((age + 0.5) * 365.25);
    return {
      id: c.id || `child-${index + 1}`,
      name: c.name || `Con thứ ${index + 1}`,
      age,
      birthDate: birth ? birth.birthDate : null,
      isBirthDayAssumed: birth ? birth.isBirthDayAssumed : false,
      isAgeBasedEstimate: !birth,
      allowanceEndDate,
      siblingCountEndDate,
      under3LastMonth,
      sortKey,
      hasParentalSupport: c.hasParentalSupport !== false,
    };
  }).sort((a, b) => a.sortKey - b.sortKey);

  // Xác định các con được tính vào thứ tự đếm (Counting for sibling order)
  // Quy tắc: Đến 22 tuổi (22歳年度末) và cha mẹ có duy trì gánh nặng kinh tế (chu cấp sinh hoạt/học phí)
  let currentRank = 0;
  let preReformTotalMonthly = 0;

  const childrenDetails = normalizedChildren.map((child) => {
    const isUnder22 = child.siblingCountEndDate
      ? asOfDate <= child.siblingCountEndDate
      : child.age <= CHILD_ALLOWANCE_CONSTANTS.AGE_LIMITS.SIBLING_COUNT_MAX_AGE;
    const countsForSiblingOrder = isUnder22 && child.hasParentalSupport;

    let siblingRank = null;
    if (countsForSiblingOrder) {
      currentRank += 1;
      siblingRank = currentRank;
    }

    // Điều kiện nhận trợ cấp: Đến hết cấp 3 (18 tuổi / 18歳年度末)
    const isReceivingAllowance = child.allowanceEndDate
      ? asOfDate <= child.allowanceEndDate
      : child.age <= CHILD_ALLOWANCE_CONSTANTS.AGE_LIMITS.HIGH_SCHOOL_GRADUATION_AGE;
    const asOfMonth = `${asOfParts.y}-${String(asOfParts.m).padStart(2, '0')}`;
    const isUnder3Rate = child.under3LastMonth ? asOfMonth <= child.under3LastMonth : child.age < 3;

    let monthlyAllowance = 0;
    let rateTier = 'none';

    if (isReceivingAllowance) {
      if (siblingRank !== null && siblingRank >= 3) {
        // Con thứ 3 trở đi: 30,000円/tháng
        monthlyAllowance = CHILD_ALLOWANCE_CONSTANTS.RATES.THIRD_CHILD_AND_ABOVE;
        rateTier = 'third_child_or_above';
      } else if (isUnder3Rate) {
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

    // Ước tính số tháng còn lại đến khi hết 年度 sau 18 tuổi
    let remainingMonthsEstimate;
    let remainingLifetimeEstimate;
    if (child.allowanceEndDate) {
      remainingMonthsEstimate = isReceivingAllowance ? monthsInclusive(asOfDate, child.allowanceEndDate) : 0;
      if (rateTier === 'under_3') {
        const under3Months = Math.min(remainingMonthsEstimate, monthsInclusive(asOfDate, `${child.under3LastMonth}-01`));
        remainingLifetimeEstimate = under3Months * CHILD_ALLOWANCE_CONSTANTS.RATES.UNDER_3_YEARS
          + (remainingMonthsEstimate - under3Months) * CHILD_ALLOWANCE_CONSTANTS.RATES.AGE_3_TO_HIGH_SCHOOL;
      } else {
        remainingLifetimeEstimate = remainingMonthsEstimate * monthlyAllowance;
      }
    } else {
      const remainingYears = Math.max(0, CHILD_ALLOWANCE_CONSTANTS.AGE_LIMITS.HIGH_SCHOOL_GRADUATION_AGE - child.age);
      remainingMonthsEstimate = remainingYears * 12;
      remainingLifetimeEstimate = remainingMonthsEstimate * monthlyAllowance;
    }

    return {
      id: child.id,
      name: child.name,
      age: child.age,
      birthDate: child.birthDate,
      isBirthDayAssumed: child.isBirthDayAssumed,
      isAgeBasedEstimate: child.isAgeBasedEstimate,
      allowanceEndDate: child.allowanceEndDate,
      siblingCountEndDate: child.siblingCountEndDate,
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
    asOfDate,
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
