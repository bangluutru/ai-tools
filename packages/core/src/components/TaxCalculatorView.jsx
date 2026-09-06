import React, { useState, useMemo } from 'react';
import {
  Calculator,
  ShieldCheck,
  ArrowRightLeft,
  Users,
  Briefcase,
  Building2,
  TrendingUp,
  FileText,
  Download,
  Printer,
  RotateCcw,
  CheckCircle2,
  Info,
  ChevronDown,
  ChevronUp,
  Sliders,
  Sparkles,
  DollarSign,
  Receipt,
  HelpCircle,
  Clock,
  ExternalLink
} from 'lucide-react';
import {
  calculateGrossToNet,
  calculateNetToGross,
  calculateFreelancerTax,
  calculateBhxhLumpSum,
  calculateBhtn,
  calculateAssetTax,
  formatVND,
  TAX_CONSTANTS_2026
} from '../utils/tax/taxEngine.js';
import { taxI18n } from '../utils/tax/taxI18n.js';
import { exportTaxBreakdownToCsv } from '../utils/tax/exportTaxReport.js';

export default function TaxCalculatorView({ displayLang = 'vi' }) {
  const t = taxI18n[displayLang] || taxI18n.vi;

  // Active Main Tab
  const [activeTab, setActiveTab] = useState('gross-net'); // 'gross-net' | 'freelancer' | 'bhxh' | 'assets' | 'sop'

  // Tab 1: Gross ↔ Net State
  const [calcMode, setCalcMode] = useState('grossToNet'); // 'grossToNet' | 'netToGross'
  const [salaryInput, setSalaryInput] = useState(25_000_000);
  const [salaryDisplay, setSalaryDisplay] = useState('25,000,000');
  const [region, setRegion] = useState(1);
  const [dependents, setDependents] = useState(1);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [voluntaryPension, setVoluntaryPension] = useState(0);
  const [medicalMonthly, setMedicalMonthly] = useState(0);
  const [educationMonthly, setEducationMonthly] = useState(0);
  const [mealAllowance, setMealAllowance] = useState(0);

  // Tab 2: Freelancer State
  const [flRevenueInput, setFlRevenueInput] = useState(800_000_000);
  const [flRevenueDisplay, setFlRevenueDisplay] = useState('800,000,000');
  const [flBusinessType, setFlBusinessType] = useState('service');
  const [flTransactions, setFlTransactions] = useState([
    { id: 1, amount: 12_000_000, label: 'Doanh nghiệp A (Hợp đồng dịch vụ)' },
    { id: 2, amount: 4_500_000, label: 'Doanh nghiệp B (Hợp tác vãng lai)' },
    { id: 3, amount: 6_000_000, label: 'Doanh nghiệp C (Quảng cáo, booking)' }
  ]);
  const [newTxAmount, setNewTxAmount] = useState('');
  const [newTxLabel, setNewTxLabel] = useState('');

  // Tab 3: BHXH 1 Lần & BHTN State
  const [bhxhAvgSalary, setBhxhAvgSalary] = useState(15_000_000);
  const [bhxhAvgSalaryDisplay, setBhxhAvgSalaryDisplay] = useState('15,000,000');
  const [yearsBefore2014, setYearsBefore2014] = useState(2);
  const [yearsFrom2014, setYearsFrom2014] = useState(6);

  // BHTN State
  const [bhtnAvgSalary, setBhtnAvgSalary] = useState(18_000_000);
  const [bhtnAvgSalaryDisplay, setBhtnAvgSalaryDisplay] = useState('18,000,000');
  const [bhtnRegion, setBhtnRegion] = useState(1);
  const [bhtnMonthsContributed, setBhtnMonthsContributed] = useState(48);

  // Tab 4: BĐS & Phái sinh State
  const [rePrice, setRePrice] = useState(3_000_000_000);
  const [rePriceDisplay, setRePriceDisplay] = useState('3,000,000,000');
  const [isSoleProperty, setIsSoleProperty] = useState(false);
  const [isFamilyTransfer, setIsFamilyTransfer] = useState(false);
  const [derivativeValue, setDerivativeValue] = useState(500_000_000);
  const [derivativeDisplay, setDerivativeDisplay] = useState('500,000,000');

  // Format input with thousand commas
  const handleSalaryChange = (valStr) => {
    const rawNumber = Number(valStr.replace(/[^0-9]/g, '')) || 0;
    setSalaryInput(rawNumber);
    setSalaryDisplay(new Intl.NumberFormat('vi-VN').format(rawNumber));
  };

  const handleFlRevenueChange = (valStr) => {
    const rawNumber = Number(valStr.replace(/[^0-9]/g, '')) || 0;
    setFlRevenueInput(rawNumber);
    setFlRevenueDisplay(new Intl.NumberFormat('vi-VN').format(rawNumber));
  };

  const handleBhxhAvgChange = (valStr) => {
    const rawNumber = Number(valStr.replace(/[^0-9]/g, '')) || 0;
    setBhxhAvgSalary(rawNumber);
    setBhxhAvgSalaryDisplay(new Intl.NumberFormat('vi-VN').format(rawNumber));
  };

  const handleBhtnAvgChange = (valStr) => {
    const rawNumber = Number(valStr.replace(/[^0-9]/g, '')) || 0;
    setBhtnAvgSalary(rawNumber);
    setBhtnAvgSalaryDisplay(new Intl.NumberFormat('vi-VN').format(rawNumber));
  };

  const handleRePriceChange = (valStr) => {
    const rawNumber = Number(valStr.replace(/[^0-9]/g, '')) || 0;
    setRePrice(rawNumber);
    setRePriceDisplay(new Intl.NumberFormat('vi-VN').format(rawNumber));
  };

  const handleDerivativeChange = (valStr) => {
    const rawNumber = Number(valStr.replace(/[^0-9]/g, '')) || 0;
    setDerivativeValue(rawNumber);
    setDerivativeDisplay(new Intl.NumberFormat('vi-VN').format(rawNumber));
  };

  // Add transaction to freelancer list
  const handleAddTx = () => {
    const amt = Number(newTxAmount.replace(/[^0-9]/g, '')) || 0;
    if (amt <= 0) return;
    setFlTransactions(prev => [
      ...prev,
      {
        id: Date.now(),
        amount: amt,
        label: newTxLabel.trim() || `Khoản nhận ${prev.length + 1}`
      }
    ]);
    setNewTxAmount('');
    setNewTxLabel('');
  };

  const handleRemoveTx = (id) => {
    setFlTransactions(prev => prev.filter(tx => tx.id !== id));
  };

  // Calculate Tab 1: Gross ↔ Net
  const grossNetResult = useMemo(() => {
    const options = {
      region,
      dependents,
      voluntaryPension,
      medicalMonthly,
      educationMonthly,
      mealAllowance
    };

    if (calcMode === 'grossToNet') {
      return calculateGrossToNet(salaryInput, options);
    } else {
      return calculateNetToGross(salaryInput, options);
    }
  }, [calcMode, salaryInput, region, dependents, voluntaryPension, medicalMonthly, educationMonthly, mealAllowance]);

  // Calculate Tab 2: Freelancer
  const flResult = useMemo(() => {
    return calculateFreelancerTax({
      annualRevenue: flRevenueInput,
      singleTransactions: flTransactions,
      businessType: flBusinessType
    });
  }, [flRevenueInput, flTransactions, flBusinessType]);

  // Calculate Tab 3: BHXH 1 Lần
  const bhxhResult = useMemo(() => {
    return calculateBhxhLumpSum({
      yearsBefore2014,
      yearsFrom2014,
      averageSalary: bhxhAvgSalary
    });
  }, [yearsBefore2014, yearsFrom2014, bhxhAvgSalary]);

  // Calculate Tab 3: BHTN
  const bhtnResult = useMemo(() => {
    return calculateBhtn({
      averageSalary6Months: bhtnAvgSalary,
      region: bhtnRegion,
      totalContributionMonths: bhtnMonthsContributed
    });
  }, [bhtnAvgSalary, bhtnRegion, bhtnMonthsContributed]);

  // Calculate Tab 4: BĐS & Phái sinh
  const assetResult = useMemo(() => {
    return calculateAssetTax({
      realEstatePrice: rePrice,
      isSolePropertyOver183Days: isSoleProperty,
      isDirectFamilyTransfer: isFamilyTransfer,
      derivativeContractValue: derivativeValue
    });
  }, [rePrice, isSoleProperty, isFamilyTransfer, derivativeValue]);

  // Visual breakdown percentages for Visual Bar
  const breakdownPercentages = useMemo(() => {
    const gross = grossNetResult.gross || 1;
    const netPct = Math.min(100, Math.max(0, (grossNetResult.net / gross) * 100));
    const insPct = Math.min(100, Math.max(0, (grossNetResult.totalInsurance / gross) * 100));
    const taxPct = Math.min(100, Math.max(0, (grossNetResult.pitTax / gross) * 100));
    return {
      net: netPct.toFixed(1),
      insurance: insPct.toFixed(1),
      tax: taxPct.toFixed(1)
    };
  }, [grossNetResult]);

  // Reset to default
  const handleReset = () => {
    setSalaryInput(25_000_000);
    setSalaryDisplay('25,000,000');
    setRegion(1);
    setDependents(1);
    setVoluntaryPension(0);
    setMedicalMonthly(0);
    setEducationMonthly(0);
    setMealAllowance(0);
    setShowAdvanced(false);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full flex flex-col gap-6 text-on-surface">
      {/* TIER 1: CONTEXT HEADER & BADGE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-surface-container-high text-primary border border-border-subtle flex items-center justify-center shrink-0 shadow-sm">
            <Calculator size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-on-surface">
                {t.appTitle}
              </h1>
              <span className="px-2 py-0.5 text-[11px] font-bold tracking-wider rounded-md bg-primary text-on-primary shadow-xs">
                2026 READY
              </span>
            </div>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
              {t.appSubtitle}
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            type="button"
            onClick={() => exportTaxBreakdownToCsv(grossNetResult, displayLang)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-surface-subtle hover:bg-surface-container-high border border-border-subtle text-on-surface transition-colors cursor-pointer"
            title={t.exportExcelBtn}
          >
            <Download size={14} className="text-primary" />
            <span className="hidden md:inline">{t.exportExcelBtn}</span>
            <span className="md:hidden">Excel</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-surface-subtle hover:bg-surface-container-high border border-border-subtle text-on-surface transition-colors cursor-pointer"
            title={t.printReportBtn}
          >
            <Printer size={14} />
            <span className="hidden md:inline">{t.printReportBtn}</span>
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-surface-subtle hover:bg-surface-container-high border border-border-subtle text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
            title={t.resetBtn}
          >
            <RotateCcw size={14} />
            <span className="hidden md:inline">{t.resetBtn}</span>
          </button>
        </div>
      </div>

      {/* PRIVACY 1-LINE BADGE */}
      <div className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-surface-container border border-border-subtle/60 text-xs text-on-surface-variant">
        <ShieldCheck size={16} className="text-secondary shrink-0" />
        <span>{t.privacyNotice}</span>
      </div>

      {/* NAVIGATION TABS (5 Modules) */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-surface-container border border-border-subtle overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab('gross-net')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'gross-net'
              ? 'bg-primary-container text-on-primary-container font-semibold shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-subtle'
          }`}
        >
          <DollarSign size={16} />
          <span>{t.tabGrossNet}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('freelancer')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'freelancer'
              ? 'bg-primary-container text-on-primary-container font-semibold shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-subtle'
          }`}
        >
          <Briefcase size={16} />
          <span>{t.tabFreelancer}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('bhxh')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'bhxh'
              ? 'bg-primary-container text-on-primary-container font-semibold shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-subtle'
          }`}
        >
          <Clock size={16} />
          <span>{t.tabBhxh}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('assets')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'assets'
              ? 'bg-primary-container text-on-primary-container font-semibold shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-subtle'
          }`}
        >
          <Building2 size={16} />
          <span>{t.tabAssets}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sop')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'sop'
              ? 'bg-primary-container text-on-primary-container font-semibold shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-subtle'
          }`}
        >
          <HelpCircle size={16} />
          <span>{t.tabSop}</span>
        </button>
      </div>

      {/* =========================================================================
          TAB 1: LƯƠNG GROSS ↔ NET (MODULE CHÍNH)
          ========================================================================= */}
      {activeTab === 'gross-net' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* TIER 2: SETUP & INPUTS (4.5 COLS) */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            <div className="p-5 rounded-2xl bg-surface-container border border-border-subtle flex flex-col gap-4 shadow-sm">
              {/* Mode Switcher: Gross -> Net vs Net -> Gross */}
              <div className="flex gap-1.5 p-1 rounded-xl bg-surface-container-high border border-border-subtle/70">
                <button
                  type="button"
                  onClick={() => setCalcMode('grossToNet')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold text-center transition-all cursor-pointer ${
                    calcMode === 'grossToNet'
                      ? 'bg-primary-container text-on-primary-container shadow-xs'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Gross → Net
                </button>
                <button
                  type="button"
                  onClick={() => setCalcMode('netToGross')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold text-center transition-all cursor-pointer ${
                    calcMode === 'netToGross'
                      ? 'bg-primary-container text-on-primary-container shadow-xs'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Net → Gross
                </button>
              </div>

              {/* Salary Input */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-xs">
                  <label htmlFor="tax-salary-input" className="font-semibold text-on-surface">
                    {calcMode === 'grossToNet' ? t.grossSalaryLabel : t.netSalaryLabel}
                  </label>
                  <span className="font-mono text-primary font-bold">{formatVND(salaryInput)}</span>
                </div>
                <div className="relative">
                  <input
                    id="tax-salary-input"
                    type="text"
                    value={salaryDisplay}
                    onChange={(e) => handleSalaryChange(e.target.value)}
                    placeholder={t.placeholderSalary}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-high border border-border-subtle text-on-surface font-mono font-bold text-base sm:text-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all pr-12"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-on-surface-variant">
                    VNĐ
                  </span>
                </div>

                {/* Quick select presets */}
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {[15_000_000, 25_000_000, 35_000_000, 50_000_000, 80_000_000].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => {
                        setSalaryInput(amt);
                        setSalaryDisplay(new Intl.NumberFormat('vi-VN').format(amt));
                      }}
                      className={`px-2.5 py-1 text-[11px] font-mono rounded-md border transition-all cursor-pointer ${
                        salaryInput === amt
                          ? 'bg-primary border-primary text-on-primary font-bold shadow-xs'
                          : 'bg-surface-subtle border-border-subtle/70 text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      {amt / 1_000_000}tr
                    </button>
                  ))}
                </div>
              </div>

              {/* Region Selector */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="tax-region-select" className="text-xs font-semibold text-on-surface">
                  {t.regionLabel}
                </label>
                <select
                  id="tax-region-select"
                  value={region}
                  onChange={(e) => setRegion(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-surface-container-high border border-border-subtle text-on-surface text-xs sm:text-sm focus:outline-none focus:border-primary cursor-pointer"
                >
                  <option value={1}>Vùng I (Hà Nội, TP.HCM...) - Lương TT: 5.310.000 ₫ (Trần: 106.2tr)</option>
                  <option value={2}>Vùng II (Đô thị loại II, TP tỉnh) - Lương TT: 4.730.000 ₫ (Trần: 94.6tr)</option>
                  <option value={3}>Vùng III (Huyện, thị xã ngoại ô) - Lương TT: 4.140.000 ₫ (Trần: 82.8tr)</option>
                  <option value={4}>Vùng IV (Các địa bàn còn lại) - Lương TT: 3.700.000 ₫ (Trần: 74tr)</option>
                </select>
              </div>

              {/* Dependents Counter */}
              <div className="flex justify-between items-center p-3 rounded-xl bg-surface-container-high border border-border-subtle/70">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-on-surface flex items-center gap-1.5">
                    <Users size={14} className="text-primary" />
                    {t.dependentsLabel}
                  </span>
                  <span className="text-[11px] text-on-surface-variant">
                    {t.dependentsHint}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDependents(prev => Math.max(0, prev - 1))}
                    disabled={dependents <= 0}
                    className="w-8 h-8 rounded-lg bg-surface-subtle border border-border-subtle text-on-surface font-bold text-sm flex items-center justify-center hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    -
                  </button>
                  <span className="font-mono font-bold text-sm w-6 text-center text-on-surface">
                    {dependents}
                  </span>
                  <button
                    type="button"
                    onClick={() => setDependents(prev => prev + 1)}
                    className="w-8 h-8 rounded-lg bg-surface-subtle border border-border-subtle text-on-surface font-bold text-sm flex items-center justify-center hover:bg-surface-container cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Personal Deduction Info Chip */}
              <div className="flex justify-between items-center px-3 py-2 rounded-xl bg-surface-container-high border border-border-subtle/50 text-xs">
                <span className="text-on-surface-variant">{t.personalDeductionLabel}</span>
                <span className="font-mono font-semibold text-on-surface">{t.personalDeductionValue}</span>
              </div>

              {/* Collapsible Advanced Deductions (New in 2026) */}
              <div className="border-t border-border-subtle/60 pt-3 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(prev => !prev)}
                  className="flex items-center justify-between text-xs font-semibold text-primary hover:underline cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <Sliders size={14} />
                    {t.advancedDeductionsToggle}
                  </span>
                  {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {showAdvanced && (
                  <div className="flex flex-col gap-3 p-3 rounded-xl bg-surface-subtle/50 border border-border-subtle/70 text-xs">
                    {/* Voluntary Pension */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between">
                        <label htmlFor="tax-voluntary-pension" className="font-medium text-on-surface">
                          {t.voluntaryPensionLabel}
                        </label>
                        <span className="font-mono text-on-surface font-semibold">{formatVND(voluntaryPension)}</span>
                      </div>
                      <input
                        id="tax-voluntary-pension"
                        type="range"
                        min="0"
                        max={TAX_CONSTANTS_2026.DEDUCTIONS.MAX_VOLUNTARY_PENSION}
                        step="500000"
                        value={voluntaryPension}
                        onChange={(e) => setVoluntaryPension(Number(e.target.value))}
                        className="w-full accent-primary cursor-pointer"
                      />
                      <span className="text-[10px] text-on-surface-variant">{t.voluntaryPensionHint}</span>
                    </div>

                    {/* Medical */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between">
                        <label htmlFor="tax-medical-monthly" className="font-medium text-on-surface">
                          {t.medicalLabel}
                        </label>
                        <span className="font-mono text-on-surface font-semibold">{formatVND(medicalMonthly)}</span>
                      </div>
                      <input
                        id="tax-medical-monthly"
                        type="range"
                        min="0"
                        max={Math.round(TAX_CONSTANTS_2026.DEDUCTIONS.MAX_MEDICAL_ANNUAL / 12)}
                        step="200000"
                        value={medicalMonthly}
                        onChange={(e) => setMedicalMonthly(Number(e.target.value))}
                        className="w-full accent-primary cursor-pointer"
                      />
                      <span className="text-[10px] text-on-surface-variant">{t.medicalHint}</span>
                    </div>

                    {/* Education */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between">
                        <label htmlFor="tax-education-monthly" className="font-medium text-on-surface">
                          {t.educationLabel}
                        </label>
                        <span className="font-mono text-on-surface font-semibold">{formatVND(educationMonthly)}</span>
                      </div>
                      <input
                        id="tax-education-monthly"
                        type="range"
                        min="0"
                        max={Math.round(TAX_CONSTANTS_2026.DEDUCTIONS.MAX_EDUCATION_ANNUAL / 12)}
                        step="200000"
                        value={educationMonthly}
                        onChange={(e) => setEducationMonthly(Number(e.target.value))}
                        className="w-full accent-primary cursor-pointer"
                      />
                      <span className="text-[10px] text-on-surface-variant">{t.educationHint}</span>
                    </div>

                    {/* Meal Allowance */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between">
                        <label htmlFor="tax-meal-allowance" className="font-medium text-on-surface">
                          {t.mealAllowanceLabel}
                        </label>
                        <span className="font-mono text-on-surface font-semibold">{formatVND(mealAllowance)}</span>
                      </div>
                      <input
                        id="tax-meal-allowance"
                        type="range"
                        min="0"
                        max={TAX_CONSTANTS_2026.DEDUCTIONS.MAX_NON_TAXABLE_MEAL}
                        step="100000"
                        value={mealAllowance}
                        onChange={(e) => setMealAllowance(Number(e.target.value))}
                        className="w-full accent-primary cursor-pointer"
                      />
                      <span className="text-[10px] text-on-surface-variant">{t.mealAllowanceHint}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* TIER 3: RESULT & VISUAL STAGE (7.5 COLS) */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            {/* HERO STAT CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Card 1: Net Salary */}
              <div className="p-5 rounded-2xl bg-surface-container border border-border-subtle flex flex-col justify-between gap-3 shadow-sm relative overflow-hidden">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold uppercase tracking-wider text-secondary">
                    {t.netSalaryLabel}
                  </span>
                  <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-secondary text-on-secondary">
                    THỰC NHẬN
                  </span>
                </div>
                <div className="font-mono font-extrabold text-2xl sm:text-3xl text-on-surface tracking-tight">
                  {formatVND(grossNetResult.net)}
                </div>
                <div className="text-xs text-on-surface-variant flex items-center gap-1">
                  <span>Chiếm</span>
                  <span className="font-mono font-bold text-on-surface">{breakdownPercentages.net}%</span>
                  <span>tổng thu nhập thỏa thuận</span>
                </div>
              </div>

              {/* Card 2: PIT Tax Due */}
              <div className="p-5 rounded-2xl bg-surface-container border border-border-subtle flex flex-col justify-between gap-3 shadow-sm relative overflow-hidden">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold uppercase tracking-wider text-tertiary">
                    {t.pitTaxLabel}
                  </span>
                  <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-tertiary/15 text-tertiary border border-tertiary/30">
                    5 BẬC 2026
                  </span>
                </div>
                <div className="font-mono font-extrabold text-2xl sm:text-3xl text-on-surface tracking-tight">
                  {formatVND(grossNetResult.pitTax)}
                </div>
                <div className="text-xs text-on-surface-variant flex items-center justify-between">
                  <span>{t.effectiveRateLabel}:</span>
                  <span className="font-mono font-bold text-tertiary">{grossNetResult.effectiveTaxRate}%</span>
                </div>
              </div>
            </div>

            {/* VISUAL BREAKDOWN BAR */}
            <div className="p-4 rounded-2xl bg-surface-container border border-border-subtle flex flex-col gap-3 shadow-sm">
              <div className="flex justify-between items-center text-xs font-semibold text-on-surface">
                <span>Cơ cấu phân bổ lương Gross ({formatVND(grossNetResult.gross)})</span>
                <span className="font-mono text-on-surface-variant">100%</span>
              </div>
              
              {/* Stacked Progress Bar */}
              <div className="h-4 w-full rounded-full bg-surface-subtle overflow-hidden flex">
                <div
                  style={{ width: `${breakdownPercentages.net}%` }}
                  className="h-full bg-secondary transition-all duration-300"
                  title={`Net: ${breakdownPercentages.net}%`}
                />
                <div
                  style={{ width: `${breakdownPercentages.insurance}%` }}
                  className="h-full bg-primary transition-all duration-300"
                  title={`Bảo hiểm: ${breakdownPercentages.insurance}%`}
                />
                <div
                  style={{ width: `${breakdownPercentages.tax}%` }}
                  className="h-full bg-tertiary transition-all duration-300"
                  title={`Thuế TNCN: ${breakdownPercentages.tax}%`}
                />
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-secondary" />
                  <span className="text-on-surface-variant">Lương Net ({breakdownPercentages.net}%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  <span className="text-on-surface-variant">Bảo hiểm 10,5% ({breakdownPercentages.insurance}%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-tertiary" />
                  <span className="text-on-surface-variant">Thuế TNCN ({breakdownPercentages.tax}%)</span>
                </div>
              </div>
            </div>

            {/* PROGRESSIVE TAX 5-TIER BREAKDOWN TABLE */}
            <div className="p-5 rounded-2xl bg-surface-container border border-border-subtle flex flex-col gap-3 shadow-sm">
              <div className="flex justify-between items-center pb-2 border-b border-border-subtle">
                <div className="flex items-center gap-2">
                  <Receipt size={16} className="text-primary" />
                  <h2 className="text-sm font-bold text-on-surface">
                    {t.breakdownTitle}
                  </h2>
                </div>
                <div className="text-xs text-on-surface-variant">
                  Thu nhập tính thuế: <span className="font-mono font-bold text-on-surface">{formatVND(grossNetResult.taxableIncome)}</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-border-subtle text-on-surface-variant font-semibold">
                      <th className="py-2 px-2">{t.colBracket}</th>
                      <th className="py-2 px-2">{t.colRange}</th>
                      <th className="py-2 px-2 text-center">{t.colRate}</th>
                      <th className="py-2 px-2 text-right">{t.colTaxableAmount}</th>
                      <th className="py-2 px-2 text-right">{t.colTaxAmount}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle/50 font-mono">
                    {grossNetResult.taxBreakdown.map((b) => (
                      <tr
                        key={b.tier}
                        className={b.taxAmount > 0 ? 'bg-surface-subtle font-semibold text-on-surface' : 'text-on-surface-variant'}
                      >
                        <td className="py-2 px-2 font-sans font-semibold text-on-surface">
                          Bậc {b.tier}
                        </td>
                        <td className="py-2 px-2 font-sans">{b.label}</td>
                        <td className="py-2 px-2 text-center font-bold text-primary">
                          {(b.rate * 100).toFixed(0)}%
                        </td>
                        <td className="py-2 px-2 text-right">
                          {formatVND(b.taxableAmount)}
                        </td>
                        <td className="py-2 px-2 text-right font-bold text-on-surface">
                          {formatVND(b.taxAmount)}
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-border-subtle font-bold bg-surface-subtle/60 text-on-surface">
                      <td colSpan={4} className="py-2.5 px-2 font-sans text-right">
                        Tổng thuế TNCN phải nộp:
                      </td>
                      <td className="py-2.5 px-2 text-right text-tertiary text-sm">
                        {formatVND(grossNetResult.pitTax)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* MANDATORY INSURANCE DETAILS */}
            <div className="p-4 rounded-2xl bg-surface-container border border-border-subtle flex flex-col gap-3 shadow-sm text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-border-subtle">
                <span className="font-bold text-on-surface flex items-center gap-1.5">
                  <ShieldCheck size={16} className="text-secondary" />
                  {t.insuranceBreakdownTitle}
                </span>
                <span className="font-mono font-bold text-primary text-sm">
                  {formatVND(grossNetResult.totalInsurance)}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono">
                <div className="p-2.5 rounded-xl bg-surface-container-high border border-border-subtle/50 flex flex-col gap-1">
                  <span className="text-[11px] font-sans text-on-surface-variant">{t.bhxhItem}</span>
                  <span className="font-bold text-on-surface text-sm">{formatVND(grossNetResult.insuranceDetails.bhxh)}</span>
                  {grossNetResult.insuranceDetails.isBhxhCapped && (
                    <span className="text-[10px] text-tertiary font-sans">Đạt trần 50,6tr</span>
                  )}
                </div>
                <div className="p-2.5 rounded-xl bg-surface-container-high border border-border-subtle/50 flex flex-col gap-1">
                  <span className="text-[11px] font-sans text-on-surface-variant">{t.bhytItem}</span>
                  <span className="font-bold text-on-surface text-sm">{formatVND(grossNetResult.insuranceDetails.bhyt)}</span>
                  {grossNetResult.insuranceDetails.isBhxhCapped && (
                    <span className="text-[10px] text-tertiary font-sans">Đạt trần 50,6tr</span>
                  )}
                </div>
                <div className="p-2.5 rounded-xl bg-surface-container-high border border-border-subtle/50 flex flex-col gap-1">
                  <span className="text-[11px] font-sans text-on-surface-variant">{t.bhtnItem}</span>
                  <span className="font-bold text-on-surface text-sm">{formatVND(grossNetResult.insuranceDetails.bhtn)}</span>
                  {grossNetResult.insuranceDetails.isBhtnCapped && (
                    <span className="text-[10px] text-tertiary font-sans">Đạt trần vùng</span>
                  )}
                </div>
              </div>
              <div className="text-[11px] text-on-surface-variant flex flex-col gap-0.5 pt-1">
                <span>• {t.bhxhCapNote}</span>
                <span>• {t.bhtnCapNote}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: FREELANCER / KOL / BÁN HÀNG ONLINE (1 TỶ MIỄN THUẾ)
          ========================================================================= */}
      {activeTab === 'freelancer' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 flex flex-col gap-5">
            <div className="p-5 rounded-2xl bg-surface-container border border-border-subtle flex flex-col gap-4 shadow-sm">
              <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
                <Briefcase size={18} className="text-primary" />
                {t.flTitle}
              </h2>

              {/* Annual Revenue */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="tax-fl-revenue-input" className="text-xs font-semibold text-on-surface">
                  {t.flRevenueLabel}
                </label>
                <div className="relative">
                  <input
                    id="tax-fl-revenue-input"
                    type="text"
                    value={flRevenueDisplay}
                    onChange={(e) => handleFlRevenueChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-high border border-border-subtle text-on-surface font-mono font-bold text-base focus:outline-none focus:border-primary pr-12"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-on-surface-variant">
                    VNĐ/năm
                  </span>
                </div>
              </div>

              {/* Business Type */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="tax-fl-business-type-select" className="text-xs font-semibold text-on-surface">
                  {t.flBusinessTypeLabel}
                </label>
                <select
                  id="tax-fl-business-type-select"
                  value={flBusinessType}
                  onChange={(e) => setFlBusinessType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-container-high border border-border-subtle text-on-surface text-xs focus:outline-none focus:border-primary cursor-pointer"
                >
                  <option value="service">{t.flServices}</option>
                  <option value="goods">{t.flGoods}</option>
                  <option value="manufacturing">{t.flManufacturing}</option>
                  <option value="rental">{t.flRental}</option>
                </select>
              </div>

              {/* Transactions list */}
              <div className="border-t border-border-subtle/60 pt-4 flex flex-col gap-3">
                <span className="text-xs font-bold text-on-surface">
                  {t.flTransactionsTitle}
                </span>

                <div className="flex flex-col gap-2 max-h-52 overflow-y-auto pr-1">
                  {flTransactions.map(tx => {
                    const isWithheld = tx.amount >= TAX_CONSTANTS_2026.FREELANCER.WITHHOLDING_MIN_TRANSACTION;
                    return (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-high border border-border-subtle/50 text-xs"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium text-on-surface">{tx.label}</span>
                          <span className="font-mono font-bold text-on-surface">{formatVND(tx.amount)}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-[11px] font-mono px-2 py-0.5 rounded-md ${
                            isWithheld
                              ? 'bg-tertiary/15 text-tertiary border border-tertiary/30'
                              : 'bg-surface-subtle text-on-surface-variant'
                          }`}>
                            {isWithheld ? `-10% (${formatVND(tx.amount * 0.1)})` : '0%'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveTx(tx.id)}
                            className="text-on-surface-variant hover:text-error text-xs cursor-pointer"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add transaction form */}
                <div className="flex flex-col sm:flex-row gap-2 mt-1">
                  <input
                    type="text"
                    placeholder="Mô tả khoản chi"
                    value={newTxLabel}
                    onChange={(e) => setNewTxLabel(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-surface-container-high border border-border-subtle text-xs text-on-surface"
                  />
                  <input
                    type="number"
                    placeholder="Số tiền (₫)"
                    value={newTxAmount}
                    onChange={(e) => setNewTxAmount(e.target.value)}
                    className="w-28 px-3 py-1.5 rounded-lg bg-surface-container-high border border-border-subtle text-xs text-on-surface font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleAddTx}
                    className="px-3 py-1.5 rounded-lg bg-primary text-on-primary font-bold text-xs hover:opacity-90 cursor-pointer"
                  >
                    +
                  </button>
                </div>
                <span className="text-[11px] text-on-surface-variant">{t.flTxNote}</span>
              </div>
            </div>
          </div>

          {/* Freelancer Results */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            {flResult.isExempt ? (
              <div className="p-5 rounded-2xl bg-secondary/10 border border-secondary/30 flex flex-col gap-3 shadow-sm">
                <div className="flex items-center gap-2 text-secondary font-bold text-base">
                  <CheckCircle2 size={20} />
                  <span>MIỄN THUẾ 100% (DOANH THU DƯỚI 1 TỶ/NĂM)</span>
                </div>
                <p className="text-xs text-on-surface leading-relaxed">
                  {t.flExemptAlert}
                </p>
                <div className="p-4 rounded-xl bg-surface-container border border-border-subtle flex flex-col gap-2 mt-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-on-surface-variant">{t.flTotalWithheld}:</span>
                    <span className="font-mono font-bold text-tertiary text-sm">{formatVND(flResult.totalWithheld)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-bold text-secondary border-t border-border-subtle pt-2">
                    <span>{t.flRefundable}:</span>
                    <span className="font-mono text-lg">{formatVND(flResult.refundableTax)}</span>
                  </div>
                </div>
                <p className="text-[11px] text-on-surface-variant">
                  {t.flRefundableAlert}
                </p>
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-surface-container border border-border-subtle flex flex-col gap-4 shadow-sm">
                <div className="flex items-center gap-2 text-tertiary font-bold text-base">
                  <AlertCircle size={20} />
                  <span>DOANH THU TRÊN 1 TỶ: KÊ KHAI VÀ NỘP THUẾ THỰC TẾ</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono">
                  <div className="p-3 rounded-xl bg-surface-container-high border border-border-subtle">
                    <span className="text-xs font-sans text-on-surface-variant">{t.flOfficialLiability}</span>
                    <div className="text-xl font-bold text-tertiary mt-1">{formatVND(flResult.officialTaxLiability)}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-container-high border border-border-subtle">
                    <span className="text-xs font-sans text-on-surface-variant">{t.flTotalWithheld}</span>
                    <div className="text-xl font-bold text-on-surface mt-1">{formatVND(flResult.totalWithheld)}</div>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-surface-subtle border border-border-subtle flex justify-between items-center">
                  <span className="text-xs font-bold text-on-surface">
                    {flResult.refundableTax > 0 ? t.flRefundable : t.flAdditionalDue}:
                  </span>
                  <span className="font-mono font-extrabold text-lg text-primary">
                    {formatVND(flResult.refundableTax > 0 ? flResult.refundableTax : flResult.additionalTaxDue)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: BHXH 1 LẦN & BHTN
          ========================================================================= */}
      {activeTab === 'bhxh' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Module 1: BHXH 1 Lần */}
          <div className="p-5 rounded-2xl bg-surface-container border border-border-subtle flex flex-col gap-4 shadow-sm">
            <div className="flex items-center gap-2 pb-2 border-b border-border-subtle">
              <Clock size={18} className="text-primary" />
              <h2 className="text-base font-bold text-on-surface">
                {t.bhxhTitle}
              </h2>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="tax-bhxh-avg-salary-input" className="text-xs font-semibold text-on-surface">
                {t.bhxhAvgSalary}
              </label>
              <input
                id="tax-bhxh-avg-salary-input"
                type="text"
                value={bhxhAvgSalaryDisplay}
                onChange={(e) => handleBhxhAvgChange(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-surface-container-high border border-border-subtle font-mono font-bold text-sm text-on-surface"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label htmlFor="tax-bhxh-years-before-input" className="text-xs font-semibold text-on-surface">
                  {t.bhxhYearsBefore}
                </label>
                <input
                  id="tax-bhxh-years-before-input"
                  type="number"
                  min="0"
                  max="40"
                  value={yearsBefore2014}
                  onChange={(e) => setYearsBefore2014(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-surface-container-high border border-border-subtle font-mono text-sm text-on-surface"
                />
                <span className="text-[11px] text-on-surface-variant">{t.bhxhMultiplierBefore}</span>
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="tax-bhxh-years-from-input" className="text-xs font-semibold text-on-surface">
                  {t.bhxhYearsFrom}
                </label>
                <input
                  id="tax-bhxh-years-from-input"
                  type="number"
                  min="0"
                  max="40"
                  value={yearsFrom2014}
                  onChange={(e) => setYearsFrom2014(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-surface-container-high border border-border-subtle font-mono text-sm text-on-surface"
                />
                <span className="text-[11px] text-on-surface-variant">{t.bhxhMultiplierFrom}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-surface-container-high border border-border-subtle flex flex-col gap-2 mt-2">
              <span className="text-xs font-bold text-secondary uppercase">
                {t.bhxhEstimatedTotal}
              </span>
              <div className="font-mono font-extrabold text-2xl text-on-surface">
                {formatVND(bhxhResult.totalAmount)}
              </div>
              <div className="text-xs text-on-surface-variant flex justify-between pt-1 border-t border-border-subtle/50">
                <span>Tổng thời gian: {bhxhResult.totalYears} năm đóng</span>
                <span className="font-mono">({formatVND(bhxhResult.amountBefore2014)} + {formatVND(bhxhResult.amountFrom2014)})</span>
              </div>
            </div>
          </div>

          {/* Module 2: Trợ Cấp Thất Nghiệp (BHTN) */}
          <div className="p-5 rounded-2xl bg-surface-container border border-border-subtle flex flex-col gap-4 shadow-sm">
            <div className="flex items-center gap-2 pb-2 border-b border-border-subtle">
              <ShieldCheck size={18} className="text-secondary" />
              <h2 className="text-base font-bold text-on-surface">
                {t.bhtnTitle}
              </h2>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="tax-bhtn-avg-salary-input" className="text-xs font-semibold text-on-surface">
                {t.bhtnAvg6Months}
              </label>
              <input
                id="tax-bhtn-avg-salary-input"
                type="text"
                value={bhtnAvgSalaryDisplay}
                onChange={(e) => handleBhtnAvgChange(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-surface-container-high border border-border-subtle font-mono font-bold text-sm text-on-surface"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label htmlFor="tax-bhtn-region-select" className="text-xs font-semibold text-on-surface">
                  Vùng áp dụng trần
                </label>
                <select
                  id="tax-bhtn-region-select"
                  value={bhtnRegion}
                  onChange={(e) => setBhtnRegion(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-surface-container-high border border-border-subtle text-xs text-on-surface"
                >
                  <option value={1}>Vùng I (Trần: 26.55tr/tháng)</option>
                  <option value={2}>Vùng II (Trần: 23.65tr/tháng)</option>
                  <option value={3}>Vùng III (Trần: 20.7tr/tháng)</option>
                  <option value={4}>Vùng IV (Trần: 18.5tr/tháng)</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="tax-bhtn-months-contributed-input" className="text-xs font-semibold text-on-surface">
                  {t.bhtnMonthsPaid}
                </label>
                <input
                  id="tax-bhtn-months-contributed-input"
                  type="number"
                  min="0"
                  max="360"
                  value={bhtnMonthsContributed}
                  onChange={(e) => setBhtnMonthsContributed(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-surface-container-high border border-border-subtle font-mono text-sm text-on-surface"
                />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-surface-container-high border border-border-subtle flex flex-col gap-2 mt-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-on-surface-variant">{t.bhtnMonthlyBenefit}:</span>
                <span className="font-mono font-bold text-on-surface text-sm">{formatVND(bhtnResult.actualMonthlyBenefit)}/tháng</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-on-surface-variant">{t.bhtnDuration}:</span>
                <span className="font-mono font-bold text-primary text-sm">{bhtnResult.benefitDurationMonths} tháng</span>
              </div>
              <div className="flex justify-between items-center text-sm font-bold text-secondary border-t border-border-subtle pt-2">
                <span>{t.bhtnTotalBenefit}:</span>
                <span className="font-mono text-xl">{formatVND(bhtnResult.totalBenefit)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: BẤT ĐỘNG SẢN & PHÁI SINH
          ========================================================================= */}
      {activeTab === 'assets' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* BĐS */}
          <div className="p-5 rounded-2xl bg-surface-container border border-border-subtle flex flex-col gap-4 shadow-sm">
            <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
              <Building2 size={18} className="text-primary" />
              Thuế Chuyển Nhượng Bất Động Sản (2%)
            </h2>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="tax-re-price-input" className="text-xs font-semibold text-on-surface">
                {t.rePriceLabel}
              </label>
              <input
                id="tax-re-price-input"
                type="text"
                value={rePriceDisplay}
                onChange={(e) => handleRePriceChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-high border border-border-subtle font-mono font-bold text-sm text-on-surface"
              />
            </div>

            <div className="flex flex-col gap-2.5 p-3 rounded-xl bg-surface-subtle/60 border border-border-subtle text-xs">
              <span className="font-bold text-on-surface">Điều kiện miễn thuế chuyển nhượng:</span>
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isSoleProperty}
                  onChange={(e) => setIsSoleProperty(e.target.checked)}
                  className="mt-0.5 accent-primary rounded"
                />
                <span className="text-on-surface">{t.reSoleCheck}</span>
              </label>
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFamilyTransfer}
                  onChange={(e) => setIsFamilyTransfer(e.target.checked)}
                  className="mt-0.5 accent-primary rounded"
                />
                <span className="text-on-surface">{t.reFamilyCheck}</span>
              </label>
            </div>

            <div className="p-4 rounded-xl bg-surface-container-high border border-border-subtle flex flex-col gap-2">
              {assetResult.realEstate.isExempt ? (
                <div className="flex items-center gap-2 text-secondary font-bold text-sm">
                  <CheckCircle2 size={18} />
                  <span>{t.reExemptNotice}</span>
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-on-surface-variant font-bold">{t.reTaxResult}:</span>
                  <span className="font-mono font-extrabold text-xl text-tertiary">
                    {formatVND(assetResult.realEstate.tax)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Phái sinh */}
          <div className="p-5 rounded-2xl bg-surface-container border border-border-subtle flex flex-col gap-4 shadow-sm">
            <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
              <TrendingUp size={18} className="text-primary" />
              Thuế Giao Dịch Chứng Khoán Phái Sinh (0,1%)
            </h2>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="tax-derivative-value-input" className="text-xs font-semibold text-on-surface">
                {t.derivLabel}
              </label>
              <input
                id="tax-derivative-value-input"
                type="text"
                value={derivativeDisplay}
                onChange={(e) => handleDerivativeChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-high border border-border-subtle font-mono font-bold text-sm text-on-surface"
              />
            </div>

            <div className="p-4 rounded-xl bg-surface-container-high border border-border-subtle flex flex-col gap-2 mt-auto">
              <span className="text-xs text-on-surface-variant font-bold">
                {t.derivTaxResult}
              </span>
              <div className="font-mono font-extrabold text-2xl text-tertiary">
                {formatVND(assetResult.derivative.tax)}
              </div>
              <span className="text-[11px] text-on-surface-variant">
                Áp dụng thuế suất 0,1% trên giá trị hợp đồng tương lai từng lần giao dịch (Thông tư 87/2026/TT-BTC).
              </span>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 5: SOP QUYẾT TOÁN eTAX MOBILE & FAQ
          ========================================================================= */}
      {activeTab === 'sop' && (
        <div className="flex flex-col gap-6">
          <div className="p-5 rounded-2xl bg-surface-container border border-border-subtle flex flex-col gap-4 shadow-sm">
            <div className="flex items-center gap-2 pb-2 border-b border-border-subtle">
              <FileText size={18} className="text-primary" />
              <h2 className="text-base font-bold text-on-surface">
                {t.sopTitle}
              </h2>
            </div>

            {/* Step-by-step SOP */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-surface-container-high border border-border-subtle flex gap-2.5">
                <span className="w-5 h-5 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center shrink-0">1</span>
                <span className="text-on-surface">{t.sopStep1}</span>
              </div>
              <div className="p-3 rounded-xl bg-surface-container-high border border-border-subtle flex gap-2.5">
                <span className="w-5 h-5 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center shrink-0">2</span>
                <span className="text-on-surface">{t.sopStep2}</span>
              </div>
              <div className="p-3 rounded-xl bg-surface-container-high border border-border-subtle flex gap-2.5">
                <span className="w-5 h-5 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center shrink-0">3</span>
                <span className="text-on-surface">{t.sopStep3}</span>
              </div>
              <div className="p-3 rounded-xl bg-surface-container-high border border-border-subtle flex gap-2.5">
                <span className="w-5 h-5 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center shrink-0">4</span>
                <span className="text-on-surface">{t.sopStep4}</span>
              </div>
              <div className="p-3 rounded-xl bg-surface-container-high border border-border-subtle flex gap-2.5">
                <span className="w-5 h-5 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center shrink-0">5</span>
                <span className="text-on-surface">{t.sopStep5}</span>
              </div>
              <div className="p-3 rounded-xl bg-surface-container-high border border-border-subtle flex gap-2.5">
                <span className="w-5 h-5 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center shrink-0">6</span>
                <span className="text-on-surface">{t.sopStep6}</span>
              </div>
            </div>

            {/* Official Links */}
            <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-border-subtle text-xs">
              <span className="text-on-surface-variant">Cổng tra cứu chính thức:</span>
              <a
                href="https://canhan.gdt.gov.vn"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-primary hover:underline font-medium"
              >
                <span>Cổng Thuế Điện Tử Cá Nhân (canhan.gdt.gov.vn)</span>
                <ExternalLink size={12} />
              </a>
              <a
                href="https://gdt.gov.vn"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-primary hover:underline font-medium"
              >
                <span>Tổng Cục Thuế (gdt.gov.vn)</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* MANDATORY LEGAL DISCLAIMER */}
      <div className="p-4 rounded-xl bg-surface-container border border-border-subtle/50 text-xs text-on-surface-variant flex items-start gap-2">
        <Info size={16} className="text-tertiary shrink-0 mt-0.5" />
        <span className="leading-relaxed">{t.disclaimer}</span>
      </div>
    </div>
  );
}
