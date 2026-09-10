/**
 * @file packages/core/src/components/immigration/AffiliationChangeCheckerView.jsx
 * @description
 * Giao diện tương tác Kiểm tra thủ tục Chuyển việc & Thay đổi cơ quan trực thuộc (所属機関変更).
 * Tuân thủ tiêu chuẩn MAIS Gates 1-4, WCAG 2.1 AA, responsive 1240px, Dark/Light mode tokens.
 * Single Source of Truth (SOT): Nhận `lang` từ Shell/Hub.
 */

import React, { useState, useMemo } from 'react';
import {
  Building2,
  Calendar,
  Clock,
  AlertTriangle,
  Info,
  ShieldAlert,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Send,
  FileCheck,
  Layers,
} from 'lucide-react';
import StandardToolLayout from '../shared/StandardToolLayout.jsx';
import RegulatorySourceView from '../regulatory/RegulatorySourceView.jsx';
import { getAllStatuses } from '../../japan/immigration/status/statusCatalog.js';
import { checkAffiliationChange } from '../../japan/immigration/affiliation/affiliationEngine.js';

const AFFILIATION_SOURCES = [
  'isa-act-art19-16',
  'isa-act-art22-4-para1-item6',
  'isa-act-art19-2',
];

export function AffiliationChangeCheckerView({ lang = 'vi' }) {
  const allStatuses = useMemo(() => getAllStatuses(), []);

  // Mặc định ngày sự kiện là 5 ngày trước để hiển thị hạn 14 ngày đang đếm ngược
  const defaultEventDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 5);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }, []);

  const [residenceStatus, setResidenceStatus] = useState('engineer-humanities-international');
  const [eventType, setEventType] = useState('transferred');
  const [eventDate, setEventDate] = useState(defaultEventDate);
  const [isSameJobScope, setIsSameJobScope] = useState(true);
  const [isJobHunting, setIsJobHunting] = useState(true);
  const [isHelloWorkRegistered, setIsHelloWorkRegistered] = useState(false);
  const [hasFiled14DayNotice, setHasFiled14DayNotice] = useState(false);

  const evaluation = useMemo(() => {
    try {
      return checkAffiliationChange({
        residenceStatus,
        eventType,
        eventDate,
        isSameJobScope,
        isJobHunting,
        isHelloWorkRegistered,
        hasFiled14DayNotice,
        language: lang,
      });
    } catch (err) {
      return null;
    }
  }, [
    residenceStatus,
    eventType,
    eventDate,
    isSameJobScope,
    isJobHunting,
    isHelloWorkRegistered,
    hasFiled14DayNotice,
    lang,
  ]);

  const t = {
    vi: {
      title: 'Kiểm Tra Thủ Tục Chuyển Việc & Thay Đổi Đơn Vị Công Tác',
      subtitle: 'Tra cứu hạn thông báo 14 ngày bắt buộc (Điều 19-16), đánh giá nguy cơ thu hồi tư cách sau 3 tháng không hoạt động, và hướng dẫn xin Giấy chứng nhận tư cách làm việc.',
      statusLabel: 'Tư cách lưu trú hiện tại',
      eventTypeLabel: 'Loại sự kiện công tác',
      eventDateLabel: 'Ngày nghỉ việc hoặc bắt đầu công việc mới',
      scopeLabel: 'Tính chất công việc mới so với visa hiện tại',
      sameScope: 'Cùng nhóm chuyên môn (vd: Kỹ sư CNTT chuyển sang công ty CNTT khác)',
      differentScope: 'Khác nhóm chuyên môn (vd: Kỹ sư chuyển sang làm dịch vụ, nhà hàng)',
      filedLabel: 'Đã nộp thông báo cơ quan trực thuộc (14 ngày) lên Cục XNC chưa?',
      jobHuntingLabel: 'Đang tích cực tìm việc mới (có nộp hồ sơ, phỏng vấn)?',
      helloWorkLabel: 'Đã đăng ký tìm việc tại Trung tâm Hello Work địa phương chưa?',
      eventLeft: 'Đã thôi việc / Nghỉ việc (Chưa có công ty mới)',
      eventJoined: 'Mới gia nhập công ty (Chưa khai báo)',
      eventTransferred: 'Chuyển việc hoàn tất (Rời công ty cũ và vào công ty mới)',
      eventContract: 'Thay đổi tên công ty / Địa chỉ trụ sở / Loại hợp đồng',
      timelineTitle: 'Thời Hạn Thông Báo & Rủi Ro Pháp Lý',
      deadlineLabel: 'Hạn chót thông báo 14 ngày',
      threeMonthLabel: 'Hạn 3 tháng không hoạt động (Điều 22-4)',
      filingTitle: '3 Phương Thức Nộp Thông Báo Chính Thức',
      certTitle: 'Giấy Chứng Nhận Tư Cách Làm Việc (就労資格証明書)',
      certDesc: 'Thủ tục khuyến nghị tự nguyện giúp kỳ gia hạn tới không bị từ chối đột ngột',
      certFee: 'Lệ phí tem doanh thu: 1.200 JPY',
      discretionNoticeTitle: 'Lưu ý Thẩm quyền Cục Xuất Nhập Cảnh',
      relatedTools: 'Công cụ liên quan liên kết hệ sinh thái',
      taxSimLink: 'Kiểm tra thuế thu nhập & cư trú (Japan Tax Simulator)',
      unemploymentLink: 'Kiểm tra trợ cấp thất nghiệp (Unemployment Benefit JP)',
      workScopeLink: 'Kiểm tra phạm vi làm việc của Visa (Work Scope Checker)',
    },
    ja: {
      title: '転職・所属機関変更ナビゲーター',
      subtitle: '入管法第19条の16に基づく14日以内届出期限の自動算出、退職後3か月の在留資格取消リスク判定、就労資格証明書（1,200円）手続案内。',
      statusLabel: '現在の在留資格',
      eventTypeLabel: '事由の区分',
      eventDateLabel: '退職日または転職・受入日',
      scopeLabel: '新職務内容と現在の在留資格との適合性',
      sameScope: '同一専門分野（例: ITエンジニアが他社へエンジニアとして転職）',
      differentScope: '異なる職種分野（例: 事務職から飲食・現場サービス職へ変更等）',
      filedLabel: 'すでに入管へ14日以内の所属機関届出を提出済みですか？',
      jobHuntingLabel: 'ハローワーク等で積極的に求職活動を行っていますか？',
      helloWorkLabel: 'ハローワーク（公共職業安定所）への求職登録はお済みですか？',
      eventLeft: '所属機関からの離脱（退職のみ）',
      eventJoined: '所属機関への移籍（新たな就職）',
      eventTransferred: '離脱及び移籍（同時期の転職）',
      eventContract: '名称変更・所在地変更・契約内容の変更',
      timelineTitle: '届出期日と在留資格リスクタイムライン',
      deadlineLabel: '14日以内の届出法定期限',
      threeMonthLabel: '3か月未活動取消リスク限界日',
      filingTitle: '入管への届出方法（3つの公的ルート）',
      certTitle: '就労資格証明書交付申請（第19条の2）',
      certDesc: '新勤務先での就労適合性を事前公証し次回更新不許可リスクを未然防止',
      certFee: '手数料（収入印紙代）：1,200円',
      discretionNoticeTitle: '法務大臣の行政処分に関する留意事項',
      relatedTools: '関連するライフサポートツール',
      taxSimLink: '日本所得税・住民税シミュレーター',
      unemploymentLink: '失業保険給付シミュレーター',
      workScopeLink: '在留資格・就労範囲チェッカー',
    },
    en: {
      title: 'Affiliation Change & Job Transfer Navigator',
      subtitle: 'Statutory 14-day notification tracking (Art. 19-16), 3-month inactivity revocation risk evaluation (Art. 22-4), and Certificate of Authorized Employment guidance.',
      statusLabel: 'Current Residence Status',
      eventTypeLabel: 'Event Classification',
      eventDateLabel: 'Resignation Date or New Job Start Date',
      scopeLabel: 'New Job Duties Compatibility',
      sameScope: 'Same specialized field (e.g. IT Engineer transferring to another IT role)',
      differentScope: 'Different job field (e.g. Engineer switching to hospitality or general labor)',
      filedLabel: 'Have you already filed the 14-day notification with ISA?',
      jobHuntingLabel: 'Are you actively job hunting (applications, interviews)?',
      helloWorkLabel: 'Are you registered with the public employment office (Hello Work)?',
      eventLeft: 'Resigned / Left organization only',
      eventJoined: 'Joined new organization',
      eventTransferred: 'Transferred (Left previous and joined new)',
      eventContract: 'Contractual or organizational changes',
      timelineTitle: 'Filing Timeline & Regulatory Risk Assessment',
      deadlineLabel: '14-Day Statutory Deadline',
      threeMonthLabel: '3-Month Inactivity Revocation Threshold',
      filingTitle: 'Official Submission Channels to ISA',
      certTitle: 'Certificate of Authorized Employment (Art. 19-2)',
      certDesc: 'Pre-certifies compatibility with current status, ensuring smooth future renewal',
      certFee: 'Revenue Stamp Fee: 1,200 JPY',
      discretionNoticeTitle: 'Immigration Services Agency Notice',
      relatedTools: 'Related Ecosystem Tools',
      taxSimLink: 'Japan Tax Simulator',
      unemploymentLink: 'Unemployment Benefit Calculator',
      workScopeLink: 'Work Scope Checker',
    },
  }[lang] || {
    title: 'Affiliation Change & Job Transfer Navigator',
    subtitle: 'Statutory 14-day notification tracking, 3-month inactivity revocation risk evaluation, and Certificate of Authorized Employment guidance.',
  };

  return (
    <StandardToolLayout
      title={t.title}
      description={t.subtitle}
      badge="ISA Immigration Rules"
    >
      <div className="w-full space-y-8 font-sans">
        {/* Main Grid: Inputs (Left) & Results (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Form Inputs */}
          <div className="lg:col-span-5 space-y-6 bg-surface-container-low p-6 rounded-2xl border border-outline-variant/30 shadow-sm">
            <h2 className="text-base font-bold text-on-surface flex items-center gap-2 border-b border-outline-variant/20 pb-3">
              <Building2 className="w-5 h-5 text-primary" />
              <span>Thông tin công tác & thay đổi</span>
            </h2>

            {/* Residence Status */}
            <div className="space-y-1.5">
              <label htmlFor="affiliation-residence-status" className="text-xs font-semibold text-on-surface-variant">
                {t.statusLabel}
              </label>
              <select
                id="affiliation-residence-status"
                aria-label={t.statusLabel}
                value={residenceStatus}
                onChange={(e) => setResidenceStatus(e.target.value)}
                className="w-full bg-surface-container border border-outline-variant/50 text-on-surface rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
              >
                {allStatuses.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.nameJa} ({lang === 'vi' ? st.nameVi : lang === 'en' ? st.nameEn : st.nameJa})
                  </option>
                ))}
              </select>
            </div>

            {/* Event Type */}
            <div className="space-y-1.5">
              <label htmlFor="affiliation-event-type" className="text-xs font-semibold text-on-surface-variant">
                {t.eventTypeLabel}
              </label>
              <select
                id="affiliation-event-type"
                aria-label={t.eventTypeLabel}
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="w-full bg-surface-container border border-outline-variant/50 text-on-surface rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
              >
                <option value="transferred">{t.eventTransferred}</option>
                <option value="left-company">{t.eventLeft}</option>
                <option value="joined-company">{t.eventJoined}</option>
                <option value="contract-change">{t.eventContract}</option>
              </select>
            </div>

            {/* Event Date */}
            <div className="space-y-1.5">
              <label htmlFor="affiliation-event-date" className="text-xs font-semibold text-on-surface-variant">
                {t.eventDateLabel}
              </label>
              <input
                id="affiliation-event-date"
                aria-label={t.eventDateLabel}
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full bg-surface-container border border-outline-variant/50 text-on-surface rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>

            {/* Same Job Scope Radio */}
            <div className="space-y-2 pt-2 border-t border-outline-variant/20">
              <label className="text-xs font-semibold text-on-surface-variant block">
                {t.scopeLabel}
              </label>
              <div className="space-y-2">
                <label className="flex items-start gap-3 p-3 bg-surface-container/50 rounded-xl border border-outline-variant/30 cursor-pointer">
                  <input
                    type="radio"
                    name="scope-group"
                    checked={isSameJobScope}
                    onChange={() => setIsSameJobScope(true)}
                    className="mt-0.5 text-primary focus:ring-primary"
                  />
                  <span className="text-xs text-on-surface leading-tight font-medium">
                    {t.sameScope}
                  </span>
                </label>

                <label className="flex items-start gap-3 p-3 bg-surface-container/50 rounded-xl border border-outline-variant/30 cursor-pointer">
                  <input
                    type="radio"
                    name="scope-group"
                    checked={!isSameJobScope}
                    onChange={() => setIsSameJobScope(false)}
                    className="mt-0.5 text-primary focus:ring-primary"
                  />
                  <span className="text-xs text-on-surface leading-tight font-medium text-error">
                    {t.differentScope}
                  </span>
                </label>
              </div>
            </div>

            {/* Checkboxes */}
            <div className="space-y-2 pt-2 border-t border-outline-variant/20">
              <label className="flex items-start gap-3 p-3 bg-surface-container/50 rounded-xl border border-outline-variant/30 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasFiled14DayNotice}
                  onChange={(e) => setHasFiled14DayNotice(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-primary focus:ring-primary"
                />
                <span className="text-xs text-on-surface font-medium leading-tight">
                  {t.filedLabel}
                </span>
              </label>

              {eventType === 'left-company' && (
                <>
                  <label className="flex items-start gap-3 p-3 bg-surface-container/50 rounded-xl border border-outline-variant/30 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isJobHunting}
                      onChange={(e) => setIsJobHunting(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded text-primary focus:ring-primary"
                    />
                    <span className="text-xs text-on-surface font-medium leading-tight">
                      {t.jobHuntingLabel}
                    </span>
                  </label>

                  <label className="flex items-start gap-3 p-3 bg-surface-container/50 rounded-xl border border-outline-variant/30 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isHelloWorkRegistered}
                      onChange={(e) => setIsHelloWorkRegistered(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded text-primary focus:ring-primary"
                    />
                    <span className="text-xs text-on-surface font-medium leading-tight">
                      {t.helloWorkLabel}
                    </span>
                  </label>
                </>
              )}
            </div>
          </div>

          {/* Right Column: Results & Guidance */}
          <div className="lg:col-span-7 space-y-6">
            {evaluation ? (
              <>
                {/* Table 2 Exemption Banner */}
                {evaluation.isExemptFromNotification ? (
                  <div className="p-6 rounded-2xl bg-surface-container-low border border-outline-variant/30 shadow-sm space-y-3">
                    <div className="flex items-center gap-2 text-primary font-bold text-base">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Miễn trừ nghĩa vụ thông báo cơ quan trực thuộc</span>
                    </div>
                    <p className="text-sm text-on-surface-variant leading-relaxed">
                      {evaluation.guidanceMessage}
                    </p>
                    <div className="text-[11px] font-mono text-outline">
                      {evaluation.regulatoryNotice.legalBasis}
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Warnings List */}
                    {evaluation.warnings.length > 0 && (
                      <div className="space-y-3">
                        {evaluation.warnings.map((w, idx) => (
                          <div
                            key={idx}
                            className={`p-4 rounded-xl border flex items-start gap-3 ${
                              w.type === 'critical'
                                ? 'bg-error-container/30 border-error/40 text-on-error-container'
                                : w.type === 'warning'
                                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200'
                                  : 'bg-primary-container/20 border-primary/30 text-on-primary-container'
                            }`}
                          >
                            {w.type === 'critical' ? (
                              <ShieldAlert className="w-5 h-5 text-error shrink-0 mt-0.5" />
                            ) : w.type === 'warning' ? (
                              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                            ) : (
                              <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                            )}
                            <p className="text-xs sm:text-sm font-medium leading-relaxed">
                              {w.message}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Timeline & Countdown Cards */}
                    <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/30 shadow-sm space-y-4">
                      <div className="flex items-center justify-between">
                        <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
                          <Clock className="w-5 h-5 text-primary" />
                          <span>{t.timelineTitle}</span>
                        </h2>

                        <span
                          className={`px-3 py-1 text-xs font-bold rounded-full ${
                            evaluation.isNotificationOverdue
                              ? 'bg-error text-on-error'
                              : 'bg-primary text-on-primary'
                          }`}
                        >
                          {evaluation.isNotificationOverdue ? 'QUÁ HẠN 14 NGÀY' : 'TRONG THỜI HẠN'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        {/* 14-day notice */}
                        <div className="p-4 bg-surface-container rounded-xl border border-outline-variant/30 space-y-1">
                          <div className="text-xs text-on-surface-variant font-medium">
                            {t.deadlineLabel}
                          </div>
                          <div className="text-lg font-bold text-on-surface">
                            {evaluation.notificationDeadline}
                          </div>
                          <div className="text-xs font-medium">
                            {evaluation.daysRemainingForNotification >= 0 ? (
                              <span className="text-primary">
                                Còn {evaluation.daysRemainingForNotification} ngày để thông báo
                              </span>
                            ) : (
                              <span className="text-error font-bold">
                                Đã trễ {-evaluation.daysRemainingForNotification} ngày
                              </span>
                            )}
                          </div>
                        </div>

                        {/* 3-month limit (if left company) */}
                        {evaluation.threeMonthRevocationLimit && (
                          <div className="p-4 bg-surface-container rounded-xl border border-outline-variant/30 space-y-1">
                            <div className="text-xs text-on-surface-variant font-medium">
                              {t.threeMonthLabel}
                            </div>
                            <div className="text-lg font-bold text-on-surface">
                              {evaluation.threeMonthRevocationLimit}
                            </div>
                            <div className="text-xs font-medium">
                              {evaluation.daysUntilThreeMonthLimit >= 0 ? (
                                <span className="text-on-surface-variant">
                                  Còn {evaluation.daysUntilThreeMonthLimit} ngày tìm việc mới
                                </span>
                              ) : (
                                <span className="text-amber-700 dark:text-amber-300 font-bold">
                                  Đã quá 3 tháng (Cần chứng minh tìm việc)
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Certificate of Authorized Employment Box */}
                    {evaluation.certificateOfAuthorizedEmployment?.recommended && (
                      <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/30 shadow-sm space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
                            <FileCheck className="w-5 h-5 text-primary" />
                            <span>{t.certTitle}</span>
                          </h3>
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary-container text-on-primary-container font-semibold">
                            Khuyến nghị
                          </span>
                        </div>
                        <p className="text-xs text-on-surface-variant leading-relaxed">
                          {lang === 'ja'
                            ? evaluation.certificateOfAuthorizedEmployment.purpose_ja
                            : lang === 'en'
                              ? evaluation.certificateOfAuthorizedEmployment.purpose_en
                              : evaluation.certificateOfAuthorizedEmployment.purpose_vi}
                        </p>
                        <div className="flex items-center gap-4 text-xs font-semibold text-primary pt-1">
                          <span>{t.certFee}</span>
                          <span className="text-outline font-mono text-[10px]">
                            {evaluation.certificateOfAuthorizedEmployment.fee.legalBasis}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Filing Methods */}
                    <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/30 shadow-sm space-y-4">
                      <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
                        <Send className="w-4 h-4 text-primary" />
                        <span>{t.filingTitle}</span>
                      </h3>

                      <div className="space-y-2.5">
                        {evaluation.filingMethods.map((m) => (
                          <div
                            key={m.id}
                            className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 ${
                              m.recommended
                                ? 'bg-primary-container/10 border-primary/40'
                                : 'bg-surface-container border-outline-variant/30'
                            }`}
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-on-surface">
                                  {lang === 'ja'
                                    ? m.name_ja
                                    : lang === 'en'
                                      ? m.name_en
                                      : m.name_vi}
                                </span>
                                {m.recommended && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary text-on-primary font-bold">
                                    Khuyên dùng
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-on-surface-variant mt-0.5">
                                {m.availability}
                              </div>
                            </div>

                            {m.url && (
                              <a
                                href={m.url}
                                target="_blank"
                                rel="noreferrer"
                                className="p-2 text-primary hover:bg-surface-container-highest rounded-lg transition-colors shrink-0"
                                aria-label="Chi tiết kênh nộp hồ sơ ISA"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Regulatory Notice */}
                    <div className="p-5 rounded-2xl bg-surface-container-low border border-outline-variant/30 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-on-surface uppercase tracking-wider">
                        <ShieldAlert className="w-4 h-4 text-primary" />
                        <span>{t.discretionNoticeTitle}</span>
                      </div>
                      <p className="text-xs text-on-surface-variant leading-relaxed">
                        {lang === 'ja'
                          ? evaluation.regulatoryNotice.disclaimer_ja
                          : lang === 'en'
                            ? evaluation.regulatoryNotice.disclaimer_en
                            : evaluation.regulatoryNotice.disclaimer_vi}
                      </p>
                      <div className="text-[10px] font-mono text-outline pt-1">
                        Căn cứ pháp lý: {evaluation.regulatoryNotice.legalBasis}
                      </div>
                    </div>
                  </>
                )}

                {/* Regulatory Sources Display */}
                <RegulatorySourceView sourceIds={AFFILIATION_SOURCES} lang={lang} />

                {/* Cross-Domain Linkages */}
                <div className="p-5 rounded-2xl bg-surface-container-low border border-outline-variant/30 space-y-3">
                  <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4 text-primary" />
                    <span>{t.relatedTools}</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <a
                      href="#/tools/japan-tax-simulator"
                      className="p-2.5 rounded-xl bg-surface-container border border-outline-variant/30 hover:border-primary/50 text-xs text-on-surface font-medium flex items-center justify-between group transition-colors"
                    >
                      <span className="truncate">{t.taxSimLink}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-on-surface-variant group-hover:text-primary shrink-0" />
                    </a>

                    <a
                      href="#/tools/unemployment-benefit-jp"
                      className="p-2.5 rounded-xl bg-surface-container border border-outline-variant/30 hover:border-primary/50 text-xs text-on-surface font-medium flex items-center justify-between group transition-colors"
                    >
                      <span className="truncate">{t.unemploymentLink}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-on-surface-variant group-hover:text-primary shrink-0" />
                    </a>

                    <a
                      href="#/tools/work-scope-checker-jp"
                      className="p-2.5 rounded-xl bg-surface-container border border-outline-variant/30 hover:border-primary/50 text-xs text-on-surface font-medium flex items-center justify-between group transition-colors"
                    >
                      <span className="truncate">{t.workScopeLink}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-on-surface-variant group-hover:text-primary shrink-0" />
                    </a>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-on-surface-variant bg-surface-container-low rounded-2xl border border-outline-variant/30">
                Vui lòng nhập ngày sự kiện hợp lệ để kiểm tra thủ tục.
              </div>
            )}
          </div>
        </div>
      </div>
    </StandardToolLayout>
  );
}

export default AffiliationChangeCheckerView;
