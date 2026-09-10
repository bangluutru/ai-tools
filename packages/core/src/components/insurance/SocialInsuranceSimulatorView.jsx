/**
 * @file packages/core/src/components/insurance/SocialInsuranceSimulatorView.jsx
 * @description Giao diện mô phỏng phí bảo hiểm xã hội Nhật Bản (社会保険料シミュレーター).
 * Phân định rạch ròi giữa lương thực tế (給与) và chuẩn thù lao tháng (標準報酬月額).
 * Cung cấp 2 góc nhìn: Người lao động (従業員) vs Chủ sử dụng lao động (会社).
 */

import React, { useState, useMemo } from 'react';
import {
  Building2,
  User,
  ShieldCheck,
  Calculator,
  HelpCircle,
  TrendingDown,
  Info,
  Calendar,
  MapPin,
  Briefcase,
  Layers,
  ArrowRight,
} from 'lucide-react';
import {
  calculateSocialInsuranceSimulation,
  PREFECTURE_LIST,
  INDUSTRY_LIST,
} from '../../japan/insurance/index.js';
import RegulatorySourceView from '../regulatory/RegulatorySourceView.jsx';

export default function SocialInsuranceSimulatorView({ lang = 'ja' }) {
  // Input states
  const [monthlySalary, setMonthlySalary] = useState(300000);
  const [actualBonus, setActualBonus] = useState(0);
  const [prefecture, setPrefecture] = useState('tokyo');
  const [age, setAge] = useState(30);
  const [industryCategory, setIndustryCategory] = useState('general');
  const [applicableDate, setApplicableDate] = useState('2026-04-01');

  // Perspective tab: 'employee' | 'employer' | 'both'
  const [viewPerspective, setViewPerspective] = useState('employee');

  // Calculations
  const result = useMemo(() => {
    return calculateSocialInsuranceSimulation({
      monthlySalary: Number(monthlySalary) || 0,
      actualBonus: Number(actualBonus) || 0,
      prefecture,
      age: Number(age) || 0,
      industryCategory,
      applicableDate,
    });
  }, [monthlySalary, actualBonus, prefecture, age, industryCategory, applicableDate]);

  // Labels
  const labels = {
    ja: {
      title: '社会保険料シミュレーター',
      subtitle: '協会けんぽ・厚生年金・雇用保険の標準報酬月額に基づく精密試算（令和8年度）',
      inputHeader: '試算条件の入力',
      monthlySalary: '月額額面給与（総支給額）',
      actualBonus: '賞与・ボーナス（1回あたり）',
      prefecture: '勤務先の都道府県（協会けんぽ支部）',
      age: '年齢',
      ageHint: '40歳以上64歳未満は介護保険料の対象',
      industry: '雇用保険の事業区分',
      applicableDate: '適用時期',
      resultHeader: '試算結果サマリー',
      employeePerspective: '従業員負担（控除額）',
      employerPerspective: '会社負担（事業主）',
      bothPerspective: '両方・全体像',
      standardGradeNotice: '標準報酬月額の決定',
      kenpoGradeLabel: '健康保険',
      pensionGradeLabel: '厚生年金',
      gradeUnit: '等級',
      monthlyTotal: '毎月の保険料合計',
      bonusTotal: '賞与時の保険料合計',
      totalCost: '人件費総額（給与＋会社負担）',
      takeHomeEstimate: '手取り概算（社会保険料控除後）',
      takeHomeHint: '※所得税・住民税控除前の金額です',
      breakdownTitle: '保険料の内訳明細',
      item: '項目',
      base: '算定基礎',
      employeeShare: '本人負担',
      employerShare: '会社負担',
      totalAmount: '合計額',
      whyTitle: '計算の根拠・仕組み（Why?）',
      whyStandardSalary: '標準報酬月額とは？',
      whyStandardSalaryDesc: '健康保険・厚生年金は、毎月の実際の給与額面ではなく、等級表に当てはめた「標準報酬月額」に保険料率を掛けて算出します。',
      whyChildSupport: '子ども・子育て支援金（2026年4月新設）',
      whyChildSupportDesc: '令和8年4月より、少子化対策財源として健康保険料とは別に0.23%（労使折半：各0.115%）が給与から控除されます。',
      whyCare: '介護保険料（40歳〜64歳）',
      whyCareDesc: '40歳に達した月から65歳になる前月まで、第2号被保険者として健康保険料に上乗せして徴収されます。65歳以降は市区町村が年金等から直接徴収します。',
      confidenceBadge: '公式等級表・一次情報源準拠',
    },
    vi: {
      title: 'Mô phỏng BHXH Nhật Bản (社会保険)',
      subtitle: 'Tính toán chi tiết BHYT Kyokai Kenpo, Hưu trí Phúc lợi & Thất nghiệp theo chuẩn thù lao (Năm 2026)',
      inputHeader: 'Thông tin tính toán',
      monthlySalary: 'Tiền lương gộp tháng (Gross Salary)',
      actualBonus: 'Tiền thưởng (Bonus mỗi lần, nếu có)',
      prefecture: 'Tỉnh thành công ty đóng trụ sở (Chi nhánh Kenpo)',
      age: 'Độ tuổi người lao động',
      ageHint: 'Từ 40 đến 64 tuổi sẽ đóng thêm BHYT chăm sóc người già',
      industry: 'Ngành nghề tính Bảo hiểm thất nghiệp',
      applicableDate: 'Thời điểm áp dụng',
      resultHeader: 'Kết quả tính toán',
      employeePerspective: 'Phần người lao động chịu (Khấu trừ lương)',
      employerPerspective: 'Phần công ty đóng (Chi phí người sử dụng)',
      bothPerspective: 'Cả hai / Toàn cảnh chi phí',
      standardGradeNotice: 'Mức chuẩn thù lao (標準報酬月額)',
      kenpoGradeLabel: 'BHYT Kenpo',
      pensionGradeLabel: 'Hưu trí Nenkin',
      gradeUnit: 'cấp bậc',
      monthlyTotal: 'Tổng bảo hiểm trừ hàng tháng',
      bonusTotal: 'Bảo hiểm trừ vào tiền thưởng',
      totalCost: 'Tổng chi phí nhân sự (Lương + Công ty đóng)',
      takeHomeEstimate: 'Lương thực nhận ước tính (sau trừ BHXH)',
      takeHomeHint: '※ Chưa trừ thuế thu nhập (所得税) và thuế cư trú (住民税)',
      breakdownTitle: 'Bảng chi tiết từng hạng mục bảo hiểm',
      item: 'Khoản mục',
      base: 'Mức tính chuẩn',
      employeeShare: 'Người LĐ đóng',
      employerShare: 'Công ty đóng',
      totalAmount: 'Tổng cộng',
      whyTitle: 'Cơ chế tính toán theo luật định Nhật Bản',
      whyStandardSalary: 'Mức chuẩn thù lao (標準報酬月額) là gì?',
      whyStandardSalaryDesc: 'BHYT và Hưu trí phúc lợi không nhân trực tiếp vào lương thực tế mà đối chiếu theo bảng phân cấp (Grade) chuẩn để lấy mức thù lao quy định.',
      whyChildSupport: 'Tiền hỗ trợ nuôi con 子ども・子育て支援金 (Mới từ 04/2026)',
      whyChildSupportDesc: 'Từ tháng 4/2026, Nhật Bản triển khai khoản đóng góp mới 0.23% (chia đôi: mỗi bên 0.115%) tách bạch khỏi BHYT thông thường.',
      whyCare: 'Bảo hiểm chăm sóc người già (介護保険)',
      whyCareDesc: 'Người lao động từ 40 đến 64 tuổi thuộc diện Người tham gia loại 2, đóng thêm 1.62% (chia đôi 0.81%). Từ 65 tuổi chuyển sang chính quyền địa phương thu.',
      confidenceBadge: 'Chuẩn bảng biểu chính thức Tier-1',
    },
    en: {
      title: 'Japan Social Insurance Simulator',
      subtitle: 'Statutory calculation for Health Insurance (Kyokai Kenpo), Welfare Pension & Employment Insurance (FY2026)',
      inputHeader: 'Calculation Parameters',
      monthlySalary: 'Monthly Gross Remuneration (Salary)',
      actualBonus: 'Bonus Amount (Per payment, optional)',
      prefecture: 'Prefecture (Kyokai Kenpo Branch)',
      age: 'Employee Age',
      ageHint: 'Ages 40-64 are subject to Long-term Care Insurance',
      industry: 'Employment Insurance Industry Category',
      applicableDate: 'Applicable Date',
      resultHeader: 'Simulation Summary',
      employeePerspective: 'Employee Deduction',
      employerPerspective: 'Employer Contribution',
      bothPerspective: 'Dual Perspective',
      standardGradeNotice: 'Standard Monthly Remuneration (標準報酬月額)',
      kenpoGradeLabel: 'Health Insurance',
      pensionGradeLabel: 'Welfare Pension',
      gradeUnit: 'Grade',
      monthlyTotal: 'Monthly Social Insurance Total',
      bonusTotal: 'Bonus Social Insurance Total',
      totalCost: 'Total Employment Cost (Salary + Employer Share)',
      takeHomeEstimate: 'Estimated Net Take-home (After Social Insurance)',
      takeHomeHint: '※ Before income tax and inhabitant tax withholding',
      breakdownTitle: 'Itemized Contribution Breakdown',
      item: 'Item',
      base: 'Standard Base',
      employeeShare: 'Employee',
      employerShare: 'Employer',
      totalAmount: 'Total',
      whyTitle: 'Legal Methodology & Rationale',
      whyStandardSalary: 'What is Standard Monthly Remuneration?',
      whyStandardSalaryDesc: 'Health and Pension premiums are calculated from fixed standard remuneration grades rather than exact gross monthly pay.',
      whyChildSupport: 'Child & Family Support Fund (New from April 2026)',
      whyChildSupportDesc: 'Beginning April 2026, a 0.23% contribution is levied separately from health insurance, split equally (0.115% each) between employee and employer.',
      whyCare: 'Nursing Care Insurance (Ages 40-64)',
      whyCareDesc: 'Employees aged 40 to 64 are secondary insured persons paying 1.62% (split 0.81% each). After age 65, premiums are collected directly by municipalities.',
      confidenceBadge: 'Official Statutory Table Compliant',
    },
  };

  const t = labels[lang] || labels.ja;

  const formatYen = (val) => `¥${Math.round(val || 0).toLocaleString('ja-JP')}`;

  return (
    <div className="max-w-[1240px] mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-border-subtle bg-surface-container-low p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                <Calculator className="w-5 h-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-on-surface tracking-tight">
                {t.title}
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-on-surface-variant max-w-3xl">
              {t.subtitle}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              {t.confidenceBadge}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Inputs vs Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: Inputs (4 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="rounded-2xl border border-border-subtle bg-surface p-5 space-y-4 shadow-sm">
            <h2 className="font-bold text-sm text-on-surface flex items-center gap-2 pb-2 border-b border-border-subtle">
              <Layers className="w-4 h-4 text-primary" />
              <span>{t.inputHeader}</span>
            </h2>

            {/* Monthly gross salary */}
            <div className="space-y-1.5">
              <label htmlFor="salary-input" className="block text-xs font-bold text-on-surface">
                {t.monthlySalary}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant font-bold text-sm">
                  ¥
                </span>
                <input
                  id="salary-input"
                  type="number"
                  step="10000"
                  min="0"
                  max="5000000"
                  value={monthlySalary}
                  onChange={(e) => setMonthlySalary(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full pl-8 pr-4 py-2 text-sm rounded-xl border border-border-subtle bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono font-bold"
                />
              </div>
              <div className="flex gap-1.5 mt-1 overflow-x-auto pb-1">
                {[200000, 300000, 450000, 600000, 800000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setMonthlySalary(preset)}
                    className="px-2 py-0.5 rounded-lg border border-border-subtle bg-surface-container-low hover:bg-surface-container-high text-[11px] text-on-surface-variant transition-colors shrink-0"
                  >
                    ¥{(preset / 10000).toFixed(0)}万
                  </button>
                ))}
              </div>
            </div>

            {/* Bonus */}
            <div className="space-y-1.5">
              <label htmlFor="bonus-input" className="block text-xs font-bold text-on-surface">
                {t.actualBonus}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant font-bold text-sm">
                  ¥
                </span>
                <input
                  id="bonus-input"
                  type="number"
                  step="50000"
                  min="0"
                  max="10000000"
                  value={actualBonus}
                  onChange={(e) => setActualBonus(Math.max(0, Number(e.target.value) || 0))}
                  placeholder="0"
                  className="w-full pl-8 pr-4 py-2 text-sm rounded-xl border border-border-subtle bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono"
                />
              </div>
            </div>

            {/* Prefecture */}
            <div className="space-y-1.5">
              <label htmlFor="prefecture-select" className="block text-xs font-bold text-on-surface flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                <span>{t.prefecture}</span>
              </label>
              <select
                id="prefecture-select"
                value={prefecture}
                onChange={(e) => setPrefecture(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-border-subtle bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                {PREFECTURE_LIST.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.name_ja} ({p.name_vi} / {p.name_en}) — 健保 {(p.rate2026 * 100).toFixed(2)}%
                  </option>
                ))}
              </select>
            </div>

            {/* Age */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="age-input" className="block text-xs font-bold text-on-surface flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-primary" />
                  <span>{t.age}</span>
                </label>
                <span className="text-[11px] font-mono text-on-surface-variant">{age} 歳</span>
              </div>
              <input
                id="age-input"
                type="range"
                min="18"
                max="75"
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="w-full accent-primary cursor-pointer"
              />
              <p className="text-[11px] text-on-surface-variant leading-tight">
                {t.ageHint}
              </p>
            </div>

            {/* Industry category */}
            <div className="space-y-1.5">
              <label htmlFor="industry-select" className="block text-xs font-bold text-on-surface flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-primary" />
                <span>{t.industry}</span>
              </label>
              <select
                id="industry-select"
                value={industryCategory}
                onChange={(e) => setIndustryCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-border-subtle bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                {INDUSTRY_LIST.map((ind) => (
                  <option key={ind.id} value={ind.id}>
                    {ind.name_ja} ({ind.name_vi})
                  </option>
                ))}
              </select>
            </div>

            {/* Applicable Date */}
            <div className="space-y-1.5">
              <label htmlFor="date-select" className="block text-xs font-bold text-on-surface flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                <span>{t.applicableDate}</span>
              </label>
              <select
                id="date-select"
                value={applicableDate}
                onChange={(e) => setApplicableDate(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-border-subtle bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="2026-04-01">令和8年度（2026年4月〜2027年3月）— 最新</option>
                <option value="2025-04-01">令和7年度（2025年4月〜2026年3月）— 前年度</option>
              </select>
            </div>
          </div>

          {/* Standard Remuneration Grade Card */}
          <div className="rounded-2xl border border-border-subtle bg-surface-container-low/70 p-4 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-on-surface">
              <Info className="w-4 h-4 text-primary shrink-0" />
              <span>{t.standardGradeNotice}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-surface border border-border-subtle space-y-1">
                <span className="text-[11px] text-on-surface-variant block font-medium">
                  {t.kenpoGradeLabel}
                </span>
                <div className="text-base font-black text-on-surface">
                  第{result.grades.kenpo.grade}等級
                </div>
                <div className="font-mono text-[11px] text-primary font-bold">
                  {formatYen(result.grades.kenpo.standardMonthly)}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-surface border border-border-subtle space-y-1">
                <span className="text-[11px] text-on-surface-variant block font-medium">
                  {t.pensionGradeLabel}
                </span>
                <div className="text-base font-black text-on-surface">
                  第{result.grades.pension.grade}等級
                  {result.grades.pension.isCapped && (
                    <span className="text-[9px] px-1 py-0.5 ml-1 rounded bg-amber-500/20 text-amber-800 dark:text-amber-300">
                      上限
                    </span>
                  )}
                </div>
                <div className="font-mono text-[11px] text-primary font-bold">
                  {formatYen(result.grades.pension.standardMonthly)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Results & Detailed Breakdown (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Perspective selector tabs */}
          <div className="flex items-center p-1 rounded-2xl border border-border-subtle bg-surface-container-low text-xs font-bold">
            <button
              type="button"
              onClick={() => setViewPerspective('employee')}
              className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                viewPerspective === 'employee'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>{t.employeePerspective}</span>
            </button>
            <button
              type="button"
              onClick={() => setViewPerspective('employer')}
              className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                viewPerspective === 'employer'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>{t.employerPerspective}</span>
            </button>
            <button
              type="button"
              onClick={() => setViewPerspective('both')}
              className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                viewPerspective === 'both'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{t.bothPerspective}</span>
            </button>
          </div>

          {/* Top highlight cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Primary KPI Card */}
            <div className="p-4 rounded-2xl border border-border-subtle bg-surface space-y-1.5 shadow-sm">
              <span className="text-xs text-on-surface-variant font-medium block">
                {viewPerspective === 'employer' ? '会社負担 毎月合計' : t.monthlyTotal}
              </span>
              <div className="text-2xl sm:text-3xl font-black text-on-surface font-mono">
                {formatYen(
                  viewPerspective === 'employer'
                    ? result.monthly.employerTotal
                    : viewPerspective === 'both'
                    ? result.monthly.employeeTotal + result.monthly.employerTotal
                    : result.monthly.employeeTotal
                )}
                <span className="text-xs font-normal text-on-surface-variant ml-1">/月</span>
              </div>
              <div className="text-[11px] text-on-surface-variant">
                {viewPerspective === 'employee' ? (
                  <span className="text-rose-700 dark:text-rose-300 font-medium">
                    額面の約 {((result.monthly.employeeTotal / (result.monthly.actualSalary || 1)) * 100).toFixed(1)}% が控除されます
                  </span>
                ) : (
                  <span>
                    給与額面に加えて約 {((result.monthly.employerTotal / (result.monthly.actualSalary || 1)) * 100).toFixed(1)}% の法定福利費
                  </span>
                )}
              </div>
            </div>

            {/* Secondary KPI Card */}
            <div className="p-4 rounded-2xl border border-border-subtle bg-surface space-y-1.5 shadow-sm">
              <span className="text-xs text-on-surface-variant font-medium block">
                {viewPerspective === 'employer' ? t.totalCost : t.takeHomeEstimate}
              </span>
              <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-800 dark:text-emerald-300">
                {formatYen(
                  viewPerspective === 'employer'
                    ? result.monthly.totalEmploymentCost
                    : result.monthly.netBeforeTax
                )}
                <span className="text-xs font-normal text-on-surface-variant ml-1">/月</span>
              </div>
              <p className="text-[11px] text-on-surface-variant leading-tight">
                {viewPerspective === 'employer' ? '給与総支給額＋会社負担保険料' : t.takeHomeHint}
              </p>
            </div>
          </div>

          {/* Breakdown Table */}
          <div className="rounded-2xl border border-border-subtle bg-surface overflow-hidden shadow-sm">
            <div className="p-4 border-b border-border-subtle flex items-center justify-between">
              <h3 className="font-bold text-sm text-on-surface flex items-center gap-2">
                <Calculator className="w-4 h-4 text-primary" />
                <span>{t.breakdownTitle}</span>
              </h3>
              <span className="text-[11px] text-on-surface-variant font-mono">
                {result.prefecture.name_ja} / {result.applicableDate}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-surface-container-low border-b border-border-subtle text-on-surface-variant text-[11px]">
                    <th className="p-3 font-semibold">{t.item}</th>
                    <th className="p-3 font-semibold text-right">{t.base}</th>
                    {(viewPerspective === 'employee' || viewPerspective === 'both') && (
                      <th className="p-3 font-semibold text-right text-rose-700 dark:text-rose-300">
                        {t.employeeShare}
                      </th>
                    )}
                    {(viewPerspective === 'employer' || viewPerspective === 'both') && (
                      <th className="p-3 font-semibold text-right text-blue-700 dark:text-blue-300">
                        {t.employerShare}
                      </th>
                    )}
                    <th className="p-3 font-semibold text-right">{t.totalAmount}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle text-on-surface font-mono">
                  {/* Health Insurance */}
                  <tr className="hover:bg-surface-container-low/40">
                    <td className="p-3 font-sans">
                      <div className="font-bold">{result.monthly.healthInsurance.nameJa}</div>
                      <div className="text-[10px] text-on-surface-variant font-mono">
                        {(result.monthly.healthInsurance.rate * 100).toFixed(2)}% (労使各 {(result.monthly.healthInsurance.employeeRate * 100).toFixed(3)}%)
                      </div>
                    </td>
                    <td className="p-3 text-right text-on-surface-variant">
                      {formatYen(result.monthly.healthInsurance.standardBase)}
                    </td>
                    {(viewPerspective === 'employee' || viewPerspective === 'both') && (
                      <td className="p-3 text-right font-bold text-rose-700 dark:text-rose-300">
                        {formatYen(result.monthly.healthInsurance.employee)}
                      </td>
                    )}
                    {(viewPerspective === 'employer' || viewPerspective === 'both') && (
                      <td className="p-3 text-right font-bold text-blue-800 dark:text-blue-300">
                        {formatYen(result.monthly.healthInsurance.employer)}
                      </td>
                    )}
                    <td className="p-3 text-right font-bold">
                      {formatYen(result.monthly.healthInsurance.total)}
                    </td>
                  </tr>

                  {/* Child Support Fund */}
                  <tr className="hover:bg-surface-container-low/40">
                    <td className="p-3 font-sans">
                      <div className="font-bold flex items-center gap-1.5">
                        <span>{result.monthly.childSupportFund.nameJa}</span>
                        <span className="text-[9px] px-1 rounded bg-purple-500/20 text-purple-800 dark:text-purple-300 font-sans">
                          2026年新設
                        </span>
                      </div>
                      <div className="text-[10px] text-on-surface-variant font-mono">
                        {(result.monthly.childSupportFund.rate * 100).toFixed(2)}% (労使各 {(result.monthly.childSupportFund.employeeRate * 100).toFixed(3)}%)
                      </div>
                    </td>
                    <td className="p-3 text-right text-on-surface-variant">
                      {formatYen(result.monthly.childSupportFund.standardBase)}
                    </td>
                    {(viewPerspective === 'employee' || viewPerspective === 'both') && (
                      <td className="p-3 text-right font-bold text-rose-700 dark:text-rose-300">
                        {formatYen(result.monthly.childSupportFund.employee)}
                      </td>
                    )}
                    {(viewPerspective === 'employer' || viewPerspective === 'both') && (
                      <td className="p-3 text-right font-bold text-blue-800 dark:text-blue-300">
                        {formatYen(result.monthly.childSupportFund.employer)}
                      </td>
                    )}
                    <td className="p-3 text-right font-bold">
                      {formatYen(result.monthly.childSupportFund.total)}
                    </td>
                  </tr>

                  {/* Care Insurance */}
                  <tr className="hover:bg-surface-container-low/40">
                    <td className="p-3 font-sans">
                      <div className="font-bold">{result.monthly.careInsurance.nameJa}</div>
                      <div className="text-[10px] text-on-surface-variant">
                        {result.monthly.careInsurance.categoryLabelJa}
                      </div>
                    </td>
                    <td className="p-3 text-right text-on-surface-variant">
                      {result.monthly.careInsurance.isApplicable ? formatYen(result.monthly.careInsurance.standardBase) : '-'}
                    </td>
                    {(viewPerspective === 'employee' || viewPerspective === 'both') && (
                      <td className="p-3 text-right font-bold text-rose-700 dark:text-rose-300">
                        {formatYen(result.monthly.careInsurance.employee)}
                      </td>
                    )}
                    {(viewPerspective === 'employer' || viewPerspective === 'both') && (
                      <td className="p-3 text-right font-bold text-blue-800 dark:text-blue-300">
                        {formatYen(result.monthly.careInsurance.employer)}
                      </td>
                    )}
                    <td className="p-3 text-right font-bold">
                      {formatYen(result.monthly.careInsurance.total)}
                    </td>
                  </tr>

                  {/* Welfare Pension */}
                  <tr className="hover:bg-surface-container-low/40">
                    <td className="p-3 font-sans">
                      <div className="font-bold">{result.monthly.welfarePension.nameJa}</div>
                      <div className="text-[10px] text-on-surface-variant font-mono">
                        18.30% (労使各 9.15%)
                      </div>
                    </td>
                    <td className="p-3 text-right text-on-surface-variant">
                      {formatYen(result.monthly.welfarePension.standardBase)}
                    </td>
                    {(viewPerspective === 'employee' || viewPerspective === 'both') && (
                      <td className="p-3 text-right font-bold text-rose-700 dark:text-rose-300">
                        {formatYen(result.monthly.welfarePension.employee)}
                      </td>
                    )}
                    {(viewPerspective === 'employer' || viewPerspective === 'both') && (
                      <td className="p-3 text-right font-bold text-blue-800 dark:text-blue-300">
                        {formatYen(result.monthly.welfarePension.employer)}
                      </td>
                    )}
                    <td className="p-3 text-right font-bold">
                      {formatYen(result.monthly.welfarePension.total)}
                    </td>
                  </tr>

                  {/* Employment Insurance */}
                  <tr className="hover:bg-surface-container-low/40">
                    <td className="p-3 font-sans">
                      <div className="font-bold">{result.monthly.employmentInsurance.nameJa}</div>
                      <div className="text-[10px] text-on-surface-variant font-mono">
                        本人 {(result.monthly.employmentInsurance.employeeRate * 1000).toFixed(1)}/1000 ・ 会社 {(result.monthly.employmentInsurance.employerRate * 1000).toFixed(1)}/1000
                      </div>
                    </td>
                    <td className="p-3 text-right text-on-surface-variant">
                      {formatYen(result.monthly.employmentInsurance.actualBase)}
                    </td>
                    {(viewPerspective === 'employee' || viewPerspective === 'both') && (
                      <td className="p-3 text-right font-bold text-rose-700 dark:text-rose-300">
                        {formatYen(result.monthly.employmentInsurance.employee)}
                      </td>
                    )}
                    {(viewPerspective === 'employer' || viewPerspective === 'both') && (
                      <td className="p-3 text-right font-bold text-blue-800 dark:text-blue-300">
                        {formatYen(result.monthly.employmentInsurance.employer)}
                      </td>
                    )}
                    <td className="p-3 text-right font-bold">
                      {formatYen(result.monthly.employmentInsurance.total)}
                    </td>
                  </tr>

                  {/* Child Welfare Contribution (Employer only) */}
                  <tr className="hover:bg-surface-container-low/40 bg-surface-container-low/20">
                    <td className="p-3 font-sans">
                      <div className="font-bold flex items-center gap-1.5">
                        <span>{result.monthly.childWelfareContribution.nameJa}</span>
                        <span className="text-[9px] px-1 rounded bg-blue-500/20 text-blue-800 dark:text-blue-300 font-sans">
                          会社全額負担
                        </span>
                      </div>
                      <div className="text-[10px] text-on-surface-variant font-mono">
                        0.36%（本人負担 0円）
                      </div>
                    </td>
                    <td className="p-3 text-right text-on-surface-variant">
                      {formatYen(result.monthly.childWelfareContribution.standardBase)}
                    </td>
                    {(viewPerspective === 'employee' || viewPerspective === 'both') && (
                      <td className="p-3 text-right font-medium text-on-surface-variant">
                        ¥0
                      </td>
                    )}
                    {(viewPerspective === 'employer' || viewPerspective === 'both') && (
                      <td className="p-3 text-right font-bold text-blue-800 dark:text-blue-300">
                        {formatYen(result.monthly.childWelfareContribution.employer)}
                      </td>
                    )}
                    <td className="p-3 text-right font-bold">
                      {formatYen(result.monthly.childWelfareContribution.total)}
                    </td>
                  </tr>
                </tbody>

                {/* Table Footer: Totals */}
                <tfoot>
                  <tr className="bg-surface-container-high font-bold border-t-2 border-border-subtle">
                    <td className="p-3 font-sans">毎月合計</td>
                    <td className="p-3 text-right text-on-surface-variant">-</td>
                    {(viewPerspective === 'employee' || viewPerspective === 'both') && (
                      <td className="p-3 text-right text-rose-700 dark:text-rose-300 text-sm">
                        {formatYen(result.monthly.employeeTotal)}
                      </td>
                    )}
                    {(viewPerspective === 'employer' || viewPerspective === 'both') && (
                      <td className="p-3 text-right text-blue-800 dark:text-blue-300 text-sm">
                        {formatYen(result.monthly.employerTotal)}
                      </td>
                    )}
                    <td className="p-3 text-right text-sm">
                      {formatYen(result.monthly.employeeTotal + result.monthly.employerTotal)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Bonus summary if active */}
          {result.bonus && (
            <div className="rounded-2xl border border-border-subtle bg-surface p-4 space-y-2 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-on-surface flex items-center gap-1.5">
                  <TrendingDown className="w-4 h-4 text-primary" />
                  <span>賞与支給時の社会保険料控除（額面: {formatYen(result.bonus.actualBonus)}）</span>
                </span>
                <span className="font-mono text-xs font-bold text-rose-700 dark:text-rose-300">
                  {formatYen(result.bonus.employeeTotal)}
                </span>
              </div>
              <p className="text-[11px] text-on-surface-variant">
                健保賞与上限（年間573万円）および厚生年金賞与上限（1回150万円、1,000円未満切捨）を適用して算出しています。
              </p>
            </div>
          )}

          {/* "Why?" Educational section */}
          <div className="rounded-2xl border border-border-subtle bg-surface-container-low p-5 space-y-3">
            <h3 className="font-bold text-xs text-on-surface flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-primary" />
              <span>{t.whyTitle}</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-surface border border-border-subtle space-y-1">
                <div className="font-bold text-on-surface flex items-center gap-1">
                  <ArrowRight className="w-3.5 h-3.5 text-primary" />
                  <span>{t.whyStandardSalary}</span>
                </div>
                <p className="text-on-surface-variant leading-relaxed">
                  {t.whyStandardSalaryDesc}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-surface border border-border-subtle space-y-1">
                <div className="font-bold text-on-surface flex items-center gap-1">
                  <ArrowRight className="w-3.5 h-3.5 text-primary" />
                  <span>{t.whyChildSupport}</span>
                </div>
                <p className="text-on-surface-variant leading-relaxed">
                  {t.whyChildSupportDesc}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-surface border border-border-subtle space-y-1">
                <div className="font-bold text-on-surface flex items-center gap-1">
                  <ArrowRight className="w-3.5 h-3.5 text-primary" />
                  <span>{t.whyCare}</span>
                </div>
                <p className="text-on-surface-variant leading-relaxed">
                  {t.whyCareDesc}
                </p>
              </div>
            </div>
          </div>

          {/* Official Statutory Sources Section */}
          <RegulatorySourceView
            sourceIds={result.disclosures.officialSources}
            era="令和8年度（2026年）"
            applicablePeriodText="令和8年4月1日〜令和9年3月31日"
            lastVerified="2026-09-10"
            disclaimer={result.disclosures.disclosureJa}
            lang={lang}
          />
        </div>
      </div>
    </div>
  );
}
