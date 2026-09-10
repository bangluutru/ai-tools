/**
 * @file packages/core/src/components/immigration/WorkScopeCheckerView.jsx
 * @description
 * Giao diện Kiểm tra Phạm vi Làm việc theo Tư cách Lưu trú (在留資格・就労範囲チェッカー).
 * 
 * Căn cứ pháp lý:
 * - 出入国管理及び難民認定法第19条（活動の範囲及び資格外活動許可）
 * - 出入国管理及び難民認定法 別表第一・別表第二
 * - 資格外活動許可の包括許可・個別許可基準（週28時間制限・風俗営業禁止）
 * 
 * Tuân thủ nghiêm ngặt MAIS:
 * - StandardToolLayout 1240px, Design Tokens (Theme-aware Dark/Light)
 * - 100% Trilingual (JA / VI / EN)
 * - Discretion Safety: Không hứa hẹn pháp lý, bài xích khẳng định chắc chắn 100%
 */

import React, { useState, useMemo } from 'react';
import {
  Briefcase,
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  Clock,
  Building,
  CheckCircle2,
  XCircle,
  FileText,
  ChevronRight,
  ExternalLink,
  Scale,
  Sparkles,
  Info,
  AlertOctagon,
  ArrowRight,
} from 'lucide-react';

import StandardToolLayout from '../shared/StandardToolLayout.jsx';
import RegulatorySourceView from '../regulatory/RegulatorySourceView.jsx';

import {
  getStatusDefinition,
  getStatusOptionsGrouped,
  ACTIVITY_CATEGORIES,
  evaluateWorkScope,
  WORK_SCOPE_RULE_METADATA,
} from '../../japan/immigration/index.js';

const IMMIGRATION_SOURCES_M1 = [
  'isa-ica-annexed-table-1',
  'isa-ica-annexed-table-2',
  'isa-ica-art19-work-scope',
  'isa-extra-activity-perm',
];

const TRANSLATIONS = {
  ja: {
    toolTitle: '在留資格・就労範囲チェッカー（職種適合性・資格外活動・週28時間判定）',
    toolDesc: '出入国在留管理庁（入管）の公表基準に基づき、お持ちの在留資格と予定される業務内容が法的に適合しているか、資格外活動許可の要否や就労可能時間を整理・確認します。',
    sectionInput: '1. 現在の在留資格と予定する就労条件',
    statusLabel: '現在の在留資格（在留カード記載）',
    statusHelp: '在留カード表面の「在留資格」欄に記載された正式名称を選択してください。',
    activityCategoryLabel: '従事予定の業務・職種区分',
    activityCategoryHelp: '実際に行う予定の主な仕事内容に最も近い区分を選択してください。',
    employmentTypeLabel: '雇用形態',
    empFullTime: '正社員・フルタイム契約社員',
    empPartTime: 'パート・アルバイト',
    empContract: '業務委託・フリーランス',
    empSelfEmployed: '会社役員・個人事業主（経営）',
    jobDescLabel: '具体的な仕事内容・会社での役割（任意）',
    jobDescPlaceholder: '例: Webアプリケーションのバックエンド開発、社内システムのインフラ保守',
    extraPermSectionTitle: '資格外活動許可の保有状況',
    extraPermLabel: '在留カード裏面に「資格外活動許可（原則週28時間以内）」のスタンプがある',
    hoursLabel: '予定している就労時間（週あたり）',
    hoursUnit: '時間/週',
    vacationLabel: '現在、在籍する教育機関の「学則で定められた長期休業期間（夏・冬休み等）」中である',
    designatedDetailsLabel: '「指定書」に記載された指定内容（特定活動の方のみ）',
    designatedDetailsPlaceholder: '例: ワーキングホリデー、本邦大学卒業者の就職活動など指定書の記載文言',
    sectionResult: '2. 就労範囲の事前整理・判定結果',
    badgeWithinScope: '原則として活動範囲内',
    badgeOutsideScope: '現行資格の範囲外の可能性あり',
    badgeExtraPerm: '資格外活動許可の取得が必須',
    badgeDepends: '指定書・個別内容の確認が必要',
    badgeNeedsConfirm: '入管窓口・専門家への確認推奨',
    detailsHeading: '法令基準に基づく解説と留意点',
    warningsHeading: '重要な注意事項・法的リスク',
    nextActionsHeading: '推奨される次のアクション',
    hoursExceededNotice: '法定上限（週28時間）を超過しています',
    vacationAllowedNotice: '長期休暇中の上限（週40時間）以内で設定されています',
    sectionRelated: '3. 関連する行政・在留手続きツール',
    regulatorySectionTitle: '参照公定基準・法令（Official Regulatory Sources）',
    disclaimerBannerTitle: '法的重要告知（Legal Disclaimer）',
  },
  vi: {
    toolTitle: 'Kiểm Tra Phạm Vi Làm Việc Theo Visa (在留資格・就労範囲チェッカー)',
    toolDesc: 'Căn cứ quy chuẩn chính thức của Cục Quản lý Xuất nhập cảnh Nhật Bản (ISA): Đối chiếu tư cách lưu trú hiện tại với công việc dự kiến, xác định điều kiện Giấy phép làm thêm (資格外活動許可) và giới hạn giờ làm.',
    sectionInput: '1. Thiết lập tư cách lưu trú và công việc dự kiến',
    statusLabel: 'Tư cách lưu trú hiện tại (Ghi trên thẻ ngoại kiều)',
    statusHelp: 'Chọn đúng tư cách lưu trú in trên mặt trước thẻ ngoại kiều (在留カード).',
    activityCategoryLabel: 'Nhóm công việc / Ngành nghề dự kiến làm',
    activityCategoryHelp: 'Chọn nhóm ngành nghề phản ánh đúng nhất công việc thực tế bạn sẽ đảm nhận.',
    employmentTypeLabel: 'Hình thức làm việc',
    empFullTime: 'Chính thức (Seishain) / Hợp đồng toàn thời gian',
    empPartTime: 'Bán thời gian / Làm thêm (Arubaito)',
    empContract: 'Hợp đồng dịch vụ / Freelancer độc lập',
    empSelfEmployed: 'Điều hành doanh nghiệp / Người đại diện',
    jobDescLabel: 'Mô tả cụ thể nội dung công việc (Tùy chọn)',
    jobDescPlaceholder: 'Ví dụ: Lập trình viên Backend Java/NodeJS, biên phiên dịch tài liệu kỹ thuật...',
    extraPermSectionTitle: 'Tình trạng Giấy phép làm thêm (資格外活動許可)',
    extraPermLabel: 'Đã có dấu "資格外活動許可 (原則週28時間以内)" đóng ở mặt sau thẻ ngoại kiều',
    hoursLabel: 'Số giờ làm việc dự kiến trong 1 tuần',
    hoursUnit: 'giờ/tuần',
    vacationLabel: 'Hiện đang trong kỳ nghỉ dài chính thức của trường (nghỉ hè, nghỉ đông... có giấy chứng nhận)',
    designatedDetailsLabel: 'Nội dung ghi trên "Giấy chỉ định" (Chỉ áp dụng cho visa 特定活動)',
    designatedDetailsPlaceholder: 'Ví dụ: Tìm việc sau tốt nghiệp đại học, Working Holiday...',
    sectionResult: '2. Kết quả đối chiếu phạm vi làm việc',
    badgeWithinScope: 'Về nguyên tắc trong phạm vi cho phép',
    badgeOutsideScope: 'Có nguy cơ nằm ngoài phạm vi tư cách',
    badgeExtraPerm: 'Bắt buộc phải xin Giấy phép làm thêm trước',
    badgeDepends: 'Phụ thuộc vào Giấy chỉ định (指定書)',
    badgeNeedsConfirm: 'Khuyến nghị tham vấn Cục Xuất nhập cảnh',
    detailsHeading: 'Phân tích chi tiết căn cứ theo luật định',
    warningsHeading: 'Cảnh báo rủi ro pháp lý quan trọng',
    nextActionsHeading: 'Các bước khuyến nghị tiếp theo',
    hoursExceededNotice: 'Đã vượt quá giới hạn luật định (tối đa 28h/tuần)',
    vacationAllowedNotice: 'Đang áp dụng mức trần kỳ nghỉ dài (tối đa 40h/tuần)',
    sectionRelated: '3. Công cụ thủ tục cư trú liên quan',
    regulatorySectionTitle: 'Căn cứ pháp quy chính thức (Official Sources)',
    disclaimerBannerTitle: 'Thông báo pháp lý quan trọng (Legal Disclaimer)',
  },
  en: {
    toolTitle: 'Residence Status & Work Scope Checker (在留資格・就労範囲チェッカー)',
    toolDesc: 'Evaluate whether your current Japanese residence status permits your planned employment activities based on official Immigration Services Agency (ISA) criteria.',
    sectionInput: '1. Current Residence Status & Planned Activity',
    statusLabel: 'Current Status of Residence (as on Card)',
    statusHelp: 'Select the exact status printed on the front of your Residence Card.',
    activityCategoryLabel: 'Planned Work / Occupational Field',
    activityCategoryHelp: 'Select the field that best describes your primary day-to-day duties.',
    employmentTypeLabel: 'Employment Type',
    empFullTime: 'Full-time / Regular Contract',
    empPartTime: 'Part-time (Arubaito)',
    empContract: 'Independent Contractor / Freelancer',
    empSelfEmployed: 'Executive Director / Business Owner',
    jobDescLabel: 'Specific Job Duties Description (Optional)',
    jobDescPlaceholder: 'e.g. Full-stack cloud engineering, bilingual customer support and trade negotiations',
    extraPermSectionTitle: 'Work Permission Status (資格外活動許可)',
    extraPermLabel: 'Holds "Permission to Engage in Activity other than that Permitted" stamped on card back',
    hoursLabel: 'Expected weekly working hours',
    hoursUnit: 'hrs/week',
    vacationLabel: 'Currently during official long school break defined by school regulations (Students only)',
    designatedDetailsLabel: 'Designation Certificate Details (Designated Activities only)',
    designatedDetailsPlaceholder: 'e.g. Working Holiday, post-graduation job seeking',
    sectionResult: '2. Work Scope Evaluation Result',
    badgeWithinScope: 'Generally Within Scope',
    badgeOutsideScope: 'Potentially Outside Authorized Scope',
    badgeExtraPerm: 'Work Permission (資格外活動許可) Mandatory',
    badgeDepends: 'Subject to Designation Certificate (指定書)',
    badgeNeedsConfirm: 'Immigration Consultation Recommended',
    detailsHeading: 'Statutory Analysis & Procedural Guidance',
    warningsHeading: 'Important Regulatory Alerts & Risks',
    nextActionsHeading: 'Recommended Next Steps',
    hoursExceededNotice: 'Exceeds statutory limit of 28 hours per week',
    vacationAllowedNotice: 'Within authorized long vacation cap of 40 hours per week',
    sectionRelated: '3. Related Immigration & Life Event Tools',
    regulatorySectionTitle: 'Primary Regulatory Standards (ISA & Cabinet Orders)',
    disclaimerBannerTitle: 'Mandatory Legal Disclaimer',
  },
};

export default function WorkScopeCheckerView({ lang = 'ja' }) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.ja;

  // Form State
  const [residenceStatus, setResidenceStatus] = useState('engineer-humanities-international');
  const [activityCategory, setActivityCategory] = useState('engineering_it');
  const [employmentType, setEmploymentType] = useState('full-time');
  const [jobDescription, setJobDescription] = useState('');
  const [hasExtraPerm, setHasExtraPerm] = useState(false);
  const [weeklyHours, setWeeklyHours] = useState(20);
  const [isSchoolVacation, setIsSchoolVacation] = useState(false);
  const [designatedDetails, setDesignatedDetails] = useState('');

  // Status Definition metadata
  const currentStatusDef = useMemo(() => getStatusDefinition(residenceStatus), [residenceStatus]);
  const statusGroups = useMemo(() => getStatusOptionsGrouped(lang), [lang]);

  // Is this status a non-working student/dependent requiring hours check?
  const isPartTimeTrack = currentStatusDef?.category === 'table-1-non-work';
  const isDesignatedActivities = residenceStatus === 'designated-activities';

  // Evaluate result through pure core engine
  const evaluationResult = useMemo(() => {
    return evaluateWorkScope({
      residenceStatus,
      activityCategory,
      employmentType,
      jobDescription,
      hasExtraActivityPermission: hasExtraPerm,
      weeklyHours: isPartTimeTrack ? weeklyHours : 0,
      isSchoolVacation,
      designatedActivityDetails: designatedDetails,
    });
  }, [
    residenceStatus,
    activityCategory,
    employmentType,
    jobDescription,
    hasExtraPerm,
    isPartTimeTrack,
    weeklyHours,
    isSchoolVacation,
    designatedDetails,
  ]);

  // Badge stylings
  const getBadgeStyle = (tier) => {
    switch (tier) {
      case 'generally-within-scope':
        return {
          bg: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
          icon: CheckCircle2,
          label: t.badgeWithinScope,
        };
      case 'requires-extra-permission':
        return {
          bg: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
          icon: AlertTriangle,
          label: t.badgeExtraPerm,
        };
      case 'depends-on-details':
        return {
          bg: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30',
          icon: HelpCircle,
          label: t.badgeDepends,
        };
      case 'potentially-outside-scope':
        return {
          bg: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
          icon: XCircle,
          label: t.badgeOutsideScope,
        };
      case 'needs-confirmation':
      default:
        return {
          bg: 'bg-surface-variant text-on-surface border-outline-variant',
          icon: Info,
          label: t.badgeNeedsConfirm,
        };
    }
  };

  const badgeConfig = getBadgeStyle(evaluationResult.evaluationTier);
  const BadgeIcon = badgeConfig.icon;

  return (
    <StandardToolLayout
      toolId="work-scope-checker-jp"
      title={t.toolTitle}
      description={t.toolDesc}
    >
      <div className="space-y-8">
        {/* Discretion Safety Legal Notice Banner */}
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-on-surface">
          <div className="flex items-start gap-3">
            <Scale className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm space-y-1">
              <span className="font-bold text-amber-900 dark:text-amber-200">
                {t.disclaimerBannerTitle}
              </span>
              <p className="text-on-surface-variant text-xs leading-relaxed">
                {lang === 'vi'
                  ? evaluationResult.legalDisclaimerVi
                  : lang === 'en'
                  ? evaluationResult.legalDisclaimerEn
                  : evaluationResult.legalDisclaimerJa}
              </p>
            </div>
          </div>
        </div>

        {/* Section 1: Inputs */}
        <div className="p-6 rounded-2xl border border-outline-variant bg-surface-container space-y-6">
          <div className="flex items-center gap-2 border-b border-outline-variant pb-3">
            <Briefcase className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-on-surface">{t.sectionInput}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Status of Residence Dropdown */}
            <div className="space-y-2">
              <label htmlFor="select-residence-status" className="block text-sm font-semibold text-on-surface">
                {t.statusLabel}
              </label>
              <select
                id="select-residence-status"
                value={residenceStatus}
                onChange={(e) => {
                  setResidenceStatus(e.target.value);
                  // Auto-reset extra perm if switching to table 2
                  const def = getStatusDefinition(e.target.value);
                  if (def?.category === 'table-2-status') {
                    setHasExtraPerm(false);
                  }
                }}
                className="w-full px-3 py-2 rounded-lg border border-outline bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary text-sm font-medium"
              >
                {statusGroups.map((g) => (
                  <optgroup key={g.category} label={g.categoryLabel}>
                    {g.items.map((it) => (
                      <option key={it.value} value={it.value}>
                        {it.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <p className="text-xs text-on-surface-variant">{t.statusHelp}</p>
            </div>

            {/* Activity Category Dropdown */}
            <div className="space-y-2">
              <label htmlFor="select-activity-category" className="block text-sm font-semibold text-on-surface">
                {t.activityCategoryLabel}
              </label>
              <select
                id="select-activity-category"
                value={activityCategory}
                onChange={(e) => setActivityCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-outline bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary text-sm font-medium"
              >
                {Object.values(ACTIVITY_CATEGORIES).map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {lang === 'vi' ? cat.labelVi : lang === 'en' ? cat.labelEn : cat.labelJa}
                  </option>
                ))}
              </select>
              <p className="text-xs text-on-surface-variant">{t.activityCategoryHelp}</p>
            </div>
          </div>

          {/* Conditional: Designated Activities Specific text */}
          {isDesignatedActivities && (
            <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-500/10 space-y-2">
              <label htmlFor="input-designated-details" className="block text-sm font-semibold text-on-surface flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                {t.designatedDetailsLabel}
              </label>
              <input
                id="input-designated-details"
                type="text"
                value={designatedDetails}
                onChange={(e) => setDesignatedDetails(e.target.value)}
                placeholder={t.designatedDetailsPlaceholder}
                className="w-full px-3 py-2 rounded-lg border border-outline bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              />
            </div>
          )}

          {/* Employment Type & Optional Job Description */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="space-y-2">
              <label htmlFor="select-employment-type" className="block text-sm font-semibold text-on-surface">
                {t.employmentTypeLabel}
              </label>
              <select
                id="select-employment-type"
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-outline bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              >
                <option value="full-time">{t.empFullTime}</option>
                <option value="part-time">{t.empPartTime}</option>
                <option value="contract">{t.empContract}</option>
                <option value="self-employed">{t.empSelfEmployed}</option>
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="input-job-desc" className="block text-sm font-semibold text-on-surface">
                {t.jobDescLabel}
              </label>
              <input
                id="input-job-desc"
                type="text"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder={t.jobDescPlaceholder}
                className="w-full px-3 py-2 rounded-lg border border-outline bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              />
            </div>
          </div>

          {/* Part-time track conditional fields (Student / Dependent) */}
          {isPartTimeTrack && (
            <div className="p-4 rounded-xl border border-outline-variant bg-surface space-y-4 pt-3">
              <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                {t.extraPermSectionTitle}
              </h3>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="checkbox-extra-perm"
                  checked={hasExtraPerm}
                  onChange={(e) => setHasExtraPerm(e.target.checked)}
                  className="w-4 h-4 rounded text-primary focus:ring-primary border-outline cursor-pointer"
                />
                <label htmlFor="checkbox-extra-perm" className="text-sm text-on-surface cursor-pointer select-none">
                  {t.extraPermLabel}
                </label>
              </div>

              {hasExtraPerm && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-outline-variant/50">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs text-on-surface">
                      <label htmlFor="input-weekly-hours" className="font-medium">{t.hoursLabel}</label>
                      <span className="font-bold text-primary text-sm">{weeklyHours} {t.hoursUnit}</span>
                    </div>
                    <input
                      id="input-weekly-hours"
                      type="range"
                      min="1"
                      max="48"
                      value={weeklyHours}
                      onChange={(e) => setWeeklyHours(parseInt(e.target.value, 10))}
                      className="w-full accent-primary cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-on-surface-variant">
                      <span>1h</span>
                      <span className="font-semibold text-amber-600">28h (Hạn mức chuẩn)</span>
                      <span>40h</span>
                      <span>48h</span>
                    </div>
                  </div>

                  {residenceStatus === 'student' && (
                    <div className="flex items-center gap-3 pt-4">
                      <input
                        type="checkbox"
                        id="checkbox-vacation"
                        checked={isSchoolVacation}
                        onChange={(e) => setIsSchoolVacation(e.target.checked)}
                        className="w-4 h-4 rounded text-primary focus:ring-primary border-outline cursor-pointer"
                      />
                      <label htmlFor="checkbox-vacation" className="text-xs text-on-surface cursor-pointer select-none">
                        {t.vacationLabel}
                      </label>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Section 2: Results & Statutory Evaluation */}
        <div className="p-6 rounded-2xl border border-outline-variant bg-surface-container space-y-6">
          <div className="flex items-center justify-between border-b border-outline-variant pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-on-surface">{t.sectionResult}</h2>
            </div>
            {/* Status badge */}
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${badgeConfig.bg}`}>
              <BadgeIcon className="w-4 h-4" />
              <span>{badgeConfig.label}</span>
            </div>
          </div>

          {/* Primary Summary Banner */}
          <div className="p-4 rounded-xl border border-outline-variant bg-surface space-y-2">
            <h3 className="text-base font-bold text-on-surface">
              {lang === 'vi'
                ? evaluationResult.summaryVi
                : lang === 'en'
                ? evaluationResult.summaryEn
                : evaluationResult.summaryJa}
            </h3>
            <div className="text-xs text-on-surface-variant space-y-1.5">
              {(lang === 'vi'
                ? evaluationResult.detailsVi
                : lang === 'en'
                ? evaluationResult.detailsEn
                : evaluationResult.detailsJa
              ).map((detail, idx) => (
                <p key={idx} className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>{detail}</span>
                </p>
              ))}
            </div>
          </div>

          {/* Warnings (if any) */}
          {evaluationResult.warnings.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-rose-700 dark:text-rose-400 flex items-center gap-2">
                <AlertOctagon className="w-4 h-4" />
                {t.warningsHeading}
              </h4>
              <div className="space-y-2">
                {evaluationResult.warnings.map((w) => (
                  <div
                    key={w.id}
                    className={`p-3 rounded-xl border text-xs leading-relaxed ${
                      w.severity === 'critical'
                        ? 'border-rose-500/30 bg-rose-500/10 text-rose-800 dark:text-rose-200'
                        : 'border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200'
                    }`}
                  >
                    {lang === 'vi' ? w.textVi : lang === 'en' ? w.textEn : w.textJa}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Next Actions */}
          {evaluationResult.nextActions.length > 0 && (
            <div className="space-y-3 pt-2">
              <h4 className="text-sm font-bold text-on-surface flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                {t.nextActionsHeading}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {evaluationResult.nextActions.map((action) => (
                  <div
                    key={action.stepOrder}
                    className="p-3 rounded-xl border border-outline-variant bg-surface flex items-start gap-2.5 text-xs text-on-surface"
                  >
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center flex-shrink-0 text-xs">
                      {action.stepOrder}
                    </span>
                    <span className="leading-snug">
                      {lang === 'vi' ? action.actionVi : lang === 'en' ? action.actionEn : action.actionJa}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Section 3: Deep-link Connections to Related Tools */}
        <div className="p-6 rounded-2xl border border-outline-variant bg-surface-container space-y-4">
          <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
            <Building className="w-4 h-4 text-primary" />
            {t.sectionRelated}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <a
              href="#/tools/residence-renewal-guide-jp"
              className="p-3.5 rounded-xl border border-outline-variant bg-surface hover:border-primary transition-colors flex items-center justify-between group"
            >
              <div className="text-xs">
                <span className="font-bold text-on-surface group-hover:text-primary block">
                  {lang === 'vi' ? 'Gia hạn thời hạn lưu trú' : lang === 'en' ? 'Residence Renewal' : '在留期間更新ガイド'}
                </span>
                <span className="text-on-surface-variant text-[11px]">
                  {lang === 'vi' ? 'Hạn chót & Danh mục hồ sơ' : lang === 'en' ? 'Deadlines & Doc Checklist' : '期限・必要書類ナビ'}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-on-surface-variant group-hover:text-primary transition-transform group-hover:translate-x-0.5" />
            </a>

            <a
              href="#/tools/affiliation-change-checker-jp"
              className="p-3.5 rounded-xl border border-outline-variant bg-surface hover:border-primary transition-colors flex items-center justify-between group"
            >
              <div className="text-xs">
                <span className="font-bold text-on-surface group-hover:text-primary block">
                  {lang === 'vi' ? 'Báo đổi công ty / Chuyển việc' : lang === 'en' ? 'Affiliation Change' : '所属機関変更届出'}
                </span>
                <span className="text-on-surface-variant text-[11px]">
                  {lang === 'vi' ? 'Hạn 14 ngày Điều 19-16' : lang === 'en' ? '14-Day Deadline ICA Art. 19-16' : '14日以内の届出チェッカー'}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-on-surface-variant group-hover:text-primary transition-transform group-hover:translate-x-0.5" />
            </a>

            <a
              href="#/tools/status-change-guide-jp"
              className="p-3.5 rounded-xl border border-outline-variant bg-surface hover:border-primary transition-colors flex items-center justify-between group"
            >
              <div className="text-xs">
                <span className="font-bold text-on-surface group-hover:text-primary block">
                  {lang === 'vi' ? 'Đổi tư cách lưu trú' : lang === 'en' ? 'Status Change Guide' : '在留資格変更ガイド'}
                </span>
                <span className="text-on-surface-variant text-[11px]">
                  {lang === 'vi' ? 'Du học -> Đi làm, etc.' : lang === 'en' ? 'Student to Work, etc.' : '進路変更・独立・結婚'}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-on-surface-variant group-hover:text-primary transition-transform group-hover:translate-x-0.5" />
            </a>
          </div>
        </div>

        {/* Regulatory Sources Section */}
        <div className="p-6 rounded-2xl border border-outline-variant bg-surface-container space-y-4">
          <RegulatorySourceView
            sourceIds={IMMIGRATION_SOURCES_M1}
            title={t.regulatorySectionTitle}
          />
        </div>
      </div>
    </StandardToolLayout>
  );
}
