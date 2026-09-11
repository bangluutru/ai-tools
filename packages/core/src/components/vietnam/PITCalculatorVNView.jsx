import React, { useState, useMemo } from 'react';
import {
  FileText,
  Users,
  Info,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Sliders,
  ShieldCheck,
  CheckCircle2,
  Percent
} from 'lucide-react';
import {
  calculateVietnamPIT,
  calculatePITFromTaxableIncome,
  getPITRules
} from '../../vietnam/index.js';

export default function PITCalculatorVNView({ displayLang = 'vi' }) {
  // Mode: 'standard' (tính từ Gross salary & giảm trừ) | 'direct' (nhập trực tiếp thu nhập tính thuế - dành cho kế toán)
  const [inputMode, setInputMode] = useState('standard');

  // Standard Mode Inputs
  const [grossInput, setGrossInput] = useState(50_000_000);
  const [grossDisplay, setGrossDisplay] = useState('50,000,000');
  const [insuranceInput, setInsuranceInput] = useState(3_150_000);
  const [insuranceDisplay, setInsuranceDisplay] = useState('3,150,000');
  const [dependents, setDependents] = useState(0);
  const [otherDeductionsInput, setOtherDeductionsInput] = useState(0);
  const [otherDeductionsDisplay, setOtherDeductionsDisplay] = useState('0');

  // Direct Mode Input (Taxable Income)
  const [directTaxableInput, setDirectTaxableInput] = useState(50_000_000);
  const [directTaxableDisplay, setDirectTaxableDisplay] = useState('50,000,000');

  const [date, setDate] = useState('2026-09-01');
  const [showFormula, setShowFormula] = useState(false);
  const [showLegalSources, setShowLegalSources] = useState(false);

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
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <FileText size={22} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-on-surface">
              {displayLang === 'ja'
                ? 'ベトナム個人所得税シミュレーター (PIT 2026)'
                : displayLang === 'en'
                ? 'Vietnam PIT Calculator 2026'
                : 'Tính Thuế Thu Nhập Cá Nhân (PIT 2026)'}
            </h1>
            <p className="text-xs sm:text-sm text-outline">
              Biểu thuế lũy tiến 5 bậc & Giảm trừ 15.5tr theo Luật Thuế TNCN 109/2025/QH15
            </p>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="inline-flex rounded-xl bg-surface-container p-1 border border-border-subtle self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setInputMode('standard')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              inputMode === 'standard'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-outline hover:text-on-surface'
            }`}
          >
            Từ Thu nhập & Giảm trừ
          </button>
          <button
            type="button"
            onClick={() => setInputMode('direct')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              inputMode === 'direct'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-outline hover:text-on-surface'
            }`}
          >
            Nhập nhanh TNTT (Kế toán)
          </button>
        </div>
      </div>

      {/* Inputs & Hero Result */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Inputs Card */}
        <div className="bg-surface-container/50 border border-border-subtle/80 rounded-2xl p-5 sm:p-6 space-y-4">
          {inputMode === 'standard' ? (
            <>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-on-surface">Tổng thu nhập chịu thuế tháng (Gross)</label>
                  <div className="flex gap-1.5">
                    {[20, 30, 50, 100].map((mil) => (
                      <button
                        key={mil}
                        type="button"
                        onClick={() => {
                          const v = mil * 1_000_000;
                          setGrossInput(v);
                          setGrossDisplay(v.toLocaleString('vi-VN'));
                        }}
                        className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-surface-container-high/60 hover:bg-blue-500/20 hover:text-blue-600 text-outline transition-colors cursor-pointer"
                      >
                        {mil}tr
                      </button>
                    ))}
                  </div>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={grossDisplay}
                    onChange={handleGrossChange}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container border border-border-subtle focus:border-blue-500 text-on-surface font-semibold text-lg outline-none transition-all pr-12"
                    placeholder="50,000,000"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-outline">
                    VND
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-outline block mb-1">
                  Bảo hiểm bắt buộc được giảm trừ (BHXH, BHYT, BHTN)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={insuranceDisplay}
                    onChange={handleInsuranceChange}
                    className="w-full px-3 py-2 rounded-xl bg-surface-container border border-border-subtle focus:border-blue-500 text-on-surface text-sm font-medium outline-none transition-all pr-12"
                    placeholder="3,150,000"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-outline">
                    VND
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-xs font-semibold text-outline block mb-1">
                    Người phụ thuộc (6.2tr/người)
                  </label>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => setDependents(Math.max(0, dependents - 1))}
                      className="w-8 h-8 rounded-l-lg bg-surface-container border border-r-0 border-border-subtle hover:bg-surface-container-high flex items-center justify-center text-on-surface cursor-pointer text-sm font-bold"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={dependents}
                      onChange={(e) => setDependents(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className="w-12 h-8 text-center bg-surface-container border-y border-border-subtle text-on-surface text-xs font-bold outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button
                      type="button"
                      onClick={() => setDependents(dependents + 1)}
                      className="w-8 h-8 rounded-r-lg bg-surface-container border border-l-0 border-border-subtle hover:bg-surface-container-high flex items-center justify-center text-on-surface cursor-pointer text-sm font-bold"
                    >
                      +
                    </button>
                    <span className="text-[11px] text-outline ml-2">người</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-outline block mb-1">
                    Giảm trừ khác (Từ thiện, hưu trí...)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={otherDeductionsDisplay}
                      onChange={handleOtherDeductionsChange}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-surface-container border border-border-subtle text-on-surface text-xs font-medium outline-none pr-10"
                      placeholder="0"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-outline">VND</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Direct Mode for Accountants */
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                    <Sliders size={15} className="text-blue-500" />
                    Thu nhập tính thuế (Taxable Income)
                  </label>
                  <div className="flex gap-1.5">
                    {[10, 30, 50, 100].map((mil) => (
                      <button
                        key={mil}
                        type="button"
                        onClick={() => {
                          const v = mil * 1_000_000;
                          setDirectTaxableInput(v);
                          setDirectTaxableDisplay(v.toLocaleString('vi-VN'));
                        }}
                        className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-surface-container-high/60 hover:bg-blue-500/20 hover:text-blue-600 text-outline transition-colors cursor-pointer"
                      >
                        {mil}tr
                      </button>
                    ))}
                  </div>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={directTaxableDisplay}
                    onChange={handleDirectTaxableChange}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container border border-border-subtle focus:border-blue-500 text-on-surface font-semibold text-lg outline-none transition-all pr-12"
                    placeholder="50,000,000"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-outline">
                    VND
                  </span>
                </div>
                <p className="text-[11px] text-outline mt-1.5">
                  * Dành cho kế toán đã khấu trừ đầy đủ bảo hiểm & gia cảnh; hệ thống sẽ áp trực tiếp biểu thuế 5 bậc.
                </p>
              </div>
            </div>
          )}

          {/* Deductions Summary Tag */}
          <div className="p-3 rounded-xl bg-surface-container-high/30 border border-border-subtle/50 text-xs text-outline space-y-1">
            <div className="flex justify-between">
              <span>Giảm trừ bản thân (Luật 2026):</span>
              <span className="font-semibold text-on-surface">15,500,000 ₫/tháng</span>
            </div>
            <div className="flex justify-between">
              <span>Giảm trừ mỗi người phụ thuộc:</span>
              <span className="font-semibold text-on-surface">6,200,000 ₫/tháng</span>
            </div>
          </div>
        </div>

        {/* Right Hero Result Card */}
        <div className="bg-gradient-to-br from-blue-500/10 via-surface-container/50 to-indigo-500/10 border border-blue-500/20 rounded-2xl p-5 sm:p-6 flex flex-col justify-between space-y-4 shadow-xs">
          <div>
            <div className="flex items-center justify-between text-xs text-outline mb-1">
              <span>THUẾ THU NHẬP CÁ NHÂN PHẢI NỘP (PIT)</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-600 dark:text-blue-300">
                BIỂU 5 BẬC 2026
              </span>
            </div>

            <div className="text-3xl sm:text-4xl font-extrabold text-blue-600 dark:text-blue-400 tracking-tight">
              {formatVND(result.totalTax)}
            </div>

            <div className="text-xs text-outline mt-1">
              Thu nhập tính thuế: <strong className="text-on-surface">{formatVND(result.taxableIncome)}</strong>
              {result.effectiveRate > 0 && (
                <span className="ml-2 text-blue-500 font-semibold">
                  (Thuế suất thực tế: {(result.effectiveRate * 100).toFixed(2)}%)
                </span>
              )}
            </div>
          </div>

          {/* Quick Explanation Alert */}
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
            <strong className="block mb-0.5 flex items-center gap-1.5 font-bold">
              <Sparkles size={14} />
              Nguyên lý Thuế Lũy Tiến Từng Phần:
            </strong>
            Thu nhập của bạn được chia nhỏ thành từng phần để tính thuế với các thuế suất khác nhau (5% → 35%), <strong>không phải</strong> toàn bộ thu nhập bị đánh thuế theo bậc cao nhất.
          </div>
        </div>
      </div>

      {/* Tier-by-Tier Explanation Table */}
      <div className="bg-surface-container/40 border border-border-subtle rounded-2xl p-5 sm:p-6 space-y-4">
        <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
          <Percent size={16} className="text-blue-500" />
          Bảng kê phân bổ thuế theo từng bậc lũy tiến (5 Bậc)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-border-subtle/80 text-outline">
                <th className="py-2.5 font-semibold">Bậc thuế</th>
                <th className="py-2.5 font-semibold">Mức thu nhập tính thuế</th>
                <th className="py-2.5 font-semibold text-center">Thuế suất</th>
                <th className="py-2.5 font-semibold text-right">Thu nhập rơi vào bậc</th>
                <th className="py-2.5 font-semibold text-right">Tiền thuế phát sinh</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/40">
              {result.bracketsBreakdown.map((b) => (
                <tr
                  key={b.tier}
                  className={b.taxAmount > 0 ? 'bg-blue-500/5 font-medium text-on-surface' : 'text-outline/70'}
                >
                  <td className="py-2.5 font-bold">Bậc {b.tier}</td>
                  <td className="py-2.5">{b.label_vn}</td>
                  <td className="py-2.5 text-center font-bold">{(b.rate * 100)}%</td>
                  <td className="py-2.5 text-right">{formatVND(b.taxableAmount)}</td>
                  <td className={`py-2.5 text-right font-semibold ${b.taxAmount > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-outline/50'}`}>
                    {formatVND(b.taxAmount)}
                  </td>
                </tr>
              ))}
              <tr className="font-bold text-sm text-blue-600 dark:text-blue-400 bg-blue-500/10">
                <td className="py-2.5" colSpan={3}>Tổng thuế thu nhập cá nhân phải nộp</td>
                <td className="py-2.5 text-right">{formatVND(result.taxableIncome)}</td>
                <td className="py-2.5 text-right">{formatVND(result.totalTax)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Collapsible: Formula */}
      <div className="border border-border-subtle rounded-xl overflow-hidden bg-surface-container/30">
        <button
          type="button"
          onClick={() => setShowFormula(!showFormula)}
          className="w-full px-4 py-3 flex items-center justify-between text-xs font-semibold text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Sparkles size={14} className="text-blue-500" />
            Xem công thức tính toán chi tiết
          </span>
          {showFormula ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
        {showFormula && (
          <div className="p-4 border-t border-border-subtle bg-surface-container/60 text-xs font-mono space-y-2 text-outline">
            <p><span className="text-on-surface font-semibold">Thu nhập tính thuế =</span> Thu nhập chịu thuế - Các khoản giảm trừ</p>
            <p><span className="text-on-surface font-semibold">Công thức:</span> {result.formula.taxableIncome}</p>
            <p><span className="text-on-surface font-semibold">Thuế lũy tiến:</span> {result.formula.totalTaxSummary} = {result.totalTax.toLocaleString('vi-VN')} VND</p>
          </div>
        )}
      </div>

      {/* Collapsible: Legal Sources */}
      <div className="border border-border-subtle rounded-xl overflow-hidden bg-surface-container/30">
        <button
          type="button"
          onClick={() => setShowLegalSources(!showLegalSources)}
          className="w-full px-4 py-3 flex items-center justify-between text-xs font-semibold text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Info size={14} className="text-blue-500" />
            ⓘ Căn cứ pháp lý & Ngày cập nhật quy chuẩn
          </span>
          {showLegalSources ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
        {showLegalSources && (
          <div className="p-4 border-t border-border-subtle bg-surface-container/60 text-xs space-y-2.5 text-outline">
            <div className="flex items-start gap-2">
              <span className="font-semibold text-on-surface">• Luật Thuế TNCN số 109/2025/QH15:</span>
              <span>Bãi bỏ biểu thuế 7 bậc cũ, chính thức áp dụng biểu thuế 5 bậc (5%, 10%, 20%, 30%, 35%) từ 2026.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold text-on-surface">• Nghị quyết số 110/2025/UBTVQH15:</span>
              <span>Nâng mức giảm trừ bản thân từ 11 triệu lên 15.5 triệu đồng/tháng; nâng giảm trừ NPT từ 4.4 triệu lên 6.2 triệu đồng/tháng/người.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold text-on-surface">• Nghị định số 253/2026/NĐ-CP:</span>
              <span>Hướng dẫn chi tiết khấu trừ tiền lương, tiền công và các khoản bảo hiểm bắt buộc.</span>
            </div>
            <div className="pt-2 text-[11px] text-outline/80 border-t border-border-subtle/50 flex items-center justify-between">
              <span>Hệ thống kiểm chứng tự động: 12/09/2026</span>
              <span className="text-blue-600 dark:text-blue-400 font-semibold">Verified Legal Rule</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
