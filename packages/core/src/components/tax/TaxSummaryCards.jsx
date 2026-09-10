/**
 * @file packages/core/src/components/tax/TaxSummaryCards.jsx
 * @description Thẻ chỉ số tổng quan (KPI Summary Cards) cho bộ mô phỏng thuế Nhật Bản.
 * Phân tách rõ ràng giữa Thuế (公租公課) và Bảo hiểm xã hội (社会保険料), hiển thị tiền thực nhận (手取り).
 */

import React from 'react';
import {
  Wallet,
  Scale,
  HeartPulse,
  Banknote,
  Percent,
  Sparkles,
} from 'lucide-react';

export default function TaxSummaryCards({
  summary = {},
  lang = 'ja',
  t,
}) {
  const {
    grossEarnings = 0,
    totalTaxes = 0,
    totalSocialInsurance = 0,
    totalFinancialBurden = 0,
    netTakeHome = 0,
    effectiveBurdenRate = 0,
  } = summary;

  const formatJPY = (amount) => {
    return '¥' + Math.round(amount || 0).toLocaleString();
  };

  const percentageStr = (effectiveBurdenRate * 100).toFixed(1) + '%';

  return (
    <div className="w-full space-y-3">
      {/* 4 Main Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 1. Gross Earnings */}
        <div className="bg-surface border border-border-subtle rounded-2xl p-4 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-on-surface-variant">
              {t?.cardGrossEarnings || 'Tổng thu nhập / Doanh thu'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black font-mono text-on-surface tracking-tight">
              {formatJPY(grossEarnings)}
            </div>
            <div className="text-[11px] text-on-surface-variant/80 mt-0.5">
              {lang === 'ja' ? '額面年収・年間総売上' : lang === 'vi' ? 'Tổng lương Gross hoặc Doanh thu' : 'Total gross annual earnings'}
            </div>
          </div>
        </div>

        {/* 2. Total Taxes */}
        <div className="bg-surface border border-rose-500/20 dark:border-rose-500/30 rounded-2xl p-4 shadow-sm relative overflow-hidden flex flex-col justify-between bg-rose-50/20 dark:bg-rose-950/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-rose-700 dark:text-rose-300">
              {t?.cardTotalTaxes || 'Thuế phải nộp (税金合計)'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-700 dark:text-rose-300 flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black font-mono text-rose-700 dark:text-rose-300 tracking-tight">
              {formatJPY(totalTaxes)}
            </div>
            <div className="text-[11px] text-on-surface-variant/80 mt-0.5">
              {lang === 'ja' ? '所得税・住民税・消費税等' : lang === 'vi' ? 'Thuế TNCN, cư trú, tiêu thụ...' : 'Income, resident & other taxes'}
            </div>
          </div>
        </div>

        {/* 3. Total Social Insurance */}
        <div className="bg-surface border border-indigo-500/20 dark:border-indigo-500/30 rounded-2xl p-4 shadow-sm relative overflow-hidden flex flex-col justify-between bg-indigo-50/20 dark:bg-indigo-950/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              {t?.cardTotalSocial || 'Bảo hiểm xã hội (社会保険料)'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <HeartPulse className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400 tracking-tight">
              {formatJPY(totalSocialInsurance)}
            </div>
            <div className="text-[11px] text-on-surface-variant/80 mt-0.5">
              {lang === 'ja' ? '健康保険・厚生年金・雇用等' : lang === 'vi' ? 'BHYT, Hưu trí, Thất nghiệp' : 'Health, pension & employment ins.'}
            </div>
          </div>
        </div>

        {/* 4. Net Take-Home */}
        <div className="bg-surface border border-emerald-500/30 dark:border-emerald-500/40 rounded-2xl p-4 shadow-sm relative overflow-hidden flex flex-col justify-between bg-emerald-50/30 dark:bg-emerald-950/20 ring-1 ring-emerald-500/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              {t?.cardTakeHome || 'Thực nhận (手取り額)'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 flex items-center justify-center">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 tracking-tight">
              {formatJPY(netTakeHome)}
            </div>
            <div className="text-[11px] text-on-surface-variant/80 mt-0.5">
              {grossEarnings > 0
                ? `${((netTakeHome / grossEarnings) * 100).toFixed(1)}% ${lang === 'ja' ? 'が手元に残ります' : lang === 'vi' ? 'về túi sau nghĩa vụ' : 'retained'}`
                : '—'}
            </div>
          </div>
        </div>
      </div>

      {/* Progress & Effective Burden Bar */}
      <div className="bg-surface border border-border-subtle rounded-xl p-3.5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs mb-2 gap-1">
          <div className="flex items-center gap-2">
            <Percent className="w-3.5 h-3.5 text-rose-500" />
            <span className="font-bold text-on-surface">
              {t?.cardEffectiveRate || 'Tỷ lệ trích nộp công thực tế (実効公的負担率)'}:
            </span>
            <span className="font-mono font-black text-rose-700 dark:text-rose-300 text-sm">
              {percentageStr}
            </span>
            <span className="text-[11px] text-on-surface-variant">
              ({lang === 'ja' ? '公的負担総額' : lang === 'vi' ? 'Tổng thuế + BHXH' : 'Total tax & ins.'}: {formatJPY(totalFinancialBurden)})
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-medium text-on-surface-variant">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block" />
              {lang === 'ja' ? '税金' : lang === 'vi' ? 'Thuế' : 'Taxes'}: {grossEarnings > 0 ? ((totalTaxes / grossEarnings) * 100).toFixed(1) : 0}%
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500 inline-block" />
              {lang === 'ja' ? '社保' : lang === 'vi' ? 'BHXH' : 'Social'}: {grossEarnings > 0 ? ((totalSocialInsurance / grossEarnings) * 100).toFixed(1) : 0}%
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
              {lang === 'ja' ? '手取り' : lang === 'vi' ? 'Thực nhận' : 'Take-home'}: {grossEarnings > 0 ? ((netTakeHome / grossEarnings) * 100).toFixed(1) : 100}%
            </span>
          </div>
        </div>

        {/* Visual Ratio Bar */}
        <div className="w-full h-3 bg-surface-container-high rounded-full overflow-hidden flex">
          <div
            className="h-full bg-rose-500 transition-all duration-500"
            style={{ width: `${grossEarnings > 0 ? (totalTaxes / grossEarnings) * 100 : 0}%` }}
            title={`Taxes: ${formatJPY(totalTaxes)}`}
          />
          <div
            className="h-full bg-indigo-500 transition-all duration-500"
            style={{ width: `${grossEarnings > 0 ? (totalSocialInsurance / grossEarnings) * 100 : 0}%` }}
            title={`Social Insurance: ${formatJPY(totalSocialInsurance)}`}
          />
          <div
            className="h-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${grossEarnings > 0 ? (netTakeHome / grossEarnings) * 100 : 100}%` }}
            title={`Take-Home: ${formatJPY(netTakeHome)}`}
          />
        </div>
      </div>
    </div>
  );
}
