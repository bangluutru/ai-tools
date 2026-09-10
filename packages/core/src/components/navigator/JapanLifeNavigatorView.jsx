/**
 * @file JapanLifeNavigatorView.jsx
 * @description
 * Japan Life Navigator Interactive Journey View.
 * Situation-first orchestration engine guiding residents through complex life transitions in Japan.
 * Features:
 * - Natural language intent search & disambiguation
 * - 7 Canonical Life Event journey roadmaps
 * - Stage progression & priority task tracking
 * - LocalStorage state persistence & reset
 * - Regulatory freshness badges
 * - Safe deep links to mini-apps via CapabilityRegistry
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Compass,
  Search,
  CheckCircle2,
  Circle,
  Clock,
  Building2,
  AlertTriangle,
  RotateCcw,
  ExternalLink,
  ArrowRight,
  ShieldCheck,
  PlaneLanding,
  Briefcase,
  Home,
  Baby,
  Users,
  LogOut,
  Sparkles,
  ChevronRight,
  Filter,
} from 'lucide-react';
import StandardToolLayout, { StatusBadge } from '../shared/StandardToolLayout.jsx';
import {
  getAllLifeEvents,
  getLifeEventById,
  getLifeEventRuntime,
  resolveIntentFromText,
  resolveDisambiguatedOption,
  resolveCapability,
  buildCapabilityDeepLink,
} from '../../navigator/index.js';

const STORAGE_KEY = 'toolio_japan_life_journey_v1';

const EVENT_ICONS = {
  'life.jp.starting-life': PlaneLanding,
  'life.jp.changing-job': Briefcase,
  'life.jp.leaving-job': LogOut,
  'life.jp.pregnancy-birth': Baby,
  'life.jp.moving': Home,
  'life.jp.family-joining': Users,
  'life.jp.leaving-japan': LogOut,
};

export function JapanLifeNavigatorView({ lang = 'vi' }) {
  const [currentLang, setCurrentLang] = useState(lang);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeEventId, setActiveEventId] = useState(null);
  const [activeStageId, setActiveStageId] = useState(null);
  const [completedTaskIds, setCompletedTaskIds] = useState([]);
  const [disambiguationData, setDisambiguationData] = useState(null);
  const [contextFilters, setContextFilters] = useState({
    employmentStatus: 'regular_employee',
    hasChildren: false,
    hasGap: true,
    isSameWorkType: true,
  });

  // Khôi phục hành trình từ localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.activeEventId) {
          setActiveEventId(parsed.activeEventId);
        }
        if (Array.isArray(parsed.completedTaskIds)) {
          setCompletedTaskIds(parsed.completedTaskIds);
        }
        if (parsed.contextFilters) {
          setContextFilters((prev) => ({ ...prev, ...parsed.contextFilters }));
        }
      }
    } catch {
      // Ignored
    }
  }, []);

  // Lưu trạng thái hành trình vào localStorage
  useEffect(() => {
    try {
      if (activeEventId) {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            activeEventId,
            completedTaskIds,
            contextFilters,
            savedAt: new Date().toISOString(),
          })
        );
      }
    } catch {
      // Ignored
    }
  }, [activeEventId, completedTaskIds, contextFilters]);

  const allEvents = useMemo(() => getAllLifeEvents(), []);

  // Xử lý tìm kiếm ý định
  const searchResult = useMemo(() => {
    if (!searchQuery.trim()) {
      return null;
    }
    return resolveIntentFromText(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    if (searchResult && searchResult.isAmbiguous) {
      setDisambiguationData(searchResult.disambiguation);
    } else {
      setDisambiguationData(null);
    }
  }, [searchResult]);

  // Lấy dữ liệu Life Event đang active
  const activeEvent = useMemo(() => {
    if (!activeEventId) return null;
    return getLifeEventById(activeEventId);
  }, [activeEventId]);

  const activeRuntime = useMemo(() => {
    if (!activeEventId) return null;
    return getLifeEventRuntime(activeEventId);
  }, [activeEventId]);

  // Đánh giá timeline stages
  const evaluatedStages = useMemo(() => {
    if (!activeRuntime) return [];
    return activeRuntime.evaluateTimeline(contextFilters);
  }, [activeRuntime, contextFilters]);

  // Đồng bộ activeStageId
  useEffect(() => {
    if (evaluatedStages.length > 0) {
      if (!activeStageId || !evaluatedStages.some((s) => s.stageId === activeStageId)) {
        setActiveStageId(evaluatedStages[0].stageId);
      }
    }
  }, [evaluatedStages, activeStageId]);

  // Đánh giá checklist công việc
  const evaluatedTasks = useMemo(() => {
    if (!activeRuntime) return [];
    return activeRuntime.evaluateChecklist({
      ...contextFilters,
      familyContext: {
        childrenCount: contextFilters.hasChildren ? 2 : 0,
        hasSpouse: true,
      },
    });
  }, [activeRuntime, contextFilters]);

  // Thống kê tiến độ
  const progressStats = useMemo(() => {
    if (!evaluatedTasks.length) return { total: 0, completed: 0, percent: 0 };
    const total = evaluatedTasks.length;
    const completed = evaluatedTasks.filter((t) => completedTaskIds.includes(t.id)).length;
    const percent = Math.round((completed / total) * 100);
    return { total, completed, percent };
  }, [evaluatedTasks, completedTaskIds]);

  // Toggle hoàn thành task
  const toggleTask = (taskId) => {
    setCompletedTaskIds((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  // Reset hành trình
  const handleResetJourney = () => {
    setActiveEventId(null);
    setActiveStageId(null);
    setCompletedTaskIds([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignored
    }
  };

  // Chọn event từ search hoặc card
  const selectEvent = (eventId) => {
    setActiveEventId(eventId);
    setSearchQuery('');
    setDisambiguationData(null);
  };

  // Xử lý lựa chọn mơ hồ
  const handleDisambiguationSelect = (scenarioId, optionId) => {
    const resolvedIntent = resolveDisambiguatedOption(scenarioId, optionId);
    if (resolvedIntent) {
      const match = resolveIntentFromText(resolvedIntent);
      if (match && match.targetSituation) {
        selectEvent(match.targetSituation);
      }
    }
  };

  // Lọc tasks theo active stage
  const currentStageTasks = useMemo(() => {
    if (!activeStageId) return evaluatedTasks;
    return evaluatedTasks.filter((t) => (t.stageId || t.stage) === activeStageId);
  }, [evaluatedTasks, activeStageId]);

  return (
    <StandardToolLayout
      title="Japan Life Navigator"
      subtitle={{
        vi: 'Điều hướng hành trình đời sống tại Nhật Bản (Chuyển việc, Đến Nhật, Sinh con, Đổi nhà)',
        ja: '日本でのライフイベント総合ナビゲーション（転職・来日・出産・引越）',
        en: 'Japan Life Events Navigator & Action Roadmap',
      }[currentLang]}
      icon={Compass}
      category="Japan Life"
      categoryHref="#/hub/japan-life"
      actions={
        <div className="flex items-center gap-2">
          {activeEventId && (
            <button
              onClick={handleResetJourney}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-outline/20 text-on-surface hover:bg-surface-variant text-sm transition-colors"
              title="Đặt lại hành trình"
            >
              <RotateCcw className="w-4 h-4 text-secondary" />
              <span>Reset Journey</span>
            </button>
          )}
          <div className="flex bg-surface-variant rounded-lg p-0.5 border border-outline/20 text-xs">
            {['vi', 'ja', 'en'].map((l) => (
              <button
                key={l}
                onClick={() => setCurrentLang(l)}
                className={`px-2 py-1 rounded font-medium uppercase transition-colors ${
                  currentLang === l
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* ========================================================= */}
        {/* TOP SEARCH BAR (Natural language intent entry)            */}
        {/* ========================================================= */}
        <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-on-surface text-base">
              {currentLang === 'vi'
                ? 'Bạn đang cần giải quyết việc gì tại Nhật Bản?'
                : currentLang === 'ja'
                ? '今、何をしたいですか？（自然言語で検索）'
                : 'What do you need help with in Japan?'}
            </h2>
          </div>

          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                currentLang === 'vi'
                  ? 'VD: Tôi vừa nghỉ việc, vợ sắp sang Nhật, chuyển sang Fukuoka, visa hết hạn...'
                  : currentLang === 'ja'
                  ? '例：転職したい、家族呼び寄せ、引っ越し、退職手続き、永住申請...'
                  : 'E.g., changing jobs, bring family, move to fukuoka, renew visa...'
              }
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-outline/30 bg-surface text-on-surface text-sm focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          {/* Prompt result dropdown / match badge */}
          {searchResult && searchResult.matchedIntent && !searchResult.isAmbiguous && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-surface border border-primary/30 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                <span className="font-medium text-on-surface">
                  {searchResult.matchedIntent.label[currentLang] || searchResult.matchedIntent.label.ja}
                </span>
                <span className="text-xs text-on-surface-variant">
                  ({searchResult.matchedAlias})
                </span>
              </div>
              <button
                onClick={() => selectEvent(searchResult.targetSituation)}
                className="px-3 py-1 bg-primary text-on-primary text-xs font-medium rounded-md hover:bg-primary/90 flex items-center gap-1 transition-colors"
              >
                <span>Bắt đầu hành trình</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Disambiguation Question Card */}
          {disambiguationData && (
            <div className="p-4 rounded-lg bg-surface border border-secondary/40 space-y-3">
              <div className="flex items-center gap-2 text-secondary font-medium text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>{disambiguationData.question[currentLang] || disambiguationData.question.ja}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {disambiguationData.options.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => handleDisambiguationSelect(disambiguationData.id, opt.id)}
                    className="text-left p-2.5 rounded-md border border-outline/20 hover:border-primary hover:bg-primary/5 text-xs text-on-surface transition-colors flex items-center justify-between"
                  >
                    <span>{opt.label[currentLang] || opt.label.ja}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-outline shrink-0 ml-1" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* LANDING VIEW: 7 CANONICAL LIFE EVENTS CARDS               */}
        {/* ========================================================= */}
        {!activeEventId && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-on-surface uppercase tracking-wider">
                {currentLang === 'vi'
                  ? 'Các Sự Kiện Đời Sống Chính'
                  : currentLang === 'ja'
                  ? 'ライフイベント一覧'
                  : 'Major Life Events in Japan'}
              </h3>
              <span className="text-xs text-on-surface-variant">
                7 Canonical Life Journeys
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {allEvents.map((item) => {
                const def = item.definition;
                const IconComponent = EVENT_ICONS[def.id] || Compass;
                return (
                  <div
                    key={def.id}
                    onClick={() => selectEvent(def.id)}
                    className="p-4 rounded-xl border border-outline/20 bg-surface hover:border-primary hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-on-primary transition-colors">
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <StatusBadge variant="cyan">
                          {def.stages ? `${def.stages.length} Stages` : 'Journey'}
                        </StatusBadge>
                      </div>

                      <h4 className="font-semibold text-on-surface text-sm group-hover:text-primary transition-colors">
                        {def.title[currentLang] || def.title.ja}
                      </h4>
                      <p className="text-xs text-on-surface-variant line-clamp-2">
                        {def.description ? def.description[currentLang] || def.description.ja : ''}
                      </p>
                    </div>

                    <div className="pt-3 mt-3 border-t border-outline/10 flex items-center justify-between text-xs text-primary font-medium">
                      <span>Xem lộ trình chi tiết</span>
                      <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* ACTIVE JOURNEY VIEW: TIMELINE, STAGES, CHECKLIST           */}
        {/* ========================================================= */}
        {activeEvent && (
          <div className="space-y-6">
            {/* Active Header & Progress Bar */}
            <div className="p-4 rounded-xl border border-outline/20 bg-surface space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-primary text-on-primary">
                    {React.createElement(EVENT_ICONS[activeEvent.id] || Compass, {
                      className: 'w-6 h-6',
                    })}
                  </div>
                  <div>
                    <h3 className="font-bold text-on-surface text-lg">
                      {activeEvent.definition.title[currentLang] || activeEvent.definition.title.ja}
                    </h3>
                    <p className="text-xs text-on-surface-variant">
                      {activeEvent.definition.description
                        ? activeEvent.definition.description[currentLang] || activeEvent.definition.description.ja
                        : ''}
                    </p>
                  </div>
                </div>

                {/* Regulatory freshness badge */}
                <div className="flex items-center gap-2 self-start sm:self-center">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-variant text-on-surface text-xs border border-outline/20">
                    <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                    <span>Reiwa 6/7 Verified</span>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-on-surface-variant font-medium">
                  <span>Tiến độ hoàn thành</span>
                  <span>
                    {progressStats.completed} / {progressStats.total} ({progressStats.percent}%)
                  </span>
                </div>
                <div className="h-2 w-full bg-surface-variant rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300 rounded-full"
                    style={{ width: `${progressStats.percent}%` }}
                  />
                </div>
              </div>

              {/* Context Branching Toggles (Minimal, non-intrusive) */}
              <div className="pt-2 border-t border-outline/10 flex flex-wrap items-center gap-3 text-xs">
                <span className="font-medium text-on-surface flex items-center gap-1">
                  <Filter className="w-3 h-3 text-outline" />
                  Điều kiện:
                </span>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={contextFilters.hasChildren}
                    onChange={(e) =>
                      setContextFilters((p) => ({ ...p, hasChildren: e.target.checked }))
                    }
                    className="rounded text-primary focus:ring-primary"
                  />
                  <span>Có con nhỏ đi cùng</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={contextFilters.hasGap}
                    onChange={(e) =>
                      setContextFilters((p) => ({ ...p, hasGap: e.target.checked }))
                    }
                    className="rounded text-primary focus:ring-primary"
                  />
                  <span>Có khoảng trống giữa 2 việc</span>
                </label>
              </div>
            </div>

            {/* Stages Navigation Bar */}
            <div className="flex overflow-x-auto gap-2 pb-1 border-b border-outline/20">
              {evaluatedStages.map((stage, idx) => {
                const isSelected = stage.stageId === activeStageId;
                const stageTasks = evaluatedTasks.filter(
                  (t) => (t.stageId || t.stage) === stage.stageId
                );
                const stageCompleted = stageTasks.filter((t) =>
                  completedTaskIds.includes(t.id)
                ).length;
                const isAllDone = stageTasks.length > 0 && stageCompleted === stageTasks.length;

                return (
                  <button
                    key={stage.stageId}
                    onClick={() => setActiveStageId(stage.stageId)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-medium text-xs whitespace-nowrap transition-all ${
                      isSelected
                        ? 'bg-primary text-on-primary shadow-sm'
                        : 'bg-surface hover:bg-surface-variant text-on-surface-variant border border-outline/20'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        isSelected
                          ? 'bg-on-primary text-primary'
                          : isAllDone
                          ? 'bg-primary text-on-primary'
                          : 'bg-surface-variant text-on-surface'
                      }`}
                    >
                      {isAllDone ? '✓' : idx + 1}
                    </span>
                    <span>
                      {stage[`name${currentLang.charAt(0).toUpperCase() + currentLang.slice(1)}`] ||
                        stage.nameJa ||
                        stage.stageId}
                    </span>
                    <span className="text-[10px] opacity-80">
                      ({stageCompleted}/{stageTasks.length})
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Stage Tasks List */}
            <div className="space-y-3">
              {currentStageTasks.length === 0 ? (
                <div className="p-8 text-center text-on-surface-variant text-sm border border-dashed border-outline/20 rounded-xl">
                  Không có đầu việc nào trong giai đoạn này với điều kiện hiện tại.
                </div>
              ) : (
                currentStageTasks.map((task) => {
                  const isDone = completedTaskIds.includes(task.id);
                  const isUrgent = task.priority === 'urgent';
                  const resolvedCap = task.capabilityId
                    ? resolveCapability(task.capabilityId)
                    : null;
                  const deepLink = task.capabilityId
                    ? buildCapabilityDeepLink(task.capabilityId)
                    : null;

                  return (
                    <div
                      key={task.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isDone
                          ? 'bg-surface-subtle border-outline/20 opacity-75'
                          : isUrgent
                          ? 'bg-surface border-secondary/30 shadow-sm'
                          : 'bg-surface border-outline/20 hover:border-outline/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
                          <button
                            onClick={() => toggleTask(task.id)}
                            className="mt-0.5 text-outline hover:text-primary transition-colors shrink-0"
                          >
                            {isDone ? (
                              <CheckCircle2 className="w-5 h-5 text-primary" />
                            ) : (
                              <Circle className="w-5 h-5" />
                            )}
                          </button>

                          <div className="space-y-1.5 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4
                                className={`text-sm font-semibold ${
                                  isDone
                                    ? 'line-through text-on-surface-variant'
                                    : 'text-on-surface'
                                }`}
                              >
                                {task.title[currentLang] || task.title.ja}
                              </h4>

                              {task.deadlineDays !== null && task.deadlineDays !== undefined && (
                                <StatusBadge variant={isUrgent ? 'warning' : 'default'}>
                                  <Clock className="w-3 h-3" />
                                  <span>
                                    {task.deadlineDays === 0
                                      ? 'Tại chỗ'
                                      : `${task.deadlineDays} ngày`}
                                  </span>
                                </StatusBadge>
                              )}

                              {task.authority && (
                                <span className="text-[11px] text-on-surface-variant flex items-center gap-1">
                                  <Building2 className="w-3 h-3" />
                                  <span>{task.authority}</span>
                                </span>
                              )}
                            </div>

                            {task.why && (
                              <p className="text-xs text-on-surface-variant leading-relaxed">
                                {task.why[currentLang] || task.why.ja}
                              </p>
                            )}

                            {task.requiredDocuments && task.requiredDocuments.length > 0 && (
                              <div className="pt-1 flex flex-wrap items-center gap-1.5 text-[11px]">
                                <span className="text-on-surface-variant font-medium">Hồ sơ:</span>
                                {task.requiredDocuments.map((doc, dIdx) => (
                                  <span
                                    key={dIdx}
                                    className="px-1.5 py-0.5 rounded bg-surface-variant text-on-surface text-[10px] border border-outline/10"
                                  >
                                    {doc}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Direct Deep Link to Mini-app tool */}
                        {deepLink && resolvedCap && resolvedCap.isAvailable && (
                          <a
                            href={deepLink}
                            className="px-2.5 py-1.5 rounded-lg border border-primary/20 hover:border-primary hover:bg-primary/5 text-primary text-xs font-medium flex items-center gap-1 shrink-0 transition-colors"
                          >
                            <span>Mở công cụ</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </StandardToolLayout>
  );
}

export default JapanLifeNavigatorView;
