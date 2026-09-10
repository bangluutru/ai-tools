import React, { useState, useMemo } from 'react';
import {
  Coins,
  ShieldCheck,
  Calendar,
  CreditCard,
  Building2,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  Info,
  ArrowRight,
  TrendingDown,
  Award,
  HelpCircle,
  PiggyBank
} from 'lucide-react';
import {
  calculateNationalPension,
  EXEMPTION_TYPES,
  NATIONAL_PENSION_SCHEDULES
} from '../../japan/insurance/index.js';
import RegulatorySourceView from '../regulatory/RegulatorySourceView.jsx';

const I18N = {
  ja: {
    badge: '日本年金機構 令和8年度 (FY2026) 基準',
    title: '国民年金ガイド & 保険料シミュレーター',
    subtitle: '国民年金（第1号被保険者）の月額・年額保険料、前納割引、免除・猶予制度、追納ルールを正確に試算・解説します。',
    applicableDate: '適用年度・基準月',
    exemptionStatus: '免除・猶予の区分',
    duration: '計算対象月数',
    monthsUnit: 'ヶ月',
    advancePlan: '前納（一括納付）割引',
    advanceMethod: '前納の支払方法',
    additionalPension: '付加年金の加入 (+400円/月)',
    additionalPensionDesc: '月額400円を追加納付することで、老齢基礎年金に「200円×納付月数」が一生涯加算されます（約2年で元が取れます）。',
    noAdvance: '前納なし（毎月納付）',
    sixMonths: '6ヶ月前納',
    oneYear: '1年前納',
    twoYears: '2年前納',
    accountTransfer: '口座振替 (割引額が最大)',
    creditCard: 'クレジットカード納付',
    cash: '現金・納付書',
    resultTitle: '試算結果サマリー',
    monthlyContribution: '1ヶ月あたりの保険料',
    totalContribution: '期間合計の支払額',
    benefitReflection: '将来の年金受給額反映',
    advanceSavings: '前納による節約額',
    creditedPeriod: '受給資格期間への算入',
    yesCredited: '満額算入 (10年要件)',
    retroactiveTitle: '追納（ついのう）制度のご案内',
    comparisonTitle: '免除・猶予制度の受給額反映 比較一覧',
    statusCol: '免除区分',
    payCol: '月額支払',
    reflectCol: '年金額反映',
    creditCol: '受給資格期間',
    backpayCol: '追納可能期間',
    officialSources: '公的根拠・典拠データ',
    reset: '初期値に戻す',
    whyTitle: '制度の仕組みとアドバイス',
  },
  vi: {
    badge: 'Chuẩn 日本年金機構 Năm Tài Chính Lệnh Hòa 8 (FY2026)',
    title: 'Tra Cứu & Mô Phỏng Phí Hưu Trí Quốc Dân (国民年金)',
    subtitle: 'Tính chính xác phí nộp hàng tháng, đóng trước giảm giá (前納), các chế độ miễn hoãn (免除・猶予) và quy tắc truy đóng (追納) theo chuẩn Japan Pension Service.',
    applicableDate: 'Kỳ Áp Dụng / Ngày Tính',
    exemptionStatus: 'Chế Độ Miễn / Hoãn Nộp',
    duration: 'Số Tháng Tính Toán',
    monthsUnit: 'tháng',
    advancePlan: 'Gói Đóng Trước (前納 - Tiết Kiệm)',
    advanceMethod: 'Phương Thức Thanh Toán Đóng Trước',
    additionalPension: 'Tham gia Lương Hưu Bổ Sung (+400円/tháng)',
    additionalPensionDesc: 'Đóng thêm 400円/tháng, khi về già được nhận thêm 200円/năm suốt đời cho mỗi tháng đã đóng (hoàn vốn chỉ sau 2 năm hưởng hưu).',
    noAdvance: 'Nộp từng tháng (Không đóng trước)',
    sixMonths: 'Đóng trước 6 tháng',
    oneYear: 'Đóng trước 1 năm',
    twoYears: 'Đóng trước 2 năm',
    accountTransfer: 'Trừ tài khoản tự động (Chiết khấu cao nhất)',
    creditCard: 'Thẻ tín dụng',
    cash: 'Tiền mặt / Giấy báo nộp',
    resultTitle: 'Tổng Quan Kết Quả Tính Toán',
    monthlyContribution: 'Số Tiền Phải Nộp / Tháng',
    totalContribution: 'Tổng Tiền Nộp Trong Kỳ',
    benefitReflection: 'Mức Hưởng Lương Hưu Tuổi Già',
    advanceSavings: 'Tiết Kiệm Nhờ Đóng Trước',
    creditedPeriod: 'Tính Vào Số Năm Điều Kiện Hưởng',
    yesCredited: 'Được tính đủ (Yêu cầu 10 năm)',
    retroactiveTitle: 'Chính Sách Truy Đóng Bù (追納)',
    comparisonTitle: 'Bảng So Sánh Các Chế Độ Miễn Giảm & Tỷ Lệ Hưởng',
    statusCol: 'Chế độ miễn giảm',
    payCol: 'Nộp/tháng',
    reflectCol: 'Hưởng lương hưu',
    creditCol: 'Tính số năm',
    backpayCol: 'Hạn truy đóng',
    officialSources: 'Căn Cứ Pháp Lý & Cơ Quan Ban Hành',
    reset: 'Đặt lại',
    whyTitle: 'Giải Thích Quy Định & Lời Khuyên',
  },
  en: {
    badge: 'Japan Pension Service FY2026 Official Standard',
    title: 'National Pension Guide & Premium Simulator',
    subtitle: 'Accurately simulate monthly/annual contributions, advance payment discounts, exemption/deferment systems, and backpayment rules.',
    applicableDate: 'Applicable Fiscal Period',
    exemptionStatus: 'Exemption / Deferment Status',
    duration: 'Calculation Duration',
    monthsUnit: 'months',
    advancePlan: 'Advance Payment Discount (前納)',
    advanceMethod: 'Advance Payment Method',
    additionalPension: 'Enroll in Additional Pension (+400 JPY/mo)',
    additionalPensionDesc: 'Pay +400 JPY/month to receive an extra +200 JPY/year for each month paid for life upon retirement (breakeven in 2 years).',
    noAdvance: 'Pay Monthly (No advance)',
    sixMonths: '6 Months Advance',
    oneYear: '1 Year Advance',
    twoYears: '2 Years Advance',
    accountTransfer: 'Direct Bank Debit (Highest discount)',
    creditCard: 'Credit Card',
    cash: 'Cash / Payment Slip',
    resultTitle: 'Simulation Results',
    monthlyContribution: 'Monthly Contribution',
    totalContribution: 'Total Period Amount',
    benefitReflection: 'Old-Age Pension Reflection',
    advanceSavings: 'Advance Payment Savings',
    creditedPeriod: 'Counts Towards Qualifying Period',
    yesCredited: 'Fully Credited (10-yr rule)',
    retroactiveTitle: 'Retroactive Payment Guide (追納)',
    comparisonTitle: 'Exemption & Deferment Benefit Comparison',
    statusCol: 'Status',
    payCol: 'Monthly',
    reflectCol: 'Pension Benefit',
    creditCol: '10-yr Credit',
    backpayCol: 'Backpay Limit',
    officialSources: 'Official Regulatory Sources',
    reset: 'Reset',
    whyTitle: 'Rules & Recommendations',
  }
};

export function NationalPensionView({ lang = 'ja' }) {
  const [applicableDate, setApplicableDate] = useState('2026-05-01');
  const [exemptionType, setExemptionType] = useState('none');
  const [withAdditionalPension, setWithAdditionalPension] = useState(false);
  const [months, setMonths] = useState(12);
  const [advancePaymentPlan, setAdvancePaymentPlan] = useState('one_year');
  const [advancePaymentMethod, setAdvancePaymentMethod] = useState('account_transfer');

  const t = I18N[lang] || I18N.ja;

  const handleReset = () => {
    setApplicableDate('2026-05-01');
    setExemptionType('none');
    setWithAdditionalPension(false);
    setMonths(12);
    setAdvancePaymentPlan('one_year');
    setAdvancePaymentMethod('account_transfer');
  };

  const result = useMemo(() => {
    return calculateNationalPension({
      applicableDate,
      exemptionType,
      withAdditionalPension,
      months,
      advancePaymentPlan,
      advancePaymentMethod
    });
  }, [applicableDate, exemptionType, withAdditionalPension, months, advancePaymentPlan, advancePaymentMethod]);

  return (
    <div className="w-full max-w-[1240px] mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header Bar */}
      <div className="bg-surface-container rounded-2xl p-6 sm:p-8 border border-outline-variant/30 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
              <PiggyBank className="w-3.5 h-3.5" />
              <span>{t.badge}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
              {t.title}
            </h1>
            <p className="text-sm sm:text-base text-on-surface-variant max-w-3xl leading-relaxed">
              {t.subtitle}
            </p>
          </div>

          {/* Reset control */}
          <div className="flex items-center gap-2 self-start md:self-center shrink-0">
            <button
              onClick={handleReset}
              className="p-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high border border-outline-variant/30 transition-all"
              title={t.reset}
              aria-label={t.reset}
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Inputs (Left) & Results (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Input Form (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-surface-container rounded-2xl p-6 border border-outline-variant/30 shadow-sm space-y-5">
            <h2 className="text-lg font-bold text-on-surface flex items-center gap-2">
              <Coins className="w-5 h-5 text-primary" />
              <span>Thông Số Mô Phỏng</span>
            </h2>

            {/* Applicable Date */}
            <div className="space-y-1.5">
              <label htmlFor="np-date" className="text-xs font-semibold text-on-surface-variant">
                {t.applicableDate}
              </label>
              <select
                id="np-date"
                value={applicableDate}
                onChange={(e) => setApplicableDate(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl bg-surface border border-outline-variant/50 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="2026-05-01">令和8年度 (FY2026: 2026-04-01 〜 2027-03-31 - 17,920円)</option>
                <option value="2025-05-01">令和7年度 (FY2025: 2025-04-01 〜 2026-03-31 - 17,510円)</option>
              </select>
            </div>

            {/* Exemption Status */}
            <div className="space-y-1.5">
              <label htmlFor="np-exemption" className="text-xs font-semibold text-on-surface-variant">
                {t.exemptionStatus}
              </label>
              <select
                id="np-exemption"
                value={exemptionType}
                onChange={(e) => {
                  setExemptionType(e.target.value);
                  if (e.target.value !== 'none') {
                    setWithAdditionalPension(false);
                    setAdvancePaymentPlan('none');
                  }
                }}
                className="w-full px-3 py-2 text-sm rounded-xl bg-surface border border-outline-variant/50 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary font-medium"
              >
                {Object.values(EXEMPTION_TYPES).map((ext) => (
                  <option key={ext.id} value={ext.id}>
                    {ext.name[lang] || ext.name.vi}
                  </option>
                ))}
              </select>
            </div>

            {/* Duration (Months) */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label htmlFor="np-months" className="text-xs font-semibold text-on-surface-variant">
                  {t.duration}
                </label>
                <span className="text-xs font-bold text-primary">{months} {t.monthsUnit}</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[1, 6, 12, 24].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setMonths(m);
                      if (m === 6) setAdvancePaymentPlan('six_months');
                      else if (m === 12) setAdvancePaymentPlan('one_year');
                      else if (m === 24) setAdvancePaymentPlan('two_years');
                    }}
                    className={`py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                      months === m
                        ? 'bg-primary text-on-primary border-primary'
                        : 'bg-surface border-outline-variant/40 text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    {m} {t.monthsUnit}
                  </button>
                ))}
              </div>
            </div>

            {/* Advance payment options (only available for regular payment) */}
            {exemptionType === 'none' ? (
              <div className="pt-2 border-t border-outline-variant/20 space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="np-advance-plan" className="text-xs font-semibold text-on-surface-variant flex items-center gap-1.5">
                    <TrendingDown className="w-4 h-4 text-emerald-700 dark:text-emerald-300" />
                    <span>{t.advancePlan}</span>
                  </label>
                  <select
                    id="np-advance-plan"
                    value={advancePaymentPlan}
                    onChange={(e) => setAdvancePaymentPlan(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl bg-surface border border-outline-variant/50 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="none">{t.noAdvance}</option>
                    <option value="six_months">{t.sixMonths}</option>
                    <option value="one_year">{t.oneYear}</option>
                    <option value="two_years">{t.twoYears}</option>
                  </select>
                </div>

                {advancePaymentPlan !== 'none' && (
                  <div className="space-y-1.5">
                    <label htmlFor="np-advance-method" className="text-xs font-semibold text-on-surface-variant">
                      {t.advanceMethod}
                    </label>
                    <select
                      id="np-advance-method"
                      value={advancePaymentMethod}
                      onChange={(e) => setAdvancePaymentMethod(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl bg-surface border border-outline-variant/50 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="account_transfer">{t.accountTransfer}</option>
                      <option value="credit_card">{t.creditCard}</option>
                      <option value="cash">{t.cash}</option>
                    </select>
                  </div>
                )}

                {/* Additional Pension Toggle */}
                <div className="pt-2">
                  <label className="flex items-start gap-3 p-3 rounded-xl bg-surface border border-outline-variant/30 cursor-pointer hover:border-primary/40 transition-colors">
                    <input
                      type="checkbox"
                      checked={withAdditionalPension}
                      onChange={(e) => setWithAdditionalPension(e.target.checked)}
                      className="mt-1 w-4 h-4 text-primary rounded border-outline-variant/50 focus:ring-primary"
                    />
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>{t.additionalPension}</span>
                      </span>
                      <p className="text-[11px] text-on-surface-variant leading-relaxed">
                        {t.additionalPensionDesc}
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 text-xs text-on-surface-variant space-y-1">
                <div className="font-semibold text-primary flex items-center gap-1">
                  <Info className="w-3.5 h-3.5" />
                  <span>Đang chọn chế độ miễn / hoãn</span>
                </div>
                <p className="text-[11px]">
                  {result.exemption.description[lang] || result.exemption.description.vi}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Results & Insights (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Highlights Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Monthly Premium */}
            <div className="bg-surface-container rounded-2xl p-5 border border-outline-variant/30 shadow-sm space-y-2">
              <span className="text-xs font-semibold text-on-surface-variant flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-primary" />
                <span>{t.monthlyContribution}</span>
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-on-surface">
                  {result.totalMonthlyContribution.toLocaleString('ja-JP')}
                </span>
                <span className="text-sm font-semibold text-on-surface-variant">円/月</span>
              </div>
              {result.withAdditionalPension && (
                <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                  Đã bao gồm 400円/tháng lương hưu bổ sung (付加年金)
                </p>
              )}
            </div>

            {/* Total Period Payable */}
            <div className="bg-surface-container rounded-2xl p-5 border border-outline-variant/30 shadow-sm space-y-2">
              <span className="text-xs font-semibold text-on-surface-variant flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-500" />
                <span>{t.totalContribution} ({result.numMonths} {t.monthsUnit})</span>
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-primary">
                  {(result.advanceCalculation
                    ? result.advanceCalculation.netPayableAmount
                    : result.standardPeriodTotal
                  ).toLocaleString('ja-JP')}
                </span>
                <span className="text-sm font-semibold text-on-surface-variant">円</span>
              </div>
              {result.advanceCalculation && (
                <p className="text-[11px] text-emerald-800 dark:text-emerald-300 font-medium flex items-center gap-1">
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>Tiết kiệm {result.advanceCalculation.discountAmount.toLocaleString('ja-JP')} 円 ({result.advanceCalculation.savingsPercentage}%)</span>
                </p>
              )}
            </div>

            {/* Benefit Reflection */}
            <div className="bg-surface-container rounded-2xl p-5 border border-outline-variant/30 shadow-sm space-y-2">
              <span className="text-xs font-semibold text-on-surface-variant flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-500" />
                <span>{t.benefitReflection}</span>
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-on-surface">
                  {result.exemption.benefitReflectionPercent}%
                </span>
                <span className="text-xs text-on-surface-variant">lương hưu tuổi già</span>
              </div>
              <p className="text-[11px] text-on-surface-variant">
                {result.exemption.id === 'full_exempt'
                  ? 'Vẫn được hưởng 50% nhờ nguồn ngân sách quốc gia (国庫負担) chi trả.'
                  : result.exemption.id === 'deferment' || result.exemption.id === 'student_special'
                  ? '0% nếu không truy đóng bù (nhưng tính trọn vẹn số năm điều kiện).'
                  : 'Phản ánh trực tiếp vào công thức tính 老齢基礎年金.'}
              </p>
            </div>

            {/* Qualifying Period Credit */}
            <div className="bg-surface-container rounded-2xl p-5 border border-outline-variant/30 shadow-sm space-y-2">
              <span className="text-xs font-semibold text-on-surface-variant flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>{t.creditedPeriod}</span>
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-extrabold text-emerald-800 dark:text-emerald-300">
                  {t.yesCredited}
                </span>
              </div>
              <p className="text-[11px] text-on-surface-variant">
                Toàn bộ thời gian miễn/hoãn đều được tính vào mốc tối thiểu 10 năm (120 tháng) để đủ tư cách hưởng hưu khi đủ 65 tuổi.
              </p>
            </div>
          </div>

          {/* Retroactive Payment Guidance (追納) */}
          <div className="bg-surface-container rounded-2xl p-6 border border-outline-variant/30 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
              <HelpCircle className="w-4.5 h-4.5 text-primary" />
              <span>{t.retroactiveTitle}</span>
            </h3>
            <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
              {result.retroactiveAdvice.note[lang] || result.retroactiveAdvice.note.vi}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
              <div className="p-3 rounded-xl bg-surface border border-outline-variant/30 space-y-1">
                <div className="font-bold text-on-surface">Thời hạn truy đóng (10 năm)</div>
                <p className="text-on-surface-variant text-[11px]">
                  Chỉ được truy đóng các tháng trong vòng 10 năm gần nhất. Quá 10 năm sẽ vĩnh viễn không thể đóng bù.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-surface border border-outline-variant/30 space-y-1">
                <div className="font-bold text-on-surface">Không tính lãi trong 2 năm đầu</div>
                <p className="text-on-surface-variant text-[11px]">
                  Truy đóng trong vòng 2 năm tài chính giữ nguyên số tiền gốc. Từ năm thứ 3 trở đi sẽ áp dụng khoản cộng thêm trượt giá (加算額).
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Exemption Comparison Table */}
      <div className="bg-surface-container rounded-2xl p-6 sm:p-8 border border-outline-variant/30 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
          <Award className="w-5 h-5 text-primary" />
          <span>{t.comparisonTitle}</span>
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-outline-variant/30 text-on-surface-variant text-xs uppercase tracking-wider">
                <th className="py-3 px-3">{t.statusCol}</th>
                <th className="py-3 px-3">{t.payCol}</th>
                <th className="py-3 px-3">{t.reflectCol}</th>
                <th className="py-3 px-3">{t.creditCol}</th>
                <th className="py-3 px-3">{t.backpayCol}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              <tr className={exemptionType === 'none' ? 'bg-primary/5 font-semibold' : ''}>
                <td className="py-3 px-3 text-on-surface">通常納付 (Đóng thường)</td>
                <td className="py-3 px-3 text-on-surface">17,920 円</td>
                <td className="py-3 px-3 text-emerald-800 dark:text-emerald-300">100% (8/8)</td>
                <td className="py-3 px-3 text-on-surface">✔ Tính đủ</td>
                <td className="py-3 px-3 text-on-surface-variant">-</td>
              </tr>
              <tr className={exemptionType === 'quarter_exempt' ? 'bg-primary/5 font-semibold' : ''}>
                <td className="py-3 px-3 text-on-surface">4分の1免除 (Miễn 1/4)</td>
                <td className="py-3 px-3 text-on-surface">13,440 円</td>
                <td className="py-3 px-3 text-on-surface">87.5% (7/8)</td>
                <td className="py-3 px-3 text-on-surface">✔ Tính đủ</td>
                <td className="py-3 px-3 text-primary">Trong 10 năm</td>
              </tr>
              <tr className={exemptionType === 'half_exempt' ? 'bg-primary/5 font-semibold' : ''}>
                <td className="py-3 px-3 text-on-surface">半額免除 (Miễn 1/2)</td>
                <td className="py-3 px-3 text-on-surface">8,960 円</td>
                <td className="py-3 px-3 text-on-surface">75.0% (6/8)</td>
                <td className="py-3 px-3 text-on-surface">✔ Tính đủ</td>
                <td className="py-3 px-3 text-primary">Trong 10 năm</td>
              </tr>
              <tr className={exemptionType === 'three_quarters_exempt' ? 'bg-primary/5 font-semibold' : ''}>
                <td className="py-3 px-3 text-on-surface">4分の3免除 (Miễn 3/4)</td>
                <td className="py-3 px-3 text-on-surface">4,480 円</td>
                <td className="py-3 px-3 text-on-surface">62.5% (5/8)</td>
                <td className="py-3 px-3 text-on-surface">✔ Tính đủ</td>
                <td className="py-3 px-3 text-primary">Trong 10 năm</td>
              </tr>
              <tr className={exemptionType === 'full_exempt' ? 'bg-primary/5 font-semibold' : ''}>
                <td className="py-3 px-3 text-on-surface">全額免除 (Miễn toàn bộ)</td>
                <td className="py-3 px-3 text-emerald-800 dark:text-emerald-300 font-bold">0 円</td>
                <td className="py-3 px-3 text-indigo-800 dark:text-indigo-300">50.0% (4/8)</td>
                <td className="py-3 px-3 text-on-surface">✔ Tính đủ</td>
                <td className="py-3 px-3 text-primary">Trong 10 năm</td>
              </tr>
              <tr className={exemptionType === 'deferment' ? 'bg-primary/5 font-semibold' : ''}>
                <td className="py-3 px-3 text-on-surface">納付猶予 (Hoãn nộp &lt;50t)</td>
                <td className="py-3 px-3 text-emerald-800 dark:text-emerald-300 font-bold">0 円</td>
                <td className="py-3 px-3 text-rose-700 dark:text-rose-300">0% (Chưa truy đóng)</td>
                <td className="py-3 px-3 text-on-surface">✔ Tính đủ</td>
                <td className="py-3 px-3 text-primary">Trong 10 năm</td>
              </tr>
              <tr className={exemptionType === 'student_special' ? 'bg-primary/5 font-semibold' : ''}>
                <td className="py-3 px-3 text-on-surface">学生納付特例 (Hoãn sinh viên)</td>
                <td className="py-3 px-3 text-emerald-800 dark:text-emerald-300 font-bold">0 円</td>
                <td className="py-3 px-3 text-rose-700 dark:text-rose-300">0% (Chưa truy đóng)</td>
                <td className="py-3 px-3 text-on-surface">✔ Tính đủ</td>
                <td className="py-3 px-3 text-primary">Trong 10 năm</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Official Sources Section */}
      <RegulatorySourceView
        sourceIds={result.sources}
        title={t.officialSources}
        subtitle="Dữ liệu mức phí, biểu chiết khấu đóng trước và chế độ miễn giảm được trích dẫn trực tiếp từ các văn bản pháp quy của Cơ quan Hưu trí Nhật Bản (日本年金機構)."
      />
    </div>
  );
}

export default NationalPensionView;
