/**
 * @file packages/core/src/components/employment/UnemploymentBenefitView.jsx
 * @description
 * Giao diện Mô phỏng Tiền Trợ cấp Thất nghiệp Nhật Bản (失業給付シミュレーター)
 * Tuân thủ nghiêm ngặt MAIS: StandardToolLayout 1240px, Design Tokens, Trilingual (ja/vi/en), WCAG AA.
 */

import React, { useState, useMemo } from 'react';
import {
  Calculator,
  Coins,
  Calendar,
  Clock,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Info,
  Layers,
  FileCheck2,
  CheckCircle2,
  UserCheck
} from 'lucide-react';

import StandardToolLayout from '../shared/StandardToolLayout.jsx';
import RegulatorySourceView from '../regulatory/RegulatorySourceView.jsx';
import {
  calculateUnemploymentBenefit,
  EFFECTIVE_PERIODS
} from '../../japan/employment/index.js';

const TRANSLATIONS = {
  ja: {
    toolTitle: '失業給付シミュレーター（基本手当日額・給付日数・受給総額・50%〜80%給付率）',
    toolDesc: '雇用保険法第16条・第22条・第23条および厚生労働省告示に基づき、退職前6ヶ月の賃金と年齢から基本手当日額、所定給付日数、受給総額を正確に試算します。',
    sectionInput: '1. 退職前賃金・年齢・被保険者期間の設定',
    monthlyWageLabel: '直近6ヶ月の月給平均（残業代・諸手当込、賞与・退職金除く）',
    monthlyWageHint: '※ 退職前6ヶ月間に支払われた総賃金（基本給＋残業代＋役職・通勤手当等）の1ヶ月平均を入力してください。',
    yenUnit: '円',
    ageLabel: '退職時の年齢',
    ageHint: '※ 30歳未満、30〜44歳、45〜59歳、60〜64歳で賃金日額および給付日数の上限が異なります。',
    ageUnit: '歳',
    insuredYearsLabel: '雇用保険の通算加入年数（被保険者期間）',
    insuredYearsHint: '※ 過去の会社での加入期間も、離職票をもとに通算されている場合は合算できます。',
    yearsUnit: '年',
    categoryLabel: '離職理由（受給区分）',
    catCompany: '会社都合等（倒産・解雇・ハラスメント・過度な残業など特定受給資格者）',
    catSpecific: '正当な理由のある自己都合・雇止め（特定理由離職者）',
    catPersonal: '通常の自己都合退職（転職準備・起業・個人的休養など一般離職者）',
    favorableCheckLabel: '有期労働契約の雇止め（更新希望したが更新されず終了）に該当しますか？',
    favorableCheckHint: '※ 雇止めの特定理由離職者は、特定受給資格者と同様の有利な所定給付日数が適用されます。',
    difficultCheckLabel: '障害者手帳の交付を受けている等、就職が著しく困難な方に該当しますか？',
    difficultCheckHint: '※ 就職困難者として認定されると、所定給付日数が150日〜360日に大幅延長されます。',
    periodSelectLabel: '適用する厚労省改定基準',
    sectionResult: '2. 試算結果（基本手当日額・受給総額・給付率）',
    cardTotalBenefit: '想定される受給総額',
    cardDailyBenefit: '基本手当日額（1日あたり）',
    cardBenefitDays: '所定給付日数',
    cardBenefitRate: '実効給付率',
    cardDailyWage: '算定賃金日額',
    card4WeeksPayment: '4週（28日）あたりの支給額',
    daysUnit: '日',
    taxFreeNote: '※ 雇用保険の基本手当は非課税所得（所得税・住民税ゼロ、社会保険料天引きなし）です。',
    cappedBadge: '上限額適用',
    flooredBadge: '最低保障額適用',
    sectionDetails: '3. 給付率スライド構造・支給タイムライン',
    wageCurveTitle: '法定スライド給付率（50%〜80%の逆進性）',
    wageCurveDesc: '低賃金層ほど生活防衛のため手厚く（最大80%）、賃金が高い層ほど50%まで低減するスライド曲線が適用されています。',
    timelineTitle: '失業認定と受給スケジュール',
    legalNotesTitle: '雇用保険法に関する重要ポイント',
    legalPoint1Title: '基本手当は完全非課税（第12条）',
    legalPoint1Body: '基本手当には所得税および住民税が一切課税されません。確定申告の必要もなく、額面がそのまま手取りとなります。',
    legalPoint2Title: '受給中のアルバイト・収入申告（第19条）',
    legalPoint2Body: '受給期間中に1日4時間未満のアルバイト・内職等をした場合、失業認定申告書で申告すれば減額または支給先送りとなります（未申告は不正受給になります）。',
    legalPoint3Title: '再就職手当（早期就職のインセンティブ）',
    legalPoint3Body: '所定給付日数を1/3以上（または2/3以上）残して早期に再就職した場合、残日数の60%〜70%が一括支給される「再就職手当」を受け取ることができます。',
    ctaWizard: '退職に伴う全手続き（健康保険・年金・税金・ハローワーク）ガイドを開く'
  },
  vi: {
    toolTitle: 'Mô Phỏng Trợ Cấp Thất Nghiệp Nhật Bản (失業給付シミュレーター)',
    toolDesc: 'Căn cứ Điều 16, 22, 23 Luật Bảo hiểm Việc làm và Thông cáo Bộ Y tế Lao động Phúc lợi (MHLW), tính toán chuẩn xác mức trợ cấp ngày, số ngày hưởng, tổng số tiền thực nhận và tỷ lệ trượt 50%〜80%.',
    sectionInput: '1. Thiết lập tiền lương, độ tuổi & thâm niên bảo hiểm',
    monthlyWageLabel: 'Lương bình quân 6 tháng trước khi nghỉ (Gồm lương cứng + tăng ca, không gồm thưởng)',
    monthlyWageHint: '※ Tính tổng thu nhập chịu bảo hiểm trong 6 tháng chia cho 6 (đã bao gồm tiền làm thêm giờ, phụ cấp chức vụ, đi lại; không tính tiền thưởng bonus hay trợ cấp thôi việc).',
    yenUnit: 'yên',
    ageLabel: 'Tuổi tại thời điểm thôi việc',
    ageHint: '※ Luật phân chia trần tiền lương và trợ cấp theo các nhóm tuổi: <30, 30-44, 45-59 và 60-64 tuổi.',
    ageUnit: 'tuổi',
    insuredYearsLabel: 'Tổng số năm đã đóng bảo hiểm việc làm (通算被保険者期間)',
    insuredYearsHint: '※ Có thể cộng dồn các công ty trước đây nếu thời gian nghỉ giữa các công ty dưới 1 năm.',
    yearsUnit: 'năm',
    categoryLabel: 'Lý do thôi việc (Diện thụ hưởng)',
    catCompany: 'Lỗi công ty / Phá sản / Sa thải / Quấy rối / Tăng ca quá mức (特定受給資格者)',
    catSpecific: 'Lý do cá nhân chính đáng / Hết hạn HĐLĐ (特定理由離職者)',
    catPersonal: 'Tự ý thôi việc / Chuyển việc / Chuẩn bị kinh doanh (一般離職者)',
    favorableCheckLabel: 'Hết hạn hợp đồng có thời hạn và bị công ty từ chối tái ký (雇止め)?',
    favorableCheckHint: '※ Lao động bị từ chối tái ký được hưởng bảng số ngày dài tương đương diện công ty sa thải.',
    difficultCheckLabel: 'Người có sổ khuyết tật hoặc gặp trở ngại sức khỏe nghiêm trọng khi tìm việc (就職困難者)?',
    difficultCheckHint: '※ Được hưởng chế độ đặc biệt với số ngày trợ cấp kéo dài từ 150 đến 360 ngày.',
    periodSelectLabel: 'Biểu chuẩn MHLW áp dụng',
    sectionResult: '2. Kết quả mô phỏng trợ cấp (Số tiền & Ngày hưởng)',
    cardTotalBenefit: 'Ước tính tổng tiền trợ cấp nhận được',
    cardDailyBenefit: 'Trợ cấp mỗi ngày (基本手当日額)',
    cardBenefitDays: 'Số ngày được hưởng trợ cấp',
    cardBenefitRate: 'Tỷ lệ hưởng trợ cấp thực tế',
    cardDailyWage: 'Tiền lương ngày tính toán (賃金日額)',
    card4WeeksPayment: 'Số tiền nhận mỗi đợt 4 tuần (28 ngày)',
    daysUnit: 'ngày',
    taxFreeNote: '※ Trợ cấp thất nghiệp Nhật Bản được MIỄN THUẾ HOÀN TOÀN (Không chịu thuế TNCN, thuế cư trú, không trừ BHXH).',
    cappedBadge: 'Đụng trần tối đa',
    flooredBadge: 'Hưởng sàn tối thiểu',
    sectionDetails: '3. Phân tích đường cong trợ cấp & Quyền lợi',
    wageCurveTitle: 'Đường cong trợ cấp 50%〜80% (Bảo vệ người thu nhập thấp)',
    wageCurveDesc: 'Luật Nhật Bản áp dụng cơ chế lũy thoái: người lương thấp được nhận trợ cấp lên đến 80% lương ngày, người lương cao giảm dần về 50% và chặn trần tối đa theo độ tuổi.',
    timelineTitle: 'Tiến độ chi trả và thanh toán',
    legalNotesTitle: 'Quy tắc pháp lý quan trọng về trợ cấp thất nghiệp',
    legalPoint1Title: 'Miễn thuế thu nhập và thuế cư trú 100% (Điều 12)',
    legalPoint1Body: 'Khoản trợ cấp thất nghiệp là thu nhập phi thuế (非課税所得). Toàn bộ số tiền nhận về tài khoản là thực nhận net 100%, không bị trừ thuế hay bảo hiểm.',
    legalPoint2Title: 'Làm thêm trong thời gian nhận trợ cấp (Điều 19)',
    legalPoint2Body: 'Nếu làm thêm dưới 4 tiếng/ngày, bạn vẫn được bảo lưu ngày hưởng trợ cấp sang hôm sau. Tuy nhiên PHẢI KHAI BÁO trung thực vào phiếu xin chứng nhận thất nghiệp định kỳ.',
    legalPoint3Title: 'Trợ cấp tái xin việc sớm (再就職手当)',
    legalPoint3Body: 'Nếu bạn tìm được công việc mới chính thức khi còn dư trên 1/3 (hoặc 2/3) số ngày trợ cấp, bạn sẽ được thưởng một cục bằng 60%〜70% tổng số tiền trợ cấp của những ngày còn lại.',
    ctaWizard: 'Mở Cẩm nang Thủ tục Nghỉ việc Toàn diện (Thuế, BHYT, Lương hưu, Thất nghiệp)'
  },
  en: {
    toolTitle: 'Japan Unemployment Benefits Simulator (失業給付シミュレーター)',
    toolDesc: 'Statutory calculation of Basic Daily Allowance, Prescribed Days, and Total Payout under Articles 16, 22 & 23 of Employment Insurance Act and MHLW standard rate schedules.',
    sectionInput: '1. Prior Wages, Age & Insurance Record',
    monthlyWageLabel: 'Average Monthly Gross Wage over Prior 6 Months (incl. Overtime, excl. Bonus)',
    monthlyWageHint: '※ Total gross salary in the 6 months before separation divided by 6 (base wage + overtime + transport allowance; exclude biannual bonuses).',
    yenUnit: 'JPY',
    ageLabel: 'Age at Separation',
    ageHint: '※ Daily wage and benefit maximum caps vary by age groups: <30, 30-44, 45-59, and 60-64.',
    ageUnit: 'yrs',
    insuredYearsLabel: 'Total Insured Years in Employment Insurance',
    insuredYearsHint: '※ Years can be combined across prior employers if the employment gap was under 1 year.',
    yearsUnit: 'years',
    categoryLabel: 'Reason for Separation (Category)',
    catCompany: 'Company Attributable / Restructuring / Harassment / Dismissal (Type A)',
    catSpecific: 'Specific Justified Reason / Contract Expiry (Type B)',
    catPersonal: 'Standard Voluntary Resignation (Type C)',
    favorableCheckLabel: 'Was your fixed-term contract terminated without renewal against your wish (雇止め)?',
    favorableCheckHint: '※ Non-renewed fixed-term workers receive the favorable company-cause duration table.',
    difficultCheckLabel: 'Eligible as a person with disabilities or facing substantial re-employment barriers?',
    difficultCheckHint: '※ Difficult-to-employ status significantly extends benefit duration to 150 - 360 days.',
    periodSelectLabel: 'MHLW Revision Schedule',
    sectionResult: '2. Calculation Results (Daily Allowance, Days & Total)',
    cardTotalBenefit: 'Estimated Total Benefit Payout',
    cardDailyBenefit: 'Basic Daily Allowance (1 day)',
    cardBenefitDays: 'Prescribed Benefit Days',
    cardBenefitRate: 'Effective Benefit Rate',
    cardDailyWage: 'Statutory Daily Wage Base',
    card4WeeksPayment: 'Per 4-Week Payment (28 Days)',
    daysUnit: 'days',
    taxFreeNote: '※ Japan Employment Insurance benefits are completely tax-free (no income/resident tax or social deductions).',
    cappedBadge: 'Statutory Cap Reached',
    flooredBadge: 'Minimum Floor Applied',
    sectionDetails: '3. Sliding Scale Benefit Curve & Guidelines',
    wageCurveTitle: 'Statutory 50%〜80% Sliding Scale Curve',
    wageCurveDesc: 'Designed to protect low-income leavers with up to an 80% replacement rate, tapering to 50% for high earners up to statutory age caps.',
    timelineTitle: 'Certification & Disbursement Cycle',
    legalNotesTitle: 'Key Statutory Rules Regarding Benefits',
    legalPoint1Title: 'Completely Tax-Exempt Income (Article 12)',
    legalPoint1Body: 'Unemployment benefits are exempt from Japanese income tax, inhabitant tax, and social health deductions. 100% of the disbursed sum is net payout.',
    legalPoint2Title: 'Part-Time Work Declarations (Article 19)',
    legalPoint2Body: 'Part-time work under 4 hours/day during benefit periods must be declared on your 4-week certification report to push the benefit day forward.',
    legalPoint3Title: 'Early Re-employment Allowance (再就職手当)',
    legalPoint3Body: 'Securing a full-time position with 1/3+ (or 2/3+) remaining benefit days earns a lump-sum re-employment bonus of 60%〜70% of remaining benefits.',
    ctaWizard: 'Open Complete Japan Job Leaver Transition Guide (Tax, Health, Pension, Hello Work)'
  }
};

export default function UnemploymentBenefitView({ lang = 'ja' }) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.ja;

  // Form State
  const [monthlyWage, setMonthlyWage] = useState(300000);
  const [age, setAge] = useState(32);
  const [insuredYears, setInsuredYears] = useState(5);
  const [separationCategory, setSeparationCategory] = useState('COMPANY_CAUSE');
  const [isFavorableDuration, setIsFavorableDuration] = useState(false);
  const [isDifficultToEmploy, setIsDifficultToEmploy] = useState(false);
  const [targetDate, setTargetDate] = useState('2026-09-01');

  // Calculation via Statutory Engine
  const result = useMemo(() => {
    return calculateUnemploymentBenefit({
      monthlyWage: Number(monthlyWage) || 0,
      age: Number(age) || 30,
      insuredYears: Number(insuredYears) || 1,
      separationCategory,
      isFavorableDuration: separationCategory === 'SPECIFIC_REASONS' ? isFavorableDuration : false,
      isDifficultToEmploy,
      targetDate
    });
  }, [monthlyWage, age, insuredYears, separationCategory, isFavorableDuration, isDifficultToEmploy, targetDate]);

  return (
    <StandardToolLayout
      title={t.toolTitle}
      description={t.toolDesc}
    >
      <div className="space-y-8 max-w-[1240px] w-full mx-auto text-on-surface">
        {/* Section 1: Inputs */}
        <section className="bg-surface-container rounded-2xl p-4 sm:p-6 border border-outline-variant/30 shadow-sm space-y-6 max-w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-outline-variant/20 pb-4 gap-3">
            <div className="flex items-center gap-3">
              <Calculator className="w-6 h-6 text-primary shrink-0" />
              <h2 className="text-base sm:text-lg font-bold text-on-surface">{t.sectionInput}</h2>
            </div>
            {/* Effective Period Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 text-xs">
              <span className="text-on-surface-variant font-medium">{t.periodSelectLabel}:</span>
              <select
                id="period-select"
                aria-label={t.periodSelectLabel}
                value={targetDate >= '2026-08-01' ? '2026-09-01' : '2026-05-01'}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full sm:w-auto px-3 py-1.5 rounded-lg border border-outline-variant/50 bg-surface text-on-surface text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="2026-09-01">{EFFECTIVE_PERIODS.PERIOD_2026_08.nameJa}</option>
                <option value="2026-05-01">{EFFECTIVE_PERIODS.PERIOD_2025_08.nameJa}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Monthly Wage Input */}
            <div className="space-y-2">
              <label
                htmlFor="monthly-wage-input"
                className="block text-sm font-semibold text-on-surface"
              >
                {t.monthlyWageLabel}
              </label>
              <div className="relative">
                <input
                  id="monthly-wage-input"
                  aria-label={t.monthlyWageLabel}
                  type="number"
                  step="10000"
                  min="0"
                  max="5000000"
                  value={monthlyWage}
                  onChange={(e) => setMonthlyWage(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/50 bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary font-bold text-sm pr-16"
                />
                <span className="absolute right-4 top-2.5 text-sm text-on-surface-variant font-medium">
                  {t.yenUnit}
                </span>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                {t.monthlyWageHint}
              </p>
            </div>

            {/* Age at Separation */}
            <div className="space-y-2">
              <label
                htmlFor="age-input"
                className="block text-sm font-semibold text-on-surface"
              >
                {t.ageLabel}
              </label>
              <div className="relative">
                <input
                  id="age-input"
                  aria-label={t.ageLabel}
                  type="number"
                  min="15"
                  max="64"
                  value={age}
                  onChange={(e) => setAge(Math.max(15, Math.min(64, parseInt(e.target.value, 10) || 30)))}
                  className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/50 bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary font-bold text-sm pr-16"
                />
                <span className="absolute right-4 top-2.5 text-sm text-on-surface-variant font-medium">
                  {t.ageUnit}
                </span>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                {t.ageHint}
              </p>
            </div>

            {/* Total Insured Years */}
            <div className="space-y-2">
              <label
                htmlFor="insured-years-input"
                className="block text-sm font-semibold text-on-surface"
              >
                {t.insuredYearsLabel}
              </label>
              <div className="relative">
                <input
                  id="insured-years-input"
                  aria-label={t.insuredYearsLabel}
                  type="number"
                  step="0.5"
                  min="0"
                  max="45"
                  value={insuredYears}
                  onChange={(e) => setInsuredYears(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/50 bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary font-bold text-sm pr-16"
                />
                <span className="absolute right-4 top-2.5 text-sm text-on-surface-variant font-medium">
                  {t.yearsUnit}
                </span>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                {t.insuredYearsHint}
              </p>
            </div>

            {/* Separation Reason Category */}
            <div className="space-y-2 md:col-span-3">
              <label
                htmlFor="category-select"
                className="block text-sm font-semibold text-on-surface"
              >
                {t.categoryLabel}
              </label>
              <select
                id="category-select"
                aria-label={t.categoryLabel}
                value={separationCategory}
                onChange={(e) => setSeparationCategory(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/50 bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary text-sm font-medium"
              >
                <option value="COMPANY_CAUSE">{t.catCompany}</option>
                <option value="SPECIFIC_REASONS">{t.catSpecific}</option>
                <option value="PERSONAL_VOLUNTARY">{t.catPersonal}</option>
              </select>
            </div>

            {/* Optional Checkboxes */}
            <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {separationCategory === 'SPECIFIC_REASONS' && (
                <div className="p-3.5 rounded-xl bg-surface border border-outline-variant/30 flex items-start gap-3">
                  <input
                    id="favorable-check"
                    aria-label={t.favorableCheckLabel}
                    type="checkbox"
                    checked={isFavorableDuration}
                    onChange={(e) => setIsFavorableDuration(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-primary rounded border-outline-variant/50 focus:ring-primary"
                  />
                  <div>
                    <label
                      htmlFor="favorable-check"
                      className="text-xs font-bold text-on-surface cursor-pointer"
                    >
                      {t.favorableCheckLabel}
                    </label>
                    <p className="text-[11px] text-on-surface-variant mt-0.5">
                      {t.favorableCheckHint}
                    </p>
                  </div>
                </div>
              )}

              <div className="p-3.5 rounded-xl bg-surface border border-outline-variant/30 flex items-start gap-3">
                <input
                  id="difficult-check"
                  aria-label={t.difficultCheckLabel}
                  type="checkbox"
                  checked={isDifficultToEmploy}
                  onChange={(e) => setIsDifficultToEmploy(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-primary rounded border-outline-variant/50 focus:ring-primary"
                />
                <div>
                  <label
                    htmlFor="difficult-check"
                    className="text-xs font-bold text-on-surface cursor-pointer"
                  >
                    {t.difficultCheckLabel}
                  </label>
                  <p className="text-[11px] text-on-surface-variant mt-0.5">
                    {t.difficultCheckHint}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Results Overview */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 border-b border-outline-variant/20 pb-3">
            <Coins className="w-6 h-6 text-primary" />
            <h2 className="text-lg font-bold text-on-surface">{t.sectionResult}</h2>
          </div>

          {/* Master Highlight Banner: Total Benefit */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border-2 border-primary/30 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                  {t.cardTotalBenefit}
                </span>
                {result.isCapped && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/15 text-amber-700 dark:text-amber-400">
                    {t.cappedBadge}
                  </span>
                )}
                {result.isFloored && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500/15 text-blue-700 dark:text-blue-400">
                    {t.flooredBadge}
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl md:text-5xl font-black text-on-surface tracking-tight">
                  {result.totalBenefitAmount.toLocaleString()}
                </p>
                <span className="text-xl font-bold text-on-surface-variant">{t.yenUnit}</span>
              </div>
              <p className="text-xs text-on-surface-variant font-medium">
                {t.taxFreeNote}
              </p>
            </div>

            {/* 4-Week Payment Sub-card */}
            <div className="p-4 rounded-xl bg-surface border border-outline-variant/30 space-y-1 md:min-w-[240px]">
              <span className="text-xs text-on-surface-variant font-medium block">
                {t.card4WeeksPayment}
              </span>
              <p className="text-xl md:text-2xl font-black text-primary">
                {result.fourWeekCycleAmount.toLocaleString()} <span className="text-xs font-normal text-on-surface-variant">{t.yenUnit}</span>
              </p>
              <span className="text-[11px] text-on-surface-variant block">
                ≈ {result.approxMonthlyEquivalent.toLocaleString()} {t.yenUnit} / tháng
              </span>
            </div>
          </div>

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Card 1: Daily Benefit */}
            <div className="bg-surface-container rounded-xl p-4 border border-outline-variant/30 space-y-1 shadow-sm">
              <span className="text-xs text-on-surface-variant font-medium block">
                {t.cardDailyBenefit}
              </span>
              <p className="text-xl md:text-2xl font-extrabold text-on-surface">
                {result.basicDailyBenefit.toLocaleString()} <span className="text-xs font-normal">{t.yenUnit}</span>
              </p>
              <span className="text-[11px] text-on-surface-variant block">
                上限: {result.dailyBenefitMax.toLocaleString()} {t.yenUnit}
              </span>
            </div>

            {/* Card 2: Benefit Days */}
            <div className="bg-surface-container rounded-xl p-4 border border-outline-variant/30 space-y-1 shadow-sm">
              <span className="text-xs text-on-surface-variant font-medium block">
                {t.cardBenefitDays}
              </span>
              <p className="text-xl md:text-2xl font-extrabold text-primary">
                {result.prescribedBenefitDays} <span className="text-xs font-normal">{t.daysUnit}</span>
              </p>
              <span className="text-[11px] text-on-surface-variant block line-clamp-1">
                {lang === 'ja' ? result.durationCategoryJa : result.durationCategoryVi}
              </span>
            </div>

            {/* Card 3: Effective Rate */}
            <div className="bg-surface-container rounded-xl p-4 border border-outline-variant/30 space-y-1 shadow-sm">
              <span className="text-xs text-on-surface-variant font-medium block">
                {t.cardBenefitRate}
              </span>
              <p className="text-xl md:text-2xl font-extrabold text-emerald-700 dark:text-emerald-400">
                {result.effectiveBenefitRatePercent}%
              </p>
              <span className="text-[11px] text-on-surface-variant block">
                法定基準: 50%〜80%
              </span>
            </div>

            {/* Card 4: Daily Wage Base */}
            <div className="bg-surface-container rounded-xl p-4 border border-outline-variant/30 space-y-1 shadow-sm">
              <span className="text-xs text-on-surface-variant font-medium block">
                {t.cardDailyWage}
              </span>
              <p className="text-xl md:text-2xl font-extrabold text-on-surface">
                {result.dailyWage.toLocaleString()} <span className="text-xs font-normal">{t.yenUnit}</span>
              </p>
              <span className="text-[11px] text-on-surface-variant block">
                6ヶ月賃金計 / 180日
              </span>
            </div>
          </div>
        </section>

        {/* Section 3: Statutory Curve Explanation & Visual Guide */}
        <section className="bg-surface-container rounded-2xl p-4 sm:p-6 border border-outline-variant/30 shadow-sm space-y-4 max-w-full overflow-hidden">
          <div className="flex items-center gap-3 border-b border-outline-variant/20 pb-4">
            <TrendingUp className="w-6 h-6 text-primary shrink-0" />
            <div>
              <h2 className="text-base sm:text-lg font-bold text-on-surface">{t.wageCurveTitle}</h2>
              <p className="text-xs text-on-surface-variant">{t.wageCurveDesc}</p>
            </div>
          </div>

          <div className="overflow-x-auto w-full max-w-full">
            <table className="w-full text-left text-xs border-collapse min-w-[520px]">
              <thead>
                <tr className="border-b border-outline-variant/30 text-on-surface-variant font-semibold">
                  <th className="py-2.5 px-3">賃金日額区分 (Daily Wage Tier)</th>
                  <th className="py-2.5 px-3">給付率 (Benefit Rate)</th>
                  <th className="py-2.5 px-3">基本手当日額の目安</th>
                  <th className="py-2.5 px-3">判定</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                <tr className={result.dailyWage <= 5280 ? 'bg-surface-container-high font-bold' : ''}>
                  <td className="py-2.5 px-3">5,280円 以下 (低賃金層)</td>
                  <td className="py-2.5 px-3 text-emerald-700 dark:text-emerald-400 font-bold">80%</td>
                  <td className="py-2.5 px-3">2,295円 〜 4,224円</td>
                  <td className="py-2.5 px-3">
                    {result.dailyWage <= 5280 && <span className="px-2 py-0.5 rounded-full text-[10px] bg-primary text-on-primary">該当</span>}
                  </td>
                </tr>
                <tr className={result.dailyWage > 5280 && result.dailyWage <= 12980 ? 'bg-surface-container-high font-bold' : ''}>
                  <td className="py-2.5 px-3">5,281円 〜 12,980円 (中間層)</td>
                  <td className="py-2.5 px-3 text-primary font-bold">80% 〜 50% スライド逓減</td>
                  <td className="py-2.5 px-3">4,225円 〜 6,490円</td>
                  <td className="py-2.5 px-3">
                    {result.dailyWage > 5280 && result.dailyWage <= 12980 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-primary text-on-primary">該当 ({result.effectiveBenefitRatePercent}%)</span>
                    )}
                  </td>
                </tr>
                <tr className={result.dailyWage > 12980 ? 'bg-surface-container-high font-bold' : ''}>
                  <td className="py-2.5 px-3">12,981円 以上 (高賃金層)</td>
                  <td className="py-2.5 px-3 text-blue-700 dark:text-blue-400 font-bold">50%（60〜64歳は45%）※上限あり</td>
                  <td className="py-2.5 px-3">6,491円 〜 上限 {result.dailyBenefitMax.toLocaleString()}円</td>
                  <td className="py-2.5 px-3">
                    {result.dailyWage > 12980 && <span className="px-2 py-0.5 rounded-full text-[10px] bg-primary text-on-primary">該当</span>}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 4: Deep Link CTA to Wizard */}
        <section className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl p-4 sm:p-6 border border-primary/20 flex flex-col md:flex-row items-center justify-between gap-4 max-w-full">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              {t.ctaWizard}
            </h3>
            <p className="text-xs text-on-surface-variant">
              Khám phá quy trình từng bước trước khi nghỉ, ngày nộp đơn, thời gian chuyển đổi bảo hiểm y tế và lương hưu quốc dân.
            </p>
          </div>
          <a
            href="#/tools/leaving-job-wizard-jp"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shrink-0 shadow-sm"
          >
            <span>{t.ctaWizard}</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </section>

        {/* Section 5: Legal Notes */}
        <section className="bg-surface-container rounded-2xl p-4 sm:p-6 border border-outline-variant/30 shadow-sm space-y-4 max-w-full">
          <div className="flex items-center gap-3 border-b border-outline-variant/20 pb-4">
            <ShieldCheck className="w-6 h-6 text-primary" />
            <h2 className="text-lg font-bold text-on-surface">{t.legalNotesTitle}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-surface border border-outline-variant/30 space-y-1.5">
              <h3 className="font-bold text-on-surface flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                {t.legalPoint1Title}
              </h3>
              <p className="text-on-surface-variant leading-relaxed">{t.legalPoint1Body}</p>
            </div>

            <div className="p-4 rounded-xl bg-surface border border-outline-variant/30 space-y-1.5">
              <h3 className="font-bold text-on-surface flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                {t.legalPoint2Title}
              </h3>
              <p className="text-on-surface-variant leading-relaxed">{t.legalPoint2Body}</p>
            </div>

            <div className="p-4 rounded-xl bg-surface border border-outline-variant/30 space-y-1.5">
              <h3 className="font-bold text-on-surface flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                {t.legalPoint3Title}
              </h3>
              <p className="text-on-surface-variant leading-relaxed">{t.legalPoint3Body}</p>
            </div>
          </div>
        </section>

        {/* Section 6: Official Regulatory Sources */}
        <RegulatorySourceView sources={result.sources} lang={lang} />
      </div>
    </StandardToolLayout>
  );
}
