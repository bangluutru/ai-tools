/**
 * @file packages/core/src/japan/family/engines/childcareLeaveEngine.js
 * @description
 * Công cụ chẩn đoán điều kiện Nghỉ chăm con & Trợ cấp Nghỉ chăm con Nhật Bản (育児休業・給付チェッカー Engine).
 * Phân định rành mạch giữa Quyền nghỉ việc (Luật Lao động) và 4 Chế độ Trợ cấp BHTN (雇用保険法).
 */

import {
  ELIGIBILITY_STATUS,
  CHILDCARE_BENEFIT_SCHEMES,
  CHILDCARE_LEAVE_SOURCES,
} from '../rules/childcareLeaveRules.js';

/**
 * Đánh giá tính đủ điều kiện Nghỉ chăm con và các khoản trợ cấp BHTN
 * @param {Object} params
 * @param {'mother' | 'father' | 'adoptive_parent' | 'other'} [params.userRole='mother'] - Vai trò của người nộp
 * @param {'regular' | 'fixed_term' | 'temporary_dispatch' | 'self_employed_freelance' | 'unemployed' | 'other'} [params.employmentStatus='regular'] - Loại hợp đồng
 * @param {boolean} [params.isFixedTermContractRenewable=true] - HĐLĐ có thời hạn có triển vọng tiếp tục đến khi con 1.5 tuổi không
 * @param {boolean} [params.isEnrolledEmploymentInsurance=true] - Có tham gia Bảo hiểm Thất nghiệp (雇用保険)
 * @param {number} [params.employmentInsuranceMonthsInPast2Years=12] - Số tháng đóng BHTN có >=11 ngày làm việc trong 2 năm qua
 * @param {number} [params.childAgeMonths=1] - Số tháng tuổi của trẻ
 * @param {boolean} [params.isDaycareRejected=false] - Trượt nhà trẻ công lập khi con tròn 1 tuổi hoặc 1.5 tuổi
 * @param {boolean} [params.isRequestingPostBirthPapaIkukyu=false] - Có xin nghỉ chăm con sau sinh (産後パパ育休 trong 8 tuần đầu)
 * @param {number} [params.postBirthLeaveDays=14] - Số ngày dự định nghỉ trong giai đoạn sau sinh
 * @param {Object} [params.spouseStatus] - Tình trạng của vợ/chồng
 * @param {boolean} [params.spouseStatus.takesQualifyingLeave=false] - Vợ/chồng cũng nghỉ từ 14 ngày trở lên
 * @param {boolean} [params.spouseStatus.isException=false] - Thuộc diện ngoại lệ (mẹ/bố đơn thân, vợ/chồng không đi làm, ốm nặng)
 * @param {'single_parent' | 'spouse_unemployed' | 'spouse_incapacitated' | 'none'} [params.spouseStatus.exceptionType='none']
 * @param {boolean} [params.isShortTimeWork=false] - Đi làm lại và rút ngắn thời gian làm việc (nuôi con dưới 2 tuổi)
 * @param {boolean} [params.isReturningToWork=false] - Đang chuẩn bị đi làm lại
 * @returns {Object}
 */
export function checkChildcareLeaveEligibility({
  userRole = 'mother',
  employmentStatus = 'regular',
  isFixedTermContractRenewable = true,
  isEnrolledEmploymentInsurance = true,
  employmentInsuranceMonthsInPast2Years = 12,
  childAgeMonths = 1,
  isDaycareRejected = false,
  isRequestingPostBirthPapaIkukyu = false,
  postBirthLeaveDays = 14,
  spouseStatus = {},
  isShortTimeWork = false,
  isReturningToWork = false,
} = {}) {
  const ageMonths = Math.max(0, Number(childAgeMonths) || 0);
  const insuredMonths = Math.max(0, Number(employmentInsuranceMonthsInPast2Years) || 0);
  const leaveDays = Math.max(0, Number(postBirthLeaveDays) || 0);

  const {
    takesQualifyingLeave = false,
    isException = false,
    exceptionType = 'none'
  } = spouseStatus;

  // 1. ĐÁNH GIÁ QUYỀN NGHỈ PHÉP CHĂM CON THEO LUẬT LAO ĐỘNG (育児休業の取得権利)
  // Căn cứ: 育児・介護休業法第2条・第5条
  let statutoryLeaveRight = {
    isEligible: false,
    status: ELIGIBILITY_STATUS.LIKELY_NOT_ELIGIBLE,
    reasonJa: '',
    reasonVi: '',
    reasonEn: '',
  };

  if (employmentStatus === 'self_employed_freelance' || employmentStatus === 'unemployed') {
    statutoryLeaveRight = {
      isEligible: false,
      status: ELIGIBILITY_STATUS.NOT_APPLICABLE,
      reasonJa: '自営業・フリーランスまたは現在無職の方は、労働基準法・育児介護休業法上の「労働者」に該当しないため、法的な育児休業の対象外です。',
      reasonVi: 'Người làm tự do (Freelancer), kinh doanh cá thể hoặc đang thất nghiệp không thuộc đối tượng áp dụng quyền nghỉ việc theo Luật Lao động.',
      reasonEn: 'Self-employed, freelancers, and unemployed individuals are not covered by statutory employee childcare leave rights.',
    };
  } else if (employmentStatus === 'fixed_term' && !isFixedTermContractRenewable) {
    statutoryLeaveRight = {
      isEligible: false,
      status: ELIGIBILITY_STATUS.LIKELY_NOT_ELIGIBLE,
      reasonJa: '有期雇用労働者の場合、子が1歳6ヶ月に達する日までに労働契約が満了し更新されないことが明らかな場合は、法的な育児休業を取得できません。',
      reasonVi: 'Lao động hợp đồng có thời hạn nếu hợp đồng sẽ chấm dứt trước khi con đủ 1 tuổi 6 tháng mà không được tái ký thì không đủ điều kiện nghỉ theo luật.',
      reasonEn: 'Fixed-term employees whose contract clearly ends and will not be renewed before the child reaches 1.5 years cannot claim statutory childcare leave.',
    };
  } else if (ageMonths >= 24) {
    statutoryLeaveRight = {
      isEligible: false,
      status: ELIGIBILITY_STATUS.LIKELY_NOT_ELIGIBLE,
      reasonJa: 'お子様が2歳に達しているため、法律上の育児休業の取得上限期間（最長2歳）を超過しています。',
      reasonVi: 'Bé đã tròn 2 tuổi, đã vượt quá thời hạn nghỉ chăm con tối đa theo luật định (tối đa 2 tuổi).',
      reasonEn: 'The child has reached age 2, exceeding the maximum statutory extension limit.',
    };
  } else if (ageMonths >= 12 && !isDaycareRejected) {
    statutoryLeaveRight = {
      isEligible: false,
      status: ELIGIBILITY_STATUS.NEEDS_CONFIRMATION,
      reasonJa: '1歳以降の育児休業延長には、認可保育所の不承諾通知（落選証明書）等の法定事由が必要です。',
      reasonVi: 'Sau 1 tuổi, muốn gia hạn nghỉ chăm con bạn cần có Giấy báo trượt nhà trẻ công lập (不承諾通知書) hoặc lý do bất khả kháng.',
      reasonEn: 'Extending leave beyond 1 year requires proof of public daycare waitlist rejection or statutory equivalent.',
    };
  } else {
    statutoryLeaveRight = {
      isEligible: true,
      status: ELIGIBILITY_STATUS.LIKELY_ELIGIBLE,
      reasonJa: ageMonths >= 12
        ? '保育所不承諾等の法定事由を満たしているため、最長2歳までの育児休業取得権利があります。'
        : '法律（育児・介護休業法）に基づく育児休業の取得要件を満たしています（男女共通）。',
      reasonVi: ageMonths >= 12
        ? 'Có quyền gia hạn nghỉ chăm con đến tối đa 2 tuổi do đáp ứng điều kiện trượt nhà trẻ công lập.'
        : 'Đủ điều kiện hưởng quyền nghỉ chăm con theo Luật Nghỉ chăm con & Gia đình (áp dụng cho cả bố và mẹ).',
      reasonEn: 'Statutory leave entitlement is met under the Childcare and Caregiver Leave Act.',
    };
  }

  // 2. ĐÁNH GIÁ 4 CHẾ ĐỘ TRỢ CẤP CỦA BẢO HIỂM THẤT NGHIỆP (雇用保険給付)
  const isInsuredQualified = isEnrolledEmploymentInsurance && insuredMonths >= 12;

  // 2.1 Chế độ 1: 育児休業給付金 (Standard Childcare Leave Benefit)
  let standardBenefit = {
    scheme: CHILDCARE_BENEFIT_SCHEMES.STANDARD_CHILDCARE,
    status: ELIGIBILITY_STATUS.LIKELY_NOT_ELIGIBLE,
    reasonJa: '',
    reasonVi: '',
    reasonEn: '',
  };

  if (!isEnrolledEmploymentInsurance) {
    standardBenefit.status = ELIGIBILITY_STATUS.LIKELY_NOT_ELIGIBLE;
    standardBenefit.reasonJa = '雇用保険に加入していないため、育児休業給付金の支給対象外です。';
    standardBenefit.reasonVi = 'Không tham gia Bảo hiểm Thất nghiệp (BHTN), do đó không thuộc đối tượng nhận trợ cấp.';
    standardBenefit.reasonEn = 'Ineligible due to lack of Employment Insurance enrollment.';
  } else if (insuredMonths < 12) {
    standardBenefit.status = ELIGIBILITY_STATUS.LIKELY_NOT_ELIGIBLE;
    standardBenefit.reasonJa = `休業開始前2年間に賃金支払基礎日数が11日以上ある月が${insuredMonths}ヶ月のため、受給要件（通算12ヶ月以上）を満たしていません。`;
    standardBenefit.reasonVi = `Chỉ có ${insuredMonths} tháng đóng BHTN đủ 11 ngày làm việc trong 2 năm qua, chưa đủ điều kiện tối thiểu 12 tháng.`;
    standardBenefit.reasonEn = `Only ${insuredMonths} qualifying months in prior 2 years (minimum 12 required).`;
  } else if (!statutoryLeaveRight.isEligible) {
    standardBenefit.status = statutoryLeaveRight.status;
    standardBenefit.reasonJa = '育児休業の取得要件を満たしていないため、給付金も対象外となります。';
    standardBenefit.reasonVi = 'Chưa thỏa mãn điều kiện nghỉ việc chăm con nên không phát sinh trợ cấp.';
    standardBenefit.reasonEn = 'Leave entitlement prerequisite not satisfied.';
  } else {
    standardBenefit.status = ELIGIBILITY_STATUS.LIKELY_ELIGIBLE;
    standardBenefit.reasonJa = ageMonths >= 12
      ? '保育所に入所できない事由により、最長2歳までの給付金延長受給が可能です。'
      : '雇用保険の被保険者期間および休業要件を満たしており、受給可能性が高いです（原則1歳まで）。';
    standardBenefit.reasonVi = ageMonths >= 12
      ? 'Đủ điều kiện nhận trợ cấp gia hạn đến tối đa 2 tuổi do có xác nhận trượt nhà trẻ.'
      : 'Thỏa mãn đầy đủ điều kiện đóng BHTN và quyền nghỉ con, có khả năng cao được nhận trợ cấp.';
    standardBenefit.reasonEn = 'Likely eligible under standard employment insurance childcare framework.';
  }

  // 2.2 Chế độ 2: 出生時育児休業給付金 (産後パパ育休)
  let postBirthPapaBenefit = {
    scheme: CHILDCARE_BENEFIT_SCHEMES.POST_BIRTH_PAPA,
    status: ELIGIBILITY_STATUS.NOT_APPLICABLE,
    reasonJa: '',
    reasonVi: '',
    reasonEn: '',
  };

  if (userRole === 'mother') {
    postBirthPapaBenefit.status = ELIGIBILITY_STATUS.NOT_APPLICABLE;
    postBirthPapaBenefit.reasonJa = '実母の産後8週間は労働基準法第65条の産後休業（健康保険の出産手当金）の対象となるため、出生時育児休業（産後パパ育休）は対象外です。';
    postBirthPapaBenefit.reasonVi = 'Mẹ ruột trong 8 tuần đầu sau sinh nghỉ chế độ thai sản của Luật Tiêu chuẩn Lao động (nhận Trợ cấp thai sản BHYT), không dùng chế độ này.';
    postBirthPapaBenefit.reasonEn = 'Mothers in the first 8 weeks are covered by Health Insurance maternity leave allowance, not Papa Ikukyu.';
  } else if (ageMonths > 2) {
    postBirthPapaBenefit.status = ELIGIBILITY_STATUS.NOT_APPLICABLE;
    postBirthPapaBenefit.reasonJa = '子の生後8週間（約2ヶ月）を経過しているため、出生時育児休業の対象期間を終了しています。通常の育児休業給付金をご検討ください。';
    postBirthPapaBenefit.reasonVi = 'Trẻ đã qua 8 tuần tuổi (khoảng 2 tháng), đã hết thời hạn xin nghỉ sau sinh của bố. Hãy xem xét chế độ Nghỉ chăm con thông thường.';
    postBirthPapaBenefit.reasonEn = 'The child is beyond 8 weeks post-birth; standard childcare leave applies instead.';
  } else if (!isInsuredQualified) {
    postBirthPapaBenefit.status = ELIGIBILITY_STATUS.LIKELY_NOT_ELIGIBLE;
    postBirthPapaBenefit.reasonJa = '雇用保険の加入期間要件（休業前2年間に通算12ヶ月以上）を満たしていません。';
    postBirthPapaBenefit.reasonVi = 'Chưa đáp ứng đủ thời gian tham gia BHTN (tối thiểu 12 tháng trong 2 năm qua).';
    postBirthPapaBenefit.reasonEn = 'Ineligible due to insufficient employment insurance history.';
  } else {
    postBirthPapaBenefit.status = ELIGIBILITY_STATUS.LIKELY_ELIGIBLE;
    postBirthPapaBenefit.reasonJa = '子の生後8週間以内に最大28日間、2回まで分割取得が可能です（賃金日額の67％）。';
    postBirthPapaBenefit.reasonVi = 'Được nghỉ tối đa 28 ngày trong 8 tuần sau sinh, chia làm tối đa 2 đợt (hưởng 67% mức lương ngày).';
    postBirthPapaBenefit.reasonEn = 'Eligible for up to 28 days within 8 weeks of birth, splittable into 2 periods (67% wage base).';
  }

  // 2.3 Chế độ 3: 出生後休業支援給付金 (Thưởng thêm 13% đạt 80% lương ngày)
  let postBirthSupportBonus = {
    scheme: CHILDCARE_BENEFIT_SCHEMES.POST_BIRTH_SUPPORT,
    status: ELIGIBILITY_STATUS.NOT_APPLICABLE,
    reasonJa: '',
    reasonVi: '',
    reasonEn: '',
  };

  if (!isInsuredQualified) {
    postBirthSupportBonus.status = ELIGIBILITY_STATUS.LIKELY_NOT_ELIGIBLE;
    postBirthSupportBonus.reasonJa = '雇用保険の被保険者要件を満たしていないため対象外です。';
    postBirthSupportBonus.reasonVi = 'Không đủ điều kiện bảo hiểm thất nghiệp.';
    postBirthSupportBonus.reasonEn = 'Employment insurance prerequisite not met.';
  } else if (ageMonths > 2 && !isRequestingPostBirthPapaIkukyu && userRole === 'father') {
    postBirthSupportBonus.status = ELIGIBILITY_STATUS.NOT_APPLICABLE;
    postBirthSupportBonus.reasonJa = '対象となる出生直後の休業期間（生後8週間以内等）を経過しています。';
    postBirthSupportBonus.reasonVi = 'Đã qua khoảng thời gian sau sinh quy định.';
    postBirthSupportBonus.reasonEn = 'Post-birth qualifying window has elapsed.';
  } else if (leaveDays < 14) {
    postBirthSupportBonus.status = ELIGIBILITY_STATUS.LIKELY_NOT_ELIGIBLE;
    postBirthSupportBonus.reasonJa = `出生後休業支援給付金の受給には、本人が14日以上の休業を取得する必要があります（現在：${leaveDays}日）。`;
    postBirthSupportBonus.reasonVi = `Yêu cầu người lao động phải nghỉ tối thiểu 14 ngày trong giai đoạn này (hiện tại: ${leaveDays} ngày).`;
    postBirthSupportBonus.reasonEn = `Requires employee to take at least 14 days qualifying leave (currently ${leaveDays} days).`;
  } else {
    // Kiểm tra điều kiện phối ngẫu (Spouse condition)
    const hasSpouseException = isException || ['single_parent', 'spouse_unemployed', 'spouse_incapacitated'].includes(exceptionType);

    if (takesQualifyingLeave || hasSpouseException) {
      postBirthSupportBonus.status = ELIGIBILITY_STATUS.LIKELY_ELIGIBLE;
      postBirthSupportBonus.reasonJa = hasSpouseException
        ? '配偶者例外要件（ひとり親・専業等）を満たしているため、本人の14日以上休業により13％加算（計80％）の受給可能性が高いです。'
        : '夫婦ともに14日以上の休業を取得するため、最大28日間にわたり13％加算（計80％手取り相当）の受給要件を満たしています。';
      postBirthSupportBonus.reasonVi = hasSpouseException
        ? 'Đáp ứng trường hợp ngoại lệ người phối ngẫu (đơn thân/nội trợ), được hưởng mức hỗ trợ thêm 13% (tổng 80% lương ngày).'
        : 'Cả hai vợ chồng cùng nghỉ từ 14 ngày trở lên, đủ điều kiện hưởng thêm 13% ngày lương (tổng 80% lương ngày).';
      postBirthSupportBonus.reasonEn = hasSpouseException
        ? 'Eligible via spouse exception: 13% wage base bonus applied (total 80% daily wage base).'
        : 'Both parents take 14+ days qualifying leave: eligible for 13% bonus up to 28 days.';
    } else {
      postBirthSupportBonus.status = ELIGIBILITY_STATUS.NEEDS_CONFIRMATION;
      postBirthSupportBonus.reasonJa = '配偶者も出生直後に14日以上の育休を取得するか、ひとり親・無業者等の例外事由に該当することの確認が必要です。';
      postBirthSupportBonus.reasonVi = 'Cần xác nhận xem vợ/chồng có nghỉ từ 14 ngày trở lên không, hoặc bạn có thuộc diện ngoại lệ (mẹ/bố đơn thân, vợ/chồng không đi làm) tại Hello Work.';
      postBirthSupportBonus.reasonEn = 'Requires confirmation whether spouse takes 14+ days leave or meets statutory exception criteria.';
    }
  }

  // 2.4 Chế độ 4: 育児時短就業給付金 (Childcare Short-Time Work Benefit)
  let shortTimeWorkBenefit = {
    scheme: CHILDCARE_BENEFIT_SCHEMES.SHORT_TIME_WORK,
    status: ELIGIBILITY_STATUS.NOT_APPLICABLE,
    reasonJa: '',
    reasonVi: '',
    reasonEn: '',
  };

  if (ageMonths >= 24) {
    shortTimeWorkBenefit.status = ELIGIBILITY_STATUS.NOT_APPLICABLE;
    shortTimeWorkBenefit.reasonJa = '2歳以上の子を養育する場合は育児時短就業給付金の対象外です。';
    shortTimeWorkBenefit.reasonVi = 'Chế độ này chỉ áp dụng khi nuôi con dưới 2 tuổi.';
    shortTimeWorkBenefit.reasonEn = 'Only applicable for parents caring for children under 2 years old.';
  } else if (!isInsuredQualified) {
    shortTimeWorkBenefit.status = ELIGIBILITY_STATUS.LIKELY_NOT_ELIGIBLE;
    shortTimeWorkBenefit.reasonJa = '雇用保険の加入期間要件（短時間勤務開始前2年間に通算12ヶ月以上）を満たしていません。';
    shortTimeWorkBenefit.reasonVi = 'Chưa đủ thời gian tham gia BHTN tối thiểu 12 tháng.';
    shortTimeWorkBenefit.reasonEn = 'Ineligible due to insufficient employment insurance history.';
  } else if (isShortTimeWork || isReturningToWork) {
    shortTimeWorkBenefit.status = ELIGIBILITY_STATUS.LIKELY_ELIGIBLE;
    shortTimeWorkBenefit.reasonJa = '2歳未満の子を養育するために復職・短時間勤務を行い、賃金が低下した場合に給付金（原則10％）の受給対象となります。';
    shortTimeWorkBenefit.reasonVi = 'Đủ điều kiện nhận trợ cấp làm việc rút ngắn giờ (khoảng 10% lương) khi đi làm lại và nuôi con dưới 2 tuổi.';
    shortTimeWorkBenefit.reasonEn = 'Eligible for short-time work benefit (10% wage replacement) when working reduced hours for child under 2.';
  } else {
    shortTimeWorkBenefit.status = ELIGIBILITY_STATUS.NOT_APPLICABLE;
    shortTimeWorkBenefit.reasonJa = '現在は育児休業中のため対象外ですが、復職後に短時間勤務（時短勤務）を行う際に受給可能です。';
    shortTimeWorkBenefit.reasonVi = 'Hiện tại đang trong thời gian nghỉ chăm con nên chưa áp dụng, khoản này sẽ phát sinh khi bạn đi làm lại và rút ngắn giờ làm.';
    shortTimeWorkBenefit.reasonEn = 'Currently on full leave; becomes applicable once you return to work under reduced hours.';
  }

  return {
    assessmentSummary: {
      userRole,
      employmentStatus,
      childAgeMonths: ageMonths,
      isEnrolledEmploymentInsurance,
      employmentInsuranceMonths: insuredMonths,
    },
    statutoryLeaveRight,
    schemes: {
      standardBenefit,
      postBirthPapaBenefit,
      postBirthSupportBonus,
      shortTimeWorkBenefit,
    },
    disclaimerJa: '※ 当ツールによる判定は入力情報に基づく概算診断であり、公的な受給資格の決定ではありません。実際の受給要件および支給決定は管轄のハローワーク（公共職業安定所）が行います。',
    disclaimerVi: '※ Kết quả chẩn đoán mang tính tham khảo dựa trên dữ liệu bạn nhập, không thay thế quyết định hành chính của cơ quan quản lý. Quyết định phê duyệt chính thức thuộc thẩm quyền của Hello Work (Trung tâm Giới thiệu Việc làm công).',
    disclaimerEn: '※ This assessment is an informational aid based on user input and does not represent official administrative determination, which rests solely with Hello Work.',
    regulatorySources: CHILDCARE_LEAVE_SOURCES,
  };
}
