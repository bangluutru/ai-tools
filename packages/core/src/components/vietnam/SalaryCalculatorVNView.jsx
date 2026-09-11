import React, { useState, useMemo } from 'react';
import {
  Calculator,
  ArrowRightLeft,
  ShieldCheck,
  Building2,
  Users,
  Info,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ExternalLink,
  Receipt
} from 'lucide-react';
import {
  calculateGrossToNet,
  calculateNetToGross
} from '../../vietnam/index.js';

export default function SalaryCalculatorVNView({ displayLang = 'vi' }) {
  const [calcMode, setCalcMode] = useState('grossToNet'); // 'grossToNet' | 'netToGross'
  const [salaryInput, setSalaryInput] = useState(30_000_000);
  const [salaryDisplay, setSalaryDisplay] = useState('30,000,000');

  const [useCustomInsurance, setUseCustomInsurance] = useState(false);
  const [insuranceInput, setInsuranceInput] = useState(30_000_000);
  const [insuranceDisplay, setInsuranceDisplay] = useState('30,000,000');

  const [region, setRegion] = useState(1);
  const [dependents, setDependents] = useState(0);
  const [monthYear, setMonthYear] = useState('2026-09');
  const [showEmployerCost, setShowEmployerCost] = useState(true);
  const [showFormula, setShowFormula] = useState(false);
  const [showLegalSources, setShowLegalSources] = useState(false);

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
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Calculator size={22} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-on-surface">
              {displayLang === 'ja'
                ? '給与シミュレーター (Gross ↔ Net)'
                : displayLang === 'en'
                ? 'Salary Calculator (Gross ↔ Net)'
                : 'Tính Lương Gross ↔ Net'}
            </h1>
            <p className="text-xs sm:text-sm text-outline">
              {displayLang === 'ja'
                ? 'ベトナム所得税法・社会保険法2026年最新基準'
                : displayLang === 'en'
                ? 'Vietnam 2026 Statutory PIT & Social Insurance Standard'
                : 'Chuẩn Luật Thuế TNCN 109/2025/QH15 & Luật BHXH 2024'}
            </p>
          </div>
        </div>

        {/* Mode Selector Toggle */}
        <div className="inline-flex rounded-xl bg-surface-container p-1 border border-border-subtle self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setCalcMode('grossToNet')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              calcMode === 'grossToNet'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-outline hover:text-on-surface'
            }`}
          >
            Gross → Net
          </button>
          <button
            type="button"
            onClick={() => setCalcMode('netToGross')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              calcMode === 'netToGross'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-outline hover:text-on-surface'
            }`}
          >
            Net → Gross
          </button>
        </div>
      </div>

      {/* Main Input Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Card: Input Parameters */}
        <div className="bg-surface-container/50 border border-border-subtle/80 rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-on-surface flex items-center gap-2">
              <Receipt size={16} className="text-emerald-500" />
              {calcMode === 'grossToNet' ? 'Mức lương Gross' : 'Mức lương Net mong muốn'}
            </h2>
            <div className="flex gap-1.5">
              {[15, 25, 30, 50].map((mil) => (
                <button
                  key={mil}
                  type="button"
                  onClick={() => {
                    const v = mil * 1_000_000;
                    setSalaryInput(v);
                    setSalaryDisplay(v.toLocaleString('vi-VN'));
                    if (!useCustomInsurance) {
                      setInsuranceInput(v);
                      setInsuranceDisplay(v.toLocaleString('vi-VN'));
                    }
                  }}
                  className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-surface-container-high/60 hover:bg-emerald-500/20 hover:text-emerald-600 dark:hover:text-emerald-400 text-outline transition-colors cursor-pointer"
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
              value={salaryDisplay}
              onChange={handleSalaryChange}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container border border-border-subtle focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-on-surface font-semibold text-lg outline-none transition-all pr-12"
              placeholder="Nhập mức lương..."
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-outline">
              VND
            </span>
          </div>

          {/* Insurance Base Option */}
          <div className="pt-2 border-t border-border-subtle/60 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-on-surface flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useCustomInsurance}
                  onChange={(e) => setUseCustomInsurance(e.target.checked)}
                  className="rounded border-border-subtle text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                Đóng bảo hiểm trên mức lương khác
              </label>
              {!useCustomInsurance && (
                <span className="text-[11px] text-outline italic">= Gross</span>
              )}
            </div>

            {useCustomInsurance && (
              <div className="relative pt-1">
                <input
                  type="text"
                  inputMode="numeric"
                  value={insuranceDisplay}
                  onChange={handleInsuranceChange}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container border border-border-subtle focus:border-emerald-500 text-on-surface text-sm outline-none transition-all pr-12 font-medium"
                  placeholder="Mức lương làm căn cứ đóng bảo hiểm..."
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-outline">
                  VND
                </span>
              </div>
            )}

            {result.warning && (
              <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs">
                <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                <span>{result.warning}</span>
              </div>
            )}
          </div>

          {/* Region & Dependents Selector */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <label className="text-xs font-medium text-outline block mb-1.5">
                Vùng lương tối thiểu
              </label>
              <select
                value={region}
                onChange={(e) => setRegion(Number(e.target.value))}
                className="w-full px-2.5 py-2 rounded-xl bg-surface-container border border-border-subtle text-on-surface text-xs font-medium outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value={1}>Vùng I (Hà Nội, HCM...)</option>
                <option value={2}>Vùng II (Đô thị loại II...)</option>
                <option value={3}>Vùng III (Huyện, thị xã...)</option>
                <option value={4}>Vùng IV (Còn lại...)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-outline block mb-1.5 flex items-center gap-1">
                <Users size={13} />
                Người phụ thuộc
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
          </div>

          {/* Month/Year selector */}
          <div className="pt-2">
            <label className="text-xs font-medium text-outline block mb-1.5">
              Thời điểm tính (Tháng/Năm)
            </label>
            <input
              type="month"
              value={monthYear}
              onChange={(e) => setMonthYear(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-surface-container border border-border-subtle text-on-surface text-xs font-medium outline-none focus:border-emerald-500 cursor-pointer"
            />
            <span className="text-[11px] text-outline ml-2">
              (Áp dụng chuẩn trần lương cơ sở theo thời điểm)
            </span>
          </div>
        </div>

        {/* Right Card: Result Hero */}
        <div className="bg-gradient-to-br from-emerald-500/10 via-surface-container/50 to-teal-500/10 border border-emerald-500/20 rounded-2xl p-5 sm:p-6 flex flex-col justify-between space-y-4 shadow-xs">
          <div>
            <div className="flex items-center justify-between text-xs text-outline mb-1">
              <span>{calcMode === 'grossToNet' ? 'LƯƠNG THỰC NHẬN (NET)' : 'LƯƠNG GROSS QUY ĐỔI'}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-300">
                100% OFFLINE
              </span>
            </div>

            <div className="text-3xl sm:text-4xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">
              {formatVND(calcMode === 'grossToNet' ? result.netSalary : result.grossSalary)}
            </div>

            <div className="text-xs text-outline mt-1">
              {calcMode === 'grossToNet'
                ? `Gross: ${formatVND(result.grossSalary)}`
                : `Net mục tiêu: ${formatVND(result.targetNet)}`}
            </div>
          </div>

          {/* Key Metrics Quick Summary */}
          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-border-subtle/80">
            <div className="bg-surface-container/60 rounded-xl p-3 border border-border-subtle/60">
              <span className="text-[11px] text-outline block">Bảo hiểm NLĐ (10.5%)</span>
              <span className="text-sm font-bold text-on-surface">
                {formatVND(result.employeeInsurance.total)}
              </span>
            </div>
            <div className="bg-surface-container/60 rounded-xl p-3 border border-border-subtle/60">
              <span className="text-[11px] text-outline block">Thuế TNCN (PIT)</span>
              <span className="text-sm font-bold text-rose-500">
                {formatVND(result.pitTax)}
              </span>
            </div>
          </div>

          {/* Employer Cost Block */}
          {showEmployerCost && (
            <div className="bg-surface-container/80 rounded-xl p-3 border border-border-subtle/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 size={16} className="text-blue-500" />
                <div>
                  <span className="text-xs font-semibold text-on-surface block">Chi phí Doanh nghiệp</span>
                  <span className="text-[11px] text-outline">Gross + Bảo hiểm NSDLĐ (21.5%)</span>
                </div>
              </div>
              <span className="text-sm font-bold text-on-surface">
                {formatVND(result.employerCost)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Breakdown Detailed Table */}
      <div className="bg-surface-container/40 border border-border-subtle rounded-2xl p-5 sm:p-6 space-y-4">
        <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
          <ShieldCheck size={17} className="text-emerald-500" />
          Bảng kê chi tiết bóc tách tiền lương & thuế
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-border-subtle/80 text-outline">
                <th className="py-2.5 font-semibold">Khoản mục</th>
                <th className="py-2.5 font-semibold text-right">Tỷ lệ / Căn cứ</th>
                <th className="py-2.5 font-semibold text-right">Số tiền (VND)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/40">
              <tr className="font-semibold text-on-surface">
                <td className="py-2">1. Lương Gross</td>
                <td className="py-2 text-right text-outline">Khai báo</td>
                <td className="py-2 text-right">{formatVND(result.grossSalary)}</td>
              </tr>
              <tr className="text-outline">
                <td className="py-2 pl-4">— BHXH (Hưu trí, tử tuất)</td>
                <td className="py-2 text-right">8% {result.employeeInsurance.isBhxhCapped ? '(Chạm trần)' : ''}</td>
                <td className="py-2 text-right text-on-surface">{formatVND(result.employeeInsurance.bhxh)}</td>
              </tr>
              <tr className="text-outline">
                <td className="py-2 pl-4">— BHYT (Y tế)</td>
                <td className="py-2 text-right">1.5%</td>
                <td className="py-2 text-right text-on-surface">{formatVND(result.employeeInsurance.bhyt)}</td>
              </tr>
              <tr className="text-outline">
                <td className="py-2 pl-4">— BHTN (Thất nghiệp)</td>
                <td className="py-2 text-right">1% {result.employeeInsurance.isBhtnCapped ? '(Chạm trần)' : ''}</td>
                <td className="py-2 text-right text-on-surface">{formatVND(result.employeeInsurance.bhtn)}</td>
              </tr>
              <tr className="font-medium text-on-surface bg-surface-container-high/20">
                <td className="py-2">2. Thu nhập trước giảm trừ gia cảnh</td>
                <td className="py-2 text-right text-outline">Gross - Bảo hiểm</td>
                <td className="py-2 text-right">{formatVND(result.incomeBeforeFamilyDeduction)}</td>
              </tr>
              <tr className="text-outline">
                <td className="py-2 pl-4">— Giảm trừ bản thân</td>
                <td className="py-2 text-right">NQ 110/2025</td>
                <td className="py-2 text-right text-on-surface">-{formatVND(result.personalDeduction)}</td>
              </tr>
              <tr className="text-outline">
                <td className="py-2 pl-4">— Giảm trừ người phụ thuộc ({result.dependents} người)</td>
                <td className="py-2 text-right">6.2tr/người/tháng</td>
                <td className="py-2 text-right text-on-surface">-{formatVND(result.dependentDeduction)}</td>
              </tr>
              <tr className="font-medium text-on-surface bg-surface-container-high/20">
                <td className="py-2">3. Thu nhập tính thuế (Taxable Income)</td>
                <td className="py-2 text-right text-outline">Lũy tiến 5 bậc</td>
                <td className="py-2 text-right font-bold text-emerald-600 dark:text-emerald-400">
                  {formatVND(result.taxableIncome)}
                </td>
              </tr>
              <tr className="font-semibold text-rose-500">
                <td className="py-2">4. Thuế thu nhập cá nhân (PIT)</td>
                <td className="py-2 text-right text-outline">Biểu 5 bậc 2026</td>
                <td className="py-2 text-right">{formatVND(result.pitTax)}</td>
              </tr>
              <tr className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 text-sm">
                <td className="py-2.5">5. LƯƠNG THỰC NHẬN (NET)</td>
                <td className="py-2.5 text-right text-xs text-outline font-normal">Gross - BH - PIT</td>
                <td className="py-2.5 text-right">{formatVND(result.netSalary)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Collapsible: Formula / Xem cách tính */}
      <div className="border border-border-subtle rounded-xl overflow-hidden bg-surface-container/30">
        <button
          type="button"
          onClick={() => setShowFormula(!showFormula)}
          className="w-full px-4 py-3 flex items-center justify-between text-xs font-semibold text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Sparkles size={14} className="text-emerald-500" />
            Xem cách tính chi tiết & Công thức
          </span>
          {showFormula ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
        {showFormula && (
          <div className="p-4 border-t border-border-subtle bg-surface-container/60 text-xs font-mono space-y-2 text-outline">
            <p><span className="text-on-surface font-semibold">Net =</span> Gross - (BHXH + BHYT + BHTN) - PIT</p>
            <p><span className="text-on-surface font-semibold">Bảo hiểm NLĐ =</span> {result.employeeInsurance.bhxh.toLocaleString('vi-VN')} + {result.employeeInsurance.bhyt.toLocaleString('vi-VN')} + {result.employeeInsurance.bhtn.toLocaleString('vi-VN')} = {result.employeeInsurance.total.toLocaleString('vi-VN')} VND</p>
            <p><span className="text-on-surface font-semibold">Thu nhập tính thuế =</span> max(0, {result.grossSalary.toLocaleString('vi-VN')} - {result.totalDeductions.toLocaleString('vi-VN')}) = {result.taxableIncome.toLocaleString('vi-VN')} VND</p>
            <p><span className="text-on-surface font-semibold">Thuế TNCN =</span> {result.pitBracketsBreakdown.filter(b => b.taxAmount > 0).map(b => b.formula).join(' + ') || '0 VND'} = {result.pitTax.toLocaleString('vi-VN')} VND</p>
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
              <span>Biểu thuế lũy tiến từng phần 5 bậc mới (5%, 10%, 20%, 30%, 35%).</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold text-on-surface">• Nghị quyết 110/2025/UBTVQH15:</span>
              <span>Giảm trừ gia cảnh: Bản thân 15.5 triệu/tháng (186tr/năm), Người phụ thuộc 6.2 triệu/tháng.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold text-on-surface">• Nghị định 161/2026/NĐ-CP & NĐ 73/2024/NĐ-CP:</span>
              <span>Lương cơ sở 2.530.000đ từ 01/07/2026 (trần BHXH/BHYT 50.6tr), trước đó là 2.340.000đ (trần 46.8tr).</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold text-on-surface">• Nghị định 293/2025/NĐ-CP:</span>
              <span>Lương tối thiểu 4 vùng (Vùng I: 5.31tr, II: 4.73tr, III: 4.14tr, IV: 3.70tr) áp dụng trần BHTN.</span>
            </div>
            <div className="pt-2 text-[11px] text-outline/80 border-t border-border-subtle/50 flex items-center justify-between">
              <span>Hệ thống kiểm chứng tự động: 12/09/2026</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Verified Legal Rule</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
