/**
 * @file packages/core/src/components/immigration/ArrivingInJapanWizardView.jsx
 * @description
 * Giao diện Lộ trình & Hướng dẫn Thủ tục Cho Người Mới Sang Nhật (来日後セットアップガイド).
 * Sự kiện Đời sống thứ 4 (4th Life Event) trong Toolio Hub.
 * 
 * Tuân thủ MAIS Gate 1-4:
 * - Nguồn sự thật duy nhất (SOT): props.lang
 * - Chuẩn Trợ năng WCAG 2.1 AA (mọi input có label/id/aria-label, độ tương phản cao)
 * - Tương thích Theme CSS Tokens
 * - Lưu tiến độ checklist vào localStorage có namespace an toàn
 */

import React, { useState, useId, useMemo, useEffect } from 'react';
import StandardToolLayout from '../shared/StandardToolLayout.jsx';
import RegulatorySourceView from '../regulatory/RegulatorySourceView.jsx';
import {
  generateArrivalPlan,
  ARRIVAL_STAGES,
  ARRIVAL_SOURCES
} from '../../japan/immigration/index.js';
import {
  PlaneLanding,
  Building2,
  Smartphone,
  Briefcase,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Clock,
  ExternalLink,
  ShieldCheck,
  RotateCcw,
  Calendar,
  Filter,
  Info,
  CreditCard,
  FileCheck
} from 'lucide-react';

const STORAGE_KEY = 'ai_tools_arriving-in-japan-wizard-jp_progress';

export default function ArrivingInJapanWizardView({ lang = 'vi' }) {
  const entryDateInput = useId();
  const statusCategoryInput = useId();
  const shakaiHokenInput = useId();
  const partTimeInput = useId();

  // State
  const [entryDate, setEntryDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [statusCategory, setStatusCategory] = useState('work');
  const [hasCompanyShakaiHoken, setHasCompanyShakaiHoken] = useState(true);
  const [needsPartTimeWork, setNeedsPartTimeWork] = useState(false);
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
      console.warn('Failed to save arrival checklist progress to localStorage:', e);
    }
  }, [completedTaskIds]);

  // Adjust Shakai Hoken default on status category change
  const handleStatusChange = (val) => {
    setStatusCategory(val);
    if (val === 'work') {
      setHasCompanyShakaiHoken(true);
      setNeedsPartTimeWork(false);
    } else {
      setHasCompanyShakaiHoken(false);
      setNeedsPartTimeWork(true);
    }
  };

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

  // Generate arrival plan
  const plan = useMemo(() => {
    return generateArrivalPlan(
      {
        entryDate,
        statusCategory,
        hasCompanyShakaiHoken,
        needsPartTimeWork,
      },
      {
        completedTaskIds,
      }
    );
  }, [entryDate, statusCategory, hasCompanyShakaiHoken, needsPartTimeWork, completedTaskIds]);

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
      toolTitle: 'Hướng Dẫn Thủ Tục Cho Người Mới Sang Nhật',
      toolDesc: 'Lộ trình và danh mục toàn diện các thủ tục pháp định tại Sân bay, Tòa thị chính (hạn 14 ngày), Ngân hàng, SIM và Nơi làm việc.',
      badge: 'Sự Kiện Đời Sống: Nhập Cảnh',
      inputSection: 'Thiết Lập Điều Kiện Ban Đầu',
      entryDateLabel: 'Ngày đặt chân đến Nhật Bản (Ngày nhập cảnh)',
      statusLabel: 'Nhóm tư cách lưu trú',
      statusWork: 'Đi làm chuyên môn (Kỹ sư, Kinh tế, Nhân văn, v.v.)',
      statusStudent: 'Du học (Đại học, Cao đẳng, Trường tiếng Nhật)',
      statusDependent: 'Gia đình bảo lãnh (Vợ/Chồng, Con cái)',
      shakaiHokenLabel: 'Có tham gia Bảo hiểm Xã hội (Shakai Hoken) của công ty',
      partTimeLabel: 'Có nhu cầu làm thêm (アルバイト) tối đa 28h/tuần',
      progressTitle: 'Tiến độ hoàn tất các thủ tục nhập cảnh',
      completedCount: 'Đã hoàn thành',
      requiredRemaining: 'Thủ tục bắt buộc chưa hoàn thành',
      days14Deadline: 'Hạn chót 14 ngày đăng ký địa chỉ',
      daysRemaining: 'Còn lại',
      daysOverdue: 'Đã quá hạn',
      daysUnit: 'ngày',
      filterAll: 'Tất cả các giai đoạn',
      pendingOnly: 'Chỉ hiện việc chưa hoàn thành',
      resetBtn: 'Đặt lại tiến độ',
      stageAirport: 'Tại sân bay',
      stageMunicipal: 'Tòa thị chính (14 ngày)',
      stageEssentials: 'Tiện ích sinh hoạt',
      stageOnboarding: 'Công ty & Thuế',
      requiredBadge: 'Bắt buộc',
      recommendedBadge: 'Khuyến nghị',
      conditionalBadge: 'Tùy điều kiện',
      deadlineLabel: 'Hạn chót:',
      authorityLabel: 'Cơ quan giải quyết:',
      deepLinkBtn: 'Mở công cụ liên kết',
      sourcesTitle: 'Căn Cứ Pháp Lý & Văn Bản Chỉ Đạo Chính Thức',
    },
    ja: {
      toolTitle: '来日後セットアップガイド（新規入国・在留手続き）',
      toolDesc: '空港入国審査、市区町村窓口での住民登録（14日以内）、銀行口座・通信、勤務先・学校への提出手続きを網羅するライフイベントナビゲーション。',
      badge: 'ライフイベント：新規入国',
      inputSection: '初期条件・スケジュールの設定',
      entryDateLabel: '日本入国日（来日日）',
      statusLabel: '在留資格の区分',
      statusWork: '就労系在留資格（技術・人文知識・国際業務等）',
      statusStudent: '留学（大学・専門学校・日本語学校）',
      statusDependent: '家族滞在（配偶者・子）',
      shakaiHokenLabel: '勤務先の社会保険（健康保険・厚生年金）に加入する',
      partTimeLabel: '週28時間以内のアルバイト（資格外活動）を希望する',
      progressTitle: '来日後手続きの完了進捗',
      completedCount: '完了済み',
      requiredRemaining: '未完了の必須タスク',
      days14Deadline: '住民登録 法定14日期限',
      daysRemaining: '残り',
      daysOverdue: '期限超過',
      daysUnit: '日',
      filterAll: 'すべての時期',
      pendingOnly: '未完了のみ表示',
      resetBtn: '進捗をリセット',
      stageAirport: '空港・入国審査',
      stageMunicipal: '役所窓口（14日以内）',
      stageEssentials: '生活インフラ',
      stageOnboarding: '勤務先・学校・税務',
      requiredBadge: '必須・期限厳守',
      recommendedBadge: '推奨',
      conditionalBadge: '条件付',
      deadlineLabel: '期限目安：',
      authorityLabel: '届出先機関：',
      deepLinkBtn: '連携ツールを開く',
      sourcesTitle: '参照法令・公的情報源（Primary Regulatory Sources）',
    },
    en: {
      toolTitle: 'Newcomer Setup Guide for Japan',
      toolDesc: 'Comprehensive life-event roadmap covering airport landing, mandatory 14-day resident registration, banking, mobile, and employer tax onboarding.',
      badge: 'Life Event: Arriving in Japan',
      inputSection: 'Initial Conditions & Schedule',
      entryDateLabel: 'Arrival Date in Japan (Entry Date)',
      statusLabel: 'Status of Residence Category',
      statusWork: 'Work Status (Engineer/Specialist in Humanities, etc.)',
      statusStudent: 'Student (University, College, Language School)',
      statusDependent: 'Dependent (Spouse / Child)',
      shakaiHokenLabel: 'Enrolled in Employer Social Insurance (Shakai Hoken)',
      partTimeLabel: 'Plan to engage in part-time work (up to 28h/week)',
      progressTitle: 'Onboarding Procedures Completion Progress',
      completedCount: 'Completed',
      requiredRemaining: 'Pending Mandatory Tasks',
      days14Deadline: '14-Day Municipal Registration Deadline',
      daysRemaining: 'Remaining',
      daysOverdue: 'Overdue by',
      daysUnit: 'days',
      filterAll: 'All Stages',
      pendingOnly: 'Show Pending Only',
      resetBtn: 'Reset Progress',
      stageAirport: 'Airport Landing',
      stageMunicipal: 'City Office (14 Days)',
      stageEssentials: 'Life Essentials',
      stageOnboarding: 'Employer & Tax',
      requiredBadge: 'Required',
      recommendedBadge: 'Recommended',
      conditionalBadge: 'Conditional',
      deadlineLabel: 'Deadline:',
      authorityLabel: 'Authority:',
      deepLinkBtn: 'Open Related Tool',
      sourcesTitle: 'Primary Statutory Authorities & Official Guides',
    }
  };

  const t = I18N[lang] || I18N.vi;

  return (
    <StandardToolLayout
      title={t.toolTitle}
      description={t.toolDesc}
      badge={t.badge}
      maxWidth="max-w-[1240px]"
    >
      <div className="space-y-6">
        {/* 1. Thiết lập điều kiện ban đầu */}
        <div className="bg-surface-container border border-outline-variant rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-outline-variant pb-3">
            <Calendar className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-lg text-on-surface">{t.inputSection}</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor={entryDateInput} className="block text-sm font-semibold text-on-surface mb-1">
                {t.entryDateLabel}
              </label>
              <input
                id={entryDateInput}
                type="date"
                aria-label={t.entryDateLabel}
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                className="w-full px-3 py-2 border border-outline rounded-xl bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label htmlFor={statusCategoryInput} className="block text-sm font-semibold text-on-surface mb-1">
                {t.statusLabel}
              </label>
              <select
                id={statusCategoryInput}
                aria-label={t.statusLabel}
                value={statusCategory}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="w-full px-3 py-2 border border-outline rounded-xl bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="work">{t.statusWork}</option>
                <option value="student">{t.statusStudent}</option>
                <option value="dependent">{t.statusDependent}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-on-surface">
              <input
                id={shakaiHokenInput}
                type="checkbox"
                aria-label={t.shakaiHokenLabel}
                checked={hasCompanyShakaiHoken}
                onChange={(e) => setHasCompanyShakaiHoken(e.target.checked)}
                className="w-4 h-4 text-primary rounded border-outline focus:ring-primary"
              />
              <span>{t.shakaiHokenLabel}</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-on-surface">
              <input
                id={partTimeInput}
                type="checkbox"
                aria-label={t.partTimeLabel}
                checked={needsPartTimeWork}
                onChange={(e) => setNeedsPartTimeWork(e.target.checked)}
                className="w-4 h-4 text-primary rounded border-outline focus:ring-primary"
              />
              <span>{t.partTimeLabel}</span>
            </label>
          </div>
        </div>

        {/* 2. Cảnh báo khẩn cấp nếu có */}
        {plan.warnings.length > 0 && (
          <div className="space-y-3">
            {plan.warnings.map((w) => (
              <div
                key={w.id}
                className={`p-4 rounded-xl border flex items-start gap-3 ${
                  w.severity === 'danger'
                    ? 'border-red-600 bg-red-950/10 text-red-900 dark:text-red-200'
                    : 'border-amber-600 bg-amber-950/10 text-amber-900 dark:text-amber-200'
                }`}
              >
                <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${w.severity === 'danger' ? 'text-red-600' : 'text-amber-600'}`} />
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

        {/* 3. Tiến độ & Thẻ thông số */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-surface-container border border-outline-variant rounded-2xl p-5 shadow-sm space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              {t.progressTitle}
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-black font-mono text-primary">
                {plan.summary.progressPercent}%
              </span>
              <span className="text-xs text-on-surface-variant">
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
                / {plan.summary.requiredCount} {t.daysUnit}
              </span>
            </div>
            <p className="text-xs text-on-surface-variant">
              {plan.summary.requiredCompleted === plan.summary.requiredCount
                ? 'Đã hoàn thành toàn bộ thủ tục bắt buộc'
                : 'Cần ưu tiên hoàn thành trước hạn'}
            </p>
          </div>

          <div className="bg-surface-container border border-outline-variant rounded-2xl p-5 shadow-sm space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              {t.days14Deadline}
            </span>
            <div className={`text-3xl font-black font-mono ${
              plan.summary.daysRemaining14 === null
                ? 'text-on-surface'
                : plan.summary.daysRemaining14 < 0
                ? 'text-red-600'
                : plan.summary.daysRemaining14 <= 3
                ? 'text-amber-800 dark:text-amber-300'
                : 'text-primary'
            }`}>
              {plan.summary.daysRemaining14 === null
                ? '--'
                : Math.abs(plan.summary.daysRemaining14)}
              <span className="text-sm font-normal text-on-surface-variant ml-2">
                {plan.summary.daysRemaining14 !== null && plan.summary.daysRemaining14 < 0
                  ? t.daysOverdue
                  : t.daysRemaining} ({t.daysUnit})
              </span>
            </div>
            <p className="text-xs text-on-surface-variant">
              {plan.summary.daysRemaining14 !== null && plan.summary.daysRemaining14 < 0
                ? 'Đã quá thời hạn 14 ngày theo luật'
                : 'Tính từ ngày đặt chân đến Nhật Bản'}
            </p>
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
                onClick={() => setActiveStageFilter('stage_airport')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  activeStageFilter === 'stage_airport'
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface text-on-surface hover:bg-surface-container-high'
                }`}
              >
                {t.stageAirport}
              </button>
              <button
                type="button"
                onClick={() => setActiveStageFilter('stage_municipal')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  activeStageFilter === 'stage_municipal'
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface text-on-surface hover:bg-surface-container-high'
                }`}
              >
                {t.stageMunicipal}
              </button>
              <button
                type="button"
                onClick={() => setActiveStageFilter('stage_essentials')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  activeStageFilter === 'stage_essentials'
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface text-on-surface hover:bg-surface-container-high'
                }`}
              >
                {t.stageEssentials}
              </button>
              <button
                type="button"
                onClick={() => setActiveStageFilter('stage_onboarding')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  activeStageFilter === 'stage_onboarding'
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface text-on-surface hover:bg-surface-container-high'
                }`}
              >
                {t.stageOnboarding}
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
            sourceIds={ARRIVAL_SOURCES}
            title={t.sourcesTitle}
            lang={lang}
          />
        </div>
      </div>
    </StandardToolLayout>
  );
}
