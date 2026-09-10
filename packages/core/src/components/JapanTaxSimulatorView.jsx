/**
 * @file packages/core/src/components/JapanTaxSimulatorView.jsx
 * @description Giao diện chính miniapp "Hướng Dẫn & Mô Phỏng Thuế Nhật Bản" (日本の税金ガイド・シミュレーター).
 * - Ưu tiên đồng đều cả 3 ngôn ngữ: Tiếng Việt, 日本語, English.
 * - 100% xử lý nội bộ trên trình duyệt (Zero-server, privacy-first).
 * - Đầy đủ 6 profile, bảng kê chi tiết, giải thích 3 cấp độ [?], chẩn đoán 確定申告, và mô phỏng What-If.
 */

import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  FileSpreadsheet,
  FileDown,
  RotateCcw,
  Sparkles,
  HelpCircle,
  Calculator,
  Sliders,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import {
  simulateJapanTaxes,
  exportTaxSimulationCsv,
  generateTaxPdfReport,
  getTaxI18n,
} from '../utils/tax/index.js';

import ProfileSelector from './tax/ProfileSelector.jsx';
import ProgressiveForm from './tax/ProgressiveForm.jsx';
import TaxSummaryCards from './tax/TaxSummaryCards.jsx';
import TaxBreakdownTable from './tax/TaxBreakdownTable.jsx';
import TaxDetailDrawer from './tax/TaxDetailDrawer.jsx';
import TaxFilingAdvisorModal from './tax/TaxFilingAdvisorModal.jsx';
import TaxScenarioSimulator from './tax/TaxScenarioSimulator.jsx';
import RegulatorySourceSection from './tax/RegulatorySourceSection.jsx';

const DEFAULT_FORM_VALUES = {
  year: 2025,
  profile: 'employee',
  prefecture: 'tokyo',
  age: 30,
  salary: 4500000,
  businessRevenue: 0,
  businessExpenses: 0,
  blueReturnOption: 'etax_65',
  businessCategoryId: 'type1_retail_dining',
  operatingMonths: 12,
  hasSideIncome: false,
  sideIncomeRevenue: 0,
  sideIncomeExpenses: 0,
  hasYearEndAdjustment: true,
  employersCount: 1,
  isInvoiceRegistered: false,
  basePeriodSales: 0,
  consumptionMethod: 'standard',
  simplifiedCatId: 'cat5_service_it',
  taxablePurchases: 0,
  corporateIncome: 0,
  capital: 10000000,
  employeeCount: 5,
  hasSpouse: false,
  dependentsCount: 0,
  idecoMonthly: 0,
  hasMedicalExpensesOver100k: false,
  hasFurusatoNozeiOver5Cities: false,
  isFirstYearHousingLoan: false,
};

export default function JapanTaxSimulatorView({ displayLang = 'vi' }) {
  // SOT: Use global displayLang from Hub (fallback to 'vi' if not set or unsupported)
  const currentLang = ['ja', 'vi', 'en'].includes(displayLang) ? displayLang : 'vi';
  const t = getTaxI18n(currentLang);

  // Form State
  const [formValues, setFormValues] = useState(DEFAULT_FORM_VALUES);

  // Modals & Drawers State
  const [activeTaxDetailId, setActiveTaxDetailId] = useState(null);
  const [showFilingAdvisor, setShowFilingAdvisor] = useState(false);
  const [showWhatIfSection, setShowWhatIfSection] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Handle Profile Switch: adjust default revenues to reasonable defaults and reset unrelated fields
  const handleSelectProfile = (newProfile) => {
    setFormValues((prev) => {
      const next = { ...prev, profile: newProfile };
      if (newProfile === 'part_time') {
        next.salary = 1200000;
        next.businessRevenue = 0;
        next.businessExpenses = 0;
        next.sideIncomeRevenue = 0;
        next.sideIncomeExpenses = 0;
        next.hasSideIncome = false;
        next.corporateIncome = 0;
      } else if (newProfile === 'employee') {
        next.salary = 4500000;
        next.businessRevenue = 0;
        next.businessExpenses = 0;
        next.sideIncomeRevenue = 0;
        next.sideIncomeExpenses = 0;
        next.hasSideIncome = false;
        next.corporateIncome = 0;
      } else if (newProfile === 'employee_side') {
        next.salary = 4500000;
        next.businessRevenue = 0;
        next.businessExpenses = 0;
        next.hasSideIncome = true;
        next.sideIncomeRevenue = 600000;
        next.sideIncomeExpenses = 150000;
        next.corporateIncome = 0;
      } else if (newProfile === 'freelance') {
        next.salary = 0;
        next.businessRevenue = 5000000;
        next.businessExpenses = 1500000;
        next.blueReturnOption = 'white_0';
        next.hasSideIncome = false;
        next.sideIncomeRevenue = 0;
        next.sideIncomeExpenses = 0;
        next.corporateIncome = 0;
      } else if (newProfile === 'sole_proprietor') {
        next.salary = 0;
        next.businessRevenue = 8000000;
        next.businessExpenses = 2500000;
        next.blueReturnOption = 'etax_65';
        next.hasSideIncome = false;
        next.sideIncomeRevenue = 0;
        next.sideIncomeExpenses = 0;
        next.corporateIncome = 0;
      } else if (newProfile === 'corporate') {
        next.salary = 0;
        next.businessRevenue = 0;
        next.businessExpenses = 0;
        next.hasSideIncome = false;
        next.sideIncomeRevenue = 0;
        next.sideIncomeExpenses = 0;
        next.corporateIncome = 6000000;
      }
      return next;
    });
  };

  const handleChangeField = (field, value) => {
    setFormValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleReset = () => {
    setFormValues(DEFAULT_FORM_VALUES);
    setToastMessage(
      currentLang === 'ja'
        ? '初期値にリセットしました'
        : currentLang === 'vi'
        ? 'Đã đặt lại dữ liệu mặc định'
        : 'Reset to default values'
    );
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Run Deterministic Calculation on every change (runs in < 1ms client-side)
  const simulationResult = useMemo(() => {
    return simulateJapanTaxes(formValues);
  }, [formValues]);

  // Export CSV
  const handleExportCsv = () => {
    try {
      exportTaxSimulationCsv(simulationResult, currentLang);
      setToastMessage(
        currentLang === 'ja'
          ? 'CSVファイルを保存しました'
          : currentLang === 'vi'
          ? 'Đã xuất file CSV thành công'
          : 'CSV exported successfully'
      );
      setTimeout(() => setToastMessage(''), 3000);
    } catch (err) {
      console.error('CSV Export Error:', err);
      setToastMessage(
        currentLang === 'ja'
          ? 'CSVの出力に失敗しました'
          : currentLang === 'vi'
          ? 'Lỗi khi xuất CSV. Vui lòng thử lại!'
          : 'Failed to export CSV'
      );
      setTimeout(() => setToastMessage(''), 3000);
    }
  };

  // Export PDF
  const handleExportPdf = async () => {
    try {
      setIsExportingPdf(true);
      await generateTaxPdfReport({
        calcResult: simulationResult,
        formValues,
        lang: currentLang,
      });
      setToastMessage(
        currentLang === 'ja'
          ? 'PDFレポートを保存しました'
          : currentLang === 'vi'
          ? 'Đã xuất báo cáo PDF thành công'
          : 'PDF report generated successfully'
      );
      setTimeout(() => setToastMessage(''), 3000);
    } catch (err) {
      console.error('PDF Export Error:', err);
      setToastMessage(
        currentLang === 'ja'
          ? 'PDFの出力に失敗しました'
          : currentLang === 'vi'
          ? 'Lỗi khi xuất PDF. Vui lòng thử lại!'
          : 'Failed to export PDF'
      );
      setTimeout(() => setToastMessage(''), 3000);
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="w-full max-w-[1240px] mx-auto space-y-6 text-on-surface">
      {/* 1. Header Banner with Trilingual Switcher & Privacy Badge */}
      <div className="bg-surface border border-border-subtle rounded-3xl p-5 sm:p-7 shadow-sm relative overflow-hidden">
        {/* Subtle decorative background glow */}
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 w-full">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 font-mono">
                <Sparkles className="w-3.5 h-3.5" />
                JAPAN TAX GUIDE & SIMULATOR
              </span>
              <span className="text-xs text-on-surface-variant font-mono">
                令和7・8年税制 (2025/2026)
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-on-surface">
              {t.appTitle}
            </h1>
            <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed text-pretty">
              {t.appSubtitle}
            </p>
          </div>
        </div>

        {/* 100% Browser Local Privacy Shield */}
        <div className="mt-4 pt-4 border-t border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-medium">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>{t.privacyBadge}</span>
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowFilingAdvisor(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-colors flex items-center gap-1.5"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              {t.btnFilingDiagnosis || '確定申告要否を診断'}
            </button>

            <button
              type="button"
              onClick={() => setShowWhatIfSection(!showWhatIfSection)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 border ${
                showWhatIfSection
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-surface hover:bg-surface-container-high text-on-surface border-border-subtle'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              {t.btnWhatIfSimulation || 'What-If シミュレーション'}
            </button>

            <button
              type="button"
              onClick={handleExportCsv}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-surface hover:bg-surface-container-high text-on-surface border border-border-subtle transition-colors flex items-center gap-1"
              title="CSV (UTF-8 BOM for Excel)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
              CSV
            </button>

            <button
              type="button"
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-surface hover:bg-surface-container-high text-on-surface border border-border-subtle transition-colors flex items-center gap-1 disabled:opacity-50"
              title="Printable Vector PDF Report"
            >
              <FileDown className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              {isExportingPdf ? '...' : 'PDF'}
            </button>

            <button
              type="button"
              onClick={handleReset}
              aria-label={t.btnReset || 'Reset to defaults'}
              className="p-1.5 rounded-xl text-on-surface-variant hover:text-rose-600 hover:bg-surface-container-high transition-colors"
              title={t.btnReset || 'Reset'}
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-surface-container-highest border border-border-subtle text-on-surface px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Section 1: User Profile Selector */}
      <div className="bg-surface border border-border-subtle rounded-3xl p-5 sm:p-6 shadow-sm">
        <ProfileSelector
          selectedProfile={formValues.profile}
          onSelectProfile={handleSelectProfile}
          lang={currentLang}
          t={t}
        />
      </div>

      {/* Section 2 & 3: Progressive Form & KPI Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form Inputs */}
        <div className="lg:col-span-6 space-y-6">
          <ProgressiveForm
            formValues={formValues}
            onChangeField={handleChangeField}
            profile={formValues.profile}
            lang={currentLang}
            t={t}
          />
        </div>

        {/* Right Column: KPI Cards & Applicable Taxes Overview */}
        <div className="lg:col-span-6 space-y-6">
          <TaxSummaryCards
            summary={simulationResult.summary}
            lang={currentLang}
            t={t}
            onSelectDetail={(type) => setActiveTaxDetailId(type)}
          />

          {/* Applicable Taxes & Obligations Banner */}
          <div className="bg-surface border border-border-subtle rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-bold text-on-surface flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                {t.applicableTaxesTitle || 'あなたの状況に関連する税金・義務'}
              </h3>
              <span className="text-[11px] text-on-surface-variant font-mono">
                {simulationResult.applicableTaxes?.length || 0} {currentLang === 'ja' ? '項目該当' : currentLang === 'vi' ? 'nghĩa vụ liên quan' : 'applicable'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {simulationResult.applicableTaxes?.map((tax) => {
                const taxName = tax[`name_${currentLang}`] || tax.name_ja;
                const authority = tax[`authority_${currentLang}`] || tax.authority_ja;
                return (
                  <div
                    key={tax.id}
                    className="p-3 rounded-xl bg-surface-container-low/70 border border-border-subtle/80 flex flex-col justify-between text-xs"
                  >
                    <div className="font-bold text-on-surface tracking-tight">
                      {taxName}
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-border-subtle/50 text-[10px] text-on-surface-variant font-medium">
                      <span>{authority}</span>
                      <button
                        type="button"
                        onClick={() => setActiveTaxDetailId(tax.id === 'social_insurance_company' || tax.id === 'social_insurance_national' ? 'social_insurance' : tax.id)}
                        className="text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-0.5"
                      >
                        [?] {currentLang === 'ja' ? '解説' : currentLang === 'vi' ? 'Xem' : 'Info'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Section 4: What-If Scenario Simulator (Collapsible) */}
      {showWhatIfSection && (
        <div className="animate-in fade-in duration-300">
          <TaxScenarioSimulator
            currentFormValues={formValues}
            currentResult={simulationResult}
            lang={currentLang}
            t={t}
          />
        </div>
      )}

      {/* Section 5: Itemized Breakdown Table */}
      <TaxBreakdownTable
        result={simulationResult}
        onSelectTaxDetail={(taxId) => setActiveTaxDetailId(taxId)}
        lang={currentLang}
        t={t}
      />

      {/* Regulatory Source & Statutory Baseline Disclosure */}
      <RegulatorySourceSection
        rules={simulationResult.rules}
        result={simulationResult}
        lang={currentLang}
      />

      {/* Legal & Educational Disclaimer */}
      <div className="p-4 sm:p-5 rounded-2xl bg-surface-container-low border border-border-subtle text-xs text-on-surface-variant leading-relaxed space-y-1">
        <div className="flex items-center gap-2 font-bold text-on-surface">
          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
          <span>{currentLang === 'ja' ? '法的免責事項 & ご利用上の注意' : currentLang === 'vi' ? 'Khước từ trách nhiệm pháp lý & Hướng dẫn sử dụng' : 'Legal Disclaimer & Guidance'}</span>
        </div>
        <p>{t.disclaimer}</p>
      </div>

      {/* Modals */}
      {activeTaxDetailId && (
        <TaxDetailDrawer
          taxId={activeTaxDetailId}
          result={simulationResult}
          onClose={() => setActiveTaxDetailId(null)}
          lang={currentLang}
          t={t}
        />
      )}

      {showFilingAdvisor && (
        <TaxFilingAdvisorModal
          filingNecessity={simulationResult.filingNecessity}
          onClose={() => setShowFilingAdvisor(false)}
          lang={currentLang}
          t={t}
        />
      )}
    </div>
  );
}
