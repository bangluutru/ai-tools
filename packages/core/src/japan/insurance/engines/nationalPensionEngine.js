/**
 * National Pension Calculation & Simulation Engine (国民年金シミュレーション・エンジン)
 * Deterministic calculation for monthly/annual premiums, exemptions, advance payment discounts, and pension reflection.
 */

import { getNationalPensionSchedule, EXEMPTION_TYPES } from '../rules/nationalPensionRates.js';

export function calculateNationalPension({
  applicableDate = '2026-05-01',
  exemptionType = 'none',
  withAdditionalPension = false,
  months = 12,
  advancePaymentPlan = 'none', // 'none' | 'six_months' | 'one_year' | 'two_years'
  advancePaymentMethod = 'account_transfer' // 'account_transfer' | 'credit_card' | 'cash'
} = {}) {
  const schedule = getNationalPensionSchedule(applicableDate);

  if (!schedule) {
    return {
      success: false,
      error: 'UNVERIFIED_PERIOD',
      message: `Dữ liệu biểu phí Quốc dân hưu trí cho kỳ ${applicableDate} chưa được phê duyệt chính thức.`
    };
  }

  const exemption = EXEMPTION_TYPES[exemptionType] || EXEMPTION_TYPES.none;
  const baseMonthly = schedule.monthlyPremium;
  const payMultiplier = exemption.payMultiplier;

  // Monthly contribution for regular/exempt
  const adjustedMonthlyPremium = Math.round(baseMonthly * payMultiplier);
  
  // 付加年金 (400円/月) chỉ khả dụng khi đóng thường (không miễn giảm)
  const additionalMonthly = (withAdditionalPension && exemption.id === 'none')
    ? schedule.additionalPensionMonthly
    : 0;

  const totalMonthlyContribution = adjustedMonthlyPremium + additionalMonthly;

  // Standard period calculation
  const numMonths = Math.max(1, Math.min(240, Number(months) || 12));
  const standardPeriodTotal = totalMonthlyContribution * numMonths;

  // Advance payment discounts (前納割引 - only applicable if regular payment with none exemption)
  let advanceCalculation = null;
  if (exemption.id === 'none' && advancePaymentPlan !== 'none') {
    let planMonths = 12;
    let discountAmount = 0;

    const discountTable = schedule.advanceDiscounts?.[advancePaymentMethod] || schedule.advanceDiscounts?.account_transfer;

    if (advancePaymentPlan === 'six_months') {
      planMonths = 6;
      discountAmount = discountTable?.six_months || 0;
    } else if (advancePaymentPlan === 'one_year') {
      planMonths = 12;
      discountAmount = discountTable?.one_year || 0;
    } else if (advancePaymentPlan === 'two_years') {
      planMonths = 24;
      discountAmount = discountTable?.two_years || 0;
    }

    const grossPlanAmount = baseMonthly * planMonths;
    const netPlanAmount = Math.max(0, grossPlanAmount - discountAmount);
    const planAdditionalTotal = additionalMonthly * planMonths;

    advanceCalculation = {
      plan: advancePaymentPlan,
      paymentMethod: advancePaymentMethod,
      planMonths,
      grossAmount: grossPlanAmount,
      discountAmount,
      netPayableAmount: netPlanAmount + planAdditionalTotal,
      savingsPercentage: Number(((discountAmount / grossPlanAmount) * 100).toFixed(2))
    };
  }

  // Benefit reflection projection
  const benefitReflectionRatio = exemption.benefitReflection;
  const benefitReflectionPercent = Math.round(benefitReflectionRatio * 1000) / 10; // e.g. 87.5%

  // Additional pension annual return
  // Mỗi tháng đóng 400円, khi về hưu nhận thêm 200円/năm suốt đời. (Hoàn vốn sau 2 năm)
  const additionalPensionAnnualReturn = withAdditionalPension && exemption.id === 'none'
    ? 200 * numMonths
    : 0;

  // Source attribution
  const sources = [schedule.sourceId];
  if (exemption.id !== 'none') {
    sources.push('jps-national-pension-exemption-2026');
  }

  return {
    success: true,
    applicableDate,
    schedulePeriod: {
      from: schedule.effectiveFrom,
      to: schedule.effectiveTo
    },
    baseMonthlyPremium: baseMonthly,
    exemption: {
      id: exemption.id,
      name: exemption.name,
      payMultiplier: exemption.payMultiplier,
      benefitReflection: exemption.benefitReflection,
      benefitReflectionPercent,
      qualifyingMonthsCredited: exemption.qualifyingMonthsCredited,
      description: exemption.description
    },
    withAdditionalPension: withAdditionalPension && exemption.id === 'none',
    additionalMonthly,
    totalMonthlyContribution,
    numMonths,
    standardPeriodTotal,
    advanceCalculation,
    additionalPensionAnnualReturn,
    retroactiveAdvice: {
      canBackpay: exemption.id !== 'none',
      limitYears: 10,
      note: {
        ja: '免除や猶予を受けた期間の保険料は、10年以内であれば後から納付（追納）して満額受給に近づけることができます（3年度目以降は加算金あり）。',
        vi: 'Khoản phí được miễn hoặc hoãn có thể truy đóng (追納) trong vòng 10 năm để nhận đủ lương hưu tuổi già (từ năm thứ 3 trở đi có tính lãi trượt giá).',
        en: 'Exempted or deferred periods can be backpaid (追納) within 10 years to increase old-age pension benefit (indexation added after 2 years).'
      }
    },
    sources
  };
}
