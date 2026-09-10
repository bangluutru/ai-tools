/**
 * @file packages/core/src/components/family/BirthWizardView.jsx
 * @description
 * Giao diện Cẩm nang & Bộ điều phối Mang thai, Sinh con & Nuôi con Nhật Bản (妊娠・出産・育児総合ガイド).
 * Điều phối toàn bộ vòng đời thai sản:
 * - Phân biệt rõ 3 khoản tiền cốt lõi: 出産育児一時金 (50 vạn viện phí), 出産手当金 (2/3 lương nghỉ đẻ), 育児休業給付金 (67%/50% lương nghỉ chăm con).
 * - Mô phỏng số tiền và thanh toán trực tiếp của Khoản hỗ trợ sinh con 500,000円.
 * - Lộ trình 6 giai đoạn với Checklist tương tác lưu trữ localStorage.
 * - Tích hợp chính sách đặc thù địa phương (Fukuoka City, Chiyoda-ku).
 * - Liên kết đa năng (Capability Deep Links) đến các công cụ con trong gia đình.
 *
 * Tuân thủ nghiêm ngặt MAIS: StandardToolLayout 1240px, Design Tokens (bg-surface, bg-background), WCAG 2.1 AA.
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  Compass,
  Baby,
  Calendar,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Building2,
  MapPin,
  Sparkles,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Info,
  DollarSign,
  Heart,
  FileText,
  ExternalLink,
  Award,
} from 'lucide-react';

import StandardToolLayout from '../shared/StandardToolLayout.jsx';
import RegulatorySourceView from '../regulatory/RegulatorySourceView.jsx';
import {
  calculateChildbirthLumpSumGrant,
  getRoadmapStages,
  calculateChecklistStats,
  BIRTH_GRANT_CONSTANTS,
  BIRTH_WIZARD_SOURCES,
  SUPPORTED_MUNICIPALITIES_LIST,
  getMunicipalFamilyData,
} from '../../japan/family/index.js';

const STORAGE_KEY = 'ai_tools_birth-wizard_checklist';

const TRANSLATIONS = {
  ja: {
    toolTitle: '妊娠・出産・育児総合ガイド（手続きロードマップ & 一時金50万円試算）',
    toolDesc: '妊娠判明から出産・育児休業・職場復帰（2歳到達）まで、公的制度の申請期限・窓口・給付金額を完全網羅。出産育児一時金50万円の直接支払精算や自治体独自制度にも対応。',
    sectionDistinctionTitle: '【最重要】妊娠・出産・育児の「3大給付金」の違いと役割',
    sectionDistinctionDesc: '公的保険・雇用保険から支給される3大給付金は、それぞれ「支給元」「目的」「対象者」が全く異なります。混同しないよう整理して受給計画を立てましょう。',
    calcSectionTitle: '出産育児一時金（50万円）の支給・窓口差額シミュレーター',
    calcSectionDesc: '健康保険法第101条に基づき、出産時に支給される一時金の自己負担額または還付差額を試算します。',
    childCountLabel: '出産児数（胎数）',
    singleBirth: '単胎（1児・原則50万円）',
    twinBirth: '双子（2児・100万円）',
    tripletBirth: '三つ子（3児・150万円）',
    isObstetricLabel: '産科医療補償制度に加入している分べん施設で出産する',
    isObstetricHint: '※ 日本国内の99％以上の産院・病院が加入（加入施設は50万円、未加入施設は48.8万円支給）。',
    hospitalCostLabel: '病院から請求される分べん・入院費用の見込み（総額）',
    hospitalCostHint: '※ 日本の全国平均分べん費用は約48万〜55万円程度です（深夜加算や個室料により変動）。',
    grantResultTitle: '一時金支給額および退院時精算結果',
    grantAmountLabel: '出産育児一時金の総支給額',
    outOfPocketLabel: '退院時のお支払い見込み（自己負担差額）',
    surplusRefundLabel: '健保からの還付見込み（受取超過額）',
    yenUnit: '円',
    childUnit: '人',
    sectionLocalityTitle: 'お住まいの自治体（市区町村）を選択',
    sectionLocalityHint: '※ 自治体独自の妊婦健診助成（受診票）、子ども医療費助成、出産応援ギフト（10万円）等の詳細が反映されます。',
    localityLabel: '市区町村窓口の選択',
    roadmapSectionTitle: '妊娠・出産・育児 手続きロードマップ（全6ステージ）',
    roadmapProgressLabel: '全体の準備完了度：',
    tasksCompletedLabel: '完了した手続き：',
    filterAll: 'すべての手続き',
    filterPending: '未完了のみ',
    btnMarkComplete: '完了にする',
    btnMarkPending: '未完了に戻す',
    deadlineLabel: '提出期限：',
    windowLabel: '提出先・窓口：',
    documentsLabel: '必要書類：',
    benefitLabel: '給付・メリット：',
    openToolLink: 'シミュレーターで詳しく試算する',
    officialDisclaimerTitle: '【公的手続き・制度適用に関するご案内】',
    officialDisclaimerText: '本ツールに掲載された制度内容および申請期限は、最新の法令（健康保険法、育児・介護休業法、児童手当法）および自治体公表資料に基づきます。個別の休業手続きや受給資格については、必ず勤務先の人事労務担当者、協会けんぽ、または管轄ハローワークへご確認ください。',
    relatedToolsTitle: '関連する個別シミュレーター',
    linkMaternity: '出産手当金シミュレーター（産前産後休業手当）',
    linkEligibility: '育児休業・給付チェッカー（権利・受給資格判定）',
    linkChildcareBenefit: '育児休業給付金シミュレーター（金額精密試算）',
    linkChildAllowance: '児童手当チェッカー（2024年10月抜本拡充対応）',
  },
  vi: {
    toolTitle: 'Cẩm Nang Mang Thai, Sinh Con & Nuôi Con Toàn Diện',
    toolDesc: 'Hướng dẫn chuẩn xác toàn bộ lộ trình từ khi biết tin mang thai đến sinh nở, nghỉ chăm con và trở lại đi làm (con 2 tuổi). Tích hợp tính toán 50 vạn tiền hỗ trợ sinh đẻ và chính sách hỗ trợ địa phương.',
    sectionDistinctionTitle: '【TRỌNG YẾU】Phân Biệt Rõ "3 Khoản Tiền Lớn" Khi Sinh & Nuôi Con Tại Nhật',
    sectionDistinctionDesc: '3 khoản trợ cấp tiền mặt lớn từ BHYT và BHTN có cơ quan chi trả, mục đích và điều kiện hoàn toàn khác nhau. Cần nắm rõ để không bỏ sót bất kỳ quyền lợi nào.',
    calcSectionTitle: 'Mô Phỏng Khoản Hỗ Trợ Sinh Con 500,000円 & Chênh Lệch Viện Phí',
    calcSectionDesc: 'Theo Điều 101 Luật BHYT Nhật Bản, BHYT chi trả 50 vạn Yên tiền sinh nở qua cơ chế thanh toán trực tiếp cho bệnh viện.',
    childCountLabel: 'Số lượng bé sinh trong lần này',
    singleBirth: 'Sinh một (1 bé - 500,000円)',
    twinBirth: 'Sinh đôi (2 bé - 1,000,000円)',
    tripletBirth: 'Sinh ba (3 bé - 1,500,000円)',
    isObstetricLabel: 'Bệnh viện nơi sinh có tham gia Chế độ bồi thường sự cố sản khoa',
    isObstetricHint: '※ Hơn 99% cơ sở y tế tại Nhật tham gia quỹ này (hưởng đủ 500,000円; cơ sở không tham gia hưởng 488,000円).',
    hospitalCostLabel: 'Dự kiến tổng viện phí sinh con và nằm viện do bệnh viện báo',
    hospitalCostHint: '※ Mức viện phí sinh con trung bình tại Nhật khoảng 48 - 55 vạn Yên (thay đổi tùy sinh đêm, phòng riêng).',
    grantResultTitle: 'Kết Quả Trợ Cấp & Số Tiền Cần Thanh Toán Khi Xuất Viện',
    grantAmountLabel: 'Tổng trợ cấp sinh con trọn gói BHYT chi trả',
    outOfPocketLabel: 'Số tiền tự thanh toán thêm tại viện khi xuất viện',
    surplusRefundLabel: 'Số tiền dư BHYT sẽ hoàn trả vào tài khoản của bạn',
    yenUnit: '円',
    childUnit: 'bé',
    sectionLocalityTitle: 'Chọn Địa Phương Cư Trú (Tỉnh / Thành phố)',
    sectionLocalityHint: '※ Tùy địa phương sẽ hiển thị chính sách riêng: Giá trị phiếu khám thai, trợ cấp khám chữa bệnh miễn phí cho bé, quà sinh con 10 vạn Yên.',
    localityLabel: 'Địa phương đang sinh sống',
    roadmapSectionTitle: 'Bản Đồ Thủ Tục Hành Chính Thai Sản (6 Giai Đoạn A-Z)',
    roadmapProgressLabel: 'Tiến độ hoàn thành:',
    tasksCompletedLabel: 'Đầu việc đã hoàn thành:',
    filterAll: 'Tất cả thủ tục',
    filterPending: 'Chỉ thủ tục chưa làm',
    btnMarkComplete: 'Đánh dấu đã hoàn thành',
    btnMarkPending: 'Đánh dấu chưa làm',
    deadlineLabel: 'Hạn nộp / Thời điểm:',
    windowLabel: 'Nơi nộp / Cơ quan phụ trách:',
    documentsLabel: 'Hồ sơ mang theo:',
    benefitLabel: 'Quyền lợi / Số tiền nhận được:',
    openToolLink: 'Mở công cụ tính chi tiết',
    officialDisclaimerTitle: '【THẨM QUYỀN HÀNH CHÍNH & LƯU Ý PHÁP LÝ】',
    officialDisclaimerText: 'Thông tin trong cẩm nang dựa trên quy định chính thức của Luật BHYT, Luật Nghỉ chăm sóc gia đình & Luật BHTN Nhật Bản. Để hoàn thiện thủ tục công ty, vui lòng đối chiếu và phối hợp chặt chẽ với Phòng Nhân sự (HR), Hiệp hội BHYT Kenpo và Hello Work sở tại.',
    relatedToolsTitle: 'Công Cụ Chuyên Sâu Từng Khoản',
    linkMaternity: 'Tính Trợ Cấp Thai Sản BHYT (出産手当金)',
    linkEligibility: 'Kiểm Tra Nghỉ Chăm Con & BHTN (育休チェッカー)',
    linkChildcareBenefit: 'Mô Phỏng Tiền Nghỉ Chăm Con 67% & 50% (育児休業給付金)',
    linkChildAllowance: 'Kiểm Tra Trợ Cấp Trẻ Em Cải Cách 10/2024 (児童手当)',
  },
  en: {
    toolTitle: 'Comprehensive Birth & Childcare Guide (Roadmap & 500k JPY Grant)',
    toolDesc: 'Complete navigation from pregnancy confirmation through delivery, childcare leave, and return to work. Covers the 500,000 JPY childbirth grant, municipal support, and official deadlines.',
    sectionDistinctionTitle: '【CRITICAL】Key Differences of Japan’s "3 Core Childbirth Benefits"',
    sectionDistinctionDesc: 'The 3 primary statutory cash benefits originate from different insurance schemes and serve distinct purposes. Understand each to maximize family support.',
    calcSectionTitle: 'Childbirth Lump-Sum Grant (500,000 JPY) & Settlement Simulator',
    calcSectionDesc: 'Under Article 101 of Health Insurance Act, this grant covers delivery and hospital costs via the direct payment system.',
    childCountLabel: 'Number of babies delivered',
    singleBirth: 'Single (1 child - 500,000 JPY)',
    twinBirth: 'Twins (2 children - 1,000,000 JPY)',
    tripletBirth: 'Triplets (3 children - 1,500,000 JPY)',
    isObstetricLabel: 'Facility participates in Obstetric Compensation System',
    isObstetricHint: '※ Over 99% of clinics participate (500,000 JPY full grant; non-participating clinics receive 488,000 JPY).',
    hospitalCostLabel: 'Estimated total delivery and hospitalization invoice',
    hospitalCostHint: '※ Japan national average delivery cost ranges between 480,000 and 550,000 JPY.',
    grantResultTitle: 'Grant Calculation & Hospital Cashier Settlement',
    grantAmountLabel: 'Total Childbirth Lump-Sum Grant Paid by Insurance',
    outOfPocketLabel: 'Out-of-Pocket Payment at Hospital Discharge',
    surplusRefundLabel: 'Surplus Refund Deposited Back to Your Account',
    yenUnit: 'JPY',
    childUnit: 'children',
    sectionLocalityTitle: 'Select Your Municipality / Local Jurisdiction',
    sectionLocalityHint: '※ Displays localized prenatal voucher values, free pediatric medical coverage, and 100,000 JPY newborn gift grants.',
    localityLabel: 'Residing Municipality',
    roadmapSectionTitle: 'Administrative Lifecycle Roadmap (6 Stages A to Z)',
    roadmapProgressLabel: 'Overall Completion:',
    tasksCompletedLabel: 'Completed Tasks:',
    filterAll: 'All Procedures',
    filterPending: 'Pending Only',
    btnMarkComplete: 'Mark Completed',
    btnMarkPending: 'Mark Incomplete',
    deadlineLabel: 'Filing Deadline:',
    windowLabel: 'Filing Window / Office:',
    documentsLabel: 'Required Documents:',
    benefitLabel: 'Benefit / Financial Coverage:',
    openToolLink: 'Open Detailed Simulator',
    officialDisclaimerTitle: '【OFFICIAL ADMINISTRATIVE JURISDICTION NOTICE】',
    officialDisclaimerText: 'Procedures and deadlines reflect statutory laws (Health Insurance Act, Childcare Leave Act, Child Allowance Act). For formal workplace claims, please coordinate directly with your HR department, Health Insurance Union, and Hello Work.',
    relatedToolsTitle: 'Related Specialized Calculators',
    linkMaternity: 'Maternity Allowance Simulator (Health Insurance Daily Benefit)',
    linkEligibility: 'Childcare Leave & Benefit Eligibility Checker',
    linkChildcareBenefit: 'Childcare Leave Benefit Simulator (Payment Estimation)',
    linkChildAllowance: 'Child Allowance Checker (Oct 2024 Expansion Compliant)',
  }
};

export default function BirthWizardView({ lang = 'ja' }) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.ja;

  // State: Grant Simulator
  const [childCount, setChildCount] = useState(1);
  const [isObstetric, setIsObstetric] = useState(true);
  const [hospitalCost, setHospitalCost] = useState(500000);

  // State: Locality Selection
  const [selectedJurisdiction, setSelectedJurisdiction] = useState('JP-40-40130'); // Default: Fukuoka City

  // State: Checklist Task completion (saved in localStorage)
  const [completedTasks, setCompletedTasks] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // State: Expanded stages accordion
  const [expandedStages, setExpandedStages] = useState({
    stage1_early_pregnancy: true,
    stage2_late_pregnancy: true,
    stage3_birth_day: true,
    stage4_immediate_post_birth: true,
    stage5_childcare_leave_period: false,
    stage6_return_to_work: false,
  });

  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'pending'

  // Persist completedTasks to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(completedTasks));
    } catch (e) {
      console.warn('Failed to save checklist state', e);
    }
  }, [completedTasks]);

  // Grant evaluation
  const grantResult = useMemo(() => {
    return calculateChildbirthLumpSumGrant({
      childCount,
      isParticipatingInObstetricCompensation: isObstetric,
      actualHospitalCost: hospitalCost,
    });
  }, [childCount, isObstetric, hospitalCost]);

  // Stages with localized data
  const stages = useMemo(() => {
    return getRoadmapStages({ jurisdictionCode: selectedJurisdiction });
  }, [selectedJurisdiction]);

  // Checklist statistics
  const stats = useMemo(() => {
    return calculateChecklistStats(completedTasks, stages);
  }, [completedTasks, stages]);

  const municipalInfo = useMemo(() => {
    return getMunicipalFamilyData(selectedJurisdiction);
  }, [selectedJurisdiction]);

  // Checklist toggle
  const toggleTask = (taskId) => {
    if (completedTasks.includes(taskId)) {
      setCompletedTasks(completedTasks.filter((id) => id !== taskId));
    } else {
      setCompletedTasks([...completedTasks, taskId]);
    }
  };

  const toggleStageAccordion = (stageId) => {
    setExpandedStages((prev) => ({ ...prev, [stageId]: !prev[stageId] }));
  };

  return (
    <StandardToolLayout
      title={t.toolTitle}
      description={t.toolDesc}
      badge="Japan Life • Family & Child"
      maxWidth="max-w-[1240px]"
    >
      <div className="space-y-8 max-w-full overflow-hidden">
        {/* CORE 3-TIER BENEFITS DISTINCTION BANNER */}
        <section className="bg-surface rounded-2xl p-5 sm:p-6 border border-border shadow-sm space-y-4 max-w-full overflow-hidden">
          <div className="flex items-center gap-2.5 border-b border-border/60 pb-3">
            <ShieldCheck className="w-5 h-5 text-indigo-700 dark:text-indigo-400" />
            <h2 className="text-base sm:text-lg font-bold text-foreground">
              {t.sectionDistinctionTitle}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {t.sectionDistinctionDesc}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {/* 1. 出産育児一時金 */}
            <div className="p-4 rounded-xl border border-border bg-background/60 space-y-2.5">
              <div className="inline-block px-2.5 py-1 rounded-full text-[11px] font-bold bg-pink-500/15 text-pink-800 dark:text-pink-300 border border-pink-500/25">
                ① 出産費用（健保）
              </div>
              <h3 className="font-bold text-sm text-foreground">
                {lang === 'vi' ? 'Khoản hỗ trợ sinh con (50 vạn)' : lang === 'en' ? 'Childbirth Grant (500k)' : '出産育児一時金（50万円）'}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {lang === 'vi'
                  ? 'Chi trả thẳng cho bệnh viện để trừ tiền đẻ và nằm viện. Mọi phụ nữ tham gia BHYT (kể cả phụ thuộc) đều được nhận.'
                  : lang === 'en'
                  ? 'Paid directly to hospital for delivery & inpatient costs. Available to all health insurance enrollees & dependents.'
                  : '分べん・入院費用そのものを直接支払う制度。被扶養者や国民健康保険でも一律50万円が支給されます。'}
              </p>
            </div>

            {/* 2. 出産手当金 */}
            <div className="p-4 rounded-xl border border-border bg-background/60 space-y-2.5">
              <div className="inline-block px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-500/15 text-indigo-800 dark:text-indigo-300 border border-indigo-500/25">
                ② 産休中の給料補填（健保）
              </div>
              <h3 className="font-bold text-sm text-foreground">
                {lang === 'vi' ? 'Trợ cấp thai sản (2/3 lương)' : lang === 'en' ? 'Maternity Allowance (2/3 Wage)' : '出産手当金（給料の3分の2）'}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {lang === 'vi'
                  ? 'Bù đắp tiền lương trong 98+ ngày nghỉ trước và sau sinh. Chỉ áp dụng cho người đi làm có đóng BHYT công ty.'
                  : lang === 'en'
                  ? 'Replaces income during 98+ days of prenatal & postnatal leave. For working employees under health insurance.'
                  : '産前産後休業（98日＋遅損日）で給与が出ない期間の生活費補填。本人が会社の健保に加入している必要があります。'}
              </p>
            </div>

            {/* 3. 育児休業給付金 */}
            <div className="p-4 rounded-xl border border-border bg-background/60 space-y-2.5">
              <div className="inline-block px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-900 dark:text-amber-300 border border-amber-500/25">
                ③ 育休中の生活保障（雇用保険）
              </div>
              <h3 className="font-bold text-sm text-foreground">
                {lang === 'vi' ? 'Trợ cấp chăm con (67% / 50%)' : lang === 'en' ? 'Childcare Benefit (67% / 50%)' : '育児休業給付金（67%・50%）'}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {lang === 'vi'
                  ? 'Chi trả từ Quỹ BHTN (Hello Work) khi nghỉ chăm con đến 1 tuổi (tối đa 2 tuổi). Yêu cầu đóng BHTN từ 12 tháng.'
                  : lang === 'en'
                  ? 'Funded by Employment Insurance (Hello Work) during leave up to 1-2 yo. Requires 12 qualifying insured months.'
                  : '産後休業終了後から1歳（最長2歳）まで休業する際、ハローワークから非課税で口座に支給されます。'}
              </p>
            </div>
          </div>
        </section>

        {/* CHILDBIRTH LUMP-SUM GRANT (500,000 JPY) CALCULATOR */}
        <section className="bg-surface rounded-2xl p-5 sm:p-6 border border-border shadow-sm space-y-5 max-w-full overflow-hidden">
          <div className="flex items-center gap-2.5 border-b border-border/60 pb-3">
            <DollarSign className="w-5 h-5 text-indigo-700 dark:text-indigo-400" />
            <h2 className="text-base sm:text-lg font-bold text-foreground">
              {t.calcSectionTitle}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {t.calcSectionDesc}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Child count */}
            <div className="space-y-1.5">
              <label htmlFor="child-count-select" className="block text-xs sm:text-sm font-semibold text-foreground">
                {t.childCountLabel}
              </label>
              <select
                id="child-count-select"
                aria-label={t.childCountLabel}
                value={childCount}
                onChange={(e) => setChildCount(parseInt(e.target.value, 10))}
                className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-foreground font-medium text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value={1}>{t.singleBirth}</option>
                <option value={2}>{t.twinBirth}</option>
                <option value={3}>{t.tripletBirth}</option>
              </select>
            </div>

            {/* Actual Hospital Cost */}
            <div className="space-y-1.5">
              <label htmlFor="hospital-cost-input" className="block text-xs sm:text-sm font-semibold text-foreground">
                {t.hospitalCostLabel}
              </label>
              <div className="relative">
                <input
                  id="hospital-cost-input"
                  aria-label={t.hospitalCostLabel}
                  type="number"
                  step="10000"
                  min="300000"
                  max="3000000"
                  value={hospitalCost}
                  onChange={(e) => setHospitalCost(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-foreground font-medium text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none pr-12"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  {t.yenUnit}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {t.hospitalCostHint}
              </p>
            </div>

            {/* Obstetric Fund toggle */}
            <div className="space-y-1.5 md:pt-4">
              <div className="flex items-start gap-2.5">
                <input
                  id="obstetric-fund-checkbox"
                  aria-label={t.isObstetricLabel}
                  type="checkbox"
                  checked={isObstetric}
                  onChange={(e) => setIsObstetric(e.target.checked)}
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <div className="space-y-0.5">
                  <label htmlFor="obstetric-fund-checkbox" className="text-xs sm:text-sm font-semibold text-foreground cursor-pointer">
                    {t.isObstetricLabel}
                  </label>
                  <p className="text-[11px] text-muted-foreground">
                    {t.isObstetricHint}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* SIMULATION SUMMARY CARDS */}
          <div className="p-4 sm:p-5 rounded-xl bg-background/80 border border-border space-y-3">
            <h3 className="font-bold text-xs sm:text-sm text-foreground flex items-center gap-2">
              <Award className="w-4 h-4 text-indigo-700 dark:text-indigo-400" />
              <span>{t.grantResultTitle}</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-surface border border-border space-y-1">
                <span className="text-[11px] text-muted-foreground block font-medium">
                  {t.grantAmountLabel}
                </span>
                <span className="text-lg sm:text-xl font-extrabold text-foreground block">
                  {grantResult.totalGrantAmount.toLocaleString()} {t.yenUnit}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-surface border border-border space-y-1">
                <span className="text-[11px] text-muted-foreground block font-medium">
                  {t.outOfPocketLabel}
                </span>
                <span className="text-lg sm:text-xl font-extrabold text-rose-700 dark:text-rose-400 block">
                  {grantResult.outOfPocketExpense.toLocaleString()} {t.yenUnit}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-surface border border-border space-y-1">
                <span className="text-[11px] text-muted-foreground block font-medium">
                  {t.surplusRefundLabel}
                </span>
                <span className="text-lg sm:text-xl font-extrabold text-emerald-800 dark:text-emerald-300 block">
                  {grantResult.surplusRefund.toLocaleString()} {t.yenUnit}
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed pt-1">
              {lang === 'vi' ? grantResult.summaryVi : lang === 'en' ? grantResult.summaryEn : grantResult.summaryJa}
            </p>
          </div>
        </section>

        {/* LOCALITY CARD (FUKUOKA CITY PILOT VS OTHERS) */}
        <section className="bg-surface rounded-2xl p-5 sm:p-6 border border-border shadow-sm space-y-4 max-w-full overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-indigo-700 dark:text-indigo-400" />
              <h2 className="text-base sm:text-lg font-bold text-foreground">
                {t.sectionLocalityTitle}
              </h2>
            </div>
            <div className="w-full sm:w-72">
              <select
                id="locality-selector"
                aria-label={t.localityLabel}
                value={selectedJurisdiction}
                onChange={(e) => setSelectedJurisdiction(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground font-medium text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                {SUPPORTED_MUNICIPALITIES_LIST.map((m) => (
                  <option key={m.code} value={m.code}>
                    {lang === 'vi' ? m.nameVi : lang === 'en' ? m.nameEn : m.nameJa}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {municipalInfo ? (
            <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/25 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
                  {lang === 'vi' ? municipalInfo.nameVi : lang === 'en' ? municipalInfo.nameEn : municipalInfo.nameJa}
                </span>
                <a
                  href={municipalInfo.officialPortalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${lang === 'vi' ? 'Cổng thông tin nuôi con' : lang === 'en' ? 'Childcare Portal' : '子育てポータル'} - ${lang === 'vi' ? municipalInfo.nameVi : municipalInfo.nameJa}`}
                  className="text-xs text-indigo-700 dark:text-indigo-400 hover:underline flex items-center gap-1 font-semibold"
                >
                  <span>Cổng thông tin nuôi con</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-2.5 rounded-lg bg-surface border border-border space-y-1">
                  <span className="font-semibold text-muted-foreground block">Phiếu khám thai miễn phí</span>
                  <span className="text-foreground font-bold">{municipalInfo.prenatalCheckupTickets.totalTickets} lần (trị giá ~{municipalInfo.prenatalCheckupTickets.approximateTotalValueYen.toLocaleString()}円)</span>
                </div>
                <div className="p-2.5 rounded-lg bg-surface border border-border space-y-1">
                  <span className="font-semibold text-muted-foreground block">Y tế trẻ em</span>
                  <span className="text-foreground font-bold">{lang === 'vi' ? municipalInfo.childMedicalSubsidy.targetAgeVi : municipalInfo.childMedicalSubsidy.targetAgeJa}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-surface border border-border space-y-1">
                  <span className="font-semibold text-muted-foreground block">Quà tặng sinh con</span>
                  <span className="text-foreground font-bold">{municipalInfo.birthGiftGrant.amountYen.toLocaleString()}円 (Quà hỗ trợ)</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-muted/60 text-xs text-muted-foreground">
              Áp dụng khung chính sách tiêu chuẩn quốc gia của Bộ Y tế & Cơ quan Trẻ em. Vui lòng liên hệ Ủy ban quận/thành phố nơi bạn cư trú để nhận sổ mẹ con và phiếu khám thai.
            </div>
          )}
        </section>

        {/* 6-STAGE ROADMAP & CHECKLIST ORCHESTRATOR */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                <Compass className="w-5 h-5 text-indigo-700 dark:text-indigo-400" />
                <span>{t.roadmapSectionTitle}</span>
              </h2>
              <p className="text-xs text-muted-foreground pt-1">
                {t.tasksCompletedLabel} <strong className="text-foreground">{stats.totalCompleted} / {stats.totalTasks}</strong> đầu việc ({stats.overallPercent}%)
              </p>
            </div>

            {/* Progress bar and Filter */}
            <div className="flex items-center gap-3">
              <div className="w-32 sm:w-44 h-2.5 bg-muted rounded-full overflow-hidden border border-border">
                <div
                  className="h-full bg-emerald-600 transition-all duration-300"
                  style={{ width: `${stats.overallPercent}%` }}
                />
              </div>
              <div className="flex items-center border border-border rounded-xl p-0.5 bg-background text-xs">
                <button
                  type="button"
                  id="filter-all-btn"
                  onClick={() => setFilterMode('all')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${filterMode === 'all' ? 'bg-indigo-700 text-white' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  {t.filterAll}
                </button>
                <button
                  type="button"
                  id="filter-pending-btn"
                  onClick={() => setFilterMode('pending')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${filterMode === 'pending' ? 'bg-indigo-700 text-white' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  {t.filterPending}
                </button>
              </div>
            </div>
          </div>

          {/* STAGE ACCORDIONS */}
          <div className="space-y-4">
            {stages.map((stage) => {
              const isExpanded = expandedStages[stage.stageId] !== false;
              const stageTasks = filterMode === 'pending'
                ? stage.tasks.filter((t) => !completedTasks.includes(t.id))
                : stage.tasks;

              const stageStat = stats.stageStats.find((s) => s.stageId === stage.stageId);

              return (
                <div
                  key={stage.stageId}
                  className="rounded-2xl border border-border bg-surface overflow-hidden shadow-xs transition-shadow"
                >
                  {/* Stage Header */}
                  <button
                    type="button"
                    id={`toggle-stage-${stage.stageId}`}
                    aria-label={`Toggle ${stage.titleJa}`}
                    onClick={() => toggleStageAccordion(stage.stageId)}
                    className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-muted/40 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-800 dark:text-indigo-300 border border-indigo-500/25">
                          STAGE {stage.order}
                        </span>
                        <h3 className="font-bold text-sm sm:text-base text-foreground">
                          {lang === 'vi' ? stage.titleVi : lang === 'en' ? stage.titleEn : stage.titleJa}
                        </h3>
                      </div>
                      <span className="text-xs text-muted-foreground block">
                        {lang === 'vi' ? stage.timeframeVi : lang === 'en' ? stage.timeframeEn : stage.timeframeJa} • {stageStat?.completed || 0}/{stageStat?.total || 0} hoàn thành
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {stageStat?.isFullyCompleted && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span className="hidden sm:inline">Hoàn tất</span>
                        </span>
                      )}
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                  </button>

                  {/* Stage Tasks Content */}
                  {isExpanded && (
                    <div className="p-4 sm:p-5 pt-0 space-y-4 border-t border-border/40">
                      {stageTasks.length === 0 ? (
                        <p className="text-xs text-muted-foreground py-2 italic text-center">
                          Tất cả các đầu việc trong giai đoạn này đã được hoàn thành! 🎉
                        </p>
                      ) : (
                        stageTasks.map((task) => {
                          const isDone = completedTasks.includes(task.id);
                          return (
                            <div
                              key={task.id}
                              className={`p-4 rounded-xl border transition-all space-y-3 ${
                                isDone
                                  ? 'bg-muted/40 border-border/60 opacity-80'
                                  : 'bg-background border-border shadow-xs'
                              }`}
                            >
                              {/* Task top bar */}
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3">
                                  <input
                                    id={`task-check-${task.id}`}
                                    aria-label={task.titleJa}
                                    type="checkbox"
                                    checked={isDone}
                                    onChange={() => toggleTask(task.id)}
                                    className="mt-1 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                  />
                                  <div className="space-y-0.5">
                                    <label
                                      htmlFor={`task-check-${task.id}`}
                                      className={`font-bold text-xs sm:text-sm cursor-pointer ${
                                        isDone ? 'line-through text-muted-foreground' : 'text-foreground'
                                      }`}
                                    >
                                      {lang === 'vi' ? task.titleVi : lang === 'en' ? task.titleEn : task.titleJa}
                                    </label>
                                    <span className="text-[11px] text-muted-foreground block">
                                      {lang === 'vi' ? task.titleJa : ''}
                                    </span>
                                  </div>
                                </div>

                                {task.toolLinkId && (
                                  <a
                                    href={`#/tools/${task.toolLinkId}`}
                                    className="shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-indigo-700 dark:bg-indigo-600 text-white hover:bg-indigo-800 transition-colors"
                                  >
                                    <span>{t.openToolLink}</span>
                                    <ChevronRight className="w-3.5 h-3.5" />
                                  </a>
                                )}
                              </div>

                              {/* Task details grid */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                                <div className="space-y-0.5">
                                  <span className="font-semibold text-muted-foreground">{t.deadlineLabel}</span>
                                  <p className="text-foreground">
                                    {lang === 'vi' ? task.deadlineVi : lang === 'en' ? task.deadlineEn : task.deadlineJa}
                                  </p>
                                </div>
                                <div className="space-y-0.5">
                                  <span className="font-semibold text-muted-foreground">{t.windowLabel}</span>
                                  <p className="text-foreground">
                                    {lang === 'vi' ? task.locationVi : lang === 'en' ? task.locationEn : task.locationJa}
                                  </p>
                                </div>
                                {task.documentsVi && (
                                  <div className="space-y-0.5 sm:col-span-2">
                                    <span className="font-semibold text-muted-foreground">{t.documentsLabel}</span>
                                    <p className="text-foreground">
                                      {lang === 'vi' ? task.documentsVi : lang === 'en' ? task.documentsEn : task.documentsJa}
                                    </p>
                                  </div>
                                )}
                                <div className="space-y-0.5 sm:col-span-2">
                                  <span className="font-semibold text-muted-foreground">{t.benefitLabel}</span>
                                  <p className="text-emerald-950 dark:text-emerald-300 font-medium">
                                    {lang === 'vi' ? task.benefitInfoVi : lang === 'en' ? task.benefitInfoEn : task.benefitInfoJa}
                                  </p>
                                </div>
                                {task.localNotesVi && (
                                  <div className="p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-[11px] text-indigo-900 dark:text-indigo-300 sm:col-span-2">
                                    {lang === 'vi' ? task.localNotesVi : lang === 'en' ? task.localNotesEn : task.localNotesJa}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* OFFICIAL ADMINISTRATIVE DISCLAIMER */}
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
                href="#/tools/childcare-leave-eligibility-jp"
                className="p-3 rounded-xl bg-surface border border-border hover:border-primary text-xs text-foreground font-medium flex items-center justify-between transition-colors shadow-xs"
              >
                <span>{t.linkEligibility}</span>
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
            </div>
          </div>

          {/* REGULATORY SOURCES */}
          <div className="pt-2">
            <RegulatorySourceView sourceIds={BIRTH_WIZARD_SOURCES} lang={lang} />
          </div>
        </section>
      </div>
    </StandardToolLayout>
  );
}
