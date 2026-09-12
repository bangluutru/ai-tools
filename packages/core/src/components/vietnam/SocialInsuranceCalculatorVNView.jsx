/**
 * @file packages/core/src/components/vietnam/SocialInsuranceCalculatorVNView.jsx
 * @description Giao diện tính BHXH, BHYT & BHTN Việt Nam chuẩn Luật BHXH 2024 & NĐ 293/2025/NĐ-CP.
 * Tuân thủ 100% nguyên tắc thiết kế Toolio: Semantic Design Tokens, 1240px container, Metric Cards Grid,
 * RegulatorySourceView chuẩn hóa và hỗ trợ đa ngữ (VI, EN, JA).
 */

import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Building2,
  Users,
  Info,
  ChevronDown,
  ChevronUp,
  Sparkles,
  AlertCircle,
  Clock,
  Layers,
  Receipt,
  Calculator,
  Percent,
} from 'lucide-react';

import RegulatorySourceView from '../regulatory/RegulatorySourceView.jsx';
import {
  calculateVietnamInsurance,
} from '../../vietnam/index.js';

const I18N = {
  vi: {
    appBadge: 'VIETNAM SOCIAL INSURANCE 2026',
    legalBadge: 'Luật BHXH 2024 & NĐ 293/2025/NĐ-CP',
    title: 'Tính BHXH, BHYT & BHTN (Bảo Hiểm Bắt Buộc)',
    subtitle: 'Tính toán chi tiết các khoản trích nộp bảo hiểm xã hội bắt buộc cho người lao động (10.5%) và người sử dụng lao động (21.5%) theo quy chuẩn 2026.',
    privacyNote: '100% Xử lý cục bộ trên trình duyệt — Dữ liệu lương và bảo hiểm tuyệt đối an toàn, không gửi lên máy chủ.',
    scopeBoth: 'Cả hai bên (32%)',
    scopeEmployee: 'Người lao động (10.5%)',
    scopeEmployer: 'Doanh nghiệp (21.5%)',
    salaryInputLabel: 'Mức lương làm căn cứ đóng bảo hiểm',
    placeholderSalary: '30,000,000',
    regionLabel: 'Vùng lương tối thiểu (áp dụng trần BHTN 20 lần)',
    region1: 'Vùng I (Trần BHTN: 99.2 triệu/tháng)',
    region2: 'Vùng II (Trần BHTN: 88.2 triệu/tháng)',
    region3: 'Vùng III (Trần BHTN: 77.2 triệu/tháng)',
    region4: 'Vùng IV (Trần BHTN: 69.0 triệu/tháng)',
    monthYearLabel: 'Thời điểm áp dụng (Tháng/Năm)',
    monthYearHint: 'Trước 01/07/2026 trần BHXH/BHYT là 46.8M; từ 01/07/2026 là 50.6M',
    metricTotalCombined: 'Tổng trích nộp bảo hiểm (32%)',
    metricEmployeeOnly: 'Phần người lao động đóng (10.5%)',
    metricEmployerOnly: 'Phần doanh nghiệp đóng (21.5%)',
    metricCombinedShare: 'Cả 2 bên: NLĐ 10.5% + DN 21.5%',
    breakdownTitle: 'Bảng Bóc Tách Chi Tiết 5 Quỹ Bảo Hiểm Bắt Buộc',
    fundCol: 'Quỹ bảo hiểm thành phần',
    employeeCol: 'Người lao động (NLĐ)',
    employerCol: 'Doanh nghiệp (NSDLĐ)',
    totalCol: 'Tổng nộp (Cả hai)',
    fundBhxh: '1. Hưu trí & Tử tuất',
    fundSick: '2. Ốm đau & Thai sản',
    fundAccident: '3. Tai nạn lao động & Bệnh nghề nghiệp (TNLĐ-BNN)',
    fundBhyt: '4. Bảo hiểm y tế (BHYT)',
    fundBhtn: '5. Bảo hiểm thất nghiệp (BHTN)',
    totalRow: 'TỔNG CỘNG TRÍCH NỘP (32%)',
    cappedTag: 'Trần',
    cappedNote: '(*) Đã chạm trần tối đa theo quy định pháp luật',
    showFormula: 'Xem công thức tính & Quy định trần đóng',
    hideFormula: 'Thu gọn công thức',
    formulaTitle: 'Quy tắc tính toán & Giới hạn trần đóng:',
    formulaBhxhCap: 'Trần BHXH/BHYT: Tối đa 20 lần mức lương cơ sở (Trước 01/07/2026: 46.8tr; Từ 01/07/2026: 50.6tr).',
    formulaBhtnCap: 'Trần BHTN: Tối đa 20 lần mức lương tối thiểu vùng theo NĐ 293/2025/NĐ-CP.',
    applicablePeriodText: 'Quy chuẩn năm 2026 (NĐ 73/2024 & NĐ 293/2025)',
    eraText: 'Luật BHXH Việt Nam 2026',
    verifiedDateText: '2026-09-12',
  },
  en: {
    appBadge: 'VIETNAM SOCIAL INSURANCE 2026',
    legalBadge: 'Law on Social Insurance 2024 & Dec 293/2025',
    title: 'Vietnam Social Insurance Calculator (Compulsory)',
    subtitle: 'Detailed simulation of statutory compulsory insurance contributions for employees (10.5%) and employers (21.5%) under 2026 standards.',
    privacyNote: '100% Client-side execution — Your salary and contributions data never leaves your browser.',
    scopeBoth: 'Both Parties (32%)',
    scopeEmployee: 'Employee (10.5%)',
    scopeEmployer: 'Employer (21.5%)',
    salaryInputLabel: 'Insurance Base Salary',
    placeholderSalary: '30,000,000',
    regionLabel: 'Minimum Wage Region (UI 20x Ceiling)',
    region1: 'Region I (UI Cap: 99.2M VND/month)',
    region2: 'Region II (UI Cap: 88.2M VND/month)',
    region3: 'Region III (UI Cap: 77.2M VND/month)',
    region4: 'Region IV (UI Cap: 69.0M VND/month)',
    monthYearLabel: 'Effective Month/Year',
    monthYearHint: 'Before 01/07/2026 SI/HI cap is 46.8M; from 01/07/2026 it is 50.6M',
    metricTotalCombined: 'Total Compulsory Insurance (32%)',
    metricEmployeeOnly: 'Employee Share (10.5%)',
    metricEmployerOnly: 'Employer Share (21.5%)',
    metricCombinedShare: 'Combined: Employee 10.5% + Employer 21.5%',
    breakdownTitle: 'Detailed Breakdown Across 5 Compulsory Funds',
    fundCol: 'Insurance Fund Component',
    employeeCol: 'Employee (EE)',
    employerCol: 'Employer (ER)',
    totalCol: 'Total (Combined)',
    fundBhxh: '1. Retirement & Survivorship Pension',
    fundSick: '2. Sickness & Maternity',
    fundAccident: '3. Occupational Accidents & Diseases (OAD)',
    fundBhyt: '4. Health Insurance (HI)',
    fundBhtn: '5. Unemployment Insurance (UI)',
    totalRow: 'TOTAL CONTRIBUTIONS (32%)',
    cappedTag: 'Capped',
    cappedNote: '(*) Statutory maximum ceiling reached',
    showFormula: 'View statutory rules & ceiling calculations',
    hideFormula: 'Collapse formula',
    formulaTitle: 'Statutory calculation rules & caps:',
    formulaBhxhCap: 'SI/HI Cap: Max 20 times the base salary (46.8M before 01/07/2026; 50.6M from 01/07/2026).',
    formulaBhtnCap: 'UI Cap: Max 20 times the regional minimum wage under Decree 293/2025/ND-CP.',
    applicablePeriodText: 'Statutory Year 2026 (Dec 73/2024 & Dec 293/2025)',
    eraText: 'Vietnam Insurance Law 2026',
    verifiedDateText: '2026-09-12',
  },
  ja: {
    appBadge: 'VIETNAM SOCIAL INSURANCE 2026',
    legalBadge: '2024年社会保険法 & 政令293号準拠',
    title: 'ベトナム強制社会保険料試算（BHXH・BHYT・BHTN）',
    subtitle: '2026年最新基準に基づく労働者控除額（10.5%）および会社負担額（21.5%）の5大保険基金別精密シミュレーション。',
    privacyNote: '100% ブラウザ内完結処理 — 給与および保険データはサーバーに一切送信されません。',
    scopeBoth: '労使合計 (32%)',
    scopeEmployee: '労働者負担 (10.5%)',
    scopeEmployer: '会社負担 (21.5%)',
    salaryInputLabel: '社会保険算定基礎給与額',
    placeholderSalary: '30,000,000',
    regionLabel: '最低賃金地域区分（失業保険20倍上限基準）',
    region1: '第I地域（失業保険上限: 月9,920万ドン）',
    region2: '第II地域（失業保険上限: 月8,820万ドン）',
    region3: '第III地域（失業保険上限: 月7,720万ドン）',
    region4: '第IV地域（失業保険上限: 月6,900万ドン）',
    monthYearLabel: '適用年月（支給時期）',
    monthYearHint: '2026年7月1日前（上限4,680万）と改定後（上限5,060万）に自動連動',
    metricTotalCombined: '保険料納付総額 (32%)',
    metricEmployeeOnly: '労働者控除額 (10.5%)',
    metricEmployerOnly: '会社負担額 (21.5%)',
    metricCombinedShare: '労使負担内訳: 労働者 10.5% + 会社 21.5%',
    breakdownTitle: '5大公的社会保険基金別・負担明細表',
    fundCol: '保険基金種別',
    employeeCol: '労働者負担 (EE)',
    employerCol: '会社負担 (ER)',
    totalCol: '合計納付額',
    fundBhxh: '1. 年金・遺族保険',
    fundSick: '2. 疾病・出産手当保険',
    fundAccident: '3. 労働災害・職業病保険',
    fundBhyt: '4. 医療保険 (BHYT)',
    fundBhtn: '5. 失業保険 (BHTN)',
    totalRow: '強制社会保険料合計 (32%)',
    cappedTag: '上限到達',
    cappedNote: '(*) 法定上限額（キャップ）が適用されています',
    showFormula: '上限基準および算定ロジックを確認',
    hideFormula: '計算基準を閉じる',
    formulaTitle: '法定基準および上限適用ルール:',
    formulaBhxhCap: '年金・医療保険上限: 基準給与の20倍（2026年7月1日前: 4,680万ドン、7月1日以降: 5,060万ドン）。',
    formulaBhtnCap: '失業保険上限: 政令293号に基づく各地域最低賃金の20倍。',
    applicablePeriodText: '2026年法定基準（政令73号 & 政令293号）',
    eraText: 'ベトナム社会保険法2026',
    verifiedDateText: '2026-09-12',
  },
};

export default function SocialInsuranceCalculatorVNView({ displayLang = 'vi' }) {
  const lang = ['vi', 'en', 'ja'].includes(displayLang) ? displayLang : 'vi';
  const t = I18N[lang];

  const [salaryInput, setSalaryInput] = useState(30_000_000);
  const [salaryDisplay, setSalaryDisplay] = useState('30,000,000');
  const [region, setRegion] = useState(1);
  const [monthYear, setMonthYear] = useState('2026-09');
  const [viewScope, setViewScope] = useState('both'); // 'both' | 'employee' | 'employer'
  const [showFormula, setShowFormula] = useState(false);

  const formatVND = (num) => (Number(num) || 0).toLocaleString('vi-VN') + ' ₫';

  const handleSalaryChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '');
    const val = raw ? parseInt(raw, 10) : 0;
    setSalaryInput(val);
    setSalaryDisplay(raw ? val.toLocaleString('vi-VN') : '');
  };

  const handlePresetSelect = (mil) => {
    const v = mil * 1_000_000;
    setSalaryInput(v);
    setSalaryDisplay(v.toLocaleString('vi-VN'));
  };

  const result = useMemo(() => {
    const dateStr = monthYear ? `${monthYear}-01` : '2026-09-01';
    return calculateVietnamInsurance(salaryInput, region, dateStr);
  }, [salaryInput, region, monthYear]);

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

          {/* View Scope Switcher */}
          <div className="inline-flex rounded-xl bg-surface-container p-1 border border-border-subtle self-start lg:self-center shrink-0">
            <button
              type="button"
              onClick={() => setViewScope('both')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                viewScope === 'both'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {t.scopeBoth}
            </button>
            <button
              type="button"
              onClick={() => setViewScope('employee')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                viewScope === 'employee'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {t.scopeEmployee}
            </button>
            <button
              type="button"
              onClick={() => setViewScope('employer')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                viewScope === 'employer'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {t.scopeEmployer}
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
            <Calculator className="w-5 h-5 text-primary" />
            <h2 className="text-base sm:text-lg font-bold text-on-surface">
              {t.salaryInputLabel}
            </h2>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[10, 20, 30, 50, 100].map((mil) => (
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
          {/* Salary Input */}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* Region Selector */}
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

      {/* 3. Results Section: Toolio Standard 3 Metric Cards Grid */}
      <section className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Card 1: Hero KPI — Tổng trích nộp */}
          <div className="p-5 rounded-2xl bg-surface border-2 border-primary/40 shadow-xs flex flex-col justify-between">
            <span className="text-xs font-bold text-primary uppercase tracking-wider block mb-1">
              {t.metricTotalCombined}
            </span>
            <div>
              <div className="text-2xl lg:text-3xl font-black text-primary tracking-tight">
                {formatVND(result?.totalCombined ?? result?.combined?.total ?? 0)}
              </div>
              <span className="text-xs text-on-surface-variant mt-1 block">
                {t.metricCombinedShare}
              </span>
            </div>
          </div>

          {/* Card 2: Phần Người Lao Động Đóng */}
          <div className="p-5 rounded-2xl bg-surface border border-border-subtle shadow-xs flex flex-col justify-between">
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
              {t.metricEmployeeOnly}
            </span>
            <div>
              <div className="text-2xl lg:text-3xl font-black text-on-surface tracking-tight">
                {formatVND(result?.employee?.total ?? 0)}
              </div>
              <span className="text-xs text-on-surface-variant mt-1 block">
                BHXH 8% • BHYT 1.5% • BHTN 1%
              </span>
            </div>
          </div>

          {/* Card 3: Phần Doanh Nghiệp Đóng */}
          <div className="p-5 rounded-2xl bg-surface border border-border-subtle shadow-xs flex flex-col justify-between">
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
              {t.metricEmployerOnly}
            </span>
            <div>
              <div className="text-2xl lg:text-3xl font-black text-on-surface tracking-tight">
                {formatVND(result?.employer?.total ?? 0)}
              </div>
              <span className="text-xs text-on-surface-variant mt-1 block">
                Hưu trí 14% • Y tế 3% • Thất nghiệp 1% • Khác 3.5%
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Detailed 5-Funds Breakdown Table */}
      <section className="bg-surface-container rounded-2xl p-5 sm:p-6 border border-border-subtle shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-border-subtle pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            <h3 className="text-base font-bold text-on-surface">
              {t.breakdownTitle}
            </h3>
          </div>
          {(result?.isBhxhCapped || result?.isBhtnCapped || result?.employee?.isBhxhCapped || result?.employee?.isBhtnCapped) && (
            <span className="text-xs text-amber-800 dark:text-amber-300 font-semibold flex items-center gap-1">
              <AlertCircle size={14} />
              {t.cappedNote}
            </span>
          )}
        </div>

        <div className="rounded-xl bg-surface border border-border-subtle overflow-x-auto">
          <table className="w-full text-xs sm:text-sm text-left border-collapse">
            <thead>
              <tr className="border-b border-border-subtle bg-surface-container-low text-on-surface-variant">
                <th className="py-3 px-4 font-bold">{t.fundCol}</th>
                <th className="py-3 px-4 font-bold text-right">{t.employeeCol}</th>
                <th className="py-3 px-4 font-bold text-right">{t.employerCol}</th>
                <th className="py-3 px-4 font-bold text-right">{t.totalCol}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/50">
              {/* 1. Hưu trí & Tử tuất */}
              <tr className="bg-surface hover:bg-surface-container-high/30 transition-colors">
                <td className="py-3 px-4 font-semibold text-on-surface">
                  {t.fundBhxh}
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="font-bold text-on-surface">{formatVND(result?.employee?.bhxh ?? 0)}</div>
                  <div className="text-[11px] text-on-surface-variant">8% {(result?.isBhxhCapped || result?.employee?.isBhxhCapped) ? `(${t.cappedTag})` : ''}</div>
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="font-bold text-on-surface">{formatVND(result?.employer?.bhxhRetirement ?? 0)}</div>
                  <div className="text-[11px] text-on-surface-variant">14% {(result?.isBhxhCapped || result?.employer?.isBhxhCapped) ? `(${t.cappedTag})` : ''}</div>
                </td>
                <td className="py-3 px-4 text-right font-black text-on-surface">
                  {formatVND(result?.combined?.bhxhRetirement ?? ((result?.employee?.bhxh || 0) + (result?.employer?.bhxhRetirement || 0)))}
                </td>
              </tr>

              {/* 2. Ốm đau & Thai sản */}
              <tr className="bg-surface hover:bg-surface-container-high/30 transition-colors">
                <td className="py-3 px-4 font-semibold text-on-surface">
                  {t.fundSick}
                </td>
                <td className="py-3 px-4 text-right text-on-surface-variant">
                  <div>0 ₫</div>
                  <div className="text-[11px]">0%</div>
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="font-bold text-on-surface">{formatVND(result?.employer?.bhxhMaternity ?? result?.employer?.bhxhSicknessMaternity ?? 0)}</div>
                  <div className="text-[11px] text-on-surface-variant">3%</div>
                </td>
                <td className="py-3 px-4 text-right font-black text-on-surface">
                  {formatVND(result?.combined?.bhxhSicknessMaternity ?? result?.employer?.bhxhMaternity ?? 0)}
                </td>
              </tr>

              {/* 3. TNLĐ & BNN */}
              <tr className="bg-surface hover:bg-surface-container-high/30 transition-colors">
                <td className="py-3 px-4 font-semibold text-on-surface">
                  {t.fundAccident}
                </td>
                <td className="py-3 px-4 text-right text-on-surface-variant">
                  <div>0 ₫</div>
                  <div className="text-[11px]">0%</div>
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="font-bold text-on-surface">{formatVND(result?.employer?.occupationalAccident ?? result?.employer?.bhxhAccident ?? 0)}</div>
                  <div className="text-[11px] text-on-surface-variant">0.5%</div>
                </td>
                <td className="py-3 px-4 text-right font-black text-on-surface">
                  {formatVND(result?.combined?.bhxhAccident ?? result?.employer?.occupationalAccident ?? 0)}
                </td>
              </tr>

              {/* 4. BHYT */}
              <tr className="bg-surface hover:bg-surface-container-high/30 transition-colors">
                <td className="py-3 px-4 font-semibold text-on-surface">
                  {t.fundBhyt}
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="font-bold text-on-surface">{formatVND(result?.employee?.bhyt ?? 0)}</div>
                  <div className="text-[11px] text-on-surface-variant">1.5% {(result?.isBhxhCapped || result?.employee?.isBhxhCapped) ? `(${t.cappedTag})` : ''}</div>
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="font-bold text-on-surface">{formatVND(result?.employer?.bhyt ?? 0)}</div>
                  <div className="text-[11px] text-on-surface-variant">3% {(result?.isBhxhCapped || result?.employer?.isBhxhCapped) ? `(${t.cappedTag})` : ''}</div>
                </td>
                <td className="py-3 px-4 text-right font-black text-on-surface">
                  {formatVND(result?.combined?.bhyt ?? ((result?.employee?.bhyt || 0) + (result?.employer?.bhyt || 0)))}
                </td>
              </tr>

              {/* 5. BHTN */}
              <tr className="bg-surface hover:bg-surface-container-high/30 transition-colors">
                <td className="py-3 px-4 font-semibold text-on-surface">
                  {t.fundBhtn}
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="font-bold text-on-surface">{formatVND(result?.employee?.bhtn ?? 0)}</div>
                  <div className="text-[11px] text-on-surface-variant">1% {(result?.isBhtnCapped || result?.employee?.isBhtnCapped) ? `(${t.cappedTag})` : ''}</div>
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="font-bold text-on-surface">{formatVND(result?.employer?.bhtn ?? 0)}</div>
                  <div className="text-[11px] text-on-surface-variant">1% {(result?.isBhtnCapped || result?.employer?.isBhtnCapped) ? `(${t.cappedTag})` : ''}</div>
                </td>
                <td className="py-3 px-4 text-right font-black text-on-surface">
                  {formatVND(result?.combined?.bhtn ?? ((result?.employee?.bhtn || 0) + (result?.employer?.bhtn || 0)))}
                </td>
              </tr>

              {/* Total Summary Row */}
              <tr className="font-black text-on-surface bg-primary/10 text-sm sm:text-base border-t-2 border-primary/30">
                <td className="py-3.5 px-4 text-primary">{t.totalRow}</td>
                <td className="py-3.5 px-4 text-right text-primary font-black">
                  {formatVND(result?.employee?.total ?? 0)}
                </td>
                <td className="py-3.5 px-4 text-right text-primary font-black">
                  {formatVND(result?.employer?.total ?? 0)}
                </td>
                <td className="py-3.5 px-4 text-right text-primary font-black">
                  {formatVND(result?.totalCombined ?? result?.combined?.total ?? 0)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 5. Collapsible: Calculation Formulas / Xem quy định trần đóng */}
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
            <p className="font-bold text-on-surface">{t.formulaTitle}</p>
            <p className="p-2.5 rounded-lg bg-surface-container text-on-surface font-semibold">
              • {t.formulaBhxhCap}
            </p>
            <p className="p-2.5 rounded-lg bg-surface-container text-on-surface font-semibold">
              • {t.formulaBhtnCap}
            </p>
            <p className="p-2.5 rounded-lg bg-surface-container text-on-surface font-semibold">
              • Lương đóng bảo hiểm thực tế BHXH/BHYT: {(result?.cappedBhxhSalary ?? result?.salaryBase?.bhxhBase ?? 0).toLocaleString('vi-VN')} VND
            </p>
            <p className="p-2.5 rounded-lg bg-surface-container text-on-surface font-semibold">
              • Lương đóng bảo hiểm thực tế BHTN: {(result?.cappedBhtnSalary ?? result?.salaryBase?.bhtnBase ?? 0).toLocaleString('vi-VN')} VND
            </p>
          </div>
        )}
      </div>

      {/* 6. Standard Toolio Regulatory Basis View */}
      <RegulatorySourceView
        sourceIds={['vn-dec-73-2024', 'vn-dec-293-2025', 'vn-law-bhxh-2024', 'vn-law-bhyt-2024']}
        applicablePeriodText={t.applicablePeriodText}
        era={t.eraText}
        lastVerified={t.verifiedDateText}
        lang={lang}
      />
    </div>
  );
}
