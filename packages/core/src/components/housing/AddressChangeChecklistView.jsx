/**
 * @file packages/core/src/components/housing/AddressChangeChecklistView.jsx
 * @description
 * Giao diện Bảng Kiểm Tra Đổi Địa Chỉ Đa Kênh Nhật Bản (住所変更チェックリスト).
 * Căn cứ:
 * - 日本郵便「e転居」（郵便法第29条に基づく1年間無料転送サービス）
 * - Quy chuẩn kỹ thuật hạ tầng thiết yếu (Điện, Ga - bắt buộc có mặt kiểm tra an toàn, Nước, Cáp quang)
 * - Tài chính & Giấy tờ (Bằng lái xe 道路交通法第94条, Đăng kiểm xe 道路運送車両法第12条, Ngân hàng, Thẻ)
 * Tuân thủ nghiêm ngặt MAIS: StandardToolLayout 1240px, Design Tokens, Trilingual (ja/vi/en), WCAG AA.
 */

import React, { useState, useMemo } from 'react';
import {
  ClipboardCheck,
  Calendar,
  Clock,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Zap,
  Droplet,
  Wifi,
  CreditCard,
  Building2,
  Car,
  Mail,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  HelpCircle,
  Filter,
  Layers,
  Check,
} from 'lucide-react';

import StandardToolLayout from '../shared/StandardToolLayout.jsx';
import RegulatorySourceView from '../regulatory/RegulatorySourceView.jsx';
import {
  ADDRESS_CHANGE_CATEGORIES,
  TIMING_BANDS,
  ADDRESS_CHANGE_SOURCES,
  generateAddressChangeChecklist,
} from '../../japan/housing/index.js';

const TRANSLATIONS = {
  ja: {
    toolTitle: '引越し住所変更チェックリスト（ライフライン・郵便・金融・車）',
    toolDesc: '日本郵便「e転居」、電気・ガス（開栓立ち会い必須）・水道・光回線工事、運転免許証、銀行、クレジットカード等の住所変更漏れを完全防止するインタラクティブ・チェックリストです。',
    sectionProfile: '1. あなたの生活状況・契約条件（チェック項目の絞り込み）',
    moveDateLabel: '引越し予定日',
    viewModeLabel: '表示切り替え：',
    viewByTiming: '時系列順（引越し前〜後）',
    viewByCategory: 'サービス分類別',
    hasDriversLicense: '運転免許証を所持している（警察署・免許センター）',
    hasMyNumberCard: 'マイナンバーカードを所持している（暗証番号更新）',
    hasVehicle: '自家用車・バイクを所有している（車検証・車庫証明）',
    hasBicycle: '自転車を所有している（防犯登録の変更・再登録）',
    hasFiberInternet: '固定光回線（自宅インターネット）を契約中',
    sectionProgress: '2. 住所変更タスクの進行状況',
    sectionChecklist: '3. 住所変更やることリスト',
    sectionRelated: '4. 関連する住まい・手続きツール',
    regulatorySectionTitle: '参照公定基準・法令（Primary Regulatory Sources）',
    presenceRequiredBadge: '立会い必須（要予約）',
    criticalBadge: '重要度：高',
    completedBadge: '完了',
    pendingBadge: '未完了',
    resetLabel: 'チェックをリセット',
    gasNoticeTitle: '【最重要】ガスの開栓は本人の立ち会い（立会）が必須です',
    gasNoticeDesc: '点火試験およびガス漏れ検査を行うため、必ず契約者または代理人が新居に居る必要があります。引越し繁忙期は希望日時の枠が埋まるため、2週間前までのWeb予約をおすすめします。',
  },
  vi: {
    toolTitle: 'Checklist Đổi Địa Chỉ Chuyển Nhà Nhật Bản (住所変更チェックリスト)',
    toolDesc: 'Quản lý toàn diện thủ tục đổi địa chỉ chuyển tiếp Bưu điện (e-Tenkyo 1 năm), Điện, Ga (bắt buộc có mặt mở van), Nước, Internet cáp quang, Bằng lái xe, Ngân hàng, Thẻ tín dụng và Xe cộ.',
    sectionProfile: '1. Điều kiện hợp đồng & Lối sống của bạn (Lọc đầu việc phù hợp)',
    moveDateLabel: 'Ngày dự kiến dọn vào nhà mới',
    viewModeLabel: 'Chế độ xem:',
    viewByTiming: 'Theo mốc thời gian (Trước ↔ Sau khi chuyển)',
    viewByCategory: 'Theo loại hình dịch vụ',
    hasDriversLicense: 'Có Bằng lái xe Nhật Bản (Đổi tại Đồn Cảnh sát / Trung tâm Bằng lái)',
    hasMyNumberCard: 'Có Thẻ My Number (Cần nhập mã PIN cập nhật chip)',
    hasVehicle: 'Có Ô tô hoặc Xe máy (Cần đổi đăng kiểm & Shako Shomei)',
    hasBicycle: 'Có Xe đạp (Cần cập nhật đăng ký chống trộm Bouhan Toroku)',
    hasFiberInternet: 'Đang dùng mạng cáp quang cố định tại nhà (Cần kéo cáp)',
    sectionProgress: '2. Tiến độ hoàn thành các đầu việc',
    sectionChecklist: '3. Danh sách công việc đổi địa chỉ chi tiết',
    sectionRelated: '4. Công cụ liên kết trong Hệ sinh thái Nhà ở',
    regulatorySectionTitle: 'Căn cứ Pháp lý & Tiêu chuẩn Quy ước (Primary Regulatory Sources)',
    presenceRequiredBadge: 'Bắt buộc có mặt tại nhà',
    criticalBadge: 'Ưu tiên cao',
    completedBadge: 'Đã xong',
    pendingBadge: 'Chưa làm',
    resetLabel: 'Đặt lại danh sách',
    gasNoticeTitle: '【Đặc biệt lưu ý】Mở van ga tại nhà mới BẮT BUỘC PHẢI CÓ NGƯỜI Ở NHÀ',
    gasNoticeDesc: 'Nhân viên công ty ga bắt buộc phải vào tận bếp kiểm tra đánh lửa và đo rò rỉ khí ga. Hãy đặt lịch hẹn trước 1-2 tuần trên website công ty ga để chọn được giờ thuận tiện trong ngày dọn đến.',
  },
  en: {
    toolTitle: 'Japan Address Change Master Checklist (住所変更チェックリスト)',
    toolDesc: 'Interactive tracker for Japan Post 1-year mail forwarding (e-Tenkyo), lifelines (electricity, mandatory in-person gas inspection, water, fiber internet), driver license, banks, credit cards, and vehicles.',
    sectionProfile: '1. Your Lifestyle & Contract Profile',
    moveDateLabel: 'Planned Move-in Date',
    viewModeLabel: 'Display Mode:',
    viewByTiming: 'Chronological (Before to After Move)',
    viewByCategory: 'By Service Category',
    hasDriversLicense: 'Hold Japan Driver\'s License (Police Station / License Center)',
    hasMyNumberCard: 'Hold My Number Card (PIN chip renewal required)',
    hasVehicle: 'Own Car or Motorcycle (Inspection cert & parking space cert)',
    hasBicycle: 'Own Bicycle (Anti-theft registration update)',
    hasFiberInternet: 'Contracted Fiber Optic Broadband (Requires installation booking)',
    sectionProgress: '2. Completion Progress Tracker',
    sectionChecklist: '3. Address Update Task List',
    sectionRelated: '4. Connected Housing Tools',
    regulatorySectionTitle: 'Regulatory Standards & Primary Sources',
    presenceRequiredBadge: 'In-person Presence Mandatory',
    criticalBadge: 'Critical Priority',
    completedBadge: 'Completed',
    pendingBadge: 'Pending',
    resetLabel: 'Reset Checklist',
    gasNoticeTitle: '[CRITICAL] In-person presence is MANDATORY for Gas Valve Opening',
    gasNoticeDesc: 'Safety technicians must inspect ignition burners and check for gas leaks inside your home. Book an appointment 1-2 weeks in advance via your gas provider portal.',
  },
};

export default function AddressChangeChecklistView({ lang = 'ja' }) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.ja;

  // Form State
  const [moveDate, setMoveDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [hasDriversLicense, setHasDriversLicense] = useState(true);
  const [hasMyNumberCard, setHasMyNumberCard] = useState(true);
  const [hasVehicle, setHasVehicle] = useState(false);
  const [hasBicycle, setHasBicycle] = useState(true);
  const [hasFiberInternet, setHasFiberInternet] = useState(true);

  // View Mode: 'timing' | 'category'
  const [viewMode, setViewMode] = useState('timing');

  // Checked Map (Persisted in state)
  const [checkedMap, setCheckedMap] = useState({});

  // Engine evaluation
  const checklistData = useMemo(() => {
    return generateAddressChangeChecklist(
      {
        moveDate,
        hasDriversLicense,
        hasMyNumberCard,
        hasVehicle,
        hasBicycle,
        hasFiberInternet,
      },
      checkedMap
    );
  }, [
    moveDate,
    hasDriversLicense,
    hasMyNumberCard,
    hasVehicle,
    hasBicycle,
    hasFiberInternet,
    checkedMap,
  ]);

  const toggleItem = (itemId) => {
    setCheckedMap((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const resetChecklist = () => {
    setCheckedMap({});
  };

  return (
    <StandardToolLayout
      title={t.toolTitle}
      description={t.toolDesc}
      lang={lang}
      badge="手続きチェック"
      badgeColor="#06b6d4"
    >
      <div className="space-y-8 max-w-[1240px] mx-auto">
        {/* CRITICAL GAS PRESENCE NOTICE */}
        <div className="p-4 rounded-xl border border-amber-500/40 bg-amber-500/10 flex items-start gap-3.5 shadow-sm text-amber-950 dark:text-amber-200">
          <Flame className="w-5 h-5 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold">{t.gasNoticeTitle}</h4>
            <p className="text-xs opacity-90 leading-relaxed">{t.gasNoticeDesc}</p>
          </div>
        </div>

        {/* SECTION 1: PROFILE & CONDITIONS */}
        <section className="bg-surface rounded-2xl border border-border/80 p-6 md:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-border/60 pb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Filter className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">{t.sectionProfile}</h2>
              <p className="text-xs text-muted">
                {lang === 'ja'
                  ? '該当する項目にチェックを入れると、必要な住所変更手続きのみに絞り込まれます。'
                  : lang === 'vi'
                  ? 'Chọn các hợp đồng bạn đang sử dụng để bảng checklist hiển thị chính xác các đầu việc cần làm.'
                  : 'Toggle your active subscriptions and properties to filter applicable address change tasks.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {/* Move Date */}
            <div className="space-y-1.5 sm:col-span-2 md:col-span-1">
              <label htmlFor="address-move-date" className="block text-xs font-bold text-foreground flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                <span>{t.moveDateLabel}</span>
              </label>
              <input
                id="address-move-date"
                type="date"
                value={moveDate}
                onChange={(e) => setMoveDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-border bg-surface text-foreground font-medium text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>

            {/* Drivers License */}
            <label className="flex items-center gap-3 p-3 rounded-xl border border-border bg-surface/40 hover:bg-surface/80 cursor-pointer transition-all">
              <input
                type="checkbox"
                checked={hasDriversLicense}
                onChange={(e) => setHasDriversLicense(e.target.checked)}
                className="w-4 h-4 rounded text-primary focus:ring-primary border-border"
              />
              <span className="text-xs font-medium text-foreground">{t.hasDriversLicense}</span>
            </label>

            {/* My Number */}
            <label className="flex items-center gap-3 p-3 rounded-xl border border-border bg-surface/40 hover:bg-surface/80 cursor-pointer transition-all">
              <input
                type="checkbox"
                checked={hasMyNumberCard}
                onChange={(e) => setHasMyNumberCard(e.target.checked)}
                className="w-4 h-4 rounded text-primary focus:ring-primary border-border"
              />
              <span className="text-xs font-medium text-foreground">{t.hasMyNumberCard}</span>
            </label>

            {/* Vehicle */}
            <label className="flex items-center gap-3 p-3 rounded-xl border border-border bg-surface/40 hover:bg-surface/80 cursor-pointer transition-all">
              <input
                type="checkbox"
                checked={hasVehicle}
                onChange={(e) => setHasVehicle(e.target.checked)}
                className="w-4 h-4 rounded text-primary focus:ring-primary border-border"
              />
              <span className="text-xs font-medium text-foreground">{t.hasVehicle}</span>
            </label>

            {/* Bicycle */}
            <label className="flex items-center gap-3 p-3 rounded-xl border border-border bg-surface/40 hover:bg-surface/80 cursor-pointer transition-all">
              <input
                type="checkbox"
                checked={hasBicycle}
                onChange={(e) => setHasBicycle(e.target.checked)}
                className="w-4 h-4 rounded text-primary focus:ring-primary border-border"
              />
              <span className="text-xs font-medium text-foreground">{t.hasBicycle}</span>
            </label>

            {/* Fiber Internet */}
            <label className="flex items-center gap-3 p-3 rounded-xl border border-border bg-surface/40 hover:bg-surface/80 cursor-pointer transition-all">
              <input
                type="checkbox"
                checked={hasFiberInternet}
                onChange={(e) => setHasFiberInternet(e.target.checked)}
                className="w-4 h-4 rounded text-primary focus:ring-primary border-border"
              />
              <span className="text-xs font-medium text-foreground">{t.hasFiberInternet}</span>
            </label>
          </div>
        </section>

        {/* SECTION 2: PROGRESS TRACKER */}
        <section className="bg-surface rounded-2xl border border-border/80 p-6 md:p-8 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-800 dark:text-emerald-200">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">{t.sectionProgress}</h2>
                <p className="text-xs text-muted">
                  {checklistData.stats.completedCount} / {checklistData.stats.totalCount}{' '}
                  {lang === 'ja' ? '項目完了' : lang === 'vi' ? 'đầu việc đã hoàn thành' : 'tasks completed'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={resetChecklist}
                className="text-xs font-semibold text-muted hover:text-foreground px-3 py-1.5 rounded-lg border border-border hover:bg-surface/80 transition-all"
              >
                {t.resetLabel}
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-foreground">
              <span>{lang === 'ja' ? '全体の達成率' : lang === 'vi' ? 'Tiến độ hoàn thành tổng thể' : 'Overall Completion'}</span>
              <span className="text-primary font-mono text-sm">{checklistData.stats.progressPercent}%</span>
            </div>
            <div className="w-full h-3 bg-surface-dim rounded-full overflow-hidden border border-border/60">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-500 rounded-full"
                style={{ width: `${checklistData.stats.progressPercent}%` }}
              />
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3.5 rounded-xl border border-border bg-surface/40 text-center space-y-0.5">
              <span className="text-2xs font-medium text-muted">{lang === 'ja' ? '対象タスク数' : lang === 'vi' ? 'Tổng số đầu việc' : 'Total Tasks'}</span>
              <div className="text-xl font-black text-foreground font-mono">{checklistData.stats.totalCount}</div>
            </div>
            <div className="p-3.5 rounded-xl border border-border bg-surface/40 text-center space-y-0.5">
              <span className="text-2xs font-medium text-emerald-800 dark:text-emerald-200">{t.completedBadge}</span>
              <div className="text-xl font-black text-emerald-800 dark:text-emerald-200 font-mono">{checklistData.stats.completedCount}</div>
            </div>
            <div className="p-3.5 rounded-xl border border-border bg-surface/40 text-center space-y-0.5">
              <span className="text-2xs font-medium text-muted">{t.pendingBadge}</span>
              <div className="text-xl font-black text-foreground font-mono">{checklistData.stats.pendingCount}</div>
            </div>
            <div className="p-3.5 rounded-xl border border-border bg-surface/40 text-center space-y-0.5">
              <span className="text-2xs font-medium text-amber-800 dark:text-amber-300">{lang === 'ja' ? '要立会い/最重要' : lang === 'vi' ? 'Cần có mặt / Quan trọng' : 'Critical / Presence'}</span>
              <div className="text-xl font-black text-amber-800 dark:text-amber-300 font-mono">{checklistData.stats.criticalPendingCount}</div>
            </div>
          </div>
        </section>

        {/* SECTION 3: CHECKLIST CONTENT */}
        <section className="bg-surface rounded-2xl border border-border/80 p-6 md:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <ClipboardCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">{t.sectionChecklist}</h2>
                <p className="text-xs text-muted">
                  {lang === 'ja'
                    ? '完了した項目にチェックを入れて進捗を管理しましょう。'
                    : lang === 'vi'
                    ? 'Đánh dấu vào từng việc đã làm để kiểm soát tiến độ chuyển dọn.'
                    : 'Check off completed items to manage your moving tasks.'}
                </p>
              </div>
            </div>

            {/* View Mode Toggle Buttons */}
            <div className="flex items-center p-1 rounded-xl bg-surface-dim border border-border/60 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setViewMode('timing')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  viewMode === 'timing'
                    ? 'bg-surface text-primary shadow-sm font-bold'
                    : 'text-muted hover:text-foreground'
                }`}
              >
                {t.viewByTiming}
              </button>
              <button
                type="button"
                onClick={() => setViewMode('category')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  viewMode === 'category'
                    ? 'bg-surface text-primary shadow-sm font-bold'
                    : 'text-muted hover:text-foreground'
                }`}
              >
                {t.viewByCategory}
              </button>
            </div>
          </div>

          {/* Grouped Rendering */}
          <div className="space-y-8">
            {(viewMode === 'timing' ? checklistData.byTiming : checklistData.byCategory).map((group, gIdx) => {
              const groupTitle =
                viewMode === 'timing'
                  ? (lang === 'ja' ? group.timingBand.labelJa : lang === 'vi' ? group.timingBand.labelVi : group.timingBand.labelEn)
                  : (lang === 'ja' ? group.category.nameJa : lang === 'vi' ? group.category.nameVi : group.category.nameEn);

              return (
                <div key={gIdx} className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-border/40">
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                      <span>{groupTitle}</span>
                    </h3>
                    <span className="text-2xs font-mono text-muted">
                      {group.completed} / {group.total}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {group.items.map((item) => {
                      const isChecked = Boolean(checkedMap[item.id]);
                      const title = lang === 'ja' ? item.titleJa : lang === 'vi' ? item.titleVi : item.titleEn;
                      const desc = lang === 'ja' ? item.descJa : lang === 'vi' ? item.descVi : item.descEn;
                      const method = lang === 'ja' ? item.methodLabelJa : lang === 'vi' ? item.methodLabelVi : item.methodLabelEn;

                      return (
                        <label
                          key={item.id}
                          htmlFor={`check-item-${item.id}`}
                          className={`p-4 rounded-xl border transition-all flex items-start gap-3.5 cursor-pointer select-none ${
                            isChecked
                              ? 'border-border/40 bg-surface/30 opacity-70'
                              : item.requiresPresence
                              ? 'border-amber-500/40 bg-amber-500/5 hover:border-amber-500/60'
                              : 'border-border bg-surface/50 hover:bg-surface/90 hover:border-primary/40'
                          }`}
                        >
                          <input
                            id={`check-item-${item.id}`}
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleItem(item.id)}
                            aria-label={title}
                            className="w-4 h-4 rounded text-primary focus:ring-primary border-border mt-0.5 shrink-0 cursor-pointer"
                          />

                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`text-xs font-bold ${
                                  isChecked ? 'line-through text-muted' : 'text-foreground'
                                }`}
                              >
                                {title}
                              </span>

                              {/* Badges */}
                              {item.requiresPresence && (
                                <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-700 dark:text-rose-300 text-2xs font-bold border border-rose-500/20 flex items-center gap-1">
                                  <Flame className="w-3 h-3" />
                                  <span>{t.presenceRequiredBadge}</span>
                                </span>
                              )}

                              {item.isCritical && !item.requiresPresence && (
                                <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-800 dark:text-amber-300 text-2xs font-bold border border-amber-500/20">
                                  {t.criticalBadge}
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-muted leading-relaxed">{desc}</p>

                            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-2xs text-muted font-mono">
                              <span>窓口/方法：{method}</span>
                              <div className="flex items-center gap-3">
                                <span>目標日目安：{item.targetDate}</span>
                                {item.url && (
                                  <a
                                    href={item.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-primary hover:underline flex items-center gap-0.5 font-bold"
                                  >
                                    <span>Webサイト</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* SECTION 4: RELATED HOUSING TOOLS */}
        <section className="bg-surface rounded-2xl border border-border/80 p-6 md:p-8 shadow-sm space-y-4">
          <div className="flex items-center gap-3 border-b border-border/60 pb-3">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="text-md font-bold text-foreground">{t.sectionRelated}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="#/tools/moving-cost-jp"
              className="p-4 rounded-xl border border-border hover:border-primary/40 bg-surface/50 hover:bg-primary/5 transition-all group block"
            >
              <div className="flex items-center justify-between text-xs font-bold text-foreground group-hover:text-primary">
                <span>{lang === 'ja' ? '引越し費用シミュレーター' : lang === 'vi' ? 'Mô Phỏng Chi Phí Chuyển Nhà' : 'Moving Cost Simulator'}</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-2xs text-muted mt-1.5">
                {lang === 'ja'
                  ? '世帯人数・距離・時期別の概算相場とMLIT標準約款のキャンセル料を計算。'
                  : lang === 'vi'
                  ? 'Ước tính cước xe tải, phụ phí mùa cao điểm và biểu phí phạt hủy hợp đồng MLIT.'
                  : 'Estimate truck pricing, peak season multipliers, and statutory cancellation fee.'}
              </p>
            </a>

            <a
              href="#/tools/moving-admin-checker-jp"
              className="p-4 rounded-xl border border-border hover:border-primary/40 bg-surface/50 hover:bg-primary/5 transition-all group block"
            >
              <div className="flex items-center justify-between text-xs font-bold text-foreground group-hover:text-primary">
                <span>{lang === 'ja' ? '引越し行政手続きナビ' : lang === 'vi' ? 'Thủ Tục Hành Chính Chuyển Nhà' : 'Moving Admin Checker'}</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-2xs text-muted mt-1.5">
                {lang === 'ja'
                  ? '住民基本台帳法第22条〜第24条の14日期限とマイナポータルワンストップ判定。'
                  : lang === 'vi'
                  ? 'Hạn chót 14 ngày luật định, đối soát điều kiện Một Cửa MyNaPortal và giấy tờ cần mang.'
                  : 'Statutory 14-day deadlines and MyNaPortal One-Stop eligibility.'}
              </p>
            </a>

            <a
              href="#/tools/moving-wizard-jp"
              className="p-4 rounded-xl border border-border hover:border-primary/40 bg-surface/50 hover:bg-primary/5 transition-all group block"
            >
              <div className="flex items-center justify-between text-xs font-bold text-foreground group-hover:text-primary">
                <span>{lang === 'ja' ? '引越し手続きガイド（Life Event）' : lang === 'vi' ? 'Hướng Dẫn Toàn Diện Chuyển Nhà' : 'Moving Life Event Wizard'}</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-2xs text-muted mt-1.5">
                {lang === 'ja'
                  ? 'Life Event Foundationに基づく総合タイムラインと進行管理。'
                  : lang === 'vi'
                  ? 'Lộ trình chuyển dọn toàn diện từ 1 tháng trước tới sau chuyển trên Life Event Runtime.'
                  : 'Comprehensive moving lifecycle guide built on Life Event Foundation.'}
              </p>
            </a>
          </div>
        </section>

        {/* SECTION 5: PRIMARY REGULATORY SOURCES */}
        <section className="bg-surface rounded-2xl border border-border/80 p-6 md:p-8 shadow-sm space-y-4">
          <div className="flex items-center gap-3 border-b border-border/60 pb-3">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <h2 className="text-md font-bold text-foreground">{t.regulatorySectionTitle}</h2>
          </div>
          <RegulatorySourceView sourceIds={ADDRESS_CHANGE_SOURCES} lang={lang} />
        </section>
      </div>
    </StandardToolLayout>
  );
}
