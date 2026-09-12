/**
 * @file packages/core/src/components/vietnam/ElectricityCalculatorVNView.jsx
 * @description Giao diện tính tiền điện sinh hoạt 6 bậc lũy tiến Việt Nam chuẩn Quyết định 1279/QĐ-BCT.
 * Tuân thủ 100% nguyên tắc thiết kế Toolio: Semantic Design Tokens, container 1240px, Metric Cards Grid,
 * RegulatorySourceView chuẩn hóa và hỗ trợ đa ngữ (VI, EN, JA).
 */

import React, { useState, useMemo } from 'react';
import {
  Zap,
  Info,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Gauge,
  AlertTriangle,
  Receipt,
  Percent,
  ShieldCheck,
  Calculator,
  Sliders,
} from 'lucide-react';

import RegulatorySourceView from '../regulatory/RegulatorySourceView.jsx';
import {
  calculateVietnamElectricity,
  getElectricityTariff,
  getElectricityVATRule,
} from '../../vietnam/index.js';

const I18N = {
  vi: {
    appBadge: 'VIETNAM RESIDENTIAL ELECTRICITY (EVN 6 TIERS)',
    legalBadge: 'Quyết định 1279/QĐ-BCT (Bộ Công Thương)',
    title: 'Tính Tiền Điện Sinh Hoạt (Biểu 6 Bậc)',
    subtitle: 'Mô phỏng chính xác tiền điện sinh hoạt theo biểu giá bán lẻ 6 bậc lũy tiến của EVN và Bộ Công Thương, tách bạch thuế suất GTGT (VAT) độc lập.',
    privacyNote: '100% Xử lý cục bộ trên trình duyệt — Dữ liệu chỉ số công tơ và mức tiêu thụ điện tuyệt đối an toàn, không gửi lên máy chủ.',
    modeKwh: 'Nhập số kWh',
    modeMeter: 'Chỉ số công tơ',
    kwhLabel: 'Điện năng tiêu thụ trong tháng (kWh)',
    placeholderKwh: '250',
    meterOldLabel: 'Chỉ số công tơ cũ (kỳ trước)',
    meterNewLabel: 'Chỉ số công tơ mới (kỳ này)',
    meterDiffLabel: 'Điện năng tiêu thụ thực tế (Mới - Cũ):',
    vatRateLabel: 'Thuế suất GTGT (VAT) áp dụng',
    vat8: '8% (Ưu đãi / Giảm thuế)',
    vat10: '10% (Tiêu chuẩn)',
    vat0: '0% (Miễn thuế)',
    metricTotal: 'Tổng tiền điện phải thanh toán',
    metricTotalSub: 'Đã bao gồm thuế GTGT (VAT)',
    metricSubtotal: 'Tiền điện trước VAT',
    metricSubtotalSub: 'Tính theo 6 bậc lũy tiến',
    metricVat: 'Thuế giá trị gia tăng (VAT)',
    metricVatSub: 'Tính trên tiền điện bậc thang',
    avgPricePrefix: 'Đơn giá bình quân thực tế:',
    tableTitle: 'Bảng Kê Chi Tiết Sản Lượng Theo 6 Bậc Lũy Tiến EVN',
    colTier: 'Bậc thang',
    colRange: 'Khung sản lượng',
    colUnitPrice: 'Đơn giá (₫/kWh)',
    colConsumed: 'Sản lượng (kWh)',
    colAmount: 'Thành tiền trước VAT',
    rowSubtotal: 'Tổng tiền điện trước thuế',
    rowVat: 'Thuế giá trị gia tăng (VAT {rate}%)',
    rowGrandTotal: 'TỔNG TIỀN ĐIỆN THANH TOÁN',
    showFormula: 'Xem công thức tính toán & Quy định biểu giá',
    hideFormula: 'Thu gọn công thức',
    formulaSubtotalLabel: 'Tiền điện trước VAT =',
    formulaVatLabel: 'Thuế GTGT =',
    formulaTotalLabel: 'Tổng thanh toán =',
    applicablePeriodText: 'Quy chuẩn năm 2026 (QĐ 1279/QĐ-BCT)',
    eraText: 'Biểu giá điện sinh hoạt 2026',
    verifiedDateText: '2026-09-12',
  },
  en: {
    appBadge: 'VIETNAM RESIDENTIAL ELECTRICITY (EVN 6 TIERS)',
    legalBadge: 'Decision 1279/QD-BCT (Ministry of Industry & Trade)',
    title: 'Vietnam Residential Electricity Calculator (6 Tiers)',
    subtitle: 'Accurate simulation of monthly household electricity bills based on EVN 6 progressive retail tariff tiers with independent VAT rates.',
    privacyNote: '100% Client-side execution — Meter readings and electricity consumption data never leave your browser.',
    modeKwh: 'Enter kWh',
    modeMeter: 'Meter Readings',
    kwhLabel: 'Monthly Electricity Consumption (kWh)',
    placeholderKwh: '250',
    meterOldLabel: 'Previous Meter Reading (Old)',
    meterNewLabel: 'Current Meter Reading (New)',
    meterDiffLabel: 'Actual Consumption (New - Old):',
    vatRateLabel: 'Applicable Value-Added Tax (VAT) Rate',
    vat8: '8% (Reduced Incentive)',
    vat10: '10% (Standard Rate)',
    vat0: '0% (Tax-Exempt)',
    metricTotal: 'Total Electricity Bill (Payable)',
    metricTotalSub: 'Inclusive of VAT',
    metricSubtotal: 'Electricity Cost Before VAT',
    metricSubtotalSub: 'Sum of 6 progressive tiers',
    metricVat: 'Value Added Tax (VAT)',
    metricVatSub: 'Calculated on tiered subtotal',
    avgPricePrefix: 'Effective average unit cost:',
    tableTitle: 'Detailed Allocation Across EVN 6 Progressive Tiers',
    colTier: 'Tier',
    colRange: 'Consumption Range',
    colUnitPrice: 'Unit Price (VND/kWh)',
    colConsumed: 'Consumption (kWh)',
    colAmount: 'Subtotal Before VAT',
    rowSubtotal: 'Subtotal Before Tax',
    rowVat: 'Value Added Tax (VAT {rate}%)',
    rowGrandTotal: 'TOTAL AMOUNT PAYABLE',
    showFormula: 'View calculation formulas & tariff notes',
    hideFormula: 'Collapse formula',
    formulaSubtotalLabel: 'Subtotal Before VAT =',
    formulaVatLabel: 'VAT Amount =',
    formulaTotalLabel: 'Total Payment =',
    applicablePeriodText: 'Standard Year 2026 (Dec 1279/QD-BCT)',
    eraText: 'Vietnam Electricity Tariff 2026',
    verifiedDateText: '2026-09-12',
  },
  ja: {
    appBadge: 'VIETNAM RESIDENTIAL ELECTRICITY (EVN 6 TIERS)',
    legalBadge: '商工省決定 1279/QD-BCT 号基準',
    title: 'ベトナム家庭用電気料金シミュレーター (6段階累進制)',
    subtitle: 'EVNおよび商工省が定める家庭用電気料金の6段階累進制小売単価に基づき、付加価値税（VAT）を独立計算する高精度シミュレーター。',
    privacyNote: '100% ブラウザ内ローカル処理 — メーター数値や消費電力量のデータは一切サーバーに送信されず安全です。',
    modeKwh: '使用電力量 (kWh)',
    modeMeter: 'メーター指針値',
    kwhLabel: '月間使用電力量 (kWh)',
    placeholderKwh: '250',
    meterOldLabel: '前月メーター指針値（旧）',
    meterNewLabel: '当月メーター指針値（新）',
    meterDiffLabel: '実効使用量 (新 - 旧):',
    vatRateLabel: '適用付加価値税率 (VAT)',
    vat8: '8%（減税優遇税率）',
    vat10: '10%（標準税率）',
    vat0: '0%（非課税）',
    metricTotal: '電気料金お支払い総額',
    metricTotalSub: '付加価値税（VAT）込',
    metricSubtotal: '税抜電気料金',
    metricSubtotalSub: '6段階累進合算',
    metricVat: '付加価値税（VAT）',
    metricVatSub: '段階料金に対する税額',
    avgPricePrefix: '実効平均単価:',
    tableTitle: 'EVN 6段階累進使用量・料金内訳明細表',
    colTier: '段階',
    colRange: '使用量区分',
    colUnitPrice: '単価 (VND/kWh)',
    colConsumed: '使用量 (kWh)',
    colAmount: '税抜金額',
    rowSubtotal: '税抜合計金額',
    rowVat: '付加価値税 (VAT {rate}%)',
    rowGrandTotal: '電気料金請求総額',
    showFormula: '算定計算式と制度基準の表示',
    hideFormula: '計算式を閉じる',
    formulaSubtotalLabel: '税抜電気料金 =',
    formulaVatLabel: '付加価値税額 =',
    formulaTotalLabel: '支払合計額 =',
    applicablePeriodText: '2026年度基準（商工省決定 1279/QD-BCT）',
    eraText: 'ベトナム電気料金制度 2026',
    verifiedDateText: '2026-09-12',
  },
};

export default function ElectricityCalculatorVNView({ displayLang = 'vi' }) {
  const t = I18N[displayLang] || I18N.vi;

  const [inputMode, setInputMode] = useState('kwh'); // 'kwh' | 'meter'

  // Mode A: Direct kWh
  const [kwhInput, setKwhInput] = useState(250);
  const [kwhDisplay, setKwhDisplay] = useState('250');

  // Mode B: Meter Reading
  const [oldReadingInput, setOldReadingInput] = useState(1200);
  const [oldReadingDisplay, setOldReadingDisplay] = useState('1,200');
  const [newReadingInput, setNewReadingInput] = useState(1450);
  const [newReadingDisplay, setNewReadingDisplay] = useState('1,450');

  // VAT selection
  const [vatRate, setVatRate] = useState(0.08); // 8% default

  const [showFormula, setShowFormula] = useState(false);

  const formatVND = (num) => (Number(num) || 0).toLocaleString('vi-VN') + ' ₫';

  const handleKwhChange = (e) => {
    const raw = e.target.value.replace(/[^\d.]/g, '');
    const val = raw ? parseFloat(raw) : 0;
    setKwhInput(val);
    setKwhDisplay(raw);
  };

  const handleOldReadingChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '');
    const val = raw ? parseInt(raw, 10) : 0;
    setOldReadingInput(val);
    setOldReadingDisplay(raw ? val.toLocaleString('vi-VN') : '');
  };

  const handleNewReadingChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '');
    const val = raw ? parseInt(raw, 10) : 0;
    setNewReadingInput(val);
    setNewReadingDisplay(raw ? val.toLocaleString('vi-VN') : '');
  };

  const result = useMemo(() => {
    if (inputMode === 'kwh') {
      return calculateVietnamElectricity({
        kwh: kwhInput,
        vatRate,
        date: '2026-09-01',
      });
    } else {
      return calculateVietnamElectricity({
        oldReading: oldReadingInput,
        newReading: newReadingInput,
        vatRate,
        date: '2026-09-01',
      });
    }
  }, [inputMode, kwhInput, oldReadingInput, newReadingInput, vatRate]);

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
              <Zap size={14} />
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

            {/* Input Mode Selector */}
            <div className="inline-flex rounded-xl bg-surface-container p-1 border border-border-subtle self-start md:self-center shrink-0">
              <button
                type="button"
                onClick={() => setInputMode('kwh')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  inputMode === 'kwh'
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'text-outline hover:text-on-surface'
                }`}
              >
                {t.modeKwh}
              </button>
              <button
                type="button"
                onClick={() => setInputMode('meter')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  inputMode === 'meter'
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'text-outline hover:text-on-surface'
                }`}
              >
                {t.modeMeter}
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
        <div className="flex items-center justify-between border-b border-border-subtle pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Sliders size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-on-surface">Thông Số Tiêu Thụ & Thuế Suất</h2>
              <p className="text-xs text-outline">Nhập sản lượng hoặc chỉ số điện tiêu thụ trong kỳ</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left: Electricity Input (kWh or Meter) */}
          <div className="md:col-span-7 space-y-4">
            {inputMode === 'kwh' ? (
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-xs font-semibold text-outline">
                    {t.kwhLabel}
                  </label>
                  <div className="flex items-center gap-1.5">
                    {[50, 100, 250, 350, 500].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => {
                          setKwhInput(val);
                          setKwhDisplay(String(val));
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                          kwhInput === val
                            ? 'bg-primary/15 text-primary border border-primary/30'
                            : 'bg-surface-container hover:bg-surface-container-high text-outline hover:text-on-surface border border-border-subtle'
                        }`}
                      >
                        {val} kWh
                      </button>
                    ))}
                  </div>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={kwhDisplay}
                    onChange={handleKwhChange}
                    className="w-full px-4 py-3 rounded-xl bg-surface-container border border-border-subtle focus:border-primary text-on-surface font-semibold text-lg outline-none transition-all pr-14"
                    placeholder={t.placeholderKwh}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-outline">
                    kWh
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-outline block mb-1.5">
                      {t.meterOldLabel}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={oldReadingDisplay}
                        onChange={handleOldReadingChange}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container border border-border-subtle text-on-surface text-sm font-medium outline-none focus:border-primary pr-12"
                        placeholder="1,200"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-outline font-semibold">
                        kWh
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-outline block mb-1.5">
                      {t.meterNewLabel}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={newReadingDisplay}
                        onChange={handleNewReadingChange}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container border border-border-subtle text-on-surface text-sm font-medium outline-none focus:border-primary pr-12"
                        placeholder="1,450"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-outline font-semibold">
                        kWh
                      </span>
                    </div>
                  </div>
                </div>

                {result.validationError ? (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">
                    <AlertTriangle size={16} className="shrink-0" />
                    <span>{result.validationError}</span>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-surface-container text-xs text-on-surface flex items-center justify-between font-medium border border-border-subtle">
                    <span className="text-outline">{t.meterDiffLabel}</span>
                    <strong className="text-primary font-bold text-sm">
                      {result.kwh.toLocaleString('vi-VN')} kWh
                    </strong>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: VAT Rate Selection */}
          <div className="md:col-span-5 space-y-2">
            <label className="text-xs font-semibold text-outline block flex items-center gap-1.5">
              <Percent size={14} className="text-primary" />
              {t.vatRateLabel}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { rate: 0.08, label: t.vat8 },
                { rate: 0.10, label: t.vat10 },
                { rate: 0.00, label: t.vat0 },
              ].map((v) => (
                <button
                  key={v.rate}
                  type="button"
                  onClick={() => setVatRate(v.rate)}
                  className={`py-3 px-2 rounded-xl text-xs transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-0.5 border ${
                    vatRate === v.rate
                      ? 'bg-primary text-on-primary font-bold border-primary shadow-xs'
                      : 'bg-surface-container border-border-subtle text-outline hover:text-on-surface hover:bg-surface-container-high'
                  }`}
                >
                  <span>{v.label.split(' ')[0]}</span>
                  <span className="text-[10px] opacity-80 font-normal truncate max-w-full">
                    {v.label.replace(/^[\d%]+ /, '')}
                  </span>
                </button>
              ))}
            </div>
            <p className="text-[11px] text-outline italic pt-1">
              * Mức VAT 8% áp dụng theo chính sách hỗ trợ giảm thuế của Chính phủ; mức chuẩn theo Luật là 10%.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Metric Cards Grid (3 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Hero Card - Total Payable */}
        <div className="rounded-2xl p-5 border-2 border-primary/40 bg-surface shadow-xs transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-outline mb-1">
              <span className="font-semibold">{t.metricTotal}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary">
                {t.metricTotalSub}
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-primary tracking-tight mt-1">
              {formatVND(result.totalAmount)}
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-border-subtle/80 flex items-center justify-between text-xs text-outline">
            <span>{t.avgPricePrefix}</span>
            <strong className="text-on-surface font-semibold">
              {result.kwh > 0 ? Math.round(result.totalAmount / result.kwh).toLocaleString('vi-VN') : 0} ₫/kWh
            </strong>
          </div>
        </div>

        {/* Card 2: Subtotal Before VAT */}
        <div className="rounded-2xl p-5 border border-border-subtle bg-surface shadow-xs transition-all flex flex-col justify-between">
          <div>
            <div className="text-xs text-outline mb-1 font-semibold">
              {t.metricSubtotal}
            </div>
            <div className="text-xl sm:text-2xl font-bold text-on-surface tracking-tight mt-1">
              {formatVND(result.subtotalBeforeVat)}
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-border-subtle/80 text-xs text-outline flex items-center justify-between">
            <span>{t.metricSubtotalSub}</span>
            <span className="font-semibold text-on-surface">{result.kwh.toLocaleString('vi-VN')} kWh</span>
          </div>
        </div>

        {/* Card 3: VAT Amount */}
        <div className="rounded-2xl p-5 border border-border-subtle bg-surface shadow-xs transition-all flex flex-col justify-between">
          <div>
            <div className="text-xs text-outline mb-1 font-semibold flex items-center justify-between">
              <span>{t.metricVat}</span>
              <span className="text-[11px] font-bold text-primary">{(result.vatRate * 100)}%</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-on-surface tracking-tight mt-1">
              {formatVND(result.vatAmount)}
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-border-subtle/80 text-xs text-outline flex items-center justify-between">
            <span>{t.metricVatSub}</span>
            <span className="text-on-surface font-medium">8% hoặc 10%</span>
          </div>
        </div>
      </div>

      {/* 4. EVN 6-Tier Breakdown Table Card */}
      <div className="bg-surface border border-border-subtle rounded-3xl p-5 sm:p-7 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-border-subtle pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Gauge size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-on-surface">
                {t.tableTitle}
              </h3>
              <p className="text-xs text-outline">
                Phân bổ sản lượng điện theo quy chuẩn QĐ 1279/QĐ-BCT của Bộ Công Thương
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-border-subtle text-outline">
                <th className="py-3 px-3 font-semibold">{t.colTier}</th>
                <th className="py-3 px-3 font-semibold">{t.colRange}</th>
                <th className="py-3 px-3 font-semibold text-right">{t.colUnitPrice}</th>
                <th className="py-3 px-3 font-semibold text-right">{t.colConsumed}</th>
                <th className="py-3 px-3 font-semibold text-right">{t.colAmount}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/40">
              {result.tiersBreakdown.map((b) => {
                const isActive = b.consumedKwh > 0;
                return (
                  <tr
                    key={b.tier}
                    className={`transition-colors ${
                      isActive ? 'bg-primary/5 font-semibold text-on-surface' : 'text-outline/70'
                    }`}
                  >
                    <td className="py-3 px-3 font-bold">
                      <span className="inline-flex items-center gap-1.5">
                        Bậc {b.tier}
                        {isActive && (
                          <span className="w-2 h-2 rounded-full bg-primary inline-block" />
                        )}
                      </span>
                    </td>
                    <td className="py-3 px-3">{b.label_vn.replace(/Bậc \d+ /, '')}</td>
                    <td className="py-3 px-3 text-right font-mono">{b.unitPrice.toLocaleString('vi-VN')} ₫</td>
                    <td className="py-3 px-3 text-right font-bold">{b.consumedKwh.toLocaleString('vi-VN')}</td>
                    <td className={`py-3 px-3 text-right font-semibold ${isActive ? 'text-primary' : 'text-outline/60'}`}>
                      {formatVND(b.amount)}
                    </td>
                  </tr>
                );
              })}

              <tr className="font-semibold text-on-surface bg-surface-container">
                <td className="py-3 px-3" colSpan={3}>{t.rowSubtotal}</td>
                <td className="py-3 px-3 text-right font-bold">{result.kwh.toLocaleString('vi-VN')} kWh</td>
                <td className="py-3 px-3 text-right font-bold">{formatVND(result.subtotalBeforeVat)}</td>
              </tr>

              <tr className="text-outline">
                <td className="py-3 px-3" colSpan={4}>
                  {t.rowVat.replace('{rate}', String(result.vatRate * 100))}
                </td>
                <td className="py-3 px-3 text-right font-medium text-on-surface">
                  {formatVND(result.vatAmount)}
                </td>
              </tr>

              <tr className="font-extrabold text-sm text-primary bg-primary/10">
                <td className="py-3.5 px-3" colSpan={4}>{t.rowGrandTotal}</td>
                <td className="py-3.5 px-3 text-right">{formatVND(result.totalAmount)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Collapsible Formula & Notes */}
      <div className="rounded-3xl border border-border-subtle bg-surface shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => setShowFormula(!showFormula)}
          className="w-full p-4 sm:p-5 flex items-center justify-between text-left text-sm font-bold text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2.5">
            <Sparkles size={16} className="text-primary" />
            {showFormula ? t.hideFormula : t.showFormula}
          </span>
          {showFormula ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        {showFormula && (
          <div className="p-5 sm:p-6 border-t border-border-subtle bg-surface-container space-y-4 text-xs">
            <div className="space-y-2 font-mono text-outline">
              <p>
                <span className="text-on-surface font-bold">{t.formulaSubtotalLabel}</span>{' '}
                {result?.formula?.subtotal ?? ''} = {(result?.subtotalBeforeVat ?? 0).toLocaleString('vi-VN')} VND
              </p>
              <p>
                <span className="text-on-surface font-bold">{t.formulaVatLabel}</span>{' '}
                {result?.formula?.vat ?? ''}
              </p>
              <p>
                <span className="text-on-surface font-bold">{t.formulaTotalLabel}</span>{' '}
                {result?.formula?.total ?? ''}
              </p>
            </div>

            <div className="pt-3 border-t border-border-subtle/80 space-y-1.5 text-outline text-xs">
              <p className="font-semibold text-on-surface">Ghi chú chuyên môn về biểu giá điện sinh hoạt:</p>
              <p>
                1. Biểu giá điện 6 bậc theo Quyết định 1279/QĐ-BCT có hiệu lực từ ngày 10/05/2025. Giá bán lẻ điện sinh hoạt chưa bao gồm thuế giá trị gia tăng (VAT).
              </p>
              <p>
                2. Thuế giá trị gia tăng được tính độc lập theo quy định của Luật Thuế GTGT và các Nghị quyết của Quốc hội/Chính phủ về giảm thuế VAT trong kỳ.
              </p>
              <p>
                3. Đơn giá bình quân thực tế được xác định bằng Tổng tiền điện thanh toán chia cho Tổng số kWh tiêu thụ.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 6. Standardized Regulatory Source View */}
      <RegulatorySourceView
        sourceIds={['vn-bct-dec-1279-2025', 'vn-gov-decree-vat-2026']}
        applicablePeriodText={t.applicablePeriodText}
        era={t.eraText}
        lastVerified={t.verifiedDateText}
        lang={displayLang}
      />
    </div>
  );
}
