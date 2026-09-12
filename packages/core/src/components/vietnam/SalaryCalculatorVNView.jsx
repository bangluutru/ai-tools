/**
 * @file packages/core/src/components/vietnam/SalaryCalculatorVNView.jsx
 * @description Giao diện tính lương Gross ↔ Net chuẩn Luật Thuế TNCN 2026 & Luật BHXH 2024.
 * Tuân thủ 100% nguyên tắc thiết kế Toolio: Semantic Design Tokens, 1240px container, Metric Cards Grid,
 * RegulatorySourceView chuẩn hóa và hỗ trợ đa ngữ (VI, EN, JA).
 */

import React, { useState, useMemo } from 'react';
import {
  Calculator,
  ShieldCheck,
  Building2,
  Users,
  Info,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Receipt,
  FileText,
  Percent,
} from 'lucide-react';

import RegulatorySourceView from '../regulatory/RegulatorySourceView.jsx';
import {
  calculateGrossToNet,
  calculateNetToGross,
} from '../../vietnam/index.js';

const I18N = {
  vi: {
    appBadge: 'VIETNAM SALARY CALCULATOR 2026',
    legalBadge: 'NQ 110/2025 & Luật 109/2025/QH15',
    title: 'Tính Lương Gross ↔ Net',
    subtitle: 'Chuyển đổi hai chiều Gross ↔ Net theo biểu thuế TNCN 5 bậc mới (NQ 110/2025), trần BHXH 2026 và chi phí người sử dụng lao động.',
    privacyNote: '100% Xử lý cục bộ trên trình duyệt — Dữ liệu tài chính cá nhân được bảo mật tuyệt đối, không gửi lên máy chủ.',
    modeGrossToNet: 'Gross → Net',
    modeNetToGross: 'Net → Gross',
    salaryInputLabelGross: 'Mức lương Gross (Tổng thu nhập)',
    salaryInputLabelNet: 'Mức lương Net mong muốn',
    placeholderSalary: 'Nhập số tiền...',
    customInsuranceOption: 'Đóng bảo hiểm trên mức lương khác',
    customInsuranceEqualGross: '(= Lương Gross)',
    customInsurancePlaceholder: 'Mức lương căn cứ đóng BH...',
    regionLabel: 'Vùng lương tối thiểu (áp dụng trần BHTN)',
    region1: 'Vùng I (Hà Nội, TP.HCM...)',
    region2: 'Vùng II (Đô thị loại II...)',
    region3: 'Vùng III (Huyện, thị xã...)',
    region4: 'Vùng IV (Các vùng còn lại)',
    dependentsLabel: 'Người phụ thuộc (NPT)',
    monthYearLabel: 'Thời điểm áp dụng (Tháng/Năm)',
    monthYearHint: 'Tự động áp dụng mức trần lương cơ sở theo thời điểm (trước hoặc từ 01/07/2026)',
    metricNetSalary: 'Lương thực nhận (Net)',
    metricGrossSalary: 'Lương Gross quy đổi',
    metricTargetNet: 'Net mục tiêu',
    metricInsurance: 'Bảo hiểm NLĐ (10.5%)',
    metricPIT: 'Thuế TNCN (PIT 2026)',
    metricEmployerCost: 'Chi phí Doanh nghiệp (Tổng)',
    employerCostHint: 'Gross + 21.5% BH doanh nghiệp',
    breakdownTitle: 'Bảng Kê Chi Tiết Bóc Tách Tiền Lương & Thuế',
    itemCol: 'Khoản mục',
    basisCol: 'Tỷ lệ / Căn cứ',
    amountCol: 'Số tiền (VND)',
    itemGross: '1. Lương Gross',
    itemBhxh: '— BHXH (Hưu trí, tử tuất)',
    itemBhyt: '— BHYT (Y tế)',
    itemBhtn: '— BHTN (Thất nghiệp)',
    itemPreTax: '2. Thu nhập trước giảm trừ gia cảnh',
    itemPersonalDec: '— Giảm trừ bản thân',
    itemDepDec: '— Giảm trừ người phụ thuộc',
    itemTaxableIncome: '3. Thu nhập tính thuế (Taxable Income)',
    itemPIT: '4. Thuế thu nhập cá nhân (PIT)',
    itemNet: '5. LƯƠNG THỰC NHẬN (NET)',
    cappedTag: '(Chạm trần)',
    showFormula: 'Xem cách tính chi tiết & Công thức',
    hideFormula: 'Thu gọn công thức',
    formulaNetTitle: 'Công thức tính Net:',
    formulaNetExpr: 'Net = Gross - (BHXH + BHYT + BHTN) - PIT',
    formulaTaxableTitle: 'Công thức thu nhập tính thuế:',
    formulaTaxableExpr: 'TNTT = max(0, Gross - BH bắt buộc - Giảm trừ bản thân (15.5M) - Giảm trừ NPT (6.2M × NPT))',
    formulaPITTitle: 'Biểu lũy tiến từng phần 5 bậc (NQ 110/2025):',
    applicablePeriodText: 'Quy chuẩn năm 2026 (NQ 110 & Luật 109)',
    eraText: 'Luật Việt Nam 2026',
    verifiedDateText: '2026-09-12',
  },
  en: {
    appBadge: 'VIETNAM SALARY CALCULATOR 2026',
    legalBadge: 'Res 110/2025 & Law 109/2025/QH15',
    title: 'Vietnam Salary Calculator (Gross ↔ Net)',
    subtitle: 'Two-way Gross ↔ Net conversion under 2026 statutory 5-bracket PIT, compulsory insurance ceilings, and total employer cost.',
    privacyNote: '100% Client-side execution — Your compensation data never leaves your browser.',
    modeGrossToNet: 'Gross → Net',
    modeNetToGross: 'Net → Gross',
    salaryInputLabelGross: 'Gross Salary (Total Compensation)',
    salaryInputLabelNet: 'Target Net Salary (Take-home)',
    placeholderSalary: 'Enter amount...',
    customInsuranceOption: 'Pay insurance on custom salary base',
    customInsuranceEqualGross: '(= Gross Salary)',
    customInsurancePlaceholder: 'Custom insurance base salary...',
    regionLabel: 'Minimum Wage Region (UI Ceiling)',
    region1: 'Region I (Hanoi, HCMC...)',
    region2: 'Region II (Tier-2 Municipalities...)',
    region3: 'Region III (Districts, Townships...)',
    region4: 'Region IV (Remaining Areas)',
    dependentsLabel: 'Dependents',
    monthYearLabel: 'Effective Month/Year',
    monthYearHint: 'Auto-applies base salary shifts before or after 01/07/2026',
    metricNetSalary: 'Net Take-Home Pay',
    metricGrossSalary: 'Converted Gross Salary',
    metricTargetNet: 'Target Net Pay',
    metricInsurance: 'Employee Insurance (10.5%)',
    metricPIT: 'Personal Income Tax (2026)',
    metricEmployerCost: 'Total Employer Cost',
    employerCostHint: 'Gross + 21.5% Employer Insurance',
    breakdownTitle: 'Detailed Payroll & Tax Deductions Breakdown',
    itemCol: 'Item',
    basisCol: 'Rate / Legal Basis',
    amountCol: 'Amount (VND)',
    itemGross: '1. Gross Salary',
    itemBhxh: '— Social Insurance (Retirement)',
    itemBhyt: '— Health Insurance',
    itemBhtn: '— Unemployment Insurance',
    itemPreTax: '2. Income Before Family Deductions',
    itemPersonalDec: '— Personal Deduction',
    itemDepDec: '— Dependents Deduction',
    itemTaxableIncome: '3. Taxable Income (PIT Base)',
    itemPIT: '4. Personal Income Tax (PIT)',
    itemNet: '5. NET TAKE-HOME SALARY',
    cappedTag: '(Capped)',
    showFormula: 'View calculation formulas & step-by-step logic',
    hideFormula: 'Collapse formula',
    formulaNetTitle: 'Net formula:',
    formulaNetExpr: 'Net = Gross - Compulsory Insurance - PIT',
    formulaTaxableTitle: 'Taxable income formula:',
    formulaTaxableExpr: 'Taxable = max(0, Gross - Insurance - Personal Deduction (15.5M) - Dependents (6.2M × count))',
    formulaPITTitle: '5-bracket progressive tax scale (Res 110/2025):',
    applicablePeriodText: 'Statutory Year 2026 (Res 110 & Law 109)',
    eraText: 'Vietnam Regulations 2026',
    verifiedDateText: '2026-09-12',
  },
  ja: {
    appBadge: 'VIETNAM SALARY CALCULATOR 2026',
    legalBadge: '決議110号 & 改正所得税法109号準拠',
    title: 'ベトナム給与計算（Gross ↔ Net）',
    subtitle: '2026年最新の新5段階累進個人所得税、社会保険上限改定、雇用主総負担額に対応したGross ↔ Net双方向試算。',
    privacyNote: '100% ブラウザ内完結処理 — 給与・個人情報はサーバーに一切送信されません。',
    modeGrossToNet: 'Gross → Net',
    modeNetToGross: 'Net → Gross',
    salaryInputLabelGross: '額面給与（Gross給与）',
    salaryInputLabelNet: '手取り希望額（Net給与）',
    placeholderSalary: '金額を入力...',
    customInsuranceOption: '異なる社会保険算定基準額を指定する',
    customInsuranceEqualGross: '（= 額面給与と同額）',
    customInsurancePlaceholder: '社会保険基礎給与額...',
    regionLabel: '最低賃金地域区分（雇用保険上限基準）',
    region1: '第I地域（ハノイ、ホーチミン等）',
    region2: '第II地域（地方主要都市等）',
    region3: '第III地域（郡部・町等）',
    region4: '第IV地域（その他地方等）',
    dependentsLabel: '扶養家族数（人）',
    monthYearLabel: '適用年月（支給時期）',
    monthYearHint: '2026年7月1日の基準給与改定前後に連動して自動判定します',
    metricNetSalary: '手取り給与（Net）',
    metricGrossSalary: '換算額面給与（Gross）',
    metricTargetNet: '目標手取り額',
    metricInsurance: '従業員社会保険料 (10.5%)',
    metricPIT: '個人所得税 (2026年新基準)',
    metricEmployerCost: '会社総負担額（法定福利費込み）',
    employerCostHint: '額面 + 会社負担保険料 (21.5%)',
    breakdownTitle: '給与・保険・税金控除内訳明細書',
    itemCol: '項目',
    basisCol: '料率・法的根拠',
    amountCol: '金額 (VND)',
    itemGross: '1. 額面給与 (Gross)',
    itemBhxh: '— 社会保険（年金・遺族）',
    itemBhyt: '— 医療保険',
    itemBhtn: '— 失業保険',
    itemPreTax: '2. 基礎控除前所得',
    itemPersonalDec: '— 本人基礎控除',
    itemDepDec: '— 扶養控除',
    itemTaxableIncome: '3. 課税対象所得 (Taxable Income)',
    itemPIT: '4. 個人所得税 (PIT)',
    itemNet: '5. 手取り給与額 (NET)',
    cappedTag: '(上限到達)',
    showFormula: '計算式および算出ロジックを確認',
    hideFormula: '計算式を閉じる',
    formulaNetTitle: '手取り計算式:',
    formulaNetExpr: 'Net = Gross - 強制保険料合計 - 個人所得税',
    formulaTaxableTitle: '課税所得計算式:',
    formulaTaxableExpr: '課税所得 = max(0, Gross - 保険料 - 本人控除 (1550万) - 扶養控除 (620万 × 人数))',
    formulaPITTitle: '新5段階累進税率表（決議110号）:',
    applicablePeriodText: '2026年最新基準（決議110号 & 法律109号）',
    eraText: 'ベトナム法規2026',
    verifiedDateText: '2026-09-12',
  },
};

export default function SalaryCalculatorVNView({ displayLang = 'vi' }) {
  const lang = ['vi', 'en', 'ja'].includes(displayLang) ? displayLang : 'vi';
  const t = I18N[lang];

  const [calcMode, setCalcMode] = useState('grossToNet'); // 'grossToNet' | 'netToGross'
  const [salaryInput, setSalaryInput] = useState(30_000_000);
  const [salaryDisplay, setSalaryDisplay] = useState('30,000,000');

  const [useCustomInsurance, setUseCustomInsurance] = useState(false);
  const [insuranceInput, setInsuranceInput] = useState(30_000_000);
  const [insuranceDisplay, setInsuranceDisplay] = useState('30,000,000');

  const [region, setRegion] = useState(1);
  const [dependents, setDependents] = useState(0);
  const [monthYear, setMonthYear] = useState('2026-09');
  const [showFormula, setShowFormula] = useState(false);

  // Format currency
  const formatVND = (num) => (Number(num) || 0).toLocaleString('vi-VN') + ' ₫';

  const handleSalaryChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '');
    const val = raw ? parseInt(raw, 10) : 0;
    setSalaryInput(val);
    setSalaryDisplay(raw ? val.toLocaleString('vi-VN') : '');
    if (!useCustomInsurance) {
      setInsuranceInput(val);
      setInsuranceDisplay(raw ? val.toLocaleString('vi-VN') : '');
    }
  };

  const handleInsuranceChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '');
    const val = raw ? parseInt(raw, 10) : 0;
    setInsuranceInput(val);
    setInsuranceDisplay(raw ? val.toLocaleString('vi-VN') : '');
  };

  const handlePresetSelect = (mil) => {
    const v = mil * 1_000_000;
    setSalaryInput(v);
    setSalaryDisplay(v.toLocaleString('vi-VN'));
    if (!useCustomInsurance) {
      setInsuranceInput(v);
      setInsuranceDisplay(v.toLocaleString('vi-VN'));
    }
  };

  // Calculation Result
  const result = useMemo(() => {
    const dateStr = monthYear ? `${monthYear}-01` : '2026-09-01';
    const insBase = useCustomInsurance ? insuranceInput : null;

    if (calcMode === 'grossToNet') {
      return calculateGrossToNet({
        grossSalary: salaryInput,
        insuranceSalary: insBase,
        region,
        dependents,
        date: dateStr,
      });
    } else {
      return calculateNetToGross({
        netSalary: salaryInput,
        insuranceSalary: insBase,
        region,
        dependents,
        date: dateStr,
      });
    }
  }, [calcMode, salaryInput, useCustomInsurance, insuranceInput, region, dependents, monthYear]);

  return (
    <div className="w-full space-y-6 text-on-surface">
      {/* 1. Header Banner Card (Standard Toolio Rounded-3xl with Ambient Glow & Privacy Shield) */}
      <div className="bg-surface border border-border-subtle rounded-3xl p-5 sm:p-7 shadow-xs relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 font-mono">
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

          {/* Gross ↔ Net Segmented Switcher */}
          <div className="inline-flex rounded-xl bg-surface-container p-1 border border-border-subtle self-start lg:self-center shrink-0">
            <button
              type="button"
              onClick={() => setCalcMode('grossToNet')}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                calcMode === 'grossToNet'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {t.modeGrossToNet}
            </button>
            <button
              type="button"
              onClick={() => setCalcMode('netToGross')}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                calcMode === 'netToGross'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {t.modeNetToGross}
            </button>
          </div>
        </div>

        {/* Privacy Note Footer */}
        <div className="mt-5 pt-4 border-t border-border-subtle flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-400 font-medium">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>{t.privacyNote}</span>
        </div>
      </div>

      {/* 2. Main Parameters Form Section */}
      <section className="bg-surface-container rounded-2xl p-5 sm:p-6 border border-border-subtle shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-border-subtle pb-4">
          <div className="flex items-center gap-2.5">
            <Calculator className="w-5 h-5 text-primary" />
            <h2 className="text-base sm:text-lg font-bold text-on-surface">
              {calcMode === 'grossToNet' ? t.salaryInputLabelGross : t.salaryInputLabelNet}
            </h2>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[15, 25, 30, 50].map((mil) => (
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

        <div className="space-y-4">
          {/* Main Salary Input */}
          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              value={salaryDisplay}
              onChange={handleSalaryChange}
              className="w-full px-4 py-3 rounded-xl bg-surface border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary text-on-surface font-black text-xl sm:text-2xl transition-all pr-16"
              placeholder={t.placeholderSalary}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-on-surface-variant">
              VND
            </span>
          </div>

          {/* Custom Insurance Base Salary (Checkbox + Collapsible Input) */}
          <div className="p-4 rounded-xl bg-surface border border-border-subtle space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs sm:text-sm font-semibold text-on-surface flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useCustomInsurance}
                  onChange={(e) => setUseCustomInsurance(e.target.checked)}
                  className="rounded border-border-subtle text-primary focus:ring-primary/40 w-4 h-4 cursor-pointer"
                />
                {t.customInsuranceOption}
              </label>
              {!useCustomInsurance && (
                <span className="text-xs text-on-surface-variant italic">
                  {t.customInsuranceEqualGross}
                </span>
              )}
            </div>

            {useCustomInsurance && (
              <div className="relative pt-1 max-w-md">
                <input
                  type="text"
                  inputMode="numeric"
                  value={insuranceDisplay}
                  onChange={handleInsuranceChange}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary text-on-surface text-base font-semibold transition-all pr-14"
                  placeholder={t.customInsurancePlaceholder}
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-on-surface-variant">
                  VND
                </span>
              </div>
            )}

            {result.warning && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs">
                <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                <span>{result.warning}</span>
              </div>
            )}
          </div>

          {/* Region, Dependents, and Date Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            {/* Region */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-on-surface-variant block">
                {t.regionLabel}
              </label>
              <select
                value={region}
                onChange={(e) => setRegion(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl bg-surface border border-border-subtle text-on-surface text-xs sm:text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary cursor-pointer"
              >
                <option value={1}>{t.region1}</option>
                <option value={2}>{t.region2}</option>
                <option value={3}>{t.region3}</option>
                <option value={4}>{t.region4}</option>
              </select>
            </div>

            {/* Dependents */}
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

            {/* Month/Year selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-on-surface-variant block">
                {t.monthYearLabel}
              </label>
              <input
                type="month"
                value={monthYear}
                onChange={(e) => setMonthYear(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-surface border border-border-subtle text-on-surface text-xs sm:text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary cursor-pointer"
              />
              <p className="text-[11px] text-on-surface-variant leading-tight mt-1">
                {t.monthYearHint}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Results Section: Toolio Standard 4 Metric Cards Grid */}
      <section className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Hero KPI — Lương Thực Nhận (Net) hoặc Gross */}
          <div className="p-5 rounded-2xl bg-surface border-2 border-primary/40 shadow-xs flex flex-col justify-between">
            <span className="text-xs font-bold text-primary uppercase tracking-wider block mb-1">
              {calcMode === 'grossToNet' ? t.metricNetSalary : t.metricGrossSalary}
            </span>
            <div>
              <div className="text-2xl lg:text-3xl font-black text-primary tracking-tight">
                {formatVND(calcMode === 'grossToNet' ? result.netSalary : result.grossSalary)}
              </div>
              <span className="text-xs text-on-surface-variant mt-1 block">
                {calcMode === 'grossToNet'
                  ? `Gross: ${formatVND(result.grossSalary)}`
                  : `${t.metricTargetNet}: ${formatVND(result.targetNet)}`}
              </span>
            </div>
          </div>

          {/* Card 2: Bảo Hiểm Bắt Buộc NLĐ */}
          <div className="p-5 rounded-2xl bg-surface border border-border-subtle shadow-xs flex flex-col justify-between">
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
              {t.metricInsurance}
            </span>
            <div>
              <div className="text-2xl lg:text-3xl font-black text-on-surface tracking-tight">
                {formatVND(result.employeeInsurance.total)}
              </div>
              <span className="text-xs text-on-surface-variant mt-1 block">
                BHXH 8% • BHYT 1.5% • BHTN 1%
              </span>
            </div>
          </div>

          {/* Card 3: Thuế TNCN (PIT) */}
          <div className="p-5 rounded-2xl bg-surface border border-border-subtle shadow-xs flex flex-col justify-between">
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
              {t.metricPIT}
            </span>
            <div>
              <div className="text-2xl lg:text-3xl font-black text-rose-600 dark:text-rose-400 tracking-tight">
                {formatVND(result.pitTax)}
              </div>
              <span className="text-xs text-on-surface-variant mt-1 block">
                TNTT: {formatVND(result.taxableIncome)}
              </span>
            </div>
          </div>

          {/* Card 4: Tổng Chi Phí Doanh Nghiệp */}
          <div className="p-5 rounded-2xl bg-surface border border-border-subtle shadow-xs flex flex-col justify-between">
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
              {t.metricEmployerCost}
            </span>
            <div>
              <div className="text-2xl lg:text-3xl font-black text-on-surface tracking-tight">
                {formatVND(result.employerCost)}
              </div>
              <span className="text-xs text-on-surface-variant mt-1 block">
                {t.employerCostHint}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Detailed Breakdown Table */}
      <section className="bg-surface-container rounded-2xl p-5 sm:p-6 border border-border-subtle shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-border-subtle pb-3">
          <Receipt className="w-5 h-5 text-primary" />
          <h3 className="text-base font-bold text-on-surface">
            {t.breakdownTitle}
          </h3>
        </div>

        <div className="rounded-xl bg-surface border border-border-subtle overflow-x-auto">
          <table className="w-full text-xs sm:text-sm text-left border-collapse">
            <thead>
              <tr className="border-b border-border-subtle bg-surface-container-low text-on-surface-variant">
                <th className="py-3 px-4 font-bold">{t.itemCol}</th>
                <th className="py-3 px-4 font-bold text-right">{t.basisCol}</th>
                <th className="py-3 px-4 font-bold text-right">{t.amountCol}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/50">
              <tr className="font-bold text-on-surface bg-surface">
                <td className="py-2.5 px-4">{t.itemGross}</td>
                <td className="py-2.5 px-4 text-right text-on-surface-variant font-medium">100%</td>
                <td className="py-2.5 px-4 text-right">{formatVND(result.grossSalary)}</td>
              </tr>
              <tr className="text-on-surface-variant bg-surface">
                <td className="py-2 px-4 pl-8">{t.itemBhxh}</td>
                <td className="py-2 px-4 text-right">
                  8% {result.employeeInsurance.isBhxhCapped ? t.cappedTag : ''}
                </td>
                <td className="py-2 px-4 text-right text-on-surface font-medium">
                  {formatVND(result.employeeInsurance.bhxh)}
                </td>
              </tr>
              <tr className="text-on-surface-variant bg-surface">
                <td className="py-2 px-4 pl-8">{t.itemBhyt}</td>
                <td className="py-2 px-4 text-right">1.5%</td>
                <td className="py-2 px-4 text-right text-on-surface font-medium">
                  {formatVND(result.employeeInsurance.bhyt)}
                </td>
              </tr>
              <tr className="text-on-surface-variant bg-surface">
                <td className="py-2 px-4 pl-8">{t.itemBhtn}</td>
                <td className="py-2 px-4 text-right">
                  1% {result.employeeInsurance.isBhtnCapped ? t.cappedTag : ''}
                </td>
                <td className="py-2 px-4 text-right text-on-surface font-medium">
                  {formatVND(result.employeeInsurance.bhtn)}
                </td>
              </tr>
              <tr className="font-semibold text-on-surface bg-surface-container-low/60">
                <td className="py-2.5 px-4">{t.itemPreTax}</td>
                <td className="py-2.5 px-4 text-right text-on-surface-variant font-normal">
                  Gross - Bảo hiểm NLĐ
                </td>
                <td className="py-2.5 px-4 text-right">
                  {formatVND(result.incomeBeforeFamilyDeduction)}
                </td>
              </tr>
              <tr className="text-on-surface-variant bg-surface">
                <td className="py-2 px-4 pl-8">{t.itemPersonalDec}</td>
                <td className="py-2 px-4 text-right">NQ 110/2025</td>
                <td className="py-2 px-4 text-right text-emerald-700 dark:text-emerald-400 font-medium">
                  -{formatVND(result.personalDeduction)}
                </td>
              </tr>
              <tr className="text-on-surface-variant bg-surface">
                <td className="py-2 px-4 pl-8">
                  {t.itemDepDec} ({result.dependents})
                </td>
                <td className="py-2 px-4 text-right">6.2M × {result.dependents}</td>
                <td className="py-2 px-4 text-right text-emerald-700 dark:text-emerald-400 font-medium">
                  -{formatVND(result.dependentDeduction)}
                </td>
              </tr>
              <tr className="font-bold text-on-surface bg-surface-container-low/60">
                <td className="py-2.5 px-4">{t.itemTaxableIncome}</td>
                <td className="py-2.5 px-4 text-right text-on-surface-variant font-normal">
                  Lũy tiến 5 bậc
                </td>
                <td className="py-2.5 px-4 text-right text-primary font-black">
                  {formatVND(result.taxableIncome)}
                </td>
              </tr>
              <tr className="font-bold text-rose-600 dark:text-rose-400 bg-surface">
                <td className="py-2.5 px-4">{t.itemPIT}</td>
                <td className="py-2.5 px-4 text-right text-on-surface-variant font-normal">
                  Biểu 5 bậc 2026
                </td>
                <td className="py-2.5 px-4 text-right font-black">
                  {formatVND(result.pitTax)}
                </td>
              </tr>
              <tr className="font-black text-on-surface bg-primary/10 text-sm sm:text-base border-t-2 border-primary/30">
                <td className="py-3.5 px-4 text-primary">{t.itemNet}</td>
                <td className="py-3.5 px-4 text-right text-xs text-on-surface-variant font-semibold">
                  Gross - Bảo hiểm - PIT
                </td>
                <td className="py-3.5 px-4 text-right text-primary font-black">
                  {formatVND(result.netSalary)}
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
              <span className="font-bold text-on-surface block mb-0.5">{t.formulaNetTitle}</span>
              <p className="p-2.5 rounded-lg bg-surface-container text-on-surface font-semibold">
                {t.formulaNetExpr}
              </p>
            </div>
            <div>
              <span className="font-bold text-on-surface block mb-0.5">{t.formulaTaxableTitle}</span>
              <p className="p-2.5 rounded-lg bg-surface-container text-on-surface font-semibold">
                {t.formulaTaxableExpr}
              </p>
            </div>
            <div>
              <span className="font-bold text-on-surface block mb-0.5">{t.formulaPITTitle}</span>
              <p className="p-2.5 rounded-lg bg-surface-container text-on-surface font-semibold">
                {result.pitBracketsBreakdown.filter(b => b.taxAmount > 0).map(b => b.formula).join(' + ') || '0 VND'} = {result.pitTax.toLocaleString('vi-VN')} VND
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 6. Standard Toolio Regulatory Basis View */}
      <RegulatorySourceView
        sourceIds={['vn-res-110-2025', 'vn-law-109-2025', 'vn-dec-293-2025', 'vn-dec-73-2024']}
        applicablePeriodText={t.applicablePeriodText}
        era={t.eraText}
        lastVerified={t.verifiedDateText}
        lang={lang}
      />
    </div>
  );
}
