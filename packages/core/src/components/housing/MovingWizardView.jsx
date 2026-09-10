/**
 * @file packages/core/src/components/housing/MovingWizardView.jsx
 * @description
 * Giao diện Hướng dẫn & Điều phối Lộ trình Chuyển nhà Nhật Bản (引越し手続きガイド＆オーケストレーター)
 * Xây dựng trên Nền tảng Sự Kiện Đời Sống (Life Event Foundation).
 * Tuân thủ nghiêm ngặt MAIS: StandardToolLayout 1240px, Design Tokens, Trilingual (ja/vi/en), WCAG AA.
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  Compass,
  Calendar,
  Clock,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Circle,
  ArrowRight,
  Info,
  ExternalLink,
  FileText,
  Building2,
  Flame,
  Truck,
  CreditCard,
  Baby,
  Car,
  Wifi,
  Sparkles,
  ChevronRight,
  Filter,
  CheckSquare,
  Home,
  Trash2,
  RefreshCw
} from 'lucide-react';

import StandardToolLayout from '../shared/StandardToolLayout.jsx';
import RegulatorySourceView from '../regulatory/RegulatorySourceView.jsx';
import {
  generateMovingWizardPlan,
  MOVING_STAGES,
  MOVING_WIZARD_SOURCES,
  movingWizardRuntime,
  addDays,
} from '../../japan/housing/index.js';

const TRANSLATIONS = {
  ja: {
    toolTitle: '引越し手続きガイド＆オーケストレーター',
    toolDesc: '住民基本台帳法、国土交通省標準約款、郵便法、道路交通法に基づく引越し前後の法定スケジュール・ToDoチェックリスト・公的手続きの総合ナビゲーションです。',
    sectionInput: '1. 引越し条件・スケジュールの設定',
    moveDateLabel: '引越し予定日（新居への入居日）',
    moveDateHint: '※ 住民基本台帳法上の14日以内の届出起算日および各種解約・開栓の基準日となります。',
    movingTypeLabel: '引越しの区分（移動範囲）',
    movingTypeDiff: '異なる市区町村へ引越し（転出届・転入届が必要）',
    movingTypeSame: '同じ市区町村内での引越し（転居届のみでOK）',
    myNumberLabel: 'マイナンバーカードをお持ちですか？',
    myNumberYes: '持っている（マイナポータルでオンライン転出・ワンストップ申請可能）',
    myNumberNo: '持っていない（紙の転出証明書または窓口手続き）',
    childrenLabel: '高校生以下のお子様はいますか？（児童手当対象）',
    childrenYes: 'いる（引越し後15日以内の児童手当申請が必須）',
    childrenNo: 'いない',
    vehicleLabel: '自家用車・バイクをお持ちですか？',
    vehicleYes: '持っている（車検証・車庫証明・ナンバー変更）',
    vehicleNo: '持っていない',
    internetLabel: '固定光回線インターネットを利用しますか？',
    internetYes: '利用する（移転工事・新規開通予約が必要）',
    internetNo: '利用しない（ホームルーター/モバイル回線のみ）',
    foreignLabel: '世帯に外国籍の方（在留カード所持者）はいますか？',
    foreignYes: 'はい（在留カードの裏面住居地記載・14日以内）',
    foreignNo: 'いいえ（日本国籍のみ）',
    sectionWarnings: '2. 重要な法定期限・過料アラート',
    sectionStats: '3. 引越し準備進捗ステータス',
    progressLabel: 'チェックリスト達成率',
    completedTasks: '完了済み',
    applicableTasks: '対象タスク',
    urgentRemaining: '未完了の緊急タスク',
    resetChecklistBtn: '進捗をリセット',
    resetConfirm: 'チェックリストの進捗をリセットしますか？',
    sectionChecklist: '4. 引越し手続き ToDo チェックリスト',
    checklistDesc: '完了した項目をチェックして進捗を記録できます（ブラウザのローカルストレージに自動保存されます）。',
    filterStageAll: 'すべての時期',
    filterCatAll: 'すべての分野',
    catAdmin: '役所・行政',
    catLifeline: 'ライフライン',
    catFinance: '金融・通信',
    catPacking: '引越準備',
    catFamily: '家族・子ども',
    priorityUrgent: '必須・期限厳守',
    priorityImportant: '重要',
    priorityRecommended: '推奨',
    requiredDocsHeading: '必要書類・持ち物：',
    sectionTimeline: '5. 引越し進行タイムライン（全体工程）',
    timelineDesc: '引越し準備から新生活安定までの主要な手続きマイルストーン一覧です。',
    sectionTools: '6. 連携ツール・詳細シミュレーター',
    toolsDesc: '各手続きの具体的な計算や受給資格判定は以下の専用ツールをご活用ください。',
    openToolBtn: 'ツールを開く',
    regulatorySectionTitle: '参照法令・公的情報源（Primary Regulatory Sources）',
    showPendingOnly: '未完了のみ表示',
    statutoryDeadlinePrefix: '法定期限：',
  },
  vi: {
    toolTitle: 'Lộ Trình & Thủ Tục Chuyển Nhà Toàn Diện Tại Nhật Bản',
    toolDesc: 'Căn cứ Luật Đăng ký Cư trú, Quy chuẩn hợp đồng MLIT, Luật Bưu chính & Luật Giao thông: Quản lý tiến trình, lịch biểu hạn chót luật định và danh mục việc cần làm (ToDo Checklist).',
    sectionInput: '1. Thiết lập ngày chuyển nhà & điều kiện cá nhân',
    moveDateLabel: 'Ngày dự định chuyển đến nhà mới',
    moveDateHint: '※ Mốc tính hạn chót 14 ngày làm thủ tục cư trú và lên lịch cắt/mở điện nước gas.',
    movingTypeLabel: 'Phạm vi chuyển nhà',
    movingTypeDiff: 'Khác quận/huyện/thành phố (Cần báo đi 転出 và báo đến 転入)',
    movingTypeSame: 'Trong cùng một quận/thị xã (Chỉ cần nộp giấy đổi chỗ ở 転居届)',
    myNumberLabel: 'Bạn có Thẻ My Number (マイナンバーカード) không?',
    myNumberYes: 'Có (Có thể nộp 転出届 trực tuyến trên MyNaPortal)',
    myNumberNo: 'Chưa có (Lấy giấy chứng nhận chuyển đi bản giấy tại ủy ban)',
    childrenLabel: 'Gia đình có con nhỏ dưới 18 tuổi không?',
    childrenYes: 'Có (Bắt buộc nộp đơn Trợ cấp Trẻ em trong vòng 15 ngày)',
    childrenNo: 'Không có',
    vehicleLabel: 'Bạn có sở hữu ô tô hoặc xe máy không?',
    vehicleYes: 'Có (Đổi địa chỉ đăng kiểm 車検証 trong 15 ngày)',
    vehicleNo: 'Không có',
    internetLabel: 'Bạn có dùng mạng cáp quang cố định không?',
    internetYes: 'Có dùng (Cần đặt lịch kéo mạng mới trước 1 tháng)',
    internetNo: 'Không dùng (Chỉ dùng 4G/5G hoặc cục phát Wifi)',
    foreignLabel: 'Trong gia đình có người nước ngoài (mang Thẻ ngoại kiều) không?',
    foreignYes: 'Có (Bắt buộc in địa chỉ mới vào mặt sau Thẻ ngoại kiều trong 14 ngày)',
    foreignNo: 'Không',
    sectionWarnings: '2. Các hạn chót luật định & Cảnh báo tiền phạt',
    sectionStats: '3. Tiến độ chuẩn bị chuyển nhà',
    progressLabel: 'Tỷ lệ hoàn thành công việc',
    completedTasks: 'Đã hoàn thành',
    applicableTasks: 'Tổng số việc',
    urgentRemaining: 'Việc khẩn cấp chưa làm',
    resetChecklistBtn: 'Đặt lại tiến độ',
    resetConfirm: 'Bạn có chắc muốn đặt lại toàn bộ danh mục công việc không?',
    sectionChecklist: '4. Danh mục việc cần làm (ToDo Checklist)',
    checklistDesc: 'Đánh dấu vào các mục đã làm xong để lưu tiến độ (Tự động lưu vào trình duyệt của bạn).',
    filterStageAll: 'Tất cả các mốc thời gian',
    filterCatAll: 'Tất cả các lĩnh vực',
    catAdmin: 'Hành chính / Ủy ban',
    catLifeline: 'Điện nước gas / Bưu điện',
    catFinance: 'Tài chính / Ngân hàng',
    catPacking: 'Đóng gói / Nhà cửa',
    catFamily: 'Gia đình & Con nhỏ',
    priorityUrgent: 'Bắt buộc • Đúng hạn',
    priorityImportant: 'Quan trọng',
    priorityRecommended: 'Khuyên làm',
    requiredDocsHeading: 'Giấy tờ & Hồ sơ cần mang theo:',
    sectionTimeline: '5. Trục thời gian tiến trình (Timeline)',
    timelineDesc: 'Lộ trình các mốc sự kiện từ 1 tháng trước ngày chuyển đến khi ổn định cuộc sống mới.',
    sectionTools: '6. Các công cụ tính toán & hướng dẫn chuyên sâu',
    toolsDesc: 'Sử dụng các công cụ chuyên dụng bên dưới để ước tính cước phí và kiểm tra chi tiết từng thủ tục.',
    openToolBtn: 'Mở công cụ',
    regulatorySectionTitle: 'Cơ sở pháp lý & Văn bản quy phạm nhà nước (Primary Regulatory Sources)',
    showPendingOnly: 'Chỉ hiện việc chưa làm',
    statutoryDeadlinePrefix: 'Hạn luật định: ',
  },
  en: {
    toolTitle: 'Japan Moving Guide & Orchestrator',
    toolDesc: 'Comprehensive relocation roadmap, statutory deadlines, and interactive ToDo checklist based on the Basic Resident Registration Act, MLIT Moving Contract, and Postal Act.',
    sectionInput: '1. Relocation Schedule & Profile Setup',
    moveDateLabel: 'Move-in Date (Official Relocation Date)',
    moveDateHint: '※ Benchmark date for 14-day statutory registration and utility shutoff/start schedules.',
    movingTypeLabel: 'Relocation Scope',
    movingTypeDiff: 'To a different municipality (Move-out and Move-in notices required)',
    movingTypeSame: 'Within the same municipality (Intra-city move notice only)',
    myNumberLabel: 'Do you have a My Number Card?',
    myNumberYes: 'Yes (Eligible for online move-out notice via MyNaPortal)',
    myNumberNo: 'No (Paper move-out certificate required from city hall)',
    childrenLabel: 'Do you have children under 18?',
    childrenYes: 'Yes (Must claim Child Allowance within 15 days under exception rule)',
    childrenNo: 'No',
    vehicleLabel: 'Do you own an automobile or motorcycle?',
    vehicleYes: 'Yes (Inspection certificate update required within 15 days)',
    vehicleNo: 'No',
    internetLabel: 'Will you use fixed fiber-optic internet?',
    internetYes: 'Yes (Advance installation booking required ~1 month prior)',
    internetNo: 'No (Mobile Wi-Fi router / cellular only)',
    foreignLabel: 'Are there foreign residents (Residence Card holders) in household?',
    foreignYes: 'Yes (Mandatory address endorsement on card reverse within 14 days)',
    foreignNo: 'No',
    sectionWarnings: '2. Statutory Deadlines & Risk Alerts',
    sectionStats: '3. Relocation Progress Overview',
    progressLabel: 'Checklist Completion',
    completedTasks: 'Completed',
    applicableTasks: 'Total Tasks',
    urgentRemaining: 'Urgent Pending',
    resetChecklistBtn: 'Reset Progress',
    resetConfirm: 'Are you sure you want to reset your checklist progress?',
    sectionChecklist: '4. Relocation Action Checklist',
    checklistDesc: 'Check items as you complete them to track progress (automatically saved to browser local storage).',
    filterStageAll: 'All Stages',
    filterCatAll: 'All Categories',
    catAdmin: 'Government & Admin',
    catLifeline: 'Lifelines & Post',
    catFinance: 'Finance & Telecom',
    catPacking: 'Packing & Housing',
    catFamily: 'Family & Children',
    priorityUrgent: 'Urgent & Mandatory',
    priorityImportant: 'Important',
    priorityRecommended: 'Recommended',
    requiredDocsHeading: 'Required Documents & Items:',
    sectionTimeline: '5. Chronological Relocation Timeline',
    timelineDesc: 'Master timeline progression from 1 month prior to new life stabilization.',
    sectionTools: '6. Integrated Simulators & Dedicated Tools',
    toolsDesc: 'Leverage specialized calculators and diagnostic tools for precise cost and eligibility evaluation.',
    openToolBtn: 'Open Tool',
    regulatorySectionTitle: 'Primary Regulatory Sources & Legal References',
    showPendingOnly: 'Pending only',
    statutoryDeadlinePrefix: 'Deadline: ',
  },
};

export default function MovingWizardView({ lang = 'ja' }) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.ja;

  // Profile State
  const defaultMoveDate = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return addDays(today, 30);
  }, []);

  const [moveDate, setMoveDate] = useState(defaultMoveDate);
  const [movingType, setMovingType] = useState('different_municipality');
  const [hasMyNumberCard, setHasMyNumberCard] = useState(true);
  const [hasChildren, setHasChildren] = useState(false);
  const [hasVehicle, setHasVehicle] = useState(false);
  const [hasFixedInternet, setHasFixedInternet] = useState(true);
  const [isForeignResident, setIsForeignResident] = useState(true);

  // Filters State
  const [selectedStageFilter, setSelectedStageFilter] = useState('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [showPendingOnly, setShowPendingOnly] = useState(false);

  // Storage State for completed tasks
  const [completedTaskIds, setCompletedTaskIds] = useState(() => {
    try {
      return movingWizardRuntime.storage.loadCompleted();
    } catch {
      return [];
    }
  });

  // Toggle task completion
  const handleToggleTask = (taskId) => {
    try {
      const updated = movingWizardRuntime.storage.toggleCompleted(taskId);
      setCompletedTaskIds(updated);
    } catch {
      setCompletedTaskIds((prev) =>
        prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
      );
    }
  };

  // Reset checklist
  const handleResetChecklist = () => {
    if (window.confirm(t.resetConfirm)) {
      movingWizardRuntime.storage.clear();
      setCompletedTaskIds([]);
    }
  };

  // Generate Plan
  const plan = useMemo(() => {
    return generateMovingWizardPlan({
      moveDate,
      movingType,
      hasMyNumberCard,
      hasChildren,
      hasVehicle,
      hasFixedInternet,
      isForeignResident,
    });
  }, [
    moveDate,
    movingType,
    hasMyNumberCard,
    hasChildren,
    hasVehicle,
    hasFixedInternet,
    isForeignResident,
  ]);

  // Filter tasks
  const visibleTasks = useMemo(() => {
    return plan.tasks.filter((task) => {
      if (!task.isApplicable) return false;
      if (selectedStageFilter !== 'all' && task.stageId !== selectedStageFilter) return false;
      if (selectedCategoryFilter !== 'all' && task.category !== selectedCategoryFilter) return false;
      if (showPendingOnly && completedTaskIds.includes(task.id)) return false;
      return true;
    });
  }, [plan.tasks, selectedStageFilter, selectedCategoryFilter, showPendingOnly, completedTaskIds]);

  // Calculate live stats
  const stats = useMemo(() => {
    const applicable = plan.tasks.filter((task) => task.isApplicable);
    const applicableCount = applicable.length;
    const completedCount = applicable.filter((task) => completedTaskIds.includes(task.id)).length;
    const percent = applicableCount > 0 ? Math.round((completedCount / applicableCount) * 100) : 0;
    const urgentRemaining = applicable.filter(
      (task) => task.priority === 'urgent' && !completedTaskIds.includes(task.id)
    ).length;

    return {
      applicableCount,
      completedCount,
      percent,
      urgentRemaining,
    };
  }, [plan.tasks, completedTaskIds]);

  return (
    <StandardToolLayout
      title={t.toolTitle}
      description={t.toolDesc}
      badge="Japan Housing & Moving"
      lang={lang}
    >
      <div className="space-y-8 max-w-[1240px] mx-auto w-full overflow-x-hidden">
        {/* Section 1: Profile & Conditions */}
        <section className="bg-surface rounded-xl border border-border p-5 sm:p-6 shadow-sm max-w-full overflow-hidden">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
            <Compass className="w-6 h-6 text-primary shrink-0" />
            <h2 className="text-xl font-bold text-foreground">{t.sectionInput}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 min-w-0">
            {/* Move Date */}
            <div className="min-w-0">
              <label htmlFor="input_move_date" className="block text-sm font-semibold text-foreground mb-1.5">
                {t.moveDateLabel}
              </label>
              <input
                id="input_move_date"
                type="date"
                value={moveDate}
                onChange={(e) => setMoveDate(e.target.value)}
                className="w-full max-w-full px-3.5 py-2.5 bg-card text-foreground border border-border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1.5">{t.moveDateHint}</p>
            </div>

            {/* Moving Type */}
            <div className="min-w-0">
              <label htmlFor="input_moving_type" className="block text-sm font-semibold text-foreground mb-1.5">
                {t.movingTypeLabel}
              </label>
              <select
                id="input_moving_type"
                value={movingType}
                onChange={(e) => setMovingType(e.target.value)}
                className="w-full max-w-full truncate px-3.5 py-2.5 bg-card text-foreground border border-border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              >
                <option value="different_municipality">{t.movingTypeDiff}</option>
                <option value="same_municipality">{t.movingTypeSame}</option>
              </select>
            </div>

            {/* My Number Card */}
            <div className="min-w-0">
              <label htmlFor="input_my_number" className="block text-sm font-semibold text-foreground mb-1.5">
                {t.myNumberLabel}
              </label>
              <select
                id="input_my_number"
                value={hasMyNumberCard ? 'yes' : 'no'}
                onChange={(e) => setHasMyNumberCard(e.target.value === 'yes')}
                className="w-full max-w-full truncate px-3.5 py-2.5 bg-card text-foreground border border-border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              >
                <option value="yes">{t.myNumberYes}</option>
                <option value="no">{t.myNumberNo}</option>
              </select>
            </div>

            {/* Children */}
            <div className="min-w-0">
              <label htmlFor="input_children" className="block text-sm font-semibold text-foreground mb-1.5">
                {t.childrenLabel}
              </label>
              <select
                id="input_children"
                value={hasChildren ? 'yes' : 'no'}
                onChange={(e) => setHasChildren(e.target.value === 'yes')}
                className="w-full max-w-full truncate px-3.5 py-2.5 bg-card text-foreground border border-border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              >
                <option value="no">{t.childrenNo}</option>
                <option value="yes">{t.childrenYes}</option>
              </select>
            </div>

            {/* Vehicle */}
            <div className="min-w-0">
              <label htmlFor="input_vehicle" className="block text-sm font-semibold text-foreground mb-1.5">
                {t.vehicleLabel}
              </label>
              <select
                id="input_vehicle"
                value={hasVehicle ? 'yes' : 'no'}
                onChange={(e) => setHasVehicle(e.target.value === 'yes')}
                className="w-full max-w-full truncate px-3.5 py-2.5 bg-card text-foreground border border-border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              >
                <option value="no">{t.vehicleNo}</option>
                <option value="yes">{t.vehicleYes}</option>
              </select>
            </div>

            {/* Fixed Internet */}
            <div className="min-w-0">
              <label htmlFor="input_internet" className="block text-sm font-semibold text-foreground mb-1.5">
                {t.internetLabel}
              </label>
              <select
                id="input_internet"
                value={hasFixedInternet ? 'yes' : 'no'}
                onChange={(e) => setHasFixedInternet(e.target.value === 'yes')}
                className="w-full max-w-full truncate px-3.5 py-2.5 bg-card text-foreground border border-border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              >
                <option value="yes">{t.internetYes}</option>
                <option value="no">{t.internetNo}</option>
              </select>
            </div>

            {/* Foreign Resident */}
            <div className="md:col-span-2 min-w-0">
              <label htmlFor="input_foreign" className="block text-sm font-semibold text-foreground mb-1.5">
                {t.foreignLabel}
              </label>
              <select
                id="input_foreign"
                value={isForeignResident ? 'yes' : 'no'}
                onChange={(e) => setIsForeignResident(e.target.value === 'yes')}
                className="w-full max-w-full truncate px-3.5 py-2.5 bg-card text-foreground border border-border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              >
                <option value="yes">{t.foreignYes}</option>
                <option value="no">{t.foreignNo}</option>
              </select>
            </div>
          </div>
        </section>

        {/* Section 2: Statutory Warnings & Alerts */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-500" />
            <h2 className="text-xl font-bold text-foreground">{t.sectionWarnings}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {plan.warnings.map((w) => {
              const isCritical = w.severity === 'critical';
              return (
                <div
                  key={w.id}
                  className={`p-5 rounded-xl border ${
                    isCritical
                      ? 'bg-rose-500/10 border-rose-500/30 dark:bg-rose-950/20'
                      : 'bg-amber-500/10 border-amber-500/30 dark:bg-amber-950/20'
                  } space-y-2`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3
                      className={`font-bold text-sm ${
                        isCritical
                          ? 'text-rose-900 dark:text-rose-200'
                          : 'text-amber-900 dark:text-amber-200'
                      }`}
                    >
                      {lang === 'vi' ? w.titleVi : lang === 'en' ? w.titleEn : w.titleJa}
                    </h3>
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-mono font-bold whitespace-nowrap ${
                        isCritical
                          ? 'bg-rose-500/20 text-rose-800 dark:text-rose-200'
                          : 'bg-amber-500/20 text-amber-800 dark:text-amber-300'
                      }`}
                    >
                      {w.deadlineDate}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-muted-foreground">
                    {lang === 'vi' ? w.lawVi : lang === 'en' ? w.lawEn : w.lawJa}
                  </p>
                  <p className="text-xs leading-relaxed text-foreground/90">
                    {lang === 'vi' ? w.descriptionVi : lang === 'en' ? w.descriptionEn : w.descriptionJa}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section 3: Progress & Stats Dashboard */}
        <section className="bg-surface rounded-xl border border-border p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-xl font-bold text-foreground">{t.sectionStats}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{t.checklistDesc}</p>
            </div>
            <button
              onClick={handleResetChecklist}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground bg-card border border-border rounded-lg transition-colors hover:bg-muted/50 self-start sm:self-auto"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              {t.resetChecklistBtn}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
            <div className="bg-card p-4 rounded-lg border border-border text-center">
              <div className="text-xs text-muted-foreground mb-1">{t.applicableTasks}</div>
              <div className="text-2xl font-bold text-foreground">{stats.applicableCount}</div>
            </div>
            <div className="bg-card p-4 rounded-lg border border-border text-center">
              <div className="text-xs text-muted-foreground mb-1">{t.completedTasks}</div>
              <div className="text-2xl font-bold text-emerald-800 dark:text-emerald-200">
                {stats.completedCount}
              </div>
            </div>
            <div className="bg-card p-4 rounded-lg border border-border text-center">
              <div className="text-xs text-muted-foreground mb-1">{t.urgentRemaining}</div>
              <div
                className={`text-2xl font-bold ${
                  stats.urgentRemaining > 0
                    ? 'text-rose-800 dark:text-rose-300'
                    : 'text-emerald-800 dark:text-emerald-200'
                }`}
              >
                {stats.urgentRemaining}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold text-foreground">
              <span>{t.progressLabel}</span>
              <span>{stats.percent}%</span>
            </div>
            <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300 rounded-full"
                style={{ width: `${stats.percent}%` }}
              />
            </div>
          </div>
        </section>

        {/* Section 4: Action Checklist */}
        <section className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border">
            <div className="flex items-center gap-3">
              <CheckSquare className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-bold text-foreground">{t.sectionChecklist}</h2>
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <select
                value={selectedStageFilter}
                onChange={(e) => setSelectedStageFilter(e.target.value)}
                className="w-full sm:w-auto max-w-full truncate px-2.5 py-1.5 bg-card text-foreground border border-border rounded-md text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary"
                aria-label="Filter by stage"
              >
                <option value="all">{t.filterStageAll}</option>
                {MOVING_STAGES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {lang === 'vi' ? s.nameVi : lang === 'en' ? s.nameEn : s.nameJa}
                  </option>
                ))}
              </select>

              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="w-full sm:w-auto max-w-full truncate px-2.5 py-1.5 bg-card text-foreground border border-border rounded-md text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary"
                aria-label="Filter by category"
              >
                <option value="all">{t.filterCatAll}</option>
                <option value="admin">{t.catAdmin}</option>
                <option value="lifeline">{t.catLifeline}</option>
                <option value="finance">{t.catFinance}</option>
                <option value="packing">{t.catPacking}</option>
                <option value="family">{t.catFamily}</option>
              </select>

              <label
                htmlFor="check_show_pending"
                className="inline-flex items-center gap-1.5 text-xs text-foreground cursor-pointer select-none ml-1 sm:ml-2 whitespace-nowrap"
              >
                <input
                  id="check_show_pending"
                  type="checkbox"
                  checked={showPendingOnly}
                  onChange={(e) => setShowPendingOnly(e.target.checked)}
                  className="rounded text-primary focus:ring-primary h-4 w-4"
                />
                <span>{t.showPendingOnly}</span>
              </label>
            </div>
          </div>

          {/* Task Items List */}
          <div className="space-y-3">
            {visibleTasks.map((task) => {
              const isDone = completedTaskIds.includes(task.id);
              const isUrgent = task.priority === 'urgent';
              const isImportant = task.priority === 'important';

              return (
                <div
                  key={task.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isDone
                      ? 'bg-muted/30 border-border/50 opacity-75'
                      : 'bg-surface border-border hover:border-primary/50 shadow-sm'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    {/* Semantic Accessible Checkbox */}
                    <div className="pt-0.5">
                      <input
                        id={`task_checkbox_${task.id}`}
                        type="checkbox"
                        checked={isDone}
                        onChange={() => handleToggleTask(task.id)}
                        className="w-5 h-5 rounded border-border text-primary focus:ring-primary cursor-pointer transition-colors"
                        aria-label={lang === 'vi' ? task.titleVi : lang === 'en' ? task.titleEn : task.titleJa}
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <label
                          htmlFor={`task_checkbox_${task.id}`}
                          className={`text-sm font-bold cursor-pointer select-none break-words min-w-0 ${
                            isDone ? 'line-through text-muted-foreground' : 'text-foreground'
                          }`}
                        >
                          {lang === 'vi' ? task.titleVi : lang === 'en' ? task.titleEn : task.titleJa}
                        </label>

                        {/* Badges */}
                        <div className="flex items-center gap-1.5">
                          {isUrgent && (
                            <span className="text-[11px] px-2 py-0.5 rounded font-bold bg-rose-500/15 text-rose-800 dark:text-rose-300">
                              {t.priorityUrgent}
                            </span>
                          )}
                          {isImportant && (
                            <span className="text-[11px] px-2 py-0.5 rounded font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300">
                              {t.priorityImportant}
                            </span>
                          )}
                          {task.deadlineDate && (
                            <span className="text-[11px] px-2 py-0.5 rounded font-mono font-medium bg-muted text-foreground">
                              {t.statutoryDeadlinePrefix}
                              {task.deadlineDate}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-foreground/80 leading-relaxed">
                        {lang === 'vi' ? task.descriptionVi : lang === 'en' ? task.descriptionEn : task.descriptionJa}
                      </p>

                      {/* Contextual Custom Note */}
                      {(task.customNoteJa || task.customNoteVi || task.customNoteEn) && (
                        <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20 text-xs text-foreground flex items-start gap-2">
                          <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                          <span>
                            {lang === 'vi'
                              ? task.customNoteVi
                              : lang === 'en'
                              ? task.customNoteEn
                              : task.customNoteJa}
                          </span>
                        </div>
                      )}

                      {/* Required Documents */}
                      {task.requiredDocuments && task.requiredDocuments.length > 0 && (
                        <div className="pt-1 text-xs text-muted-foreground">
                          <span className="font-semibold text-foreground/90">{t.requiredDocsHeading} </span>
                          <span>
                            {task.requiredDocuments
                              .map((doc) => (lang === 'vi' ? doc.nameVi : lang === 'en' ? doc.nameEn : doc.nameJa))
                              .join('、 ')}
                          </span>
                        </div>
                      )}

                      {/* Deep Link to Capability Mini-app */}
                      {task.toolId && (
                        <div className="pt-1.5">
                          <a
                            href={`#/tools/${task.toolId}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-card hover:bg-muted text-foreground border border-border rounded-lg text-xs font-semibold transition-colors shadow-xs"
                          >
                            <span>
                              {task.deepLink
                                ? lang === 'vi'
                                  ? task.deepLink.labelVi
                                  : lang === 'en'
                                  ? task.deepLink.labelEn
                                  : task.deepLink.labelJa
                                : t.openToolBtn}
                            </span>
                            <ExternalLink className="w-3.5 h-3.5 text-primary" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section 5: Timeline Progression */}
        <section className="bg-surface rounded-xl border border-border p-5 sm:p-6 shadow-sm max-w-full overflow-hidden">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
            <Calendar className="w-6 h-6 text-primary shrink-0" />
            <div>
              <h2 className="text-xl font-bold text-foreground">{t.sectionTimeline}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{t.timelineDesc}</p>
            </div>
          </div>

          <div className="relative pl-6 sm:pl-8 border-l-2 border-primary/30 space-y-6 ml-2 sm:ml-4">
            {plan.timeline.map((event, index) => (
              <div key={index} className="relative">
                <div
                  className={`absolute -left-[31px] sm:-left-[39px] top-1.5 w-3.5 h-3.5 rounded-full border-2 bg-surface transition-colors ${
                    event.isCritical ? 'border-primary bg-primary/20' : 'border-muted-foreground bg-muted'
                  }`}
                />
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-muted text-foreground whitespace-nowrap">
                      {event.date}
                    </span>
                    <h3 className="text-sm font-bold text-foreground break-words">
                      {lang === 'vi' ? event.titleVi : lang === 'en' ? event.titleEn : event.titleJa}
                    </h3>
                  </div>
                  <p className="text-xs text-foreground/80 leading-relaxed break-words">
                    {lang === 'vi' ? event.descriptionVi : lang === 'en' ? event.descriptionEn : event.descriptionJa}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 6: Related Dedicated Tools */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-primary" />
            <div>
              <h2 className="text-xl font-bold text-foreground">{t.sectionTools}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{t.toolsDesc}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {plan.relatedTools.map((tool) => (
              <div
                key={tool.toolId}
                className="p-5 rounded-xl bg-surface border border-border shadow-sm flex flex-col justify-between gap-4 hover:border-primary/50 transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-bold text-sm text-foreground">
                      {lang === 'vi' ? tool.titleVi : lang === 'en' ? tool.titleEn : tool.titleJa}
                    </h3>
                    <span className="text-[11px] px-2 py-0.5 rounded font-bold bg-primary/15 text-primary">
                      {lang === 'vi' ? tool.badgeVi : lang === 'en' ? tool.badgeEn : tool.badgeJa}
                    </span>
                  </div>
                  <p className="text-xs text-foreground/80 leading-relaxed">
                    {lang === 'vi'
                      ? tool.descriptionVi
                      : lang === 'en'
                      ? tool.descriptionEn
                      : tool.descriptionJa}
                  </p>
                </div>

                <div>
                  <a
                    href={`#/tools/${tool.toolId}`}
                    className="inline-flex items-center justify-center gap-1.5 w-full py-2 bg-card hover:bg-muted text-foreground border border-border rounded-lg text-xs font-bold transition-colors shadow-xs"
                  >
                    <span>{t.openToolBtn}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-primary" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Primary Regulatory Sources */}
        <section className="pt-4 border-t border-border">
          <RegulatorySourceView sourceKeys={MOVING_WIZARD_SOURCES} lang={lang} />
        </section>
      </div>
    </StandardToolLayout>
  );
}
