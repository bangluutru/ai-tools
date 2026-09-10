/**
 * @file packages/core/src/components/family/ChildcareLeaveEligibilityView.jsx
 * @description
 * Giao diện Chẩn đoán Điều kiện Nghỉ chăm con & Trợ cấp BHTN Nhật Bản (育児休業・給付チェッカー).
 * Tuân thủ triệt để MAIS Gate 2 & Gate 4: WCAG 2.1 AA (contrast >= 4.5:1, explicit labels & accessible names).
 */

import React, { useState, useMemo } from 'react';
import {
  Users,
  Baby,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Info,
  Building2,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

import StandardToolLayout from '../shared/StandardToolLayout.jsx';
import RegulatorySourceView from '../regulatory/RegulatorySourceView.jsx';
import {
  checkChildcareLeaveEligibility,
  ELIGIBILITY_STATUS,
  CHILDCARE_LEAVE_SOURCES,
} from '../../japan/family/index.js';

const TRANSLATIONS = {
  ja: {
    toolTitle: '育児休業・給付チェッカー（育休権利＆雇用保険4給付診断）',
    toolDesc: '育児・介護休業法に基づく「育児休業の取得権利」と、雇用保険法に基づく「4つの育児給付金（産後パパ育休・休業支援加算・時短就業給付等）」の受給資格を判定します。',
    sectionInput: '1. ご本人・雇用状況および休業条件の設定',
    roleLabel: 'あなたのお立場（申請者）',
    roleMother: '母親（実母）',
    roleFather: '父親（実父・配偶者）',
    roleAdoptive: '養親・その他',
    employmentLabel: '現在の雇用形態',
    empRegular: '正社員（無期雇用）',
    empFixedTerm: '契約社員・有期雇用労働者',
    empDispatch: '派遣社員・パート・アルバイト',
    empFreelance: '自営業・フリーランス',
    empUnemployed: '現在無職・求職中',
    fixedTermRenewalLabel: '子が1歳6ヶ月に達する日までに労働契約が満了し更新されないことが明らかですか？',
    fixedTermRenewalNo: 'いいえ（契約更新の見込みがある、または満了しない）',
    fixedTermRenewalYes: 'はい（1歳6ヶ月までに確実に退職・更新終了する）',
    insuranceEnrollmentLabel: '雇用保険に加入していますか？',
    insuranceEnrolledYes: '加入している（給与明細に雇用保険料の控除がある）',
    insuranceEnrolledNo: '加入していない（対象外）',
    insuredTenureLabel: '過去2年間の雇用保険被保険者期間（月11日以上勤務した月数）',
    insuredTenure12Plus: '通算12ヶ月以上（標準要件を満たす）',
    insuredTenureUnder12: '通算12ヶ月未満（原則として給付金受給不可）',
    sectionChild: '2. お子様の月齢と保育状況',
    childAgeLabel: 'お子様の現在の月齢（または予定）',
    childAgeMonthsUnit: 'ヶ月',
    daycareRejectedLabel: '1歳または1歳6ヶ月の時点で認可保育所の不承諾通知（落選通知）がありますか？',
    daycareRejectedYes: 'はい（認可保育所の入所保留・不承諾通知あり）',
    daycareRejectedNo: 'いいえ（申込み中、または未申込み・受入枠あり）',
    postBirthDaysLabel: '出生直後に取得予定の休業日数（パパ育休等）',
    postBirthDaysHint: '※ 14日以上休業すると出生後休業支援給付金（13％手取り加算）の判定対象となります。',
    sectionSpouse: '3. 配偶者の状況（出生後休業支援加算の判定）',
    spouseLeaveLabel: '配偶者も出生直後（子の生後8週以内等）に14日以上の育児休業を取得しますか？',
    spouseLeaveYes: 'はい（配偶者も14日以上休業する）',
    spouseLeaveNo: 'いいえ（取得しない、または14日未満）',
    spouseExceptionLabel: '配偶者の例外要件に該当しますか？',
    spouseExceptionNone: '該当しない（通常の共働き）',
    spouseExceptionSingle: 'ひとり親家庭である',
    spouseExceptionUnemployed: '配偶者が専業主婦・主夫または無業者である',
    spouseExceptionIncapacitated: '配偶者が重度の心身障害・疾病により養育が困難である',
    sectionWorkReturn: '4. 復職と短時間勤務（育児時短就業給付金）',
    shortTimeWorkLabel: '復職後に2歳未満の子を育てるため短時間勤務（時短勤務）を行いますか？',
    shortTimeWorkYes: 'はい（時短勤務で賃金が低下する予定）',
    shortTimeWorkNo: 'いいえ（フルタイム復帰、または未定）',
    sectionResults: '5. 診断結果サマリー',
    statutoryLeaveTitle: '法律に基づく「育児休業の取得権利」（育児・介護休業法）',
    schemesTitle: '雇用保険「4つの育児給付金」の受給診断結果（雇用保険法）',
    statusEligible: '受給可能性：高（要件充足）',
    statusNotEligible: '受給要件未達（対象外）',
    statusNeedsConfirm: '要確認（追加手続き・書類が必要）',
    statusNotApplicable: '現在は対象外',
    rateHint: '給付率・支援目安：',
    officialDisclaimerTitle: '【公的機関での最終確認に関するご案内】',
    officialDisclaimerText: '当ツールによる診断結果は入力情報に基づくシミュレーションであり、公的な受給資格を法的に保証するものではありません。育児休業給付の最終的な受給要件の確認および支給決定は、勤務先を管轄するハローワーク（公共職業安定所）が行います。',
    relatedToolsTitle: '関連する子育て支援ツール',
    linkMaternity: '出産手当金シミュレーター（健康保険の産前産後休業手当）',
    linkChildcareBenefit: '育児休業給付金シミュレーター（支給額の試算）',
    linkChildAllowance: '児童手当チェッカー（2024年10月抜本拡充対応）',
    linkBirthWizard: '妊娠・出産・育児ガイド（Life-Event Orchestrator）',
  },
  vi: {
    toolTitle: 'Chẩn Đoán Nghỉ Chăm Con & Trợ Cấp BHTN Nhật Bản (育児休業・給付チェッカー)',
    toolDesc: 'Đánh giá quyền nghỉ việc chăm con theo Luật Nghỉ chăm sóc gia đình và điều kiện nhận 4 chế độ trợ cấp nghỉ chăm con của Bảo hiểm Thất nghiệp (産後パパ育休, thưởng thêm 13%, trợ cấp rút ngắn giờ).',
    sectionInput: '1. Thiết lập vai trò & Tình trạng việc làm',
    roleLabel: 'Vai trò của bạn (Người làm đơn)',
    roleMother: 'Người mẹ (Mẹ ruột)',
    roleFather: 'Người bố (Bố ruột / Người phối ngẫu)',
    roleAdoptive: 'Bố mẹ nuôi / Người giám hộ khác',
    employmentLabel: 'Loại hình hợp đồng lao động',
    empRegular: 'Nhân viên chính thức (Chính quy - 正社員)',
    empFixedTerm: 'Hợp đồng có thời hạn (Hạn định - 契約社員)',
    empDispatch: 'Phái cử / Bán thời gian (派遣・パート・バイト)',
    empFreelance: 'Tự do / Kinh doanh cá thể (自営業・フリーランス)',
    empUnemployed: 'Đang thất nghiệp / Chưa đi làm',
    fixedTermRenewalLabel: 'Hợp đồng lao động có thời hạn của bạn có bị chấm dứt và chắc chắn KHÔNG được tái ký trước khi con 1.5 tuổi không?',
    fixedTermRenewalNo: 'Không (Có triển vọng tái ký hợp đồng tiếp tục)',
    fixedTermRenewalYes: 'Có (Chắc chắn hết hạn hợp đồng trước khi con 1.5 tuổi)',
    insuranceEnrollmentLabel: 'Bạn có tham gia Bảo hiểm Thất nghiệp (雇用保険) không?',
    insuranceEnrolledYes: 'Có tham gia (Bị trừ tiền BHTN hàng tháng trên phiếu lương)',
    insuranceEnrolledNo: 'Không tham gia (Không đóng BHTN)',
    insuredTenureLabel: 'Số tháng đóng BHTN có từ 11 ngày làm việc trở lên trong 2 năm qua',
    insuredTenure12Plus: 'Từ 12 tháng trở lên (Đạt điều kiện chuẩn)',
    insuredTenureUnder12: 'Dưới 12 tháng (Chưa đủ điều kiện nhận trợ cấp BHTN)',
    sectionChild: '2. Độ tuổi của con & Tình trạng nhà trẻ',
    childAgeLabel: 'Số tháng tuổi hiện tại của con (hoặc dự kiến)',
    childAgeMonthsUnit: 'tháng tuổi',
    daycareRejectedLabel: 'Khi con tròn 1 tuổi hoặc 1.5 tuổi, bạn có Giấy báo trượt nhà trẻ công lập (不承諾通知書) không?',
    daycareRejectedYes: 'Có giấy báo trượt nhà trẻ công lập (Đang chờ slot)',
    daycareRejectedNo: 'Không có (Đang nộp hồ sơ, hoặc chưa xin/đã trúng tuyển)',
    postBirthDaysLabel: 'Số ngày dự định xin nghỉ sau sinh (áp dụng cho bố hoặc giai đoạn đầu)',
    postBirthDaysHint: '※ Nghỉ từ 14 ngày trở lên sẽ được xét duyệt khoản Thưởng hỗ trợ sau sinh (cộng thêm 13% lương ngày).',
    sectionSpouse: '3. Tình trạng người phối ngẫu (Xét thưởng thêm 13%)',
    spouseLeaveLabel: 'Người phối ngẫu (vợ/chồng) có cùng nghỉ chăm con từ 14 ngày trở lên trong 8 tuần đầu không?',
    spouseLeaveYes: 'Có (Vợ/chồng cũng nghỉ từ 14 ngày trở lên)',
    spouseLeaveNo: 'Không (Không nghỉ, hoặc nghỉ dưới 14 ngày)',
    spouseExceptionLabel: 'Bạn có thuộc diện ngoại lệ người phối ngẫu không?',
    spouseExceptionNone: 'Không thuộc diện ngoại lệ (Cả hai cùng đi làm bình thường)',
    spouseExceptionSingle: 'Gia đình bố/mẹ đơn thân (ひとり親)',
    spouseExceptionUnemployed: 'Vợ/chồng làm nội trợ toàn thời gian hoặc không đi làm',
    spouseExceptionIncapacitated: 'Vợ/chồng bị bệnh nặng / khuyết tật không thể chăm sóc con',
    sectionWorkReturn: '4. Kế hoạch đi làm lại & Rút ngắn giờ làm',
    shortTimeWorkLabel: 'Sau khi đi làm lại, bạn có rút ngắn thời gian làm việc (時短勤務) để nuôi con dưới 2 tuổi không?',
    shortTimeWorkYes: 'Có (Rút ngắn giờ làm và lương bị giảm tương ứng)',
    shortTimeWorkNo: 'Không (Đi làm toàn thời gian hoặc chưa có kế hoạch)',
    sectionResults: '5. Kết quả chẩn đoán quyền lợi',
    statutoryLeaveTitle: 'Quyền nghỉ việc chăm con theo Luật Lao động (育児・介護休業法)',
    schemesTitle: 'Chẩn đoán 4 Chế độ Trợ cấp Nghỉ chăm con BHTN (雇用保険法)',
    statusEligible: 'Khả năng cao đủ điều kiện (Đạt tiêu chuẩn)',
    statusNotEligible: 'Chưa đủ điều kiện theo quy định',
    statusNeedsConfirm: 'Cần xác nhận bổ sung hồ sơ tại Hello Work',
    statusNotApplicable: 'Hiện tại không áp dụng ở giai đoạn này',
    rateHint: 'Mức trợ cấp tham chiếu:',
    officialDisclaimerTitle: '【LƯU Ý VỀ TÍNH PHÁP LÝ HÀNH CHÍNH】',
    officialDisclaimerText: 'Kết quả đánh giá trên hệ thống Toolio là công cụ hỗ trợ thông tin tham khảo dựa trên dữ liệu bạn cung cấp, không thay thế văn bản phê duyệt hành chính. Quyết định phê duyệt tư cách nhận trợ cấp BHTN chính thức thuộc thẩm quyền của Trung tâm Giới thiệu Việc làm công (Hello Work - ハローワーク).',
    relatedToolsTitle: 'Các công cụ hỗ trợ gia đình liên quan',
    linkMaternity: 'Mô phỏng Trợ cấp Thai sản BHYT (出産手当金)',
    linkChildcareBenefit: 'Mô phỏng Số tiền Trợ cấp Nghỉ chăm con (育児休業給付金)',
    linkChildAllowance: 'Kiểm tra Trợ cấp Trẻ em (児童手当 - Cải cách 10/2024)',
    linkBirthWizard: 'Cẩm nang Thai sản & Trẻ em Toàn diện (Birth Wizard)',
  },
  en: {
    toolTitle: 'Japan Childcare Leave & Benefit Checker (育児休業・給付チェッカー)',
    toolDesc: 'Diagnoses statutory childcare leave entitlement under labor law and eligibility for the 4 Employment Insurance benefit schemes (standard, Papa Ikukyu, post-birth bonus, short-time work).',
    sectionInput: '1. Applicant & Employment Profile',
    roleLabel: 'Your Role (Applicant)',
    roleMother: 'Mother (Biological)',
    roleFather: 'Father (Biological / Spouse)',
    roleAdoptive: 'Adoptive parent / Guardian',
    employmentLabel: 'Employment Status',
    empRegular: 'Regular Employee (Permanent)',
    empFixedTerm: 'Fixed-term Contract Employee',
    empDispatch: 'Temporary / Dispatch / Part-time',
    empFreelance: 'Self-employed / Freelancer',
    empUnemployed: 'Unemployed / Seeking Work',
    fixedTermRenewalLabel: 'Is your fixed-term contract scheduled to end and confirmed NOT to be renewed before the child turns 1.5 years?',
    fixedTermRenewalNo: 'No (Contract renewable or continuing)',
    fixedTermRenewalYes: 'Yes (Definitively ending before 1.5 years)',
    insuranceEnrollmentLabel: 'Are you enrolled in Employment Insurance (雇用保険)?',
    insuranceEnrolledYes: 'Yes (Enrolled & deducted from monthly pay)',
    insuranceEnrolledNo: 'No (Not enrolled)',
    insuredTenureLabel: 'Qualifying insured months in past 2 years (months with >= 11 working days)',
    insuredTenure12Plus: '12 months or more (Meets standard criteria)',
    insuredTenureUnder12: 'Under 12 months (Insufficient insured history)',
    sectionChild: '2. Child Age & Care Situation',
    childAgeLabel: 'Current child age in months (or expected)',
    childAgeMonthsUnit: 'months',
    daycareRejectedLabel: 'At age 1 or 1.5, do you possess an official public daycare waitlist rejection notice (不承諾通知書)?',
    daycareRejectedYes: 'Yes (Official rejection / waitlist notice held)',
    daycareRejectedNo: 'No (Pending application, enrolled, or not applied)',
    postBirthDaysLabel: 'Planned leave days immediately after birth (Papa Ikukyu)',
    postBirthDaysHint: '※ Taking 14+ days qualifies you for evaluation under the Post-birth Support Bonus (+13% wage base).',
    sectionSpouse: '3. Spouse Profile (Post-birth Support Bonus Evaluation)',
    spouseLeaveLabel: 'Does your spouse also take at least 14 days of childcare leave within 8 weeks of birth?',
    spouseLeaveYes: 'Yes (Spouse takes 14+ days qualifying leave)',
    spouseLeaveNo: 'No (Spouse takes less than 14 days or none)',
    spouseExceptionLabel: 'Do you qualify under statutory spouse exception criteria?',
    spouseExceptionNone: 'None (Standard dual-earner couple)',
    spouseExceptionSingle: 'Single parent household',
    spouseExceptionUnemployed: 'Spouse is a full-time homemaker or unemployed',
    spouseExceptionIncapacitated: 'Spouse incapacitated due to severe illness/disability',
    sectionWorkReturn: '4. Return to Work & Short-time Work Scheme',
    shortTimeWorkLabel: 'Will you return to work under reduced hours (時短勤務) caring for a child under 2 years old?',
    shortTimeWorkYes: 'Yes (Returning on reduced hours with lower wages)',
    shortTimeWorkNo: 'No (Returning full-time or undecided)',
    sectionResults: '5. Assessment Summary',
    statutoryLeaveTitle: 'Statutory Childcare Leave Entitlement (Labor Law)',
    schemesTitle: 'Employment Insurance 4 Benefit Schemes Evaluation',
    statusEligible: 'Likely Eligible (Requirements Satisfied)',
    statusNotEligible: 'Requirements Not Met (Ineligible)',
    statusNeedsConfirm: 'Needs Confirmation at Hello Work',
    statusNotApplicable: 'Not Applicable at this Stage',
    rateHint: 'Statutory Benefit Rate:',
    officialDisclaimerTitle: '【OFFICIAL ADMINISTRATIVE JURISDICTION NOTICE】',
    officialDisclaimerText: 'This simulation tool provides informational assessments based on your inputs and does not constitute official approval. Final determination and disbursement authority rests exclusively with your regional Hello Work (Public Employment Security Office).',
    relatedToolsTitle: 'Related Family & Child Support Tools',
    linkMaternity: 'Maternity Allowance Simulator (Health Insurance Daily Benefit)',
    linkChildcareBenefit: 'Childcare Leave Benefit Simulator (Payment Estimation)',
    linkChildAllowance: 'Child Allowance Checker (Oct 2024 Expansion Compliant)',
    linkBirthWizard: 'Birth & Childcare Guide (Life-Event Orchestrator)',
  },
};

export default function ChildcareLeaveEligibilityView({ lang = 'ja' }) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.ja;

  // Form State
  const [userRole, setUserRole] = useState('mother');
  const [employmentStatus, setEmploymentStatus] = useState('regular');
  const [isFixedTermRenewable, setIsFixedTermRenewable] = useState(true);
  const [isEnrolledInsurance, setIsEnrolledInsurance] = useState(true);
  const [insuredTenureMode, setInsuredTenureMode] = useState('12_plus');
  const [childAgeMonths, setChildAgeMonths] = useState(2);
  const [isDaycareRejected, setIsDaycareRejected] = useState(false);
  const [postBirthLeaveDays, setPostBirthLeaveDays] = useState(14);
  const [spouseTakesLeave, setSpouseTakesLeave] = useState(false);
  const [spouseExceptionType, setSpouseExceptionType] = useState('none');
  const [isShortTimeWork, setIsShortTimeWork] = useState(false);

  // Engine evaluation
  const result = useMemo(() => {
    return checkChildcareLeaveEligibility({
      userRole,
      employmentStatus,
      isFixedTermContractRenewable: isFixedTermRenewable,
      isEnrolledEmploymentInsurance: isEnrolledInsurance,
      employmentInsuranceMonthsInPast2Years: insuredTenureMode === '12_plus' ? 18 : 6,
      childAgeMonths,
      isDaycareRejected,
      isRequestingPostBirthPapaIkukyu: userRole === 'father' && childAgeMonths <= 2,
      postBirthLeaveDays,
      spouseStatus: {
        takesQualifyingLeave: spouseTakesLeave,
        isException: spouseExceptionType !== 'none',
        exceptionType: spouseExceptionType,
      },
      isShortTimeWork,
      isReturningToWork: isShortTimeWork,
    });
  }, [
    userRole,
    employmentStatus,
    isFixedTermRenewable,
    isEnrolledInsurance,
    insuredTenureMode,
    childAgeMonths,
    isDaycareRejected,
    postBirthLeaveDays,
    spouseTakesLeave,
    spouseExceptionType,
    isShortTimeWork,
  ]);

  // Helper for status styling & badges with strict WCAG AA contrast (>= 4.5:1)
  const getStatusBadge = (status) => {
    switch (status) {
      case ELIGIBILITY_STATUS.LIKELY_ELIGIBLE:
        return {
          label: t.statusEligible,
          bg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-800 dark:text-emerald-300',
          icon: CheckCircle2,
          color: 'text-emerald-700 dark:text-emerald-400',
        };
      case ELIGIBILITY_STATUS.NEEDS_CONFIRMATION:
        return {
          label: t.statusNeedsConfirm,
          bg: 'bg-amber-500/20 border-amber-500/30 text-amber-900 dark:text-amber-200',
          icon: AlertTriangle,
          color: 'text-amber-800 dark:text-amber-300',
        };
      case ELIGIBILITY_STATUS.LIKELY_NOT_ELIGIBLE:
        return {
          label: t.statusNotEligible,
          bg: 'bg-rose-500/15 border-rose-500/30 text-rose-800 dark:text-rose-300',
          icon: XCircle,
          color: 'text-rose-700 dark:text-rose-400',
        };
      case ELIGIBILITY_STATUS.NOT_APPLICABLE:
      default:
        return {
          label: t.statusNotApplicable,
          bg: 'bg-muted border-border text-muted-foreground',
          icon: HelpCircle,
          color: 'text-muted-foreground',
        };
    }
  };

  const getReasonText = (item) => {
    if (!item) return '';
    if (lang === 'vi') return item.reasonVi || item.reasonJa;
    if (lang === 'en') return item.reasonEn || item.reasonJa;
    return item.reasonJa;
  };

  const getSchemeDescription = (scheme) => {
    if (!scheme) return '';
    if (lang === 'vi') return scheme.descriptionVi || scheme.descriptionJa;
    if (lang === 'en') return scheme.descriptionEn || scheme.descriptionJa;
    return scheme.descriptionJa;
  };

  const getSchemeName = (scheme) => {
    if (!scheme) return '';
    if (lang === 'vi') return scheme.nameVi;
    if (lang === 'en') return scheme.nameEn;
    return scheme.nameJa;
  };

  const leaveBadge = getStatusBadge(result.statutoryLeaveRight.status);
  const LeaveIcon = leaveBadge.icon;

  return (
    <StandardToolLayout
      title={t.toolTitle}
      description={t.toolDesc}
      badge="Japan Life • Family & Child"
      maxWidth="max-w-[1240px]"
    >
      <div className="space-y-8 max-w-full overflow-hidden">
        {/* TOP BANNER: DISTINCTION BETWEEN LEAVE RIGHT & EMPLOYMENT INSURANCE BENEFIT */}
        <div className="p-4 sm:p-5 rounded-2xl bg-blue-500/10 border border-blue-500/25 flex items-start gap-3.5">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
          <div className="space-y-1 text-xs sm:text-sm">
            <h3 className="font-bold text-blue-900 dark:text-blue-200">
              {lang === 'vi'
                ? 'Phân định 2 tầng pháp lý: Quyền nghỉ việc (Luật Lao động) & Tiền trợ cấp (Bảo hiểm Thất nghiệp)'
                : lang === 'en'
                ? 'Two Legal Tiers: Statutory Leave Entitlement (Labor Law) vs Monetary Benefits (Employment Insurance)'
                : '【2層構造】労働基準・育介法上の「休業の権利」と雇用保険上の「4つの給付金」'}
            </h3>
            <p className="text-blue-800 dark:text-blue-300 leading-relaxed">
              {lang === 'vi'
                ? 'Quyền được nghỉ việc chăm con mà không bị sa thải (bảo vệ việc làm) áp dụng cho người lao động theo Luật Nghỉ chăm con. Trong khi đó, 4 khoản tiền trợ cấp nuôi con được chi trả riêng biệt từ Quỹ Bảo hiểm Thất nghiệp (雇用保険) với điều kiện đóng bảo hiểm từ 12 tháng trở lên.'
                : lang === 'en'
                ? 'The right to take job-protected childcare leave without dismissal is governed by the Childcare and Caregiver Leave Act. Separately, the 4 monetary childcare benefits are funded by Employment Insurance, requiring at least 12 qualifying insured months.'
                : '会社を休む権利（育児休業）と、休業中にお金を受け取る権利（育児休業等給付）は別の法律に基づきます。当ツールは両方の要件を個別に判定します。'}
            </p>
          </div>
        </div>

        {/* INPUT ACCORDIONS / SECTIONS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* SECTION 1: ROLE & EMPLOYMENT */}
          <div className="bg-surface rounded-2xl border border-border p-5 sm:p-6 space-y-5 shadow-sm">
            <div className="flex items-center gap-2.5 pb-3 border-b border-border/60">
              <Users className="w-5 h-5 text-indigo-700 dark:text-indigo-400" />
              <h2 className="font-bold text-base sm:text-lg text-foreground">
                {t.sectionInput}
              </h2>
            </div>

            {/* User Role */}
            <div className="space-y-2">
              <span className="block text-xs sm:text-sm font-semibold text-foreground">
                {t.roleLabel}
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'mother', label: t.roleMother },
                  { id: 'father', label: t.roleFather },
                  { id: 'adoptive_parent', label: t.roleAdoptive },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setUserRole(item.id)}
                    className={`py-2 px-2.5 text-xs sm:text-sm font-medium rounded-xl border transition-all text-center ${
                      userRole === item.id
                        ? 'bg-indigo-700 dark:bg-indigo-600 text-white border-indigo-700 dark:border-indigo-600 shadow-sm'
                        : 'bg-background text-foreground border-border hover:bg-muted'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Employment Status */}
            <div className="space-y-2">
              <label htmlFor="employment-status-select" className="block text-xs sm:text-sm font-semibold text-foreground">
                {t.employmentLabel}
              </label>
              <select
                id="employment-status-select"
                aria-label={t.employmentLabel}
                value={employmentStatus}
                onChange={(e) => setEmploymentStatus(e.target.value)}
                className="w-full py-2.5 px-3 rounded-xl border border-border bg-background text-foreground text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="regular">{t.empRegular}</option>
                <option value="fixed_term">{t.empFixedTerm}</option>
                <option value="temporary_dispatch">{t.empDispatch}</option>
                <option value="self_employed_freelance">{t.empFreelance}</option>
                <option value="unemployed">{t.empUnemployed}</option>
              </select>
            </div>

            {/* If Fixed-Term Contract */}
            {employmentStatus === 'fixed_term' && (
              <div className="p-3.5 rounded-xl bg-amber-500/20 border border-amber-500/30 space-y-2 text-xs">
                <p className="font-semibold text-amber-900 dark:text-amber-200">
                  {t.fixedTermRenewalLabel}
                </p>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 cursor-pointer text-foreground">
                    <input
                      type="radio"
                      name="fixedTermRenew"
                      checked={isFixedTermRenewable}
                      onChange={() => setIsFixedTermRenewable(true)}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>{t.fixedTermRenewalNo}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-foreground">
                    <input
                      type="radio"
                      name="fixedTermRenew"
                      checked={!isFixedTermRenewable}
                      onChange={() => setIsFixedTermRenewable(false)}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>{t.fixedTermRenewalYes}</span>
                  </label>
                </div>
              </div>
            )}

            {/* Employment Insurance Status */}
            {employmentStatus !== 'self_employed_freelance' && employmentStatus !== 'unemployed' && (
              <>
                <div className="space-y-2">
                  <span className="block text-xs sm:text-sm font-semibold text-foreground">
                    {t.insuranceEnrollmentLabel}
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEnrolledInsurance(true)}
                      className={`py-2 px-3 text-xs sm:text-sm font-medium rounded-xl border text-center transition-all ${
                        isEnrolledInsurance
                          ? 'bg-indigo-700 dark:bg-indigo-600 text-white border-indigo-700 dark:border-indigo-600 shadow-sm'
                          : 'bg-background text-foreground border-border'
                      }`}
                    >
                      {t.insuranceEnrolledYes}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEnrolledInsurance(false)}
                      className={`py-2 px-3 text-xs sm:text-sm font-medium rounded-xl border text-center transition-all ${
                        !isEnrolledInsurance
                          ? 'bg-rose-700 dark:bg-rose-600 text-white border-rose-700 dark:border-rose-600 shadow-sm'
                          : 'bg-background text-foreground border-border'
                      }`}
                    >
                      {t.insuranceEnrolledNo}
                    </button>
                  </div>
                </div>

                {isEnrolledInsurance && (
                  <div className="space-y-2">
                    <label htmlFor="insured-tenure-select" className="block text-xs sm:text-sm font-semibold text-foreground">
                      {t.insuredTenureLabel}
                    </label>
                    <select
                      id="insured-tenure-select"
                      aria-label={t.insuredTenureLabel}
                      value={insuredTenureMode}
                      onChange={(e) => setInsuredTenureMode(e.target.value)}
                      className="w-full py-2.5 px-3 rounded-xl border border-border bg-background text-foreground text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="12_plus">{t.insuredTenure12Plus}</option>
                      <option value="under_12">{t.insuredTenureUnder12}</option>
                    </select>
                  </div>
                )}
              </>
            )}
          </div>

          {/* SECTION 2 & 3: CHILD & SPOUSE */}
          <div className="space-y-6">
            {/* CHILD AGE & CARE SITUATION */}
            <div className="bg-surface rounded-2xl border border-border p-5 sm:p-6 space-y-5 shadow-sm">
              <div className="flex items-center gap-2.5 pb-3 border-b border-border/60">
                <Baby className="w-5 h-5 text-pink-700 dark:text-pink-400" />
                <h2 className="font-bold text-base sm:text-lg text-foreground">
                  {t.sectionChild}
                </h2>
              </div>

              {/* Child Age Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="child-age-slider" className="text-xs sm:text-sm font-semibold text-foreground">
                    {t.childAgeLabel}
                  </label>
                  <span className="text-xs sm:text-sm font-bold text-pink-800 dark:text-pink-300 bg-pink-500/15 px-2.5 py-0.5 rounded-full border border-pink-500/20">
                    {childAgeMonths} {t.childAgeMonthsUnit}
                  </span>
                </div>
                <input
                  id="child-age-slider"
                  aria-label={t.childAgeLabel}
                  type="range"
                  min="0"
                  max="26"
                  step="1"
                  value={childAgeMonths}
                  onChange={(e) => setChildAgeMonths(Number(e.target.value))}
                  className="w-full accent-pink-600 cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>0m</span>
                  <span>6m</span>
                  <span>12m (1歳)</span>
                  <span>18m (1.5歳)</span>
                  <span>24m+ (2歳)</span>
                </div>
              </div>

              {/* Daycare Rejection Check (for age >= 12) */}
              {childAgeMonths >= 12 && childAgeMonths < 24 && (
                <div className="p-3.5 rounded-xl bg-amber-500/20 border border-amber-500/30 space-y-2 text-xs">
                  <p className="font-semibold text-amber-900 dark:text-amber-200">
                    {t.daycareRejectedLabel}
                  </p>
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 cursor-pointer text-foreground">
                      <input
                        type="radio"
                        name="daycareRejected"
                        checked={isDaycareRejected}
                        onChange={() => setIsDaycareRejected(true)}
                        className="text-pink-600 focus:ring-pink-500"
                      />
                      <span>{t.daycareRejectedYes}</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-foreground">
                      <input
                        type="radio"
                        name="daycareRejected"
                        checked={!isDaycareRejected}
                        onChange={() => setIsDaycareRejected(false)}
                        className="text-pink-600 focus:ring-pink-500"
                      />
                      <span>{t.daycareRejectedNo}</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Post-birth leave days (for <= 2 months) */}
              {childAgeMonths <= 2 && (
                <div className="space-y-2">
                  <label htmlFor="post-birth-leave-input" className="block text-xs sm:text-sm font-semibold text-foreground">
                    {t.postBirthDaysLabel}
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      id="post-birth-leave-input"
                      aria-label={t.postBirthDaysLabel}
                      type="number"
                      min="0"
                      max="56"
                      value={postBirthLeaveDays}
                      onChange={(e) => setPostBirthLeaveDays(Number(e.target.value))}
                      className="w-32 py-2 px-3 rounded-xl border border-border bg-background text-foreground text-xs sm:text-sm focus:ring-2 focus:ring-pink-500 focus:outline-none"
                    />
                    <span className="text-xs sm:text-sm text-muted-foreground">
                      日（days）
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {t.postBirthDaysHint}
                  </p>
                </div>
              )}
            </div>

            {/* SPOUSE STATUS (13% BONUS EVALUATION) */}
            <div className="bg-surface rounded-2xl border border-border p-5 sm:p-6 space-y-4 shadow-sm">
              <div className="flex items-center gap-2.5 pb-3 border-b border-border/60">
                <Sparkles className="w-5 h-5 text-amber-800 dark:text-amber-400" />
                <h2 className="font-bold text-base sm:text-lg text-foreground">
                  {t.sectionSpouse}
                </h2>
              </div>

              {/* Spouse Leave >= 14 days */}
              <div className="space-y-2">
                <span className="block text-xs sm:text-sm font-semibold text-foreground">
                  {t.spouseLeaveLabel}
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSpouseTakesLeave(true)}
                    className={`py-2 px-3 text-xs sm:text-sm font-medium rounded-xl border text-center transition-all ${
                      spouseTakesLeave
                        ? 'bg-amber-700 dark:bg-amber-600 text-white border-amber-700 dark:border-amber-600 shadow-sm'
                        : 'bg-background text-foreground border-border'
                    }`}
                  >
                    {t.spouseLeaveYes}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSpouseTakesLeave(false)}
                    className={`py-2 px-3 text-xs sm:text-sm font-medium rounded-xl border text-center transition-all ${
                      !spouseTakesLeave
                        ? 'bg-slate-700 dark:bg-slate-600 text-white border-slate-700 dark:border-slate-600 shadow-sm'
                        : 'bg-background text-foreground border-border'
                    }`}
                  >
                    {t.spouseLeaveNo}
                  </button>
                </div>
              </div>

              {/* Spouse Exception Selection */}
              {!spouseTakesLeave && (
                <div className="space-y-2">
                  <label htmlFor="spouse-exception-select" className="block text-xs sm:text-sm font-semibold text-foreground">
                    {t.spouseExceptionLabel}
                  </label>
                  <select
                    id="spouse-exception-select"
                    aria-label={t.spouseExceptionLabel}
                    value={spouseExceptionType}
                    onChange={(e) => setSpouseExceptionType(e.target.value)}
                    className="w-full py-2.5 px-3 rounded-xl border border-border bg-background text-foreground text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="none">{t.spouseExceptionNone}</option>
                    <option value="single_parent">{t.spouseExceptionSingle}</option>
                    <option value="spouse_unemployed">{t.spouseExceptionUnemployed}</option>
                    <option value="spouse_incapacitated">{t.spouseExceptionIncapacitated}</option>
                  </select>
                </div>
              )}

              {/* Short time work check */}
              <div className="pt-3 border-t border-border/60 space-y-2">
                <span className="block text-xs sm:text-sm font-semibold text-foreground">
                  {t.shortTimeWorkLabel}
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsShortTimeWork(true)}
                    className={`py-2 px-3 text-xs sm:text-sm font-medium rounded-xl border text-center transition-all ${
                      isShortTimeWork
                        ? 'bg-indigo-700 dark:bg-indigo-600 text-white border-indigo-700 dark:border-indigo-600 shadow-sm'
                        : 'bg-background text-foreground border-border'
                    }`}
                  >
                    {t.shortTimeWorkYes}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsShortTimeWork(false)}
                    className={`py-2 px-3 text-xs sm:text-sm font-medium rounded-xl border text-center transition-all ${
                      !isShortTimeWork
                        ? 'bg-slate-700 dark:bg-slate-600 text-white border-slate-700 dark:border-slate-600 shadow-sm'
                        : 'bg-background text-foreground border-border'
                    }`}
                  >
                    {t.shortTimeWorkNo}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RESULTS SECTION */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <ShieldCheck className="w-6 h-6 text-indigo-700 dark:text-indigo-400" />
            <h2 className="text-xl font-black text-foreground tracking-tight">
              {t.sectionResults}
            </h2>
          </div>

          {/* CARD 1: STATUTORY LEAVE RIGHT (TIER 1) */}
          <div className="p-5 sm:p-6 rounded-2xl bg-surface border border-border shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  TIER 1 • LABOR LAW ENTITLEMENT
                </span>
                <h3 className="text-base sm:text-lg font-bold text-foreground">
                  {t.statutoryLeaveTitle}
                </h3>
              </div>
              <div
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs sm:text-sm font-bold ${leaveBadge.bg}`}
              >
                <LeaveIcon className={`w-4 h-4 ${leaveBadge.color}`} />
                <span>{leaveBadge.label}</span>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-foreground leading-relaxed bg-background/60 p-4 rounded-xl border border-border">
              {getReasonText(result.statutoryLeaveRight)}
            </p>
          </div>

          {/* CARD 2: 4 EMPLOYMENT INSURANCE SCHEMES (TIER 2) */}
          <div className="space-y-4">
            <h3 className="text-base sm:text-lg font-bold text-foreground">
              {t.schemesTitle}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Scheme 1: Standard Childcare Leave Benefit */}
              {(() => {
                const item = result.schemes.standardBenefit;
                const badge = getStatusBadge(item.status);
                const BadgeIcon = badge.icon;
                return (
                  <div className="p-5 rounded-2xl bg-surface border border-border shadow-sm space-y-3 flex flex-col justify-between">
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold text-indigo-800 dark:text-indigo-300 uppercase">
                            SCHEME 1 • {item.scheme.legalBasis}
                          </span>
                          <h4 className="text-sm sm:text-base font-bold text-foreground">
                            {getSchemeName(item.scheme)}
                          </h4>
                        </div>
                        <div
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold shrink-0 ${badge.bg}`}
                        >
                          <BadgeIcon className={`w-3.5 h-3.5 ${badge.color}`} />
                          <span>{badge.label}</span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {getSchemeDescription(item.scheme)}
                      </p>
                      <div className="text-xs bg-background/60 p-3 rounded-xl border border-border text-foreground">
                        {getReasonText(item)}
                      </div>
                    </div>
                    <div className="pt-2 border-t border-border/60 text-[11px] text-muted-foreground flex items-center justify-between">
                      <span>{t.rateHint} 67% (180日目まで) → 50%</span>
                      <span>原則1歳（最長2歳）</span>
                    </div>
                  </div>
                );
              })()}

              {/* Scheme 2: Post-Birth Papa Ikukyu */}
              {(() => {
                const item = result.schemes.postBirthPapaBenefit;
                const badge = getStatusBadge(item.status);
                const BadgeIcon = badge.icon;
                return (
                  <div className="p-5 rounded-2xl bg-surface border border-border shadow-sm space-y-3 flex flex-col justify-between">
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold text-indigo-800 dark:text-indigo-300 uppercase">
                            SCHEME 2 • {item.scheme.legalBasis}
                          </span>
                          <h4 className="text-sm sm:text-base font-bold text-foreground">
                            {getSchemeName(item.scheme)}
                          </h4>
                        </div>
                        <div
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold shrink-0 ${badge.bg}`}
                        >
                          <BadgeIcon className={`w-3.5 h-3.5 ${badge.color}`} />
                          <span>{badge.label}</span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {getSchemeDescription(item.scheme)}
                      </p>
                      <div className="text-xs bg-background/60 p-3 rounded-xl border border-border text-foreground">
                        {getReasonText(item)}
                      </div>
                    </div>
                    <div className="pt-2 border-t border-border/60 text-[11px] text-muted-foreground flex items-center justify-between">
                      <span>{t.rateHint} 67%（賃金日額基準）</span>
                      <span>生後8週以内・最大28日</span>
                    </div>
                  </div>
                );
              })()}

              {/* Scheme 3: Post-Birth Support Bonus */}
              {(() => {
                const item = result.schemes.postBirthSupportBonus;
                const badge = getStatusBadge(item.status);
                const BadgeIcon = badge.icon;
                return (
                  <div className="p-5 rounded-2xl bg-surface border border-border shadow-sm space-y-3 flex flex-col justify-between">
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold text-amber-900 dark:text-amber-300 uppercase">
                            SCHEME 3 • {item.scheme.legalBasis}
                          </span>
                          <h4 className="text-sm sm:text-base font-bold text-foreground">
                            {getSchemeName(item.scheme)}
                          </h4>
                        </div>
                        <div
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold shrink-0 ${badge.bg}`}
                        >
                          <BadgeIcon className={`w-3.5 h-3.5 ${badge.color}`} />
                          <span>{badge.label}</span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {getSchemeDescription(item.scheme)}
                      </p>
                      <div className="text-xs bg-background/60 p-3 rounded-xl border border-border text-foreground">
                        {getReasonText(item)}
                      </div>
                    </div>
                    <div className="pt-2 border-t border-border/60 text-[11px] text-muted-foreground flex items-center justify-between">
                      <span>{t.rateHint} +13%加算（計80%・手取り10割）</span>
                      <span>最大28日間</span>
                    </div>
                  </div>
                );
              })()}

              {/* Scheme 4: Short-Time Work Benefit */}
              {(() => {
                const item = result.schemes.shortTimeWorkBenefit;
                const badge = getStatusBadge(item.status);
                const BadgeIcon = badge.icon;
                return (
                  <div className="p-5 rounded-2xl bg-surface border border-border shadow-sm space-y-3 flex flex-col justify-between">
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase">
                            SCHEME 4 • {item.scheme.legalBasis}
                          </span>
                          <h4 className="text-sm sm:text-base font-bold text-foreground">
                            {getSchemeName(item.scheme)}
                          </h4>
                        </div>
                        <div
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold shrink-0 ${badge.bg}`}
                        >
                          <BadgeIcon className={`w-3.5 h-3.5 ${badge.color}`} />
                          <span>{badge.label}</span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {getSchemeDescription(item.scheme)}
                      </p>
                      <div className="text-xs bg-background/60 p-3 rounded-xl border border-border text-foreground">
                        {getReasonText(item)}
                      </div>
                    </div>
                    <div className="pt-2 border-t border-border/60 text-[11px] text-muted-foreground flex items-center justify-between">
                      <span>{t.rateHint} 給与低下分の約10%支給</span>
                      <span>2歳未満・復職後</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* OFFICIAL DISCLAIMER */}
          <div className="p-4 sm:p-5 rounded-2xl bg-muted/70 border border-border space-y-1.5">
            <div className="flex items-center gap-2 text-foreground font-bold text-xs sm:text-sm">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              <span>{t.officialDisclaimerTitle}</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t.officialDisclaimerText}
            </p>
          </div>

          {/* RELATED FAMILY & CHILD TOOLS (CAPABILITY DEEP LINKS) */}
          <div className="p-5 rounded-2xl bg-primary/5 border border-primary/20 space-y-3">
            <h4 className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>{t.relatedToolsTitle}</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <a
                href="#/tools/maternity-allowance-jp"
                className="p-3 rounded-xl bg-surface border border-border hover:border-primary text-xs text-foreground font-medium flex items-center justify-between transition-colors shadow-xs"
              >
                <span>{t.linkMaternity}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </a>
              <a
                href="#/tools/childcare-benefit-jp"
                className="p-3 rounded-xl bg-surface border border-border hover:border-primary text-xs text-foreground font-medium flex items-center justify-between transition-colors shadow-xs"
              >
                <span>{t.linkChildcareBenefit}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </a>
              <a
                href="#/tools/child-allowance-jp"
                className="p-3 rounded-xl bg-surface border border-border hover:border-primary text-xs text-foreground font-medium flex items-center justify-between transition-colors shadow-xs"
              >
                <span>{t.linkChildAllowance}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </a>
              <a
                href="#/tools/birth-wizard-jp"
                className="p-3 rounded-xl bg-surface border border-border hover:border-primary text-xs text-foreground font-medium flex items-center justify-between transition-colors shadow-xs"
              >
                <span>{t.linkBirthWizard}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </a>
            </div>
          </div>

          {/* REGULATORY SOURCES */}
          <div className="pt-2">
            <RegulatorySourceView sourceIds={CHILDCARE_LEAVE_SOURCES} lang={lang} />
          </div>
        </div>
      </div>
    </StandardToolLayout>
  );
}
