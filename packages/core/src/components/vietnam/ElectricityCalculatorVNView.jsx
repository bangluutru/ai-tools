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
  Percent
} from 'lucide-react';
import {
  calculateVietnamElectricity,
  getElectricityTariff,
  getElectricityVATRule
} from '../../vietnam/index.js';

export default function ElectricityCalculatorVNView({ displayLang = 'vi' }) {
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
  const [showLegalSources, setShowLegalSources] = useState(false);

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
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Zap size={22} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-on-surface">
              {displayLang === 'ja'
                ? 'ベトナム家庭用電気料金シミュレーター (6段階)'
                : displayLang === 'en'
                ? 'Vietnam Residential Electricity Calculator'
                : 'Tính Tiền Điện Sinh Hoạt (Biểu 6 Bậc)'}
            </h1>
            <p className="text-xs sm:text-sm text-outline">
              Chuẩn Quyết định 1279/QĐ-BCT của Bộ Công Thương (áp dụng từ 10/05/2025)
            </p>
          </div>
        </div>

        {/* Input Mode Selector */}
        <div className="inline-flex rounded-xl bg-surface-container p-1 border border-border-subtle self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setInputMode('kwh')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              inputMode === 'kwh' ? 'bg-amber-600 text-white shadow-xs' : 'text-outline hover:text-on-surface'
            }`}
          >
            Nhập số kWh
          </button>
          <button
            type="button"
            onClick={() => setInputMode('meter')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              inputMode === 'meter' ? 'bg-amber-600 text-white shadow-xs' : 'text-outline hover:text-on-surface'
            }`}
          >
            Chỉ số công tơ
          </button>
        </div>
      </div>

      {/* Main Grid: Inputs & Result Hero */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Input Card */}
        <div className="bg-surface-container/50 border border-border-subtle/80 rounded-2xl p-5 sm:p-6 space-y-4">
          {inputMode === 'kwh' ? (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-on-surface">Điện năng tiêu thụ trong tháng</label>
                <div className="flex gap-1.5">
                  {[50, 100, 250, 350, 500].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => {
                        setKwhInput(val);
                        setKwhDisplay(String(val));
                      }}
                      className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-surface-container-high/60 hover:bg-amber-500/20 hover:text-amber-600 text-outline transition-colors cursor-pointer"
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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container border border-border-subtle focus:border-amber-500 text-on-surface font-semibold text-lg outline-none transition-all pr-14"
                  placeholder="250"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-outline">
                  kWh
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-outline block mb-1">
                  Chỉ số công tơ cũ (kỳ trước)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={oldReadingDisplay}
                    onChange={handleOldReadingChange}
                    className="w-full px-3 py-2 rounded-xl bg-surface-container border border-border-subtle text-on-surface text-sm font-medium outline-none focus:border-amber-500 pr-12"
                    placeholder="1,200"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-outline">kWh</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-outline block mb-1">
                  Chỉ số công tơ mới (kỳ này)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={newReadingDisplay}
                    onChange={handleNewReadingChange}
                    className="w-full px-3 py-2 rounded-xl bg-surface-container border border-border-subtle text-on-surface text-sm font-medium outline-none focus:border-amber-500 pr-12"
                    placeholder="1,450"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-outline">kWh</span>
                </div>
              </div>

              {result.validationError ? (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">
                  <AlertTriangle size={15} className="shrink-0" />
                  <span>{result.validationError}</span>
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-surface-container-high/40 text-xs text-on-surface flex items-center justify-between font-medium">
                  <span>Điện năng tiêu thụ (Mới - Cũ):</span>
                  <strong className="text-amber-600 dark:text-amber-400 font-bold text-sm">
                    {result.kwh.toLocaleString('vi-VN')} kWh
                  </strong>
                </div>
              )}
            </div>
          )}

          {/* VAT Selection */}
          <div className="pt-2 border-t border-border-subtle/60">
            <label className="text-xs font-semibold text-outline block mb-1.5 flex items-center gap-1.5">
              <Percent size={13} />
              Thuế suất GTGT (VAT) áp dụng
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { rate: 0.08, label: '8% (Ưu đãi)' },
                { rate: 0.10, label: '10% (Chuẩn)' },
                { rate: 0.00, label: '0% (Miễn thuế)' },
              ].map((v) => (
                <button
                  key={v.rate}
                  type="button"
                  onClick={() => setVatRate(v.rate)}
                  className={`py-1.5 px-2 rounded-xl text-xs font-medium border transition-all cursor-pointer text-center ${
                    vatRate === v.rate
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-300 font-bold shadow-2xs'
                      : 'bg-surface-container border-border-subtle/80 text-outline hover:text-on-surface'
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Hero Result Card */}
        <div className="bg-gradient-to-br from-amber-500/10 via-surface-container/50 to-orange-500/10 border border-amber-500/20 rounded-2xl p-5 sm:p-6 flex flex-col justify-between space-y-4 shadow-xs">
          <div>
            <div className="flex items-center justify-between text-xs text-outline mb-1">
              <span>TỔNG TIỀN ĐIỆN PHẢI THANH TOÁN</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-300">
                ĐÃ GỒM VAT
              </span>
            </div>

            <div className="text-3xl sm:text-4xl font-extrabold text-amber-600 dark:text-amber-400 tracking-tight">
              {formatVND(result.totalAmount)}
            </div>

            <div className="text-xs text-outline mt-1">
              Tiêu thụ: <strong className="text-on-surface">{result.kwh.toLocaleString('vi-VN')} kWh</strong>
            </div>
          </div>

          {/* Subtotal & VAT Breakdown */}
          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-border-subtle/80">
            <div className="bg-surface-container/60 rounded-xl p-3 border border-border-subtle/60">
              <span className="text-[11px] text-outline block">Tiền điện trước VAT</span>
              <span className="text-sm font-bold text-on-surface">
                {formatVND(result.subtotalBeforeVat)}
              </span>
            </div>
            <div className="bg-surface-container/60 rounded-xl p-3 border border-border-subtle/60">
              <span className="text-[11px] text-outline block">Thuế VAT ({(result.vatRate * 100)}%)</span>
              <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                {formatVND(result.vatAmount)}
              </span>
            </div>
          </div>

          <div className="text-[11px] text-outline italic">
            * Đơn giá bình quân thực tế: {result.kwh > 0 ? Math.round(result.totalAmount / result.kwh).toLocaleString('vi-VN') : 0} ₫/kWh (đã gồm VAT).
          </div>
        </div>
      </div>

      {/* Tier-by-Tier Breakdown Table */}
      <div className="bg-surface-container/40 border border-border-subtle rounded-2xl p-5 sm:p-6 space-y-4">
        <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
          <Gauge size={16} className="text-amber-500" />
          Bảng kê phân bổ sản lượng điện theo 6 bậc lũy tiến
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-border-subtle/80 text-outline">
                <th className="py-2.5 font-semibold">Bậc thang</th>
                <th className="py-2.5 font-semibold">Khung sản lượng</th>
                <th className="py-2.5 font-semibold text-right">Đơn giá (₫/kWh)</th>
                <th className="py-2.5 font-semibold text-right">Sản lượng bậc (kWh)</th>
                <th className="py-2.5 font-semibold text-right">Thành tiền trước VAT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/40">
              {result.tiersBreakdown.map((t) => (
                <tr
                  key={t.tier}
                  className={t.consumedKwh > 0 ? 'bg-amber-500/5 font-medium text-on-surface' : 'text-outline/70'}
                >
                  <td className="py-2.5 font-bold">Bậc {t.tier}</td>
                  <td className="py-2.5">{t.label_vn.replace(/Bậc \d+ /, '')}</td>
                  <td className="py-2.5 text-right font-mono">{t.unitPrice.toLocaleString('vi-VN')} ₫</td>
                  <td className="py-2.5 text-right font-bold">{t.consumedKwh.toLocaleString('vi-VN')}</td>
                  <td className={`py-2.5 text-right font-semibold ${t.consumedKwh > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-outline/50'}`}>
                    {formatVND(t.amount)}
                  </td>
                </tr>
              ))}
              <tr className="font-semibold text-on-surface bg-surface-container-high/20">
                <td className="py-2.5" colSpan={3}>Tổng tiền điện trước thuế</td>
                <td className="py-2.5 text-right font-bold">{result.kwh.toLocaleString('vi-VN')} kWh</td>
                <td className="py-2.5 text-right font-bold">{formatVND(result.subtotalBeforeVat)}</td>
              </tr>
              <tr className="text-outline">
                <td className="py-2" colSpan={4}>Thuế giá trị gia tăng (VAT {(result.vatRate * 100)}%)</td>
                <td className="py-2 text-right font-medium text-on-surface">{formatVND(result.vatAmount)}</td>
              </tr>
              <tr className="font-bold text-sm text-amber-600 dark:text-amber-400 bg-amber-500/10">
                <td className="py-2.5" colSpan={4}>TỔNG TIỀN ĐIỆN THANH TOÁN</td>
                <td className="py-2.5 text-right">{formatVND(result.totalAmount)}</td>
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
            <Sparkles size={14} className="text-amber-500" />
            Xem công thức tính toán chi tiết
          </span>
          {showFormula ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
        {showFormula && (
          <div className="p-4 border-t border-border-subtle bg-surface-container/60 text-xs font-mono space-y-2 text-outline">
            <p><span className="text-on-surface font-semibold">Tiền điện trước VAT =</span> {result.formula.subtotal} = {result.subtotalBeforeVat.toLocaleString('vi-VN')} VND</p>
            <p><span className="text-on-surface font-semibold">Thuế GTGT =</span> {result.formula.vat}</p>
            <p><span className="text-on-surface font-semibold">Tổng thanh toán =</span> {result.formula.total}</p>
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
            <Info size={14} className="text-amber-500" />
            ⓘ Căn cứ pháp lý & Ngày cập nhật quy chuẩn
          </span>
          {showLegalSources ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
        {showLegalSources && (
          <div className="p-4 border-t border-border-subtle bg-surface-container/60 text-xs space-y-2.5 text-outline">
            <div className="flex items-start gap-2">
              <span className="font-semibold text-on-surface">• Quyết định số 1279/QĐ-BCT của Bộ Công Thương:</span>
              <span>Ban hành ngày 09/05/2025, có hiệu lực từ 10/05/2025 quy định mức giá bán lẻ điện sinh hoạt 6 bậc thang.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold text-on-surface">• Tách biệt biểu giá và VAT:</span>
              <span>Biểu giá điện được ban hành chưa bao gồm thuế GTGT. Thuế GTGT được áp dụng độc lập theo Luật Thuế Giá trị gia tăng và các nghị quyết giảm thuế của Quốc hội/Chính phủ.</span>
            </div>
            <div className="pt-2 text-[11px] text-outline/80 border-t border-border-subtle/50 flex items-center justify-between">
              <span>Hệ thống kiểm chứng tự động: 12/09/2026</span>
              <span className="text-amber-600 dark:text-amber-400 font-semibold">Verified Legal Rule</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
