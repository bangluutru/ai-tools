/**
 * @file packages/core/src/components/housing/MovingAdminCheckerView.jsx
 * @description
 * Giao diện Kiểm tra & Hướng dẫn Thủ tục Hành chính Chuyển nhà Nhật Bản (引越し行政手続きナビ).
 * Căn cứ:
 * - 住民基本台帳法（第22条：転入届、第23条：転居届、第24条：転出届、第52条：過料）
 * - デジタル庁「引越しワンストップサービス」（マイナポータル）
 * - 出入国管理法、国民健康保険法、国民年金法、児童手当法
 * Tuân thủ nghiêm ngặt MAIS: StandardToolLayout 1240px, Design Tokens, Trilingual (ja/vi/en), WCAG AA.
 */

import React, { useState, useMemo } from 'react';
import {
  FileText,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Building2,
  CreditCard,
  Baby,
  Dog,
  ShieldCheck,
  Clock,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Info,
  MapPin,
  HelpCircle,
} from 'lucide-react';

import StandardToolLayout from '../shared/StandardToolLayout.jsx';
import RegulatorySourceView from '../regulatory/RegulatorySourceView.jsx';
import {
  MOVING_TYPES,
  MOVING_ADMIN_SOURCES,
  evaluateMovingAdminProcedures,
} from '../../japan/housing/index.js';

const TRANSLATIONS = {
  ja: {
    toolTitle: '引越し行政手続きナビ（転出・転入・ワンストップ・14日ルール）',
    toolDesc: '住民基本台帳法第22条〜第25条及びデジタル庁「引越しワンストップサービス」に完全準拠。転出届・転入届・転居届の法定14日期限、必要書類、マイナポータル利用可否を瞬時に判定します。',
    sectionSettings: '1. 引越し基本情報・条件の入力',
    moveTypeLabel: '引越しの種類（管轄自治体）',
    moveDateLabel: '引越し予定日（新居への入居日）',
    myNumberLabel: 'マイナンバーカードを所持している（署名用電子証明書有効）',
    foreignResidentLabel: '外国籍住民（在留カードを所持している世帯員がいる）',
    nhiLabel: '国民健康保険に加入中（フリーランス・自営業・離職中等）',
    pensionLabel: '国民年金第1号に加入中（第1号被保険者）',
    childrenLabel: '15歳以下の子どもがいる（児童手当・乳幼児医療費助成）',
    petsLabel: '犬を飼育している（狂犬病予防法に基づく鑑札登録）',
    careLabel: '65歳以上または介護保険の要介護認定を受けている',
    sectionSummary: '2. 法定手続きスケジュール＆期限判定',
    sectionOnestop: '3. マイナポータル 引越しワンストップサービス判定',
    sectionSteps: '4. 提出手順・ステップ別アクション',
    sectionDocs: '5. 役所持参・事前準備書類チェックリスト',
    sectionRelated: '6. 関連する住まい・手続きツール',
    regulatorySectionTitle: '参照公定基準・法令（Primary Regulatory Sources）',
    todayLabel: '基準日：本日',
    deadlineLabel: '法定提出期限',
    fineNotice: '※ 住民基本台帳法第52条：正当な理由なく14日以内に届出を行わない場合、5万円以下の過料に処される可能性があります。',
  },
  vi: {
    toolTitle: 'Tra Cứu Thủ Tục Hành Chính Chuyển Nhà Nhật Bản (引越し行政手続きナビ)',
    toolDesc: 'Căn cứ Luật Sổ bộ Cư trú Nhật Bản & Dịch vụ Một Cửa Chuyển Nhà MyNaPortal (Digital Agency). Tự động tính toán thời hạn 14 ngày luật định, lập hồ sơ giấy tờ cần chuẩn bị và hướng dẫn nộp đơn 100% đúng luật.',
    sectionSettings: '1. Thiết lập thông tin & điều kiện chuyển nhà',
    moveTypeLabel: 'Hình thức chuyển (Phạm vi hành chính)',
    moveDateLabel: 'Ngày dự kiến dọn vào nhà mới (入居日)',
    myNumberLabel: 'Có thẻ My Number còn hiệu lực (kèm mật khẩu chữ ký điện tử)',
    foreignResidentLabel: 'Người nước ngoài cư trú (Có thành viên mang Thẻ Ngoại Kiều 在留カード)',
    nhiLabel: 'Đang tham gia Bảo hiểm y tế quốc dân (Kokumin Kenko Hoken)',
    pensionLabel: 'Đang tham gia Nenkin Quốc dân Nhóm 1 (Tự do, nghỉ việc, kinh doanh)',
    childrenLabel: 'Có con nhỏ dưới 15 tuổi (Hưởng trợ cấp Jido Teate, viện phí nhi)',
    petsLabel: 'Nuôi chó (Bắt buộc đổi thẻ bài quản lý bệnh dại theo luật)',
    careLabel: 'Có người từ 65 tuổi hoặc người hưởng bảo hiểm điều dưỡng (Kaigo)',
    sectionSummary: '2. Lịch trình & Hạn chót nộp hồ sơ theo Luật định',
    sectionOnestop: '3. Đánh giá Dịch vụ Một Cửa MyNaPortal',
    sectionSteps: '4. Các bước thực hiện thủ tục chi tiết',
    sectionDocs: '5. Danh mục giấy tờ cần mang đến Ủy ban Nhân dân',
    sectionRelated: '6. Công cụ liên kết trong Hệ sinh thái Nhà ở',
    regulatorySectionTitle: 'Căn cứ Pháp lý & Cơ quan Ban hành (Primary Regulatory Sources)',
    todayLabel: 'Thời điểm: Hôm nay',
    deadlineLabel: 'Hạn chót luật định',
    fineNotice: '※ Căn cứ Điều 52 Luật Sổ bộ Cư trú Nhật Bản: Chậm nộp quá 14 ngày không có lý do chính đáng có thể bị Tòa án phạt tiền đến 50.000 Yên.',
  },
  en: {
    toolTitle: 'Japan Moving Administrative Procedure Checker (引越し行政手続きナビ)',
    toolDesc: 'Fully compliant with Japan Resident Basic Book Act (Arts. 22-25) and Digital Agency Moving One-Stop Service. Evaluates statutory 14-day deadlines, required documents, and MyNaPortal online eligibility.',
    sectionSettings: '1. Moving Conditions & Profile',
    moveTypeLabel: 'Moving Scope (Jurisdiction)',
    moveDateLabel: 'Planned Move Date (Move-in date)',
    myNumberLabel: 'Hold valid My Number Card (with active digital certificate)',
    foreignResidentLabel: 'Foreign Resident (Hold Residence Card 在留カード)',
    nhiLabel: 'Enrolled in National Health Insurance (Kokumin Kenko Hoken)',
    pensionLabel: 'Enrolled in National Pension Category 1',
    childrenLabel: 'Children aged 15 or younger (Child Allowance / Child Medical Care)',
    petsLabel: 'Own pet dog (Rabies Prevention Act license registration)',
    careLabel: 'Age 65+ or Long-term Care Insurance certified',
    sectionSummary: '2. Statutory Filing Schedule & Deadlines',
    sectionOnestop: '3. MyNaPortal One-Stop Moving Service Evaluation',
    sectionSteps: '4. Actionable Step-by-step Procedures',
    sectionDocs: '5. Required Documents Checklist for Municipal Office',
    sectionRelated: '6. Related Housing & Moving Tools',
    regulatorySectionTitle: 'Statutory Sources & Regulatory Standards',
    todayLabel: 'Reference: Today',
    deadlineLabel: 'Statutory Filing Deadline',
    fineNotice: '※ Resident Basic Book Act Art. 52: Unexcused failure to file within 14 days may result in a court fine of up to 50,000 JPY.',
  },
};

export default function MovingAdminCheckerView({ lang = 'ja' }) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.ja;

  // Form State
  const [movingType, setMovingType] = useState('different_municipality');
  const [moveDate, setMoveDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7); // Default 1 week ahead
    return d.toISOString().split('T')[0];
  });
  const [hasMyNumberCard, setHasMyNumberCard] = useState(true);
  const [isForeignResident, setIsForeignResident] = useState(true);
  const [hasNationalHealthInsurance, setHasNationalHealthInsurance] = useState(false);
  const [hasNationalPension, setHasNationalPension] = useState(false);
  const [hasChildren, setHasChildren] = useState(false);
  const [hasPetsDog, setHasPetsDog] = useState(false);
  const [hasCareInsurance, setHasCareInsurance] = useState(false);

  // Checked documents in UI
  const [checkedDocs, setCheckedDocs] = useState({});

  // Calculation Result
  const evaluation = useMemo(() => {
    return evaluateMovingAdminProcedures({
      movingType,
      moveDate,
      hasMyNumberCard,
      isForeignResident,
      hasNationalHealthInsurance,
      hasNationalPension,
      hasChildren,
      hasPetsDog,
      hasCareInsurance,
    });
  }, [
    movingType,
    moveDate,
    hasMyNumberCard,
    isForeignResident,
    hasNationalHealthInsurance,
    hasNationalPension,
    hasChildren,
    hasPetsDog,
    hasCareInsurance,
  ]);

  const toggleDoc = (docId) => {
    setCheckedDocs((prev) => ({
      ...prev,
      [docId]: !prev[docId],
    }));
  };

  return (
    <StandardToolLayout
      title={t.toolTitle}
      description={t.toolDesc}
      lang={lang}
      badge="行政手続きナビ"
      badgeColor="#2563eb"
    >
      <div className="space-y-8 max-w-[1240px] mx-auto">
        {/* OVERDUE OR IMMINENT WARNING BANNER */}
        {evaluation.warnings.map((w, idx) => (
          <div
            key={idx}
            className={`p-4 rounded-xl border flex items-start gap-3.5 shadow-sm ${
              w.level === 'danger'
                ? 'bg-rose-500/10 border-rose-500/40 text-rose-900 dark:text-rose-200'
                : w.level === 'warning'
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-900 dark:text-amber-200'
                : 'bg-primary/5 border-primary/30 text-foreground'
            }`}
          >
            {w.level === 'danger' ? (
              <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            ) : w.level === 'warning' ? (
              <AlertCircle className="w-5 h-5 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
            ) : (
              <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <h4 className="text-sm font-bold">
                {lang === 'ja' ? w.titleJa : lang === 'vi' ? w.titleVi : w.titleEn}
              </h4>
              <p className="text-xs opacity-90 leading-relaxed">
                {lang === 'ja' ? w.contentJa : lang === 'vi' ? w.contentVi : w.contentEn}
              </p>
              {w.citation && (
                <p className="text-2xs opacity-75 font-mono pt-1">
                  出典・根拠：{w.citation}
                </p>
              )}
            </div>
          </div>
        ))}

        {/* SECTION 1: SETTINGS & INPUTS */}
        <section className="bg-surface rounded-2xl border border-border/80 p-6 md:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-border/60 pb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">{t.sectionSettings}</h2>
              <p className="text-xs text-muted">
                {lang === 'ja'
                  ? '引越し先の管轄や保有カード、ご家族の状況を選択してください。'
                  : lang === 'vi'
                  ? 'Chọn loại hình chuyển nhà, tình trạng thẻ My Number và thành phần gia đình.'
                  : 'Select your moving jurisdiction, My Number status, and household profile.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Move Type */}
            <div className="space-y-2">
              <label htmlFor="moving-type-select" className="block text-sm font-semibold text-foreground flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                <span>{t.moveTypeLabel}</span>
              </label>
              <select
                id="moving-type-select"
                value={movingType}
                onChange={(e) => setMovingType(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-foreground font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
              >
                {MOVING_TYPES.map((type) => (
                  <option key={type.id} value={type.id}>
                    {lang === 'ja' ? type.nameJa : lang === 'vi' ? type.nameVi : type.nameEn}
                  </option>
                ))}
              </select>
              <p className="text-2xs text-muted">
                {MOVING_TYPES.find((t) => t.id === movingType)?.[lang === 'ja' ? 'descJa' : lang === 'vi' ? 'descVi' : 'descEn']}
              </p>
            </div>

            {/* Move Date */}
            <div className="space-y-2">
              <label htmlFor="moving-date-input" className="block text-sm font-semibold text-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                <span>{t.moveDateLabel}</span>
              </label>
              <input
                id="moving-date-input"
                type="date"
                value={moveDate}
                onChange={(e) => setMoveDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-foreground font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
              />
              <p className="text-2xs text-muted">
                {lang === 'ja'
                  ? '新居で実際に生活を始める日（住民基本台帳法第22条・第23条の起算日）'
                  : lang === 'vi'
                  ? 'Ngày bắt đầu ở thực tế tại nhà mới (Mốc tính 14 ngày theo Luật)'
                  : 'The actual move-in start date (statutory countdown baseline)'}
              </p>
            </div>
          </div>

          {/* Profile Toggles */}
          <div className="pt-4 border-t border-border/60 space-y-4">
            <h3 className="text-xs font-bold text-muted uppercase tracking-wider">
              {lang === 'ja' ? '対象者・保有カード・加入状況' : lang === 'vi' ? 'Đối tượng, Thẻ & Bảo hiểm kèm theo' : 'Profile & Enrollment Status'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {/* My Number Card */}
              <label className="flex items-center gap-3 p-3 rounded-xl border border-border bg-surface/40 hover:bg-surface/80 cursor-pointer transition-all">
                <input
                  type="checkbox"
                  checked={hasMyNumberCard}
                  onChange={(e) => setHasMyNumberCard(e.target.checked)}
                  className="w-4 h-4 rounded text-primary focus:ring-primary border-border"
                />
                <span className="text-xs font-medium text-foreground">
                  {lang === 'ja' ? 'マイナンバーカードあり' : lang === 'vi' ? 'Có Thẻ My Number' : 'Has My Number Card'}
                </span>
              </label>

              {/* Foreign Resident */}
              <label className="flex items-center gap-3 p-3 rounded-xl border border-border bg-surface/40 hover:bg-surface/80 cursor-pointer transition-all">
                <input
                  type="checkbox"
                  checked={isForeignResident}
                  onChange={(e) => setIsForeignResident(e.target.checked)}
                  className="w-4 h-4 rounded text-primary focus:ring-primary border-border"
                />
                <span className="text-xs font-medium text-foreground">
                  {lang === 'ja' ? '外国籍（在留カード所持）' : lang === 'vi' ? 'Người nước ngoài (Thẻ ngoại kiều)' : 'Foreign Resident (Residence Card)'}
                </span>
              </label>

              {/* National Health Insurance */}
              <label className="flex items-center gap-3 p-3 rounded-xl border border-border bg-surface/40 hover:bg-surface/80 cursor-pointer transition-all">
                <input
                  type="checkbox"
                  checked={hasNationalHealthInsurance}
                  onChange={(e) => setHasNationalHealthInsurance(e.target.checked)}
                  className="w-4 h-4 rounded text-primary focus:ring-primary border-border"
                />
                <span className="text-xs font-medium text-foreground">
                  {lang === 'ja' ? '国民健康保険（国保）' : lang === 'vi' ? 'Bảo hiểm Y tế Quốc dân (Kokumin)' : 'National Health Insurance'}
                </span>
              </label>

              {/* National Pension */}
              <label className="flex items-center gap-3 p-3 rounded-xl border border-border bg-surface/40 hover:bg-surface/80 cursor-pointer transition-all">
                <input
                  type="checkbox"
                  checked={hasNationalPension}
                  onChange={(e) => setHasNationalPension(e.target.checked)}
                  className="w-4 h-4 rounded text-primary focus:ring-primary border-border"
                />
                <span className="text-xs font-medium text-foreground">
                  {lang === 'ja' ? '国民年金 第1号被保険者' : lang === 'vi' ? 'Nenkin Quốc dân Nhóm 1' : 'National Pension Category 1'}
                </span>
              </label>

              {/* Children */}
              <label className="flex items-center gap-3 p-3 rounded-xl border border-border bg-surface/40 hover:bg-surface/80 cursor-pointer transition-all">
                <input
                  type="checkbox"
                  checked={hasChildren}
                  onChange={(e) => setHasChildren(e.target.checked)}
                  className="w-4 h-4 rounded text-primary focus:ring-primary border-border"
                />
                <span className="text-xs font-medium text-foreground">
                  {lang === 'ja' ? '子どもあり（15歳以下）' : lang === 'vi' ? 'Có con nhỏ (Dưới 15 tuổi)' : 'Children (15 or younger)'}
                </span>
              </label>

              {/* Pet Dog */}
              <label className="flex items-center gap-3 p-3 rounded-xl border border-border bg-surface/40 hover:bg-surface/80 cursor-pointer transition-all">
                <input
                  type="checkbox"
                  checked={hasPetsDog}
                  onChange={(e) => setHasPetsDog(e.target.checked)}
                  className="w-4 h-4 rounded text-primary focus:ring-primary border-border"
                />
                <span className="text-xs font-medium text-foreground">
                  {lang === 'ja' ? '愛犬を飼育している' : lang === 'vi' ? 'Có nuôi chó cưng' : 'Own Pet Dog'}
                </span>
              </label>
            </div>
          </div>
        </section>

        {/* SECTION 2: STATUTORY DEADLINES DASHBOARD */}
        <section className="bg-surface rounded-2xl border border-border/80 p-6 md:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-border/60 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">{t.sectionSummary}</h2>
                <p className="text-xs text-muted">
                  {lang === 'ja'
                    ? '入居日を起算日とする法律上の提出期限です。'
                    : lang === 'vi'
                    ? 'Thời hạn luật định tính từ ngày chính thức vào ở.'
                    : 'Legally binding filing deadlines based on move-in date.'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                evaluation.deadlines.isOverdue
                  ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30'
                  : 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 border border-emerald-500/30'
              }`}>
                {evaluation.deadlines.isOverdue
                  ? (lang === 'ja' ? '提出期限 超過' : lang === 'vi' ? 'Đã quá hạn' : 'Overdue')
                  : (lang === 'ja' ? `期限まで あと${evaluation.deadlines.daysRemaining}日` : lang === 'vi' ? `Còn ${evaluation.deadlines.daysRemaining} ngày` : `${evaluation.deadlines.daysRemaining} days left`)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Planned Move Date */}
            <div className="p-5 rounded-xl border border-border bg-surface/40 flex flex-col justify-between space-y-2">
              <span className="text-xs font-medium text-muted">
                {lang === 'ja' ? '引越し予定日（入居開始日）' : lang === 'vi' ? 'Ngày dọn đến nhà mới' : 'Planned Move-in Date'}
              </span>
              <div className="text-2xl font-black text-foreground font-mono">
                {evaluation.moveDate}
              </div>
              <span className="text-2xs text-muted">
                {lang === 'ja'
                  ? `本日より ${evaluation.deadlines.daysUntilMove >= 0 ? `${evaluation.deadlines.daysUntilMove}日後` : `${Math.abs(evaluation.deadlines.daysUntilMove)}日前`}`
                  : lang === 'vi'
                  ? `${evaluation.deadlines.daysUntilMove >= 0 ? `Sau hôm nay ${evaluation.deadlines.daysUntilMove} ngày` : `Cách đây ${Math.abs(evaluation.deadlines.daysUntilMove)} ngày`}`
                  : `${evaluation.deadlines.daysUntilMove >= 0 ? `In ${evaluation.deadlines.daysUntilMove} days` : `${Math.abs(evaluation.deadlines.daysUntilMove)} days ago`}`}
              </span>
            </div>

            {/* Tenshutsu Window (if different municipality) */}
            {evaluation.isDifferentMunicipality ? (
              <div className="p-5 rounded-xl border border-border bg-surface/40 flex flex-col justify-between space-y-2">
                <span className="text-xs font-medium text-muted">
                  {lang === 'ja' ? '転出届 受付可能期間' : lang === 'vi' ? 'Khung giờ nộp Giấy chuyển đi (Tenshutsu)' : 'Moving-out Window (Tenshutsu)'}
                </span>
                <div className="text-sm font-bold text-foreground font-mono">
                  {evaluation.deadlines.tenshutsuStart} 〜
                </div>
                <span className="text-2xs text-muted">
                  {lang === 'ja'
                    ? '引越し14日前より受付可能（オンラインまたは旧住所役所）'
                    : lang === 'vi'
                    ? 'Được phép nộp từ 14 ngày trước ngày chuyển'
                    : 'Accepted from 14 days prior to moving day'}
                </span>
              </div>
            ) : (
              <div className="p-5 rounded-xl border border-border bg-surface/40 flex flex-col justify-between space-y-2">
                <span className="text-xs font-medium text-muted">
                  {lang === 'ja' ? '手続き種別' : lang === 'vi' ? 'Loại thủ tục' : 'Procedure Scope'}
                </span>
                <div className="text-lg font-bold text-foreground">
                  {lang === 'ja' ? '同一区市町村内の転居' : lang === 'vi' ? 'Chuyển trong cùng quận' : 'Intra-city Tenkyo'}
                </div>
                <span className="text-2xs text-muted">
                  {lang === 'ja' ? '転出証明書は不要です' : lang === 'vi' ? 'Không cần xin giấy chuyển đi' : 'No moving-out certificate needed'}
                </span>
              </div>
            )}

            {/* Tennyu / Tenkyo Final Deadline */}
            <div className="p-5 rounded-xl border-2 border-primary/40 bg-primary/5 flex flex-col justify-between space-y-2 shadow-sm">
              <span className="text-xs font-bold text-primary uppercase">
                {t.deadlineLabel}（14日以内）
              </span>
              <div className="text-2xl font-black text-foreground font-mono">
                {evaluation.deadlines.finalDeadline}
              </div>
              <span className="text-2xs text-muted">
                {lang === 'ja'
                  ? '住民基本台帳法第22条・第23条（厳守義務）'
                  : lang === 'vi'
                  ? 'Căn cứ Điều 22, 23 Luật Sổ bộ Cư trú (Bắt buộc)'
                  : 'Resident Basic Book Act Arts. 22-23 (Mandatory)'}
              </span>
            </div>
          </div>

          <p className="text-2xs text-muted italic pt-2">
            {t.fineNotice}
          </p>
        </section>

        {/* SECTION 3: MYNAPORTAL ONE-STOP BANNER */}
        <section className="bg-surface rounded-2xl border border-border/80 p-6 md:p-8 shadow-sm space-y-4">
          <div className="flex items-center gap-3 border-b border-border/60 pb-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">{t.sectionOnestop}</h2>
              <p className="text-xs text-muted">
                {lang === 'ja'
                  ? 'デジタル庁が推進するオンライン行政手続きサービスの適合判定結果です。'
                  : lang === 'vi'
                  ? 'Kết quả đối soát tính đủ điều kiện cho Dịch vụ Một Cửa của Cơ quan Kỹ thuật số Nhật Bản.'
                  : 'Eligibility result for the Digital Agency Online Moving One-Stop Service.'}
              </p>
            </div>
          </div>

          <div className={`p-5 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
            evaluation.onestop.eligible
              ? 'border-emerald-500/30 bg-emerald-500/5'
              : 'border-border bg-surface/50'
          }`}>
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  evaluation.onestop.eligible
                    ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-200'
                    : 'bg-muted/20 text-muted'
                }`}>
                  {evaluation.onestop.eligible
                    ? (lang === 'ja' ? 'オンライン完結（転出届）利用可能' : lang === 'vi' ? 'Đủ điều kiện làm online (Tenshutsu)' : 'One-Stop Service Eligible')
                    : (lang === 'ja' ? '窓口手続き対象' : lang === 'vi' ? 'Cần đến quầy ủy ban' : 'Window Appearance Required')}
                </span>
              </div>
              <p className="text-xs text-foreground font-medium leading-relaxed">
                {lang === 'ja'
                  ? evaluation.onestop.reasonJa
                  : lang === 'vi'
                  ? evaluation.onestop.reasonVi
                  : evaluation.onestop.reasonEn}
              </p>
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-2xs text-amber-900 dark:text-amber-200">
                {lang === 'ja'
                  ? evaluation.onestop.importantNoticeJa
                  : lang === 'vi'
                  ? evaluation.onestop.importantNoticeVi
                  : evaluation.onestop.importantNoticeEn}
              </div>
            </div>

            {evaluation.onestop.eligible && (
              <a
                href="https://myna.go.jp/"
                target="_blank"
                rel="noreferrer"
                className="px-5 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-bold flex items-center gap-2 hover:opacity-90 transition-all shrink-0 shadow-sm"
              >
                <span>{lang === 'ja' ? 'マイナポータルを開く' : lang === 'vi' ? 'Mở cổng MyNaPortal' : 'Open MyNaPortal'}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </section>

        {/* SECTION 4: STEP-BY-STEP ACTION PROCEDURE */}
        <section className="bg-surface rounded-2xl border border-border/80 p-6 md:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-border/60 pb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">{t.sectionSteps}</h2>
              <p className="text-xs text-muted">
                {lang === 'ja'
                  ? '引越し前と引越し後の時系列に沿って実行する手続き一覧です。'
                  : lang === 'vi'
                  ? 'Danh sách thủ tục tuần tự trước và sau ngày chuyển nhà.'
                  : 'Chronological checklist of procedures before and after moving.'}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {evaluation.steps.map((step, idx) => (
              <div
                key={step.id}
                className="p-5 rounded-xl border border-border bg-surface/40 hover:bg-surface/80 transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-black flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-sm font-bold text-foreground">
                      {lang === 'ja' ? step.titleJa : lang === 'vi' ? step.titleVi : step.titleEn}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-2xs">
                    <span className="px-2.5 py-0.5 rounded-full bg-surface border border-border text-muted font-medium">
                      {lang === 'ja' ? step.timingLabelJa : lang === 'vi' ? step.timingLabelVi : step.timingLabelEn}
                    </span>
                    {step.isOnline ? (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 font-bold">
                        ONLINE
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-700 dark:text-blue-300 font-bold">
                        {lang === 'ja' ? '窓口来庁' : lang === 'vi' ? 'Ra quầy' : 'In-person'}
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-xs text-muted leading-relaxed pl-8">
                  {lang === 'ja' ? step.guidanceJa : lang === 'vi' ? step.guidanceVi : step.guidanceEn}
                </p>

                <div className="flex items-center justify-between pl-8 pt-1 text-2xs text-muted font-mono">
                  <span>場所：{lang === 'ja' ? step.locationJa : lang === 'vi' ? step.locationVi : step.locationEn}</span>
                  <span>期限目安：{step.deadlineDate}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 5: REQUIRED DOCUMENTS CHECKLIST */}
        <section className="bg-surface rounded-2xl border border-border/80 p-6 md:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-border/60 pb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">{t.sectionDocs}</h2>
              <p className="text-xs text-muted">
                {lang === 'ja'
                  ? '役所窓口での手続き時に持参が必要な書類のリストです。準備できたらチェックしてください。'
                  : lang === 'vi'
                  ? 'Danh sách hồ sơ cần chuẩn bị mang đến quầy ủy ban. Đánh dấu để không bỏ sót.'
                  : 'Checklist of documents to bring to the city hall. Check off as you prepare.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {evaluation.requiredDocuments.map((doc) => {
              const isChecked = Boolean(checkedDocs[doc.id]);
              const docName = lang === 'ja' ? doc.nameJa : lang === 'vi' ? doc.nameVi : doc.nameEn;
              return (
                <label
                  key={doc.id}
                  htmlFor={`doc-check-${doc.id}`}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3 select-none ${
                    isChecked
                      ? 'border-primary/40 bg-primary/5'
                      : 'border-border bg-surface/40 hover:bg-surface/70'
                  }`}
                >
                  <input
                    id={`doc-check-${doc.id}`}
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleDoc(doc.id)}
                    aria-label={docName}
                    className="w-4 h-4 rounded text-primary focus:ring-primary border-border mt-0.5 cursor-pointer"
                  />
                  <div className="space-y-1">
                    <span className={`text-xs font-bold block ${isChecked ? 'text-primary line-through' : 'text-foreground'}`}>
                      {docName}
                    </span>
                    <span className="text-2xs text-muted font-medium block">
                      {doc.mandatory
                        ? (lang === 'ja' ? '【必須】' : lang === 'vi' ? '[Bắt buộc]' : '[Mandatory]')
                        : (lang === 'ja' ? '【該当者のみ】' : lang === 'vi' ? '[Nếu có]' : '[Conditional]')}
                    </span>
                  </div>
                </label>
              );
            })}
          </div>
        </section>

        {/* SECTION 6: RELATED HOUSING TOOLS */}
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
              href="#/tools/address-change-checklist-jp"
              className="p-4 rounded-xl border border-border hover:border-primary/40 bg-surface/50 hover:bg-primary/5 transition-all group block"
            >
              <div className="flex items-center justify-between text-xs font-bold text-foreground group-hover:text-primary">
                <span>{lang === 'ja' ? '住所変更チェックリスト' : lang === 'vi' ? 'Checklist Đổi Địa Chỉ Đa Kênh' : 'Address Change Checklist'}</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-2xs text-muted mt-1.5">
                {lang === 'ja'
                  ? '日本郵便e転居・電気・ガス・水道・ネット・銀行・運転免許証の変更管理。'
                  : lang === 'vi'
                  ? 'Quản lý chuyển tiếp bưu điện 1 năm (e-Tenkyo), điện ga nước, ngân hàng và bằng lái.'
                  : 'Japan Post 1-year forwarding (e-Tenkyo), lifelines, banks, and driver license.'}
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
                  ? 'Life Event Foundationに基づく1ヶ月前からの総合タイムラインと進行管理。'
                  : lang === 'vi'
                  ? 'Lộ trình chuyển dọn toàn diện từ 1 tháng trước tới sau chuyển trên Life Event Runtime.'
                  : 'Comprehensive 1-month-prior moving journey built on Life Event Foundation.'}
              </p>
            </a>
          </div>
        </section>

        {/* SECTION 7: PRIMARY REGULATORY SOURCES */}
        <section className="bg-surface rounded-2xl border border-border/80 p-6 md:p-8 shadow-sm space-y-4">
          <div className="flex items-center gap-3 border-b border-border/60 pb-3">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <h2 className="text-md font-bold text-foreground">{t.regulatorySectionTitle}</h2>
          </div>
          <RegulatorySourceView sourceIds={MOVING_ADMIN_SOURCES} lang={lang} />
        </section>
      </div>
    </StandardToolLayout>
  );
}
