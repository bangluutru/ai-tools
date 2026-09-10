/**
 * @file packages/core/src/components/tax/TaxScenarioSimulator.jsx
 * @description Mô phỏng tình huống "What-If" tương tác theo thời gian thực (Interactive Scenario Simulator).
 * Giúp người dùng thấy rõ hiệu quả tiết kiệm thuế khi áp dụng 青色申告 65万, đóng iDeCo, hoặc thay đổi doanh thu.
 */

import React, { useState, useMemo } from 'react';
import {
  Sliders,
  TrendingDown,
  TrendingUp,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { simulateJapanTaxes } from '../../utils/tax/index.js';

export default function TaxScenarioSimulator({
  currentFormValues,
  currentResult,
  lang = 'ja',
  t,
}) {
  // Lever 1: Income multiplier percentage (-50% to +50%, default 0%)
  const [revenueChangePercent, setRevenueChangePercent] = useState(0);

  // Lever 2: Force Blue Return 650k toggle
  const [forceBlue65, setForceBlue65] = useState(
    currentFormValues.blueReturnOption === 'etax_65'
  );

  // Lever 3: iDeCo monthly contribution adjustment
  const [idecoSimMonthly, setIdecoSimMonthly] = useState(
    Number(currentFormValues.idecoMonthly) || 0
  );

  // Lever 4: Invoice 20% Special Rule toggle (if applicable)
  const [useSpecial20, setUseSpecial20] = useState(
    currentFormValues.consumptionMethod === 'special_20'
  );

  // Compute What-If Simulation
  const scenarioResult = useMemo(() => {
    const mult = 1 + revenueChangePercent / 100;
    const simValues = {
      ...currentFormValues,
      salary: Math.round((currentFormValues.salary || 0) * mult),
      businessRevenue: Math.round((currentFormValues.businessRevenue || 0) * mult),
      sideIncomeRevenue: Math.round((currentFormValues.sideIncomeRevenue || 0) * mult),
      blueReturnOption: forceBlue65 ? 'etax_65' : 'white_0',
      idecoMonthly: idecoSimMonthly,
      consumptionMethod: useSpecial20 ? 'special_20' : currentFormValues.consumptionMethod,
    };

    return simulateJapanTaxes(simValues);
  }, [currentFormValues, revenueChangePercent, forceBlue65, idecoSimMonthly, useSpecial20]);

  const formatJPY = (amount) => {
    return '¥' + Math.round(amount || 0).toLocaleString();
  };

  const currentSummary = currentResult.summary || {};
  const simSummary = scenarioResult.summary || {};

  const deltaTax = simSummary.totalTaxes - currentSummary.totalTaxes;
  const deltaTakeHome = simSummary.netTakeHome - currentSummary.netTakeHome;
  const deltaSocial = simSummary.totalSocialInsurance - currentSummary.totalSocialInsurance;

  const resetLevers = () => {
    setRevenueChangePercent(0);
    setForceBlue65(currentFormValues.blueReturnOption === 'etax_65');
    setIdecoSimMonthly(Number(currentFormValues.idecoMonthly) || 0);
    setUseSpecial20(currentFormValues.consumptionMethod === 'special_20');
  };

  const isBiz = ['sole_proprietor', 'freelance'].includes(currentFormValues.profile);

  return (
    <div className="bg-surface border border-border-subtle rounded-2xl p-4 sm:p-6 shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-border-subtle gap-2">
        <div>
          <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
            <Sliders className="w-5 h-5 text-rose-500" />
            {t?.scenarioTitle || 'What-If シミュレーター（条件変更・節税効果シミュレーション）'}
          </h2>
          <p className="text-xs text-on-surface-variant mt-0.5">
            {t?.scenarioDesc || 'Kéo thanh trượt hoặc bật/tắt các đòn bẩy giảm trừ để thấy sự thay đổi tức thì của số thuế và tiền cầm về.'}
          </p>
        </div>

        <button
          type="button"
          onClick={resetLevers}
          className="text-xs text-on-surface-variant hover:text-rose-600 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-subtle hover:bg-surface-container-high transition-colors self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          {t?.btnReset || 'Đặt lại ban đầu'}
        </button>
      </div>

      {/* Levers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-surface-container-low/60 p-4 rounded-xl border border-border-subtle">
        {/* Lever 1: Revenue Change Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-on-surface">
              {lang === 'ja' ? '収入・売上の変動比率' : lang === 'vi' ? 'Biến động thu nhập / doanh thu' : 'Earnings Variation'}:
            </span>
            <span className="font-mono font-bold text-rose-700 dark:text-rose-300">
              {revenueChangePercent > 0 ? `+${revenueChangePercent}%` : `${revenueChangePercent}%`}
            </span>
          </div>
          <input
            type="range"
            min={-50}
            max={50}
            step={5}
            value={revenueChangePercent}
            onChange={(e) => setRevenueChangePercent(Number(e.target.value))}
            className="w-full accent-rose-500"
          />
          <div className="flex justify-between text-[10px] text-on-surface-variant font-mono">
            <span>-50%</span>
            <span>0%</span>
            <span>+50%</span>
          </div>
        </div>

        {/* Lever 2: Blue Return 650k Toggle (for Business profiles) */}
        {isBiz ? (
          <div className="flex flex-col justify-center space-y-2">
            <span className="text-xs font-semibold text-on-surface">
              {lang === 'ja' ? '青色申告（65万円控除）' : lang === 'vi' ? 'Khấu trừ thuế xanh (青色申告)' : 'Blue Return (650k JPY)'}
            </span>
            <label className="inline-flex items-center gap-2 text-xs text-on-surface cursor-pointer select-none">
              <input
                type="checkbox"
                checked={forceBlue65}
                onChange={(e) => setForceBlue65(e.target.checked)}
                className="rounded border-border-subtle text-emerald-500 focus:ring-emerald-500"
              />
              <span className="font-medium">
                {forceBlue65
                  ? (lang === 'ja' ? '65万円控除を適用中' : lang === 'vi' ? 'Đang áp dụng giảm trừ 65 vạn' : '650k deduction enabled')
                  : (lang === 'ja' ? '白色申告（控除なし）' : lang === 'vi' ? 'Khai trắng (0 vạn)' : 'White return (0 JPY)')}
              </span>
            </label>
            <p className="text-[11px] text-on-surface-variant">
              {lang === 'ja'
                ? 'e-Taxと複式簿記により最大65万円を所得から直接控除。'
                : lang === 'vi'
                ? 'Nộp e-Tax và ghi sổ kép giúp trừ thẳng 65 vạn yên vào thu nhập.'
                : 'Direct 650k reduction via e-Tax and double-entry.'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col justify-center space-y-1 text-xs">
            <span className="font-semibold text-on-surface">
              {lang === 'ja' ? '税制改正の反映' : lang === 'vi' ? 'Hiệu lực luật thuế' : 'Tax Law Active'}
            </span>
            <p className="text-on-surface-variant text-[11px] leading-relaxed">
              {currentFormValues.year === 2026
                ? (lang === 'ja' ? '2026年「178万円の壁」税制改正モデル適用中' : 'Đang kích hoạt mô hình cải cách thuế 178 vạn yên 2026')
                : (lang === 'ja' ? '現行税制（基礎控除95万・給与控除65万）' : 'Mô hình thuế hiện hành 2025')}
            </p>
          </div>
        )}

        {/* Lever 3: iDeCo Monthly Contribution Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-on-surface">
              {lang === 'ja' ? 'iDeCo月額掛金' : lang === 'vi' ? 'Mức đóng iDeCo hàng tháng' : 'iDeCo monthly'}:
            </span>
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
              {formatJPY(idecoSimMonthly)}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={68000}
            step={5000}
            value={idecoSimMonthly}
            onChange={(e) => setIdecoSimMonthly(Number(e.target.value))}
            className="w-full accent-emerald-500"
          />
          <div className="flex justify-between text-[10px] text-on-surface-variant font-mono">
            <span>¥0</span>
            <span>¥23,000</span>
            <span>¥68,000</span>
          </div>
        </div>
      </div>

      {/* Real-Time Delta Comparison Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Delta Taxes */}
        <div className="p-4 rounded-xl bg-surface border border-border-subtle flex flex-col justify-between">
          <span className="text-xs font-semibold text-on-surface-variant">
            {lang === 'ja' ? '税金の変動（差額）' : lang === 'vi' ? 'Biến động tiền thuế' : 'Tax Difference'}
          </span>
          <div className="mt-2">
            <div className="flex items-baseline gap-2">
              <span className={`text-xl font-black font-mono tracking-tight ${deltaTax <= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}>
                {deltaTax <= 0 ? `− ${formatJPY(Math.abs(deltaTax))}` : `+ ${formatJPY(deltaTax)}`}
              </span>
            </div>
            <p className="text-[11px] text-on-surface-variant mt-1 flex items-center gap-1">
              {deltaTax <= 0 ? (
                <>
                  <TrendingDown className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-700 dark:text-emerald-300 font-semibold">
                    {lang === 'ja' ? '税負担が軽減されます' : lang === 'vi' ? 'Tiết kiệm được tiền thuế' : 'Taxes reduced'}
                  </span>
                </>
              ) : (
                <>
                  <TrendingUp className="w-3.5 h-3.5 text-rose-500" />
                  <span>{lang === 'ja' ? '税額が増加します' : lang === 'vi' ? 'Số thuế tăng thêm' : 'Taxes increased'}</span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Delta Social Insurance */}
        <div className="p-4 rounded-xl bg-surface border border-border-subtle flex flex-col justify-between">
          <span className="text-xs font-semibold text-on-surface-variant">
            {lang === 'ja' ? '社会保険料の変動' : lang === 'vi' ? 'Biến động bảo hiểm xã hội' : 'Social Insurance Diff'}
          </span>
          <div className="mt-2">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black font-mono tracking-tight text-indigo-600 dark:text-indigo-400">
                {deltaSocial === 0
                  ? '± ¥0'
                  : deltaSocial < 0
                  ? `− ${formatJPY(Math.abs(deltaSocial))}`
                  : `+ ${formatJPY(deltaSocial)}`}
              </span>
            </div>
            <p className="text-[11px] text-on-surface-variant mt-1">
              {lang === 'ja' ? '新概算: ' : lang === 'vi' ? 'Mức mới: ' : 'New: '}
              <span className="font-mono font-bold text-on-surface">{formatJPY(simSummary.totalSocialInsurance)}</span>
            </p>
          </div>
        </div>

        {/* Delta Take-Home Pay */}
        <div className="p-4 rounded-xl bg-surface border border-emerald-500/40 dark:border-emerald-500/50 bg-emerald-50/20 dark:bg-emerald-950/10 flex flex-col justify-between">
          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
            {lang === 'ja' ? '手取り額の変動（純増減）' : lang === 'vi' ? 'Biến động tiền thực nhận (Tay về)' : 'Net Take-Home Delta'}
          </span>
          <div className="mt-2">
            <div className="flex items-baseline gap-2">
              <span className={`text-xl font-black font-mono tracking-tight ${deltaTakeHome >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}>
                {deltaTakeHome >= 0 ? `+ ${formatJPY(deltaTakeHome)}` : `− ${formatJPY(Math.abs(deltaTakeHome))}`}
              </span>
            </div>
            <p className="text-[11px] text-on-surface-variant mt-1">
              {lang === 'ja' ? '新概算手取り: ' : lang === 'vi' ? 'Tiền tay về mới: ' : 'New Take-Home: '}
              <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">
                {formatJPY(simSummary.netTakeHome)}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
