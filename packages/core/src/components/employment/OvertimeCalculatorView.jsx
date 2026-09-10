/**
 * @file packages/core/src/components/employment/OvertimeCalculatorView.jsx
 * @description Giao diện mô phỏng tiền làm thêm giờ (残業代シミュレーター).
 * 100% Client-side, chuẩn thiết kế Toolio StandardToolLayout, WCAG AA contrast.
 */

import React, { useState, useMemo } from 'react';
import {
  Clock,
  Coins,
  Calculator,
  Info,
  Calendar,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  ReceiptText,
} from 'lucide-react';

import StandardToolLayout from '../shared/StandardToolLayout.jsx';
import RegulatorySourceView from '../regulatory/RegulatorySourceView.jsx';
import {
  calculateOvertimePay,
  STATUTORY_PREMIUM_RATES,
  STATUTORY_EXCLUDED_ALLOWANCES,
} from '../../japan/employment/index.js';

const I18N = {
  ja: {
    title: '残業代シミュレーター',
    badge: '労働基準法第37条準拠',
    subtitle: '時間外・深夜・休日労働の割増賃金（月60時間超の50%割増対応）を精密試算。100%ブラウザ完結。',
    wageSettings: '基本給・所定労働時間の設定',
    wageTypeLabel: '給与形態',
    monthly: '月給制',
    daily: '日給制',
    hourly: '時給制',
    baseWageLabel: '支給総額（基本給 ＋ 各種手当）',
    baseWageMonthlyPlaceholder: '例: 320000',
    baseWageHourlyPlaceholder: '例: 1500',
    excludedAllowancesHeader: '除外賃金（法律上、割増基礎から控除できる手当）',
    excludedAllowancesHint: '通勤手当・家族手当・住宅手当（実費連動）など7つの除外対象手当の合計額を入力してください。',
    excludedTotalLabel: '除外手当の合計額（円）',
    showExcludedGuide: '除外できる7つの手当一覧を見る',
    hideExcludedGuide: '手当一覧を閉じる',
    prescribedHoursHeader: '1か月の平均所定労働時間',
    prescribedHoursHint: '就業規則や雇用契約書に定められた所定労働時間（年間労働日数から算出、または月平均時間を直接入力）。',
    enterDirectly: '月平均時間を直接入力',
    calcFromYearly: '年間労働日数から自動計算',
    monthlyHoursLabel: '月平均所定労働時間（時間）',
    yearlyDaysLabel: '年間の所定労働日数（日）',
    dailyHoursLabel: '1日の所定労働時間（時間）',
    overtimeHoursSection: '時間外・深夜・休日労働の実績時間',
    normalOvertime: '法定時間外労働（月60時間以下）',
    normalOvertimeDesc: '1日8時間・週40時間を超える時間外労働（割増率 25%・1.25倍）',
    above60Overtime: '月60時間を超える時間外労働',
    above60OvertimeDesc: '月60時間を超えた部分の残業時間（割増率 50%・1.50倍 / 中小企業も適用）',
    lateNight: '深夜労働（22時〜翌朝5時）',
    lateNightDesc: '夜22時から翌朝5時までの労働時間（通常残業に加算される場合は＋25%割増）',
    statutoryHoliday: '法定休日労働',
    statutoryHolidayDesc: '週1回または4週4日の法定休日に勤務した時間（割増率 35%・1.35倍）',
    holidayLateNight: '法定休日 ＋ 深夜労働',
    holidayLateNightDesc: '法定休日の夜22時〜翌5時に勤務した時間（割増率 60%・1.60倍）',
    resultsSection: '試算結果サマリー',
    baseHourlyWageCard: '基礎賃金（1時間当たり）',
    totalOvertimeHoursCard: '総残業時間',
    totalOvertimePayCard: '残業代支給総額',
    totalPremiumCard: 'うち割増手当分（純増額）',
    breakdownSection: '割増内訳明細（法定基準）',
    categoryCol: '労働区分',
    hoursCol: '時間',
    rateCol: '割増倍率',
    premiumCol: '割増額（純増分）',
    totalPayCol: '支給額（全額換算）',
    whySection: 'なぜこの計算になるのか？（労働基準法の解説）',
    lawExplanation1: '労働基準法第37条では、使用者が労働者に時間外労働をさせた場合、通常の賃金の25%以上の割増賃金を支払う義務があります。',
    lawExplanation2: '2023年4月以降、中小企業を含むすべての企業で「月60時間を超える時間外労働」に対して50%以上の割増率が義務付けられています。',
    lawExplanation3: '通勤手当や家族手当など法律で定められた7つの手当以外は、役職手当や皆勤手当も含めすべて割増基礎賃金に含めなければなりません。',
    sourcesSection: '公式法規・ガイドライン参照',
    yen: '円',
    hoursUnit: '時間',
    estimatedBadge: '※ 推定値（160時間換算）',
    officialBasisBadge: '法定基準',
  },
  vi: {
    title: 'Mô Phỏng Tiền Làm Thêm Giờ (残業代)',
    badge: 'Chuẩn Điều 37 Luật Tiêu chuẩn Lao động',
    subtitle: 'Tính toán chính xác tiền lương phụ trội ngoài giờ, làm đêm, ngày nghỉ (bao gồm phụ trội 50% khi vượt 60h/tháng). 100% xử lý nội bộ trình duyệt.',
    wageSettings: 'Cài đặt Tiền Lương & Giờ Làm Việc Quy Định',
    wageTypeLabel: 'Hình thức trả lương',
    monthly: 'Lương tháng (月給)',
    daily: 'Lương ngày (日給)',
    hourly: 'Lương giờ (時給)',
    baseWageLabel: 'Tổng thu nhập hàng tháng (Lương cơ bản + Phụ cấp)',
    baseWageMonthlyPlaceholder: 'Ví dụ: 320000',
    baseWageHourlyPlaceholder: 'Ví dụ: 1500',
    excludedAllowancesHeader: 'Phụ cấp loại trừ theo luật (除外賃金)',
    excludedAllowancesHint: 'Nhập tổng các khoản phụ cấp được phép loại trừ khỏi cơ sở lương giờ: đi lại, gia đình, nhà ở theo chi phí thực...',
    excludedTotalLabel: 'Tổng tiền các phụ cấp loại trừ (円)',
    showExcludedGuide: 'Xem danh sách 7 khoản phụ cấp loại trừ',
    hideExcludedGuide: 'Đóng danh sách',
    prescribedHoursHeader: 'Số giờ làm việc quy định bình quân 1 tháng',
    prescribedHoursHint: 'Số giờ quy định trong hợp đồng lao động / nội quy công ty (tính theo ngày làm việc cả năm hoặc nhập số giờ bình quân).',
    enterDirectly: 'Nhập số giờ bình quân trực tiếp',
    calcFromYearly: 'Tính tự động từ số ngày làm việc trong năm',
    monthlyHoursLabel: 'Số giờ quy định bình quân/tháng (Giờ)',
    yearlyDaysLabel: 'Số ngày làm việc quy định/năm (Ngày)',
    dailyHoursLabel: 'Số giờ làm việc quy định/ngày (Giờ)',
    overtimeHoursSection: 'Thống Kê Số Giờ Làm Thêm Giờ Thực Tế',
    normalOvertime: 'Làm thêm giờ thông thường (dưới 60h/tháng)',
    normalOvertimeDesc: 'Thời gian làm vượt 8h/ngày hoặc 40h/tuần (Hệ số 1.25x / Tăng 25%)',
    above60Overtime: 'Làm thêm giờ vượt 60h/tháng',
    above60OvertimeDesc: 'Thời gian làm thêm vượt mốc 60 giờ trong tháng (Hệ số 1.50x / Tăng 50% - áp dụng cho mọi DN)',
    lateNight: 'Làm việc ban đêm (22:00 - 05:00)',
    lateNightDesc: 'Làm việc trong khung giờ 22h đêm đến 5h sáng (Phụ trội thêm +25%)',
    statutoryHoliday: 'Làm việc vào ngày nghỉ luật định (法定休日)',
    statutoryHolidayDesc: 'Làm vào ngày nghỉ bắt buộc tối thiểu 1 ngày/tuần theo luật (Hệ số 1.35x / Tăng 35%)',
    holidayLateNight: 'Làm ngày nghỉ luật định + Ban đêm',
    holidayLateNightDesc: 'Làm việc vào ngày nghỉ luật định trong khung giờ 22h - 5h (Hệ số 1.60x / Tăng 60%)',
    resultsSection: 'Tổng Hợp Kết Quả Tính Toán',
    baseHourlyWageCard: 'Lương giờ làm căn cứ (基礎賃金)',
    totalOvertimeHoursCard: 'Tổng giờ làm thêm',
    totalOvertimePayCard: 'Tổng tiền làm thêm giờ (Dự tính)',
    totalPremiumCard: 'Trong đó phần phụ trội thuần (+%)',
    breakdownSection: 'Bảng Kê Chi Tiết Từng Loại Phụ Trội',
    categoryCol: 'Phân loại lao động',
    hoursCol: 'Số giờ',
    rateCol: 'Hệ số',
    premiumCol: 'Phụ trội (+%)',
    totalPayCol: 'Thực nhận (Tổng)',
    whySection: 'Tại sao lại có công thức này? (Căn cứ pháp lý)',
    lawExplanation1: 'Theo Điều 37 Luật Tiêu chuẩn Lao động Nhật Bản, người sử dụng lao động bắt buộc phải trả lương phụ trội tối thiểu 25% cho thời gian làm thêm ngoài giờ.',
    lawExplanation2: 'Từ ngày 01/04/2023, quy định mức phụ trội 50% cho số giờ làm thêm vượt 60h/tháng đã chính thức áp dụng bắt buộc cho cả doanh nghiệp vừa và nhỏ (中小企業).',
    lawExplanation3: 'Ngoại trừ 7 khoản phụ cấp luật định (đi lại, gia đình, con cái, nhà ở thực tế...), mọi phụ cấp chức vụ, chuyên cần, tay nghề đều bắt buộc phải tính vào cơ sở lương giờ.',
    sourcesSection: 'Văn Bản Pháp Quy & Hướng Dẫn Chính Thống',
    yen: '円',
    hoursUnit: 'giờ',
    estimatedBadge: '※ Ước tính (chuẩn 160h)',
    officialBasisBadge: 'Căn cứ luật định',
  },
  en: {
    title: 'Japan Overtime Pay Simulator',
    badge: 'Labor Standards Act Art. 37 Compliant',
    subtitle: 'Accurate simulation of statutory overtime, late-night, and holiday wage premiums (including 50% premium over 60h/mo). 100% client-side.',
    wageSettings: 'Wage & Prescribed Hours Configuration',
    wageTypeLabel: 'Wage Type',
    monthly: 'Monthly Salary',
    daily: 'Daily Wage',
    hourly: 'Hourly Wage',
    baseWageLabel: 'Gross Monthly Wage (Base salary + Allowances)',
    baseWageMonthlyPlaceholder: 'e.g. 320000',
    baseWageHourlyPlaceholder: 'e.g. 1500',
    excludedAllowancesHeader: 'Statutory Excluded Allowances (除外賃金)',
    excludedAllowancesHint: 'Enter total of statutory allowances excluded from overtime base: commute, family, expense-linked housing...',
    excludedTotalLabel: 'Total Excluded Allowances (JPY)',
    showExcludedGuide: 'View the 7 statutory excluded allowance categories',
    hideExcludedGuide: 'Hide allowance details',
    prescribedHoursHeader: 'Average Monthly Prescribed Working Hours',
    prescribedHoursHint: 'Scheduled working hours from employment contract (calculated from annual working days or entered directly).',
    enterDirectly: 'Enter monthly average directly',
    calcFromYearly: 'Calculate from annual working days',
    monthlyHoursLabel: 'Avg Prescribed Hours/Month (Hours)',
    yearlyDaysLabel: 'Annual Scheduled Working Days (Days)',
    dailyHoursLabel: 'Daily Scheduled Hours (Hours)',
    overtimeHoursSection: 'Actual Overtime Hours Input',
    normalOvertime: 'Standard Overtime (<= 60h/mo)',
    normalOvertimeDesc: 'Hours exceeding 8h/day or 40h/week (25% premium / 1.25x multiplier)',
    above60Overtime: 'Overtime Exceeding 60h/month',
    above60OvertimeDesc: 'Overtime hours beyond 60h/month threshold (50% premium / 1.50x multiplier)',
    lateNight: 'Late-Night Work (22:00 - 05:00)',
    lateNightDesc: 'Hours worked between 22:00 and 05:00 (+25% premium added)',
    statutoryHoliday: 'Statutory Holiday Work',
    statutoryHolidayDesc: 'Work on mandatory weekly rest day (35% premium / 1.35x multiplier)',
    holidayLateNight: 'Statutory Holiday + Late-Night',
    holidayLateNightDesc: 'Work on statutory holiday between 22:00 and 05:00 (60% premium / 1.60x multiplier)',
    resultsSection: 'Calculation Summary',
    baseHourlyWageCard: 'Base Hourly Wage (基礎賃金)',
    totalOvertimeHoursCard: 'Total Overtime Hours',
    totalOvertimePayCard: 'Total Overtime Pay (Estimated)',
    totalPremiumCard: 'Of which pure premium (+%)',
    breakdownSection: 'Statutory Premium Breakdown',
    categoryCol: 'Category',
    hoursCol: 'Hours',
    rateCol: 'Multiplier',
    premiumCol: 'Premium (+%)',
    totalPayCol: 'Total Pay',
    whySection: 'Why this formula? (Legal Explanation)',
    lawExplanation1: 'Under Article 37 of Japan\'s Labor Standards Act, employers are mandated to pay at least 25% extra wage for hours worked outside statutory limits.',
    lawExplanation2: 'Since April 2023, the 50% premium rate for overtime exceeding 60 hours per month applies equally to all enterprises including SMEs.',
    lawExplanation3: 'Except for 7 statutory excluded allowances (commute, family, child education, expense-linked housing), all regular allowances must be included in the base hourly rate.',
    sourcesSection: 'Official Regulatory Sources',
    yen: 'JPY',
    hoursUnit: 'hrs',
    estimatedBadge: '※ Estimated (160h standard)',
    officialBasisBadge: 'Statutory Basis',
  },
};

export default function OvertimeCalculatorView({ lang = 'ja' }) {
  const t = I18N[lang] || I18N.ja;

  // Form State
  const [wageType, setWageType] = useState('monthly');
  const [baseWage, setBaseWage] = useState('300000');
  const [excludedAllowances, setExcludedAllowances] = useState('20000');
  const [showExcludedGuide, setShowExcludedGuide] = useState(false);

  const [hoursMode, setHoursMode] = useState('direct'); // 'direct' | 'yearly'
  const [averageMonthlyHours, setAverageMonthlyHours] = useState('160');
  const [annualScheduledDays, setAnnualScheduledDays] = useState('245');
  const [dailyScheduledHours, setDailyScheduledHours] = useState('8');

  // Overtime Hours State
  const [normalOvertimeHours, setNormalOvertimeHours] = useState('30');
  const [overtimeAbove60h, setOvertimeAbove60h] = useState('0');
  const [lateNightHours, setLateNightHours] = useState('5');
  const [statutoryHolidayHours, setStatutoryHolidayHours] = useState('0');
  const [holidayLateNightHours, setHolidayLateNightHours] = useState('0');

  // Engine Calculation
  const result = useMemo(() => {
    return calculateOvertimePay({
      wageType,
      baseWage: Number(baseWage) || 0,
      excludedAllowances: Number(excludedAllowances) || 0,
      averageMonthlyHours: hoursMode === 'direct' ? Number(averageMonthlyHours) : undefined,
      annualScheduledDays: hoursMode === 'yearly' ? Number(annualScheduledDays) : undefined,
      dailyScheduledHours: Number(dailyScheduledHours) || 8,
      normalOvertimeHours: Number(normalOvertimeHours) || 0,
      overtimeAbove60h: Number(overtimeAbove60h) || 0,
      lateNightHours: Number(lateNightHours) || 0,
      statutoryHolidayHours: Number(statutoryHolidayHours) || 0,
      holidayLateNightHours: Number(holidayLateNightHours) || 0,
    });
  }, [
    wageType,
    baseWage,
    excludedAllowances,
    hoursMode,
    averageMonthlyHours,
    annualScheduledDays,
    dailyScheduledHours,
    normalOvertimeHours,
    overtimeAbove60h,
    lateNightHours,
    statutoryHolidayHours,
    holidayLateNightHours,
  ]);

  return (
    <StandardToolLayout
      title={t.title}
      subtitle={t.subtitle}
      badge={t.badge}
      maxWidth="max-w-[1240px]"
    >
      <div className="space-y-8">
        {/* Section 1: Wage & Prescribed Hours Settings */}
        <section className="bg-surface-container rounded-2xl p-6 border border-outline-variant/30 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-outline-variant/20 pb-4">
            <Coins className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold text-on-surface">{t.wageSettings}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Wage Type */}
            <div>
              <label className="block text-sm font-medium text-on-surface mb-2">
                {t.wageTypeLabel}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['monthly', 'daily', 'hourly'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setWageType(type)}
                    className={`py-2 px-3 text-xs sm:text-sm font-medium rounded-xl border transition-colors ${
                      wageType === type
                        ? 'bg-primary text-on-primary border-primary shadow-sm'
                        : 'bg-surface text-on-surface-variant border-outline-variant/40 hover:bg-surface-container-high'
                    }`}
                  >
                    {t[type]}
                  </button>
                ))}
              </div>
            </div>

            {/* Base Wage Amount */}
            <div className="md:col-span-2">
              <label htmlFor="overtime-base-wage" className="block text-sm font-medium text-on-surface mb-2">
                {t.baseWageLabel} ({t.yen})
              </label>
              <div className="relative">
                <input
                  id="overtime-base-wage"
                  aria-label={`${t.baseWageLabel} (${t.yen})`}
                  type="number"
                  min="0"
                  step="1000"
                  value={baseWage}
                  onChange={(e) => setBaseWage(e.target.value)}
                  placeholder={wageType === 'monthly' ? t.baseWageMonthlyPlaceholder : t.baseWageHourlyPlaceholder}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface border border-outline-variant/40 text-on-surface text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-on-surface-variant">
                  {t.yen}
                </span>
              </div>
            </div>
          </div>

          {/* Excluded Allowances (Monthly only) */}
          {wageType === 'monthly' && (
            <div className="bg-surface p-4 rounded-xl border border-outline-variant/30 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-on-surface flex items-center gap-2">
                    <ReceiptText className="w-4 h-4 text-amber-700 dark:text-amber-300" />
                    {t.excludedAllowancesHeader}
                  </h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">{t.excludedAllowancesHint}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowExcludedGuide(!showExcludedGuide)}
                  className="text-xs text-primary font-medium hover:underline flex items-center gap-1 self-start sm:self-auto"
                >
                  {showExcludedGuide ? t.hideExcludedGuide : t.showExcludedGuide}
                  {showExcludedGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="max-w-xs">
                <label htmlFor="overtime-excluded-allowances" className="block text-xs font-medium text-on-surface-variant mb-1">
                  {t.excludedTotalLabel}
                </label>
                <div className="relative">
                  <input
                    id="overtime-excluded-allowances"
                    aria-label={t.excludedTotalLabel}
                    type="number"
                    min="0"
                    step="1000"
                    value={excludedAllowances}
                    onChange={(e) => setExcludedAllowances(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-surface-container border border-outline-variant/40 text-on-surface text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-on-surface-variant">
                    {t.yen}
                  </span>
                </div>
              </div>

              {showExcludedGuide && (
                <div className="mt-3 pt-3 border-t border-outline-variant/20 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {STATUTORY_EXCLUDED_ALLOWANCES.map((item) => (
                    <div key={item.id} className="p-2.5 rounded-lg bg-surface-container-high border border-outline-variant/20">
                      <div className="font-semibold text-on-surface">
                        {lang === 'vi' ? item.nameVn : lang === 'en' ? item.nameEn : item.nameJa}
                      </div>
                      <div className="text-on-surface-variant text-[11px] mt-0.5">
                        {lang === 'vi' ? item.conditionVn : item.conditionJa}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Prescribed Working Hours (Monthly only) */}
          {wageType === 'monthly' && (
            <div className="bg-surface p-4 rounded-xl border border-outline-variant/30 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-on-surface flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    {t.prescribedHoursHeader}
                  </h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">{t.prescribedHoursHint}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setHoursMode('direct')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                      hoursMode === 'direct'
                        ? 'bg-primary text-on-primary border-primary'
                        : 'bg-surface-container text-on-surface-variant border-outline-variant/30'
                    }`}
                  >
                    {t.enterDirectly}
                  </button>
                  <button
                    type="button"
                    onClick={() => setHoursMode('yearly')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                      hoursMode === 'yearly'
                        ? 'bg-primary text-on-primary border-primary'
                        : 'bg-surface-container text-on-surface-variant border-outline-variant/30'
                    }`}
                  >
                    {t.calcFromYearly}
                  </button>
                </div>
              </div>

              {hoursMode === 'direct' ? (
                <div className="max-w-xs">
                  <label htmlFor="overtime-monthly-hours" className="block text-xs font-medium text-on-surface-variant mb-1">
                    {t.monthlyHoursLabel}
                  </label>
                  <input
                    id="overtime-monthly-hours"
                    aria-label={t.monthlyHoursLabel}
                    type="number"
                    min="1"
                    max="250"
                    step="0.5"
                    value={averageMonthlyHours}
                    onChange={(e) => setAverageMonthlyHours(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-surface-container border border-outline-variant/40 text-on-surface text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
                  <div>
                    <label htmlFor="overtime-annual-days" className="block text-xs font-medium text-on-surface-variant mb-1">
                      {t.yearlyDaysLabel}
                    </label>
                    <input
                      id="overtime-annual-days"
                      aria-label={t.yearlyDaysLabel}
                      type="number"
                      min="1"
                      max="365"
                      value={annualScheduledDays}
                      onChange={(e) => setAnnualScheduledDays(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-surface-container border border-outline-variant/40 text-on-surface text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                  <div>
                    <label htmlFor="overtime-daily-hours" className="block text-xs font-medium text-on-surface-variant mb-1">
                      {t.dailyHoursLabel}
                    </label>
                    <input
                      id="overtime-daily-hours"
                      aria-label={t.dailyHoursLabel}
                      type="number"
                      min="1"
                      max="24"
                      step="0.5"
                      value={dailyScheduledHours}
                      onChange={(e) => setDailyScheduledHours(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-surface-container border border-outline-variant/40 text-on-surface text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Section 2: Overtime Hours Input */}
        <section className="bg-surface-container rounded-2xl p-6 border border-outline-variant/30 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-outline-variant/20 pb-4">
            <Clock className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold text-on-surface">{t.overtimeHoursSection}</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 1. Normal Overtime */}
            <div className="p-4 rounded-xl bg-surface border border-outline-variant/30 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <label htmlFor="overtime-normal-hours" className="font-semibold text-sm text-on-surface cursor-pointer">{t.normalOvertime}</label>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300">
                    1.25x (+25%)
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant mt-1">{t.normalOvertimeDesc}</p>
              </div>
              <div className="mt-4">
                <input
                  id="overtime-normal-hours"
                  aria-label={t.normalOvertime}
                  type="number"
                  min="0"
                  max="60"
                  step="0.5"
                  value={normalOvertimeHours}
                  onChange={(e) => setNormalOvertimeHours(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container border border-outline-variant/40 text-on-surface text-base font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            {/* 2. Overtime > 60h */}
            <div className="p-4 rounded-xl bg-surface border border-outline-variant/30 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <label htmlFor="overtime-above60-hours" className="font-semibold text-sm text-on-surface cursor-pointer">{t.above60Overtime}</label>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
                    1.50x (+50%)
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant mt-1">{t.above60OvertimeDesc}</p>
              </div>
              <div className="mt-4">
                <input
                  id="overtime-above60-hours"
                  aria-label={t.above60Overtime}
                  type="number"
                  min="0"
                  max="150"
                  step="0.5"
                  value={overtimeAbove60h}
                  onChange={(e) => setOvertimeAbove60h(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container border border-outline-variant/40 text-on-surface text-base font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            {/* 3. Late Night Work */}
            <div className="p-4 rounded-xl bg-surface border border-outline-variant/30 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <label htmlFor="overtime-latenight-hours" className="font-semibold text-sm text-on-surface cursor-pointer">{t.lateNight}</label>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300">
                    +25% 深夜
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant mt-1">{t.lateNightDesc}</p>
              </div>
              <div className="mt-4">
                <input
                  id="overtime-latenight-hours"
                  aria-label={t.lateNight}
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={lateNightHours}
                  onChange={(e) => setLateNightHours(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container border border-outline-variant/40 text-on-surface text-base font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            {/* 4. Statutory Holiday Work */}
            <div className="p-4 rounded-xl bg-surface border border-outline-variant/30 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <label htmlFor="overtime-statutory-holiday-hours" className="font-semibold text-sm text-on-surface cursor-pointer">{t.statutoryHoliday}</label>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                    1.35x (+35%)
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant mt-1">{t.statutoryHolidayDesc}</p>
              </div>
              <div className="mt-4">
                <input
                  id="overtime-statutory-holiday-hours"
                  aria-label={t.statutoryHoliday}
                  type="number"
                  min="0"
                  max="60"
                  step="0.5"
                  value={statutoryHolidayHours}
                  onChange={(e) => setStatutoryHolidayHours(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container border border-outline-variant/40 text-on-surface text-base font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            {/* 5. Statutory Holiday + Late Night */}
            <div className="p-4 rounded-xl bg-surface border border-outline-variant/30 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <label htmlFor="overtime-holiday-latenight-hours" className="font-semibold text-sm text-on-surface cursor-pointer">{t.holidayLateNight}</label>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
                    1.60x (+60%)
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant mt-1">{t.holidayLateNightDesc}</p>
              </div>
              <div className="mt-4">
                <input
                  id="overtime-holiday-latenight-hours"
                  aria-label={t.holidayLateNight}
                  type="number"
                  min="0"
                  max="40"
                  step="0.5"
                  value={holidayLateNightHours}
                  onChange={(e) => setHolidayLateNightHours(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container border border-outline-variant/40 text-on-surface text-base font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Calculation Results Summary */}
        <section className="bg-surface-container rounded-2xl p-6 border border-outline-variant/30 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4">
            <div className="flex items-center gap-3">
              <Calculator className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-bold text-on-surface">{t.resultsSection}</h2>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
              {t.officialBasisBadge}
            </span>
          </div>

          {/* 4 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Base hourly wage */}
            <div className="p-5 rounded-xl bg-surface border border-outline-variant/30">
              <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block mb-1">
                {t.baseHourlyWageCard}
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl lg:text-3xl font-black text-on-surface">
                  {result.baseHourlyWage.toLocaleString()}
                </span>
                <span className="text-xs font-bold text-on-surface-variant">{t.yen}</span>
              </div>
              {result.isEstimatedHours && (
                <span className="text-[11px] text-amber-800 dark:text-amber-300 font-medium block mt-1">
                  {t.estimatedBadge}
                </span>
              )}
            </div>

            {/* Card 2: Total overtime hours */}
            <div className="p-5 rounded-xl bg-surface border border-outline-variant/30">
              <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block mb-1">
                {t.totalOvertimeHoursCard}
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl lg:text-3xl font-black text-on-surface">
                  {result.totalOvertimeHours}
                </span>
                <span className="text-xs font-bold text-on-surface-variant">{t.hoursUnit}</span>
              </div>
            </div>

            {/* Card 3: Total pure premium */}
            <div className="p-5 rounded-xl bg-surface border border-outline-variant/30">
              <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block mb-1">
                {t.totalPremiumCard}
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl lg:text-3xl font-black text-amber-800 dark:text-amber-300">
                  +{result.totalPremiumOnly.toLocaleString()}
                </span>
                <span className="text-xs font-bold text-on-surface-variant">{t.yen}</span>
              </div>
            </div>

            {/* Card 4: Total overtime remuneration */}
            <div className="p-5 rounded-xl bg-surface border-2 border-primary/40 shadow-sm">
              <span className="text-xs font-semibold text-primary uppercase tracking-wider block mb-1">
                {t.totalOvertimePayCard}
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl lg:text-3xl font-black text-primary">
                  {result.totalOvertimePay.toLocaleString()}
                </span>
                <span className="text-xs font-bold text-on-surface-variant">{t.yen}</span>
              </div>
            </div>
          </div>

          {/* Detailed Breakdown Table */}
          <div className="bg-surface rounded-xl border border-outline-variant/30 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-container-high text-on-surface-variant text-xs font-semibold border-b border-outline-variant/20">
                <tr>
                  <th className="py-3 px-4">{t.categoryCol}</th>
                  <th className="py-3 px-4 text-center">{t.hoursCol}</th>
                  <th className="py-3 px-4 text-center">{t.rateCol}</th>
                  <th className="py-3 px-4 text-right">{t.premiumCol}</th>
                  <th className="py-3 px-4 text-right">{t.totalPayCol}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10 text-on-surface">
                {Object.entries(result.breakdown).map(([key, item]) => (
                  <tr key={key} className={item.hours > 0 ? 'bg-primary/5 font-medium' : ''}>
                    <td className="py-3 px-4">
                      <div className="font-medium text-on-surface">
                        {lang === 'vi' ? item.labelVn : item.labelJa}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center text-on-surface">
                      {item.hours} {t.hoursUnit}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-surface-container-high text-on-surface">
                        {key === 'lateNight' ? '+25%' : `${item.multiplier}x`}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-amber-800 dark:text-amber-300">
                      +{item.premiumOnly.toLocaleString()} {t.yen}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-primary">
                      {item.totalPay.toLocaleString()} {t.yen}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 4: Why this formula? (Legal Explanation) */}
        <section className="bg-surface-container rounded-2xl p-6 border border-outline-variant/30 shadow-sm space-y-4">
          <div className="flex items-center gap-3 border-b border-outline-variant/20 pb-3">
            <Info className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-bold text-on-surface">{t.whySection}</h3>
          </div>
          <div className="space-y-2.5 text-xs sm:text-sm text-on-surface-variant leading-relaxed">
            <p className="flex items-start gap-2">
              <span className="font-bold text-primary">•</span>
              <span>{t.lawExplanation1}</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="font-bold text-primary">•</span>
              <span>{t.lawExplanation2}</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="font-bold text-primary">•</span>
              <span>{t.lawExplanation3}</span>
            </p>
          </div>
        </section>

        {/* Section 5: Official Regulatory Sources */}
        <section className="space-y-4">
          <RegulatorySourceView sources={result.sources} lang={lang} />
        </section>
      </div>
    </StandardToolLayout>
  );
}
