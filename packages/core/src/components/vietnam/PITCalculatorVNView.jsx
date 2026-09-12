/**
 * @file packages/core/src/components/vietnam/PITCalculatorVNView.jsx
 * @description Giao diện tính Thuế Thu Nhập Cá Nhân chuẩn Luật số 109/2025/QH15 & NQ 110/2025/UBTVQH15.
 * Tuân thủ 100% nguyên tắc thiết kế Toolio: Semantic Design Tokens, 1240px container, Metric Cards Grid,
 * RegulatorySourceView chuẩn hóa và hỗ trợ đa ngữ (VI, EN, JA).
 */

import React, { useState, useMemo } from 'react';
import {
  FileText,
  Users,
  Info,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ShieldCheck,
  Percent,
  Receipt,
  CheckCircle2,
  AlertCircle,
  HelpCircle
} from 'lucide-react';

import RegulatorySourceView from '../regulatory/RegulatorySourceView.jsx';
import {
  calculateVietnamPIT,
  calculatePITFromTaxableIncome,
  getPITRules,
} from '../../vietnam/index.js';

const I18N = {
  vi: {
    appBadge: 'VIETNAM PIT SIMULATOR 2026',
    legalBadge: 'Luật số 109/2025/QH15 & NQ 110/2025',
    title: 'Tính Thuế Thu Nhập Cá Nhân (PIT 2026)',
    subtitle: 'Mô phỏng chính xác số thuế TNCN phải nộp theo biểu thuế lũy tiến 5 bậc mới và mức giảm trừ gia cảnh mới (Bản thân 15.5tr, NPT 6.2tr).',
    privacyNote: '100% Xử lý cục bộ trên trình duyệt — Dữ liệu thu nhập và thuế cá nhân được bảo mật tuyệt đối.',
    modeStandard: 'Từ Tổng thu nhập & Giảm trừ',
    modeDirect: 'Nhập trực tiếp Thu nhập tính thuế',
    grossLabel: 'Tổng thu nhập chịu thuế trong tháng (Gross)',
    taxableDirectLabel: 'Thu nhập tính thuế đã trừ các khoản giảm trừ (TNTT)',
    insuranceLabel: 'Bảo hiểm bắt buộc được trừ (BHXH, BHYT, BHTN)',
    insuranceEqualStd: '(= 10.5% lương)',
    dependentsLabel: 'Số người phụ thuộc (NPT)',
    otherDeductionsLabel: 'Các khoản giảm trừ khác (Đóng góp từ thiện, hưu trí tự nguyện...)',
    metricTotalTax: 'Thuế TNCN phải nộp',
    metricTaxableIncome: 'Thu nhập tính thuế (TNTT)',
    metricTotalDeductions: 'Tổng các khoản giảm trừ',
    metricEffectiveRate: 'Thuế suất thực tế',
    effectiveRateHint: 'Tỷ lệ thuế trên tổng thu nhập',
    bracketsSectionTitle: 'Bảng Kê Chi Tiết Phân Bổ Theo 5 Bậc Thuế Lũy Tiến',
    bracketCol: 'Bậc thuế',
    rangeCol: 'Mức thu nhập tính thuế / tháng',
    rateCol: 'Thuế suất',
    taxAmountCol: 'Tiền thuế trong bậc (VND)',
    activeTag: 'Đang áp dụng',
    summaryTitle: 'Tóm Tắt Bóc Tách Các Khoản Giảm Trừ',
    itemGross: 'Tổng thu nhập (Gross)',
    itemInsurance: 'Bảo hiểm bắt buộc đã khấu trừ',
    itemPersonalDec: 'Giảm trừ gia cảnh bản thân (NQ 110/2025)',
    itemDepDec: 'Giảm trừ người phụ thuộc',
    itemOtherDec: 'Giảm trừ đóng góp từ thiện / Quỹ hưu trí',
    itemTaxable: 'Thu nhập tính thuế cuối cùng (TNTT)',
    itemFinalTax: 'TỔNG THUẾ TNCN PHẢI NỘP',
    showFormula: 'Xem công thức tính chi tiết & Bóc tách lũy tiến',
    hideFormula: 'Thu gọn công thức',
    formulaTaxableTitle: 'Công thức thu nhập tính thuế:',
    formulaTaxableExpr: 'TNTT = max(0, Thu nhập chịu thuế - Các khoản giảm trừ (Bảo hiểm + Bản thân 15.5tr + NPT 6.2tr × số người + Khác))',
    formulaTaxTitle: 'Công thức tính thuế biểu 5 bậc:',
    applicablePeriodText: 'Quy chuẩn năm 2026 (Luật 109 & NQ 110)',
    eraText: 'Luật Thuế TNCN 2026',
    verifiedDateText: '2026-09-12',
  },
  en: {
    appBadge: 'VIETNAM PIT SIMULATOR 2026',
    legalBadge: 'Law 109/2025/QH15 & Res 110/2025',
    title: 'Vietnam PIT Calculator 2026',
    subtitle: 'Accurate simulation of personal income tax under amended 5-bracket progressive tax scale and updated deductions (15.5M personal, 6.2M dependent).',
    privacyNote: '100% Client-side execution — Your income and tax details never leave your browser.',
    modeStandard: 'From Gross Income & Deductions',
    modeDirect: 'Direct Taxable Income (PIT Base)',
    grossLabel: 'Total Monthly Taxable Income (Gross)',
    taxableDirectLabel: 'Direct Taxable Income (After all deductions)',
    insuranceLabel: 'Compulsory Insurance Deductions (10.5%)',
    insuranceEqualStd: '(= 10.5% standard)',
    dependentsLabel: 'Number of Dependents',
    otherDeductionsLabel: 'Other Allowable Deductions (Charity, Voluntary Pension...)',
    metricTotalTax: 'Payable Personal Income Tax',
    metricTaxableIncome: 'Taxable Income (PIT Base)',
    metricTotalDeductions: 'Total Deductions',
    metricEffectiveRate: 'Effective Tax Rate',
    effectiveRateHint: 'Tax / Gross income percentage',
    bracketsSectionTitle: '5 Progressive Tax Brackets Allocation Breakdown',
    bracketCol: 'Bracket',
    rangeCol: 'Monthly Taxable Income Range',
    rateCol: 'Statutory Rate',
    taxAmountCol: 'Tax in Bracket (VND)',
    activeTag: 'Active',
    summaryTitle: 'Deductions & Tax Calculation Summary',
    itemGross: 'Gross Income',
    itemInsurance: 'Compulsory Insurance Deductions',
    itemPersonalDec: 'Personal Family Deduction (Res 110/2025)',
    itemDepDec: 'Dependents Deductions',
    itemOtherDec: 'Other Allowable Deductions',
    itemTaxable: 'Final Taxable Income (PIT Base)',
    itemFinalTax: 'TOTAL PAYABLE PERSONAL INCOME TAX',
    showFormula: 'View step-by-step formulas & bracket logic',
    hideFormula: 'Collapse formula',
    formulaTaxableTitle: 'Taxable income formula:',
    formulaTaxableExpr: 'Taxable = max(0, Gross - Insurance - Personal (15.5M) - Dependents (6.2M × count) - Other)',
    formulaTaxTitle: 'Progressive tax formula across 5 brackets:',
    applicablePeriodText: 'Statutory Year 2026 (Law 109 & Res 110)',
    eraText: 'Vietnam Tax Law 2026',
    verifiedDateText: '2026-09-12',
  },
  ja: {
    appBadge: 'VIETNAM PIT SIMULATOR 2026',
    legalBadge: '改正所得税法第109号 & 決議110号準拠',
    title: 'ベトナム個人所得税試算（PIT 2026）',
    subtitle: '新5段階累進税率表および新控除枠（本人1550万・扶養620万ドン）に基づく精密所得税シミュレーション。',
    privacyNote: '100% ブラウザ内完結処理 — 所得・納税データはサーバーに一切送信されません。',
    modeStandard: '総所得・控除から算定（給与所得者）',
    modeDirect: '課税対象所得を直接入力（確定申告・経理）',
    grossLabel: '月間総所得額（額面給与）',
    taxableDirectLabel: '各種控除後の課税対象所得額 (Taxable Income)',
    insuranceLabel: '社会保険等控除額（BHXH/BHYT/BHTN）',
    insuranceEqualStd: '（= 10.5%基準額）',
    dependentsLabel: '扶養家族数（人）',
    otherDeductionsLabel: 'その他の適格控除（慈善寄付金・個人確定拠出年金等）',
    metricTotalTax: '個人所得税納税予定額',
    metricTaxableIncome: '課税対象所得額 (TNTT)',
    metricTotalDeductions: '所得控除合計額',
    metricEffectiveRate: '実効税率 (Effective Rate)',
    effectiveRateHint: '総所得に対する税負担割合',
    bracketsSectionTitle: '新5段階累進課税区分・税額配分明細表',
    bracketCol: '税率区分',
    rangeCol: '月間課税所得範囲',
    rateCol: '法定税率',
    taxAmountCol: '区分内税額 (VND)',
    activeTag: '適用中',
    summaryTitle: '所得控除・税額計算総括明細',
    itemGross: '総所得 (Gross)',
    itemInsurance: '社会保険料等控除',
    itemPersonalDec: '本人基礎控除（決議110号）',
    itemDepDec: '扶養親族控除',
    itemOtherDec: 'その他寄付金等控除',
    itemTaxable: '最終課税対象所得額',
    itemFinalTax: '個人所得税納付総額 (PIT)',
    showFormula: '詳細計算式および累進計算ステップを確認',
    hideFormula: '計算式を閉じる',
    formulaTaxableTitle: '課税所得算定式:',
    formulaTaxableExpr: '課税所得 = max(0, 総所得 - 社会保険料 - 本人控除 (1550万) - 扶養控除 (620万 × 人数) - その他)',
    formulaTaxTitle: '5段階累進税率算定式:',
    applicablePeriodText: '2026年法定基準（法律109号 & 決議110号）',
    eraText: 'ベトナム税法2026',
    verifiedDateText: '2026-09-12',
  },
};

export default function PITCalculatorVNView({ displayLang = 'vi' }) {
  const lang = ['vi', 'en', 'ja'].includes(displayLang) ? displayLang : 'vi';
  const t = I18N[lang];

  // Mode: 'standard' | 'direct'
  const [inputMode, setInputMode] = useState('standard');

  // Standard Mode Inputs
  const [grossInput, setGrossInput] = useState(50_000_000);
  const [grossDisplay, setGrossDisplay] = useState('50,000,000');
  const [insuranceInput, setInsuranceInput] = useState(3_150_000);
  const [insuranceDisplay, setInsuranceDisplay] = useState('3,150,000');
  const [dependents, setDependents] = useState(0);
  const [otherDeductionsInput, setOtherDeductionsInput] = useState(0);
  const [otherDeductionsDisplay, setOtherDeductionsDisplay] = useState('0');

  // Direct Mode Input
  const [directTaxableInput, setDirectTaxableInput] = useState(50_000_000);
  const [directTaxableDisplay, setDirectTaxableDisplay] = useState('50,000,000');

  const [date, setDate] = useState('2026-09-01');
  const [showFormula, setShowFormula] = useState(false);

  const formatVND = (num) => (Number(num) || 0).toLocaleString('vi-VN') + ' ₫';

  const handleGrossChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '');
    const val = raw ? parseInt(raw, 10) : 0;
    setGrossInput(val);
    setGrossDisplay(raw ? val.toLocaleString('vi-VN') : '');
  };

  const handleInsuranceChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '');
    const val = raw ? parseInt(raw, 10) : 0;
    setInsuranceInput(val);
    setInsuranceDisplay(raw ? val.toLocaleString('vi-VN') : '');
  };

  const handleOtherDeductionsChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '');
    const val = raw ? parseInt(raw, 10) : 0;
    setOtherDeductionsInput(val);
    setOtherDeductionsDisplay(raw ? val.toLocaleString('vi-VN') : '');
  };

  const handleDirectTaxableChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '');
    const val = raw ? parseInt(raw, 10) : 0;
    setDirectTaxableInput(val);
    setDirectTaxableDisplay(raw ? val.toLocaleString('vi-VN') : '');
  };

  const handlePresetSelect = (mil) => {
    const v = mil * 1_000_000;
    if (inputMode === 'standard') {
      setGrossInput(v);
      setGrossDisplay(v.toLocaleString('vi-VN'));
    } else {
      setDirectTaxableInput(v);
      setDirectTaxableDisplay(v.toLocaleString('vi-VN'));
    }
  };

  // Result Calculation
  const result = useMemo(() => {
    if (inputMode === 'standard') {
      return calculateVietnamPIT(
        grossInput,
        insuranceInput,
        dependents,
        otherDeductionsInput,
        date
      );
    } else {
      const direct = calculatePITFromTaxableIncome(directTaxableInput, date);
      return {
        grossIncome: directTaxableInput,
        insuranceDeductible: 0,
        personalDeduction: 0,
        dependentDeduction: 0,
        dependentsCount: 0,
        otherDeductions: 0,
        totalDeductions: 0,
        taxableIncome: directTaxableInput,
        totalTax: direct.totalTax,
        bracketsBreakdown: direct.bracketsBreakdown,
        effectiveRate: direct.effectiveRate,
        source: direct.source,
        metadata: direct.metadata,
        formula: {
          taxableIncome: `Nhập trực tiếp = ${directTaxableInput.toLocaleString('vi-VN')} VND`,
          totalTaxSummary: direct.bracketsBreakdown.filter(b => b.taxAmount > 0).map(b => b.formula).join(' + ') || '0 VND',
        }
      };
    }
  }, [inputMode, grossInput, insuranceInput, dependents, otherDeductionsInput, directTaxableInput, date]);

  return (
    <div className="w-full space-y-6 text-on-surface">
      {/* 1. Header Banner Card */}
      <div className="bg-surface border border-border-subtle rounded-3xl p-5 sm:p-7 shadow-xs relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-72 h-72 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary/15 text-primary border border-primary/30 font-mono">
                <Sparkles className="w-3.5 h-3.5" />
                {t.appBadge}
              </span>
              <span className="text-xs text-on-surface-variant font-mono">
                {t.legalBadge}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-on-surface">
              {t.title}
            </h1>
            <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed max-w-3xl">
              {t.subtitle}
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="inline-flex rounded-xl bg-surface-container p-1 border border-border-subtle self-start lg:self-center shrink-0">
            <button
              type="button"
              onClick={() => setInputMode('standard')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                inputMode === 'standard'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {t.modeStandard}
            </button>
            <button
              type="button"
              onClick={() => setInputMode('direct')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                inputMode === 'direct'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {t.modeDirect}
            </button>
          </div>
        </div>

        {/* Privacy Note */}
        <div className="mt-5 pt-4 border-t border-border-subtle flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-400 font-medium">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>{t.privacyNote}</span>
        </div>
      </div>

      {/* 2. Main Parameters Form Section */}
      <section className="bg-surface-container rounded-2xl p-5 sm:p-6 border border-border-subtle shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-border-subtle pb-4">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-primary" />
            <h2 className="text-base sm:text-lg font-bold text-on-surface">
              {inputMode === 'standard' ? t.grossLabel : t.taxableDirectLabel}
            </h2>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[20, 35, 50, 80, 120].map((mil) => (
              <button
                key={mil}
                type="button"
                onClick={() => handlePresetSelect(mil)}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-surface hover:bg-surface-container-high border border-border-subtle text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
              >
                {mil}tr
              </button>
            ))}
          </div>
        </div>

        {inputMode === 'standard' ? (
          <div className="space-y-4">
            {/* Gross Salary Input */}
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                value={grossDisplay}
                onChange={handleGrossChange}
                className="w-full px-4 py-3 rounded-xl bg-surface border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary text-on-surface font-black text-xl sm:text-2xl transition-all pr-16"
                placeholder="50,000,000"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-on-surface-variant">
                VND
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              {/* Insurance Deductions Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-on-surface-variant block">
                  {t.insuranceLabel}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={insuranceDisplay}
                    onChange={handleInsuranceChange}
                    className="w-full px-3 py-2.5 rounded-xl bg-surface border border-border-subtle text-on-surface text-xs sm:text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary pr-12"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-on-surface-variant">
                    VND
                  </span>
                </div>
              </div>

              {/* Dependents Stepper */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-on-surface-variant block flex items-center gap-1.5">
                  <Users size={14} className="text-primary" />
                  {t.dependentsLabel}
                </label>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => setDependents(Math.max(0, dependents - 1))}
                    className="w-10 h-10 rounded-l-xl bg-surface border border-r-0 border-border-subtle hover:bg-surface-container-high flex items-center justify-center text-on-surface cursor-pointer text-base font-bold transition-colors"
                  >
                    -
                  </button>
                  <div className="flex-1 h-10 bg-surface border-y border-border-subtle flex items-center justify-center text-sm font-bold text-on-surface">
                    {dependents}
                  </div>
                  <button
                    type="button"
                    onClick={() => setDependents(dependents + 1)}
                    className="w-10 h-10 rounded-r-xl bg-surface border border-l-0 border-border-subtle hover:bg-surface-container-high flex items-center justify-center text-on-surface cursor-pointer text-base font-bold transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Other Deductions */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-on-surface-variant block">
                  {t.otherDeductionsLabel}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={otherDeductionsDisplay}
                    onChange={handleOtherDeductionsChange}
                    className="w-full px-3 py-2.5 rounded-xl bg-surface border border-border-subtle text-on-surface text-xs sm:text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary pr-12"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-on-surface-variant">
                    VND
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                value={directTaxableDisplay}
                onChange={handleDirectTaxableChange}
                className="w-full px-4 py-3 rounded-xl bg-surface border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary text-on-surface font-black text-xl sm:text-2xl transition-all pr-16"
                placeholder="50,000,000"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-on-surface-variant">
                VND
              </span>
            </div>
          </div>
        )}
      </section>

      {/* 3. Results Section: Toolio Standard 4 Metric Cards Grid */}
      <section className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Hero KPI — Thuế TNCN phải nộp */}
          <div className="p-5 rounded-2xl bg-surface border-2 border-primary/40 shadow-xs flex flex-col justify-between">
            <span className="text-xs font-bold text-primary uppercase tracking-wider block mb-1">
              {t.metricTotalTax}
            </span>
            <div>
              <div className="text-2xl lg:text-3xl font-black text-primary tracking-tight">
                {formatVND(result.totalTax)}
              </div>
              <span className="text-xs text-on-surface-variant mt-1 block">
                {result.totalTax === 0 ? 'Miễn thuế / Chưa tới mức chịu thuế' : 'Biểu lũy tiến 5 bậc 2026'}
              </span>
            </div>
          </div>

          {/* Card 2: Thu Nhập Tính Thuế */}
          <div className="p-5 rounded-2xl bg-surface border border-border-subtle shadow-xs flex flex-col justify-between">
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
              {t.metricTaxableIncome}
            </span>
            <div>
              <div className="text-2xl lg:text-3xl font-black text-on-surface tracking-tight">
                {formatVND(result.taxableIncome)}
              </div>
              <span className="text-xs text-on-surface-variant mt-1 block">
                Căn cứ tính thuế lũy tiến
              </span>
            </div>
          </div>

          {/* Card 3: Tổng Giảm Trừ */}
          <div className="p-5 rounded-2xl bg-surface border border-border-subtle shadow-xs flex flex-col justify-between">
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
              {t.metricTotalDeductions}
            </span>
            <div>
              <div className="text-2xl lg:text-3xl font-black text-emerald-700 dark:text-emerald-400 tracking-tight">
                {formatVND(result.totalDeductions)}
              </div>
              <span className="text-xs text-on-surface-variant mt-1 block">
                {inputMode === 'standard' ? `Bản thân 15.5M + NPT: ${formatVND(result.dependentDeduction)}` : 'Đã khấu trừ trực tiếp'}
              </span>
            </div>
          </div>

          {/* Card 4: Thuế Suất Thực Tế */}
          <div className="p-5 rounded-2xl bg-surface border border-border-subtle shadow-xs flex flex-col justify-between">
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
              {t.metricEffectiveRate}
            </span>
            <div>
              <div className="text-2xl lg:text-3xl font-black text-on-surface tracking-tight">
                {result.effectiveRate}%
              </div>
              <span className="text-xs text-on-surface-variant mt-1 block">
                {t.effectiveRateHint}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Detailed 5-Brackets Allocation Table */}
      <section className="bg-surface-container rounded-2xl p-5 sm:p-6 border border-border-subtle shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-border-subtle pb-3">
          <Receipt className="w-5 h-5 text-primary" />
          <h3 className="text-base font-bold text-on-surface">
            {t.bracketsSectionTitle}
          </h3>
        </div>

        <div className="rounded-xl bg-surface border border-border-subtle overflow-x-auto">
          <table className="w-full text-xs sm:text-sm text-left border-collapse">
            <thead>
              <tr className="border-b border-border-subtle bg-surface-container-low text-on-surface-variant">
                <th className="py-3 px-4 font-bold">{t.bracketCol}</th>
                <th className="py-3 px-4 font-bold">{t.rangeCol}</th>
                <th className="py-3 px-4 font-bold text-center">{t.rateCol}</th>
                <th className="py-3 px-4 font-bold text-right">{t.taxAmountCol}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/50">
              {result.bracketsBreakdown.map((b) => {
                const isActive = b.taxableInBracket > 0;
                return (
                  <tr
                    key={b.bracket}
                    className={`transition-colors ${
                      isActive ? 'bg-primary/5 font-semibold text-on-surface' : 'text-on-surface-variant bg-surface'
                    }`}
                  >
                    <td className="py-3 px-4 font-bold">
                      <div className="flex items-center gap-2">
                        <span>Bậc {b.bracket}</span>
                        {isActive && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/20 text-primary">
                            {t.activeTag}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-on-surface-variant font-medium">
                      {b.rangeLabel}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-primary">
                      {b.rate}%
                    </td>
                    <td className="py-3 px-4 text-right font-black">
                      {formatVND(b.taxAmount)}
                    </td>
                  </tr>
                );
              })}
              <tr className="font-black text-on-surface bg-primary/10 text-sm sm:text-base border-t-2 border-primary/30">
                <td colSpan={3} className="py-3.5 px-4 text-primary">
                  {t.itemFinalTax}
                </td>
                <td className="py-3.5 px-4 text-right text-primary font-black">
                  {formatVND(result.totalTax)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 5. Collapsible: Calculation Formulas / Xem cách tính chi tiết */}
      <div className="rounded-2xl border border-border-subtle overflow-hidden bg-surface-container">
        <button
          type="button"
          onClick={() => setShowFormula(!showFormula)}
          className="w-full px-5 py-3.5 flex items-center justify-between text-xs sm:text-sm font-bold text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Sparkles size={16} className="text-primary" />
            {showFormula ? t.hideFormula : t.showFormula}
          </span>
          {showFormula ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {showFormula && (
          <div className="p-5 border-t border-border-subtle bg-surface text-xs font-mono space-y-3 text-on-surface-variant">
            <div>
              <span className="font-bold text-on-surface block mb-0.5">{t.formulaTaxableTitle}</span>
              <p className="p-2.5 rounded-lg bg-surface-container text-on-surface font-semibold">
                {t.formulaTaxableExpr}
              </p>
            </div>
            <div>
              <span className="font-bold text-on-surface block mb-0.5">{t.formulaTaxTitle}</span>
              <p className="p-2.5 rounded-lg bg-surface-container text-on-surface font-semibold">
                {result.bracketsBreakdown.filter(b => b.taxAmount > 0).map(b => b.formula).join(' + ') || '0 VND'} = {result.totalTax.toLocaleString('vi-VN')} VND
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 6. Standard Toolio Regulatory Basis View */}
      <RegulatorySourceView
        sourceIds={['vn-law-109-2025', 'vn-res-110-2025']}
        applicablePeriodText={t.applicablePeriodText}
        era={t.eraText}
        lastVerified={t.verifiedDateText}
        lang={lang}
      />
    </div>
  );
}
