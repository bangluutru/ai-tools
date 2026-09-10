/**
 * @file packages/core/src/components/housing/MovingCostView.jsx
 * @description
 * Giao diện Mô phỏng Chi phí Chuyển nhà Nhật Bản (引越し費用シミュレーター).
 * Căn cứ: 国土交通省「標準引越運送約款」
 * Tuân thủ nghiêm ngặt MAIS: StandardToolLayout 1240px, Design Tokens, Trilingual (ja/vi/en), WCAG AA.
 */

import React, { useState, useMemo } from 'react';
import {
  Truck,
  Calendar,
  Clock,
  MapPin,
  Users,
  Wrench,
  AlertCircle,
  HelpCircle,
  PiggyBank,
  CheckCircle2,
  FileText,
  ShieldCheck,
  ChevronRight,
  Info,
  DollarSign,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

import StandardToolLayout from '../shared/StandardToolLayout.jsx';
import RegulatorySourceView from '../regulatory/RegulatorySourceView.jsx';
import {
  HOUSEHOLD_TYPES,
  DISTANCE_BANDS,
  SEASONALITY,
  TIME_SLOTS,
  ADDON_SERVICES,
  calculateMovingCost,
  MOVING_COST_SOURCES,
} from '../../japan/housing/index.js';

const TRANSLATIONS = {
  ja: {
    toolTitle: '引越し費用シミュレーター（相場計算・繁忙期・キャンセル約款）',
    toolDesc: '国土交通省「標準引越運送約款」及び引越し業界相場基準に基づく、世帯人数・移動距離・時期・時間帯・オプション別の概算見積もりシミュレーターです。',
    sectionInput: '1. 引越し条件の設定',
    householdLabel: '世帯人数・荷物量（トラック目安）',
    distanceLabel: '移動距離区分',
    monthLabel: '引越し予定月（時期）',
    timeSlotLabel: '希望時間帯（トラック便）',
    addonsHeading: 'オプション工事・代行サービス',
    acLabel: 'エアコン脱着工事（台数）',
    packingLabel: '荷造り代行（小物梱包）',
    unpackingLabel: '開梱・荷解き代行',
    pianoLabel: 'ピアノ・大型重量物の特別運搬',
    wasteLabel: '不用品回収・粗大ゴミ引き取り代行',
    yenUnit: '円',
    unitCount: '台',
    sectionEstimate: '2. 概算見積もり結果',
    averageEstimateLabel: '相場見積もり目安',
    estimateRangeLabel: '相場価格帯（交渉後〜繁忙/週末）',
    truckBadgeLabel: '推奨トラック：',
    sectionBreakdown: '3. 料金内訳の内訳詳細',
    sectionCancellation: '4. 国土交通省 約款に基づく解約手数料（キャンセル料）',
    cancellationDesc: '「標準引越運送約款」により、解約・延期の手数料上限が厳格に定められています。',
    sectionTips: '5. 引越し費用を安く抑える5つの黄金ルール',
    sectionRelated: '6. 関連する住まい・手続きツール',
    regulatorySectionTitle: '参照公定基準・約款（Primary Regulatory Sources）',
  },
  vi: {
    toolTitle: 'Mô Phỏng Chi Phí Chuyển Nhà Tại Nhật (引越し費用シミュレーター)',
    toolDesc: 'Căn cứ Quy ước vận chuyển chuyển nhà tiêu chuẩn của Bộ Giao thông Nhật Bản (MLIT): Ước tính cước phí chi tiết theo quy mô hộ, khoảng cách, mùa cao điểm, giờ chuyển và phí hủy hợp đồng luật định.',
    sectionInput: '1. Thiết lập điều kiện chuyển nhà',
    householdLabel: 'Quy mô gia đình & lượng đồ (Cỡ xe đề xuất)',
    distanceLabel: 'Khoảng cách chuyển dọn',
    monthLabel: 'Tháng dự kiến chuyển (Ảnh hưởng mùa cao điểm)',
    timeSlotLabel: 'Khung giờ chuyển trong ngày',
    addonsHeading: 'Dịch vụ phụ trợ & Lắp đặt',
    acLabel: 'Tháo lắp điều hòa (Số lượng máy)',
    packingLabel: 'Đóng gói đồ đạc hộ (Phòng bếp, đồ nhỏ)',
    unpackingLabel: 'Mở thùng & xếp đồ vào tủ hộ',
    pianoLabel: 'Vận chuyển đàn Piano / Đồ cồng kềnh đặc biệt',
    wasteLabel: 'Thu gom & vứt đồ cũ cồng kềnh (Tủ, giường, đệm...)',
    yenUnit: '円',
    unitCount: 'máy',
    sectionEstimate: '2. Kết quả ước tính chi phí',
    averageEstimateLabel: 'Chi phí ước tính trung bình',
    estimateRangeLabel: 'Biên độ giá (Từ đàm phán khéo đến ngày cao điểm)',
    truckBadgeLabel: 'Cỡ xe đề xuất:',
    sectionBreakdown: '3. Bảng phân rã chi phí chi tiết',
    sectionCancellation: '4. Biểu phí hủy hợp đồng theo quy định Bộ Giao thông MLIT',
    cancellationDesc: 'Theo Điều 21 Quy ước vận chuyển chuẩn của Bộ Giao thông MLIT, mức phạt hủy/dời lịch được giới hạn rõ ràng.',
    sectionTips: '5. 5 Mẹo vàng giúp tiết kiệm hàng vạn Yên tiền chuyển nhà',
    sectionRelated: '6. Công cụ liên kết trong Hệ sinh thái Nhà ở',
    regulatorySectionTitle: 'Căn cứ Quy ước & Cơ quan Ban hành (Primary Regulatory Sources)',
  },
  en: {
    toolTitle: 'Japan Moving Cost Simulator (引越し費用シミュレーター)',
    toolDesc: 'Estimated moving costs and MLIT statutory cancellation fee guidelines based on household size, distance, season, timing, and addon services.',
    sectionInput: '1. Set Moving Conditions',
    householdLabel: 'Household Size & Luggage Volume (Truck Guide)',
    distanceLabel: 'Moving Distance Band',
    monthLabel: 'Planned Month (Seasonality Impact)',
    timeSlotLabel: 'Preferred Time Slot',
    addonsHeading: 'Optional Services & Addons',
    acLabel: 'Air Conditioner Removal & Install (Units)',
    packingLabel: 'Packing Assistance Service',
    unpackingLabel: 'Unpacking Assistance Service',
    pianoLabel: 'Piano / Heavy Specialty Transport',
    wasteLabel: 'Bulky Waste / Furniture Disposal Service',
    yenUnit: 'JPY',
    unitCount: 'units',
    sectionEstimate: '2. Estimated Moving Cost',
    averageEstimateLabel: 'Estimated Average Benchmark',
    estimateRangeLabel: 'Price Range (Optimistic negotiation to peak weekend)',
    truckBadgeLabel: 'Recommended Truck:',
    sectionBreakdown: '3. Cost Breakdown',
    sectionCancellation: '4. Statutory Cancellation Fees (MLIT Standard Contract)',
    cancellationDesc: 'Under MLIT Standard Moving Transport Contract Art. 21, maximum cancellation fees are legally restricted.',
    sectionTips: '5. 5 Golden Rules to Reduce Moving Costs in Japan',
    sectionRelated: '6. Connected Housing & Moving Tools',
    regulatorySectionTitle: 'Regulatory Standards & Primary Sources',
  },
};

export default function MovingCostView({ lang = 'ja' }) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.ja;

  // Form State
  const [householdType, setHouseholdType] = useState('single_standard');
  const [distanceBand, setDistanceBand] = useState('intra_city');
  const [moveMonth, setMoveMonth] = useState(3); // Tháng 3 cao điểm
  const [timeSlot, setTimeSlot] = useState('free_time');

  // Addons State
  const [airConditionerCount, setAirConditionerCount] = useState(0);
  const [hasPacking, setHasPacking] = useState(false);
  const [hasUnpacking, setHasUnpacking] = useState(false);
  const [hasPiano, setHasPiano] = useState(false);
  const [hasBulkyWaste, setHasBulkyWaste] = useState(false);

  // Engine Calculation
  const result = useMemo(() => {
    return calculateMovingCost({
      householdType,
      distanceBand,
      moveMonth,
      timeSlot,
      addons: {
        airConditionerCount,
        hasPacking,
        hasUnpacking,
        hasPiano,
        hasBulkyWaste,
      },
    });
  }, [
    householdType,
    distanceBand,
    moveMonth,
    timeSlot,
    airConditionerCount,
    hasPacking,
    hasUnpacking,
    hasPiano,
    hasBulkyWaste,
  ]);

  return (
    <StandardToolLayout
      title={t.toolTitle}
      description={t.toolDesc}
      toolId="moving-cost-jp"
    >
      <div className="space-y-8">
        {/* SECTION 1: INPUT CONTROLS */}
        <section className="bg-surface rounded-2xl border border-border/80 p-6 md:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-border/60 pb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">{t.sectionInput}</h2>
              <p className="text-xs text-muted">
                {lang === 'ja'
                  ? '世帯の規模や移動距離、時期を指定するとリアルタイムに概算相場が再計算されます。'
                  : lang === 'vi'
                  ? 'Chọn thông tin quy mô, khoảng cách và thời điểm để xem báo giá ước tính ngay lập tức.'
                  : 'Select household size, distance, and timing for real-time cost estimation.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Household Size */}
            <div className="space-y-2">
              <label htmlFor="moving-household-select" className="block text-sm font-semibold text-foreground flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <span>{t.householdLabel}</span>
              </label>
              <select
                id="moving-household-select"
                value={householdType}
                onChange={(e) => setHouseholdType(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-border bg-surface text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors"
              >
                {Object.values(HOUSEHOLD_TYPES).map((h) => (
                  <option key={h.id} value={h.id}>
                    {lang === 'ja' ? h.nameJa : lang === 'vi' ? h.nameVi : h.nameEn}
                  </option>
                ))}
              </select>
              <p className="text-2xs text-muted">
                {lang === 'ja'
                  ? `推奨車輌: ${result.household.truckSizeJa}`
                  : lang === 'vi'
                  ? `Xe chuyên dụng dự kiến: ${result.household.truckSizeVi}`
                  : `Vehicle guide: ${result.household.truckSizeEn}`}
              </p>
            </div>

            {/* Distance Band */}
            <div className="space-y-2">
              <label htmlFor="moving-distance-select" className="block text-sm font-semibold text-foreground flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                <span>{t.distanceLabel}</span>
              </label>
              <select
                id="moving-distance-select"
                value={distanceBand}
                onChange={(e) => setDistanceBand(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-border bg-surface text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors"
              >
                {Object.values(DISTANCE_BANDS).map((d) => (
                  <option key={d.id} value={d.id}>
                    {lang === 'ja' ? d.nameJa : lang === 'vi' ? d.nameVi : d.nameEn}
                  </option>
                ))}
              </select>
            </div>

            {/* Planned Month / Season */}
            <div className="space-y-2">
              <label htmlFor="moving-month-select" className="block text-sm font-semibold text-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                <span>{t.monthLabel}</span>
              </label>
              <div className="flex items-center gap-3">
                <select
                  id="moving-month-select"
                  value={moveMonth}
                  onChange={(e) => setMoveMonth(parseInt(e.target.value, 10))}
                  className="flex-1 h-11 px-3.5 rounded-xl border border-border bg-surface text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                    <option key={m} value={m}>
                      {lang === 'ja' ? `${m}月` : lang === 'vi' ? `Tháng ${m}` : `Month ${m}`}
                    </option>
                  ))}
                </select>
                {result.season.multiplier > 1.0 && (
                  <span className="px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-800 dark:text-amber-300 text-xs font-bold whitespace-nowrap border border-amber-500/20">
                    {lang === 'ja' ? '繁忙期 割増あり' : lang === 'vi' ? 'Cao điểm tăng giá' : 'Peak Surcharge'}
                  </span>
                )}
              </div>
              <p className="text-2xs text-muted">
                {lang === 'ja' ? result.season.descriptionJa : lang === 'vi' ? result.season.descriptionVi : result.season.descriptionEn}
              </p>
            </div>

            {/* Time Slot */}
            <div className="space-y-2">
              <label htmlFor="moving-timeslot-select" className="block text-sm font-semibold text-foreground flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <span>{t.timeSlotLabel}</span>
              </label>
              <select
                id="moving-timeslot-select"
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-border bg-surface text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors"
              >
                {Object.values(TIME_SLOTS).map((ts) => (
                  <option key={ts.id} value={ts.id}>
                    {lang === 'ja' ? ts.nameJa : lang === 'vi' ? ts.nameVi : ts.nameEn}
                  </option>
                ))}
              </select>
              <p className="text-2xs text-muted">
                {lang === 'ja' ? result.timeSlot.descriptionJa : lang === 'vi' ? result.timeSlot.descriptionVi : result.timeSlot.descriptionEn}
              </p>
            </div>
          </div>

          {/* Addons Checklist */}
          <div className="pt-4 border-t border-border/60 space-y-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Wrench className="w-4 h-4 text-primary" />
              <span>{t.addonsHeading}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {/* AC removal/install */}
              <div className="p-3.5 rounded-xl border border-border/70 bg-surface/50 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-foreground block">{t.acLabel}</span>
                  <span className="text-2xs text-muted">
                    +{ADDON_SERVICES.AIR_CONDITIONER_INSTALL.unitPrice.toLocaleString()} {t.yenUnit} / {t.unitCount}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label="Decrease AC count"
                    onClick={() => setAirConditionerCount((c) => Math.max(0, c - 1))}
                    className="w-7 h-7 rounded-lg border border-border bg-surface text-foreground font-bold flex items-center justify-center hover:bg-muted/20"
                  >
                    -
                  </button>
                  <span className="text-xs font-bold w-4 text-center">{airConditionerCount}</span>
                  <button
                    type="button"
                    aria-label="Increase AC count"
                    onClick={() => setAirConditionerCount((c) => c + 1)}
                    className="w-7 h-7 rounded-lg border border-border bg-surface text-foreground font-bold flex items-center justify-center hover:bg-muted/20"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Packing Service */}
              <label className="p-3.5 rounded-xl border border-border/70 bg-surface/50 flex items-center gap-3 cursor-pointer hover:border-primary/40 transition-colors">
                <input
                  type="checkbox"
                  checked={hasPacking}
                  onChange={(e) => setHasPacking(e.target.checked)}
                  className="w-4 h-4 text-primary rounded border-border focus:ring-primary/40"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-semibold text-foreground block">{t.packingLabel}</span>
                  <span className="text-2xs text-muted">
                    +{ADDON_SERVICES.PACKING_SERVICE.unitPrice.toLocaleString()} {t.yenUnit}
                  </span>
                </div>
              </label>

              {/* Unpacking Service */}
              <label className="p-3.5 rounded-xl border border-border/70 bg-surface/50 flex items-center gap-3 cursor-pointer hover:border-primary/40 transition-colors">
                <input
                  type="checkbox"
                  checked={hasUnpacking}
                  onChange={(e) => setHasUnpacking(e.target.checked)}
                  className="w-4 h-4 text-primary rounded border-border focus:ring-primary/40"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-semibold text-foreground block">{t.unpackingLabel}</span>
                  <span className="text-2xs text-muted">
                    +{ADDON_SERVICES.UNPACKING_SERVICE.unitPrice.toLocaleString()} {t.yenUnit}
                  </span>
                </div>
              </label>

              {/* Piano Transport */}
              <label className="p-3.5 rounded-xl border border-border/70 bg-surface/50 flex items-center gap-3 cursor-pointer hover:border-primary/40 transition-colors">
                <input
                  type="checkbox"
                  checked={hasPiano}
                  onChange={(e) => setHasPiano(e.target.checked)}
                  className="w-4 h-4 text-primary rounded border-border focus:ring-primary/40"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-semibold text-foreground block">{t.pianoLabel}</span>
                  <span className="text-2xs text-muted">
                    +{ADDON_SERVICES.PIANO_HEAVY_TRANSPORT.unitPrice.toLocaleString()} {t.yenUnit}
                  </span>
                </div>
              </label>

              {/* Bulky Waste Disposal */}
              <label className="p-3.5 rounded-xl border border-border/70 bg-surface/50 flex items-center gap-3 cursor-pointer hover:border-primary/40 transition-colors">
                <input
                  type="checkbox"
                  checked={hasBulkyWaste}
                  onChange={(e) => setHasBulkyWaste(e.target.checked)}
                  className="w-4 h-4 text-primary rounded border-border focus:ring-primary/40"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-semibold text-foreground block">{t.wasteLabel}</span>
                  <span className="text-2xs text-muted">
                    +{ADDON_SERVICES.BULKY_WASTE_DISPOSAL.unitPrice.toLocaleString()} {t.yenUnit}
                  </span>
                </div>
              </label>
            </div>
          </div>
        </section>

        {/* SECTION 2: ESTIMATE RESULT DASHBOARD */}
        <section className="bg-surface rounded-2xl border border-border/80 p-6 md:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-border/60 pb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-700 dark:text-emerald-300">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">{t.sectionEstimate}</h2>
              <p className="text-xs text-muted">
                {lang === 'ja'
                  ? result.summaryJa
                  : lang === 'vi'
                  ? result.summaryVi
                  : result.summaryEn}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Min Estimate Card */}
            <div className="p-5 rounded-xl border border-border bg-surface/40 flex flex-col justify-between space-y-3">
              <span className="text-xs font-medium text-muted">
                {lang === 'ja' ? '最安値目安（平日・値引き交渉後）' : lang === 'vi' ? 'Giá tối thiểu (Đàm phán tốt / Ngày thường)' : 'Optimistic / Negotiated'}
              </span>
              <div className="text-2xl font-black text-foreground">
                約 {result.estimates.minEstimate.toLocaleString()}{' '}
                <span className="text-sm font-semibold text-muted">{t.yenUnit}</span>
              </div>
              <span className="text-2xs text-emerald-700 dark:text-emerald-300 flex items-center gap-1 font-medium">
                <PiggyBank className="w-3.5 h-3.5" />
                <span>{lang === 'ja' ? '複数社見積もりで狙える価格' : lang === 'vi' ? 'Mức giá có thể đạt khi so sánh giá' : 'Target via multi-quotes'}</span>
              </span>
            </div>

            {/* Average Standard Card (Prominent) */}
            <div className="p-6 rounded-2xl border-2 border-primary/40 bg-primary/5 flex flex-col justify-between space-y-3 shadow-md md:-translate-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-primary uppercase tracking-wider">
                  {t.averageEstimateLabel}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-primary text-on-primary text-2xs font-bold">
                  STANDARD
                </span>
              </div>
              <div className="text-3.5xl font-black text-foreground">
                約 {result.estimates.averageEstimate.toLocaleString()}{' '}
                <span className="text-sm font-semibold text-muted">{t.yenUnit}</span>
              </div>
              <div className="pt-2 border-t border-primary/20 flex items-center justify-between text-2xs text-foreground font-medium">
                <span>{t.truckBadgeLabel}</span>
                <span className="font-bold text-primary">
                  {lang === 'ja' ? result.household.truckSizeJa : lang === 'vi' ? result.household.truckSizeVi : result.household.truckSizeEn}
                </span>
              </div>
            </div>

            {/* Max Estimate Card */}
            <div className="p-5 rounded-xl border border-border bg-surface/40 flex flex-col justify-between space-y-3">
              <span className="text-xs font-medium text-muted">
                {lang === 'ja' ? '高値目安（週末・直前予約）' : lang === 'vi' ? 'Giá tối đa (Cuối tuần / Đặt sát ngày)' : 'Upper Bound (Weekend/Last-minute)'}
              </span>
              <div className="text-2xl font-black text-foreground">
                約 {result.estimates.maxEstimate.toLocaleString()}{' '}
                <span className="text-sm font-semibold text-muted">{t.yenUnit}</span>
              </div>
              <span className="text-2xs text-amber-800 dark:text-amber-300 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{lang === 'ja' ? '繁忙期の週末や即決時に注意' : lang === 'vi' ? 'Dễ bị tính giá này nếu đặt cận ngày' : 'Typical without shopping around'}</span>
              </span>
            </div>
          </div>

          {/* Cost Breakdown Table */}
          <div className="pt-4 space-y-3">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              <span>{t.sectionBreakdown}</span>
            </h3>

            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-muted/10 border-b border-border text-muted font-semibold">
                    <th className="p-3">
                      {lang === 'ja' ? '費用項目' : lang === 'vi' ? 'Khoản mục chi phí' : 'Cost Item'}
                    </th>
                    <th className="p-3 text-right">
                      {lang === 'ja' ? '金額（税込目安）' : lang === 'vi' ? 'Số tiền ước tính' : 'Amount (JPY)'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {result.breakdownItems.map((item) => (
                    <tr key={item.id} className="hover:bg-muted/5 transition-colors">
                      <td className="p-3 font-medium text-foreground">
                        {lang === 'ja' ? item.labelJa : lang === 'vi' ? item.labelVi : item.labelEn}
                      </td>
                      <td className="p-3 text-right font-bold text-foreground">
                        {item.amountYen > 0 ? `+${item.amountYen.toLocaleString()} ${t.yenUnit}` : '0 ' + t.yenUnit}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-primary/5 font-bold">
                    <td className="p-3 text-primary">
                      {lang === 'ja' ? '合計概算（基準額）' : lang === 'vi' ? 'Tổng chi phí cơ chuẩn' : 'Estimated Total Benchmark'}
                    </td>
                    <td className="p-3 text-right text-primary text-sm">
                      約 {result.estimates.averageEstimate.toLocaleString()} {t.yenUnit}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* SECTION 3: MLIT CANCELLATION FEE SCHEDULE */}
        <section className="bg-surface rounded-2xl border border-border/80 p-6 md:p-8 shadow-sm space-y-5">
          <div className="flex items-center gap-3 border-b border-border/60 pb-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">{t.sectionCancellation}</h2>
              <p className="text-xs text-muted">{t.cancellationDesc}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {result.cancellationFees.map((fee, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-xl border ${
                  fee.feeRate === 0
                    ? 'border-emerald-500/30 bg-emerald-500/5'
                    : 'border-border bg-surface/50'
                } space-y-2`}
              >
                <span className="text-2xs font-bold text-muted uppercase block">
                  {lang === 'ja' ? fee.timingJa : lang === 'vi' ? fee.timingVi : fee.timingEn}
                </span>
                <div className="text-lg font-black text-foreground">
                  {fee.feeRate === 0 ? (
                    <span className="text-emerald-700 dark:text-emerald-300">
                      {lang === 'ja' ? '無料（0円）' : lang === 'vi' ? 'Miễn phí (0đ)' : 'Free (0 JPY)'}
                    </span>
                  ) : (
                    <span>
                      約 {fee.calculatedFeeYen.toLocaleString()} <span className="text-xs font-medium text-muted">{t.yenUnit}</span>
                    </span>
                  )}
                </div>
                <p className="text-2xs text-muted">
                  {lang === 'ja' ? fee.descriptionJa : lang === 'vi' ? fee.descriptionVi : fee.descriptionEn}
                </p>
              </div>
            ))}
          </div>
          <p className="text-2xs text-muted italic">
            {lang === 'ja'
              ? '※ 国土交通省「標準引越運送約款」第21条に基づき、見積もり書に明記されていない違約金の請求は禁止されています。'
              : lang === 'vi'
              ? '※ Căn cứ Điều 21 Quy ước vận chuyển MLIT: Nghiêm cấm nhà xe thu thêm bất kỳ khoản phí phạt hủy nào không được ghi rõ trong báo giá.'
              : '※ Under MLIT Standard Contract Art. 21, moving operators cannot demand cancellation fees outside statutory rates.'}
          </p>
        </section>

        {/* SECTION 4: 5 GOLDEN COST-SAVING TIPS */}
        <section className="bg-surface rounded-2xl border border-border/80 p-6 md:p-8 shadow-sm space-y-5">
          <div className="flex items-center gap-3 border-b border-border/60 pb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-800 dark:text-amber-300">
              <PiggyBank className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">{t.sectionTips}</h2>
              <p className="text-xs text-muted">
                {lang === 'ja'
                  ? '知っているだけで数万円単位で支出を減らせる実践的なコツです。'
                  : lang === 'vi'
                  ? 'Những mẹo thực chiến giúp bạn cắt giảm từ 10,000 đến 30,000円 khi chuyển nhà tại Nhật.'
                  : 'Actionable techniques to save tens of thousands of Yen on your move.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {result.tips.map((tip, idx) => (
              <div
                key={tip.id}
                className="p-4 rounded-xl border border-border/80 bg-surface/50 space-y-2 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-foreground">
                      {lang === 'ja' ? tip.titleJa : lang === 'vi' ? tip.titleVi : tip.titleEn}
                    </h3>
                    <p className="text-2xs text-muted mt-1 leading-relaxed">
                      {lang === 'ja' ? tip.descriptionJa : lang === 'vi' ? tip.descriptionVi : tip.descriptionEn}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 5: CONNECTED TOOLS */}
        <section className="bg-surface rounded-2xl border border-border/80 p-6 md:p-8 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span>{t.sectionRelated}</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <a
              href="#/tools/moving-admin-checker-jp"
              className="p-4 rounded-xl border border-border hover:border-primary/40 bg-surface/50 hover:bg-primary/5 transition-all group block"
            >
              <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors block">
                {lang === 'ja' ? '引越し行政手続チェッカー' : lang === 'vi' ? 'Kiểm tra thủ tục hành chính chuyển nhà' : 'Moving Admin Checker'}
              </span>
              <p className="text-2xs text-muted mt-1">
                {lang === 'ja' ? '転出届・転入届・マイナポータル' : lang === 'vi' ? 'Giấy chuyển đi, chuyển đến, MyNaPortal' : 'Moving-out & in declarations'}
              </p>
              <div className="flex items-center gap-1 text-2xs text-primary font-semibold mt-3">
                <span>{lang === 'ja' ? '確認する' : lang === 'vi' ? 'Xem chi tiết' : 'Open'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </a>

            <a
              href="#/tools/address-change-checklist-jp"
              className="p-4 rounded-xl border border-border hover:border-primary/40 bg-surface/50 hover:bg-primary/5 transition-all group block"
            >
              <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors block">
                {lang === 'ja' ? '住所変更チェックリスト' : lang === 'vi' ? 'Checklist đổi địa chỉ đời sống' : 'Address Change Checklist'}
              </span>
              <p className="text-2xs text-muted mt-1">
                {lang === 'ja' ? '郵便物転送・電気ガス水道・銀行' : lang === 'vi' ? 'Chuyển tiếp bưu điện, điện nước, ngân hàng' : 'Mail forwarding, utilities, banks'}
              </p>
              <div className="flex items-center gap-1 text-2xs text-primary font-semibold mt-3">
                <span>{lang === 'ja' ? '確認する' : lang === 'vi' ? 'Xem chi tiết' : 'Open'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </a>

            <a
              href="#/tools/moving-wizard-jp"
              className="p-4 rounded-xl border border-border hover:border-primary/40 bg-surface/50 hover:bg-primary/5 transition-all group block"
            >
              <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors block">
                {lang === 'ja' ? '引越し手続きガイド（総合）' : lang === 'vi' ? 'Cẩm nang chuyển nhà toàn diện' : 'Moving Life Event Wizard'}
              </span>
              <p className="text-2xs text-muted mt-1">
                {lang === 'ja' ? '引越し前・当日・引越し後の完全ガイド' : lang === 'vi' ? 'Lộ trình trước, trong & sau khi chuyển' : 'Full moving orchestrator'}
              </p>
              <div className="flex items-center gap-1 text-2xs text-primary font-semibold mt-3">
                <span>{lang === 'ja' ? '確認する' : lang === 'vi' ? 'Xem chi tiết' : 'Open'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </a>
          </div>
        </section>

        {/* REGULATORY PRIMARY SOURCES */}
        <section className="pt-2">
          <RegulatorySourceView
            sourceIds={MOVING_COST_SOURCES}
            lang={lang}
            title={t.regulatorySectionTitle}
          />
        </section>
      </div>
    </StandardToolLayout>
  );
}
