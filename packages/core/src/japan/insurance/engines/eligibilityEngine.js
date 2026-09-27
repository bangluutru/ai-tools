/**
 * @file packages/core/src/japan/insurance/engines/eligibilityEngine.js
 * @description Deterministic engine chẩn đoán điều kiện bắt buộc tham gia BHXH Nhật Bản (社会保険加入判定).
 * Tuân thủ quy chuẩn pháp lý chính thức từ MHLW và Japan Pension Service:
 * 1. Tiêu chuẩn 3/4 thời gian làm việc (4分の3基準)
 * 2. Tiêu chuẩn mở rộng cho lao động ngắn hạn (短時間労働者の適用拡大): 週20時間, 賃金8.8万円 (撤廃予定 2026-10),
 *    2ヶ月超の雇用見込み, 学生除外, 企業規模 (51人 → 36人 2027-10 → 21人 2029-10 → 11人 2032-10 → 撤廃 2035-10)
 * 3. Ngưỡng tuổi (厚生年金 dưới 70, 健康保険 dưới 75)
 * 4. 雇用保険: 週20時間以上 + 31日以上の雇用見込み, không áp dụng cho 役員 và 昼間学生 (nguyên tắc chung)
 */

import {
  ELIGIBILITY_THRESHOLDS,
  ELIGIBILITY_RULES_METADATA_2026,
  resolveCompanySizeThreshold,
  isWageRequirementActive,
  WAGE_REQUIREMENT_ABOLITION,
} from '../rules/eligibilityCriteriaRules.js';

const COMPANY_SIZE_PRESETS = Object.freeze({
  over_100: 101,
  '51_to_100': 51,
  '36_to_50': 36,
  '21_to_35': 21,
  '11_to_20': 11,
  '1_to_10': 1,
  under_51: 30, // tương thích cũ
});

function note(ja, vi, en) {
  return { ja, vi, en };
}

function buildResult({ status, headline, summary, evaluations, insurances, notes, context }) {
  return {
    status,
    statusJa: {
      likely_mandatory: '加入義務あり',
      likely_not_mandatory: '加入義務の対象外',
      case_dependent: '個別確認が必要',
      insufficient_info: '情報不足',
    }[status],
    headlineJa: headline.ja,
    headlineVi: headline.vi,
    headlineEn: headline.en,
    summaryJa: summary.ja,
    summaryVi: summary.vi,
    summaryEn: summary.en,
    criteriaEvaluations: evaluations,
    applicableInsurances: insurances,
    specialNotes: notes.map((n) => n.ja),
    specialNotesLocalized: notes,
    appliedRules: context,
    metadata: ELIGIBILITY_RULES_METADATA_2026,
  };
}

/**
 * Chẩn đoán điều kiện tham gia BHXH
 * @param {object} params
 * @param {string} [params.employmentType='part_time'] - 'regular' | 'part_time' | 'contract' | 'executive'
 * @param {number} [params.weeklyHours=0]
 * @param {number} [params.monthlyWage=0] - 所定内賃金 (không gồm tăng ca, thưởng, trợ cấp đi lại/gia đình/chuyên cần)
 * @param {number|string} [params.companySize=51] - Số 厚生年金被保険者 của doanh nghiệp (hoặc preset)
 * @param {number|boolean} [params.contractDurationMonths=12] - Thời gian dự kiến (tháng) hoặc boolean (> 2 tháng)
 * @param {number} [params.expectedEmploymentDays] - Số ngày dự kiến (cho 雇用保険 31日以上); mặc định suy từ số tháng
 * @param {boolean} [params.isStudent=false]
 * @param {string} [params.studentType='daytime'] - 'daytime' | 'night' | 'correspondence' | 'leave_of_absence'
 * @param {number} [params.age=30]
 * @param {boolean} [params.hasLaborAgreement=false] - 任意特定適用事業所 (労使合意)
 * @param {string} [params.applicableDate] - YYYY-MM-DD, mặc định hôm nay
 */
export function evaluateSocialInsuranceEligibility({
  employmentType = 'part_time',
  weeklyHours = 0,
  monthlyWage = 0,
  companySize = 51,
  contractDurationMonths = 12,
  expectedEmploymentDays,
  isStudent = false,
  studentType = 'daytime',
  age = 30,
  hasLaborAgreement = false,
  applicableDate,
} = {}) {
  const dateStr = String(applicableDate || new Date().toISOString()).slice(0, 10);
  const hours = Math.max(0, Number(weeklyHours) || 0);
  const wage = Math.max(0, Number(monthlyWage) || 0);
  const parsedAge = Number(age);
  const numericAge = age === undefined || age === null || age === '' || !Number.isFinite(parsedAge) ? 30 : Math.max(0, parsedAge);

  const numCompanySize = typeof companySize === 'number'
    ? companySize
    : COMPANY_SIZE_PRESETS[companySize] ?? (Number(companySize) || 30);

  const months = typeof contractDurationMonths === 'boolean' ? null : Number(contractDurationMonths) || 0;
  const isExpectedOverTwoMonths = typeof contractDurationMonths === 'boolean' ? contractDurationMonths : months > 2;
  const days = Number.isFinite(Number(expectedEmploymentDays)) && expectedEmploymentDays !== undefined && expectedEmploymentDays !== null
    ? Number(expectedEmploymentDays)
    : typeof contractDurationMonths === 'boolean'
    ? (contractDurationMonths ? 61 : 0)
    : Math.round(months * 30.4);
  const isExpected31Days = days >= ELIGIBILITY_THRESHOLDS.employmentInsuranceMinDays;

  const isExecutive = employmentType === 'executive';
  const isDaytimeStudent = isStudent && studentType === 'daytime';
  const isPensionApplicableByAge = numericAge < ELIGIBILITY_THRESHOLDS.pensionAgeLimit;
  const isHealthApplicableByAge = numericAge < ELIGIBILITY_THRESHOLDS.healthAgeLimit;

  const sizeRule = resolveCompanySizeThreshold(dateStr);
  const wageRequirementActive = isWageRequirementActive(dateStr);
  const context = {
    applicableDate: dateStr,
    companySizeThreshold: sizeRule.threshold,
    companySizeLabelJa: sizeRule.labelJa,
    wageRequirementActive,
    wageRequirementAbolition: WAGE_REQUIREMENT_ABOLITION,
  };

  // 雇用保険 (Employment Insurance): 週20時間以上 + 31日以上の雇用見込み; 役員・昼間学生は原則対象外
  // 正社員: nếu không nhập giờ làm, coi là toàn thời gian & không xác định thời hạn
  const isRegular = employmentType === 'regular';
  const effectiveHours = isRegular && hours === 0 ? ELIGIBILITY_THRESHOLDS.standardFullTimeWeeklyHours : hours;
  const effective31Days = isRegular ? true : isExpected31Days;
  const employmentInsuranceApplicable =
    !isExecutive && !isDaytimeStudent &&
    effectiveHours >= ELIGIBILITY_THRESHOLDS.employmentInsuranceWeeklyHours && effective31Days;
  const employmentNotes = [];
  if (isExecutive) {
    employmentNotes.push(note(
      '法人の役員は原則として雇用保険の被保険者になりません（兼務役員で労働者性が強い場合を除く）。',
      'Thành viên ban điều hành (役員) về nguyên tắc không tham gia 雇用保険 (trừ trường hợp kiêm nhiệm có tính chất người lao động).',
      'Corporate officers are generally not covered by employment insurance (except employee-officers).'
    ));
  } else if (isDaytimeStudent && hours >= 20) {
    employmentNotes.push(note(
      '昼間学生は原則として雇用保険の適用除外です（卒業見込みで卒業後も同じ事業所に勤務する場合、休学中、定時制等は対象）。',
      'Sinh viên hệ ban ngày về nguyên tắc không thuộc diện 雇用保険 (trừ khi sắp tốt nghiệp và tiếp tục làm tại công ty, đang bảo lưu, hệ bán thời gian...).',
      'Daytime students are generally excluded from employment insurance (exceptions: graduating and staying on, leave of absence, part-time courses).'
    ));
  }

  // Thiếu thông tin
  if ((employmentType === 'part_time' || employmentType === 'contract') && hours === 0 && wage === 0) {
    return buildResult({
      status: 'insufficient_info',
      headline: note('判定に必要な労働条件が入力されていません', 'Chưa đủ thông tin điều kiện lao động để chẩn đoán', 'Insufficient working condition information'),
      summary: note('週の労働時間や月額賃金を入力してください。', 'Vui lòng nhập số giờ làm việc hàng tuần và mức lương dự kiến.', 'Please enter your weekly hours and estimated monthly wage.'),
      evaluations: [],
      insurances: { healthInsurance: false, welfarePension: false, employmentInsurance: false },
      notes: [],
      context,
    });
  }

  const ageNotes = [];
  if (numericAge >= 70 && numericAge < 75) {
    ageNotes.push(note(
      '70歳以上のため厚生年金保険の被保険者にはなりません。健康保険は75歳到達まで加入対象です。',
      'Từ 70 tuổi không còn tham gia 厚生年金; BHYT công ty vẫn tham gia đến khi đủ 75 tuổi.',
      'From age 70 you are no longer covered by the welfare pension; health insurance continues until 75.'
    ));
  } else if (numericAge >= 75) {
    ageNotes.push(note(
      '75歳以上は健康保険・厚生年金ともに対象外となり、後期高齢者医療制度に加入します（雇用保険は要件を満たせば加入）。',
      'Từ 75 tuổi không thuộc BHYT công ty và 厚生年金; chuyển sang chế độ y tế người cao tuổi (後期高齢者医療). 雇用保険 vẫn tham gia nếu đủ điều kiện.',
      'From age 75 neither company health insurance nor welfare pension applies; you join the Late-Stage Elderly Medical Care System (employment insurance still applies if eligible).'
    ));
  }

  const coveredResult = ({ basisHeadline, basisSummary, evaluations, extraNotes = [] }) => {
    const insurances = {
      healthInsurance: isHealthApplicableByAge,
      welfarePension: isPensionApplicableByAge,
      employmentInsurance: employmentInsuranceApplicable,
    };
    const anyShakai = insurances.healthInsurance || insurances.welfarePension;
    const headline = anyShakai
      ? (insurances.welfarePension ? basisHeadline : note(
          '健康保険の加入対象です（厚生年金は70歳以上のため対象外）',
          'Bắt buộc tham gia BHYT công ty (厚生年金 không áp dụng vì từ 70 tuổi)',
          'Health insurance applies (no welfare pension from age 70)'
        ))
      : note(
          '年齢により健康保険・厚生年金の加入対象外です（後期高齢者医療制度）',
          'Không thuộc diện BHYT công ty & 厚生年金 do độ tuổi (chuyển sang 後期高齢者医療)',
          'Not covered by company health insurance or welfare pension due to age (Late-Stage Elderly Medical Care)'
        );
    return buildResult({
      status: anyShakai ? 'likely_mandatory' : 'likely_not_mandatory',
      headline,
      summary: basisSummary,
      evaluations,
      insurances,
      notes: [...ageNotes, ...extraNotes, ...employmentNotes],
      context,
    });
  };

  // 1. Nhân viên chính thức / 役員
  if (employmentType === 'regular' || isExecutive) {
    return coveredResult({
      basisHeadline: note('社会保険（健康保険・厚生年金）の加入対象です', 'Bắt buộc tham gia BHXH (BHYT & Hưu trí Kosei Nenkin)', 'Mandatory enrollment in Social Insurance'),
      basisSummary: note(
        '正社員・フルタイム勤務者、または報酬を受ける法人の役員は、事業所の規模に関わらず社会保険の被保険者となります。',
        'Nhân viên chính thức, làm việc toàn thời gian hoặc thành viên ban điều hành nhận thù lao thuộc diện bắt buộc tham gia BHXH bất kể quy mô doanh nghiệp.',
        'Regular full-time employees and paid corporate officers are insured regardless of company size.'
      ),
      evaluations: [
        {
          id: 'employment_type',
          nameJa: '雇用形態',
          nameVi: 'Hình thức tuyển dụng',
          nameEn: 'Employment type',
          isMet: true,
          explanationJa: isExecutive ? '報酬を受ける法人の役員' : '正社員（フルタイム）',
          explanationVi: isExecutive ? 'Thành viên ban điều hành có thù lao' : 'Nhân viên chính thức (toàn thời gian)',
          explanationEn: isExecutive ? 'Paid corporate officer' : 'Regular full-time employee',
        },
      ],
    });
  }

  // 2. Tiêu chuẩn 3/4 (4分の3基準)
  const meetsThreeQuarters = hours >= ELIGIBILITY_THRESHOLDS.threeQuartersWeeklyHours;
  if (meetsThreeQuarters && isExpectedOverTwoMonths) {
    return coveredResult({
      basisHeadline: note('「4分の3基準」を満たすため、社会保険の加入義務があります', 'Đạt tiêu chuẩn 3/4 thời gian làm việc: Bắt buộc tham gia BHXH', 'Mandatory coverage met under the 3/4 criteria'),
      basisSummary: note(
        '週の所定労働時間および月の所定労働日数が通常の労働者の4分の3以上（概ね週30時間以上）で、2ヶ月を超える雇用見込みがあるため、企業規模に関わらず加入対象です。',
        'Làm việc từ khoảng 30 giờ/tuần (3/4 người làm toàn thời gian) và hợp đồng trên 2 tháng, thuộc diện bắt buộc tham gia BHXH ở bất kỳ quy mô doanh nghiệp nào.',
        'Working at least 3/4 of full-time hours (about 30h/week) with >2 months expected tenure qualifies regardless of company size.'
      ),
      evaluations: [
        {
          id: 'three_quarters',
          nameJa: '4分の3基準（週30時間以上）',
          nameVi: 'Tiêu chuẩn 3/4 (30h/tuần)',
          nameEn: '3/4 criterion (30h/week)',
          isMet: true,
          explanationJa: `週${hours}時間勤務（基準値30時間以上を満たしています）`,
          explanationVi: `Làm việc ${hours} giờ/tuần (Đạt mức yêu cầu >= 30 giờ)`,
          explanationEn: `${hours} hours/week (meets the 30h criterion)`,
        },
        {
          id: 'two_months',
          nameJa: '2ヶ月を超える雇用の見込み',
          nameVi: 'Thời hạn hợp đồng trên 2 tháng',
          nameEn: 'Expected tenure > 2 months',
          isMet: true,
          explanationJa: '雇用契約期間が2ヶ月を超えています',
          explanationVi: 'Hợp đồng lao động trên 2 tháng',
          explanationEn: 'Contract exceeds 2 months',
        },
      ],
    });
  }

  // 3. Tiêu chuẩn mở rộng (短時間労働者)
  const threshold = sizeRule.threshold;
  const condHours = hours >= ELIGIBILITY_THRESHOLDS.shortTimeWeeklyHours;
  const condWage = !wageRequirementActive || wage >= ELIGIBILITY_THRESHOLDS.shortTimeMonthlyWage;
  const condDuration = isExpectedOverTwoMonths;
  const condStudent = !isDaytimeStudent;
  const isLargeCompany = threshold === 0 || numCompanySize >= threshold;
  const condCompany = isLargeCompany || hasLaborAgreement;
  const thresholdLabelJa = threshold === 0 ? '企業規模要件なし' : `${threshold}人以上`;
  const thresholdLabelVi = threshold === 0 ? 'không còn yêu cầu quy mô' : `từ ${threshold} người`;

  const evaluations = [
    {
      id: 'hours',
      nameJa: '週の所定労働時間が20時間以上',
      nameVi: 'Thời gian làm việc từ 20 giờ/tuần trở lên',
      nameEn: 'Weekly hours >= 20',
      isMet: condHours,
      explanationJa: condHours ? `週${hours}時間（条件達成）` : `週${hours}時間（不足：20時間未満）`,
      explanationVi: condHours ? `${hours} giờ/tuần (Đạt yêu cầu)` : `${hours} giờ/tuần (Chưa đủ 20 giờ)`,
      explanationEn: condHours ? `${hours} h/week (met)` : `${hours} h/week (below 20h)`,
    },
    wageRequirementActive
      ? {
          id: 'wage',
          nameJa: `所定内賃金が月額8.8万円以上（${WAGE_REQUIREMENT_ABOLITION.labelJa}）`,
          nameVi: `Lương cố định tháng từ 8.8 vạn Yên (${WAGE_REQUIREMENT_ABOLITION.labelVi})`,
          nameEn: `Scheduled monthly wage >= 88,000 JPY (${WAGE_REQUIREMENT_ABOLITION.labelEn})`,
          isMet: condWage,
          explanationJa: condWage ? `月額${wage.toLocaleString()}円（条件達成）` : `月額${wage.toLocaleString()}円（不足：8.8万円未満）`,
          explanationVi: condWage ? `${wage.toLocaleString()} Yên (Đạt yêu cầu)` : `${wage.toLocaleString()} Yên (Dưới 8.8 vạn)`,
          explanationEn: condWage ? `${wage.toLocaleString()} JPY (met)` : `${wage.toLocaleString()} JPY (below 88,000)`,
        }
      : {
          id: 'wage',
          nameJa: '賃金要件（月額8.8万円）',
          nameVi: 'Điều kiện lương 8.8 vạn Yên',
          nameEn: 'Wage requirement (88,000 JPY)',
          isMet: true,
          explanationJa: `判定日${dateStr}時点では撤廃済みの扱い（${WAGE_REQUIREMENT_ABOLITION.labelJa}）`,
          explanationVi: `Tại ngày ${dateStr} coi như đã bãi bỏ (${WAGE_REQUIREMENT_ABOLITION.labelVi})`,
          explanationEn: `Treated as abolished on ${dateStr} (${WAGE_REQUIREMENT_ABOLITION.labelEn})`,
        },
    {
      id: 'duration',
      nameJa: '2ヶ月を超える雇用の見込み',
      nameVi: 'Dự kiến làm việc trên 2 tháng',
      nameEn: 'Expected tenure > 2 months',
      isMet: condDuration,
      explanationJa: condDuration ? '2ヶ月超の雇用見込みあり' : '2ヶ月以内の短期契約',
      explanationVi: condDuration ? 'Dự kiến trên 2 tháng' : 'Dưới hoặc bằng 2 tháng',
      explanationEn: condDuration ? 'Expected over 2 months' : '2 months or less',
    },
    {
      id: 'student',
      nameJa: '学生でないこと（学生除外）',
      nameVi: 'Không phải học sinh, sinh viên chính quy ban ngày',
      nameEn: 'Not a daytime student',
      isMet: condStudent,
      explanationJa: isDaytimeStudent ? '昼間学生のため適用除外' : '学生でない、または夜間・通信制・休学中の学生（適用対象）',
      explanationVi: isDaytimeStudent ? 'Sinh viên ban ngày được miễn trừ' : 'Không thuộc diện sinh viên được miễn trừ',
      explanationEn: isDaytimeStudent ? 'Daytime student (excluded)' : 'Not an excluded student',
    },
    {
      id: 'company',
      nameJa: `特定適用事業所（厚生年金被保険者${thresholdLabelJa}）または労使合意`,
      nameVi: `Doanh nghiệp ${thresholdLabelVi} (người tham gia 厚生年金) hoặc có thỏa thuận tự nguyện`,
      nameEn: threshold === 0 ? 'No company-size requirement' : `Enterprise >= ${threshold} insured employees or labor agreement`,
      isMet: condCompany,
      explanationJa: isLargeCompany
        ? `従業員規模 ${numCompanySize}人（判定日時点の基準: ${thresholdLabelJa}）`
        : hasLaborAgreement
        ? `基準（${thresholdLabelJa}）未満ですが労使合意に基づく任意特定適用事業所`
        : `従業員規模 ${numCompanySize}人（基準 ${thresholdLabelJa} 未満・労使合意なし）`,
      explanationVi: isLargeCompany
        ? `Quy mô ${numCompanySize} người (ngưỡng tại ngày xét: ${thresholdLabelVi})`
        : hasLaborAgreement
        ? `Dưới ngưỡng (${thresholdLabelVi}) nhưng có đăng ký tự nguyện áp dụng`
        : `Quy mô ${numCompanySize} người (dưới ngưỡng ${thresholdLabelVi})`,
      explanationEn: isLargeCompany
        ? `${numCompanySize} employees (threshold on this date: ${threshold || 'none'})`
        : hasLaborAgreement
        ? 'Below threshold but voluntary coverage by labor agreement'
        : `${numCompanySize} employees (below ${threshold})`,
    },
  ];

  const scheduleNotes = [];
  if (!isLargeCompany && threshold > 0) {
    const upcoming = [
      { from: '2027-10-01', threshold: 36 },
      { from: '2029-10-01', threshold: 21 },
      { from: '2032-10-01', threshold: 11 },
      { from: '2035-10-01', threshold: 0 },
    ].find((e) => e.from > dateStr && (e.threshold === 0 || numCompanySize >= e.threshold));
    if (upcoming) {
      const ym = upcoming.from.slice(0, 7);
      scheduleNotes.push(note(
        `企業規模要件の段階的な引下げにより、${ym}から勤務先（${numCompanySize}人）も対象となる予定です。`,
        `Theo lộ trình nới ngưỡng quy mô, từ ${ym} doanh nghiệp của bạn (${numCompanySize} người) dự kiến thuộc diện áp dụng.`,
        `Under the phased reduction of the size requirement, your employer (${numCompanySize}) is scheduled to be covered from ${ym}.`
      ));
    }
  }
  if (wageRequirementActive) {
    scheduleNotes.push(note(
      `月額8.8万円の賃金要件は${WAGE_REQUIREMENT_ABOLITION.labelJa}です。撤廃後は週20時間以上などの要件のみで判定されます。`,
      `Điều kiện lương 8.8 vạn Yên: ${WAGE_REQUIREMENT_ABOLITION.labelVi}. Sau khi bãi bỏ, chỉ xét các điều kiện như từ 20 giờ/tuần.`,
      `The 88,000 JPY wage requirement is ${WAGE_REQUIREMENT_ABOLITION.labelEn.toLowerCase()}. Afterwards only hours and other criteria apply.`
    ));
  }

  const allMet = condHours && condWage && condDuration && condStudent && condCompany;

  if (allMet) {
    return coveredResult({
      basisHeadline: note('短時間労働者の社会保険適用拡大基準を満たしています', 'Đạt đầy đủ tiêu chuẩn mở rộng BHXH cho người làm part-time', 'Eligible under short-time worker expanded coverage rules'),
      basisSummary: note(
        `週20時間以上${wageRequirementActive ? '・月額8.8万円以上' : ''}・2ヶ月超の雇用見込み・学生以外・企業規模（${thresholdLabelJa}）または労使合意の要件をすべて満たしているため、社会保険への加入が義務付けられます。`,
        `Bạn đáp ứng đủ điều kiện: từ 20h/tuần${wageRequirementActive ? ', lương từ 8.8 vạn Yên/tháng' : ''}, hợp đồng trên 2 tháng, không phải sinh viên ban ngày và doanh nghiệp ${thresholdLabelVi} (hoặc có thỏa thuận).`,
        `All conditions are met (20h+${wageRequirementActive ? ', 88k JPY+' : ''}, >2 months, non-student, company-size threshold ${threshold || 'none'} or labor agreement).`
      ),
      evaluations,
      extraNotes: [
        note(
          '会社の健康保険・厚生年金に加入し、保険料は労使折半で給与から控除されます。',
          'Bạn tham gia BHYT & 厚生年金 của công ty; phí chia đôi với công ty và trừ vào lương.',
          'You join the company health insurance and welfare pension; premiums are split 50/50 and deducted from salary.'
        ),
      ],
    });
  }

  const insurancesNotCovered = {
    healthInsurance: false,
    welfarePension: false,
    employmentInsurance: employmentInsuranceApplicable,
  };

  // Đạt điều kiện cá nhân nhưng doanh nghiệp dưới ngưỡng
  if (condHours && condWage && condDuration && condStudent && !condCompany) {
    return buildResult({
      status: 'case_dependent',
      headline: note(
        `労働条件は満たしていますが、会社規模（${thresholdLabelJa}）の確認が必要です`,
        `Đạt điều kiện cá nhân nhưng cần xác nhận quy mô doanh nghiệp (${thresholdLabelVi})`,
        `Individual conditions met, but company size (threshold ${threshold}) must be confirmed`
      ),
      summary: note(
        `ご自身の労働条件は適用基準を満たしていますが、勤務先の厚生年金被保険者数が基準（${thresholdLabelJa}）未満の場合、労使合意に基づく届出がない限り加入対象外となります。`,
        `Bạn đã đạt các điều kiện cá nhân, tuy nhiên nếu số người tham gia 厚生年金 của công ty dưới ngưỡng (${thresholdLabelVi}), bạn chỉ phải tham gia khi công ty đã đăng ký tự nguyện (労使合意).`,
        `Your conditions satisfy the criteria, but if your employer is below the ${threshold}-employee threshold, coverage requires a filed labor agreement.`
      ),
      evaluations,
      insurances: insurancesNotCovered,
      notes: [
        ...ageNotes,
        ...scheduleNotes,
        employmentInsuranceApplicable
          ? note('雇用保険（週20時間以上・31日以上の雇用見込み）には加入対象となります。', 'Bạn vẫn thuộc diện 雇用保険 (từ 20h/tuần, dự kiến làm từ 31 ngày).', 'You are covered by employment insurance (20h+/week, 31+ days expected).')
          : null,
        note('勤務先の人事・労務担当者に「任意特定適用事業所の申出を行っているか」をご確認ください。', 'Hãy hỏi bộ phận nhân sự xem công ty đã đăng ký 任意特定適用事業所 chưa.', 'Ask HR whether the company has applied as a voluntary covered workplace.'),
        ...employmentNotes,
      ].filter(Boolean),
      context,
    });
  }

  // Không đáp ứng
  const failed = [];
  if (!condHours) failed.push(note('週の労働時間が20時間未満', 'làm dưới 20 giờ/tuần', 'under 20 hours/week'));
  if (!condWage) failed.push(note('月額賃金が8.8万円未満', 'lương tháng dưới 8.8 vạn Yên', 'wage below 88,000 JPY'));
  if (isDaytimeStudent) failed.push(note('昼間学生（適用除外）', 'sinh viên ban ngày (miễn trừ)', 'daytime student (excluded)'));
  if (!condDuration) failed.push(note('雇用見込みが2ヶ月以内', 'hợp đồng từ 2 tháng trở xuống', 'expected tenure 2 months or less'));

  return buildResult({
    status: 'likely_not_mandatory',
    headline: note('社会保険の加入要件を満たしていません', 'Hiện tại chưa thuộc diện bắt buộc tham gia BHXH', 'Likely not mandatory under current rules'),
    summary: note(
      `以下の要件を満たしていないため、現時点では勤務先の社会保険への加入義務はありません：${failed.map((f) => f.ja).join('、')}。`,
      `Bạn chưa thuộc diện đóng BHXH tại công ty do: ${failed.map((f) => f.vi).join(', ')}.`,
      `You are not currently required to enroll due to: ${failed.map((f) => f.en).join(', ')}.`
    ),
    evaluations,
    insurances: insurancesNotCovered,
    notes: [
      ...ageNotes,
      ...scheduleNotes,
      employmentInsuranceApplicable
        ? note('雇用保険（週20時間以上・31日以上の雇用見込み）のみ加入対象となる可能性が高いです。', 'Có thể bạn chỉ thuộc diện 雇用保険 (từ 20h/tuần, dự kiến làm từ 31 ngày).', 'You are likely covered only by employment insurance (20h+/week, 31+ days).')
        : note('国民健康保険および国民年金、または家族の社会保険上の扶養（被扶養者）に入ることをご検討ください。', 'Hãy cân nhắc tham gia BHYT quốc dân & Hưu trí quốc dân, hoặc làm người phụ thuộc BHXH của người thân.', 'Consider National Health Insurance and National Pension, or dependent coverage under a family member.'),
      ...employmentNotes,
    ],
    context,
  });
}
