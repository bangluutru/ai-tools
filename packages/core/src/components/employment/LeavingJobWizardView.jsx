/**
 * @file packages/core/src/components/employment/LeavingJobWizardView.jsx
 * @description
 * Giao diện Hướng dẫn & Điều phối Thủ tục Nghỉ việc tại Nhật Bản (退職手続きガイド & Orchestrator)
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
  HeartHandshake,
  Receipt,
  UserCheck,
  CheckSquare,
  Sparkles,
  ChevronRight,
  Briefcase
} from 'lucide-react';

import StandardToolLayout from '../shared/StandardToolLayout.jsx';
import RegulatorySourceView from '../regulatory/RegulatorySourceView.jsx';
import {
  generateLeavingJobPlan,
  LEAVING_STAGES,
  HEALTH_INSURANCE_OPTIONS,
  RESIDENT_TAX_RULES,
  LEAVING_JOB_SOURCES
} from '../../japan/employment/index.js';

const TRANSLATIONS = {
  ja: {
    toolTitle: '退職手続きガイド＆オーケストレーター（健康保険・年金・税金・ハローワーク）',
    toolDesc: '民法第627条、労働基準法、健康保険法、国民年金法、地方税法、雇用保険法に基づく退職時の法定スケジュール・ToDoチェックリスト・公的手続きの総合案内です。',
    sectionInput: '1. 退職条件・スケジュールの設定',
    resignationDateLabel: '退職予定日（公式な退職日）',
    resignationDateHint: '※ 会社との合意または退職届に記載する雇用契約終了日を選択してください。',
    separationTypeLabel: '退職の理由・区分',
    sepPersonal: '自己都合退職（転職・独立・個人的休養など）',
    sepCompany: '会社都合退職（倒産・解雇・ハラスメント・過度な残業など）',
    sepContract: '契約満了・雇止め（有期労働契約の終了）',
    healthPrefLabel: '退職後の健康保険の希望',
    healthUndecided: '未定（アドバイス・試算を見て決める）',
    healthVoluntary: '任意継続（前職の健康保険を個人で最大2年間継続）',
    healthNhi: '国民健康保険（市区町村窓口で国保へ加入）',
    healthDependent: '家族の扶養に入る（被扶養者認定・保険料0円）',
    newJobCheckLabel: 'すでに転職先が決まっており、退職後ブランクなしで即日入社しますか？',
    newJobCheckHint: '※ 即日入社の場合、市区町村窓口での国保・国民年金やハローワークの手続きは不要です。',
    incomeLabel: '退職後の年収見込み（扶養判定・税金用）',
    incomeHint: '※ 今後1年間の見込み収入を入力（130万円未満で家族の扶養に入れる可能性があります）。',
    leaveDaysLabel: '残っている年次有給休暇の日数',
    leaveDaysHint: '※ 退職日までに消化すべき未取得の有給休暇日数（消滅防止）。',
    yenUnit: '円',
    daysUnit: '日',
    sectionDeadlines: '2. 重要な法定期限・アラート',
    deadlineNoticeTitle: '退職申出リミット（民法627条）',
    deadlineNoticeSub: '退職日の2週間前まで',
    deadlineHealthTitle: '健康保険切り替え期限',
    deadlineHealthSub: '任意継続20日 / 国保14日',
    deadlinePensionTitle: '国民年金種別変更期限',
    deadlinePensionSub: '退職日の翌日から14日以内',
    deadlineTaxTitle: '住民税の徴収方式',
    sectionChecklist: '3. 退職手続き ToDo チェックリスト',
    checklistDesc: '完了した項目をチェックして進捗を記録できます（ブラウザに自動保存されます）。',
    progressLabel: 'チェックリスト達成率',
    filterAll: 'すべて',
    filterBefore: '退職前',
    filterLastDay: '最終出社日',
    filterAfter: '退職後',
    priorityUrgent: '必須・期限厳守',
    priorityImportant: '重要',
    priorityRecommended: '推奨',
    requiredDocsHeading: '必要書類・持ち物：',
    sectionTimeline: '4. 退職進行タイムライン',
    timelineDesc: '退職準備から退職後までの主要な手続きマイルストーン一覧です。',
    sectionDeepDives: '5. 各種制度の詳しい解説とアドバイス',
    healthAdviceTitle: '健康保険3つの選択肢の比較と推奨',
    taxAdviceTitle: '住民税の一括徴収と確定申告（所得税還付）',
    sectionTools: '6. 連携ツール・シミュレーター',
    toolsDesc: '各手続きの具体的な計算や受給資格判定は以下の専用ツールをご活用ください。',
    openToolBtn: 'ツールを開く',
    regulatorySectionTitle: '参照法令・公的情報源（Primary Regulatory Sources）'
  },
  vi: {
    toolTitle: 'Hướng Dẫn Toàn Diện Thủ Tục Nghỉ Việc Tại Nhật (退職手続きガイド)',
    toolDesc: 'Căn cứ Điều 627 Luật Dân sự, Luật Tiêu chuẩn Lao động, Luật BHYT, Luật Lương hưu, Luật Thuế Địa phương & Luật BHTN: Lập tiến trình, lịch biểu hạn chót và danh mục việc cần làm (ToDo Checklist).',
    sectionInput: '1. Thiết lập ngày nghỉ việc & điều kiện cá nhân',
    resignationDateLabel: 'Ngày dự định nghỉ việc chính thức (Ngày chấm dứt HĐLĐ)',
    resignationDateHint: '※ Chọn ngày chính thức ghi trên đơn xin thôi việc hoặc thỏa thuận với công ty.',
    separationTypeLabel: 'Lý do thôi việc',
    sepPersonal: 'Tự ý nghỉ việc (Chuyển việc, về nước, khởi nghiệp, lý do cá nhân)',
    sepCompany: 'Lỗi công ty (Phá sản, sa thải, quấy rối, bắt tăng ca quá mức)',
    sepContract: 'Hết hạn hợp đồng không tái ký (Hợp đồng có thời hạn)',
    healthPrefLabel: 'Dự định về Bảo hiểm Y tế sau khi thôi việc',
    healthUndecided: 'Chưa quyết định (Xem gợi ý so sánh để lựa chọn)',
    healthVoluntary: 'Tiếp tục tự nguyện BHYT công ty cũ (任意継続 - Tối đa 2 năm)',
    healthNhi: 'Chuyển sang BHYT Quốc dân (国民健康保険 tại Ủy ban quận/thị xã)',
    healthDependent: 'Vào phụ thuộc BHYT người thân (Miễn phí 0 yên)',
    newJobCheckLabel: 'Đã có việc làm tiếp theo ngay và đi làm công ty mới không bị gián đoạn ngày nào?',
    newJobCheckHint: '※ Nếu đi làm ngay, công ty mới sẽ tiếp nối BHYT & Lương hưu, bạn không cần ra ủy ban quận.',
    incomeLabel: 'Thu nhập kỳ vọng trong năm tới (Để xét phụ thuộc & thuế)',
    incomeHint: '※ Nhập thu nhập ước tính trong 12 tháng tới (dưới 1,3 triệu yên/năm có thể vào phụ thuộc).',
    leaveDaysLabel: 'Số ngày phép năm còn lại chưa nghỉ',
    leaveDaysHint: '※ Phép năm sẽ mất hiệu lực sau ngày thôi việc, cần lên lịch nghỉ hết.',
    yenUnit: 'yên',
    daysUnit: 'ngày',
    sectionDeadlines: '2. Các hạn chót luật định & Cảnh báo bắt buộc',
    deadlineNoticeTitle: 'Hạn chót báo nghỉ (Điều 627 Dân luật)',
    deadlineNoticeSub: 'Tối thiểu 14 ngày trước ngày nghỉ',
    deadlineHealthTitle: 'Hạn chót chuyển đổi BHYT',
    deadlineHealthSub: 'Tự nguyện 20 ngày / Quốc dân 14 ngày',
    deadlinePensionTitle: 'Hạn chót chuyển Lương hưu Quốc dân',
    deadlinePensionSub: 'Trong vòng 14 ngày kể từ ngày nghỉ',
    deadlineTaxTitle: 'Quy tắc khấu trừ Thuế cư trú',
    sectionChecklist: '3. Danh mục công việc cần làm (ToDo Checklist)',
    checklistDesc: 'Đánh dấu vào các việc đã hoàn thành để theo dõi tiến độ (lưu tự động vào trình duyệt).',
    progressLabel: 'Tiến độ hoàn thành',
    filterAll: 'Tất cả',
    filterBefore: 'Trước khi nghỉ',
    filterLastDay: 'Ngày cuối',
    filterAfter: 'Sau khi nghỉ',
    priorityUrgent: 'Bắt buộc - Gấp',
    priorityImportant: 'Quan trọng',
    priorityRecommended: 'Khuyên làm',
    requiredDocsHeading: 'Giấy tờ cần chuẩn bị / nhận về:',
    sectionTimeline: '4. Lịch trình tiến trình nghỉ việc',
    timelineDesc: 'Các mốc thời gian thực hiện từ chuẩn bị đến sau khi hoàn tất thủ tục.',
    sectionDeepDives: '5. Hướng dẫn chi tiết các chế độ pháp lý',
    healthAdviceTitle: 'So sánh & Lựa chọn 3 phương án Bảo hiểm Y tế',
    taxAdviceTitle: 'Khấu trừ Thuế cư trú một cục & Quyết toán thuế cuối năm (Hoàn thuế)',
    sectionTools: '6. Hệ thống công cụ liên quan',
    toolsDesc: 'Sử dụng các công cụ tính toán chuyên biệt dưới đây để bổ trợ cho từng bước thủ tục.',
    openToolBtn: 'Mở công cụ',
    regulatorySectionTitle: 'Căn cứ Pháp điển & Nguồn Chính thức (Primary Regulatory Sources)'
  },
  en: {
    toolTitle: 'Japan Leaving Job Wizard & Orchestrator (退職手続きガイド)',
    toolDesc: 'Comprehensive statutory workflow and checklist based on Civil Code Art. 627, Labor Standards Act, Health Insurance Act, National Pension Act, Local Tax Act, and Employment Insurance Act.',
    sectionInput: '1. Set Resignation Conditions & Schedule',
    resignationDateLabel: 'Official Resignation Date',
    resignationDateHint: '※ Select the agreed employment termination date.',
    separationTypeLabel: 'Reason for Separation',
    sepPersonal: 'Personal voluntary resignation (New job, break, business)',
    sepCompany: 'Involuntary company cause (Bankruptcy, dismissal, harassment)',
    sepContract: 'Contract expiration / non-renewal',
    healthPrefLabel: 'Health Insurance Plan After Resignation',
    healthUndecided: 'Undecided (View recommendation)',
    healthVoluntary: 'Voluntary Continuation of previous health insurance (up to 2 years)',
    healthNhi: 'National Health Insurance (Municipal Office)',
    healthDependent: 'Join Family Dependent Health Insurance (0 JPY premium)',
    newJobCheckLabel: 'Already secured next employment starting immediately without gaps?',
    newJobCheckHint: '※ If starting immediately, your new employer will handle health & pension enrollment.',
    incomeLabel: 'Expected annual income after resignation',
    incomeHint: '※ Enter projected annual income (< 1.3M JPY may qualify for dependent coverage).',
    leaveDaysLabel: 'Remaining unused paid leave days',
    leaveDaysHint: '※ Unused paid leave expires upon resignation. Plan to consume them fully.',
    yenUnit: 'JPY',
    daysUnit: 'days',
    sectionDeadlines: '2. Critical Statutory Deadlines & Alerts',
    deadlineNoticeTitle: 'Notice Deadline (Civil Code 627)',
    deadlineNoticeSub: 'At least 14 days prior to resignation',
    deadlineHealthTitle: 'Health Insurance Switch Deadline',
    deadlineHealthSub: '20 days for Voluntary / 14 days for NHI',
    deadlinePensionTitle: 'National Pension Switch Deadline',
    deadlinePensionSub: 'Within 14 days from day after resignation',
    deadlineTaxTitle: 'Resident Tax Collection Method',
    sectionChecklist: '3. Resignation ToDo Checklist',
    checklistDesc: 'Check items as you complete them to track progress (persisted locally in browser).',
    progressLabel: 'Checklist Progress',
    filterAll: 'All',
    filterBefore: 'Before Resignation',
    filterLastDay: 'Last Day',
    filterAfter: 'After Resignation',
    priorityUrgent: 'Urgent',
    priorityImportant: 'Important',
    priorityRecommended: 'Recommended',
    requiredDocsHeading: 'Required Documents / Items:',
    sectionTimeline: '4. Resignation Timeline',
    timelineDesc: 'Chronological roadmap of all legal and procedural milestones.',
    sectionDeepDives: '5. Statutory Guides & Expert Advice',
    healthAdviceTitle: 'Comparison & Recommendation of 3 Health Insurance Paths',
    taxAdviceTitle: 'Resident Tax Lump-Sum Deduction & Income Tax Refund Filing',
    sectionTools: '6. Connected Specialized Tools',
    toolsDesc: 'Explore specialized simulators to calculate exact figures for each step.',
    openToolBtn: 'Open Tool',
    regulatorySectionTitle: 'Statutory References & Primary Regulatory Sources'
  }
};

const STORAGE_KEY = 'toolio_leaving_job_checklist_v1';

export default function LeavingJobWizardView({ lang = 'ja' }) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.ja;

  // Form State
  const defaultDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30); // 30 days ahead by default
    return d.toISOString().split('T')[0];
  }, []);

  const [resignationDate, setResignationDate] = useState(defaultDate);
  const [separationType, setSeparationType] = useState('personal');
  const [healthPreference, setHealthPreference] = useState('undecided');
  const [hasNewJobImmediately, setHasNewJobImmediately] = useState(false);
  const [annualExpectedIncome, setAnnualExpectedIncome] = useState(0);
  const [remainingPaidLeaveDays, setRemainingPaidLeaveDays] = useState(10);
  const [stageFilter, setStageFilter] = useState('all');

  // Checklist completion states persisted in localStorage
  const [completedItems, setCompletedItems] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(completedItems));
    } catch (e) {
      console.warn('Failed to persist checklist items to localStorage', e);
    }
  }, [completedItems]);

  const toggleItem = (itemId) => {
    setCompletedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  // Run leaving job wizard engine
  const plan = useMemo(() => {
    return generateLeavingJobPlan({
      resignationDate,
      separationType,
      healthInsurancePreference: healthPreference,
      hasNewJobImmediately,
      annualExpectedIncome,
      remainingPaidLeaveDays
    });
  }, [resignationDate, separationType, healthPreference, hasNewJobImmediately, annualExpectedIncome, remainingPaidLeaveDays]);

  // Filter checklist
  const filteredChecklist = useMemo(() => {
    return plan.checklist.filter((item) => {
      if (stageFilter === 'all') return true;
      return item.stage === stageFilter;
    });
  }, [plan.checklist, stageFilter]);

  // Checklist completion statistics
  const applicableItems = useMemo(() => plan.checklist.filter((i) => i.isApplicable), [plan.checklist]);
  const completedCount = useMemo(() => {
    return applicableItems.filter((i) => completedItems[i.id]).length;
  }, [applicableItems, completedItems]);
  const progressPercent = applicableItems.length > 0 ? Math.round((completedCount / applicableItems.length) * 100) : 0;

  return (
    <StandardToolLayout
      title={t.toolTitle}
      description={t.toolDesc}
      lang={lang}
      maxWidth="max-w-[1240px]"
    >
      <div className="space-y-10">

        {/* SECTION 1: CẤU HÌNH THỜI GIAN & ĐIỀU KIỆN */}
        <section className="bg-surface rounded-2xl p-6 sm:p-8 border border-border/80 shadow-sm space-y-6 max-w-full overflow-hidden">
          <div className="flex items-center gap-3 border-b border-border/60 pb-4">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">{t.sectionInput}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {lang === 'ja'
                  ? '退職条件に応じて、法定スケジュールと ToDo が動的に最適化されます'
                  : lang === 'vi'
                  ? 'Tiến trình luật định và danh mục việc cần làm sẽ tự động thích ứng với ngày nghỉ của bạn'
                  : 'Statutory schedule and ToDo tasks automatically adapt to your resignation details'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Resignation Date */}
            <div className="space-y-2">
              <label htmlFor="resignation-date" className="block text-sm font-semibold text-foreground">
                {t.resignationDateLabel}
              </label>
              <input
                id="resignation-date"
                type="date"
                value={resignationDate}
                onChange={(e) => setResignationDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-foreground font-medium focus:ring-2 focus:ring-primary focus:outline-none"
              />
              <p className="text-xs text-muted-foreground">{t.resignationDateHint}</p>
            </div>

            {/* Separation Type */}
            <div className="space-y-2">
              <label htmlFor="separation-type" className="block text-sm font-semibold text-foreground">
                {t.separationTypeLabel}
              </label>
              <select
                id="separation-type"
                value={separationType}
                onChange={(e) => setSeparationType(e.target.value)}
                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-foreground font-medium focus:ring-2 focus:ring-primary focus:outline-none"
              >
                <option value="personal">{t.sepPersonal}</option>
                <option value="company">{t.sepCompany}</option>
                <option value="contract_expiry">{t.sepContract}</option>
              </select>
              <p className="text-xs text-muted-foreground">
                {separationType === 'company'
                  ? (lang === 'ja' ? '※ 会社都合退職は国保保険料の軽減措置対象です。' : '※ Thôi việc do công ty được hưởng giảm phí BHYT Quốc dân đến 70%.')
                  : (lang === 'ja' ? '※ 自己都合退職はハローワーク給付制限等の確認が必要です。' : '※ Tự thôi việc cần lưu ý thời gian hạn chế chi trả BHTN.')}
              </p>
            </div>

            {/* Health Preference */}
            <div className="space-y-2">
              <label htmlFor="health-pref" className="block text-sm font-semibold text-foreground">
                {t.healthPrefLabel}
              </label>
              <select
                id="health-pref"
                value={healthPreference}
                onChange={(e) => setHealthPreference(e.target.value)}
                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-foreground font-medium focus:ring-2 focus:ring-primary focus:outline-none"
              >
                <option value="undecided">{t.healthUndecided}</option>
                <option value="voluntary_continuation">{t.healthVoluntary}</option>
                <option value="national_health_insurance">{t.healthNhi}</option>
                <option value="dependent">{t.healthDependent}</option>
              </select>
              <p className="text-xs text-muted-foreground">
                {lang === 'ja' ? '※ 任意継続は退職後20日以内必着。国保は14日以内です。' : '※ Tiếp tục tự nguyện nộp trong 20 ngày; BHYT Quốc dân trong 14 ngày.'}
              </p>
            </div>

            {/* Remaining Paid Leave Days */}
            <div className="space-y-2">
              <label htmlFor="leave-days" className="block text-sm font-semibold text-foreground">
                {t.leaveDaysLabel}
              </label>
              <div className="relative">
                <input
                  id="leave-days"
                  type="number"
                  min="0"
                  max="60"
                  value={remainingPaidLeaveDays}
                  onChange={(e) => setRemainingPaidLeaveDays(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-foreground font-medium focus:ring-2 focus:ring-primary focus:outline-none pr-12"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  {t.daysUnit}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{t.leaveDaysHint}</p>
            </div>

            {/* Annual Expected Income */}
            <div className="space-y-2">
              <label htmlFor="expected-income" className="block text-sm font-semibold text-foreground">
                {t.incomeLabel}
              </label>
              <div className="relative">
                <input
                  id="expected-income"
                  type="number"
                  step="100000"
                  min="0"
                  value={annualExpectedIncome}
                  onChange={(e) => setAnnualExpectedIncome(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-foreground font-medium focus:ring-2 focus:ring-primary focus:outline-none pr-12"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  {t.yenUnit}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{t.incomeHint}</p>
            </div>

            {/* New Job Immediately Checkbox */}
            <div className="space-y-2 flex flex-col justify-end">
              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-border/80 bg-background/60 hover:bg-background cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={hasNewJobImmediately}
                  onChange={(e) => setHasNewJobImmediately(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded text-primary focus:ring-primary border-border"
                />
                <div>
                  <span className="text-sm font-semibold text-foreground block">
                    {t.newJobCheckLabel}
                  </span>
                  <span className="text-xs text-muted-foreground block mt-0.5">
                    {t.newJobCheckHint}
                  </span>
                </div>
              </label>
            </div>
          </div>
        </section>

        {/* SECTION 2: CÁC HẠN CHÓT LUẬT ĐỊNH & CẢNH BÁO */}
        <section className="space-y-4 max-w-full overflow-hidden">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">{t.sectionDeadlines}</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Notice deadline */}
            <div className="bg-surface rounded-xl p-5 border border-border shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300 inline-block mb-2">
                  {lang === 'ja' ? '民法第627条' : 'Dân luật Đ627'}
                </span>
                <h3 className="text-sm font-bold text-foreground">{t.deadlineNoticeTitle}</h3>
                <p className="text-xs text-muted-foreground mt-1">{t.deadlineNoticeSub}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-border/60 flex items-baseline justify-between">
                <span className="text-xs text-muted-foreground">{lang === 'ja' ? '申入期日' : 'Hạn chót'}</span>
                <span className="text-base font-bold text-primary">{plan.statutoryDeadlines.civilCodeNoticeDate}</span>
              </div>
            </div>

            {/* Health insurance deadline */}
            <div className="bg-surface rounded-xl p-5 border border-border shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 inline-block mb-2">
                  {lang === 'ja' ? '健保法・国保法' : 'Luật BHYT'}
                </span>
                <h3 className="text-sm font-bold text-foreground">{t.deadlineHealthTitle}</h3>
                <p className="text-xs text-muted-foreground mt-1">{t.deadlineHealthSub}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-border/60 flex items-baseline justify-between">
                <span className="text-xs text-muted-foreground">{lang === 'ja' ? '任意継続期限' : 'Hạn tự nguyện'}</span>
                <span className="text-base font-bold text-emerald-700 dark:text-emerald-400">
                  {plan.statutoryDeadlines.voluntaryContinuationDeadline}
                </span>
              </div>
            </div>

            {/* National Pension deadline */}
            <div className="bg-surface rounded-xl p-5 border border-border shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-500/15 text-purple-700 dark:text-purple-300 inline-block mb-2">
                  {lang === 'ja' ? '国民年金法' : 'Luật Lương hưu'}
                </span>
                <h3 className="text-sm font-bold text-foreground">{t.deadlinePensionTitle}</h3>
                <p className="text-xs text-muted-foreground mt-1">{t.deadlinePensionSub}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-border/60 flex items-baseline justify-between">
                <span className="text-xs text-muted-foreground">{lang === 'ja' ? '市役所届出' : 'Hạn nộp ủy ban'}</span>
                <span className="text-base font-bold text-purple-700 dark:text-purple-300">
                  {plan.statutoryDeadlines.municipalProceduresDeadline}
                </span>
              </div>
            </div>

            {/* Resident tax rule */}
            <div className="bg-surface rounded-xl p-5 border border-border shadow-sm flex flex-col justify-between">
              <div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full inline-block mb-2 ${
                  plan.residentTaxRule.isMandatoryLumpSum
                    ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300'
                    : 'bg-teal-500/15 text-teal-800 dark:text-teal-300'
                }`}>
                  {lang === 'ja' ? '地方税法第321条' : 'Luật Thuế Đ321'}
                </span>
                <h3 className="text-sm font-bold text-foreground">{t.deadlineTaxTitle}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {lang === 'ja' ? plan.residentTaxRule.nameJa : lang === 'vi' ? plan.residentTaxRule.nameVi : plan.residentTaxRule.nameEn}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-border/60 flex items-baseline justify-between">
                <span className="text-xs text-muted-foreground">{lang === 'ja' ? '方式' : 'Hình thức'}</span>
                <span className={`text-sm font-bold ${
                  plan.residentTaxRule.isMandatoryLumpSum ? 'text-amber-800 dark:text-amber-300' : 'text-teal-800 dark:text-teal-300'
                }`}>
                  {plan.residentTaxRule.isMandatoryLumpSum
                    ? (lang === 'ja' ? '一括徴収（原則義務）' : 'Trừ một cục lương cuối')
                    : (lang === 'ja' ? '普通徴収へ切替' : 'Tự nộp 4 kỳ')}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: CHECKLIST CÔNG VIỆC CẦN LÀM (TODO CHECKLIST) */}
        <section className="bg-surface rounded-2xl p-6 sm:p-8 border border-border shadow-sm space-y-6 max-w-full overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold text-foreground">{t.sectionChecklist}</h2>
              </div>
              <p className="text-xs text-muted-foreground">{t.checklistDesc}</p>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-background rounded-xl border border-border/80">
              {[
                { id: 'all', label: t.filterAll },
                { id: 'before_resignation', label: t.filterBefore },
                { id: 'last_day', label: t.filterLastDay },
                { id: 'after_resignation', label: t.filterAfter },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStageFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    stageFilter === tab.id
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2 bg-background/50 p-4 rounded-xl border border-border/60">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-primary" />
                {t.progressLabel}
              </span>
              <span className="font-bold text-primary">
                {completedCount} / {applicableItems.length} ({progressPercent}%)
              </span>
            </div>
            <div className="w-full bg-border rounded-full h-2 overflow-hidden">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Checklist Items List */}
          <div className="space-y-4">
            {filteredChecklist.map((item) => {
              const isChecked = Boolean(completedItems[item.id]);
              const title = lang === 'ja' ? item.titleJa : lang === 'vi' ? item.titleVi : item.titleEn;
              const desc = lang === 'ja' ? item.descriptionJa : lang === 'vi' ? item.descriptionVi : item.descriptionEn;
              const note = lang === 'ja' ? item.customNoteJa : lang === 'vi' ? item.customNoteVi : item.customNoteEn;
              const docs = lang === 'ja' ? item.requiredDocsJa : lang === 'vi' ? item.requiredDocsVi : item.requiredDocsEn;

              return (
                <div
                  key={item.id}
                  className={`p-5 rounded-xl border transition-all ${
                    !item.isApplicable
                      ? 'bg-muted/40 border-dashed border-border/80 opacity-60'
                      : isChecked
                      ? 'bg-emerald-500/5 border-emerald-500/30'
                      : 'bg-background border-border hover:border-primary/40'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    {/* Checkbox */}
                    <button
                      type="button"
                      disabled={!item.isApplicable}
                      onClick={() => toggleItem(item.id)}
                      className={`mt-1 flex-shrink-0 transition-transform active:scale-90 ${
                        !item.isApplicable ? 'cursor-not-allowed text-muted-foreground' : 'cursor-pointer'
                      }`}
                      aria-label={`Toggle ${title}`}
                    >
                      {isChecked ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-700 dark:text-emerald-400 fill-emerald-500/20" />
                      ) : (
                        <Circle className="w-6 h-6 text-muted-foreground hover:text-primary" />
                      )}
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Priority Badge */}
                        <span
                          className={`text-2xs uppercase tracking-wider font-bold px-2 py-0.5 rounded-md ${
                            item.priority === 'urgent'
                              ? 'bg-red-500/15 text-red-700 dark:text-red-300'
                              : item.priority === 'important'
                              ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300'
                              : 'bg-blue-500/15 text-blue-700 dark:text-blue-300'
                          }`}
                        >
                          {item.priority === 'urgent'
                            ? t.priorityUrgent
                            : item.priority === 'important'
                            ? t.priorityImportant
                            : t.priorityRecommended}
                        </span>

                        {/* Deadline Tag if available */}
                        {item.deadlineDate && (
                          <span className="text-2xs font-semibold px-2 py-0.5 rounded-md bg-border/60 text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {item.deadlineDate}
                          </span>
                        )}
                      </div>

                      <h3 className={`text-base font-bold text-foreground leading-snug ${isChecked ? 'line-through text-muted-foreground' : ''}`}>
                        {title}
                      </h3>

                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {desc}
                      </p>

                      {/* Custom context note if present */}
                      {note && (
                        <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/20 text-xs font-medium text-primary flex items-start gap-2">
                          <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <span>{note}</span>
                        </div>
                      )}

                      {/* Required Documents / Items */}
                      {docs && docs.length > 0 && (
                        <div className="pt-2 border-t border-border/40">
                          <span className="text-2xs font-bold text-muted-foreground block mb-1">
                            {t.requiredDocsHeading}
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {docs.map((d, idx) => (
                              <span
                                key={idx}
                                className="text-2xs px-2.5 py-1 rounded-md bg-surface border border-border/60 text-foreground"
                              >
                                {d}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action Deep-link Button */}
                      {item.deepLink && item.isApplicable && (
                        <div className="pt-2">
                          <a
                            href={`#/tools/${item.deepLink.toolId}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold transition-colors"
                          >
                            <span>
                              {lang === 'ja' ? item.deepLink.labelJa : lang === 'vi' ? item.deepLink.labelVi : item.deepLink.labelEn}
                            </span>
                            <ArrowRight className="w-3.5 h-3.5" />
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

        {/* SECTION 4: TRỤC THỜI GIAN TIẾN TRÌNH (TIMELINE) */}
        <section className="bg-surface rounded-2xl p-6 sm:p-8 border border-border shadow-sm space-y-6 max-w-full overflow-hidden">
          <div className="flex items-center gap-2 border-b border-border/60 pb-4">
            <Clock className="w-5 h-5 text-primary" />
            <div>
              <h2 className="text-lg font-bold text-foreground">{t.sectionTimeline}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{t.timelineDesc}</p>
            </div>
          </div>

          <div className="relative pl-6 sm:pl-8 border-l-2 border-primary/30 space-y-6">
            {plan.timeline.map((step, idx) => (
              <div key={idx} className="relative">
                {/* Timeline Dot */}
                <div
                  className={`absolute -left-[31px] sm:-left-[39px] top-1.5 w-4 h-4 rounded-full border-2 bg-background ${
                    step.isCritical ? 'border-red-500 bg-red-500/20' : 'border-primary bg-primary/20'
                  }`}
                />

                <div className="bg-background p-4 rounded-xl border border-border/80 space-y-1 hover:border-primary/40 transition-colors">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-primary font-mono bg-primary/10 px-2 py-0.5 rounded-md">
                      {step.date}
                    </span>
                    {step.isCritical && (
                      <span className="text-2xs font-bold text-red-700 dark:text-red-300 bg-red-500/15 px-2 py-0.5 rounded-md">
                        {lang === 'ja' ? '期限厳守' : 'Hạn chót luật định'}
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-foreground pt-1">
                    {lang === 'ja' ? step.titleJa : lang === 'vi' ? step.titleVi : step.titleEn}
                  </h3>

                  <p className="text-xs text-muted-foreground">
                    {lang === 'ja' ? step.descriptionJa : step.descriptionVi}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 5: HƯỚNG DẪN CHUYÊN SÂU CÁC CHẾ ĐỘ PHÁP LÝ */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-full overflow-hidden">
          {/* Health insurance guide */}
          <div className="bg-surface rounded-2xl p-6 sm:p-8 border border-border shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 border-b border-border/60 pb-3">
              <HeartHandshake className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
              <h3 className="text-base font-bold text-foreground">{t.healthAdviceTitle}</h3>
            </div>

            {/* Recommendation Alert */}
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300">
                <Sparkles className="w-4 h-4" />
                <span>{lang === 'ja' ? 'AI 推奨アドバイス' : 'Đề xuất phù hợp nhất:'}</span>
              </div>
              <p className="text-foreground leading-relaxed">
                {lang === 'ja'
                  ? plan.healthInsuranceAdvice.recommendationReasonJa
                  : lang === 'vi'
                  ? plan.healthInsuranceAdvice.recommendationReasonVi
                  : plan.healthInsuranceAdvice.recommendationReasonEn}
              </p>
            </div>

            <div className="space-y-3 pt-2">
              {Object.values(HEALTH_INSURANCE_OPTIONS).map((opt) => (
                <div key={opt.id} className="p-3.5 rounded-xl bg-background border border-border/70 space-y-1 text-xs">
                  <div className="flex items-center justify-between font-bold text-foreground">
                    <span>{lang === 'ja' ? opt.nameJa : lang === 'vi' ? opt.nameVi : opt.nameEn}</span>
                    <span className="text-2xs font-semibold px-2 py-0.5 rounded-md bg-border/60 text-muted-foreground">
                      {lang === 'ja' ? opt.deadlineDescriptionJa : opt.deadlineDescriptionVi}
                    </span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    {lang === 'ja' ? opt.notesJa : opt.notesVi}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Resident tax & Kakutei shinkoku guide */}
          <div className="bg-surface rounded-2xl p-6 sm:p-8 border border-border shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 border-b border-border/60 pb-3">
              <Receipt className="w-5 h-5 text-amber-700 dark:text-amber-400" />
              <h3 className="text-base font-bold text-foreground">{t.taxAdviceTitle}</h3>
            </div>

            {/* Resident tax explanation */}
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-1.5">
              <span className="font-bold text-amber-800 dark:text-amber-300 block">
                {lang === 'ja' ? plan.residentTaxRule.nameJa : lang === 'vi' ? plan.residentTaxRule.nameVi : plan.residentTaxRule.nameEn}
              </span>
              <p className="text-foreground leading-relaxed">
                {lang === 'ja' ? plan.residentTaxRule.descriptionJa : plan.residentTaxRule.descriptionVi}
              </p>
            </div>

            {/* Income Tax Kakutei Shinkoku */}
            <div className="p-4 rounded-xl bg-background border border-border space-y-2 text-xs">
              <h4 className="font-bold text-foreground flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-primary" />
                {lang === 'ja' ? '確定申告での所得税還付（翌年2月16日〜3月15日）' : 'Hoàn thuế Thu nhập cá nhân (確定申告)'}
              </h4>
              <p className="text-muted-foreground leading-relaxed">
                {lang === 'ja'
                  ? '年の途中で退職し年末時点で再就職していない場合、毎月の給与から源泉徴収されていた所得税は「1年間働き続けた前提」で引かれているため、確定申告をすることで納めすぎた税金が還付金として戻ってくる可能性が極めて高いです。'
                  : 'Nếu nghỉ việc giữa năm và chưa đi làm lại trước 31/12, các tháng trước bạn bị trừ thuế giả định làm đủ 12 tháng. Khi nộp tờ khai 確定申告 vào tháng 2-3 năm sau, bạn gần như chắc chắn được nhận lại tiền hoàn thuế.'}
              </p>
              <div className="pt-2">
                <a
                  href="#/tools/japan-tax-simulator"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                >
                  <span>{lang === 'ja' ? '日本税金シミュレーターで還付見込みを試算' : 'Tính số tiền hoàn thuế với Japan Tax Simulator'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 6: DANH MỤC CÔNG CỤ LIÊN QUAN (CAPABILITY MATRIX) */}
        <section className="bg-surface rounded-2xl p-6 sm:p-8 border border-border shadow-sm space-y-6 max-w-full overflow-hidden">
          <div className="flex items-center gap-2 border-b border-border/60 pb-4">
            <Compass className="w-5 h-5 text-primary" />
            <div>
              <h2 className="text-lg font-bold text-foreground">{t.sectionTools}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{t.toolsDesc}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {plan.deepLinks.map((tool) => (
              <a
                key={tool.toolId}
                href={`#/tools/${tool.toolId}`}
                className="group p-4 rounded-xl bg-background border border-border hover:border-primary hover:shadow-md transition-all flex flex-col justify-between space-y-3"
              >
                <div className="space-y-1.5">
                  <span className="text-2xs font-bold px-2 py-0.5 rounded bg-primary/10 text-primary inline-block">
                    {lang === 'ja' ? tool.badgeJa : lang === 'vi' ? tool.badgeVi : tool.badgeEn}
                  </span>
                  <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                    {lang === 'ja' ? tool.titleJa : lang === 'vi' ? tool.titleVi : tool.titleEn}
                  </h3>
                </div>

                <div className="flex items-center justify-between text-xs text-primary font-semibold pt-2 border-t border-border/40">
                  <span>{t.openToolBtn}</span>
                  <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* SECTION 7: NGUỒN PHÁP ĐIỂN CHÍNH THỨC */}
        <section className="space-y-4 max-w-full overflow-hidden">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">{t.regulatorySectionTitle}</h2>
          </div>
          <RegulatorySourceView sourceIds={LEAVING_JOB_SOURCES} lang={lang} />
        </section>

      </div>
    </StandardToolLayout>
  );
}
