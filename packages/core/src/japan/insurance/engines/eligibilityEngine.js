/**
 * @file packages/core/src/japan/insurance/engines/eligibilityEngine.js
 * @description Deterministic engine chẩn đoán điều kiện bắt buộc tham gia BHXH Nhật Bản (社会保険加入判定).
 * Tuân thủ quy chuẩn pháp lý chính thức từ MHLW và Japan Pension Service:
 * 1. Tiêu chuẩn 3/4 thời gian làm việc (4分の3基準)
 * 2. Tiêu chuẩn mở rộng cho lao động ngắn hạn (短時間労働者の適用拡大基準: 20h, 8.8 vạn, 2 tháng, DN >= 51 người)
 * 3. Ngoại lệ sinh viên (chính quy vs vừa học vừa làm / nghỉ học)
 * 4. Ngưỡng tuổi trần (70 tuổi cho Nenkin, 75 tuổi cho BHYT).
 */

import { ELIGIBILITY_THRESHOLDS, ELIGIBILITY_RULES_METADATA_2026 } from '../rules/eligibilityCriteriaRules.js';

/**
 * Chẩn đoán điều kiện tham gia BHXH
 * @param {object} params
 * @param {string} [params.employmentType='part_time'] - 'regular' (正社員) | 'part_time' (パート・アルバイト) | 'contract' (契約社員) | 'executive' (役員)
 * @param {number} [params.weeklyHours=0] - Giờ làm việc quy định mỗi tuần (週所定労働時間)
 * @param {number} [params.monthlyWage=0] - Tiền lương cơ bản tháng cố định (không gồm tăng ca, trợ cấp đi lại)
 * @param {number|string} [params.companySize=51] - Quy mô lao động công ty (số người tham gia BHXH)
 * @param {number|boolean} [params.contractDurationMonths=12] - Thời gian làm việc dự kiến (hoặc boolean >= 2 tháng)
 * @param {boolean} [params.isStudent=false] - Có phải là học sinh, sinh viên không
 * @param {string} [params.studentType='daytime'] - 'daytime' (chính quy ban ngày) | 'night' (hệ vừa học vừa làm/ban đêm) | 'correspondence' (từ xa) | 'leave_of_absence' (bảo lưu/nghỉ học)
 * @param {number} [params.age=30] - Tuổi của người lao động
 * @param {boolean} [params.hasLaborAgreement=false] - Doanh nghiệp dưới 51 người có thỏa thuận tự nguyện tham gia không
 * @returns {object} Kết quả chẩn đoán và phân tích từng tiêu chí
 */
export function evaluateSocialInsuranceEligibility({
  employmentType = 'part_time',
  weeklyHours = 0,
  monthlyWage = 0,
  companySize = 51,
  contractDurationMonths = 12,
  isStudent = false,
  studentType = 'daytime',
  age = 30,
  hasLaborAgreement = false,
}) {
  const hours = Math.max(0, Number(weeklyHours) || 0);
  const wage = Math.max(0, Number(monthlyWage) || 0);
  const numericAge = Math.max(0, Number(age) || 30);

  const numCompanySize = typeof companySize === 'number'
    ? companySize
    : companySize === 'over_100' ? 101
    : companySize === '51_to_100' ? 51
    : 30;

  const isExpectedOverTwoMonths = typeof contractDurationMonths === 'boolean'
    ? contractDurationMonths
    : (Number(contractDurationMonths) || 0) > 2;

  // Kiểm tra nếu thông tin cơ bản bị thiếu
  if (employmentType === 'part_time' && hours === 0 && wage === 0) {
    return {
      status: 'insufficient_info',
      statusJa: '情報不足',
      headlineJa: '判定に必要な労働条件が入力されていません',
      headlineVi: 'Chưa đủ thông tin điều kiện lao động để chẩn đoán',
      headlineEn: 'Insufficient working condition information',
      summaryJa: '週の労働時間や月額賃金を入力してください。',
      summaryVi: 'Vui lòng nhập số giờ làm việc hàng tuần và mức lương dự kiến.',
      summaryEn: 'Please enter your weekly hours and estimated monthly wage.',
      criteriaEvaluations: [],
      applicableInsurances: { healthInsurance: false, welfarePension: false, employmentInsurance: false },
      specialNotes: [],
      metadata: ELIGIBILITY_RULES_METADATA_2026,
    };
  }

  // 1. Trường hợp là nhân viên chính thức (Regular Employee / Full-time)
  if (employmentType === 'regular' || employmentType === 'executive') {
    const isPensionApplicable = numericAge < ELIGIBILITY_THRESHOLDS.pensionAgeLimit;
    const isHealthApplicable = numericAge < ELIGIBILITY_THRESHOLDS.healthAgeLimit;

    const notes = [];
    if (numericAge >= 70 && numericAge < 75) {
      notes.push('70歳以上のため厚生年金保険は資格喪失となりますが、健康保険は75歳まで継続加入となります。');
    } else if (numericAge >= 75) {
      notes.push('75歳以上のため健康保険・厚生年金ともに資格喪失となり、後期高齢者医療制度に移行します。');
    }

    return {
      status: isHealthApplicable || isPensionApplicable ? 'likely_mandatory' : 'likely_not_mandatory',
      statusJa: '原則加入義務あり',
      headlineJa: '社会保険（健康保険・厚生年金）の加入対象です',
      headlineVi: 'Bắt buộc tham gia BHXH (BHYT & Hưu trí Kosei Nenkin)',
      headlineEn: 'Mandatory enrollment in Social Insurance',
      summaryJa: '正社員・フルタイム勤務または法人の役員は、事業所の規模に関わらず社会保険の強制被保険者となります。',
      summaryVi: 'Nhân viên chính thức, làm việc toàn thời gian hoặc ban quản lý pháp nhân thuộc diện bắt buộc tham gia BHXH theo luật định.',
      summaryEn: 'Regular full-time employees and corporate executives are statutory mandatory insured persons.',
      criteriaEvaluations: [
        {
          id: 'employment_type',
          nameJa: '雇用形態',
          nameVi: 'Hình thức tuyển dụng',
          isMet: true,
          explanationJa: '正社員または法人の常勤役員',
          explanationVi: 'Nhân viên chính thức hoặc cán bộ chuyên trách công ty',
        },
      ],
      applicableInsurances: {
        healthInsurance: isHealthApplicable,
        welfarePension: isPensionApplicable,
        employmentInsurance: true,
      },
      specialNotes: notes,
      metadata: ELIGIBILITY_RULES_METADATA_2026,
    };
  }

  // 2. Tiêu chuẩn 3/4 (4分の3基準) cho Part-time / Hợp đồng
  // Thông thường là 30 giờ/tuần trở lên
  const meetsThreeQuarters = hours >= ELIGIBILITY_THRESHOLDS.threeQuartersWeeklyHours;

  if (meetsThreeQuarters && isExpectedOverTwoMonths) {
    const isPensionApplicable = numericAge < ELIGIBILITY_THRESHOLDS.pensionAgeLimit;
    const isHealthApplicable = numericAge < ELIGIBILITY_THRESHOLDS.healthAgeLimit;

    return {
      status: 'likely_mandatory',
      statusJa: '加入義務あり（4分の3基準）',
      headlineJa: '「4分の3基準」を満たすため、社会保険の加入義務があります',
      headlineVi: 'Đạt tiêu chuẩn 3/4 thời gian làm việc: Bắt buộc tham gia BHXH',
      headlineEn: 'Mandatory coverage met under the 3/4 criteria',
      summaryJa: '週の所定労働時間および日数が通常労働者の4分の3以上（概ね週30時間以上）かつ2ヶ月を超える雇用見込みがあるため、企業規模に関わらず加入対象です。',
      summaryVi: 'Làm việc từ 30 giờ/tuần trở lên và hợp đồng trên 2 tháng, thuộc diện bắt buộc tham gia BHXH ở bất kỳ quy mô doanh nghiệp nào.',
      summaryEn: 'Working 30+ hours per week with >2 months expected tenure qualifies for statutory coverage regardless of firm size.',
      criteriaEvaluations: [
        {
          id: 'three_quarters',
          nameJa: '4分の3基準（週30時間以上）',
          nameVi: 'Tiêu chuẩn 3/4 (30h/tuần)',
          isMet: true,
          explanationJa: `週${hours}時間勤務（基準値30時間以上を満たしています）`,
          explanationVi: `Làm việc ${hours} giờ/tuần (Đạt mức yêu cầu >= 30 giờ)`,
        },
        {
          id: 'two_months',
          nameJa: '2ヶ月を超える雇用の見込み',
          nameVi: 'Thời hạn hợp đồng trên 2 tháng',
          isMet: true,
          explanationJa: '雇用契約期間が2ヶ月を超えています',
          explanationVi: 'Hợp đồng lao động trên 2 tháng',
        },
      ],
      applicableInsurances: {
        healthInsurance: isHealthApplicable,
        welfarePension: isPensionApplicable,
        employmentInsurance: true,
      },
      specialNotes: [],
      metadata: ELIGIBILITY_RULES_METADATA_2026,
    };
  }

  // 3. Tiêu chuẩn Mở rộng Áp dụng cho Lao động Ngắn hạn (短時間労働者の適用拡大基準)
  // 4 điều kiện cốt lõi:
  // A: 週20時間以上
  // B: 月額賃金8.8万円以上 (年収約106万円)
  // C: 2ヶ月を超える雇用の見込み
  // D: 学生でない (hoặc học ban đêm, từ xa, bảo lưu)
  // E: Doanh nghiệp >= 51 người (hoặc < 51 nhưng có thỏa thuận 労使合意)
  const isStudentExempt = isStudent && studentType === 'daytime';
  const condHours = hours >= ELIGIBILITY_THRESHOLDS.shortTimeWeeklyHours;
  const condWage = wage >= ELIGIBILITY_THRESHOLDS.shortTimeMonthlyWage;
  const condDuration = isExpectedOverTwoMonths;
  const condStudent = !isStudentExempt;
  const isLargeCompany = numCompanySize >= ELIGIBILITY_THRESHOLDS.companySizeThreshold;
  const condCompany = isLargeCompany || hasLaborAgreement;

  const evaluations = [
    {
      id: 'hours',
      nameJa: '週の所定労働時間が20時間以上',
      nameVi: 'Thời gian làm việc từ 20 giờ/tuần trở lên',
      nameEn: 'Weekly hours >= 20',
      isMet: condHours,
      explanationJa: condHours ? `週${hours}時間（条件達成）` : `週${hours}時間（不足：20時間未満）`,
      explanationVi: condHours ? `${hours} giờ/tuần (Đạt yêu cầu)` : `${hours} giờ/tuần (Chưa đủ 20 giờ)`,
    },
    {
      id: 'wage',
      nameJa: '月額賃金が8.8万円以上（年収約106万円）',
      nameVi: 'Lương cố định tháng từ 8.8 vạn Yên trở lên (Khoảng 106 vạn/năm)',
      nameEn: 'Monthly scheduled wage >= 88,000 JPY',
      isMet: condWage,
      explanationJa: condWage ? `月額${wage.toLocaleString()}円（条件達成）` : `月額${wage.toLocaleString()}円（不足：8.8万円未満）`,
      explanationVi: condWage ? `${wage.toLocaleString()} Yên (Đạt yêu cầu)` : `${wage.toLocaleString()} Yên (Dưới 8.8 vạn)`,
    },
    {
      id: 'duration',
      nameJa: '2ヶ月を超える雇用の見込み',
      nameVi: 'Dự kiến làm việc trên 2 tháng',
      nameEn: 'Expected tenure > 2 months',
      isMet: condDuration,
      explanationJa: condDuration ? '2ヶ月超の雇用見込みあり' : '2ヶ月以内の短期契約',
      explanationVi: condDuration ? 'Dự kiến trên 2 tháng' : 'Dưới hoặc bằng 2 tháng',
    },
    {
      id: 'student',
      nameJa: '学生でないこと（学生除外）',
      nameVi: 'Không phải học sinh, sinh viên chính quy ban ngày',
      nameEn: 'Not a daytime student',
      isMet: condStudent,
      explanationJa: isStudentExempt ? '昼間学生のため適用除外' : '学生でない、または夜間・通信制学生（適用対象）',
      explanationVi: isStudentExempt ? 'Sinh viên ban ngày được miễn trừ' : 'Không thuộc diện sinh viên được miễn trừ',
    },
    {
      id: 'company',
      nameJa: '特定適用事業所（従業員51人以上）または労使合意',
      nameVi: 'Công ty từ 51 nhân viên trở lên hoặc có thỏa thuận tự nguyện',
      nameEn: 'Enterprise >= 51 employees or labor agreement',
      isMet: condCompany,
      explanationJa: isLargeCompany
        ? `従業員規模 ${numCompanySize}人（51人以上の特定適用事業所）`
        : hasLaborAgreement
        ? '50人以下ですが労使合意に基づく任意特定適用事業所'
        : `従業員規模 ${numCompanySize}人（51人未満・労使合意なし）`,
      explanationVi: isLargeCompany
        ? `Quy mô ${numCompanySize} người (Doanh nghiệp từ 51 người trở lên)`
        : hasLaborAgreement
        ? 'Dưới 51 người nhưng có đăng ký tự nguyện áp dụng'
        : `Quy mô ${numCompanySize} người (Dưới ngưỡng 51 người)`,
    },
  ];

  const allMet = condHours && condWage && condDuration && condStudent && condCompany;

  if (allMet) {
    const isPensionApplicable = numericAge < ELIGIBILITY_THRESHOLDS.pensionAgeLimit;
    const isHealthApplicable = numericAge < ELIGIBILITY_THRESHOLDS.healthAgeLimit;

    return {
      status: 'likely_mandatory',
      statusJa: '加入義務あり（短時間適用拡大）',
      headlineJa: '短時間労働者の社会保険適用拡大基準を満たしています',
      headlineVi: 'Đạt đầy đủ tiêu chuẩn mở rộng BHXH cho người làm part-time',
      headlineEn: 'Eligible under short-time worker expanded coverage rules',
      summaryJa: '週20時間以上、月額8.8万円以上、2ヶ月超の雇用、学生以外、51人以上企業の5つの要件をすべて満たしているため、社会保険への加入が義務付けられます。',
      summaryVi: 'Bạn đáp ứng đủ 5 điều kiện: làm từ 20h/tuần, lương từ 8.8 vạn Yên/tháng, hợp đồng trên 2 tháng, không phải sinh viên chính quy và doanh nghiệp từ 51 người trở lên.',
      summaryEn: 'All statutory conditions for expanded coverage (20h, 88k JPY, >2mo, non-student, 51+ employees) are satisfied.',
      criteriaEvaluations: evaluations,
      applicableInsurances: {
        healthInsurance: isHealthApplicable,
        welfarePension: isPensionApplicable,
        employmentInsurance: hours >= 20 && isExpectedOverTwoMonths,
      },
      specialNotes: [
        'いわゆる「106万円の壁」の対象となります。会社から社会保険被保険者証（保険証）が交付されます。',
      ],
      metadata: ELIGIBILITY_RULES_METADATA_2026,
    };
  }

  // Trường hợp đáp ứng điều kiện cá nhân (20h, 8.8 vạn) nhưng công ty < 51 người
  if (condHours && condWage && condDuration && condStudent && !condCompany) {
    return {
      status: 'case_dependent',
      statusJa: '個別確認が必要（企業規模・労使合意）',
      headlineJa: '労働条件は満たしていますが、会社規模（51人基準）の確認が必要です',
      headlineVi: 'Đạt điều kiện cá nhân nhưng cần xác nhận quy mô doanh nghiệp (< 51 người)',
      headlineEn: 'Individual conditions met, but company size confirmation is required',
      summaryJa: 'ご自身の労働時間や賃金は適用基準を満たしていますが、勤務先の社会保険被保険者数が50人以下の場合、労使合意に基づく届出がない限り加入対象外となります。',
      summaryVi: 'Bạn đã đạt ngưỡng 20h và 8.8 vạn Yên, tuy nhiên do công ty dưới 51 người, bạn chỉ phải tham gia nếu công ty đã nộp hồ sơ tự nguyện áp dụng (労使合意).',
      summaryEn: 'Your working hours and wages satisfy the criteria, but companies under 51 insured workers require a filed labor agreement for coverage.',
      criteriaEvaluations: evaluations,
      applicableInsurances: {
        healthInsurance: false,
        welfarePension: false,
        employmentInsurance: hours >= 20 && isExpectedOverTwoMonths,
      },
      specialNotes: [
        '雇用保険（週20時間以上・31日以上雇用見込み）には加入対象となります。',
        '勤務先の人事・労務担当者に「任意特定適用事業所の届出を行っているか」をご確認ください。',
      ],
      metadata: ELIGIBILITY_RULES_METADATA_2026,
    };
  }

  // Trường hợp không đáp ứng (Likely not mandatory)
  const failedReasons = [];
  if (!condHours) failedReasons.push('週の労働時間が20時間未満');
  if (!condWage) failedReasons.push('月額賃金が8.8万円未満');
  if (isStudentExempt) failedReasons.push('昼間学生（適用除外）');
  if (!condDuration) failedReasons.push('雇用見込みが2ヶ月以内');

  return {
    status: 'likely_not_mandatory',
    statusJa: '現行法では加入義務の対象外',
    headlineJa: '社会保険の加入要件を満たしていません',
    headlineVi: 'Hiện tại chưa thuộc diện bắt buộc tham gia BHXH',
    headlineEn: 'Likely not mandatory under current rules',
    summaryJa: `以下の要件を満たしていないため、現時点では勤務先の社会保険への加入義務はありません：${failedReasons.join('、')}。`,
    summaryVi: `Bạn chưa thuộc diện đóng BHXH tại công ty do chưa thỏa mãn: ${failedReasons.join(', ')}.`,
    summaryEn: `You are not currently required to enroll due to: ${failedReasons.join(', ')}.`,
    criteriaEvaluations: evaluations,
    applicableInsurances: {
      healthInsurance: false,
      welfarePension: false,
      employmentInsurance: hours >= 20 && isExpectedOverTwoMonths,
    },
    specialNotes: [
      hours >= 20 && isExpectedOverTwoMonths
        ? '雇用保険（失業等給付）のみ加入対象となる可能性が高いです（週20時間以上基準）。'
        : '国民健康保険および国民年金、または家族の社会保険上の扶養（被扶養者）に入ることをご検討ください。',
    ],
    metadata: ELIGIBILITY_RULES_METADATA_2026,
  };
}
