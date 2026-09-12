/**
 * @file packages/core/src/components/vietnam/LoanAprCalculatorVNView.jsx
 * @description Giao diện tính lãi suất thực khoản vay (Loan APR & EAR Calculator) theo dòng tiền thực (IRR)
 * và quy đổi chuẩn mực từ lãi suất hợp đồng (Dư nợ giảm dần, Gốc đều, Dư nợ ban đầu - Flat-rate).
 * Tuân thủ 100% nguyên tắc thiết kế Toolio: Semantic Design Tokens, container 1240px, Metric Cards Grid,
 * Privacy Shield, cảnh báo bẫy lãi suất phẳng (Flat-rate trap) và đa ngữ (VI, EN, JA).
 */

import React, { useState, useMemo } from 'react';
import {
  Percent,
  Calculator,
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Sparkles,
  Layers,
  Banknote,
  DollarSign,
  Receipt,
  Calendar,
  Sliders,
  CheckCircle2,
  Info,
} from 'lucide-react';

import RegulatorySourceView from '../regulatory/RegulatorySourceView.jsx';
import {
  calculateLoanAPRFromCashFlow,
  calculateLoanPaymentAndSchedule,
  POPULAR_LOAN_FEES_VN,
} from '../../vietnam/index.js';

const I18N = {
  vi: {
    appBadge: 'VIETNAM CONSUMER CREDIT & LOAN APR',
    legalBadge: 'Thông tư 43/2016/TT-NHNN & 18/2019/TT-NHNN (NHNN)',
    title: 'Tính Lãi Suất Thực Khoản Vay (APR & EAR)',
    subtitle: 'Khám phá chi phí vay thực tế bằng thuật toán dòng tiền tài chính (IRR). Bóc tách bảo hiểm, phụ phí và vạch trần chênh lệch giữa lãi suất phẳng (Flat rate) với lãi suất thực.',
    privacyNote: '100% Xử lý cục bộ trên trình duyệt — Mọi số liệu khoản vay, số tiền và kỳ hạn được bảo mật tuyệt đối trên thiết bị của bạn.',
    modeCashFlow: 'Vay trả góp (Dòng tiền thực)',
    modeRate: 'Tính từ lãi suất hợp đồng',
    presetLabel: 'Kịch bản mẫu tham khảo:',
    presetA1: '📱 Vay 0% có phí (12M - 12T)',
    presetA2: '💳 Vay tiêu dùng (50M - 24T)',
    presetA3: '⚡ Vay qua App (20M - 12T)',
    presetB1: '🏠 Vay mua nhà (500M - 60T - 10.5%)',
    presetB2: '⚠️ Bẫy lãi phẳng (100M - 12T - 12% Flat)',
    presetB3: '💼 Vay tín chấp (50M - 24T - 18% Gốc đều)',
    principalLabel: 'Số tiền vay theo hợp đồng (VND)',
    placeholderPrincipal: '100,000,000',
    termLabel: 'Thời hạn vay (tháng)',
    placeholderTerm: '12',
    monthlyPaymentLabel: 'Số tiền trả mỗi tháng (Gốc + Lãi thỏa thuận)',
    placeholderMonthlyPayment: '9,333,333',
    annualRateLabel: 'Lãi suất công bố trên hợp đồng (%/năm)',
    placeholderRate: '12.0',
    methodLabel: 'Phương thức tính lãi & trả nợ',
    methodAmortized: 'Dư nợ giảm dần (Trả góp đều - PMT)',
    methodFixedPrincipal: 'Gốc chia đều, lãi giảm dần',
    methodFlat: 'Dư nợ ban đầu (Lãi phẳng - Flat rate) ⚠️',
    upfrontFeeLabel: 'Tổng phí khấu trừ trước (Bảo hiểm, thẩm định...)',
    placeholderUpfrontFee: '0',
    monthlyFeeLabel: 'Phí định kỳ mỗi tháng (Quản lý, SMS...)',
    placeholderMonthlyFee: '0',
    metricEarTitle: 'LÃI SUẤT HIỆU DỤNG NĂM (EAR)',
    metricEarSub: 'Lãi suất kép thực tế người vay phải gánh',
    metricAprTitle: 'Lãi suất danh nghĩa năm (APR)',
    metricAprSub: 'Tương đương chuẩn dư nợ giảm dần',
    metricPaymentTitle: 'Khoản thanh toán hàng tháng',
    metricPaymentSub: 'Đã gồm phí định kỳ (nếu có)',
    metricNetTitle: 'Số tiền thực nhận giải ngân',
    metricNetSub: 'Gốc trừ các khoản phí khấu trừ trước',
    metricTotalCostTitle: 'Tổng chi phí vay thực tế',
    metricTotalCostSub: 'Tổng tiền chi trả trừ số tiền thực nhận',
    firstMonthPayment: 'Kỳ đầu:',
    lastMonthPayment: 'Kỳ cuối:',
    warningFlatRateTitle: 'Cảnh báo bẫy lãi suất phẳng (Flat Rate Trap):',
    warningFlatRateBody: 'Hợp đồng ghi lãi suất {contractRate}%/năm tính trên dư nợ ban đầu. Vì gốc giảm dần sau mỗi tháng nhưng lãi vẫn bị thu trên 100% gốc ban đầu, LÃI SUẤT THỰC TƯƠNG ĐƯƠNG (Nominal APR) lên tới {nominalApr}%/năm và Lãi suất hiệu dụng (EAR) thực tế là {ear}%/năm — cao hơn gần gấp đôi so với con số quảng cáo!',
    breakdownTitle: 'Bảng Kê Chi Tiết Chi Phí & Cơ Cấu Khoản Vay',
    colItem: 'Khoản mục',
    colAmount: 'Số tiền (VND)',
    colNote: 'Ý nghĩa / Ghi chú',
    rowContractPrincipal: '1. Số tiền vay trên hợp đồng (Gốc cam kết)',
    rowUpfrontFees: '2. Các khoản phí khấu trừ trước (Bảo hiểm, thủ tục...)',
    rowNetProceeds: '3. Số tiền thực nhận khi giải ngân (1 - 2)',
    rowScheduledInterest: '4. Tiền lãi danh nghĩa dự kiến',
    rowPeriodicFees: '5. Tổng phí phát sinh định kỳ trong kỳ hạn',
    rowTotalRepayment: '6. Tổng số tiền người vay phải trả (Gốc + Lãi + Phí)',
    rowTotalBorrowingCost: '7. TỔNG CHI PHÍ VAY THỰC TẾ (6 - 3)',
    scheduleTitle: 'Lịch Trả Nợ Chi Tiết Từng Kỳ ({count} tháng)',
    toggleScheduleOpen: 'Xem lịch trả nợ chi tiết',
    toggleScheduleClose: 'Thu gọn lịch trả nợ',
    colPeriod: 'Kỳ',
    colOpeningBalance: 'Dư nợ đầu kỳ',
    colPrincipal: 'Tiền gốc trả',
    colInterest: 'Tiền lãi trả',
    colFee: 'Phí kỳ',
    colTotal: 'Tổng trả kỳ',
    colClosingBalance: 'Dư nợ cuối kỳ',
    formulaTitle: 'Giải Thích Thuật Toán & Quy Định Pháp Lý',
    formulaIrrText: '• Thuật toán Dòng tiền Tài chính (Internal Rate of Return - IRR): Tìm tỷ suất r sao cho Tổng giá trị hiện tại (NPV) của các khoản tiền trả trong tương lai bằng đúng số tiền thực nhận tại thời điểm giải ngân t0.',
    formulaEarText: '• Lãi suất hiệu dụng năm (EAR): EAR = (1 + r)^12 - 1. Phản ánh chính xác chi phí cơ hội và lãi kép của dòng tiền tín dụng.',
    legalNoteText: '• Thông tư 43/2016/TT-NHNN và Thông tư 18/2019/TT-NHNN của Ngân hàng Nhà nước Việt Nam quy định các công ty tài chính và tổ chức tín dụng phải minh bạch lãi suất tính theo dư nợ giảm dần, cung cấp bảng lịch trả nợ và công khai mọi loại phí trước khi ký kết hợp đồng.',
  },
  en: {
    appBadge: 'VIETNAM CONSUMER CREDIT & LOAN APR',
    legalBadge: 'Circular 43/2016/TT-NHNN & 18/2019/TT-NHNN (SBV)',
    title: 'Vietnam Loan APR & Effective Rate Calculator',
    subtitle: 'Uncover true borrowing costs via financial cash-flow IRR. Expose insurance deductions, upfront fees, and the flat-rate illusion.',
    privacyNote: '100% Client-side execution — All loan terms, principal, and cash flows remain confidential on your device.',
    modeCashFlow: 'Installment Loan (Cash Flow)',
    modeRate: 'Calculate from Contract Rate',
    presetLabel: 'Benchmark Presets:',
    presetA1: '📱 0% Interest Promo (12M - 12mo)',
    presetA2: '💳 Consumer Loan (50M - 24mo)',
    presetA3: '⚡ App Cash Loan (20M - 12mo)',
    presetB1: '🏠 Mortgage (500M - 60mo - 10.5%)',
    presetB2: '⚠️ Flat-Rate Trap (100M - 12mo - 12% Flat)',
    presetB3: '💼 Personal Loan (50M - 24mo - 18% Fixed)',
    principalLabel: 'Contract Loan Amount / Principal (VND)',
    placeholderPrincipal: '100,000,000',
    termLabel: 'Loan Term (months)',
    placeholderTerm: '12',
    monthlyPaymentLabel: 'Monthly Payment (Principal + Stated Interest)',
    placeholderMonthlyPayment: '9,333,333',
    annualRateLabel: 'Stated Annual Interest Rate (%/year)',
    placeholderRate: '12.0',
    methodLabel: 'Repayment & Interest Method',
    methodAmortized: 'Reducing Balance (Equal Installments - PMT)',
    methodFixedPrincipal: 'Fixed Principal, Reducing Interest',
    methodFlat: 'Flat Rate (Original Principal Balance) ⚠️',
    upfrontFeeLabel: 'Total Upfront Deducted Fees (Insurance, etc.)',
    placeholderUpfrontFee: '0',
    monthlyFeeLabel: 'Recurring Monthly Fee (Account, SMS...)',
    placeholderMonthlyFee: '0',
    metricEarTitle: 'EFFECTIVE ANNUAL RATE (EAR)',
    metricEarSub: 'Real compounded annual borrowing rate',
    metricAprTitle: 'Nominal Annual Rate (APR)',
    metricAprSub: 'Equivalent reducing balance rate',
    metricPaymentTitle: 'Monthly Payment',
    metricPaymentSub: 'Inclusive of recurring fee',
    metricNetTitle: 'Net Disbursed Proceeds',
    metricNetSub: 'Contract principal minus upfront fees',
    metricTotalCostTitle: 'Total Borrowing Cost',
    metricTotalCostSub: 'Total money paid minus net proceeds',
    firstMonthPayment: '1st Month:',
    lastMonthPayment: 'Last Month:',
    warningFlatRateTitle: 'Flat Rate Trap Warning:',
    warningFlatRateBody: 'The contract advertises {contractRate}%/year on the original balance. Because principal declines monthly while interest continues on 100% of the original sum, the TRUE EQUIVALENT APR is {nominalApr}%/year and the Effective Annual Rate (EAR) is {ear}%/year — nearly double the advertised rate!',
    breakdownTitle: 'Cost Breakdown & Loan Structure',
    colItem: 'Item',
    colAmount: 'Amount (VND)',
    colNote: 'Description / Notes',
    rowContractPrincipal: '1. Contract Principal (Committed loan)',
    rowUpfrontFees: '2. Upfront Deducted Fees (Insurance, processing)',
    rowNetProceeds: '3. Net Disbursed Proceeds (1 - 2)',
    rowScheduledInterest: '4. Total Stated Interest',
    rowPeriodicFees: '5. Total Recurring In-Term Fees',
    rowTotalRepayment: '6. Total Repayment (Principal + Interest + Fees)',
    rowTotalBorrowingCost: '7. TOTAL TRUE BORROWING COST (6 - 3)',
    scheduleTitle: 'Amortization Schedule ({count} months)',
    toggleScheduleOpen: 'View detailed payment schedule',
    toggleScheduleClose: 'Collapse schedule',
    colPeriod: 'Mo',
    colOpeningBalance: 'Opening Balance',
    colPrincipal: 'Principal',
    colInterest: 'Interest',
    colFee: 'Fee',
    colTotal: 'Total Pay',
    colClosingBalance: 'Closing Balance',
    formulaTitle: 'Financial Formula & Regulatory Notes',
    formulaIrrText: '• Financial Internal Rate of Return (IRR): Finds the discount rate r at which the Net Present Value (NPV) of all outflows matches net proceeds at t0.',
    formulaEarText: '• Effective Annual Rate (EAR): EAR = (1 + r)^12 - 1. Accurately reveals compound borrowing cost.',
    legalNoteText: '• State Bank of Vietnam Circular 43/2016/TT-NHNN & Circular 18/2019/TT-NHNN mandate that finance companies disclose effective reducing-balance rates and provide repayment schedules prior to contract signing.',
  },
  ja: {
    appBadge: 'VIETNAM CONSUMER CREDIT & LOAN APR',
    legalBadge: 'ベトナム国家銀行通達 43/2016/TT-NHNN & 18/2019/TT-NHNN 準拠',
    title: 'ベトナム融資・実質年率計算 (APR & EAR)',
    subtitle: 'キャッシュフローIRR（内部収益率）により、ローン保険や手数料を含めた「本当の実質借入金利」を正確に算出。元利均等と元金均等、表面金利（フラットレート）の罠を可視化します。',
    privacyNote: '100% ブラウザ完結処理 — 借入金額、返済額、金利データは端末外へ送信されません。',
    modeCashFlow: '実キャッシュフローから算出',
    modeRate: '契約金利から試算',
    presetLabel: '参考プリセット:',
    presetA1: '📱 手数料あり0%金利 (1200万 - 12ヶ月)',
    presetA2: '💳 消費者ローン (5000万 - 24ヶ月)',
    presetA3: '⚡ アプリ即時融資 (2000万 - 12ヶ月)',
    presetB1: '🏠 住宅ローン (5億 - 60ヶ月 - 10.5%)',
    presetB2: '⚠️ フラットレートの罠 (1億 - 12ヶ月 - 12%)',
    presetB3: '💼 個人信用融資 (5000万 - 24ヶ月 - 18%)',
    principalLabel: '契約上の借入元金 (VND)',
    placeholderPrincipal: '100,000,000',
    termLabel: '返済期間 (ヶ月)',
    placeholderTerm: '12',
    monthlyPaymentLabel: '毎月の返済額 (元金＋利息)',
    placeholderMonthlyPayment: '9,333,333',
    annualRateLabel: '契約表示年利 (%/年)',
    placeholderRate: '12.0',
    methodLabel: '返済方式・利息計算方法',
    methodAmortized: '元利均等返済 (残高スライド - PMT)',
    methodFixedPrincipal: '元金均等返済 (元金固定・利息逓減)',
    methodFlat: '元本固定金利 (フラットレート - 表面金利) ⚠️',
    upfrontFeeLabel: '先引き手数料総額 (ローン保険・審査手数料等)',
    placeholderUpfrontFee: '0',
    monthlyFeeLabel: '毎月の定期手数料 (口座管理費等)',
    placeholderMonthlyFee: '0',
    metricEarTitle: '実質実効年率 (EAR)',
    metricEarSub: '複利を考慮した真の年間借入負担率',
    metricAprTitle: '名目実質年率 (APR)',
    metricAprSub: '残高スライド方式換算の実質金利',
    metricPaymentTitle: '毎月の支払額',
    metricPaymentSub: '定期手数料を含む',
    metricNetTitle: '実質受取額 (手取り融資金)',
    metricNetSub: '契約元金から先引き手数料を控除',
    metricTotalCostTitle: '真の総借入コスト',
    metricTotalCostSub: '総支払額から実質受取額を引いた純負担',
    firstMonthPayment: '初回:',
    lastMonthPayment: '最終回:',
    warningFlatRateTitle: 'フラットレート（表面金利）の罠:',
    warningFlatRateBody: '契約書に記載の「年利 {contractRate}%（元本固定）」は、元金が減るにもかかわらず当初借入全額に対して利息が発生し続けます。残高スライド方式に換算した【名目APR】は {nominalApr}%/年、実効年率【EAR】は {ear}%/年 となり、表示の2倍近くに跳ね上がります！',
    breakdownTitle: '借入コスト・手数料構成明細',
    colItem: '項目',
    colAmount: '金額 (VND)',
    colNote: '内容 / 備考',
    rowContractPrincipal: '1. 契約借入元金 (申込額)',
    rowUpfrontFees: '2. 先引き手数料 (ローン保険・審査費等)',
    rowNetProceeds: '3. 実際の受取額 (手取金 1 - 2)',
    rowScheduledInterest: '4. 支払利息総額',
    rowPeriodicFees: '5. 期間中の定期手数料総額',
    rowTotalRepayment: '6. 総支払額 (元金 + 利息 + 手数料)',
    rowTotalBorrowingCost: '7. 実質総借入費用 (純負担 6 - 3)',
    scheduleTitle: '返済予定表・償還スケジュール ({count}ヶ月)',
    toggleScheduleOpen: '返済予定表を表示',
    toggleScheduleClose: '返済予定表を閉じる',
    colPeriod: '回',
    colOpeningBalance: '期首残高',
    colPrincipal: '元金返済',
    colInterest: '利息支払',
    colFee: '手数料',
    colTotal: '支払合計',
    colClosingBalance: '期末残高',
    formulaTitle: '数理アルゴリズムと法的基準',
    formulaIrrText: '• 内部収益率（IRR）アルゴリズム: 将来の返済キャッシュフローの現在価値（NPV）が、実行時の実質受取額と等しくなる割引率 r をニュートン・ラフソン法で算出。',
    formulaEarText: '• 実効年率（EAR）: EAR = (1 + r)^12 - 1。借入の真の複利負担コストを明確化。',
    legalNoteText: '• ベトナム国家銀行通達 43/2016/TT-NHNN および 18/2019/TT-NHNN では、消費者金融業者および金融機関に対し、残高スライド基準の実質金利の明示と返済予定表の交付が義務付けられています。',
  }
};

export default function LoanAprCalculatorVNView({ displayLang = 'vi' }) {
  const t = I18N[displayLang] || I18N.vi;

  // Tabs: 'cashflow' (Mode A) | 'rate' (Mode B)
  const [calcMode, setCalcMode] = useState('cashflow');

  // Mode A Inputs
  const [modeAPrincipal, setModeAPrincipal] = useState(100_000_000);
  const [modeAPrincipalDisplay, setModeAPrincipalDisplay] = useState('100,000,000');
  const [modeATerm, setModeATerm] = useState(12);
  const [modeAPayment, setModeAPayment] = useState(9_333_333);
  const [modeAPaymentDisplay, setModeAPaymentDisplay] = useState('9,333,333');
  const [modeAUpfrontFee, setModeAUpfrontFee] = useState(0);
  const [modeAUpfrontFeeDisplay, setModeAUpfrontFeeDisplay] = useState('0');
  const [modeAMonthlyFee, setModeAMonthlyFee] = useState(0);
  const [modeAMonthlyFeeDisplay, setModeAMonthlyFeeDisplay] = useState('0');

  // Mode B Inputs
  const [modeBPrincipal, setModeBPrincipal] = useState(100_000_000);
  const [modeBPrincipalDisplay, setModeBPrincipalDisplay] = useState('100,000,000');
  const [modeBTerm, setModeBTerm] = useState(12);
  const [modeBRate, setModeBRate] = useState(12.0);
  const [modeBMethod, setModeBMethod] = useState('flat_rate'); // Defaults to flat_rate to highlight the trap
  const [modeBUpfrontFee, setModeBUpfrontFee] = useState(0);
  const [modeBUpfrontFeeDisplay, setModeBUpfrontFeeDisplay] = useState('0');
  const [modeBMonthlyFee, setModeBMonthlyFee] = useState(0);
  const [modeBMonthlyFeeDisplay, setModeBMonthlyFeeDisplay] = useState('0');

  // UI State: Toggle schedule
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);

  // Formatting helpers
  const handleNumericInput = (rawVal, setter, displaySetter) => {
    const clean = rawVal.replace(/\D/g, '');
    const num = clean === '' ? 0 : parseInt(clean, 10);
    setter(num);
    displaySetter(clean === '' ? '' : num.toLocaleString('vi-VN'));
  };

  // Preset Handlers
  const applyPresetA = (p, term, monthlyPay, upfront, recurring) => {
    setModeAPrincipal(p);
    setModeAPrincipalDisplay(p.toLocaleString('vi-VN'));
    setModeATerm(term);
    setModeAPayment(monthlyPay);
    setModeAPaymentDisplay(monthlyPay.toLocaleString('vi-VN'));
    setModeAUpfrontFee(upfront);
    setModeAUpfrontFeeDisplay(upfront.toLocaleString('vi-VN'));
    setModeAMonthlyFee(recurring);
    setModeAMonthlyFeeDisplay(recurring.toLocaleString('vi-VN'));
  };

  const applyPresetB = (p, term, rate, method, upfront, recurring) => {
    setModeBPrincipal(p);
    setModeBPrincipalDisplay(p.toLocaleString('vi-VN'));
    setModeBTerm(term);
    setModeBRate(rate);
    setModeBMethod(method);
    setModeBUpfrontFee(upfront);
    setModeBUpfrontFeeDisplay(upfront.toLocaleString('vi-VN'));
    setModeBMonthlyFee(recurring);
    setModeBMonthlyFeeDisplay(recurring.toLocaleString('vi-VN'));
  };

  // Calculations
  const resultA = useMemo(() => {
    return calculateLoanAPRFromCashFlow({
      contractPrincipal: modeAPrincipal,
      termMonths: modeATerm,
      monthlyInstallment: modeAPayment,
      upfrontFees: modeAUpfrontFee,
      inTermMonthlyFee: modeAMonthlyFee,
    });
  }, [modeAPrincipal, modeATerm, modeAPayment, modeAUpfrontFee, modeAMonthlyFee]);

  const resultB = useMemo(() => {
    return calculateLoanPaymentAndSchedule({
      principal: modeBPrincipal,
      annualInterestRatePercent: modeBRate,
      termMonths: modeBTerm,
      method: modeBMethod,
      upfrontFee: modeBUpfrontFee,
      monthlyFee: modeBMonthlyFee,
    });
  }, [modeBPrincipal, modeBRate, modeBTerm, modeBMethod, modeBUpfrontFee, modeBMonthlyFee]);

  const activeResult = calcMode === 'cashflow' ? resultA : resultB;

  return (
    <div className="w-full space-y-6 text-on-surface">
      {/* 1. Header Banner Card */}
      <div className="relative overflow-hidden rounded-3xl bg-surface border border-border-subtle p-5 sm:p-7 shadow-xs">
        <div
          aria-hidden="true"
          className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-primary/10 blur-3xl pointer-events-none"
        />

        <div className="relative z-10 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
              <Percent size={14} />
              {t.appBadge}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-surface-container text-outline border border-border-subtle">
              {t.legalBadge}
            </span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-on-surface">
                {t.title}
              </h1>
              <p className="mt-1 text-sm sm:text-base text-outline max-w-3xl leading-relaxed">
                {t.subtitle}
              </p>
            </div>

            {/* Mode Switcher */}
            <div className="inline-flex rounded-xl bg-surface-container p-1 border border-border-subtle self-start md:self-center shrink-0">
              <button
                type="button"
                onClick={() => setCalcMode('cashflow')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  calcMode === 'cashflow'
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'text-outline hover:text-on-surface'
                }`}
              >
                {t.modeCashFlow}
              </button>
              <button
                type="button"
                onClick={() => setCalcMode('rate')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  calcMode === 'rate'
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'text-outline hover:text-on-surface'
                }`}
              >
                {t.modeRate}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 text-xs text-outline border-t border-border-subtle/60">
            <ShieldCheck size={16} className="text-emerald-500 shrink-0" />
            <span>{t.privacyNote}</span>
          </div>
        </div>
      </div>

      {/* 2. Main Parameters Card */}
      <div className="bg-surface rounded-3xl border border-border-subtle p-5 sm:p-7 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-subtle pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Sliders size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-on-surface">
                {calcMode === 'cashflow' ? 'Thông Số Dòng Tiền Vay Trả Góp' : 'Thông Số Lãi Suất & Hợp Đồng Vay'}
              </h2>
              <p className="text-xs text-outline">
                {calcMode === 'cashflow'
                  ? 'Nhập số tiền vay, kỳ hạn và số tiền trả thực tế mỗi tháng'
                  : 'Nhập số tiền vay, thời hạn, lãi suất công bố và phương thức tính'}
              </p>
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-outline text-xs mr-1 hidden sm:inline">{t.presetLabel}</span>
            {calcMode === 'cashflow' ? (
              <>
                <button
                  type="button"
                  onClick={() => applyPresetA(12_000_000, 12, 1_000_000, 1_200_000, 0)}
                  className="px-2.5 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high border border-border-subtle text-on-surface text-xs transition-colors cursor-pointer"
                >
                  {t.presetA1}
                </button>
                <button
                  type="button"
                  onClick={() => applyPresetA(50_000_000, 24, 2_800_000, 1_500_000, 0)}
                  className="px-2.5 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high border border-border-subtle text-on-surface text-xs transition-colors cursor-pointer"
                >
                  {t.presetA2}
                </button>
                <button
                  type="button"
                  onClick={() => applyPresetA(20_000_000, 12, 2_100_000, 0, 50_000)}
                  className="px-2.5 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high border border-border-subtle text-on-surface text-xs transition-colors cursor-pointer"
                >
                  {t.presetA3}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => applyPresetB(100_000_000, 12, 12.0, 'flat_rate', 0, 0)}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-semibold transition-colors cursor-pointer"
                >
                  {t.presetB2}
                </button>
                <button
                  type="button"
                  onClick={() => applyPresetB(500_000_000, 60, 10.5, 'amortized', 2_000_000, 0)}
                  className="px-2.5 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high border border-border-subtle text-on-surface text-xs transition-colors cursor-pointer"
                >
                  {t.presetB1}
                </button>
                <button
                  type="button"
                  onClick={() => applyPresetB(50_000_000, 24, 18.0, 'fixed_principal', 0, 0)}
                  className="px-2.5 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high border border-border-subtle text-on-surface text-xs transition-colors cursor-pointer"
                >
                  {t.presetB3}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Input Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {calcMode === 'cashflow' ? (
            <>
              {/* Principal */}
              <div className="md:col-span-4 space-y-1.5">
                <label className="text-xs font-semibold text-outline uppercase tracking-wider">
                  {t.principalLabel}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={modeAPrincipalDisplay}
                    onChange={(e) => handleNumericInput(e.target.value, setModeAPrincipal, setModeAPrincipalDisplay)}
                    placeholder={t.placeholderPrincipal}
                    className="w-full h-11 px-3.5 pr-10 rounded-xl bg-surface-container border border-border-subtle text-on-surface font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-outline">
                    ₫
                  </span>
                </div>
              </div>

              {/* Term */}
              <div className="md:col-span-4 space-y-1.5">
                <label className="text-xs font-semibold text-outline uppercase tracking-wider">
                  {t.termLabel}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="360"
                    value={modeATerm || ''}
                    onChange={(e) => setModeATerm(Math.max(1, parseInt(e.target.value, 10) || 0))}
                    placeholder={t.placeholderTerm}
                    className="w-full h-11 px-3.5 pr-14 rounded-xl bg-surface-container border border-border-subtle text-on-surface font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-outline">
                    tháng
                  </span>
                </div>
              </div>

              {/* Monthly Installment */}
              <div className="md:col-span-4 space-y-1.5">
                <label className="text-xs font-semibold text-outline uppercase tracking-wider">
                  {t.monthlyPaymentLabel}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={modeAPaymentDisplay}
                    onChange={(e) => handleNumericInput(e.target.value, setModeAPayment, setModeAPaymentDisplay)}
                    placeholder={t.placeholderMonthlyPayment}
                    className="w-full h-11 px-3.5 pr-10 rounded-xl bg-surface-container border border-border-subtle text-on-surface font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-outline">
                    ₫
                  </span>
                </div>
              </div>

              {/* Upfront Fees */}
              <div className="md:col-span-6 space-y-1.5">
                <label className="text-xs font-semibold text-outline uppercase tracking-wider">
                  {t.upfrontFeeLabel}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={modeAUpfrontFeeDisplay}
                    onChange={(e) => handleNumericInput(e.target.value, setModeAUpfrontFee, setModeAUpfrontFeeDisplay)}
                    placeholder={t.placeholderUpfrontFee}
                    className="w-full h-11 px-3.5 pr-10 rounded-xl bg-surface-container border border-border-subtle text-on-surface font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-outline">
                    ₫
                  </span>
                </div>
              </div>

              {/* Recurring Monthly Fees */}
              <div className="md:col-span-6 space-y-1.5">
                <label className="text-xs font-semibold text-outline uppercase tracking-wider">
                  {t.monthlyFeeLabel}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={modeAMonthlyFeeDisplay}
                    onChange={(e) => handleNumericInput(e.target.value, setModeAMonthlyFee, setModeAMonthlyFeeDisplay)}
                    placeholder={t.placeholderMonthlyFee}
                    className="w-full h-11 px-3.5 pr-10 rounded-xl bg-surface-container border border-border-subtle text-on-surface font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-outline">
                    ₫/tháng
                  </span>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Principal */}
              <div className="md:col-span-4 space-y-1.5">
                <label className="text-xs font-semibold text-outline uppercase tracking-wider">
                  {t.principalLabel}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={modeBPrincipalDisplay}
                    onChange={(e) => handleNumericInput(e.target.value, setModeBPrincipal, setModeBPrincipalDisplay)}
                    placeholder={t.placeholderPrincipal}
                    className="w-full h-11 px-3.5 pr-10 rounded-xl bg-surface-container border border-border-subtle text-on-surface font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-outline">
                    ₫
                  </span>
                </div>
              </div>

              {/* Term */}
              <div className="md:col-span-4 space-y-1.5">
                <label className="text-xs font-semibold text-outline uppercase tracking-wider">
                  {t.termLabel}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="360"
                    value={modeBTerm || ''}
                    onChange={(e) => setModeBTerm(Math.max(1, parseInt(e.target.value, 10) || 0))}
                    placeholder={t.placeholderTerm}
                    className="w-full h-11 px-3.5 pr-14 rounded-xl bg-surface-container border border-border-subtle text-on-surface font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-outline">
                    tháng
                  </span>
                </div>
              </div>

              {/* Annual Interest Rate */}
              <div className="md:col-span-4 space-y-1.5">
                <label className="text-xs font-semibold text-outline uppercase tracking-wider">
                  {t.annualRateLabel}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={modeBRate}
                    onChange={(e) => setModeBRate(Math.max(0, parseFloat(e.target.value) || 0))}
                    placeholder={t.placeholderRate}
                    className="w-full h-11 px-3.5 pr-14 rounded-xl bg-surface-container border border-border-subtle text-on-surface font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-primary">
                    %/năm
                  </span>
                </div>
              </div>

              {/* Repayment Method */}
              <div className="md:col-span-6 space-y-1.5">
                <label className="text-xs font-semibold text-outline uppercase tracking-wider">
                  {t.methodLabel}
                </label>
                <select
                  value={modeBMethod}
                  onChange={(e) => setModeBMethod(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-surface-container border border-border-subtle text-on-surface font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm cursor-pointer"
                >
                  <option value="flat_rate">{t.methodFlat}</option>
                  <option value="amortized">{t.methodAmortized}</option>
                  <option value="fixed_principal">{t.methodFixedPrincipal}</option>
                </select>
              </div>

              {/* Upfront Fees */}
              <div className="md:col-span-3 space-y-1.5">
                <label className="text-xs font-semibold text-outline uppercase tracking-wider">
                  {t.upfrontFeeLabel}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={modeBUpfrontFeeDisplay}
                    onChange={(e) => handleNumericInput(e.target.value, setModeBUpfrontFee, setModeBUpfrontFeeDisplay)}
                    placeholder={t.placeholderUpfrontFee}
                    className="w-full h-11 px-3.5 pr-10 rounded-xl bg-surface-container border border-border-subtle text-on-surface font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-outline">
                    ₫
                  </span>
                </div>
              </div>

              {/* Recurring Monthly Fee */}
              <div className="md:col-span-3 space-y-1.5">
                <label className="text-xs font-semibold text-outline uppercase tracking-wider">
                  {t.monthlyFeeLabel}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={modeBMonthlyFeeDisplay}
                    onChange={(e) => handleNumericInput(e.target.value, setModeBMonthlyFee, setModeBMonthlyFeeDisplay)}
                    placeholder={t.placeholderMonthlyFee}
                    className="w-full h-11 px-3.5 pr-10 rounded-xl bg-surface-container border border-border-subtle text-on-surface font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-outline">
                    ₫/tháng
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Flat Rate Alert Warning Card */}
        {calcMode === 'rate' && modeBMethod === 'flat_rate' && modeBRate > 0 && (
          <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-4 sm:p-5 text-amber-900 dark:text-amber-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm sm:text-base text-amber-700 dark:text-amber-400">
              <AlertTriangle size={18} className="shrink-0 text-amber-600 dark:text-amber-400" />
              <span>{t.warningFlatRateTitle}</span>
            </div>
            <p className="text-xs sm:text-sm leading-relaxed text-amber-800 dark:text-amber-300">
              {t.warningFlatRateBody
                .replace('{contractRate}', modeBRate.toString())
                .replace('{nominalApr}', resultB.nominalAPR.toFixed(2))
                .replace('{ear}', resultB.effectiveAnnualRate.toFixed(2))}
            </p>
          </div>
        )}
      </div>

      {/* 3. 4-Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: HERO CARD (Effective Annual Rate - EAR) */}
        <div className="relative overflow-hidden rounded-3xl bg-primary text-on-primary p-5 sm:p-6 shadow-md flex flex-col justify-between">
          <div
            aria-hidden="true"
            className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none"
          />
          <div>
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-on-primary/80">
              <span>{t.metricEarTitle}</span>
              <Sparkles size={16} />
            </div>
            <div className="mt-3 text-3xl sm:text-4xl font-black tracking-tight">
              {activeResult.effectiveAnnualRate.toFixed(2)}%
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-white/20 text-xs text-on-primary/80 flex items-center justify-between">
            <span>{t.metricAprTitle}:</span>
            <span className="font-bold text-white text-sm">
              {activeResult.nominalAPR.toFixed(2)}%/năm
            </span>
          </div>
        </div>

        {/* Metric 2: Monthly Payment */}
        <div className="rounded-3xl bg-surface border border-border-subtle p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-outline uppercase tracking-wider">
              <span>{t.metricPaymentTitle}</span>
              <Calendar size={16} className="text-primary" />
            </div>
            <div className="mt-3 text-2xl sm:text-3xl font-extrabold text-on-surface">
              {(activeResult.firstPayment || activeResult.monthlyPayment || 0).toLocaleString('vi-VN')}
              <span className="text-sm font-semibold text-outline ml-1">₫</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-border-subtle text-xs text-outline">
            {calcMode === 'rate' && modeBMethod === 'fixed_principal' ? (
              <div className="flex justify-between">
                <span>{t.firstMonthPayment} {(resultB.firstPayment || 0).toLocaleString('vi-VN')} ₫</span>
                <span>{t.lastMonthPayment} {(resultB.lastPayment || 0).toLocaleString('vi-VN')} ₫</span>
              </div>
            ) : (
              <span>{t.metricPaymentSub}</span>
            )}
          </div>
        </div>

        {/* Metric 3: Net Proceeds */}
        <div className="rounded-3xl bg-surface border border-border-subtle p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-outline uppercase tracking-wider">
              <span>{t.metricNetTitle}</span>
              <Banknote size={16} className="text-emerald-500" />
            </div>
            <div className="mt-3 text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {(activeResult.netProceeds || 0).toLocaleString('vi-VN')}
              <span className="text-sm font-semibold text-outline ml-1">₫</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-border-subtle text-xs text-outline">
            <span>{t.metricNetSub}</span>
          </div>
        </div>

        {/* Metric 4: Total Borrowing Cost */}
        <div className="rounded-3xl bg-surface border border-border-subtle p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-outline uppercase tracking-wider">
              <span>{t.metricTotalCostTitle}</span>
              <Receipt size={16} className="text-amber-500" />
            </div>
            <div className="mt-3 text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400">
              {(activeResult.totalBorrowingCost || 0).toLocaleString('vi-VN')}
              <span className="text-sm font-semibold text-outline ml-1">₫</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-border-subtle text-xs text-outline">
            <span>{t.metricTotalCostSub}</span>
          </div>
        </div>
      </div>

      {/* 4. Cost Breakdown Table */}
      <div className="bg-surface rounded-3xl border border-border-subtle p-5 sm:p-7 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-border-subtle pb-3">
          <Receipt size={18} className="text-primary" />
          <h2 className="text-base font-bold text-on-surface">{t.breakdownTitle}</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-outline text-xs uppercase tracking-wider">
                <th className="py-2.5 px-3 font-semibold">{t.colItem}</th>
                <th className="py-2.5 px-3 font-semibold text-right">{t.colAmount}</th>
                <th className="py-2.5 px-3 font-semibold hidden md:table-cell">{t.colNote}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/60">
              <tr>
                <td className="py-2.5 px-3 font-medium text-on-surface">{t.rowContractPrincipal}</td>
                <td className="py-2.5 px-3 text-right font-semibold text-on-surface">
                  {(activeResult.contractPrincipal || 0).toLocaleString('vi-VN')} ₫
                </td>
                <td className="py-2.5 px-3 text-outline text-xs hidden md:table-cell">
                  Số tiền gốc ghi trên thỏa thuận tín dụng
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-medium text-on-surface">{t.rowUpfrontFees}</td>
                <td className="py-2.5 px-3 text-right font-semibold text-rose-500">
                  - {(activeResult.breakdown?.upfrontDeductedFees || 0).toLocaleString('vi-VN')} ₫
                </td>
                <td className="py-2.5 px-3 text-outline text-xs hidden md:table-cell">
                  Khấu trừ ngay trước khi giải ngân vào tài khoản
                </td>
              </tr>
              <tr className="bg-emerald-500/5 font-semibold">
                <td className="py-2.5 px-3 text-emerald-700 dark:text-emerald-300">{t.rowNetProceeds}</td>
                <td className="py-2.5 px-3 text-right text-emerald-700 dark:text-emerald-300 font-bold">
                  {(activeResult.netProceeds || 0).toLocaleString('vi-VN')} ₫
                </td>
                <td className="py-2.5 px-3 text-emerald-600 dark:text-emerald-400 text-xs hidden md:table-cell">
                  Số tiền thực tế cầm về sử dụng
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-medium text-on-surface">{t.rowScheduledInterest}</td>
                <td className="py-2.5 px-3 text-right font-semibold text-on-surface">
                  {(activeResult.breakdown?.interest || activeResult.totalInterest || 0).toLocaleString('vi-VN')} ₫
                </td>
                <td className="py-2.5 px-3 text-outline text-xs hidden md:table-cell">
                  Tiền lãi danh nghĩa tính trong toàn bộ kỳ hạn
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-medium text-on-surface">{t.rowPeriodicFees}</td>
                <td className="py-2.5 px-3 text-right font-semibold text-on-surface">
                  {(activeResult.breakdown?.recurringFees || 0).toLocaleString('vi-VN')} ₫
                </td>
                <td className="py-2.5 px-3 text-outline text-xs hidden md:table-cell">
                  Phí quản lý tài khoản, SMS, phụ phí định kỳ
                </td>
              </tr>
              <tr className="border-t border-border-subtle font-bold">
                <td className="py-3 px-3 text-on-surface">{t.rowTotalRepayment}</td>
                <td className="py-3 px-3 text-right text-on-surface font-extrabold text-base">
                  {(activeResult.totalRepayment || 0).toLocaleString('vi-VN')} ₫
                </td>
                <td className="py-3 px-3 text-outline text-xs hidden md:table-cell">
                  Tổng tiền người vay chi trả cho bên cho vay
                </td>
              </tr>
              <tr className="bg-amber-500/10 font-bold">
                <td className="py-3 px-3 text-amber-800 dark:text-amber-300">{t.rowTotalBorrowingCost}</td>
                <td className="py-3 px-3 text-right text-amber-800 dark:text-amber-300 font-black text-base">
                  {(activeResult.totalBorrowingCost || 0).toLocaleString('vi-VN')} ₫
                </td>
                <td className="py-3 px-3 text-amber-700 dark:text-amber-400 text-xs hidden md:table-cell">
                  Chi phí chênh lệch thực tế (Tổng trả - Thực nhận)
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Collapsible Schedule Table (Available in Mode B) */}
      {calcMode === 'rate' && resultB.schedule && resultB.schedule.length > 0 && (
        <div className="bg-surface rounded-3xl border border-border-subtle p-5 sm:p-7 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-border-subtle pb-3">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-primary" />
              <h2 className="text-base font-bold text-on-surface">
                {t.scheduleTitle.replace('{count}', resultB.schedule.length.toString())}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setIsScheduleOpen(!isScheduleOpen)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high border border-border-subtle text-xs font-semibold text-primary transition-all cursor-pointer"
            >
              <span>{isScheduleOpen ? t.toggleScheduleClose : t.toggleScheduleOpen}</span>
              {isScheduleOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>

          {isScheduleOpen && (
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-surface-container border-b border-border-subtle text-outline uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">{t.colPeriod}</th>
                    <th className="py-2.5 px-3 font-semibold text-right">{t.colOpeningBalance}</th>
                    <th className="py-2.5 px-3 font-semibold text-right">{t.colPrincipal}</th>
                    <th className="py-2.5 px-3 font-semibold text-right">{t.colInterest}</th>
                    <th className="py-2.5 px-3 font-semibold text-right">{t.colFee}</th>
                    <th className="py-2.5 px-3 font-semibold text-right">{t.colTotal}</th>
                    <th className="py-2.5 px-3 font-semibold text-right">{t.colClosingBalance}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle/60">
                  {resultB.schedule.map((row) => (
                    <tr key={row.period} className="hover:bg-surface-container/50 transition-colors">
                      <td className="py-2 px-3 font-bold text-primary">{row.period}</td>
                      <td className="py-2 px-3 text-right font-medium text-outline">
                        {row.openingBalance.toLocaleString('vi-VN')} ₫
                      </td>
                      <td className="py-2 px-3 text-right font-medium text-on-surface">
                        {row.principalPayment.toLocaleString('vi-VN')} ₫
                      </td>
                      <td className="py-2 px-3 text-right font-medium text-amber-600 dark:text-amber-400">
                        {row.interestPayment.toLocaleString('vi-VN')} ₫
                      </td>
                      <td className="py-2 px-3 text-right font-medium text-outline">
                        {row.feePayment.toLocaleString('vi-VN')} ₫
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-on-surface">
                        {row.totalPayment.toLocaleString('vi-VN')} ₫
                      </td>
                      <td className="py-2 px-3 text-right font-medium text-outline">
                        {row.closingBalance.toLocaleString('vi-VN')} ₫
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 6. Regulatory & Financial Disclosure */}
      <div className="bg-surface rounded-3xl border border-border-subtle p-5 sm:p-7 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-on-surface font-bold text-sm">
          <Info size={16} className="text-primary shrink-0" />
          <span>{t.formulaTitle}</span>
        </div>
        <div className="space-y-2 text-xs text-outline leading-relaxed">
          <p>{t.formulaIrrText}</p>
          <p>{t.formulaEarText}</p>
          <p className="pt-1 border-t border-border-subtle/60">{t.legalNoteText}</p>
        </div>
      </div>

      {/* 7. Regulatory Source Standard View */}
      <RegulatorySourceView
        source={{
          lawName: 'Thông tư 43/2016/TT-NHNN & Thông tư 18/2019/TT-NHNN',
          issuingAuthority: 'Ngân hàng Nhà nước Việt Nam (SBV)',
          effectiveDate: '2020-01-01',
          officialSourceUrl: 'https://sbv.gov.vn',
          description: 'Quy định về cho vay tiêu dùng của công ty tài chính, bắt buộc minh bạch thông tin hợp đồng, lãi suất tính theo niên kim dư nợ giảm dần và biểu phí đi kèm.',
        }}
        displayLang={displayLang}
      />
    </div>
  );
}
