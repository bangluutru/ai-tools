/**
 * @file packages/core/src/components/employment/PaidLeaveCheckerView.jsx
 * @description
 * Giao diện Tra cứu & Kiểm tra Quyền Nghỉ Phép Năm Nhật Bản (有給休暇チェッカー)
 * Tuân thủ nghiêm ngặt MAIS: StandardToolLayout 1240px, Design Tokens, Trilingual (ja/vi/en), WCAG AA.
 */

import React, { useState, useMemo } from 'react';
import {
  Calendar,
  CalendarCheck,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  Briefcase,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  ExternalLink,
  Hourglass
} from 'lucide-react';

import StandardToolLayout from '../shared/StandardToolLayout.jsx';
import RegulatorySourceView from '../regulatory/RegulatorySourceView.jsx';
import {
  calculatePaidLeaveEntitlement,
  FULL_TIME_PAID_LEAVE_TABLE,
  PART_TIME_PROPORTIONAL_TABLE
} from '../../japan/employment/index.js';

const TRANSLATIONS = {
  ja: {
    toolTitle: '有給休暇チェッカー（年次有給休暇・年5日取得義務シミュレーター）',
    toolDesc: '労働基準法第39条に基づく法定有給日数、パート等の比例付与、出勤率8割判定、年5日取得義務の進捗を正確に算定します。',
    contractSection: '1. 雇用条件・入社日の設定',
    employmentTypeLabel: '雇用形態',
    fullTime: '一般・正社員（週30h以上 または 週5日以上）',
    partTime: 'パート・アルバイト（週30h未満 かつ 週4日以下）',
    hireDateLabel: '入社年月日',
    asOfDateLabel: '算定基準日（判定日）',
    weeklyDaysLabel: '週の所定労働日数',
    weeklyHoursLabel: '週の所定労働時間（目安）',
    attendanceSection: '2. 出勤率・取得状況の実績',
    attendanceRateLabel: '算定期間の出勤率（法定要件: 全労働日の8割以上）',
    attendanceHint: '※ 業務上の負傷・育児休業・介護休業・産前産後休業・有給取得日は「出勤したもの」として扱われます。',
    usedDaysLabel: '今年度すでに取得した日数',
    carriedOverLabel: '前年度からの繰越残日数（有効期限2年）',
    daysUnit: '日',
    serviceTitle: '勤続年数',
    resultSection: '3. 有給休暇の算定結果・利用可能残日数',
    cardCurrentGrant: '今年度の付与日数',
    cardCarriedOver: '前年度繰越日数',
    cardTotalAvailable: '現在利用可能な有給残日数',
    cardMandatoryStatus: '年5日取得義務の進捗',
    mandatoryMet: '義務達成済',
    mandatoryRemaining: '残り必要日数',
    mandatoryDeadlineLabel: '取得期限',
    mandatoryNotApplicable: '対象外（付与10日未満）',
    scheduleSection: '4. 法定付与スケジュール・時効消滅タイムライン',
    scheduleDesc: '労働基準法第115条に基づき、有給休暇の請求権は付与日から2年間で時効消滅します。',
    colMilestone: '付与タイミング',
    colGrantDate: '付与年月日',
    colGrantDays: '付与日数',
    colExpiryDate: '時効消滅日（2年）',
    colStatus: '状態',
    statusCurrent: '現在有効',
    statusPast: '過去付与',
    statusFuture: '次回予定',
    legalNotesTitle: '労働基準法の重要ポイント解説',
    legalNote1Title: '年5日の年次有給休暇取得義務（第39条第7項）',
    legalNote1Body: '年10日以上の有給休暇が付与される労働者に対し、使用者は付与日から1年以内に5日を確実に取得させる義務があります。違反した場合は労働者1人あたり最大30万円の罰金が科されます。',
    legalNote2Title: '出勤率8割以上の算定方法',
    legalNote2Body: '算定期間（直前の1年間または6ヶ月）の「全労働日」に対する「出勤日」の割合が80%以上であることが付与の条件です。',
    legalNote3Title: '時効消滅と繰越し（第115条）',
    legalNote3Body: '使わなかった有給休暇は翌年度に繰り越せます（最大付与2年分が保有可能）。2年を経過すると順次時効消滅します。'
  },
  vi: {
    toolTitle: 'Kiểm Tra Phép Năm Nhật Bản (有給休暇チェッカー)',
    toolDesc: 'Tính toán chính xác số ngày nghỉ phép có lương luật định theo Điều 39 Luật Tiêu chuẩn Lao động, lịch cấp phép tỷ lệ cho baito/part-time, điều kiện chuyên cần 80% và nghĩa vụ nghỉ 5 ngày/năm.',
    contractSection: '1. Thiết lập hợp đồng & Ngày vào công ty',
    employmentTypeLabel: 'Hình thức lao động',
    fullTime: 'Toàn thời gian / Chính thức (>= 30h/tuần hoặc >= 5 ngày/tuần)',
    partTime: 'Bán thời gian / Part-time / Baito (< 30h/tuần và <= 4 ngày/tuần)',
    hireDateLabel: 'Ngày vào công ty (入社年月日)',
    asOfDateLabel: 'Ngày đối soát / Hiện tại (算定基準日)',
    weeklyDaysLabel: 'Số ngày làm việc quy định/tuần',
    weeklyHoursLabel: 'Số giờ làm việc quy định/tuần',
    attendanceSection: '2. Tỷ lệ chuyên cần & Số ngày đã nghỉ',
    attendanceRateLabel: 'Tỷ lệ chuyên cần trong kỳ (Luật định: >= 80% tổng số ngày làm việc)',
    attendanceHint: '※ Tai nạn lao động, nghỉ thai sản, nghỉ chăm con, chăm sóc người thân, ngày đã nghỉ phép năm đều được tính là NGÀY ĐI LÀM.',
    usedDaysLabel: 'Số ngày phép đã dùng trong kỳ hiện tại',
    carriedOverLabel: 'Số ngày phép còn dư kỳ trước chuyển sang (Hạn 2 năm)',
    daysUnit: 'ngày',
    serviceTitle: 'Thâm niên liên tục',
    resultSection: '3. Kết quả quyền nghỉ phép & Số dư khả dụng',
    cardCurrentGrant: 'Số ngày cấp mới kỳ này',
    cardCarriedOver: 'Phép tồn chuyển tiếp',
    cardTotalAvailable: 'Tổng số ngày phép còn dùng được',
    cardMandatoryStatus: 'Nghĩa vụ nghỉ 5 ngày (年5日義務)',
    mandatoryMet: 'Đã hoàn thành nghĩa vụ',
    mandatoryRemaining: 'Còn thiếu',
    mandatoryDeadlineLabel: 'Hạn chót nghỉ',
    mandatoryNotApplicable: 'Không áp dụng (Cấp dưới 10 ngày)',
    scheduleSection: '4. Lịch cấp phép luật định & Thời hiệu hết hạn 2 năm',
    scheduleDesc: 'Theo Điều 115 Luật Tiêu chuẩn Lao động, quyền nghỉ phép năm sẽ hết hiệu lực sau 2 năm kể từ ngày được cấp.',
    colMilestone: 'Mốc thâm niên',
    colGrantDate: 'Ngày phát sinh phép',
    colGrantDays: 'Số ngày cấp',
    colExpiryDate: 'Ngày hết hạn (2 năm)',
    colStatus: 'Trạng thái',
    statusCurrent: 'Kỳ hiện hành',
    statusPast: 'Kỳ trước',
    statusFuture: 'Mốc tiếp theo',
    legalNotesTitle: 'Căn cứ pháp lý trọng yếu cần nắm',
    legalNote1Title: 'Nghĩa vụ bắt buộc nghỉ tối thiểu 5 ngày/năm (Điều 39 Khoản 7)',
    legalNote1Body: 'Đối với lao động được cấp từ 10 ngày phép trở lên/năm, công ty có nghĩa vụ đảm bảo người lao động nghỉ ít nhất 5 ngày trong vòng 1 năm. Nếu vi phạm, công ty bị phạt tới 300.000 yên/lao động.',
    legalNote2Title: 'Quy tắc chuyên cần 80% (出勤率8割要件)',
    legalNote2Body: 'Người lao động phải đi làm từ 80% số ngày quy định trở lên trong kỳ xem xét mới được cấp phép năm. Nếu dưới 80%, số ngày cấp năm đó là 0 ngày nhưng thâm niên vẫn tiếp tục được tích lũy.',
    legalNote3Title: 'Thời hiệu tiêu diệt 2 năm và chuyển tiếp phép (Điều 115)',
    legalNote3Body: 'Số ngày phép chưa dùng hết được tự động chuyển sang năm tiếp theo. Sau 2 năm kể từ ngày cấp, những ngày phép chưa dùng của kỳ đó sẽ chính thức hết hạn.'
  },
  en: {
    toolTitle: 'Japan Annual Paid Leave Checker (有給休暇チェッカー)',
    toolDesc: 'Statutory paid leave calculation under Article 39 of Japan Labor Standards Act, proportional part-time grants, 80% attendance rule, and mandatory 5-day leave compliance tracker.',
    contractSection: '1. Employment Terms & Hire Date',
    employmentTypeLabel: 'Employment Type',
    fullTime: 'Full-time / Standard (>= 30 hrs/wk or >= 5 days/wk)',
    partTime: 'Part-time / Proportional (< 30 hrs/wk and <= 4 days/wk)',
    hireDateLabel: 'Hire Date (入社年月日)',
    asOfDateLabel: 'As of Date / Calculation Date',
    weeklyDaysLabel: 'Prescribed Working Days per Week',
    weeklyHoursLabel: 'Prescribed Working Hours per Week',
    attendanceSection: '2. Attendance Rate & Leave Usage History',
    attendanceRateLabel: 'Attendance rate for period (Statutory requirement: >= 80% of scheduled workdays)',
    attendanceHint: '※ Work injuries, maternity leave, childcare leave, family care leave, and paid leave taken are legally counted as WORKED DAYS.',
    usedDaysLabel: 'Leave days already taken this current period',
    carriedOverLabel: 'Unused days carried over from previous year (2-year validity)',
    daysUnit: 'days',
    serviceTitle: 'Continuous Service',
    resultSection: '3. Entitlement Calculation & Available Balance',
    cardCurrentGrant: 'New Days Granted this Period',
    cardCarriedOver: 'Carried-over Balance',
    cardTotalAvailable: 'Total Available Paid Leave Balance',
    cardMandatoryStatus: 'Mandatory 5-Day Leave Status',
    mandatoryMet: 'Obligation Fulfilled',
    mandatoryRemaining: 'Days Remaining to Take',
    mandatoryDeadlineLabel: 'Deadline',
    mandatoryNotApplicable: 'N/A (Granted < 10 days)',
    scheduleSection: '4. Statutory Grant Schedule & 2-Year Expiration Timeline',
    scheduleDesc: 'Under Article 115 of the Labor Standards Act, claims for annual paid leave expire 2 years after the date of grant.',
    colMilestone: 'Tenure Milestone',
    colGrantDate: 'Grant Date',
    colGrantDays: 'Days Granted',
    colExpiryDate: 'Expiration Date (2 Years)',
    colStatus: 'Status',
    statusCurrent: 'Active Current',
    statusPast: 'Past Grant',
    statusFuture: 'Next Upcoming',
    legalNotesTitle: 'Key Statutory Rules (Labor Standards Act)',
    legalNote1Title: 'Mandatory 5-Day Paid Leave Obligation (Art. 39 Para. 7)',
    legalNote1Body: 'For employees granted 10 or more days of annual paid leave, employers are legally obligated to ensure at least 5 days are taken within 1 year. Violation incurs fines up to 300,000 JPY per worker.',
    legalNote2Title: '80% Attendance Requirement Rule',
    legalNote2Body: 'Workers must attend at least 80% of scheduled working days in the qualifying period. Falling below 80% results in 0 days granted for that cycle, though tenure continues accumulating.',
    legalNote3Title: '2-Year Statute of Limitations & Carryover (Art. 115)',
    legalNote3Body: 'Unused leave days carry over to the immediately following year. Days older than 2 years from their grant date legally expire.'
  }
};

export default function PaidLeaveCheckerView({ lang = 'ja' }) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.ja;

  // Form states
  const [employmentType, setEmploymentType] = useState('full_time');
  const [hireDate, setHireDate] = useState('2024-04-01');
  const [asOfDate, setAsOfDate] = useState('2026-09-10');
  const [weeklyDays, setWeeklyDays] = useState('5');
  const [weeklyHours, setWeeklyHours] = useState('40');
  const [attendancePercent, setAttendancePercent] = useState('100');
  const [usedDaysCurrent, setUsedDaysCurrent] = useState('2');
  const [carriedOverDays, setCarriedOverDays] = useState('0');

  // Handle employment type toggle
  const handleTypeChange = (type) => {
    setEmploymentType(type);
    if (type === 'full_time') {
      setWeeklyDays('5');
      setWeeklyHours('40');
    } else {
      setWeeklyDays('3');
      setWeeklyHours('20');
    }
  };

  // Perform calculation
  const result = useMemo(() => {
    return calculatePaidLeaveEntitlement({
      hireDate,
      asOfDate,
      employmentType,
      weeklyHours: parseFloat(weeklyHours) || 40,
      weeklyDays: parseFloat(weeklyDays) || 5,
      attendanceRate: (parseFloat(attendancePercent) || 100) / 100,
      usedDaysCurrent: parseFloat(usedDaysCurrent) || 0,
      carriedOverDays: parseFloat(carriedOverDays) || 0
    });
  }, [hireDate, asOfDate, employmentType, weeklyHours, weeklyDays, attendancePercent, usedDaysCurrent, carriedOverDays]);

  return (
    <StandardToolLayout
      title={t.toolTitle}
      description={t.toolDesc}
    >
      <div className="space-y-8">
        {/* Section 1: Employment Terms & Dates */}
        <section className="bg-surface-container rounded-2xl p-6 border border-outline-variant/30 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-outline-variant/20 pb-4">
            <Briefcase className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold text-on-surface">{t.contractSection}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Employment Type */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-on-surface mb-2">
                {t.employmentTypeLabel}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleTypeChange('full_time')}
                  className={`px-4 py-3 rounded-xl border text-sm font-semibold transition-all text-left flex items-center justify-between ${
                    employmentType === 'full_time'
                      ? 'bg-primary text-on-primary border-primary shadow-sm'
                      : 'bg-surface text-on-surface-variant border-outline-variant/40 hover:bg-surface-container-high'
                  }`}
                >
                  <span>{t.fullTime}</span>
                  {employmentType === 'full_time' && <CheckCircle2 className="w-4 h-4 ml-2" />}
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange('part_time')}
                  className={`px-4 py-3 rounded-xl border text-sm font-semibold transition-all text-left flex items-center justify-between ${
                    employmentType === 'part_time'
                      ? 'bg-primary text-on-primary border-primary shadow-sm'
                      : 'bg-surface text-on-surface-variant border-outline-variant/40 hover:bg-surface-container-high'
                  }`}
                >
                  <span>{t.partTime}</span>
                  {employmentType === 'part_time' && <CheckCircle2 className="w-4 h-4 ml-2" />}
                </button>
              </div>
            </div>

            {/* Hire Date */}
            <div>
              <label htmlFor="paid-leave-hire-date" className="block text-sm font-medium text-on-surface mb-2">
                {t.hireDateLabel}
              </label>
              <div className="relative">
                <input
                  id="paid-leave-hire-date"
                  aria-label={t.hireDateLabel}
                  type="date"
                  value={hireDate}
                  onChange={(e) => setHireDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface border border-outline-variant/40 text-on-surface font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            {/* As-of Date */}
            <div>
              <label htmlFor="paid-leave-asof-date" className="block text-sm font-medium text-on-surface mb-2">
                {t.asOfDateLabel}
              </label>
              <div className="relative">
                <input
                  id="paid-leave-asof-date"
                  aria-label={t.asOfDateLabel}
                  type="date"
                  value={asOfDate}
                  onChange={(e) => setAsOfDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface border border-outline-variant/40 text-on-surface font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            {/* Service tenure preview pill */}
            <div className="md:col-span-2 p-3 rounded-xl bg-surface border border-outline-variant/30 flex items-center justify-between">
              <span className="text-xs font-medium text-on-surface-variant flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-primary" />
                {t.serviceTitle}:
              </span>
              <span className="text-sm font-bold text-primary">
                {result.serviceDuration.formattedService} ({result.serviceDuration.months} ヶ月)
              </span>
            </div>

            {/* Weekly Days (for part-time) */}
            {employmentType === 'part_time' && (
              <>
                <div>
                  <label htmlFor="paid-leave-weekly-days" className="block text-sm font-medium text-on-surface mb-2">
                    {t.weeklyDaysLabel}
                  </label>
                  <select
                    id="paid-leave-weekly-days"
                    aria-label={t.weeklyDaysLabel}
                    value={weeklyDays}
                    onChange={(e) => setWeeklyDays(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-surface border border-outline-variant/40 text-on-surface font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    <option value="4">4 日/週 (169〜216 日/年)</option>
                    <option value="3">3 日/週 (121〜168 日/年)</option>
                    <option value="2">2 日/週 (73〜120 日/年)</option>
                    <option value="1">1 日/週 (48〜72 日/年)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="paid-leave-weekly-hours" className="block text-sm font-medium text-on-surface mb-2">
                    {t.weeklyHoursLabel}
                  </label>
                  <input
                    id="paid-leave-weekly-hours"
                    aria-label={t.weeklyHoursLabel}
                    type="number"
                    min="1"
                    max="40"
                    step="0.5"
                    value={weeklyHours}
                    onChange={(e) => setWeeklyHours(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-surface border border-outline-variant/40 text-on-surface font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </>
            )}
          </div>
        </section>

        {/* Section 2: Attendance & Usage */}
        <section className="bg-surface-container rounded-2xl p-6 border border-outline-variant/30 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-outline-variant/20 pb-4">
            <CalendarCheck className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold text-on-surface">{t.attendanceSection}</h2>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="paid-leave-attendance-rate" className="text-sm font-medium text-on-surface">
                  {t.attendanceRateLabel}
                </label>
                <span className={`text-base font-bold ${
                  Number(attendancePercent) >= 80 ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'
                }`}>
                  {attendancePercent}%
                </span>
              </div>
              <input
                id="paid-leave-attendance-rate"
                aria-label={t.attendanceRateLabel}
                type="range"
                min="0"
                max="100"
                step="1"
                value={attendancePercent}
                onChange={(e) => setAttendancePercent(e.target.value)}
                className="w-full h-2 bg-surface-container-high rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <p className="text-xs text-on-surface-variant mt-1">{t.attendanceHint}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              <div>
                <label htmlFor="paid-leave-used-days" className="block text-sm font-medium text-on-surface mb-2">
                  {t.usedDaysLabel} ({t.daysUnit})
                </label>
                <input
                  id="paid-leave-used-days"
                  aria-label={t.usedDaysLabel}
                  type="number"
                  min="0"
                  max="40"
                  step="0.5"
                  value={usedDaysCurrent}
                  onChange={(e) => setUsedDaysCurrent(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface border border-outline-variant/40 text-on-surface font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div>
                <label htmlFor="paid-leave-carried-over" className="block text-sm font-medium text-on-surface mb-2">
                  {t.carriedOverLabel} ({t.daysUnit})
                </label>
                <input
                  id="paid-leave-carried-over"
                  aria-label={t.carriedOverLabel}
                  type="number"
                  min="0"
                  max="20"
                  step="0.5"
                  value={carriedOverDays}
                  onChange={(e) => setCarriedOverDays(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface border border-outline-variant/40 text-on-surface font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Advisory Warnings */}
        {result.warnings.length > 0 && (
          <div className="space-y-3">
            {result.warnings.map((w, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-xl border flex items-start gap-3 ${
                  w.level === 'warning'
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                    : 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 text-blue-900 dark:text-blue-200'
                }`}
              >
                {w.level === 'warning' ? (
                  <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-700 dark:text-amber-400 mt-0.5" />
                ) : (
                  <Info className="w-5 h-5 flex-shrink-0 text-blue-700 dark:text-blue-400 mt-0.5" />
                )}
                <div className="text-sm font-medium">
                  {lang === 'vi' ? w.vi : lang === 'en' ? w.en : w.ja}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Section 3: Summary Cards */}
        <section className="bg-surface-container rounded-2xl p-6 border border-outline-variant/30 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-bold text-on-surface">{t.resultSection}</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: New grant */}
            <div className="p-4 rounded-xl bg-surface border border-outline-variant/30 flex flex-col justify-between">
              <span className="text-xs text-on-surface-variant font-medium">{t.cardCurrentGrant}</span>
              <div className="mt-2">
                <span className="text-3xl font-extrabold text-primary">
                  {result.currentGrantDays}
                </span>
                <span className="ml-1 text-sm text-on-surface-variant font-semibold">{t.daysUnit}</span>
              </div>
              <span className="text-[11px] text-on-surface-variant mt-1">
                {result.isProportional ? '比例付与 (Part-time)' : '一般付与 (Full-time)'}
              </span>
            </div>

            {/* Card 2: Carried over */}
            <div className="p-4 rounded-xl bg-surface border border-outline-variant/30 flex flex-col justify-between">
              <span className="text-xs text-on-surface-variant font-medium">{t.cardCarriedOver}</span>
              <div className="mt-2">
                <span className="text-3xl font-extrabold text-on-surface">
                  {result.carriedOverDays}
                </span>
                <span className="ml-1 text-sm text-on-surface-variant font-semibold">{t.daysUnit}</span>
              </div>
              <span className="text-[11px] text-on-surface-variant mt-1">
                有効期限: 2年 (時効)
              </span>
            </div>

            {/* Card 3: Total Available */}
            <div className="p-4 rounded-xl bg-surface border-2 border-primary/40 flex flex-col justify-between">
              <span className="text-xs text-primary font-bold">{t.cardTotalAvailable}</span>
              <div className="mt-2">
                <span className="text-3xl font-extrabold text-primary">
                  {result.remainingAvailableDays}
                </span>
                <span className="ml-1 text-sm text-primary font-bold">{t.daysUnit}</span>
              </div>
              <span className="text-[11px] text-on-surface-variant mt-1">
                (付与 {result.currentGrantDays} + 繰越 {result.carriedOverDays} - 取得 {result.usedDays})
              </span>
            </div>

            {/* Card 4: Mandatory 5 days */}
            <div className={`p-4 rounded-xl border flex flex-col justify-between ${
              !result.mandatory5Days.isApplicable
                ? 'bg-surface border-outline-variant/30'
                : result.mandatory5Days.remainingDays === 0
                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
                : 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800'
            }`}>
              <span className="text-xs font-bold text-on-surface">
                {t.cardMandatoryStatus}
              </span>
              <div className="mt-2">
                {!result.mandatory5Days.isApplicable ? (
                  <span className="text-xs font-semibold text-on-surface-variant">
                    {t.mandatoryNotApplicable}
                  </span>
                ) : result.mandatory5Days.remainingDays === 0 ? (
                  <div>
                    <span className="text-2xl font-black text-emerald-700 dark:text-emerald-300">
                      {t.mandatoryMet}
                    </span>
                    <p className="text-[11px] text-emerald-800 dark:text-emerald-400 mt-0.5">
                      5 / 5 日達成
                    </p>
                  </div>
                ) : (
                  <div>
                    <span className="text-2xl font-black text-amber-700 dark:text-amber-300">
                      {result.mandatory5Days.remainingDays} {t.daysUnit}
                    </span>
                    <p className="text-[11px] text-amber-800 dark:text-amber-400 mt-0.5">
                      {t.mandatoryDeadlineLabel}: {result.mandatory5Days.deadlineDate}
                    </p>
                  </div>
                )}
              </div>
              <span className="text-[11px] text-on-surface-variant mt-1">
                労働基準法第39条第7項
              </span>
            </div>
          </div>
        </section>

        {/* Section 4: Grant Timeline Schedule Table */}
        <section className="bg-surface-container rounded-2xl p-6 border border-outline-variant/30 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-outline-variant/20 pb-4">
            <Hourglass className="w-6 h-6 text-primary" />
            <div>
              <h2 className="text-xl font-bold text-on-surface">{t.scheduleSection}</h2>
              <p className="text-xs text-on-surface-variant mt-0.5">{t.scheduleDesc}</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/30 bg-surface-container-high/50 text-xs font-semibold text-on-surface-variant">
                  <th className="py-3 px-4">{t.colMilestone}</th>
                  <th className="py-3 px-4">{t.colGrantDate}</th>
                  <th className="py-3 px-4 text-center">{t.colGrantDays}</th>
                  <th className="py-3 px-4">{t.colExpiryDate}</th>
                  <th className="py-3 px-4 text-center">{t.colStatus}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {result.grantSchedule.map((item, idx) => (
                  <tr
                    key={idx}
                    className={`transition-colors ${
                      item.isCurrentPeriod
                        ? 'bg-surface-container-high font-semibold'
                        : 'hover:bg-surface-container-high/30'
                    }`}
                  >
                    <td className="py-3 px-4 text-on-surface flex items-center gap-2">
                      {item.isCurrentPeriod && <span className="w-2 h-2 rounded-full bg-primary" />}
                      <span>{item.serviceMonths / 12} 年 ({item.serviceMonths} ヶ月)</span>
                    </td>
                    <td className="py-3 px-4 text-on-surface">{item.grantDate}</td>
                    <td className="py-3 px-4 text-center text-on-surface font-extrabold">
                      {item.grantDays} {t.daysUnit}
                    </td>
                    <td className="py-3 px-4 text-on-surface-variant text-xs">{item.expiryDate}</td>
                    <td className="py-3 px-4 text-center">
                      {item.isCurrentPeriod ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-primary text-on-primary">
                          {t.statusCurrent}
                        </span>
                      ) : item.isPast ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-surface-container-high text-on-surface-variant">
                          {t.statusPast}
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300">
                          {t.statusFuture}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 5: Legal Notes & Reference Guidelines */}
        <section className="bg-surface-container rounded-2xl p-6 border border-outline-variant/30 shadow-sm space-y-4">
          <div className="flex items-center gap-3 border-b border-outline-variant/20 pb-4">
            <ShieldCheck className="w-6 h-6 text-primary" />
            <h2 className="text-lg font-bold text-on-surface">{t.legalNotesTitle}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-surface border border-outline-variant/30 space-y-1.5">
              <h3 className="font-bold text-on-surface flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                {t.legalNote1Title}
              </h3>
              <p className="text-on-surface-variant leading-relaxed">{t.legalNote1Body}</p>
            </div>

            <div className="p-4 rounded-xl bg-surface border border-outline-variant/30 space-y-1.5">
              <h3 className="font-bold text-on-surface flex items-center gap-1.5">
                <CalendarCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                {t.legalNote2Title}
              </h3>
              <p className="text-on-surface-variant leading-relaxed">{t.legalNote2Body}</p>
            </div>

            <div className="p-4 rounded-xl bg-surface border border-outline-variant/30 space-y-1.5">
              <h3 className="font-bold text-on-surface flex items-center gap-1.5">
                <Hourglass className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                {t.legalNote3Title}
              </h3>
              <p className="text-on-surface-variant leading-relaxed">{t.legalNote3Body}</p>
            </div>
          </div>
        </section>

        {/* Section 6: Official Regulatory Sources */}
        <RegulatorySourceView sources={result.sources} lang={lang} />
      </div>
    </StandardToolLayout>
  );
}
