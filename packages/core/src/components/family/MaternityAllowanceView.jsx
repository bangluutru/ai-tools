/**
 * @file packages/core/src/components/family/MaternityAllowanceView.jsx
 * @description
 * Giao diện Mô phỏng Trợ cấp Thai sản Nhật Bản (出産手当金シミュレーター).
 * Tuân thủ nghiêm ngặt MAIS: StandardToolLayout 1240px, Design Tokens, Trilingual (ja/vi/en), WCAG AA.
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
  HeartHandshake,
  FileText,
  Building2,
  Sparkles,
  HelpCircle
} from 'lucide-react';

import StandardToolLayout from '../shared/StandardToolLayout.jsx';
import RegulatorySourceView from '../regulatory/RegulatorySourceView.jsx';
import {
  calculateMaternityAllowance,
  MATERNITY_STATUTORY_CONSTANTS,
  MATERNITY_ALLOWANCE_SOURCES,
} from '../../japan/family/index.js';

const TRANSLATIONS = {
  ja: {
    toolTitle: '出産手当金シミュレーター（健康保険・産前産後休業手当）',
    toolDesc: '健康保険法第102条に基づき、産前産後休業期間中の給料補償（標準報酬月額の3分の2）を支給日数・日額・総額で正確に試算します。',
    sectionInput: '1. 妊娠・出産および加入保険の条件設定',
    expectedBirthDateLabel: '出産予定日（分べん予定日）',
    hasActualBirthDateLabel: 'すでに出産した、または実際の出産日を指定する',
    actualBirthDateLabel: '実際の出産日',
    multiplePregnancyLabel: '多胎妊娠（双子・三つ子など）',
    multiplePregnancyHint: '※ 多胎妊娠の場合、産前休業期間が42日から98日（14週間）に拡大されます。',
    monthlySalaryLabel: '毎月の額面給与（月給総支給額）',
    monthlySalaryHint: '※ 基本給＋残業代＋諸手当の総額。標準報酬月額（全50等級）に自動変換して日額を算出します。',
    tenureLabel: '現在の健康保険の加入期間',
    tenure12Plus: '12ヶ月以上（前12ヶ月間の平均額を適用）',
    tenureUnder12: '12ヶ月未満（直近平均と協会けんぽ平均30万円の低い方を適用）',
    insurerTypeLabel: '加入している医療保険の種類',
    insurerKyokai: '協会けんぽ（全国健康保険協会）',
    insurerKumi: '健康保険組合（大企業等の単一・総合健保）',
    insurerNhi: '国民健康保険（自営業・フリーランス等）※手当金対象外',
    salaryPaidDuringLeaveLabel: '休業期間中に会社から支給される日給（有給など）',
    salaryPaidDuringLeaveHint: '※ 0円（無給）が標準。有給休暇等で給与が出る場合は差額のみが支給されます。',
    isLeavingJobLabel: '退職に伴い、退職後も出産手当金の継続給付を受けますか？',
    tenureBeforeRetireLabel: '退職日までの継続被保険者期間',
    tenureRetire1YearPlus: '1年以上継続して加入していた（受給資格あり）',
    tenureRetireUnder1Year: '1年未満（資格喪失後の継続給付は不可）',
    workedOnRetireDateLabel: '退職日当日（最終雇用日）に出勤して給与が発生しますか？',
    workedOnRetireDateHint: '※ 退職日に勤務すると「給与が発生し休業していない」とみなされ継続受給権を失います。',
    yenUnit: '円',
    daysUnit: '日',
    distinctionNoticeTitle: '【重要】「出産手当金」と「出産育児一時金」の違い',
    distinctionDesc: '当ツールで試算する「出産手当金」は、働く女性が産前産後休業で仕事を休んだときの「給与補償（日額手当）」です。一方、病院での分べん費用を補助する「出産育児一時金（1児につき一律50万円）」とは全く別の制度です。',
    sectionResults: '2. 試算結果サマリー',
    estimatedTotalBenefit: '出産手当金 支給見込み総額',
    dailyBenefitAmount: '1日あたりの支給額（日額）',
    totalEligibleDays: '支給対象日数',
    eligiblePeriod: '産前産後休業・支給対象期間',
    estimatedBadge: '概算試算',
    sectionDaysDetail: '3. 支給対象日数の内訳とスケジュール',
    prenatalDaysTitle: '産前期間',
    postnatalDaysTitle: '産後期間（法律で一律56日）',
    onScheduleNote: '※ 予定日通りのご出産（42日＋56日＝98日）',
    earlyNote: '※ 予定日より早いご出産（産前日数が短縮され、産後は翌日から56日）',
    delayedNote: '※ 予定日より遅れたご出産（遅れた日数分が産前期間として追加支給）',
    sectionFinancialDetail: '4. 算定根拠と計算式',
    stdRemunerationLabel: '適用された標準報酬月額：',
    formulaTitle: '法定日額計算式（健康保険法第102条）：',
    formulaText: '標準報酬月額 ÷ 30日 × 2/3 ＝ 1日あたりの支給額（50銭以上四捨五入）',
    salaryOffsetNotice: '※ 会社から一部給与が支給されているため、日額から給与分を差し引いた差額のみ支給されます。',
    sectionRegulatory: '参照法令・公的情報源（Primary Regulatory Sources）',
    ineligibleTitle: '出産手当金の受給対象外です',
  },
  vi: {
    toolTitle: 'Mô Phỏng Trợ Cấp Thai Sản BHYT Nhật Bản (出産手当金シミュレーター)',
    toolDesc: 'Căn cứ Điều 102 Luật BHYT Nhật Bản: Tính toán số tiền trợ cấp bù đắp thu nhập trong thời gian nghỉ thai sản (bằng 2/3 lương tiêu chuẩn bình quân) theo số ngày nghỉ thực tế và tổng số tiền.',
    sectionInput: '1. Thiết lập điều kiện thai sản & Bảo hiểm y tế',
    expectedBirthDateLabel: 'Ngày dự sinh (theo sổ khám thai)',
    hasActualBirthDateLabel: 'Đã sinh con / Nhập ngày sinh thực tế',
    actualBirthDateLabel: 'Ngày sinh con thực tế',
    multiplePregnancyLabel: 'Mang đa thai (sinh đôi, sinh ba...)',
    multiplePregnancyHint: '※ Mang đa thai được nghỉ trước sinh tới 98 ngày (14 tuần) thay vì 42 ngày (6 tuần).',
    monthlySalaryLabel: 'Tổng thu nhập hàng tháng (Gross Salary trước khi trừ thuế/bảo hiểm)',
    monthlySalaryHint: '※ Lương cơ bản + tăng ca + phụ cấp. Hệ thống tự động tra cứu Bậc lương chuẩn BHYT (標準報酬月額 50 cấp bậc).',
    tenureLabel: 'Thời gian tham gia BHYT công ty hiện tại',
    tenure12Plus: 'Từ 12 tháng trở lên (Tính bình quân thực tế 12 tháng)',
    tenureUnder12: 'Dưới 12 tháng (Áp dụng mức thấp hơn giữa lương thực tế và trần 300.000 yên của Kyokai Kenpo)',
    insurerTypeLabel: 'Cơ quan/Loại hình Bảo hiểm Y tế đang tham gia',
    insurerKyokai: 'BHYT Doanh nghiệp vừa & nhỏ (協会けんぽ - Kyokai Kenpo)',
    insurerKumi: 'BHYT Nghiệp đoàn/Tập đoàn lớn (健康保険組合)',
    insurerNhi: 'BHYT Quốc dân (Quốc bảo - 国保) ※ Không có trợ cấp thai sản theo ngày',
    salaryPaidDuringLeaveLabel: 'Tiền lương công ty vẫn trả trong ngày nghỉ (nếu có nghỉ phép có lương)',
    salaryPaidDuringLeaveHint: '※ Mặc định 0 yên (nghỉ không lương). Nếu công ty vẫn trả lương một phần thì BHYT chỉ bù phần chênh lệch.',
    isLeavingJobLabel: 'Bạn có nghỉ việc (thôi việc) và muốn tiếp tục nhận trợ cấp thai sản sau khi nghỉ việc không?',
    tenureBeforeRetireLabel: 'Thời gian đóng BHYT liên tục trước ngày nghỉ việc',
    tenureRetire1YearPlus: 'Đã đóng BHYT liên tục từ 1 năm trở lên (Đủ điều kiện Điều 104)',
    tenureRetireUnder1Year: 'Dưới 1 năm (Không đủ điều kiện tiếp tục nhận trợ cấp sau nghỉ việc)',
    workedOnRetireDateLabel: 'Vào ngày nghỉ việc chính thức cuối cùng, bạn có đi làm và nhận lương không?',
    workedOnRetireDateHint: '※ Nếu ngày cuối cùng vẫn đi làm nhận lương, luật coi bạn "không thuộc diện nghỉ việc để sinh con" và sẽ bị mất tư cách nhận trợ cấp.',
    yenUnit: 'yên',
    daysUnit: 'ngày',
    distinctionNoticeTitle: '【LƯU Ý CỐT LÕI】Phân biệt "Trợ cấp thai sản" và "Trợ cấp sinh con 500.000 yên"',
    distinctionDesc: 'Công cụ này tính toán "Trợ cấp thai sản 出産手当金" - khoản tiền bù đắp thu nhập theo từng ngày nghỉ làm cho người mẹ có đóng BHYT công ty (khoảng 2/3 lương). Khoản này HOÀN TOÀN TÁCH BIỆT với "Trợ cấp sinh con một lần 出産育児一時金 (500.000 yên/bé)" mà tất cả mọi người có BHYT đều được hưởng để trả viện phí.',
    sectionResults: '2. Kết quả dự toán trợ cấp',
    estimatedTotalBenefit: 'Tổng tiền Trợ cấp thai sản dự kiến nhận',
    dailyBenefitAmount: 'Số tiền trợ cấp mỗi ngày nghỉ (日額)',
    totalEligibleDays: 'Tổng số ngày được nhận trợ cấp',
    eligiblePeriod: 'Khoảng thời gian nghỉ thai sản hợp lệ',
    estimatedBadge: 'Ước tính (概算)',
    sectionDaysDetail: '3. Phân bổ số ngày nghỉ và Lịch trình thai sản',
    prenatalDaysTitle: 'Thời gian nghỉ trước sinh',
    postnatalDaysTitle: 'Thời gian nghỉ sau sinh (Luật định 56 ngày)',
    onScheduleNote: '※ Sinh đúng ngày dự kiến (42 ngày trước + 56 ngày sau = 98 ngày)',
    earlyNote: '※ Sinh sớm hơn dự kiến (số ngày trước sinh bị rút ngắn tương ứng)',
    delayedNote: '※ Sinh muộn hơn dự kiến (được cộng thêm toàn bộ các ngày chậm sinh vào thời gian trước sinh)',
    sectionFinancialDetail: '4. Căn cứ pháp lý và Công thức tính tiền',
    stdRemunerationLabel: 'Mức thù lao tháng chuẩn BHYT áp dụng (標準報酬月額):',
    formulaTitle: 'Công thức luật định (Điều 102 Luật BHYT Nhật Bản):',
    formulaText: 'Thù lao chuẩn tháng ÷ 30 ngày × 2/3 ＝ Số tiền trợ cấp mỗi ngày (làm tròn đến 1 yên)',
    salaryOffsetNotice: '※ Do công ty có trả một phần lương, số tiền thực nhận mỗi ngày là phần chênh lệch giữa mức trợ cấp luật định và mức lương đã trả.',
    sectionRegulatory: 'Văn bản Luật & Hướng dẫn chính thức (Primary Regulatory Sources)',
    ineligibleTitle: 'Không thuộc đối tượng nhận Trợ cấp Thai sản theo ngày',
  },
  en: {
    toolTitle: 'Japan Maternity Allowance Simulator (出産手当金シミュレーター)',
    toolDesc: 'Simulates statutory daily income replacement benefits (2/3 of standard remuneration) during maternity leave under Art. 102 of the Health Insurance Act.',
    sectionInput: '1. Maternity & Health Insurance Parameters',
    expectedBirthDateLabel: 'Expected Delivery Due Date',
    hasActualBirthDateLabel: 'Already delivered / Specify actual delivery date',
    actualBirthDateLabel: 'Actual Delivery Date',
    multiplePregnancyLabel: 'Multiple pregnancy (twins, triplets)',
    multiplePregnancyHint: '※ Prenatal leave extends from 42 days to 98 days (14 weeks) for multiple pregnancies.',
    monthlySalaryLabel: 'Gross Monthly Salary (Base + Overtime + Allowances)',
    monthlySalaryHint: '※ Automatically maps to one of the 50 Standard Monthly Remuneration grades.',
    tenureLabel: 'Current Health Insurance Enrollment Tenure',
    tenure12Plus: '12 months or more (Actual 12-month average applied)',
    tenureUnder12: 'Under 12 months (Lesser of actual average and Kyokai Kenpo cap of 300,000 JPY applied)',
    insurerTypeLabel: 'Health Insurance System',
    insurerKyokai: 'Japan Health Insurance Association (Kyokai Kenpo)',
    insurerKumi: 'Health Insurance Society (Large Enterprises)',
    insurerNhi: 'National Health Insurance (NHI - Freelancers/Self-employed) *Ineligible for daily allowance',
    salaryPaidDuringLeaveLabel: 'Daily wage paid by employer during leave (if any)',
    salaryPaidDuringLeaveHint: '※ Default is 0 JPY (unpaid). If partial wage is paid, allowance covers the difference.',
    isLeavingJobLabel: 'Continuing maternity allowance after leaving job (retirement)?',
    tenureBeforeRetireLabel: 'Continuous insured tenure before retirement',
    tenureRetire1YearPlus: 'At least 1 year continuous (Qualified under Art. 104)',
    tenureRetireUnder1Year: 'Less than 1 year (Ineligible for post-retirement continuation)',
    workedOnRetireDateLabel: 'Working and receiving wages on official retirement date?',
    workedOnRetireDateHint: '※ Working on your last day disqualifies you from post-retirement continuation under statutory rules.',
    yenUnit: 'JPY',
    daysUnit: 'days',
    distinctionNoticeTitle: '【IMPORTANT】Maternity Allowance vs Childbirth Lump-Sum Grant',
    distinctionDesc: 'Maternity Allowance (出産手当金) is daily wage replacement for working mothers taking leave. It is entirely separate from the Childbirth Lump-Sum Grant (出産育児一時金, 500,000 JPY per child) which subsidizes medical hospital delivery costs.',
    sectionResults: '2. Simulation Results',
    estimatedTotalBenefit: 'Estimated Total Maternity Allowance',
    dailyBenefitAmount: 'Daily Allowance Amount',
    totalEligibleDays: 'Total Eligible Days',
    eligiblePeriod: 'Eligible Maternity Leave Period',
    estimatedBadge: 'Estimate',
    sectionDaysDetail: '3. Eligible Days Breakdown & Schedule',
    prenatalDaysTitle: 'Prenatal Leave Period',
    postnatalDaysTitle: 'Postnatal Leave Period (Statutory 56 days)',
    onScheduleNote: '※ Delivered on expected date (42 + 56 = 98 days)',
    earlyNote: '※ Delivered earlier than expected date (prenatal days adjusted accordingly)',
    delayedNote: '※ Delivered later than expected date (overdue days fully added to prenatal period)',
    sectionFinancialDetail: '4. Legal Basis & Calculation Formula',
    stdRemunerationLabel: 'Standard Monthly Remuneration applied:',
    formulaTitle: 'Statutory Daily Formula (Health Insurance Act Art. 102):',
    formulaText: 'Standard Monthly Remuneration ÷ 30 days × 2/3 = Daily benefit (rounded half-up)',
    salaryOffsetNotice: '※ As partial wages are paid by employer, allowance covers the net difference.',
    sectionRegulatory: 'Primary Regulatory Sources',
    ineligibleTitle: 'Not eligible for daily Maternity Allowance',
  }
};

export default function MaternityAllowanceView({ lang = 'ja' }) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.ja;

  // State
  const [expectedBirthDate, setExpectedBirthDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 60); // 2 months in future default
    return d.toISOString().split('T')[0];
  });
  const [hasActualBirthDate, setHasActualBirthDate] = useState(false);
  const [actualBirthDate, setActualBirthDate] = useState('');
  const [isMultiplePregnancy, setIsMultiplePregnancy] = useState(false);
  const [monthlySalary, setMonthlySalary] = useState(300000);
  const [insuranceTenureMode, setInsuranceTenureMode] = useState('12_plus'); // '12_plus' | 'under_12'
  const [insurerType, setInsurerType] = useState('kyokai_kenpo');
  const [dailySalaryPaidDuringLeave, setDailySalaryPaidDuringLeave] = useState(0);

  // Retirement continuation state
  const [isLeavingJob, setIsLeavingJob] = useState(false);
  const [tenureYearsBeforeRetire, setTenureYearsBeforeRetire] = useState(1);
  const [workedOnRetireDate, setWorkedOnRetireDate] = useState(false);

  // Engine evaluation
  const result = useMemo(() => {
    return calculateMaternityAllowance({
      expectedBirthDate,
      actualBirthDate: hasActualBirthDate && actualBirthDate ? actualBirthDate : null,
      isMultiplePregnancy,
      monthlySalary,
      insuranceMonths: insuranceTenureMode === '12_plus' ? 12 : 6,
      insurerType,
      isEmployedInsured: insurerType !== 'nhi',
      dailySalaryPaidDuringLeave,
      isLeavingJob,
      continuousInsuredYearsBeforeLeaving: tenureYearsBeforeRetire,
      workedOnRetirementDate: workedOnRetireDate,
    });
  }, [
    expectedBirthDate,
    hasActualBirthDate,
    actualBirthDate,
    isMultiplePregnancy,
    monthlySalary,
    insuranceTenureMode,
    insurerType,
    dailySalaryPaidDuringLeave,
    isLeavingJob,
    tenureYearsBeforeRetire,
    workedOnRetireDate,
  ]);

  return (
    <StandardToolLayout
      title={t.toolTitle}
      description={t.toolDesc}
      badge="Japan Life • Family & Child"
      maxWidth="max-w-[1240px]"
    >
      <div className="space-y-8 max-w-full overflow-hidden">

        {/* DISTINCTION CALLOUT: 出産手当金 vs 出産育児一時金 */}
        <div className="p-4 sm:p-5 rounded-2xl bg-blue-500/10 border border-blue-500/25 flex items-start gap-3.5">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
          <div className="space-y-1 text-xs sm:text-sm">
            <h3 className="font-bold text-blue-900 dark:text-blue-200">
              {t.distinctionNoticeTitle}
            </h3>
            <p className="text-blue-800 dark:text-blue-300 leading-relaxed">
              {t.distinctionDesc}
            </p>
          </div>
        </div>

        {/* SECTION 1: CÁC THÔNG SỐ ĐẦU VÀO */}
        <section className="bg-surface rounded-2xl p-6 sm:p-8 border border-border shadow-sm space-y-6 max-w-full overflow-hidden">
          <div className="flex items-center gap-2 border-b border-border/60 pb-4">
            <Baby className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">{t.sectionInput}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Expected Birth Date */}
            <div className="space-y-2">
              <label htmlFor="expected-date" className="block text-sm font-semibold text-foreground">
                {t.expectedBirthDateLabel}
              </label>
              <input
                id="expected-date"
                type="date"
                value={expectedBirthDate}
                onChange={(e) => setExpectedBirthDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-foreground font-medium focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>

            {/* Monthly Salary */}
            <div className="space-y-2">
              <label htmlFor="monthly-salary" className="block text-sm font-semibold text-foreground">
                {t.monthlySalaryLabel}
              </label>
              <div className="relative">
                <input
                  id="monthly-salary"
                  type="number"
                  step="10000"
                  min="50000"
                  max="2000000"
                  value={monthlySalary}
                  onChange={(e) => setMonthlySalary(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-foreground font-medium focus:ring-2 focus:ring-primary focus:outline-none pr-12"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  {t.yenUnit}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{t.monthlySalaryHint}</p>
            </div>

            {/* Insurer Type */}
            <div className="space-y-2">
              <label htmlFor="insurer-type" className="block text-sm font-semibold text-foreground">
                {t.insurerTypeLabel}
              </label>
              <select
                id="insurer-type"
                value={insurerType}
                onChange={(e) => setInsurerType(e.target.value)}
                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-foreground font-medium focus:ring-2 focus:ring-primary focus:outline-none"
              >
                <option value="kyokai_kenpo">{t.insurerKyokai}</option>
                <option value="health_insurance_society">{t.insurerKumi}</option>
                <option value="nhi">{t.insurerNhi}</option>
              </select>
            </div>

            {/* Insurance Tenure */}
            <div className="space-y-2">
              <label htmlFor="insurance-tenure" className="block text-sm font-semibold text-foreground">
                {t.tenureLabel}
              </label>
              <select
                id="insurance-tenure"
                value={insuranceTenureMode}
                onChange={(e) => setInsuranceTenureMode(e.target.value)}
                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-foreground font-medium focus:ring-2 focus:ring-primary focus:outline-none"
              >
                <option value="12_plus">{t.tenure12Plus}</option>
                <option value="under_12">{t.tenureUnder12}</option>
              </select>
            </div>

            {/* Daily Paid Wage during leave */}
            <div className="space-y-2">
              <label htmlFor="daily-wage" className="block text-sm font-semibold text-foreground">
                {t.salaryPaidDuringLeaveLabel}
              </label>
              <div className="relative">
                <input
                  id="daily-wage"
                  type="number"
                  min="0"
                  step="500"
                  value={dailySalaryPaidDuringLeave}
                  onChange={(e) => setDailySalaryPaidDuringLeave(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-foreground font-medium focus:ring-2 focus:ring-primary focus:outline-none pr-12"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  {t.yenUnit}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{t.salaryPaidDuringLeaveHint}</p>
            </div>

            {/* Multiple Pregnancy Checkbox */}
            <div className="space-y-2 flex flex-col justify-end">
              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-border/80 bg-background/60 hover:bg-background cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={isMultiplePregnancy}
                  onChange={(e) => setIsMultiplePregnancy(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded text-primary focus:ring-primary border-border"
                />
                <div>
                  <span className="text-sm font-semibold text-foreground block">
                    {t.multiplePregnancyLabel}
                  </span>
                  <span className="text-xs text-muted-foreground block mt-0.5">
                    {t.multiplePregnancyHint}
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Advanced: Actual Birth Date Option */}
          <div className="pt-2 border-t border-border/60">
            <label className="inline-flex items-center gap-2.5 text-sm font-medium text-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={hasActualBirthDate}
                onChange={(e) => setHasActualBirthDate(e.target.checked)}
                className="w-4 h-4 rounded text-primary focus:ring-primary border-border"
              />
              <span>{t.hasActualBirthDateLabel}</span>
            </label>

            {hasActualBirthDate && (
              <div className="mt-3 max-w-xs space-y-1.5">
                <label htmlFor="actual-date" className="block text-xs font-semibold text-muted-foreground">
                  {t.actualBirthDateLabel}
                </label>
                <input
                  id="actual-date"
                  type="date"
                  value={actualBirthDate}
                  onChange={(e) => setActualBirthDate(e.target.value)}
                  className="w-full px-4 py-2 bg-background border border-border rounded-xl text-foreground font-medium focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Advanced: Retirement Continuation Option */}
          <div className="pt-2 border-t border-border/60 space-y-4">
            <label className="inline-flex items-center gap-2.5 text-sm font-medium text-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={isLeavingJob}
                onChange={(e) => setIsLeavingJob(e.target.checked)}
                className="w-4 h-4 rounded text-primary focus:ring-primary border-border"
              />
              <span>{t.isLeavingJobLabel}</span>
            </label>

            {isLeavingJob && (
              <div className="p-4 rounded-xl bg-background border border-border grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="retire-tenure" className="block text-xs font-semibold text-foreground">
                    {t.tenureBeforeRetireLabel}
                  </label>
                  <select
                    id="retire-tenure"
                    value={tenureYearsBeforeRetire}
                    onChange={(e) => setTenureYearsBeforeRetire(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-xs font-medium text-foreground"
                  >
                    <option value={1}>{t.tenureRetire1YearPlus}</option>
                    <option value={0.5}>{t.tenureRetireUnder1Year}</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="retire-worked" className="block text-xs font-semibold text-foreground">
                    {t.workedOnRetireDateLabel}
                  </label>
                  <select
                    id="retire-worked"
                    value={workedOnRetireDate ? 'yes' : 'no'}
                    onChange={(e) => setWorkedOnRetireDate(e.target.value === 'yes')}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-xs font-medium text-foreground"
                  >
                    <option value="no">{lang === 'ja' ? 'いいえ（出勤せず無給・有給も使わない）' : 'Không (Nghỉ không lương, không đi làm)'}</option>
                    <option value="yes">{lang === 'ja' ? 'はい（出勤した、または有給休暇を取得）' : 'Có (Đi làm hoặc lấy ngày phép có lương)'}</option>
                  </select>
                  <p className="text-2xs text-muted-foreground">{t.workedOnRetireDateHint}</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* SECTION 2: KẾT QUẢ ĐÁNH GIÁ & SỐ TIỀN */}
        {!result.isEligible ? (
          <div className="p-6 rounded-2xl bg-destructive/10 border border-destructive/30 space-y-3">
            <div className="flex items-center gap-2 text-destructive font-bold">
              <AlertTriangle className="w-5 h-5" />
              <h3>{t.ineligibleTitle}</h3>
            </div>
            <p className="text-sm text-foreground leading-relaxed">
              {lang === 'ja' ? result.ineligibleReasonJa : lang === 'vi' ? result.ineligibleReasonVi : result.ineligibleReasonEn}
            </p>
          </div>
        ) : (
          <section className="space-y-6 max-w-full overflow-hidden">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold text-foreground">{t.sectionResults}</h2>
              </div>
              {result.isEstimated && (
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-900 dark:text-amber-200">
                  {t.estimatedBadge}
                </span>
              )}
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Benefit */}
              <div className="bg-surface rounded-2xl p-5 border border-primary/20 bg-primary/5 shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-2xs font-bold uppercase tracking-wider text-primary">
                    {t.estimatedTotalBenefit}
                  </span>
                  <div className="text-2xl sm:text-3xl font-extrabold text-primary mt-1">
                    {result.financials.totalNetAmount.toLocaleString()}
                    <span className="text-sm font-semibold ml-1 text-muted-foreground">{t.yenUnit}</span>
                  </div>
                </div>
                {result.financials.isPartialSalaryOffset && (
                  <p className="text-2xs text-amber-800 dark:text-amber-300 mt-2 font-medium">
                    {t.salaryOffsetNotice}
                  </p>
                )}
              </div>

              {/* Daily Benefit */}
              <div className="bg-surface rounded-2xl p-5 border border-border shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-2xs font-bold uppercase tracking-wider text-muted-foreground">
                    {t.dailyBenefitAmount}
                  </span>
                  <div className="text-xl sm:text-2xl font-bold text-foreground mt-1">
                    {result.financials.netDailyBenefit.toLocaleString()}
                    <span className="text-xs font-normal ml-1 text-muted-foreground">{t.yenUnit}/{t.daysUnit}</span>
                  </div>
                </div>
                <div className="text-2xs text-muted-foreground mt-2">
                  {lang === 'ja' ? '標準報酬の2/3相当' : 'Tương đương 2/3 thù lao ngày'}
                </div>
              </div>

              {/* Total Days */}
              <div className="bg-surface rounded-2xl p-5 border border-border shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-2xs font-bold uppercase tracking-wider text-muted-foreground">
                    {t.totalEligibleDays}
                  </span>
                  <div className="text-xl sm:text-2xl font-bold text-foreground mt-1">
                    {result.eligiblePeriod.totalEligibleDays}
                    <span className="text-xs font-normal ml-1 text-muted-foreground">{t.daysUnit}</span>
                  </div>
                </div>
                <div className="text-2xs text-muted-foreground mt-2">
                  {result.daysBreakdown.prenatalDays}日(産前) + {result.daysBreakdown.postnatalDays}日(産後)
                </div>
              </div>

              {/* Eligible Period Dates */}
              <div className="bg-surface rounded-2xl p-5 border border-border shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-2xs font-bold uppercase tracking-wider text-muted-foreground">
                    {t.eligiblePeriod}
                  </span>
                  <div className="text-sm font-bold text-foreground mt-1.5 space-y-0.5">
                    <div>{result.eligiblePeriod.leaveStartDate}</div>
                    <div className="text-xs text-muted-foreground font-normal">〜 {result.eligiblePeriod.leaveEndDate}</div>
                  </div>
                </div>
                <div className="text-2xs text-primary font-semibold mt-2 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{lang === 'ja' ? '期間中社保料免除' : 'Miễn phí BHXH kỳ nghỉ'}</span>
                </div>
              </div>
            </div>

            {/* SECTION 3: PHÂN BỔ NGÀY NGHỈ & LỊCH TRÌNH THAI SẢN */}
            <div className="bg-surface rounded-2xl p-6 sm:p-7 border border-border shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                <h3 className="text-base font-bold text-foreground">{t.sectionDaysDetail}</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Prenatal */}
                <div className="p-4 rounded-xl bg-background border border-border space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">{t.prenatalDaysTitle}</span>
                    <span className="text-sm font-extrabold text-primary">
                      {result.daysBreakdown.prenatalDays} {t.daysUnit}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {result.birthDateRelation === 'on_due_date'
                      ? t.onScheduleNote
                      : result.birthDateRelation === 'after_due_date'
                      ? `${t.delayedNote} (+${result.daysBreakdown.delayDays}日)`
                      : `${t.earlyNote} (-${result.daysBreakdown.earlyDays}日)`}
                  </p>
                </div>

                {/* Postnatal */}
                <div className="p-4 rounded-xl bg-background border border-border space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">{t.postnatalDaysTitle}</span>
                    <span className="text-sm font-extrabold text-emerald-800 dark:text-emerald-300">
                      {result.daysBreakdown.postnatalDays} {t.daysUnit}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {lang === 'ja'
                      ? '出産日翌日から起算して56日目まで（労働基準法第65条の就業禁止期間）。'
                      : 'Tính từ ngày hôm sau ngày sinh đến đủ 56 ngày (thời gian cấm sử dụng lao động theo Luật Tiêu chuẩn Lao động).'}
                  </p>
                </div>
              </div>
            </div>

            {/* SECTION 4: CĂN CỨ VÀ CÔNG THỨC */}
            <div className="bg-surface rounded-2xl p-6 sm:p-7 border border-border shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <h3 className="text-base font-bold text-foreground">{t.sectionFinancialDetail}</h3>
              </div>

              <div className="space-y-3 text-xs sm:text-sm text-foreground">
                <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 rounded-xl bg-background border border-border">
                  <span className="text-muted-foreground">{t.stdRemunerationLabel}</span>
                  <span className="font-bold text-primary text-base">
                    {result.financials.standardMonthlyRemuneration.toLocaleString()} {t.yenUnit}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-background border border-border space-y-1">
                  <span className="font-semibold block text-foreground">{t.formulaTitle}</span>
                  <div className="font-mono text-xs bg-surface p-2.5 rounded-lg border border-border/80 text-primary font-bold">
                    {result.financials.standardMonthlyRemuneration.toLocaleString()} ÷ 30 × 2/3 ＝ {result.financials.standardDailyBenefit.toLocaleString()} {t.yenUnit}/{t.daysUnit}
                  </div>
                  <p className="text-2xs text-muted-foreground pt-1">
                    {lang === 'ja' ? result.financials.basisExplanationJa : result.financials.basisExplanationVi}
                  </p>
                </div>
              </div>
            </div>

          </section>
        )}

        {/* SECTION 5: NGUỒN PHÁP ĐIỂN CHÍNH THỨC */}
        <section className="space-y-4 max-w-full overflow-hidden">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">{t.sectionRegulatory}</h2>
          </div>
          <RegulatorySourceView sourceIds={MATERNITY_ALLOWANCE_SOURCES} lang={lang} />
        </section>

      </div>
    </StandardToolLayout>
  );
}
