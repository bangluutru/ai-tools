/**
 * @file packages/core/src/components/family/ChildcareBenefitView.jsx
 * @description
 * Giao diện Mô phỏng Số tiền Trợ cấp Nghỉ chăm con Nhật Bản (育児休業給付金シミュレーター).
 * Tuân thủ nghiêm ngặt MAIS: StandardToolLayout 1240px, Design Tokens (bg-surface, bg-background), WCAG 2.1 AA.
 */

import React, { useState, useMemo } from 'react';
import {
  Baby,
  Calendar,
  Clock,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Info,
  DollarSign,
  ArrowRight,
  TrendingUp,
  Sparkles,
  ChevronRight,
  Building2,
  Percent,
} from 'lucide-react';

import StandardToolLayout from '../shared/StandardToolLayout.jsx';
import RegulatorySourceView from '../regulatory/RegulatorySourceView.jsx';
import {
  calculateChildcareBenefit,
  CHILDCARE_BENEFIT_CONSTANTS,
  CHILDCARE_BENEFIT_SOURCES,
} from '../../japan/family/index.js';

const TRANSLATIONS = {
  ja: {
    toolTitle: '育児休業給付金シミュレーター（67％・50％・出生後加算・時短給付対応）',
    toolDesc: '雇用保険法第61条の7〜第61条の10に基づき、休業開始時賃金日額、180日目までの67％支給、50％支給、出生後休業支援加算（13％）、育児時短就業給付金（10％）を精密試算します。',
    sectionInput: '1. 賃金条件および休業スケジュールの設定',
    monthlySalaryLabel: '休業前の毎月の額面給与（月給総支給額）',
    monthlySalaryHint: '※ 直前6ヶ月間の給料総額（基本給＋残業代＋諸手当）の平均。180日で除算して休業開始時賃金日額を算出します。',
    leaveDurationLabel: '育児休業の取得予定期間（または日数）',
    leaveDurationHint: '※ 原則1歳まで（保育所に入れない等の理由により最長2歳まで延長可能）。',
    duration6Months: '半年間（約180日・全期間67％）',
    duration10Months: '10ヶ月間（約300日・産後復帰目安）',
    duration1Year: '1年間（約365日・原則上限）',
    duration15Years: '1歳6ヶ月まで（約540日・1次延長）',
    duration2Years: '2歳まで（約730日・最長再延長）',
    durationCustom: '日数を直接指定する',
    customDaysLabel: '休業日数（直接入力）',
    qualifiesBonusLabel: '出生後休業支援給付金（＋13％加算・最大28日）を適用しますか？',
    qualifiesBonusHint: '※ 夫婦ともに14日以上休業するか、ひとり親・専業主婦家庭等の例外を満たす場合に支給されます。',
    bonusYes: '適用する（＋13％加算で計80％支給）',
    bonusNo: '適用しない（通常給付のみ）',
    salaryPaidDuringLeaveLabel: '休業期間中に会社から支払われる月給（有給・手当等）',
    salaryPaidDuringLeaveHint: '※ 原則0円（無給）。賃金が80％以上支払われると給付金は0円となります。',
    shortTimeWorkLabel: '復職後に2歳未満の子を育てるための時短就業給付金（約10％）も試算する',
    shortTimeWorkHint: '※ 2025年4月新設。復職後に短時間勤務を行い賃金が低下した場合の補償。',
    shortTimeMonthsLabel: '短時間勤務の予定月数',
    monthsUnit: 'ヶ月',
    daysUnit: '日',
    yenUnit: '円',
    sectionResults: '2. 試算結果サマリー',
    grandTotalBenefit: '育児休業給付 支給見込み総額',
    tier1Monthly: '当初180日間の月額目安（67％）',
    tier2Monthly: '181日目以降の月額目安（50％）',
    wageDailyBasisLabel: '算定された休業開始時賃金日額',
    cappedNotice: '（※ 厚生労働省告示の上限額 16,210円 が適用されています）',
    flooredNotice: '（※ 厚生労働省告示の下限額 2,978円 が適用されています）',
    takeHomeBannerTitle: '【実質手取り約8割〜10割】非課税＆社会保険料免除のメリット',
    takeHomeBannerDesc: '育児休業給付金は「所得税・住民税が全額非課税」であり、休業期間中は「健康保険料・厚生年金保険料が全額免除」されます。そのため、額面67％支給時の手取りは約80％相当、加算適用時（80％）は休業前とほぼ同等の手取り10割（100％）が確保されます。',
    sectionTimeline: '3. 支給スケジュールとタイムライン内訳',
    rateLabel: '給付率',
    periodDaysLabel: '対象日数',
    amountLabel: '支給見込み額',
    sectionRegulatory: '参照法令・公的情報源（Primary Regulatory Sources）',
    relatedToolsTitle: '関連する子育て支援ツール',
    linkMaternity: '出産手当金シミュレーター（健康保険の産前産後休業手当）',
    linkEligibility: '育児休業・給付チェッカー（受給資格の総合判定）',
    linkChildAllowance: '児童手当チェッカー（2024年10月抜本拡充対応）',
    linkBirthWizard: '妊娠・出産・育児ガイド（Life-Event Orchestrator）',
  },
  vi: {
    toolTitle: 'Mô Phỏng Trợ Cấp Nghỉ Chăm Con Nhật Bản (育児休業給付金シミュレーター)',
    toolDesc: 'Căn cứ Luật BHTN Nhật Bản: Tính toán chính xác số tiền trợ cấp theo từng giai đoạn (67% cho 180 ngày đầu, 50% thời gian sau, thưởng thêm 13% sau sinh và 10% khi làm việc rút ngắn giờ).',
    sectionInput: '1. Thiết lập mức lương và Kế hoạch nghỉ chăm con',
    monthlySalaryLabel: 'Tiền lương gross bình quân hàng tháng trước khi nghỉ (月給総支給額)',
    monthlySalaryHint: '※ Lương bình quân 6 tháng trước nghỉ (gồm lương cơ bản + tăng ca + phụ cấp). Chia 180 ngày để tính mức lương ngày bắt đầu nghỉ.',
    leaveDurationLabel: 'Thời gian dự kiến nghỉ chăm con (hoặc số ngày)',
    leaveDurationHint: '※ Quy chuẩn nghỉ đến khi con 1 tuổi (có thể gia hạn lên 1.5 tuổi hoặc 2 tuổi nếu trượt nhà trẻ).',
    duration6Months: '6 tháng (180 ngày • Hưởng trọn mức 67%)',
    duration10Months: '10 tháng (300 ngày • Khoảng chuẩn đi làm lại)',
    duration1Year: '1 năm (365 ngày • Hạn tiêu chuẩn theo luật)',
    duration15Years: '1 tuổi 6 tháng (540 ngày • Gia hạn trượt nhà trẻ đợt 1)',
    duration2Years: '2 tuổi (730 ngày • Gia hạn trượt nhà trẻ đợt 2 tối đa)',
    durationCustom: 'Tự nhập số ngày nghỉ cụ thể',
    customDaysLabel: 'Số ngày nghỉ dự kiến (Nhập trực tiếp)',
    qualifiesBonusLabel: 'Áp dụng khoản Thưởng hỗ trợ sau sinh (+13% lương ngày, tối đa 28 ngày)?',
    qualifiesBonusHint: '※ Áp dụng khi cả 2 vợ chồng cùng nghỉ từ 14 ngày trở lên trong 8 tuần đầu hoặc thuộc diện ngoại lệ (bố/mẹ đơn thân, nội trợ).',
    bonusYes: 'Có áp dụng (+13% lương ngày, tổng đạt 80% lương ngày)',
    bonusNo: 'Không áp dụng (Chỉ nhận mức thông thường)',
    salaryPaidDuringLeaveLabel: 'Tiền lương công ty vẫn trả hàng tháng trong kỳ nghỉ (nếu có)',
    salaryPaidDuringLeaveHint: '※ Mặc định 0 yên (nghỉ không lương). Nếu công ty vẫn trả lương từ 80% trở lên thì trợ cấp sẽ bằng 0 yên.',
    shortTimeWorkLabel: 'Tính thêm Trợ cấp làm việc rút ngắn giờ (10% lương khi đi làm lại nuôi con dưới 2 tuổi)',
    shortTimeWorkHint: '※ Áp dụng từ tháng 04/2025: Hỗ trợ bù đắp thu nhập khi đi làm lại nhưng phải giảm giờ làm.',
    shortTimeMonthsLabel: 'Số tháng dự kiến làm việc rút ngắn giờ',
    monthsUnit: 'tháng',
    daysUnit: 'ngày',
    yenUnit: 'yên',
    sectionResults: '2. Kết quả dự toán trợ cấp',
    grandTotalBenefit: 'Tổng tiền Trợ cấp Nghỉ chăm con dự kiến nhận',
    tier1Monthly: 'Mức trợ cấp hàng tháng giai đoạn 180 ngày đầu (67%)',
    tier2Monthly: 'Mức trợ cấp hàng tháng từ ngày 181 trở đi (50%)',
    wageDailyBasisLabel: 'Mức tiền lương ngày bắt đầu nghỉ (休業開始時賃金日額)',
    cappedNotice: '（※ Bị khống chế bởi mức trần của Bộ Y tế Lao động MHLW 16.210 yên/ngày）',
    flooredNotice: '（※ Được bảo đảm bởi mức sàn của Bộ Y tế Lao động MHLW 2.978 yên/ngày）',
    takeHomeBannerTitle: '【THU NHẬP THỰC NHẬN ~80% ĐẾN 100%】Đặc quyền Miễn Thuế & Miễn Đóng BHXH',
    takeHomeBannerDesc: 'Tiền trợ cấp BHTN được MIỄN HOÀN TOÀN thuế thu nhập cá nhân và thuế cư trú. Đồng thời trong suốt thời gian nghỉ chăm con, người lao động được MIỄN 100% tiền đóng BHXH (BHYT & Lương hưu Kosei Nenkin) mà vẫn được tính đầy đủ thời gian hưu trí sau này. Do đó, mức 67% lương gross tương đương khoảng 80% lương thực nhận, và mức 80% (kèm thưởng 13%) tương đương trọn vẹn 100% lương thực nhận trước khi nghỉ!',
    sectionTimeline: '3. Lịch trình chi trả và Phân bổ theo giai đoạn',
    rateLabel: 'Tỷ lệ hưởng',
    periodDaysLabel: 'Số ngày',
    amountLabel: 'Tiền dự kiến nhận',
    sectionRegulatory: 'Văn bản Luật & Hướng dẫn chính thức (Primary Regulatory Sources)',
    relatedToolsTitle: 'Các công cụ hỗ trợ gia đình liên quan',
    linkMaternity: 'Mô phỏng Trợ cấp Thai sản BHYT (出産手当金)',
    linkEligibility: 'Kiểm tra Điều kiện Nghỉ chăm con (育児休業・給付チェッカー)',
    linkChildAllowance: 'Kiểm tra Trợ cấp Trẻ em (児童手当 - Cải cách 10/2024)',
    linkBirthWizard: 'Cẩm nang Thai sản & Trẻ em Toàn diện (Birth Wizard)',
  },
  en: {
    toolTitle: 'Japan Childcare Leave Benefit Simulator (育児休業給付金シミュレーター)',
    toolDesc: 'Simulates statutory Employment Insurance childcare leave benefits: 67% tier (first 180 days), 50% tier, post-birth support bonus (+13%), and short-time work allowance (10%).',
    sectionInput: '1. Salary & Leave Schedule Parameters',
    monthlySalaryLabel: 'Gross Monthly Salary before Leave (Base + Overtime + Allowances)',
    monthlySalaryHint: '※ Average of past 6 months divided by 180 days to compute statutory Wage Daily Basis (休業開始時賃金日額).',
    leaveDurationLabel: 'Planned Childcare Leave Duration',
    leaveDurationHint: '※ Standard up to child age 1 (extendable up to age 2 if public daycare is unavailable).',
    duration6Months: '6 Months (~180 days • Full 67% tier)',
    duration10Months: '10 Months (~300 days • Common return mark)',
    duration1Year: '1 Year (~365 days • Standard statutory ceiling)',
    duration15Years: '1.5 Years (~540 days • 1st daycare extension)',
    duration2Years: '2 Years (~730 days • Maximum 2nd extension)',
    durationCustom: 'Specify custom days directly',
    customDaysLabel: 'Leave Days (Custom Input)',
    qualifiesBonusLabel: 'Apply Post-birth Support Bonus (+13% daily wage, up to 28 days)?',
    qualifiesBonusHint: '※ Applicable when both parents take 14+ days leave or meet statutory spouse exceptions.',
    bonusYes: 'Apply Bonus (+13% added, total 80% daily wage)',
    bonusNo: 'Standard benefit only',
    salaryPaidDuringLeaveLabel: 'Monthly wage paid by employer during leave (if any)',
    salaryPaidDuringLeaveHint: '※ Default 0 JPY. If wage exceeds 80% of standard salary, benefit is reduced to 0 JPY.',
    shortTimeWorkLabel: 'Include Childcare Short-Time Work Benefit (~10% wage replacement for child under 2)',
    shortTimeWorkHint: '※ Newly introduced from April 2025: compensates wages when returning on reduced hours.',
    shortTimeMonthsLabel: 'Planned Short-time Work Months',
    monthsUnit: 'months',
    daysUnit: 'days',
    yenUnit: 'JPY',
    sectionResults: '2. Simulation Summary',
    grandTotalBenefit: 'Estimated Total Childcare Leave Benefit',
    tier1Monthly: 'Monthly Estimate for First 180 Days (67%)',
    tier2Monthly: 'Monthly Estimate from Day 181 Onwards (50%)',
    wageDailyBasisLabel: 'Statutory Wage Daily Basis (休業開始時賃金日額)',
    cappedNotice: '(* Capped by MHLW statutory ceiling of 16,210 JPY/day)',
    flooredNotice: '(* Protected by MHLW statutory floor of 2,978 JPY/day)',
    takeHomeBannerTitle: '【~80% to 100% Take-Home Equivalent】Tax-Free & Social Insurance Exemption',
    takeHomeBannerDesc: 'Childcare leave benefits are completely exempt from income and resident taxes, and social insurance premiums are 100% waived during leave. Thus, a 67% gross benefit equals ~80% take-home pay, and an 80% rate (with bonus) matches ~100% of pre-leave net take-home pay!',
    sectionTimeline: '3. Disbursement Timeline & Stage Breakdown',
    rateLabel: 'Statutory Rate',
    periodDaysLabel: 'Eligible Days',
    amountLabel: 'Estimated Amount',
    sectionRegulatory: 'Primary Regulatory Sources',
    relatedToolsTitle: 'Related Family & Child Support Tools',
    linkMaternity: 'Maternity Allowance Simulator (Health Insurance Benefit)',
    linkEligibility: 'Childcare Leave & Benefit Checker (Comprehensive Diagnosis)',
    linkChildAllowance: 'Child Allowance Checker (Oct 2024 Expansion Compliant)',
    linkBirthWizard: 'Birth & Childcare Guide (Life-Event Orchestrator)',
  },
};

export default function ChildcareBenefitView({ lang = 'ja' }) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.ja;

  // State
  const [monthlySalary, setMonthlySalary] = useState(300000);
  const [durationPreset, setDurationPreset] = useState('300'); // '180' | '300' | '365' | '540' | '730' | 'custom'
  const [customDays, setCustomDays] = useState(300);
  const [qualifiesForPostBirthBonus, setQualifiesForPostBirthBonus] = useState(false);
  const [monthlySalaryDuringLeave, setMonthlySalaryDuringLeave] = useState(0);
  const [isShortTimeWork, setIsShortTimeWork] = useState(false);
  const [shortTimeMonths, setShortTimeMonths] = useState(6);

  const plannedDays = useMemo(() => {
    if (durationPreset === 'custom') return customDays;
    return parseInt(durationPreset, 10) || 300;
  }, [durationPreset, customDays]);

  // Engine evaluation
  const result = useMemo(() => {
    return calculateChildcareBenefit({
      monthlySalary,
      plannedLeaveDays: plannedDays,
      qualifiesForPostBirthBonus,
      postBirthBonusDays: 28,
      monthlySalaryDuringLeave,
      isShortTimeWork,
      shortTimeMonths,
    });
  }, [
    monthlySalary,
    plannedDays,
    qualifiesForPostBirthBonus,
    monthlySalaryDuringLeave,
    isShortTimeWork,
    shortTimeMonths,
  ]);

  return (
    <StandardToolLayout
      title={t.toolTitle}
      description={t.toolDesc}
      badge="Japan Life • Family & Child"
      maxWidth="max-w-[1240px]"
    >
      <div className="space-y-8 max-w-full overflow-hidden">
        {/* TAKE-HOME PAY EQUIVALENT CALLOUT */}
        <div className="p-4 sm:p-5 rounded-2xl bg-blue-500/10 border border-blue-500/25 flex items-start gap-3.5">
          <TrendingUp className="w-5 h-5 text-blue-700 dark:text-blue-400 mt-0.5 shrink-0" />
          <div className="space-y-1 text-xs sm:text-sm">
            <h3 className="font-bold text-blue-900 dark:text-blue-200">
              {t.takeHomeBannerTitle}
            </h3>
            <p className="text-blue-800 dark:text-blue-300 leading-relaxed">
              {t.takeHomeBannerDesc}
            </p>
          </div>
        </div>

        {/* INPUT ACCORDIONS / CONTROLS */}
        <section className="bg-surface rounded-2xl p-5 sm:p-6 border border-border shadow-sm space-y-6 max-w-full overflow-hidden">
          <div className="flex items-center gap-2 border-b border-border/60 pb-3">
            <Baby className="w-5 h-5 text-indigo-700 dark:text-indigo-400" />
            <h2 className="text-base sm:text-lg font-bold text-foreground">
              {t.sectionInput}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Monthly Salary Input */}
            <div className="space-y-2">
              <label htmlFor="monthly-salary-input" className="block text-xs sm:text-sm font-semibold text-foreground">
                {t.monthlySalaryLabel}
              </label>
              <div className="relative">
                <input
                  id="monthly-salary-input"
                  aria-label={t.monthlySalaryLabel}
                  type="number"
                  step="10000"
                  min="50000"
                  max="2000000"
                  value={monthlySalary}
                  onChange={(e) => setMonthlySalary(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-foreground font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none pr-12 text-xs sm:text-sm"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  {t.yenUnit}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {t.monthlySalaryHint}
              </p>
            </div>

            {/* Leave Duration Presets */}
            <div className="space-y-2">
              <label htmlFor="duration-preset-select" className="block text-xs sm:text-sm font-semibold text-foreground">
                {t.leaveDurationLabel}
              </label>
              <select
                id="duration-preset-select"
                aria-label={t.leaveDurationLabel}
                value={durationPreset}
                onChange={(e) => setDurationPreset(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-foreground font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none text-xs sm:text-sm"
              >
                <option value="180">{t.duration6Months}</option>
                <option value="300">{t.duration10Months}</option>
                <option value="365">{t.duration1Year}</option>
                <option value="540">{t.duration15Years}</option>
                <option value="730">{t.duration2Years}</option>
                <option value="custom">{t.durationCustom}</option>
              </select>
              <p className="text-[11px] text-muted-foreground">
                {t.leaveDurationHint}
              </p>
            </div>

            {/* Custom Days Input (if selected) */}
            {durationPreset === 'custom' && (
              <div className="space-y-2">
                <label htmlFor="custom-days-input" className="block text-xs sm:text-sm font-semibold text-foreground">
                  {t.customDaysLabel}
                </label>
                <div className="relative">
                  <input
                    id="custom-days-input"
                    aria-label={t.customDaysLabel}
                    type="number"
                    min="1"
                    max="730"
                    value={customDays}
                    onChange={(e) => setCustomDays(Math.max(1, Math.min(730, parseInt(e.target.value, 10) || 0)))}
                    className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-foreground font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none pr-12 text-xs sm:text-sm"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    {t.daysUnit}
                  </span>
                </div>
              </div>
            )}

            {/* Post-birth Support Bonus Toggle (+13%) */}
            <div className="space-y-2">
              <span className="block text-xs sm:text-sm font-semibold text-foreground">
                {t.qualifiesBonusLabel}
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setQualifiesForPostBirthBonus(true)}
                  className={`py-2 px-3 text-xs sm:text-sm font-medium rounded-xl border text-center transition-all ${
                    qualifiesForPostBirthBonus
                      ? 'bg-amber-700 dark:bg-amber-600 text-white border-amber-700 dark:border-amber-600 shadow-sm'
                      : 'bg-background text-foreground border-border'
                  }`}
                >
                  {t.bonusYes}
                </button>
                <button
                  type="button"
                  onClick={() => setQualifiesForPostBirthBonus(false)}
                  className={`py-2 px-3 text-xs sm:text-sm font-medium rounded-xl border text-center transition-all ${
                    !qualifiesForPostBirthBonus
                      ? 'bg-slate-700 dark:bg-slate-600 text-white border-slate-700 dark:border-slate-600 shadow-sm'
                      : 'bg-background text-foreground border-border'
                  }`}
                >
                  {t.bonusNo}
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {t.qualifiesBonusHint}
              </p>
            </div>

            {/* Salary Paid during leave */}
            <div className="space-y-2">
              <label htmlFor="salary-during-leave-input" className="block text-xs sm:text-sm font-semibold text-foreground">
                {t.salaryPaidDuringLeaveLabel}
              </label>
              <div className="relative">
                <input
                  id="salary-during-leave-input"
                  aria-label={t.salaryPaidDuringLeaveLabel}
                  type="number"
                  min="0"
                  step="10000"
                  value={monthlySalaryDuringLeave}
                  onChange={(e) => setMonthlySalaryDuringLeave(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-foreground font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none pr-12 text-xs sm:text-sm"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  {t.yenUnit}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {t.salaryPaidDuringLeaveHint}
              </p>
            </div>

            {/* Short-time work scheme */}
            <div className="space-y-2 flex flex-col justify-between">
              <div className="space-y-2">
                <label className="flex items-start gap-3 p-3 rounded-xl border border-border bg-background/60 hover:bg-background cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={isShortTimeWork}
                    onChange={(e) => setIsShortTimeWork(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-border"
                  />
                  <div>
                    <span className="text-xs sm:text-sm font-semibold text-foreground block">
                      {t.shortTimeWorkLabel}
                    </span>
                    <span className="text-[11px] text-muted-foreground block mt-0.5">
                      {t.shortTimeWorkHint}
                    </span>
                  </div>
                </label>
              </div>

              {isShortTimeWork && (
                <div className="flex items-center gap-3 pt-2">
                  <label htmlFor="short-time-months-input" className="text-xs font-medium text-foreground shrink-0">
                    {t.shortTimeMonthsLabel}:
                  </label>
                  <input
                    id="short-time-months-input"
                    aria-label={t.shortTimeMonthsLabel}
                    type="number"
                    min="1"
                    max="24"
                    value={shortTimeMonths}
                    onChange={(e) => setShortTimeMonths(Math.max(1, Math.min(24, parseInt(e.target.value, 10) || 0)))}
                    className="w-24 px-3 py-1.5 bg-background border border-border rounded-lg text-foreground text-xs"
                  />
                  <span className="text-xs text-muted-foreground">{t.monthsUnit}</span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* RESULTS SECTION */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <ShieldCheck className="w-6 h-6 text-indigo-700 dark:text-indigo-400" />
            <h2 className="text-xl font-black text-foreground tracking-tight">
              {t.sectionResults}
            </h2>
          </div>

          {/* GRAND TOTAL HERO CARD */}
          <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-indigo-50/70 via-purple-50/50 to-pink-50/70 dark:from-indigo-950/30 dark:via-purple-950/20 dark:to-pink-950/30 border border-indigo-200/80 dark:border-indigo-800/40 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-800 dark:text-indigo-300">
                  TOTAL ESTIMATED CHILDCARE LEAVE BENEFIT
                </span>
                <h3 className="text-sm sm:text-base font-bold text-foreground">
                  {t.grandTotalBenefit}
                </h3>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-indigo-900 dark:text-indigo-200 tracking-tight">
                  {result.financialTotals.grandTotalBenefit.toLocaleString()}
                </span>
                <span className="text-sm sm:text-base font-bold text-muted-foreground ml-1.5">
                  {t.yenUnit}
                </span>
              </div>
            </div>

            {/* SUB-CARDS GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-indigo-100 dark:border-indigo-900/50">
              <div className="p-3.5 rounded-xl bg-surface border border-border shadow-xs space-y-1">
                <span className="text-[11px] text-muted-foreground block font-medium">
                  {t.tier1Monthly}
                </span>
                <span className="text-lg font-extrabold text-foreground block">
                  {result.benefitBreakdown.tier1.monthlyAmount.toLocaleString()} {t.yenUnit}
                </span>
                <span className="text-[10px] text-indigo-700 dark:text-indigo-300 block">
                  日額: {result.benefitBreakdown.tier1.dailyAmount.toLocaleString()} {t.yenUnit}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-surface border border-border shadow-xs space-y-1">
                <span className="text-[11px] text-muted-foreground block font-medium">
                  {t.tier2Monthly}
                </span>
                <span className="text-lg font-extrabold text-foreground block">
                  {result.benefitBreakdown.tier2.monthlyAmount.toLocaleString()} {t.yenUnit}
                </span>
                <span className="text-[10px] text-indigo-700 dark:text-indigo-300 block">
                  日額: {result.benefitBreakdown.tier2.dailyAmount.toLocaleString()} {t.yenUnit}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-surface border border-border shadow-xs space-y-1">
                <span className="text-[11px] text-muted-foreground block font-medium">
                  {t.wageDailyBasisLabel}
                </span>
                <span className="text-lg font-extrabold text-foreground block">
                  {result.wageDailyBasis.statutoryDailyWage.toLocaleString()} {t.yenUnit}/日
                </span>
                <span className="text-[10px] text-muted-foreground block">
                  {result.wageDailyBasis.isCappedByMaxLimit && t.cappedNotice}
                  {result.wageDailyBasis.isFlooredByMinLimit && t.flooredNotice}
                  {!result.wageDailyBasis.isCappedByMaxLimit && !result.wageDailyBasis.isFlooredByMinLimit && '標準基準'}
                </span>
              </div>
            </div>
          </div>

          {/* TIMELINE VISUALIZER */}
          <div className="bg-surface rounded-2xl p-5 sm:p-6 border border-border shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-border/60">
              <Clock className="w-5 h-5 text-indigo-700 dark:text-indigo-400" />
              <h3 className="text-base sm:text-lg font-bold text-foreground">
                {t.sectionTimeline}
              </h3>
            </div>

            <div className="space-y-3">
              {result.timelineStages.map((stage, idx) => {
                const title = lang === 'vi' ? stage.titleVi : lang === 'en' ? stage.titleEn : stage.titleJa;
                const isBonus = stage.isBonusApplied;
                const isShort = stage.isShortTime;

                return (
                  <div
                    key={stage.stageId}
                    className={`p-4 rounded-xl border transition-all ${
                      isBonus
                        ? 'bg-amber-500/10 border-amber-500/30'
                        : isShort
                        ? 'bg-emerald-500/10 border-emerald-500/30'
                        : 'bg-background/80 border-border'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-indigo-700 dark:bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <h4 className="text-sm font-bold text-foreground">
                            {title}
                          </h4>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              isBonus
                                ? 'bg-amber-500/20 text-amber-900 dark:text-amber-200 border-amber-500/30'
                                : isShort
                                ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30'
                                : 'bg-indigo-500/15 text-indigo-800 dark:text-indigo-300 border-indigo-500/30'
                            }`}
                          >
                            {isBonus ? '+13% 加算' : `${stage.ratePercent}%`}
                          </span>
                        </div>
                      </div>

                      <div className="text-left sm:text-right">
                        <span className="text-base sm:text-lg font-black text-foreground">
                          {stage.totalAmount.toLocaleString()} {t.yenUnit}
                        </span>
                        <span className="text-xs text-muted-foreground block">
                          {stage.days} {t.daysUnit}
                          {stage.monthlyAmount > 0 && ` (約 ${stage.monthlyAmount.toLocaleString()} 円/月)`}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RELATED FAMILY & CHILD TOOLS */}
          <div className="p-5 rounded-2xl bg-primary/5 border border-primary/20 space-y-3">
            <h4 className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>{t.relatedToolsTitle}</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <a
                href="#/tools/maternity-allowance-jp"
                className="p-3 rounded-xl bg-surface border border-border hover:border-primary text-xs text-foreground font-medium flex items-center justify-between transition-colors shadow-xs"
              >
                <span>{t.linkMaternity}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </a>
              <a
                href="#/tools/childcare-leave-eligibility-jp"
                className="p-3 rounded-xl bg-surface border border-border hover:border-primary text-xs text-foreground font-medium flex items-center justify-between transition-colors shadow-xs"
              >
                <span>{t.linkEligibility}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </a>
              <a
                href="#/tools/child-allowance-jp"
                className="p-3 rounded-xl bg-surface border border-border hover:border-primary text-xs text-foreground font-medium flex items-center justify-between transition-colors shadow-xs"
              >
                <span>{t.linkChildAllowance}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </a>
              <a
                href="#/tools/birth-wizard-jp"
                className="p-3 rounded-xl bg-surface border border-border hover:border-primary text-xs text-foreground font-medium flex items-center justify-between transition-colors shadow-xs"
              >
                <span>{t.linkBirthWizard}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </a>
            </div>
          </div>

          {/* REGULATORY SOURCES */}
          <div className="pt-2">
            <RegulatorySourceView sourceIds={CHILDCARE_BENEFIT_SOURCES} lang={lang} />
          </div>
        </section>
      </div>
    </StandardToolLayout>
  );
}
