/**
 * @file packages/core/src/components/immigration/ResidenceRenewalGuideView.jsx
 * @description
 * Giao diện tương tác Hướng dẫn Gia hạn thời hạn lưu trú Nhật Bản (在留期間更新ガイド).
 * Tuân thủ tiêu chuẩn MAIS Gates 1-4, WCAG 2.1 AA, responsive 1240px, Dark/Light mode tokens.
 * Single Source of Truth (SOT): Nhận `lang` từ Shell/Hub.
 */

import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  FileCheck,
  AlertTriangle,
  Info,
  ShieldAlert,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  DollarSign,
  Camera,
  Layers,
} from 'lucide-react';
import StandardToolLayout from '../shared/StandardToolLayout.jsx';
import RegulatorySourceView from '../regulatory/RegulatorySourceView.jsx';
import { getAllStatuses } from '../../japan/immigration/status/statusCatalog.js';
import { calculateRenewalSchedule } from '../../japan/immigration/renewal/renewalEngine.js';

const RENEWAL_SOURCES = [
  'isa-act-art21',
  'isa-act-art20-para5',
  'isa-fee-table',
  'isa-photo-guidelines',
  'isa-renewal-doc-requirements',
];

export function ResidenceRenewalGuideView({ lang = 'vi' }) {
  const allStatuses = useMemo(() => getAllStatuses(), []);

  // Mặc định thẻ cư trú hết hạn sau 2 tháng kể từ hôm nay để user thấy ngay cửa sổ nộp hồ sơ đang mở
  const defaultExpDate = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 2);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }, []);

  const [residenceStatus, setResidenceStatus] = useState('engineer-humanities-international');
  const [expirationDate, setExpirationDate] = useState(defaultExpDate);
  const [applicantAge, setApplicantAge] = useState(28);
  const [hasFiled, setHasFiled] = useState(false);
  const [companyCategory, setCompanyCategory] = useState(3);
  const [hasTaxArrears, setHasTaxArrears] = useState(false);
  const [hasPensionArrears, setHasPensionArrears] = useState(false);
  const [completedDocs, setCompletedDocs] = useState({});

  const toggleDoc = (id) => {
    setCompletedDocs((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const scheduleResult = useMemo(() => {
    try {
      return calculateRenewalSchedule({
        residenceStatus,
        expirationDate,
        applicantAge: Number(applicantAge) || 30,
        hasFiled,
        companyCategory: Number(companyCategory) || 3,
        hasTaxArrears,
        hasPensionArrears,
        language: lang,
      });
    } catch (err) {
      return null;
    }
  }, [
    residenceStatus,
    expirationDate,
    applicantAge,
    hasFiled,
    companyCategory,
    hasTaxArrears,
    hasPensionArrears,
    lang,
  ]);

  const t = {
    vi: {
      title: 'Hướng Dẫn Gia Hạn Lưu Trú Nhật Bản',
      subtitle: 'Tra cứu hạn chót nộp đơn, thời kỳ đặc lệ (Tokurei Kikan), lệ phí và chuẩn bị danh mục giấy tờ chính thức theo Cục Quản lý Xuất nhập cảnh (ISA)',
      statusLabel: 'Tư cách lưu trú hiện tại',
      expLabel: 'Ngày hết hạn thẻ cư trú (在留期間満了日)',
      ageLabel: 'Tuổi của người nộp đơn',
      filedLabel: 'Đã nộp đơn lên Cục XNC trước ngày hết hạn chưa?',
      catLabel: 'Phân loại quy mô doanh nghiệp (Doanh nghiệp tiếp nhận)',
      taxArrearsLabel: 'Có đang chậm nộp hoặc nợ thuế cư trú (住民税) không?',
      pensionArrearsLabel: 'Có đang chậm nộp hoặc nợ bảo hiểm hưu trí (Nenkin) không?',
      timelineTitle: 'Lịch trình nộp hồ sơ & Thời hạn pháp lý',
      windowOpen: 'Mở nhận hồ sơ (3 tháng trước)',
      cardExpire: 'Hạn thẻ cư trú',
      tokureiLimit: 'Hạn tối đa Đặc Lệ (+2 tháng)',
      feeTitle: 'Lệ phí hành chính (Tem doanh thu)',
      feeNote: 'Chỉ nộp khi nhận thẻ mới, xác định theo ngày nộp đơn',
      photoTitle: 'Quy chuẩn ảnh thẻ',
      docTitle: 'Danh mục hồ sơ giấy tờ cần nộp',
      docDesc: 'Được tùy biến theo tư cách lưu trú và phân loại doanh nghiệp',
      discretionNoticeTitle: 'Lưu ý về Thẩm quyền Hành chính của Bộ Tư pháp',
      cat1: 'Category 1: Công ty niêm yết sàn chứng khoán (Miễn nhiều giấy tờ)',
      cat2: 'Category 2: Doanh nghiệp nộp thuế khấu trừ từ 10 triệu JPY/năm',
      cat3: 'Category 3: Doanh nghiệp nộp thuế khấu trừ dưới 10 triệu JPY/năm',
      cat4: 'Category 4: Doanh nghiệp mới thành lập / Chưa có tờ khai quyết toán',
      relatedTools: 'Công cụ liên quan liên kết hệ sinh thái',
      taxSimLink: 'Kiểm tra thuế thu nhập & cư trú (Japan Tax Simulator)',
      pensionLink: 'Kiểm tra bảo hiểm hưu trí Nenkin (National Pension JP)',
      workScopeLink: 'Kiểm tra phạm vi làm việc của Visa (Work Scope Checker)',
    },
    ja: {
      title: '在留期間更新許可申請ナビゲーター',
      subtitle: '申請受付開始日（満了3か月前）、特例期間（満了後2か月）、2026年手数料改定、必要書類チェックリストを公的基準で自動算出',
      statusLabel: '現在の在留資格',
      expLabel: '在留期間満了日（在留カード記載）',
      ageLabel: '申請人の年齢',
      filedLabel: '満了日前にすでに入管へ申請書を提出済みですか？',
      catLabel: '所属機関（受入れ企業等）のカテゴリー区分',
      taxArrearsLabel: '住民税等の公的租税に未納・分納・滞納がありますか？',
      pensionArrearsLabel: '厚生年金または国民年金に未納・滞納がありますか？',
      timelineTitle: '申請スケジュールと特例期間のタイムライン',
      windowOpen: '受付開始（満了3か月前）',
      cardExpire: '在留期間満了日',
      tokureiLimit: '特例期間満了日（最大2か月）',
      feeTitle: '申請手数料（収入印紙）',
      feeNote: '許可受取時に納付（申請受付日で判定）',
      photoTitle: '提出写真規格と免除基準',
      docTitle: '公的必要書類チェックリスト',
      docDesc: '在留資格及び所属機関カテゴリーに応じて必要書類を最適化',
      discretionNoticeTitle: '法務大臣の裁量処分に関する留意事項',
      cat1: 'カテゴリー1：上場企業・地方公共団体等（提出書類大幅簡素化）',
      cat2: 'カテゴリー2：法定調書合計表の源泉徴収税額が1,000万円以上',
      cat3: 'カテゴリー3：法定調書合計表の源泉徴収税額が1,000万円未満',
      cat4: 'カテゴリー4：新設企業または法定調書未提出企業',
      relatedTools: '関連するライフサポートツール',
      taxSimLink: '日本所得税・住民税シミュレーター',
      pensionLink: '国民年金ナビゲーター',
      workScopeLink: '在留資格・就労範囲チェッカー',
    },
    en: {
      title: 'Japan Residence Extension Guide',
      subtitle: 'Calculate application windows, Tokurei Kikan grace period, 2026 revised fees, and tailored official document checklists.',
      statusLabel: 'Current Residence Status',
      expLabel: 'Card Expiration Date',
      ageLabel: 'Applicant Age',
      filedLabel: 'Have you already filed before expiration?',
      catLabel: 'Employer Category Classification',
      taxArrearsLabel: 'Any outstanding resident tax arrears?',
      pensionArrearsLabel: 'Any outstanding pension contribution arrears?',
      timelineTitle: 'Filing Schedule & Tokurei Kikan Timeline',
      windowOpen: 'Window Opens (3 Mo Prior)',
      cardExpire: 'Card Expiration',
      tokureiLimit: 'Grace Limit (+2 Months)',
      feeTitle: 'Official Fee (Revenue Stamp)',
      feeNote: 'Payable only upon card issuance; rate anchored on filing date',
      photoTitle: 'Photo Specification',
      docTitle: 'Required Official Documents',
      docDesc: 'Optimized by residence category and employer category',
      discretionNoticeTitle: 'Ministerial Administrative Discretion Notice',
      cat1: 'Category 1: Listed corporations (Streamlined documents)',
      cat2: 'Category 2: Total withholding tax 10M+ JPY',
      cat3: 'Category 3: Total withholding tax under 10M JPY',
      cat4: 'Category 4: Newly established or no withholding record',
      relatedTools: 'Related Ecosystem Tools',
      taxSimLink: 'Japan Tax Simulator',
      pensionLink: 'National Pension Navigator',
      workScopeLink: 'Work Scope Checker',
    },
  }[lang] || {
    title: 'Japan Residence Extension Guide',
    subtitle: 'Calculate application windows, Tokurei Kikan grace period, 2026 revised fees, and tailored official document checklists.',
  };

  return (
    <StandardToolLayout
      title={t.title}
      description={t.subtitle}
      badge="ISA Official Rules"
    >
      <div className="w-full space-y-8 font-sans">
        {/* Main Grid: Form Inputs (Left) & Results (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Inputs */}
          <div className="lg:col-span-5 space-y-6 bg-surface-container-low p-6 rounded-2xl border border-outline-variant/30 shadow-sm">
            <h2 className="text-base font-bold text-on-surface flex items-center gap-2 border-b border-outline-variant/20 pb-3">
              <Calendar className="w-5 h-5 text-primary" />
              <span>{t.statusLabel}</span>
            </h2>

            {/* Residence Status */}
            <div className="space-y-1.5">
              <label htmlFor="residence-status-select" className="text-xs font-semibold text-on-surface-variant">
                {t.statusLabel}
              </label>
              <select
                id="residence-status-select"
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

            {/* Expiration Date */}
            <div className="space-y-1.5">
              <label htmlFor="residence-exp-date" className="text-xs font-semibold text-on-surface-variant">
                {t.expLabel}
              </label>
              <input
                id="residence-exp-date"
                aria-label={t.expLabel}
                type="date"
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
                className="w-full bg-surface-container border border-outline-variant/50 text-on-surface rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>

            {/* Applicant Age */}
            <div className="space-y-1.5">
              <label htmlFor="applicant-age-input" className="text-xs font-semibold text-on-surface-variant">
                {t.ageLabel}
              </label>
              <input
                id="applicant-age-input"
                aria-label={t.ageLabel}
                type="number"
                min="0"
                max="120"
                value={applicantAge}
                onChange={(e) => setApplicantAge(e.target.value)}
                className="w-full bg-surface-container border border-outline-variant/50 text-on-surface rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>

            {/* Has Filed Checkbox */}
            <label className="flex items-start gap-3 p-3 bg-surface-container/50 rounded-xl border border-outline-variant/30 cursor-pointer">
              <input
                type="checkbox"
                checked={hasFiled}
                onChange={(e) => setHasFiled(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-primary focus:ring-primary"
              />
              <span className="text-xs text-on-surface font-medium leading-tight">
                {t.filedLabel}
              </span>
            </label>

            {/* Company Category (for work visas) */}
            {(residenceStatus === 'engineer-humanities-international' || residenceStatus === 'engineer-specialist') && (
              <div className="space-y-1.5 pt-2 border-t border-outline-variant/20">
                <label htmlFor="company-category-select" className="text-xs font-semibold text-on-surface-variant">
                  {t.catLabel}
                </label>
                <select
                  id="company-category-select"
                  aria-label={t.catLabel}
                  value={companyCategory}
                  onChange={(e) => setCompanyCategory(Number(e.target.value))}
                  className="w-full bg-surface-container border border-outline-variant/50 text-on-surface rounded-lg px-3 py-2.5 text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                >
                  <option value={1}>{t.cat1}</option>
                  <option value={2}>{t.cat2}</option>
                  <option value={3}>{t.cat3}</option>
                  <option value={4}>{t.cat4}</option>
                </select>
              </div>
            )}

            {/* Compliance Checkboxes */}
            <div className="space-y-2 pt-2 border-t border-outline-variant/20">
              <label className="flex items-start gap-3 p-3 bg-surface-container/50 rounded-xl border border-outline-variant/30 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasTaxArrears}
                  onChange={(e) => setHasTaxArrears(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-error focus:ring-error"
                />
                <span className="text-xs text-on-surface font-medium leading-tight">
                  {t.taxArrearsLabel}
                </span>
              </label>

              <label className="flex items-start gap-3 p-3 bg-surface-container/50 rounded-xl border border-outline-variant/30 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasPensionArrears}
                  onChange={(e) => setHasPensionArrears(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-error focus:ring-error"
                />
                <span className="text-xs text-on-surface font-medium leading-tight">
                  {t.pensionArrearsLabel}
                </span>
              </label>
            </div>
          </div>

          {/* Right Column: Schedule & Guidance */}
          <div className="lg:col-span-7 space-y-6">
            {scheduleResult ? (
              <>
                {/* Warnings Banner */}
                {scheduleResult.warnings.length > 0 && (
                  <div className="space-y-3">
                    {scheduleResult.warnings.map((w, idx) => (
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

                {/* Timeline Cards */}
                <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/30 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
                      <Clock className="w-5 h-5 text-primary" />
                      <span>{t.timelineTitle}</span>
                    </h2>

                    {/* Status Badge */}
                    <span
                      className={`px-3 py-1 text-xs font-bold rounded-full ${
                        scheduleResult.windowStatus === 'open'
                          ? 'bg-primary text-on-primary'
                          : scheduleResult.windowStatus === 'grace-period'
                            ? 'bg-secondary text-on-secondary'
                            : scheduleResult.windowStatus === 'too-early'
                              ? 'bg-surface-container-highest text-on-surface'
                              : 'bg-error text-on-error'
                      }`}
                    >
                      {scheduleResult.windowStatus.toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <div className="p-3 bg-surface-container rounded-xl border border-outline-variant/30">
                      <div className="text-[11px] text-on-surface-variant font-medium">
                        {t.windowOpen}
                      </div>
                      <div className="text-sm font-bold text-on-surface mt-1">
                        {scheduleResult.windowStart}
                      </div>
                      <div className="text-[10px] text-on-surface-variant mt-0.5">
                        3か月前より受付
                      </div>
                    </div>

                    <div className="p-3 bg-surface-container rounded-xl border border-outline-variant/30">
                      <div className="text-[11px] text-on-surface-variant font-medium">
                        {t.cardExpire}
                      </div>
                      <div className="text-sm font-bold text-primary mt-1">
                        {scheduleResult.expirationDate}
                      </div>
                      <div className="text-[10px] text-on-surface-variant mt-0.5">
                        {scheduleResult.daysRemaining >= 0
                          ? `Còn ${scheduleResult.daysRemaining} ngày`
                          : `Đã quá hạn`}
                      </div>
                    </div>

                    <div className="p-3 bg-surface-container rounded-xl border border-outline-variant/30">
                      <div className="text-[11px] text-on-surface-variant font-medium">
                        {t.tokureiLimit}
                      </div>
                      <div className="text-sm font-bold text-on-surface mt-1">
                        {scheduleResult.gracePeriodLimit}
                      </div>
                      <div className="text-[10px] text-on-surface-variant mt-0.5">
                        Luật Nhập quản Điều 20 khoản 5
                      </div>
                    </div>
                  </div>
                </div>

                {/* Fee & Photo Information Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Fee Card */}
                  <div className="bg-surface-container-low p-5 rounded-2xl border border-outline-variant/30 shadow-sm space-y-2">
                    <div className="flex items-center gap-2 text-primary font-bold text-sm">
                      <DollarSign className="w-4 h-4" />
                      <span>{t.feeTitle}</span>
                    </div>
                    <div className="text-2xl font-black text-on-surface">
                      ¥{scheduleResult.fee.amount.toLocaleString()}
                    </div>
                    <p className="text-[11px] text-on-surface-variant leading-relaxed">
                      {t.feeNote}
                    </p>
                    <div className="text-[10px] font-mono text-outline">
                      {scheduleResult.fee.legalBasis}
                    </div>
                  </div>

                  {/* Photo Card */}
                  <div className="bg-surface-container-low p-5 rounded-2xl border border-outline-variant/30 shadow-sm space-y-2">
                    <div className="flex items-center gap-2 text-primary font-bold text-sm">
                      <Camera className="w-4 h-4" />
                      <span>{t.photoTitle}</span>
                    </div>
                    <div className="text-sm font-bold text-on-surface flex items-center gap-2">
                      <span>40mm × 30mm</span>
                      {scheduleResult.photoRequirement.required ? (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-primary-container text-on-primary-container font-semibold">
                          BẮT BUỘC
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-surface-container-highest text-on-surface-variant font-semibold">
                          MIỄN NỘP
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-on-surface-variant leading-relaxed">
                      {lang === 'ja'
                        ? scheduleResult.photoRequirement.reason_ja
                        : lang === 'en'
                          ? scheduleResult.photoRequirement.reason_en
                          : scheduleResult.photoRequirement.reason_vi}
                    </p>
                  </div>
                </div>

                {/* Documents Checklist */}
                <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/30 shadow-sm space-y-4">
                  <div>
                    <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
                      <FileCheck className="w-5 h-5 text-primary" />
                      <span>{t.docTitle}</span>
                    </h2>
                    <p className="text-xs text-on-surface-variant mt-1">
                      {t.docDesc}
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    {scheduleResult.documents.map((doc) => {
                      const isChecked = !!completedDocs[doc.id];
                      return (
                        <div
                          key={doc.id}
                          onClick={() => toggleDoc(doc.id)}
                          className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                            isChecked
                              ? 'bg-primary-container/10 border-primary/40'
                              : 'bg-surface-container border-outline-variant/30 hover:border-outline-variant/70'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                              isChecked
                                ? 'bg-primary border-primary text-on-primary'
                                : 'border-outline text-transparent'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 fill-current" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`text-xs font-bold leading-tight ${
                                  isChecked
                                    ? 'text-primary line-through'
                                    : 'text-on-surface'
                                }`}
                              >
                                {lang === 'ja'
                                  ? doc.name_ja
                                  : lang === 'en'
                                    ? doc.name_en
                                    : doc.name_vi}
                              </span>
                              {doc.required ? (
                                <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-primary/10 text-primary border border-primary/20">
                                  Bắt buộc
                                </span>
                              ) : (
                                <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-surface-container-highest text-on-surface-variant">
                                  Tùy điều kiện
                                </span>
                              )}
                            </div>

                            <div className="text-[11px] text-on-surface-variant mt-1 leading-relaxed">
                              {doc.purpose}
                            </div>

                            {doc.conditionDescription && (
                              <div className="text-[10px] text-amber-700 dark:text-amber-300 mt-1 font-medium">
                                ℹ {doc.conditionDescription}
                              </div>
                            )}

                            <div className="flex items-center gap-3 text-[10px] text-outline mt-1.5">
                              <span>Nơi cấp: {doc.issuer}</span>
                              {doc.officialUrl && (
                                <a
                                  href={doc.officialUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-primary hover:underline inline-flex items-center gap-1"
                                >
                                  <span>Chi tiết ISA</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Regulatory Notice & Discretion Protection */}
                <div className="p-5 rounded-2xl bg-surface-container-low border border-outline-variant/30 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-on-surface uppercase tracking-wider">
                    <ShieldAlert className="w-4 h-4 text-primary" />
                    <span>{t.discretionNoticeTitle}</span>
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    {lang === 'ja'
                      ? scheduleResult.regulatoryNotice.disclaimer_ja
                      : lang === 'en'
                        ? scheduleResult.regulatoryNotice.disclaimer_en
                        : scheduleResult.regulatoryNotice.disclaimer_vi}
                  </p>
                  <div className="text-[10px] font-mono text-outline pt-1">
                    Căn cứ pháp lý: {scheduleResult.regulatoryNotice.legalBasis}
                  </div>
                </div>

                {/* Regulatory Sources Display */}
                <RegulatorySourceView sourceIds={RENEWAL_SOURCES} lang={lang} />

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
                      href="#/tools/national-pension-jp"
                      className="p-2.5 rounded-xl bg-surface-container border border-outline-variant/30 hover:border-primary/50 text-xs text-on-surface font-medium flex items-center justify-between group transition-colors"
                    >
                      <span className="truncate">{t.pensionLink}</span>
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
                Vui lòng nhập ngày hết hạn thẻ cư trú hợp lệ để tính toán lịch trình.
              </div>
            )}
          </div>
        </div>
      </div>
    </StandardToolLayout>
  );
}

export default ResidenceRenewalGuideView;
