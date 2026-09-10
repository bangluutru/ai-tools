/**
 * @file packages/core/src/components/immigration/LeavingJapanWizardView.jsx
 * @description
 * Giao diện Lộ trình & Hướng dẫn Thủ tục Khi Rời Nhật Bản (日本を離れる手続きガイド).
 * Sự kiện Đời sống thứ 5 (5th Life Event) trong Toolio Hub.
 * 
 * Tuân thủ MAIS Gate 1-4:
 * - Nguồn sự thật duy nhất (SOT): props.lang
 * - Chuẩn Trợ năng WCAG 2.1 AA (mọi input có label/id/aria-label, độ tương phản cao không dùng opacity làm mờ chữ)
 * - Tương thích Theme CSS Tokens
 * - Lưu tiến độ checklist vào localStorage có namespace an toàn
 */

import React, { useState, useId, useMemo, useEffect } from 'react';
import StandardToolLayout from '../shared/StandardToolLayout.jsx';
import RegulatorySourceView from '../regulatory/RegulatorySourceView.jsx';
import {
  generateDeparturePlan,
  DEPARTURE_STAGES,
  DEPARTURE_SOURCES
} from '../../japan/immigration/index.js';
import {
  PlaneTakeoff,
  Building2,
  Coins,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Clock,
  ExternalLink,
  RotateCcw,
  Calendar,
  Filter,
  Info,
  ShieldAlert,
  FileCheck
} from 'lucide-react';

const STORAGE_KEY = 'ai_tools_leaving-japan-wizard-jp_progress';

export default function LeavingJapanWizardView({ lang = 'vi' }) {
  const departureDateInput = useId();
  const departureTypeInput = useId();
  const tripDurationInput = useId();
  const pensionMonthsInput = useId();
  const koseiNenkinInput = useId();

  // State
  const [departureDate, setDepartureDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [departureType, setDepartureType] = useState('permanent'); // 'permanent' | 'temporary'
  const [tripDurationMonths, setTripDurationMonths] = useState(6);
  const [pensionContributionMonths, setPensionContributionMonths] = useState(36);
  const [hasKoseiNenkin, setHasKoseiNenkin] = useState(true);
  const [activeStageFilter, setActiveStageFilter] = useState('all');
  const [showPendingOnly, setShowPendingOnly] = useState(false);

  // Completed task ids loaded from localStorage
  const [completedTaskIds, setCompletedTaskIds] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(completedTaskIds));
    } catch (e) {
      console.warn('Failed to save departure checklist progress to localStorage:', e);
    }
  }, [completedTaskIds]);

  const toggleTask = (taskId) => {
    setCompletedTaskIds((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  const resetChecklist = () => {
    const confirmMsg =
      lang === 'ja'
        ? 'チェックリストの進捗をリセットしますか？'
        : lang === 'en'
        ? 'Do you want to reset all checklist progress?'
        : 'Bạn có chắc chắn muốn đặt lại toàn bộ tiến độ danh mục thủ tục?';
    if (window.confirm(confirmMsg)) {
      setCompletedTaskIds([]);
    }
  };

  // Generate departure plan
  const plan = useMemo(() => {
    return generateDeparturePlan(
      {
        departureDate,
        departureType,
        tripDurationMonths: Number(tripDurationMonths) || 1,
        hasPensionContributions: true,
        pensionContributionMonths: Number(pensionContributionMonths) || 0,
        hasKoseiNenkin,
      },
      {
        completedTaskIds,
      }
    );
  }, [departureDate, departureType, tripDurationMonths, pensionContributionMonths, hasKoseiNenkin, completedTaskIds]);

  // Filter tasks
  const displayedTasks = useMemo(() => {
    return plan.flatTasks.filter((task) => {
      if (activeStageFilter !== 'all' && task.stageId !== activeStageFilter) {
        return false;
      }
      if (showPendingOnly && completedTaskIds.includes(task.id)) {
        return false;
      }
      return true;
    });
  }, [plan.flatTasks, activeStageFilter, showPendingOnly, completedTaskIds]);

  // Dictionary
  const I18N = {
    vi: {
      toolTitle: 'Hướng Dẫn Thủ Tục Khi Rời Khỏi Nhật Bản',
      toolDesc: 'Lộ trình và danh mục toàn diện các thủ tục khi xuất cảnh tạm thời (Minashi Re-entry) hoặc rời Nhật hẳn (Chuyển đi, Người đại diện thuế, Rút Nenkin 1 lần & Hoàn 20.42% thuế).',
      badge: 'Sự Kiện Đời Sống: Rời Nhật Bản',
      inputSection: 'Kế Hoạch & Điều Kiện Rời Nhật',
      departureDateLabel: 'Ngày dự kiến rời Nhật Bản',
      departureTypeLabel: 'Hình thức xuất cảnh',
      typePermanent: 'Về nước hẳn / Rời Nhật hoàn toàn (Không tái nhập cảnh)',
      typeTemporary: 'Tạm thời rời Nhật (Về thăm nhà, công tác, du lịch rồi quay lại)',
      tripDurationLabel: 'Thời gian dự kiến ở nước ngoài (Tháng)',
      tripDurationHintShort: 'Dưới 1 năm: Áp dụng Miễn thủ tục tại Cục (Minashi Re-entry tại sân bay)',
      tripDurationHintLong: 'Trên 1 năm: Bắt buộc xin Giấy phép tái nhập cảnh trước tại Cục ISA',
      pensionMonthsLabel: 'Tổng số tháng đã đóng Nenkin tại Nhật',
      pensionMonthsHint: 'Tối thiểu 6 tháng để được rút. Mức trần chi trả tối đa là 60 tháng (5 năm).',
      koseiNenkinLabel: 'Từng tham gia Nenkin Phúc lợi (Kosei Nenkin của công ty) để xin hoàn 20.42% thuế',
      progressTitle: 'Tiến độ hoàn tất thủ tục rời Nhật',
      completedCount: 'Đã hoàn thành',
      requiredRemaining: 'Thủ tục bắt buộc chưa làm',
      pensionDeadlineTitle: 'Hạn chót rút Nenkin 1 lần (2 năm)',
      reentryModeTitle: 'Cơ chế Tái Nhập Cảnh',
      minashiMode: 'Minashi Re-entry (Tại sân bay)',
      regularMode: 'Xin phép Cục ISA (Trước khi bay)',
      daysRemaining: 'Còn lại',
      daysOverdue: 'Đã quá hạn',
      daysUnit: 'ngày',
      filterAll: 'Tất cả giai đoạn',
      pendingOnly: 'Chỉ hiện việc chưa hoàn thành',
      resetBtn: 'Đặt lại tiến độ',
      stagePre: 'Trước khi rời Nhật',
      stageAirport: 'Tại sân bay xuất cảnh',
      stagePost: 'Sau khi về nước',
      requiredBadge: 'Bắt buộc',
      conditionalBadge: 'Theo điều kiện',
      recommendedBadge: 'Khuyến nghị',
      deadlineLabel: 'Hạn chót:',
      authorityLabel: 'Cơ quan phụ trách:',
      deepLinkBtn: 'Mở công cụ liên quan',
      sourcesTitle: 'Căn Cứ Pháp Lý & Văn Bản Quy Phạm Chính Thức',
    },
    ja: {
      toolTitle: '日本を離れる手続きガイド（出国・帰国手続き）',
      toolDesc: '一時帰国（みなし再入国許可）および本帰国（海外転出届、マイナンバー失効、納税管理人、脱退一時金最大60ヶ月・源泉所得税20.42%還付）を完全網羅するライフイベントガイド。',
      badge: 'ライフイベント：出国・帰国',
      inputSection: '出国予定・条件の設定',
      departureDateLabel: '日本出国予定日',
      departureTypeLabel: '出国の目的・形態',
      typePermanent: '完全帰国・出国（再入国の予定なし）',
      typeTemporary: '一時出国（一時帰国・出張・旅行後に再入国予定）',
      tripDurationLabel: '海外滞在予定期間（月数）',
      tripDurationHintShort: '1年以内：空港での「みなし再入国許可」利用可能（手数料無料）',
      tripDurationHintLong: '1年超：出国前に地方入管で通常の再入国許可を取得必須',
      pensionMonthsLabel: '年金（厚生年金・国民年金）の通算納付月数',
      pensionMonthsHint: '6ヶ月以上で請求可。法改正により最大支給上限は60ヶ月（5年分）。',
      koseiNenkinLabel: '厚生年金加入期間あり（20.42%の源泉所得税還付対象）',
      progressTitle: '出国手続きの完了進捗',
      completedCount: '完了済み',
      requiredRemaining: '未完了の必須タスク',
      pensionDeadlineTitle: '脱退一時金 法定2年請求期限',
      reentryModeTitle: '再入国制度の区分',
      minashiMode: 'みなし再入国（空港審査）',
      regularMode: '入管事前許可（一次/数次）',
      daysRemaining: '残り',
      daysOverdue: '期限超過',
      daysUnit: '日',
      filterAll: 'すべての時期',
      pendingOnly: '未完了のみ表示',
      resetBtn: '進捗をリセット',
      stagePre: '出国前の準備',
      stageAirport: '空港出国審査',
      stagePost: '出国後・帰国後',
      requiredBadge: '必須・期限厳守',
      conditionalBadge: '条件付',
      recommendedBadge: '推奨',
      deadlineLabel: '期限目安：',
      authorityLabel: '所轄官庁：',
      deepLinkBtn: '関連ツールを開く',
      sourcesTitle: '参照法令・公的情報源（Primary Regulatory Sources）',
    },
    en: {
      toolTitle: 'Leaving Japan Procedure Guide',
      toolDesc: 'Comprehensive life-event roadmap for temporary exit (Minashi Re-entry) and permanent departure (Moving-out, Tax Administrator, 60-month Lump-Sum Pension & 20.42% Tax Refund).',
      badge: 'Life Event: Leaving Japan',
      inputSection: 'Departure Plan & Parameters',
      departureDateLabel: 'Planned Departure Date',
      departureTypeLabel: 'Departure Purpose & Type',
      typePermanent: 'Permanent Departure (No plan to return)',
      typeTemporary: 'Temporary Departure (Returning after visit / trip)',
      tripDurationLabel: 'Expected Stay Abroad (Months)',
      tripDurationHintShort: 'Under 1 year: Special Minashi Re-entry permit at airport (Free)',
      tripDurationHintLong: 'Over 1 year: Formal Re-entry Permit required from ISA before departure',
      pensionMonthsLabel: 'Total Pension Contribution Months in Japan',
      pensionMonthsHint: 'Requires >= 6 months. Payout is legally capped at 60 months (5 years).',
      koseiNenkinLabel: 'Enrolled in Employees Pension (Kosei Nenkin) for 20.42% tax refund',
      progressTitle: 'Departure Tasks Progress',
      completedCount: 'Completed',
      requiredRemaining: 'Pending Mandatory Tasks',
      pensionDeadlineTitle: '2-Year Pension Withdrawal Deadline',
      reentryModeTitle: 'Re-entry Permit Type',
      minashiMode: 'Minashi Special Re-entry (Airport)',
      regularMode: 'Formal ISA Permit (Advance)',
      daysRemaining: 'Remaining',
      daysOverdue: 'Overdue by',
      daysUnit: 'days',
      filterAll: 'All Stages',
      pendingOnly: 'Show Pending Only',
      resetBtn: 'Reset Progress',
      stagePre: 'Pre-Departure Municipal',
      stageAirport: 'Airport Departure',
      stagePost: 'Post-Departure Pension',
      requiredBadge: 'Required',
      conditionalBadge: 'Conditional',
      recommendedBadge: 'Recommended',
      deadlineLabel: 'Deadline:',
      authorityLabel: 'Authority:',
      deepLinkBtn: 'Open Related Tool',
      sourcesTitle: 'Primary Statutory Authorities & Official Guides',
    }
  };

  const t = I18N[lang] || I18N.vi;

  // Pension task reference for summary metrics
  const pensionTask = plan.flatTasks.find((item) => item.id === 'task_lump_sum_pension');

  return (
    <StandardToolLayout
      title={t.toolTitle}
      description={t.toolDesc}
      badge={t.badge}
      maxWidth="max-w-[1240px]"
    >
      <div className="space-y-6">
        {/* 1. Thiết lập điều kiện rời Nhật */}
        <div className="bg-surface-container border border-outline-variant rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-outline-variant pb-3">
            <Calendar className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-lg text-on-surface">{t.inputSection}</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor={departureDateInput} className="block text-sm font-semibold text-on-surface mb-1">
                {t.departureDateLabel}
              </label>
              <input
                id={departureDateInput}
                type="date"
                aria-label={t.departureDateLabel}
                value={departureDate}
                onChange={(e) => setDepartureDate(e.target.value)}
                className="w-full px-3 py-2 border border-outline rounded-xl bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label htmlFor={departureTypeInput} className="block text-sm font-semibold text-on-surface mb-1">
                {t.departureTypeLabel}
              </label>
              <select
                id={departureTypeInput}
                aria-label={t.departureTypeLabel}
                value={departureType}
                onChange={(e) => setDepartureType(e.target.value)}
                className="w-full px-3 py-2 border border-outline rounded-xl bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary font-medium"
              >
                <option value="permanent">{t.typePermanent}</option>
                <option value="temporary">{t.typeTemporary}</option>
              </select>
            </div>
          </div>

          {/* Phân nhánh điều kiện tùy theo loại xuất cảnh */}
          {departureType === 'temporary' ? (
            <div className="p-4 rounded-xl border border-outline-variant bg-surface space-y-2">
              <label htmlFor={tripDurationInput} className="block text-sm font-semibold text-on-surface">
                {t.tripDurationLabel}
              </label>
              <div className="flex items-center gap-3">
                <input
                  id={tripDurationInput}
                  type="number"
                  min="1"
                  max="60"
                  aria-label={t.tripDurationLabel}
                  value={tripDurationMonths}
                  onChange={(e) => setTripDurationMonths(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-32 px-3 py-2 border border-outline rounded-xl bg-surface text-on-surface font-mono font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <span className="text-xs text-on-surface-variant">
                  {Number(tripDurationMonths) <= 12 ? t.tripDurationHintShort : t.tripDurationHintLong}
                </span>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-outline-variant bg-surface space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor={pensionMonthsInput} className="block text-sm font-semibold text-on-surface mb-1">
                    {t.pensionMonthsLabel}
                  </label>
                  <input
                    id={pensionMonthsInput}
                    type="number"
                    min="0"
                    max="480"
                    aria-label={t.pensionMonthsLabel}
                    value={pensionContributionMonths}
                    onChange={(e) => setPensionContributionMonths(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-full px-3 py-2 border border-outline rounded-xl bg-surface text-on-surface font-mono font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <span className="text-xs text-on-surface-variant mt-1 block">
                    {t.pensionMonthsHint}
                  </span>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-on-surface">
                    <input
                      id={koseiNenkinInput}
                      type="checkbox"
                      aria-label={t.koseiNenkinLabel}
                      checked={hasKoseiNenkin}
                      onChange={(e) => setHasKoseiNenkin(e.target.checked)}
                      className="w-4 h-4 text-primary rounded border-outline focus:ring-primary"
                    />
                    <span>{t.koseiNenkinLabel}</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 2. Cảnh báo quan trọng */}
        {plan.warnings.length > 0 && (
          <div className="space-y-3">
            {plan.warnings.map((w) => (
              <div
                key={w.id}
                className={`p-4 rounded-xl border flex items-start gap-3 ${
                  w.severity === 'danger'
                    ? 'border-red-600 bg-red-950/10 text-red-900 dark:text-red-200'
                    : w.severity === 'warning'
                    ? 'border-amber-600 bg-amber-950/10 text-amber-900 dark:text-amber-200'
                    : 'border-blue-600 bg-blue-950/10 text-blue-900 dark:text-blue-200'
                }`}
              >
                {w.severity === 'danger' ? (
                  <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
                ) : w.severity === 'warning' ? (
                  <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-600" />
                ) : (
                  <Info className="w-5 h-5 flex-shrink-0 mt-0.5 text-blue-600" />
                )}
                <div>
                  <h3 className="font-bold text-sm">
                    {lang === 'ja' ? w.titleJa : lang === 'en' ? w.titleEn : w.titleVi}
                  </h3>
                  <p className="text-xs mt-1 leading-relaxed">
                    {lang === 'ja' ? w.messageJa : lang === 'en' ? w.messageEn : w.messageVi}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 3. Tiến độ & Thẻ thông số tóm tắt */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-surface-container border border-outline-variant rounded-2xl p-5 shadow-sm space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              {t.progressTitle}
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-black font-mono text-primary">
                {plan.summary.progressPercent}%
              </span>
              <span className="text-xs text-on-surface-variant font-medium">
                {plan.summary.completedTasks} / {plan.summary.totalTasks}
              </span>
            </div>
            <div className="w-full bg-outline-variant/30 h-2 rounded-full overflow-hidden">
              <div
                className="bg-primary h-full transition-all duration-300"
                style={{ width: `${plan.summary.progressPercent}%` }}
              />
            </div>
          </div>

          <div className="bg-surface-container border border-outline-variant rounded-2xl p-5 shadow-sm space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              {t.requiredRemaining}
            </span>
            <div className="text-3xl font-black font-mono text-on-surface">
              {plan.summary.requiredCount - plan.summary.requiredCompleted}
              <span className="text-sm font-normal text-on-surface-variant ml-2">
                / {plan.summary.requiredCount}
              </span>
            </div>
            <p className="text-xs text-on-surface-variant">
              {plan.summary.requiredCompleted === plan.summary.requiredCount
                ? 'Đã hoàn tất tất cả thủ tục cốt lõi'
                : 'Cần hoàn thành trước khi chuyến bay khởi hành'}
            </p>
          </div>

          <div className="bg-surface-container border border-outline-variant rounded-2xl p-5 shadow-sm space-y-1">
            {departureType === 'permanent' ? (
              <>
                <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  {t.pensionDeadlineTitle}
                </span>
                <div className={`text-3xl font-black font-mono ${
                  !pensionTask || pensionTask.daysRemaining === null
                    ? 'text-on-surface'
                    : pensionTask.daysRemaining < 0
                    ? 'text-red-600'
                    : pensionTask.daysRemaining <= 90
                    ? 'text-amber-800 dark:text-amber-300'
                    : 'text-primary'
                }`}>
                  {pensionTask && pensionTask.daysRemaining !== null
                    ? Math.abs(pensionTask.daysRemaining)
                    : '--'}
                  <span className="text-sm font-normal text-on-surface-variant ml-2">
                    {pensionTask && pensionTask.daysRemaining !== null && pensionTask.daysRemaining < 0
                      ? t.daysOverdue
                      : t.daysRemaining} ({t.daysUnit})
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant">
                  {pensionTask && pensionTask.calculatedDeadlineDate
                    ? `Hạn nộp: ${pensionTask.calculatedDeadlineDate}`
                    : 'Cần gửi hồ sơ qua bưu điện về Nhật Bản'}
                </p>
              </>
            ) : (
              <>
                <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  {t.reentryModeTitle}
                </span>
                <div className="text-xl font-black text-primary pt-1">
                  {Number(tripDurationMonths) <= 12 ? t.minashiMode : t.regularMode}
                </div>
                <p className="text-xs text-on-surface-variant pt-1">
                  {Number(tripDurationMonths) <= 12
                    ? 'Tích ô số 1 trên thẻ ED tại quầy xuất cảnh sân bay'
                    : 'Phải tới Cục ISA nộp đơn trước ngày xuất cảnh'}
                </p>
              </>
            )}
          </div>
        </div>

        {/* 4. Bộ lọc & Danh sách Checklist */}
        <div className="bg-surface-container border border-outline-variant rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant pb-4">
            <div className="flex flex-wrap items-center gap-2">
              <Filter className="w-4 h-4 text-primary" />
              <button
                type="button"
                onClick={() => setActiveStageFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  activeStageFilter === 'all'
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface text-on-surface hover:bg-surface-container-high'
                }`}
              >
                {t.filterAll}
              </button>
              <button
                type="button"
                onClick={() => setActiveStageFilter('stage_pre_departure')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  activeStageFilter === 'stage_pre_departure'
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface text-on-surface hover:bg-surface-container-high'
                }`}
              >
                {t.stagePre}
              </button>
              <button
                type="button"
                onClick={() => setActiveStageFilter('stage_airport_departure')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  activeStageFilter === 'stage_airport_departure'
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface text-on-surface hover:bg-surface-container-high'
                }`}
              >
                {t.stageAirport}
              </button>
              <button
                type="button"
                onClick={() => setActiveStageFilter('stage_post_departure')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  activeStageFilter === 'stage_post_departure'
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface text-on-surface hover:bg-surface-container-high'
                }`}
              >
                {t.stagePost}
              </button>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-on-surface">
                <input
                  type="checkbox"
                  aria-label={t.pendingOnly}
                  checked={showPendingOnly}
                  onChange={(e) => setShowPendingOnly(e.target.checked)}
                  className="w-3.5 h-3.5 text-primary rounded border-outline focus:ring-primary"
                />
                <span>{t.pendingOnly}</span>
              </label>

              <button
                type="button"
                onClick={resetChecklist}
                className="flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-red-600 transition-colors font-semibold"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t.resetBtn}</span>
              </button>
            </div>
          </div>

          {/* Task Cards */}
          <div className="space-y-3">
            {displayedTasks.map((task) => {
              const isDone = completedTaskIds.includes(task.id);
              return (
                <div
                  key={task.id}
                  onClick={() => toggleTask(task.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-4 ${
                    isDone
                      ? 'bg-surface/50 border-outline-variant opacity-75'
                      : 'bg-surface border-outline hover:border-primary shadow-sm'
                  }`}
                >
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={isDone}
                    aria-label={`Mark task ${lang === 'ja' ? task.titleJa : lang === 'en' ? task.titleEn : task.titleVi} as completed`}
                    className="flex-shrink-0 mt-0.5 text-primary focus:outline-none"
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-5 h-5 fill-primary text-on-primary" />
                    ) : (
                      <Circle className="w-5 h-5 text-outline hover:text-primary" />
                    )}
                  </button>

                  <div className="flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                        task.requirement === 'required'
                          ? 'bg-red-600 text-white'
                          : task.requirement === 'conditional'
                          ? 'bg-amber-800 text-white'
                          : 'bg-surface-container-high text-on-surface'
                      }`}>
                        {task.requirement === 'required'
                          ? t.requiredBadge
                          : task.requirement === 'conditional'
                          ? t.conditionalBadge
                          : t.recommendedBadge}
                      </span>

                      <h4 className={`text-sm font-bold ${isDone ? 'line-through text-on-surface-variant' : 'text-on-surface'}`}>
                        {lang === 'ja' ? task.titleJa : lang === 'en' ? task.titleEn : task.titleVi}
                      </h4>

                      {task.calculatedDeadlineDate && (
                        <span className={`text-xs px-2 py-0.5 rounded font-mono font-semibold flex items-center gap-1 ${
                          task.isOverdue
                            ? 'bg-red-700 text-white'
                            : task.isUrgent
                            ? 'bg-amber-800 text-white'
                            : 'bg-surface-container text-on-surface-variant'
                        }`}>
                          <Clock className="w-3 h-3" />
                          <span>{t.deadlineLabel} {task.calculatedDeadlineDate}</span>
                        </span>
                      )}

                      {task.isCappedAt60 && (
                        <span className="text-xs px-2 py-0.5 rounded bg-blue-900/20 text-blue-800 dark:text-blue-300 font-semibold">
                          Max 60 tháng
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      {lang === 'ja' ? task.descJa : lang === 'en' ? task.descEn : task.descVi}
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-on-surface-variant">
                      <span className="font-medium">
                        {t.authorityLabel} {lang === 'ja' ? task.authorityJa : lang === 'en' ? task.authorityEn : task.authorityVi}
                      </span>

                      {task.deepLink && (
                        <a
                          href={`#/${task.deepLink.toolId}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-bold"
                        >
                          <span>{lang === 'ja' ? task.deepLink.labelJa : lang === 'en' ? task.deepLink.labelEn : task.deepLink.labelVi}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 5. Nguồn Pháp Lý Chính Thức */}
        <div className="bg-surface-container border border-outline-variant rounded-2xl p-6 shadow-sm">
          <RegulatorySourceView
            sourceIds={DEPARTURE_SOURCES}
            title={t.sourcesTitle}
            lang={lang}
          />
        </div>
      </div>
    </StandardToolLayout>
  );
}
