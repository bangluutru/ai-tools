/**
 * @file packages/core/src/components/family/ChildAllowanceView.jsx
 * @description
 * Giao diện Chẩn đoán & Tính Trợ cấp Trẻ em Nhật Bản (児童手当チェッカー).
 * Triển khai chính xác cải cách 10/2024 của こども家庭庁:
 * - Bỏ trần thu nhập (所得制限撤廃)
 * - Mở rộng đến hết cấp 3 (18 tuổi)
 * - Con thứ 3 trở đi nhận 30,000円/tháng
 * - Đếm thứ tự con đến 22 tuổi nếu có chu cấp
 * - Chi trả 6 lần/năm (tháng chẵn)
 *
 * Tuân thủ nghiêm ngặt MAIS: StandardToolLayout 1240px, Design Tokens (bg-surface, bg-background), WCAG 2.1 AA.
 */

import React, { useState, useMemo } from 'react';
import {
  Users,
  Baby,
  Calendar,
  Sparkles,
  TrendingUp,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  ChevronRight,
  Building2,
  Info,
  Award,
} from 'lucide-react';

import StandardToolLayout from '../shared/StandardToolLayout.jsx';
import RegulatorySourceView from '../regulatory/RegulatorySourceView.jsx';
import {
  calculateChildAllowance,
  CHILD_ALLOWANCE_CONSTANTS,
  CHILD_ALLOWANCE_SOURCES,
} from '../../japan/family/index.js';

const TRANSLATIONS = {
  ja: {
    toolTitle: '児童手当チェッカー（2024年10月抜本拡充対応）',
    toolDesc: 'こども家庭庁の制度改正（所得制限撤廃・高校生年代18歳までの延長・第3子以降月3万円・多子カウント22歳延長・年6回支給）に対応した最新の児童手当シミュレーターです。',
    bannerReformTitle: '【2024年10月 児童手当の抜本的拡充】主な改正ポイント',
    bannerReformDesc: '①所得制限が完全に撤廃され全世帯に支給、②支給期間が高校生年代（18歳年度末）まで延長、③第3子以降の支給額が月3万円に倍増（22歳年度末までの兄姉もカウント対象）、④支払回数が年6回（偶数月）に増加しました。',
    sectionChildren: '1. お子様の家族構成・年齢設定',
    sectionChildrenHint: '※ 児童手当の支給対象（0〜18歳）だけでなく、多子加算のカウント対象となる兄姉（〜22歳・大学生等）もご登録ください。',
    addChildBtn: 'お子様を追加する',
    childNameLabel: 'お名前（または続柄）',
    childAgeLabel: '年齢',
    hasSupportLabel: '親が生活費・学費等の経済的負担を負っている',
    hasSupportHint: '※ 19〜22歳のお子様は、監護相当・経済的負担がある場合に第3子加算のカウント対象となります。',
    sectionIncome: '2. 世帯年収（制度改正前との比較用）',
    householdIncomeLabel: '世帯の年間額面収入（年収）',
    householdIncomeHint: '※ 2024年10月以降は所得制限が撤廃されたため支給額に影響しませんが、旧制度からの増額メリットを計算するために使用します。',
    yenUnit: '円',
    monthUnit: '月',
    ageUnit: '歳',
    yearUnit: '年',
    resultsTitle: '児童手当の試算結果',
    totalMonthlyLabel: '毎月の受給総額',
    bimonthlyLabel: '偶数月ごとの支給額（2ヶ月分）',
    annualTotalLabel: '年間受給総額',
    lifetimeEstimateLabel: '高校卒業までの残り総受給予定額',
    breakdownTitle: 'お子様別の支給明細・カウント判定',
    colChild: 'お子様',
    colAge: '年齢',
    colRank: '多子カウント順位',
    colMonthly: '月額支給額',
    colStatus: '判定ステータス',
    statusReceiving: '手当支給対象',
    statusCountingOnly: '多子加算カウント対象（19〜22歳）',
    statusNotEligible: '対象外（23歳以上）',
    rankPrefix: '第',
    rankSuffix: '子',
    scheduleTitle: '年間支給スケジュール（年6回・偶数月）',
    reformGainTitle: '制度改正（2024年10月）による増額効果',
    gainMonthly: '旧制度比の月額増加：',
    gainAnnual: '旧制度比の年間増加：',
    incomeAbolishedNotice: '★ 所得制限撤廃の恩恵：旧制度では減額（特例給付5,000円）または全額停止でしたが、満額支給されます！',
    highSchoolNotice: '★ 高校生年代への拡充：高校生のお子様にも手当が支給されます。',
    thirdChildNotice: '★ 多子加算の倍増：第3子以降は月30,000円の優遇手当が適用されています。',
    officialDisclaimerTitle: '【公的手続き・申請に関するご案内】',
    officialDisclaimerText: '児童手当を受給するには、お住まいの市区町村窓口（公務員の方は勤務先）への申請（認定請求）が必要です。原則として申請した翌月分から支給されます（遡及適用はありませんので、出生・転入時は15日以内にご申請ください）。',
    relatedToolsTitle: '関連する子育て・家族支援ツール',
    linkMaternity: '出産手当金シミュレーター（産前産後休業手当）',
    linkEligibility: '育児休業・給付チェッカー（権利・受給資格判定）',
    linkChildcareBenefit: '育児休業給付金シミュレーター（金額精密試算）',
    linkBirthWizard: '妊娠・出産・育児総合ガイド（手続きロードマップ）',
  },
  vi: {
    toolTitle: 'Kiểm Tra Trợ Cấp Trẻ Em (児童手当 - Cải cách 10/2024)',
    toolDesc: 'Công cụ mô phỏng chuẩn quy định mới nhất của Cơ quan Trẻ em & Gia đình Nhật Bản: Bỏ trần thu nhập, mở rộng đến hết cấp 3 (18 tuổi), con thứ 3 nhận 30,000円/tháng, đếm thứ tự con đến 22 tuổi và chi trả 6 lần/năm.',
    bannerReformTitle: '【CẢI CÁCH ĐỘT PHÁ TỪ 10/2024】4 Thay Đổi Trọng Yếu Cần Nắm',
    bannerReformDesc: '① Bỏ hoàn toàn trần thu nhập (100% hộ gia đình được nhận đủ); ② Mở rộng độ tuổi hưởng trợ cấp từ hết cấp 2 lên hết cấp 3 (18 tuổi); ③ Con thứ 3 trở đi nhận gấp đôi: 30,000円/tháng xuyên suốt (tính anh chị đến 22 tuổi); ④ Tăng tần suất chi trả lên 6 lần/năm (vào các tháng chẵn).',
    sectionChildren: '1. Danh sách và độ tuổi các con trong gia đình',
    sectionChildrenHint: '※ Vui lòng nhập tất cả các con từ 0 đến 22 tuổi (kể cả anh/chị đang học đại học) để hệ thống tính chính xác thứ tự hưởng trợ cấp con thứ 3.',
    addChildBtn: 'Thêm con',
    childNameLabel: 'Tên con (hoặc thứ tự)',
    childAgeLabel: 'Tuổi',
    hasSupportLabel: 'Cha mẹ đang chu cấp học phí hoặc sinh hoạt phí',
    hasSupportHint: '※ Con từ 19-22 tuổi nếu vẫn phụ thuộc kinh tế sẽ được tính làm anh/chị để đẩy con út vào diện con thứ 3 hưởng mức 30,000円/tháng.',
    sectionIncome: '2. Thu nhập hộ gia đình (để so sánh với luật cũ)',
    householdIncomeLabel: 'Thu nhập gộp cả năm của gia đình (Gross/năm)',
    householdIncomeHint: '※ Từ 10/2024 thu nhập không ảnh hưởng đến trợ cấp. Mục này dùng để đối chiếu số tiền bạn được hưởng thêm nhờ việc bãi bỏ trần thu nhập.',
    yenUnit: '円',
    monthUnit: 'tháng',
    ageUnit: 'tuổi',
    yearUnit: 'năm',
    resultsTitle: 'Kết Quả Ước Tính Trợ Cấp Trẻ Em',
    totalMonthlyLabel: 'Tổng trợ cấp mỗi tháng',
    bimonthlyLabel: 'Mỗi kỳ chi trả (tháng chẵn, 2 tháng/lần)',
    annualTotalLabel: 'Tổng trợ cấp mỗi năm',
    lifetimeEstimateLabel: 'Tổng trợ cấp ước tính còn lại đến hết cấp 3',
    breakdownTitle: 'Bảng Chi Tiết Từng Con & Thứ Tự Hưởng',
    colChild: 'Tên con',
    colAge: 'Tuổi',
    colRank: 'Thứ bậc đếm',
    colMonthly: 'Mức trợ cấp/tháng',
    colStatus: 'Trạng thái',
    statusReceiving: 'Được nhận trợ cấp',
    statusCountingOnly: 'Chỉ đếm thứ tự (19〜22 tuổi)',
    statusNotEligible: 'Hết tuổi (> 22 tuổi)',
    rankPrefix: 'Con thứ ',
    rankSuffix: '',
    scheduleTitle: 'Lịch Chi Trả Hàng Năm (6 Kỳ - Các Tháng Chẵn)',
    reformGainTitle: 'Lợi Ích Gia Tăng Từ Cải Cách Tháng 10/2024',
    gainMonthly: 'Tăng thêm mỗi tháng so với luật cũ: ',
    gainAnnual: 'Tăng thêm mỗi năm so với luật cũ: ',
    incomeAbolishedNotice: '★ Quyền lợi bỏ trần thu nhập: Theo luật cũ gia đình bạn bị giảm (chỉ nhận 5,000円) hoặc bị cắt 100%, nay được nhận đầy đủ!',
    highSchoolNotice: '★ Mở rộng cấp 3: Con học sinh THPT (16-18 tuổi) hiện đã được nhận 10,000円/tháng.',
    thirdChildNotice: '★ Tăng gấp đôi con thứ 3: Con thứ 3 được nhận 30,000円/tháng xuyên suốt.',
    officialDisclaimerTitle: '【THỦ TỤC HÀNH CHÍNH & NƠI NỘP HỒ SƠ】',
    officialDisclaimerText: 'Để nhận trợ cấp trẻ em, bạn phải nộp Đơn yêu cầu công nhận (認定請求書) tại Ủy ban quận/thành phố nơi cư trú (hoặc cơ quan nếu là công chức). Trợ cấp được tính từ tháng kế tiếp sau tháng nộp đơn (không được truy lĩnh ngược, vì vậy hãy nộp trong vòng 15 ngày sau khi sinh hoặc chuyển đến).',
    relatedToolsTitle: 'Công Cụ Hỗ Trợ Gia Đình Liên Quan',
    linkMaternity: 'Tính Trợ Cấp Thai Sản BHYT (出産手当金)',
    linkEligibility: 'Kiểm Tra Nghỉ Chăm Con & Trợ Cấp BHTN (育休チェッカー)',
    linkChildcareBenefit: 'Mô Phỏng Tiền Nghỉ Chăm Con 67% & 50% (育休手当)',
    linkBirthWizard: 'Cẩm Nang Mang Thai & Sinh Con (Quy trình từ A-Z)',
  },
  en: {
    toolTitle: 'Child Allowance Checker (Oct 2024 Reform Compliant)',
    toolDesc: 'Simulate Japan Child Allowance under the major Oct 2024 reform by the Children and Families Agency: Income limits abolished, extended to age 18, 30,000 JPY/month for 3rd child, and bimonthly disbursements.',
    bannerReformTitle: '【OCTOBER 2024 MAJOR REFORM】Key Highlights',
    bannerReformDesc: '① Income limits abolished for all households; ② Eligibility extended to high school age (age 18 fiscal end); ③ 3rd child rate doubled to 30,000 JPY/month; ④ Payment frequency increased to 6 times per year (even months).',
    sectionChildren: '1. Children & Family Composition',
    sectionChildrenHint: '※ Register all children up to age 22 so the system accurately calculates sibling ranks for the 3rd child 30,000 JPY rate.',
    addChildBtn: 'Add Child',
    childNameLabel: 'Child Name / Label',
    childAgeLabel: 'Age',
    hasSupportLabel: 'Parent provides living / tuition economic support',
    hasSupportHint: '※ Dependents aged 19-22 count as older siblings if supported, qualifying the 3rd child for 30,000 JPY.',
    sectionIncome: '2. Household Income (For Pre-Reform Comparison)',
    householdIncomeLabel: 'Gross Annual Household Income',
    householdIncomeHint: '※ Income limits no longer apply under the new law, but this is used to calculate your financial gains compared to the old regime.',
    yenUnit: 'JPY',
    monthUnit: 'month',
    ageUnit: 'yo',
    yearUnit: 'year',
    resultsTitle: 'Child Allowance Simulation Results',
    totalMonthlyLabel: 'Total Monthly Benefit',
    bimonthlyLabel: 'Bimonthly Payment (Every Even Month)',
    annualTotalLabel: 'Total Annual Benefit',
    lifetimeEstimateLabel: 'Total Remaining Lifetime Benefit Until Graduation',
    breakdownTitle: 'Child-by-Child Breakdown & Sibling Ranking',
    colChild: 'Child',
    colAge: 'Age',
    colRank: 'Sibling Rank',
    colMonthly: 'Monthly Rate',
    colStatus: 'Status',
    statusReceiving: 'Receiving Allowance',
    statusCountingOnly: 'Counting for Sibling Order (Age 19-22)',
    statusNotEligible: 'Ineligible (Age 23+)',
    rankPrefix: 'Child #',
    rankSuffix: '',
    scheduleTitle: 'Annual Payment Schedule (6 Times / Year)',
    reformGainTitle: 'Financial Gains from October 2024 Reform',
    gainMonthly: 'Monthly increase vs old law: ',
    gainAnnual: 'Annual increase vs old law: ',
    incomeAbolishedNotice: '★ Income Limit Removal: Under old rules your household was reduced to 5,000 JPY or 0 JPY; now you receive 100% full entitlement!',
    highSchoolNotice: '★ High School Expansion: Teenagers aged 16-18 now receive 10,000 JPY/month.',
    thirdChildNotice: '★ Doubled 3rd Child Rate: 3rd child and onwards receive 30,000 JPY/month throughout.',
    officialDisclaimerTitle: '【OFFICIAL ADMINISTRATIVE JURISDICTION NOTICE】',
    officialDisclaimerText: 'You must file an Application for Certification at your local municipal office (or employer for civil servants). Benefits start from the month following submission (no retroactive claims; file within 15 days of birth or moving).',
    relatedToolsTitle: 'Related Family & Child Tools',
    linkMaternity: 'Maternity Allowance Simulator (Health Insurance Daily Benefit)',
    linkEligibility: 'Childcare Leave & Benefit Eligibility Checker',
    linkChildcareBenefit: 'Childcare Leave Benefit Simulator (Payment Estimation)',
    linkBirthWizard: 'Birth & Childcare Guide (Life-Event Orchestrator)',
  },
};

export default function ChildAllowanceView({ lang = 'ja' }) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.ja;

  // Initial children state: 2 children (default: age 4 and age 1)
  const [children, setChildren] = useState([
    { id: 'c1', name: lang === 'vi' ? 'Bé đầu (4 tuổi)' : lang === 'en' ? '1st Child (4 yo)' : '第1子（4歳）', age: 4, hasParentalSupport: true },
    { id: 'c2', name: lang === 'vi' ? 'Bé út (1 tuổi)' : lang === 'en' ? '2nd Child (1 yo)' : '第2子（1歳）', age: 1, hasParentalSupport: true },
  ]);

  const [householdAnnualIncome, setHouseholdAnnualIncome] = useState(6000000);

  // Engine evaluation
  const result = useMemo(() => {
    return calculateChildAllowance({
      children,
      householdAnnualIncome,
    });
  }, [children, householdAnnualIncome]);

  // Child list management
  const handleAddChild = () => {
    const nextIdx = children.length + 1;
    const newChild = {
      id: `c_${Date.now()}`,
      name: lang === 'vi' ? `Bé thứ ${nextIdx}` : lang === 'en' ? `Child #${nextIdx}` : `第${nextIdx}子`,
      age: 0,
      hasParentalSupport: true,
    };
    setChildren([...children, newChild]);
  };

  const handleRemoveChild = (id) => {
    if (children.length <= 1) return;
    setChildren(children.filter((c) => c.id !== id));
  };

  const handleUpdateChild = (id, field, value) => {
    setChildren(children.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  };

  return (
    <StandardToolLayout
      title={t.toolTitle}
      description={t.toolDesc}
      badge="Japan Life • Family & Child"
      maxWidth="max-w-[1240px]"
    >
      <div className="space-y-8 max-w-full overflow-hidden">
        {/* OCT 2024 REFORM BANNER */}
        <div className="p-4 sm:p-5 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 flex items-start gap-3.5">
          <Sparkles className="w-5 h-5 text-indigo-700 dark:text-indigo-400 mt-0.5 shrink-0" />
          <div className="space-y-1 text-xs sm:text-sm">
            <h3 className="font-bold text-indigo-900 dark:text-indigo-200">
              {t.bannerReformTitle}
            </h3>
            <p className="text-indigo-800 dark:text-indigo-300 leading-relaxed">
              {t.bannerReformDesc}
            </p>
          </div>
        </div>

        {/* INPUT SECTION 1: CHILDREN CONFIGURATION */}
        <section className="bg-surface rounded-2xl p-5 sm:p-6 border border-border shadow-sm space-y-5 max-w-full overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-700 dark:text-indigo-400" />
              <h2 className="text-base sm:text-lg font-bold text-foreground">
                {t.sectionChildren}
              </h2>
            </div>
            <button
              type="button"
              id="add-child-button"
              onClick={handleAddChild}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-700 dark:bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-800 transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>{t.addChildBtn}</span>
            </button>
          </div>

          <p className="text-xs text-muted-foreground">
            {t.sectionChildrenHint}
          </p>

          <div className="space-y-4">
            {children.map((child, index) => {
              const isSupportRelevant = child.age >= 19 && child.age <= 22;
              return (
                <div
                  key={child.id}
                  className="p-4 rounded-xl border border-border bg-background/60 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    {/* Child Name */}
                    <div className="flex-1 space-y-1">
                      <label
                        htmlFor={`child-name-${child.id}`}
                        className="block text-[11px] font-semibold text-muted-foreground"
                      >
                        {t.childNameLabel}
                      </label>
                      <input
                        id={`child-name-${child.id}`}
                        aria-label={t.childNameLabel}
                        type="text"
                        value={child.name}
                        onChange={(e) => handleUpdateChild(child.id, 'name', e.target.value)}
                        className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-foreground font-medium text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>

                    {/* Child Age */}
                    <div className="w-full sm:w-36 space-y-1">
                      <label
                        htmlFor={`child-age-${child.id}`}
                        className="block text-[11px] font-semibold text-muted-foreground"
                      >
                        {t.childAgeLabel}
                      </label>
                      <div className="relative">
                        <input
                          id={`child-age-${child.id}`}
                          aria-label={t.childAgeLabel}
                          type="number"
                          min="0"
                          max="25"
                          value={child.age}
                          onChange={(e) => handleUpdateChild(child.id, 'age', Math.max(0, parseInt(e.target.value, 10) || 0))}
                          className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-foreground font-medium text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none pr-8"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                          {t.ageUnit}
                        </span>
                      </div>
                    </div>

                    {/* Remove button */}
                    {children.length > 1 && (
                      <div className="sm:pt-5 flex justify-end">
                        <button
                          type="button"
                          id={`remove-child-${child.id}`}
                          aria-label={`Remove ${child.name}`}
                          onClick={() => handleRemoveChild(child.id)}
                          className="p-2 text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Parental Support toggle for 19-22 age */}
                  {isSupportRelevant && (
                    <div className="pt-2 border-t border-border/40 flex items-start gap-2.5">
                      <input
                        id={`child-support-${child.id}`}
                        aria-label={t.hasSupportLabel}
                        type="checkbox"
                        checked={child.hasParentalSupport}
                        onChange={(e) => handleUpdateChild(child.id, 'hasParentalSupport', e.target.checked)}
                        className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <div className="space-y-0.5">
                        <label
                          htmlFor={`child-support-${child.id}`}
                          className="text-xs font-semibold text-foreground cursor-pointer"
                        >
                          {t.hasSupportLabel}
                        </label>
                        <p className="text-[11px] text-muted-foreground">
                          {t.hasSupportHint}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* INPUT SECTION 2: HOUSEHOLD INCOME */}
        <section className="bg-surface rounded-2xl p-5 sm:p-6 border border-border shadow-sm space-y-4 max-w-full overflow-hidden">
          <div className="flex items-center gap-2 border-b border-border/60 pb-3">
            <DollarSign className="w-5 h-5 text-indigo-700 dark:text-indigo-400" />
            <h2 className="text-base sm:text-lg font-bold text-foreground">
              {t.sectionIncome}
            </h2>
          </div>

          <div className="max-w-md space-y-2">
            <label htmlFor="household-income-input" className="block text-xs sm:text-sm font-semibold text-foreground">
              {t.householdIncomeLabel}
            </label>
            <div className="relative">
              <input
                id="household-income-input"
                aria-label={t.householdIncomeLabel}
                type="number"
                step="500000"
                min="0"
                max="50000000"
                value={householdAnnualIncome}
                onChange={(e) => setHouseholdAnnualIncome(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-foreground font-medium text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none pr-12"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                {t.yenUnit}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {t.householdIncomeHint}
            </p>
          </div>
        </section>

        {/* SECTION 3: SIMULATION RESULTS */}
        <section className="space-y-6">
          <h2 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-700 dark:text-indigo-400" />
            <span>{t.resultsTitle}</span>
          </h2>

          {/* KPI CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Monthly Total */}
            <div className="p-5 rounded-2xl bg-surface border border-border shadow-xs space-y-2">
              <span className="text-xs font-semibold text-muted-foreground block">
                {t.totalMonthlyLabel}
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                  {result.totalMonthlyAllowance.toLocaleString()}
                </span>
                <span className="text-xs font-medium text-muted-foreground">
                  {t.yenUnit}/{t.monthUnit}
                </span>
              </div>
            </div>

            {/* Bimonthly Payment */}
            <div className="p-5 rounded-2xl bg-surface border border-border shadow-xs space-y-2">
              <span className="text-xs font-semibold text-muted-foreground block">
                {t.bimonthlyLabel}
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-extrabold text-indigo-700 dark:text-indigo-300 tracking-tight">
                  {result.bimonthlyPayment.toLocaleString()}
                </span>
                <span className="text-xs font-medium text-muted-foreground">
                  {t.yenUnit}/kỳ
                </span>
              </div>
            </div>

            {/* Annual Total */}
            <div className="p-5 rounded-2xl bg-surface border border-border shadow-xs space-y-2">
              <span className="text-xs font-semibold text-muted-foreground block">
                {t.annualTotalLabel}
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                  {result.totalAnnualAllowance.toLocaleString()}
                </span>
                <span className="text-xs font-medium text-muted-foreground">
                  {t.yenUnit}/{t.yearUnit}
                </span>
              </div>
            </div>

            {/* Remaining Lifetime */}
            <div className="p-5 rounded-2xl bg-surface border border-border shadow-xs space-y-2">
              <span className="text-xs font-semibold text-muted-foreground block">
                {t.lifetimeEstimateLabel}
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-extrabold text-emerald-800 dark:text-emerald-300 tracking-tight">
                  {result.totalRemainingLifetimeEstimate.toLocaleString()}
                </span>
                <span className="text-xs font-medium text-muted-foreground">
                  {t.yenUnit}
                </span>
              </div>
            </div>
          </div>

          {/* REFORM GAIN HIGHLIGHT CARD */}
          <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 space-y-3">
            <h3 className="text-xs sm:text-sm font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              <span>{t.reformGainTitle}</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
              <div className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border">
                <span className="text-muted-foreground">{t.gainMonthly}</span>
                <span className="font-bold text-emerald-800 dark:text-emerald-300">
                  +{result.reformComparison.monthlyGain.toLocaleString()} {t.yenUnit}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border">
                <span className="text-muted-foreground">{t.gainAnnual}</span>
                <span className="font-bold text-emerald-800 dark:text-emerald-300">
                  +{result.reformComparison.annualGain.toLocaleString()} {t.yenUnit}
                </span>
              </div>
            </div>
            <div className="space-y-1.5 text-xs text-emerald-950 dark:text-emerald-300 pt-1">
              {result.reformComparison.incomeLimitAbolishedBenefit && (
                <p className="font-medium">{t.incomeAbolishedNotice}</p>
              )}
              {result.reformComparison.highSchoolIncluded && (
                <p className="font-medium">{t.highSchoolNotice}</p>
              )}
              {result.reformComparison.thirdChildRateDoubled && (
                <p className="font-medium">{t.thirdChildNotice}</p>
              )}
            </div>
          </div>

          {/* CHILD-BY-CHILD BREAKDOWN TABLE */}
          <div className="bg-surface rounded-2xl border border-border p-5 sm:p-6 shadow-sm space-y-4 max-w-full overflow-hidden">
            <h3 className="font-bold text-sm sm:text-base text-foreground">
              {t.breakdownTitle}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="py-2.5 px-3 font-semibold">{t.colChild}</th>
                    <th className="py-2.5 px-3 font-semibold">{t.colAge}</th>
                    <th className="py-2.5 px-3 font-semibold">{t.colRank}</th>
                    <th className="py-2.5 px-3 font-semibold">{t.colMonthly}</th>
                    <th className="py-2.5 px-3 font-semibold">{t.colStatus}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {result.childrenDetails.map((c) => {
                    let statusLabel = t.statusNotEligible;
                    let statusBadgeClass = 'bg-muted text-muted-foreground';

                    if (c.isReceivingAllowance) {
                      statusLabel = t.statusReceiving;
                      statusBadgeClass = 'bg-emerald-500/15 border-emerald-500/30 text-emerald-800 dark:text-emerald-300';
                    } else if (c.countsForSiblingOrder) {
                      statusLabel = t.statusCountingOnly;
                      statusBadgeClass = 'bg-indigo-500/15 border-indigo-500/30 text-indigo-800 dark:text-indigo-300';
                    }

                    return (
                      <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-3 font-medium text-foreground">
                          {c.name}
                        </td>
                        <td className="py-3 px-3 text-muted-foreground">
                          {c.age} {t.ageUnit}
                        </td>
                        <td className="py-3 px-3 font-semibold text-foreground">
                          {c.siblingRank !== null ? (
                            <span className={c.siblingRank >= 3 ? 'text-amber-900 dark:text-amber-300 font-bold' : ''}>
                              {t.rankPrefix}{c.siblingRank}{t.rankSuffix}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-bold text-foreground">
                          {c.monthlyAllowance > 0 ? (
                            <span className={c.rateTier === 'third_child_or_above' ? 'text-amber-900 dark:text-amber-300' : ''}>
                              {c.monthlyAllowance.toLocaleString()} {t.yenUnit}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">0 {t.yenUnit}</span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold border ${statusBadgeClass}`}>
                            {statusLabel}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* DISBURSEMENT SCHEDULE */}
          <div className="bg-surface rounded-2xl border border-border p-5 sm:p-6 shadow-sm space-y-4 max-w-full overflow-hidden">
            <h3 className="font-bold text-sm sm:text-base text-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-700 dark:text-indigo-400" />
              <span>{t.scheduleTitle}</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {result.disbursementSchedule.map((sched) => (
                <div
                  key={sched.paymentMonth}
                  className="p-3.5 rounded-xl border border-border bg-background/60 text-center space-y-1"
                >
                  <span className="text-xs font-bold text-foreground block">
                    {lang === 'vi' ? sched.labelVi : lang === 'en' ? sched.labelEn : sched.labelJa}
                  </span>
                  <span className="text-sm font-extrabold text-indigo-700 dark:text-indigo-300 block">
                    {sched.amount.toLocaleString()} {t.yenUnit}
                  </span>
                </div>
              ))}
            </div>
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
            <RegulatorySourceView sourceIds={CHILD_ALLOWANCE_SOURCES} lang={lang} />
          </div>
        </section>
      </div>
    </StandardToolLayout>
  );
}
