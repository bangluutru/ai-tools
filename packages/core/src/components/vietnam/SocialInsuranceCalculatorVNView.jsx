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
  Layers
} from 'lucide-react';
import {
  calculateVietnamInsurance
} from '../../vietnam/index.js';

export default function SocialInsuranceCalculatorVNView({ displayLang = 'vi' }) {
  const [salaryInput, setSalaryInput] = useState(30_000_000);
  const [salaryDisplay, setSalaryDisplay] = useState('30,000,000');
  const [region, setRegion] = useState(1);
  const [monthYear, setMonthYear] = useState('2026-09');
  const [viewScope, setViewScope] = useState('both'); // 'employee' | 'employer' | 'both'

  const [showFormula, setShowFormula] = useState(false);
  const [showLegalSources, setShowLegalSources] = useState(false);

  const formatVND = (num) => (Number(num) || 0).toLocaleString('vi-VN') + ' ₫';

  const handleSalaryChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '');
    const val = raw ? parseInt(raw, 10) : 0;
    setSalaryInput(val);
    setSalaryDisplay(raw ? val.toLocaleString('vi-VN') : '');
  };

  const result = useMemo(() => {
    const dateStr = monthYear ? `${monthYear}-01` : '2026-09-01';
    return calculateVietnamInsurance(salaryInput, region, dateStr);
  }, [salaryInput, region, monthYear]);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <ShieldCheck size={22} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-on-surface">
              {displayLang === 'ja'
                ? 'ベトナム社会保険試算 (BHXH, BHYT, BHTN 2026)'
                : displayLang === 'en'
                ? 'Vietnam Social Insurance Calculator 2026'
                : 'Tính BHXH, BHYT & BHTN'}
            </h1>
            <p className="text-xs sm:text-sm text-outline">
              Chuẩn Luật BHXH 2024, Luật BHYT 2024 & Nghị định 161/2026/NĐ-CP
            </p>
          </div>
        </div>

        {/* View Scope Selector */}
        <div className="inline-flex rounded-xl bg-surface-container p-1 border border-border-subtle self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewScope('both')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewScope === 'both' ? 'bg-purple-600 text-white shadow-xs' : 'text-outline hover:text-on-surface'
            }`}
          >
            Cả hai bên (32%)
          </button>
          <button
            type="button"
            onClick={() => setViewScope('employee')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewScope === 'employee' ? 'bg-purple-600 text-white shadow-xs' : 'text-outline hover:text-on-surface'
            }`}
          >
            NLĐ (10.5%)
          </button>
          <button
            type="button"
            onClick={() => setViewScope('employer')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewScope === 'employer' ? 'bg-purple-600 text-white shadow-xs' : 'text-outline hover:text-on-surface'
            }`}
          >
            Doanh nghiệp (21.5%)
          </button>
        </div>
      </div>

      {/* Input Parameters & Summary Hero */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Input Card */}
        <div className="bg-surface-container/50 border border-border-subtle/80 rounded-2xl p-5 sm:p-6 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-on-surface">Mức lương làm căn cứ đóng bảo hiểm</label>
              <div className="flex gap-1.5">
                {[10, 20, 30, 50, 100].map((mil) => (
                  <button
                    key={mil}
                    type="button"
                    onClick={() => {
                      const v = mil * 1_000_000;
                      setSalaryInput(v);
                      setSalaryDisplay(v.toLocaleString('vi-VN'));
                    }}
                    className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-surface-container-high/60 hover:bg-purple-500/20 hover:text-purple-600 text-outline transition-colors cursor-pointer"
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
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container border border-border-subtle focus:border-purple-500 text-on-surface font-semibold text-lg outline-none transition-all pr-12"
                placeholder="30,000,000"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-outline">
                VND
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="text-xs font-semibold text-outline block mb-1.5">
                Vùng lương tối thiểu
              </label>
              <select
                value={region}
                onChange={(e) => setRegion(Number(e.target.value))}
                className="w-full px-2.5 py-2 rounded-xl bg-surface-container border border-border-subtle text-on-surface text-xs font-medium outline-none focus:border-purple-500 cursor-pointer"
              >
                <option value={1}>Vùng I (5.31tr - trần BHTN 106.2tr)</option>
                <option value={2}>Vùng II (4.73tr - trần BHTN 94.6tr)</option>
                <option value={3}>Vùng III (4.14tr - trần BHTN 82.8tr)</option>
                <option value={4}>Vùng IV (3.70tr - trần BHTN 74.0tr)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-outline block mb-1.5">
                Thời điểm tính (Tháng/Năm)
              </label>
              <input
                type="month"
                value={monthYear}
                onChange={(e) => setMonthYear(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl bg-surface-container border border-border-subtle text-on-surface text-xs font-medium outline-none focus:border-purple-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Ceiling Cap Indicators */}
          <div className="space-y-2 pt-2 border-t border-border-subtle/50 text-xs text-outline">
            <div className="flex items-center justify-between">
              <span>Lương cơ sở áp dụng:</span>
              <strong className="text-on-surface">{formatVND(result.baseSalaryReference)}/tháng</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>Trần đóng BHXH/BHYT (20x lương cơ sở):</span>
              <span className={`font-semibold ${result.isBhxhCapped ? 'text-amber-500' : 'text-on-surface'}`}>
                {formatVND(result.bhxhCeiling)} {result.isBhxhCapped && '(Đang áp trần)'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Trần đóng BHTN ({result.regionName}):</span>
              <span className={`font-semibold ${result.isBhtnCapped ? 'text-amber-500' : 'text-on-surface'}`}>
                {formatVND(result.bhtnCeiling)} {result.isBhtnCapped && '(Đang áp trần)'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Hero Summary Card */}
        <div className="bg-gradient-to-br from-purple-500/10 via-surface-container/50 to-indigo-500/10 border border-purple-500/20 rounded-2xl p-5 sm:p-6 flex flex-col justify-between space-y-4 shadow-xs">
          <div>
            <div className="flex items-center justify-between text-xs text-outline mb-1">
              <span>
                {viewScope === 'both'
                  ? 'TỔNG ĐÓNG BẢO HIỂM 2 BÊN (32%)'
                  : viewScope === 'employee'
                  ? 'TIỀN BẢO HIỂM NLĐ ĐÓNG (10.5%)'
                  : 'TIỀN BẢO HIỂM DOANH NGHIỆP ĐÓNG (21.5%)'}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-600 dark:text-purple-300">
                CHUẨN LUẬT 2026
              </span>
            </div>

            <div className="text-3xl sm:text-4xl font-extrabold text-purple-600 dark:text-purple-400 tracking-tight">
              {formatVND(
                viewScope === 'both'
                  ? result.totalCombined
                  : viewScope === 'employee'
                  ? result.employee.total
                  : result.employer.total
              )}
            </div>

            <div className="text-xs text-outline mt-1">
              Mức lương căn cứ: <strong className="text-on-surface">{formatVND(result.insuranceBase)}</strong>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-border-subtle/80">
            <div className="bg-surface-container/60 rounded-xl p-3 border border-border-subtle/60">
              <span className="text-[11px] text-outline block">Người lao động (10.5%)</span>
              <span className="text-sm font-bold text-on-surface">
                {formatVND(result.employee.total)}
              </span>
            </div>
            <div className="bg-surface-container/60 rounded-xl p-3 border border-border-subtle/60">
              <span className="text-[11px] text-outline block">Doanh nghiệp (21.5%)</span>
              <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                {formatVND(result.employer.total)}
              </span>
            </div>
          </div>

          {result.isBhxhCapped && (
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>Tiền lương vượt trần {formatVND(result.bhxhCeiling)}; BHXH & BHYT chỉ tính trên mức trần tối đa.</span>
            </div>
          )}
        </div>
      </div>

      {/* Breakdown Table */}
      <div className="bg-surface-container/40 border border-border-subtle rounded-2xl p-5 sm:p-6 space-y-4">
        <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
          <Layers size={16} className="text-purple-500" />
          Bảng kê phân bổ chi tiết các quỹ bảo hiểm
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-border-subtle/80 text-outline">
                <th className="py-2.5 font-semibold">Quỹ bảo hiểm</th>
                <th className="py-2.5 font-semibold text-center">NLĐ đóng (%)</th>
                <th className="py-2.5 font-semibold text-right">NLĐ nộp (VND)</th>
                <th className="py-2.5 font-semibold text-center">Doanh nghiệp (%)</th>
                <th className="py-2.5 font-semibold text-right">Doanh nghiệp nộp (VND)</th>
                <th className="py-2.5 font-semibold text-right">Tổng 2 bên (VND)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/40">
              <tr>
                <td className="py-2.5 font-medium text-on-surface">1. Hưu trí & Tử tuất</td>
                <td className="py-2.5 text-center font-bold">8.0%</td>
                <td className="py-2.5 text-right font-semibold">{formatVND(result.employee.bhxh)}</td>
                <td className="py-2.5 text-center font-bold">14.0%</td>
                <td className="py-2.5 text-right font-semibold">{formatVND(result.employer.bhxhRetirement)}</td>
                <td className="py-2.5 text-right font-bold text-on-surface">{formatVND(result.employee.bhxh + result.employer.bhxhRetirement)}</td>
              </tr>
              <tr>
                <td className="py-2.5 font-medium text-on-surface">2. Ốm đau & Thai sản</td>
                <td className="py-2.5 text-center text-outline">—</td>
                <td className="py-2.5 text-right text-outline">0 ₫</td>
                <td className="py-2.5 text-center font-bold">3.0%</td>
                <td className="py-2.5 text-right font-semibold">{formatVND(result.employer.bhxhMaternity)}</td>
                <td className="py-2.5 text-right font-bold text-on-surface">{formatVND(result.employer.bhxhMaternity)}</td>
              </tr>
              <tr>
                <td className="py-2.5 font-medium text-on-surface">3. BHYT (Y tế)</td>
                <td className="py-2.5 text-center font-bold">1.5%</td>
                <td className="py-2.5 text-right font-semibold">{formatVND(result.employee.bhyt)}</td>
                <td className="py-2.5 text-center font-bold">3.0%</td>
                <td className="py-2.5 text-right font-semibold">{formatVND(result.employer.bhyt)}</td>
                <td className="py-2.5 text-right font-bold text-on-surface">{formatVND(result.employee.bhyt + result.employer.bhyt)}</td>
              </tr>
              <tr>
                <td className="py-2.5 font-medium text-on-surface">4. BHTN (Thất nghiệp)</td>
                <td className="py-2.5 text-center font-bold">1.0%</td>
                <td className="py-2.5 text-right font-semibold">{formatVND(result.employee.bhtn)}</td>
                <td className="py-2.5 text-center font-bold">1.0%</td>
                <td className="py-2.5 text-right font-semibold">{formatVND(result.employer.bhtn)}</td>
                <td className="py-2.5 text-right font-bold text-on-surface">{formatVND(result.employee.bhtn + result.employer.bhtn)}</td>
              </tr>
              <tr>
                <td className="py-2.5 font-medium text-on-surface">5. TNLĐ - BNN (Tai nạn LĐ)</td>
                <td className="py-2.5 text-center text-outline">—</td>
                <td className="py-2.5 text-right text-outline">0 ₫</td>
                <td className="py-2.5 text-center font-bold">0.5%</td>
                <td className="py-2.5 text-right font-semibold">{formatVND(result.employer.occupationalAccident)}</td>
                <td className="py-2.5 text-right font-bold text-on-surface">{formatVND(result.employer.occupationalAccident)}</td>
              </tr>
              <tr className="font-bold text-sm text-purple-600 dark:text-purple-400 bg-purple-500/10">
                <td className="py-3">TỔNG CỘNG</td>
                <td className="py-3 text-center">10.5%</td>
                <td className="py-3 text-right">{formatVND(result.employee.total)}</td>
                <td className="py-3 text-center">21.5%</td>
                <td className="py-3 text-right">{formatVND(result.employer.total)}</td>
                <td className="py-3 text-right">{formatVND(result.totalCombined)}</td>
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
            <Sparkles size={14} className="text-purple-500" />
            Xem công thức tính toán chi tiết
          </span>
          {showFormula ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
        {showFormula && (
          <div className="p-4 border-t border-border-subtle bg-surface-container/60 text-xs font-mono space-y-2 text-outline">
            <p><span className="text-on-surface font-semibold">BHXH NLĐ (8%):</span> {result.formula.employeeBhxh}</p>
            <p><span className="text-on-surface font-semibold">BHYT NLĐ (1.5%):</span> {result.formula.employeeBhyt}</p>
            <p><span className="text-on-surface font-semibold">BHTN NLĐ (1%):</span> {result.formula.employeeBhtn}</p>
            <p><span className="text-on-surface font-semibold">Tổng NLĐ (10.5%):</span> {result.formula.employeeTotal}</p>
            <p><span className="text-on-surface font-semibold">Tổng Doanh nghiệp (21.5%):</span> {result.formula.employerTotal}</p>
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
            <Info size={14} className="text-purple-500" />
            ⓘ Căn cứ pháp lý & Ngày cập nhật quy chuẩn
          </span>
          {showLegalSources ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
        {showLegalSources && (
          <div className="p-4 border-t border-border-subtle bg-surface-container/60 text-xs space-y-2.5 text-outline">
            <div className="flex items-start gap-2">
              <span className="font-semibold text-on-surface">• Luật Bảo hiểm xã hội 2024:</span>
              <span>Quy định chế độ hưu trí, tử tuất (NLĐ 8%, DN 14%), ốm đau thai sản (DN 3%), TNLĐ-BNN (DN 0.5%).</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold text-on-surface">• Luật Bảo hiểm y tế 2024 & Luật Việc làm 2025:</span>
              <span>Tỷ lệ đóng BHYT (NLĐ 1.5%, DN 3%), BHTN (NLĐ 1%, DN 1%).</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold text-on-surface">• Nghị định 161/2026/NĐ-CP & NĐ 73/2024/NĐ-CP:</span>
              <span>Lương cơ sở 2.530.000đ từ 01/07/2026 (trần BHXH/BHYT 50.6tr); trước 01/07/2026 là 2.340.000đ (trần 46.8tr).</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold text-on-surface">• Nghị định 293/2025/NĐ-CP:</span>
              <span>Lương tối thiểu vùng từ 01/01/2026 áp dụng trần BHTN tối đa 20 lần mức lương tối thiểu vùng.</span>
            </div>
            <div className="pt-2 text-[11px] text-outline/80 border-t border-border-subtle/50 flex items-center justify-between">
              <span>Hệ thống kiểm chứng tự động: 12/09/2026</span>
              <span className="text-purple-600 dark:text-purple-400 font-semibold">Verified Legal Rule</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
