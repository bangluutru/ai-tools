/**
 * @file packages/core/src/japan/immigration/permanentResidence/prEngine.js
 * @description
 * Động cơ thẩm định mức độ sẵn sàng xin cấp phép Vĩnh trú (永住申請準備度チェッカー).
 * Tuân thủ nghiêm ngặt nguyên tắc Zero-Inference & McLean Doctrine:
 * - KHÔNG BAO GIỜ cam kết "đậu vĩnh trú" hay hứa hẹn tỷ lệ 100%.
 * - Phân tích đối soát 6 chiều kích pháp lý thực tế dựa trên Hướng dẫn chính thức của ISA.
 */

import {
  PR_APPLICATION_ROUTES,
  PR_INCOME_BENCHMARKS,
  PR_ABSENCE_LIMITS,
  getPermanentResidenceFeeSchedule,
  PR_2026_REFORM_CONTEXT,
  PR_GUIDELINE_2026,
  PR_GUIDELINE_DRAFT_2026_08,
} from './prRules.js';
import { parseLocalDate, formatLocalDate, todayLocalISO } from '../shared/localDate.js';

/**
 * Đánh giá mức độ sẵn sàng nộp hồ sơ xin Vĩnh trú
 * 
 * @param {Object} input
 * @param {string} [input.routeId] - Tuyến nộp ('standard_10_year', 'spouse_of_japanese_or_pr', 'hsp_80_points', 'hsp_70_points')
 * @param {number} [input.yearsContinuousStay] - Số năm cư trú liên tục tại Nhật
 * @param {number} [input.yearsWorkStay] - Số năm đi làm đóng thuế theo visa lao động
 * @param {number} [input.yearsMarriage] - Số năm kết hôn thực tế (đối với diện vợ chồng)
 * @param {number} [input.currentVisaPeriodYears] - Thời hạn của visa hiện tại (1, 3, hoặc 5 năm)
 * @param {number} [input.maxConsecutiveDaysAbroad] - Số ngày xuất cảnh dài nhất trong một chuyến đi
 * @param {number} [input.totalDaysAbroadPerYear] - Tổng số ngày ở ngoài Nhật Bản trong một năm
 * @param {number} [input.annualIncome] - Thu nhập chịu thuế hàng năm (JPY)
 * @param {number} [input.dependentCount] - Số người phụ thuộc ghi trên thuế
 * @param {boolean} [input.taxPaidOnTimeAllYears] - Nộp đủ và đúng hạn 100% thuế thu nhập và thuế cư trú
 * @param {boolean} [input.pensionPaidOnTimeAllYears] - Nộp đủ và đúng hạn 100% Nenkin & BHYT trong 2 năm gần nhất
 * @param {boolean} [input.hasGuarantor] - Có người bảo lãnh là Người Nhật hoặc Người Vĩnh trú
 * @param {boolean} [input.hasCleanCriminalRecord] - Lý lịch tư pháp trong sạch, không vi phạm nghiêm trọng
 * @param {string} [input.applicationDate] - Ngày dự kiến nộp hồ sơ (YYYY-MM-DD)
 * @returns {Object} Kết quả đánh giá mức độ sẵn sàng và danh mục tài liệu
 */
export function evaluatePermanentResidenceReadiness(input = {}) {
  const {
    routeId = 'standard_10_year',
    yearsContinuousStay = 10,
    yearsWorkStay = 5,
    yearsMarriage = 3,
    currentVisaPeriodYears = 3,
    maxConsecutiveDaysAbroad = 30,
    totalDaysAbroadPerYear = 45,
    annualIncome = 4500000,
    dependentCount = 0,
    taxPaidOnTimeAllYears = true,
    pensionPaidOnTimeAllYears = true,
    hasGuarantor = true,
    hasCleanCriminalRecord = true,
    applicationDate = todayLocalISO(),
    longestPeriodForStatusYears = 5
  } = input;
  const appISO = formatLocalDate(parseLocalDate(applicationDate) || parseLocalDate(todayLocalISO()));
  const threeYearStillLongest = appISO <= PR_GUIDELINE_2026.threeYearTreatedAsLongestUntil;

  const route = PR_APPLICATION_ROUTES[routeId.toUpperCase()] || PR_APPLICATION_ROUTES.STANDARD_10_YEAR;
  const warnings = [];
  const dimensions = [];
  let passedCount = 0;
  const totalDimensions = 6;

  // 1. Chiều kích 1: Thời gian cư trú liên tục & Ngày vắng mặt (Residence Duration & Absence)
  let residenceMet = false;
  let residenceGuidance_ja = '';
  let residenceGuidance_vn = '';
  let residenceGuidance_en = '';

  if (route.id === 'standard_10_year') {
    const yearsOk = yearsContinuousStay >= route.minYearsContinuousStay;
    const workOk = yearsWorkStay >= route.minYearsWorkStay;
    residenceMet = yearsOk && workOk;
    residenceGuidance_ja = `10年以上継続在留（現: ${yearsContinuousStay}年）かつ就労資格等で5年以上在留（現: ${yearsWorkStay}年）が必要です。`;
    residenceGuidance_vn = `Yêu cầu ở Nhật từ 10 năm liên tục trở lên (hiện tại: ${yearsContinuousStay} năm) và tối thiểu 5 năm đi làm (hiện tại: ${yearsWorkStay} năm).`;
    residenceGuidance_en = `Requires 10+ years continuous stay (currently: ${yearsContinuousStay} yrs) and 5+ years work status (currently: ${yearsWorkStay} yrs).`;
  } else if (route.id === 'spouse_of_japanese_or_pr') {
    const marriageOk = yearsMarriage >= route.minYearsMarriage;
    const stayOk = yearsContinuousStay >= route.minYearsContinuousStay;
    residenceMet = marriageOk && stayOk;
    residenceGuidance_ja = `婚姻生活3年以上（現: ${yearsMarriage}年）かつ日本在留1年以上（現: ${yearsContinuousStay}年）が必要です。`;
    residenceGuidance_vn = `Yêu cầu kết hôn từ 3 năm trở lên (hiện tại: ${yearsMarriage} năm) và ở Nhật từ 1 năm trở lên (hiện tại: ${yearsContinuousStay} năm).`;
    residenceGuidance_en = `Requires 3+ years marriage (currently: ${yearsMarriage} yrs) and 1+ year stay in Japan (currently: ${yearsContinuousStay} yrs).`;
  } else if (route.id === 'hsp_80_points') {
    residenceMet = yearsContinuousStay >= 1;
    residenceGuidance_ja = `高度専門職80点以上を1年以上維持して在留していること（現: ${yearsContinuousStay}年）。`;
    residenceGuidance_vn = `Yêu cầu đạt từ 80 điểm HSP và duy trì liên tục trong 1 năm trở lên (hiện tại: ${yearsContinuousStay} năm).`;
    residenceGuidance_en = `Requires maintaining 80+ HSP points continuously for 1+ year (currently: ${yearsContinuousStay} yrs).`;
  } else if (route.id === 'hsp_70_points') {
    residenceMet = yearsContinuousStay >= 3;
    residenceGuidance_ja = `高度専門職70点以上を3年以上維持して在留していること（現: ${yearsContinuousStay}年）。`;
    residenceGuidance_vn = `Yêu cầu đạt từ 70 điểm HSP và duy trì liên tục trong 3 năm trở lên (hiện tại: ${yearsContinuousStay} năm).`;
    residenceGuidance_en = `Requires maintaining 70+ HSP points continuously for 3+ years (currently: ${yearsContinuousStay} yrs).`;
  }

  // Kiểm tra vắng mặt khỏi Nhật Bản
  const isAbsenceExceeded = maxConsecutiveDaysAbroad > PR_ABSENCE_LIMITS.MAX_CONSECUTIVE_DAYS_ABROAD ||
    totalDaysAbroadPerYear > PR_ABSENCE_LIMITS.MAX_TOTAL_DAYS_PER_YEAR;

  if (isAbsenceExceeded) {
    // Ngưỡng ngày vắng mặt là ƯỚC TÍNH THỰC TẾ (không phải tiêu chuẩn ISA) → chỉ cảnh báo, không kết luận không đạt
    warnings.push({
      code: 'PROLONGED_ABSENCE_FROM_JAPAN',
      severity: 'warning',
      title_ja: '出国期間の長期化による在留継続性の分断リスク',
      title_vn: 'Rủi ro đứt đoạn thời gian cư trú do xuất cảnh khỏi Nhật quá dài',
      title_en: 'Risk of broken residence continuity due to prolonged departure from Japan',
      message_ja: `（実務上の目安であり、出入国在留管理庁の公表基準ではありません）1回の出国が約3か月を超える場合や、年間の出国日数が100日程度を超える場合は、在留の継続性が否定され、在留期間の計算がリセットされるリスクがあります。個別事情（出張・出産等）で判断されます。`,
      message_vn: `(Đây là ƯỚC TÍNH THỰC TẾ của giới hành nghề, KHÔNG phải tiêu chuẩn công bố của Cục XNC.) Nếu một chuyến đi kéo dài khoảng trên 3 tháng, hoặc tổng số ngày ở ngoài Nhật khoảng trên 100 ngày/năm, có rủi ro bị xem là gián đoạn cư trú liên tục và phải tính lại thời gian. Cục xét theo hoàn cảnh cụ thể (công tác, sinh con…).`,
      message_en: `(Practitioner rule of thumb, not a published ISA standard.) A single absence of roughly 3+ months or ~100+ days abroad per year risks breaking residence continuity; ISA assesses individual circumstances.`
    });
  }

  if (residenceMet) passedCount++;
  dimensions.push({
    id: 'residence_period',
    title_ja: '居住要件（継続在留年数）',
    title_vn: 'Tiêu chuẩn thời gian cư trú liên tục và ngày ở ngoài Nhật',
    title_en: 'Residence Continuity & Absence Limits',
    met: residenceMet,
    guidance_ja: residenceGuidance_ja,
    guidance_vn: residenceGuidance_vn,
    guidance_en: residenceGuidance_en
  });

  // 2. Chiều kích 2: Thời hạn visa hiện tại (最長の在留期間) — theo Hướng dẫn sửa đổi 24/02/2026
  // Đến 31/03/2027: 3 năm được coi là dài nhất. Sau đó: cần thời hạn dài nhất thực tế (thường 5 năm).
  const requiredPeriodYears = threeYearStillLongest ? 3 : Math.max(3, Number(longestPeriodForStatusYears) || 5);
  const isVisaPeriodQualified = currentVisaPeriodYears >= requiredPeriodYears;
  if (isVisaPeriodQualified) passedCount++;
  else {
    warnings.push({
      code: 'VISA_PERIOD_NOT_LONGEST',
      severity: 'danger',
      title_ja: `現在の在留期間（${currentVisaPeriodYears}年）は「最長の在留期間」の要件を満たしません`,
      title_vn: `Thời hạn visa hiện tại (${currentVisaPeriodYears} năm) chưa đáp ứng yêu cầu "thời hạn dài nhất"`,
      title_en: `Current period of stay (${currentVisaPeriodYears} yr) does not meet the "longest period" requirement`,
      message_ja: threeYearStillLongest
        ? '永住許可ガイドライン上、現に有する在留資格について最長の在留期間をもって在留していることが要件です（2027年3月31日までは「3年」を最長として取り扱い）。'
        : '2027年4月1日以降は、「3年」を最長とみなす取扱いが終了し、現に有する在留資格の実際の最長の在留期間（多くは5年）が必要です。',
      message_vn: threeYearStillLongest
        ? 'Theo Hướng dẫn cấp Vĩnh trú, bạn phải đang giữ thời hạn dài nhất của tư cách hiện tại (đến hết 31/03/2027, visa 3 năm được coi là dài nhất). Visa 1 năm chưa đủ điều kiện.'
        : 'Từ 01/04/2027, visa 3 năm KHÔNG còn được coi là "dài nhất"; cần thời hạn dài nhất thực tế của tư cách hiện tại (thường là 5 năm).',
      message_en: threeYearStillLongest
        ? 'The PR guidelines require the longest period available for your status (until 31 Mar 2027, 3 years is treated as the longest).'
        : 'From 1 Apr 2027 the 3-year treatment ends; the actual longest period for your status (usually 5 years) is required.'
    });
  }

  if (threeYearStillLongest && currentVisaPeriodYears >= 3 && currentVisaPeriodYears < 5) {
    warnings.push({
      code: 'THREE_YEAR_TREATMENT_ENDS_2027_03_31',
      severity: 'warning',
      title_ja: '「3年」を最長とみなす取扱いは2027年3月31日まで',
      title_vn: 'Visa 3 năm chỉ được coi là "dài nhất" đến hết 31/03/2027',
      title_en: '3-year "longest period" treatment ends on 31 Mar 2027',
      message_ja: PR_GUIDELINE_2026.content_ja,
      message_vn: PR_GUIDELINE_2026.content_vn,
      message_en: PR_GUIDELINE_2026.content_en,
    });
  }

  dimensions.push({
    id: 'visa_duration',
    title_ja: `在留期間要件（最長の在留期間：${threeYearStillLongest ? '2027年3月31日までは3年以上' : '実際の最長期間'}）`,
    title_vn: `Thời hạn visa hiện tại (thời hạn dài nhất: ${threeYearStillLongest ? 'đến 31/03/2027 chấp nhận 3 năm' : 'thời hạn dài nhất thực tế, thường 5 năm'})`,
    title_en: `Current Visa Period (longest period: ${threeYearStillLongest ? '3 years accepted until 31 Mar 2027' : 'actual longest, usually 5 years'})`,
    met: isVisaPeriodQualified,
    guidance_ja: `現在の在留期間: ${currentVisaPeriodYears}年（必要: ${requiredPeriodYears}年以上）。上陸許可基準への適合も求められます。`,
    guidance_vn: `Thời hạn visa hiện tại: ${currentVisaPeriodYears} năm (cần từ ${requiredPeriodYears} năm). Ngoài ra phải tiếp tục đáp ứng tiêu chuẩn cấp phép nhập cảnh (上陸許可基準) của tư cách hiện tại.`,
    guidance_en: `Current period: ${currentVisaPeriodYears} year(s) (required: ${requiredPeriodYears}+). Landing standards of your current status must also be met.`
  });

  // 3. Chiều kích 3: Tuân thủ Nghĩa vụ Thuế (Tax Compliance)
  const isTaxQualified = Boolean(taxPaidOnTimeAllYears);
  if (isTaxQualified) passedCount++;
  else {
    warnings.push({
      code: 'TAX_DELINQUENCY_DETECTED',
      severity: 'danger',
      title_ja: '公租公課（税金）の未納・納期遅延による不許可リスク',
      title_vn: 'Cảnh báo nợ thuế hoặc nộp trễ hạn thuế cư trú: Rủi ro bị từ chối cực kỳ cao',
      title_en: 'Tax Delinquency / Late Payment Alert: Critical Refusal Factor',
      message_ja: '審査対象期間（5年間または3年間）において、住民税の未納はもちろん、納期限を1日でも過ぎて納付した履歴がある場合、永住審査では致命的な不許可事由となります。納付遅延がある場合は、完納後数年間の実績積み直しが強く推奨されます。',
      message_vn: 'Trong toàn bộ thời gian xét duyệt (5 năm hoặc 3 năm), bất kỳ lần nộp trễ hạn thuế cư trú nào dù chỉ 1 ngày cũng sẽ bị Cục Xuất nhập cảnh xem xét bất lợi và từ chối cấp Vĩnh trú. Cần duy trì đóng đúng hạn liên tục thêm vài năm trước khi nộp.',
      message_en: 'Any history of late payment—even by a single day—during the review period (5 or 3 years) is a primary ground for refusal. Consistent on-time payment records must be rebuilt.'
    });
  }

  dimensions.push({
    id: 'tax_compliance',
    title_ja: `公租公課の適正な履行（直近${route.taxCheckYears}年間の期限内100%納税）`,
    title_vn: `Nộp đúng hạn 100% thuế thu nhập và thuế cư trú trong ${route.taxCheckYears} năm gần nhất`,
    title_en: `100% Timely Tax Compliance for the past ${route.taxCheckYears} years`,
    met: isTaxQualified,
    guidance_ja: '住民税の課税証明書・納税証明書（領収書原本）により納期内完納が厳格に審査されます。',
    guidance_vn: 'Cục Nhập cảnh đối soát chi tiết từng tháng nộp thuế qua Giấy chứng nhận nộp thuế (納税証明書).',
    guidance_en: 'Strictly evaluated via municipal tax certificates proving payment on or before the due date.'
  });

  // 4. Chiều kích 4: Nghĩa vụ An sinh xã hội & Lương hưu (Pension & Social Insurance)
  const isPensionQualified = Boolean(pensionPaidOnTimeAllYears);
  if (isPensionQualified) passedCount++;
  else {
    warnings.push({
      code: 'PENSION_DELINQUENCY_DETECTED',
      severity: 'danger',
      title_ja: '公的年金・健康保険料の納期遅延・未納（直近2年間厳格審査）',
      title_vn: 'Nộp trễ hạn hoặc nợ bảo hiểm y tế / Nenkin trong 2 năm gần nhất',
      title_en: 'Pension & Health Insurance Late Payment Alert (Past 2 years strict review)',
      message_ja: '2019年7月のガイドライン改定以降、直近2年間の公的年金（国民年金・厚生年金）および健康保険料の納付記録が1月単位で厳格に審査されます。1回でも納期限遅れがある場合は審査通過が極めて困難です。',
      message_vn: 'Kể từ tháng 7/2019, Cục Nhập cảnh yêu cầu in chi tiết từng tháng nộp Nenkin Net trong 2 năm gần nhất. Bất kỳ tháng nào nộp trễ hạn so với ngày cuối cùng của tháng đều là nguyên nhân trượt visa Vĩnh trú.',
      message_en: 'Since July 2019, ISA scrutinizes month-by-month pension and health insurance payment receipts for the past 2 years. A single missed deadline is catastrophic.'
    });
  }

  dimensions.push({
    id: 'pension_social_insurance',
    title_ja: `公的年金及び公的医療保険の適正な納付（直近${route.pensionCheckYears}年間）`,
    title_vn: `Nộp đúng hạn 100% Nenkin và Bảo hiểm Y tế trong ${route.pensionCheckYears} năm gần nhất`,
    title_en: `Full & On-Time Social Insurance & Pension for the past ${route.pensionCheckYears} years`,
    met: isPensionQualified,
    guidance_ja: 'ねんきん定期便・ねんきんネットの納付記録により納期遅延がないことを立証します。',
    guidance_vn: 'Chứng minh qua bản in Nenkin Net hoặc phiếu thu nộp tiền không trễ ngày nào.',
    guidance_en: 'Demonstrated via Nenkin Net records proving zero delayed payments.'
  });

  // 5. Chiều kích 5: Độc lập kinh tế & Mức thu nhập ổn định (Economic Self-Sufficiency)
  const count = Math.max(0, Number(dependentCount) || 0);
  const benchmarkIncome = PR_INCOME_BENCHMARKS.SINGLE_APPLICANT_MINIMUM +
    count * PR_INCOME_BENCHMARKS.ADDITIONAL_PER_DEPENDENT;

  const isIncomeQualified = annualIncome >= benchmarkIncome;
  if (isIncomeQualified) passedCount++;
  else {
    warnings.push({
      code: 'INCOME_BELOW_BENCHMARK',
      severity: 'warning',
      title_ja: '独立生計要件（年収目安を下回っています）',
      title_vn: 'Mức thu nhập thấp hơn mốc ước tính thực tế (không phải tiêu chuẩn chính thức của ISA)',
      title_en: 'Annual income is below the practitioner estimate (not an official ISA standard)',
      message_ja: `扶養対象者${count}名の場合、安定的な生活維持能力の目安年収は約${benchmarkIncome.toLocaleString()}円以上（申告: ${annualIncome.toLocaleString()}円）です。過去${route.incomeCheckYears}年間継続してこの水準を維持していることが審査されます。`,
      message_vn: `Với ${count} người phụ thuộc, ngưỡng thu nhập ước tính cần thiết là từ ${benchmarkIncome.toLocaleString()} JPY/năm (hiện tại: ${annualIncome.toLocaleString()} JPY). Yêu cầu duy trì liên tục trong suốt ${route.incomeCheckYears} năm gần nhất.`,
      message_en: `For ${count} dependents, the benchmark income is approx. ${benchmarkIncome.toLocaleString()} JPY/year (reported: ${annualIncome.toLocaleString()} JPY). Must be continuously maintained for ${route.incomeCheckYears} years.`
    });
  }

  dimensions.push({
    id: 'economic_sufficiency',
    title_ja: `独立の生計を営むに足りる資産・技能（実務上の目安年収: ${benchmarkIncome.toLocaleString()}円・公表基準ではありません）`,
    title_vn: `Độc lập kinh tế và thu nhập ổn định (mốc ước tính thực tế: ${benchmarkIncome.toLocaleString()} JPY/năm — không phải tiêu chuẩn chính thức)`,
    title_en: `Economic Self-Sufficiency (practitioner estimate: ${benchmarkIncome.toLocaleString()} JPY/yr, not an official standard)`,
    met: isIncomeQualified,
    guidance_ja: `本人年収: ${annualIncome.toLocaleString()}円（目安: ${benchmarkIncome.toLocaleString()}円）。直近${route.incomeCheckYears}年間の課税証明書で審査されます。`,
    guidance_vn: `Thu nhập hiện tại: ${annualIncome.toLocaleString()} JPY (Ngưỡng chuẩn: ${benchmarkIncome.toLocaleString()} JPY). Cục xét duyệt trên thuế ${route.incomeCheckYears} năm liên tục.`,
    guidance_en: `Reported: ${annualIncome.toLocaleString()} JPY (Benchmark: ${benchmarkIncome.toLocaleString()} JPY) evaluated across ${route.incomeCheckYears} continuous years.`
  });

  // 6. Chiều kích 6: Người bảo lãnh & Hạnh kiểm (Guarantor & Conduct)
  const isGuarantorAndConductQualified = Boolean(hasGuarantor) && Boolean(hasCleanCriminalRecord);
  if (isGuarantorAndConductQualified) passedCount++;
  else {
    if (!hasGuarantor) {
      warnings.push({
        code: 'NO_GUARANTOR_ALERT',
        severity: 'danger',
        title_ja: '身元保証人（日本人または永住者）が必須です',
        title_vn: 'Bắt buộc phải có Người bảo lãnh là Người Nhật hoặc Người có visa Vĩnh trú',
        title_en: 'Official Guarantor (Japanese National or Permanent Resident) is mandatory',
        message_ja: '永住申請では、日本国民または永住者による身元保証書の提出が法定要件です。身元保証人の住民票、職業証明、課税証明書が必要です。',
        message_vn: 'Hồ sơ xin Vĩnh trú bắt buộc phải có Giấy cam kết bảo lãnh của 1 công dân Nhật Bản hoặc Người Vĩnh trú, kèm giấy nộp thuế và Juminhyo của người đó.',
        message_en: 'Permanent residence applications legally require a Guarantor who is a Japanese citizen or Permanent Resident.'
      });
    }
    if (!hasCleanCriminalRecord) {
      warnings.push({
        code: 'CRIMINAL_RECORD_ALERT',
        severity: 'danger',
        title_ja: '素行要件（日本の法令違反・罰金刑・重大な交通違反等）',
        title_vn: 'Cảnh báo hạnh kiểm tốt: Có tiền án, tiền sự hoặc vi phạm giao thông nặng',
        title_en: 'Good Conduct Requirement Alert: Criminal penalties or serious traffic violations',
        message_ja: '懲役・禁錮・罰金刑に処せられたことがある場合、または軽微な交通違反を短期間に多数繰り返している場合は、素行善良要件を満たさないと判断されます。',
        message_vn: 'Nếu từng bị phạt tiền (phạt hình sự/phạt tù) hoặc bị nhiều lỗi phạt vi phạm giao thông lặp đi lặp lại trong thời gian ngắn, hồ sơ sẽ bị đánh giá không đạt tiêu chí hạnh kiểm tốt.',
        message_en: 'Criminal fines, imprisonment, or frequent repeated traffic violations constitute failure of the good conduct requirement.'
      });
    }
  }

  dimensions.push({
    id: 'guarantor_and_conduct',
    title_ja: '素行善良要件および身元保証人（日本人・永住者）の確保',
    title_vn: 'Tiêu chuẩn hạnh kiểm trong sạch và có người bảo lãnh hợp lệ',
    title_en: 'Good Conduct & Qualified Guarantor (Japanese / PR)',
    met: isGuarantorAndConductQualified,
    guidance_ja: '日本の法令を遵守し、日常生活において社会的に非難されない生活を営んでいること。身元保証人の確保が必須です。',
    guidance_vn: 'Tuân thủ pháp luật Nhật Bản, không vi phạm giao thông nghiêm trọng, có người bảo lãnh cư trú hợp pháp.',
    guidance_en: 'Compliance with Japanese laws, good social conduct, and an eligible guarantor secured.'
  });

  // Đánh giá Tổng thể Mức độ Sẵn sàng (Readiness Category & Score)
  const readinessScore = Math.round((passedCount / totalDimensions) * 100);
  let readinessCategory = 'high_readiness';

  if (!isVisaPeriodQualified || !hasGuarantor || !isTaxQualified || !isPensionQualified || !hasCleanCriminalRecord || !residenceMet) {
    if (!isVisaPeriodQualified || !hasGuarantor || !isTaxQualified || !isPensionQualified || !residenceMet) {
      readinessCategory = 'disqualified';
    } else {
      readinessCategory = 'low_readiness';
    }
  } else if (!isIncomeQualified || isAbsenceExceeded) {
    readinessCategory = 'moderate_readiness';
  }

  // Cảnh báo quan trọng: Án lệ McLean & Quyền tự do thẩm định
  warnings.push({
    code: 'MINISTERIAL_DISCRETION',
    severity: 'info',
    title_ja: '法務大臣の広範な裁量権（マクリーン判決・最高裁判例）',
    title_vn: 'Bảo lưu quyền tự do phán quyết của Bộ trưởng Tư pháp (Án lệ Tối cao McLean)',
    title_en: 'Supreme Court Precedent: Broad Discretionary Authority of Minister of Justice',
    message_ja: '永住許可は、日本国に対する貢献度や我が国の国益合致性を含め法務大臣が極めて広範な裁量権をもって判断する処分です。ガイドラインの形式的基準を満たしていても、許可を法的に保証するものでは一切ありません。',
    message_vn: 'Theo phán quyết của Tòa án Tối cao Nhật Bản (Án lệ McLean), việc cấp Vĩnh trú là đặc ân pháp lý thuộc toàn quyền định đoạt của Bộ Tư pháp dựa trên lợi ích quốc gia Nhật Bản. Đáp ứng đủ tiêu chuẩn trên giấy tờ không đồng nghĩa với cam kết chắc chắn 100% được cấp visa.',
    message_en: 'Permanent residence is granted under broad ministerial discretion. Satisfying all documentary criteria does NOT guarantee approval.'
  });

  // Lệ phí
  const feeSchedule = getPermanentResidenceFeeSchedule(applicationDate);

  // Danh mục hồ sơ
  const documents = [
    '永住許可申請書（写真貼付）',
    '申請理由書（日本語で記載、日本への貢献や永住動機）',
    '身分関係を証明する資料（戸籍謄本、出生証明書、婚姻証明書等）',
    '住民票の写し（世帯全員記載のもの）',
    '在職証明書（勤務先発行）または確定申告書控・営業許可書（個人事業主）',
    `直近${route.taxCheckYears}年間の住民税の課税（非課税）証明書及び納税証明書`,
    `直近${route.pensionCheckYears}年間の公的年金及び公的医療保険の納付を証明する資料（ねんきんネット記録、領収証書写し）`,
    '資産を証明する資料（預金通帳写し、不動産登記簿等）',
    '身元保証書（実印または署名）',
    '身元保証人の住民票、職業証明、直近1年間の所得課税証明書',
    'パスポート及び在留カードの原本提示'
  ];

  return {
    routeId: route.id,
    routeTitle: { ja: route.name_ja, vn: route.name_vn, en: route.name_en },
    readinessScore,
    readinessCategory,
    passedCount,
    totalDimensions,
    dimensions,
    warnings,
    feeSchedule,
    financialAnalysis: {
      annualIncome,
      dependentCount: count,
      benchmarkIncome,
      isSufficient: isIncomeQualified
    },
    reform2026Notice: PR_2026_REFORM_CONTEXT,
    guidelineNotice: PR_GUIDELINE_2026,
    draftGuidelineNotice: PR_GUIDELINE_DRAFT_2026_08,
    requiredPeriodYears,
    documents
  };
}
