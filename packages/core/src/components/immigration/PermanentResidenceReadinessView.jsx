/**
 * @file packages/core/src/components/immigration/PermanentResidenceReadinessView.jsx
 * @description
 * Giao diện Đánh giá Mức độ Sẵn sàng Xin Vĩnh trú Nhật Bản (永住申請準備度チェッカー).
 * Tuân thủ chuẩn MAIS Gate 1-4:
 * - Nguồn sự thật duy nhất (SOT) cho ngôn ngữ: props.lang
 * - Chuẩn Trợ năng WCAG 2.1 AA (mọi input có label/id/aria-label, tương phản cao)
 * - Tương thích Theme CSS Tokens
 */

import React, { useState, useId, useMemo } from 'react';
import StandardToolLayout from '../shared/StandardToolLayout.jsx';
import RegulatorySourceView from '../regulatory/RegulatorySourceView.jsx';
import {
  evaluatePermanentResidenceReadiness,
  PR_APPLICATION_ROUTES,
  PR_INCOME_BENCHMARKS,
  PR_2026_REFORM_CONTEXT
} from '../../japan/immigration/index.js';
import {
  Award,
  ShieldCheck,
  Calendar,
  Clock,
  Coins,
  FileText,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Scale,
  Plane,
  Info
} from 'lucide-react';

export default function PermanentResidenceReadinessView({ lang = 'vi' }) {
  const routeInput = useId();
  const stayYearsInput = useId();
  const workYearsInput = useId();
  const marriageYearsInput = useId();
  const visaPeriodInput = useId();
  const singleAbroadInput = useId();
  const totalAbroadInput = useId();
  const incomeInput = useId();
  const dependentInput = useId();
  const taxCheckboxInput = useId();
  const pensionCheckboxInput = useId();
  const guarantorCheckboxInput = useId();
  const conductCheckboxInput = useId();

  // State
  const [routeId, setRouteId] = useState('standard_10_year');
  const [yearsContinuousStay, setYearsContinuousStay] = useState(10);
  const [yearsWorkStay, setYearsWorkStay] = useState(5);
  const [yearsMarriage, setYearsMarriage] = useState(3);
  const [currentVisaPeriodYears, setCurrentVisaPeriodYears] = useState(3);
  const [maxConsecutiveDaysAbroad, setMaxConsecutiveDaysAbroad] = useState(30);
  const [totalDaysAbroadPerYear, setTotalDaysAbroadPerYear] = useState(45);
  const [annualIncomeMan, setAnnualIncomeMan] = useState(450); // 万 (man) JPY
  const [dependentCount, setDependentCount] = useState(0);
  const [taxPaidOnTimeAllYears, setTaxPaidOnTimeAllYears] = useState(true);
  const [pensionPaidOnTimeAllYears, setPensionPaidOnTimeAllYears] = useState(true);
  const [hasGuarantor, setHasGuarantor] = useState(true);
  const [hasCleanCriminalRecord, setHasCleanCriminalRecord] = useState(true);

  // Thẩm định
  const assessment = useMemo(() => {
    return evaluatePermanentResidenceReadiness({
      routeId,
      yearsContinuousStay: Number(yearsContinuousStay) || 0,
      yearsWorkStay: Number(yearsWorkStay) || 0,
      yearsMarriage: Number(yearsMarriage) || 0,
      currentVisaPeriodYears: Number(currentVisaPeriodYears) || 1,
      maxConsecutiveDaysAbroad: Number(maxConsecutiveDaysAbroad) || 0,
      totalDaysAbroadPerYear: Number(totalDaysAbroadPerYear) || 0,
      annualIncome: (Number(annualIncomeMan) || 0) * 10000,
      dependentCount: Number(dependentCount) || 0,
      taxPaidOnTimeAllYears,
      pensionPaidOnTimeAllYears,
      hasGuarantor,
      hasCleanCriminalRecord
    });
  }, [
    routeId,
    yearsContinuousStay,
    yearsWorkStay,
    yearsMarriage,
    currentVisaPeriodYears,
    maxConsecutiveDaysAbroad,
    totalDaysAbroadPerYear,
    annualIncomeMan,
    dependentCount,
    taxPaidOnTimeAllYears,
    pensionPaidOnTimeAllYears,
    hasGuarantor,
    hasCleanCriminalRecord
  ]);

  // Từ điển nội bộ
  const I18N = {
    vi: {
      toolTitle: 'Kiểm Tra Mức Độ Sẵn Sàng Xin Vĩnh Trú (永住申請)',
      toolDesc: 'Đánh giá 6 chiều kích pháp định theo Hướng dẫn chính thức của ISA: Cư trú, Thuế, Lương hưu, Thu nhập và Người bảo lãnh.',
      badge: 'Luật Nhập Quản Đ.22',
      routeLabel: 'Tuyến xin cấp phép Vĩnh trú',
      routeStandard: 'Tuyến chuẩn 10 năm (Tối thiểu 5 năm đi làm)',
      routeSpouse: 'Tuyến ưu tiên Vợ/Chồng công dân Nhật hoặc Người Vĩnh trú',
      routeHsp80: 'Tuyến Lao động chất lượng cao 80 điểm (Tối thiểu 1 năm)',
      routeHsp70: 'Tuyến Lao động chất lượng cao 70 điểm (Tối thiểu 3 năm)',
      stayYears: 'Số năm cư trú liên tục tại Nhật',
      workYears: 'Số năm đi làm có đóng bảo hiểm/thuế',
      marriageYears: 'Số năm kết hôn thực tế',
      visaPeriod: 'Thời hạn visa hiện tại',
      visa3or5: '3 năm hoặc 5 năm (Đủ điều kiện nộp)',
      visa1: '1 năm (Bị từ chối tiếp nhận hồ sơ)',
      singleAbroad: 'Số ngày xuất cảnh dài nhất trong 1 chuyến (ngày)',
      totalAbroad: 'Tổng số ngày ở ngoài Nhật Bản trong 1 năm (ngày)',
      income: 'Thu nhập chịu thuế hàng năm (Vạn Yên)',
      dependents: 'Số người phụ thuộc trên thuế',
      taxCheck: 'Đã nộp đầy đủ và ĐÚNG HẠN 100% thuế cư trú/thu nhập trong các năm xét duyệt',
      pensionCheck: 'Đã nộp đầy đủ và ĐÚNG HẠN 100% BHYT và Nenkin trong 2 năm gần nhất',
      guarantorCheck: 'Có Người bảo lãnh là Công dân Nhật Bản hoặc Người có visa Vĩnh trú',
      conductCheck: 'Lý lịch tư pháp trong sạch, không có tiền án hoặc vi phạm giao thông nặng',
      scoreTitle: 'Mức độ sẵn sàng nộp hồ sơ',
      highReadiness: 'Rất Sẵn Sàng — Đạt Đầy Đủ 6 Tiêu Chí Pháp Định',
      moderateReadiness: 'Tương Đối Sẵn Sàng — Cần Gia Cố Thêm Điểm Yếu',
      lowReadiness: 'Chưa Sẵn Sàng — Cần Cải Thiện Thêm Thời Gian/Thuế',
      disqualified: 'Chưa Đủ Điều Kiện Nộp — Tồn Tại Rào Cản Pháp Lý Cứng',
      passedDimensionText: (p, tot) => `Đạt ${p} / ${tot} chiều kích pháp định cốt lõi`,
      dimensionsTitle: 'Bảng Đối Soát 6 Chiều Kích Pháp Lý Cốt Lõi',
      financialTitle: 'Độc Lập Kinh Tế & Thu Nhập Ổn Định',
      incomeBenchmark: 'Mức thu nhập khuyến nghị:',
      actualIncome: 'Thu nhập khai báo:',
      incomeSufficient: 'Đạt ngưỡng thu nhập an toàn',
      incomeInsufficient: 'Dưới ngưỡng thu nhập an toàn của ISA',
      feeTitle: 'Lệ phí hành chính cấp thẻ Vĩnh trú',
      feeApp: 'Lệ phí nộp hồ sơ: 0 JPY (Miễn phí)',
      feeGrant: 'Lệ phí khi nhận thẻ:',
      feeNote: 'Chỉ nộp khi nhận thẻ Vĩnh trú bằng tem doanh thu 収入印紙.',
      docsTitle: 'Danh mục Hồ sơ Chính thức của ISA',
      reformTitle: 'Cải cách Luật Nhập cảnh 2024 / 2026',
      met: 'Đạt',
      unmet: 'Chưa đạt',
    },
    ja: {
      toolTitle: '永住申請準備度チェッカー',
      toolDesc: '入管法第22条および永住許可ガイドラインに基づく6大法的要件（居住、在留期間、納税、公的年金、独立生計、身元保証人）を判定。',
      badge: '入管法第22条',
      routeLabel: '永住申請ルートの選択',
      routeStandard: '原則10年在留ルート（就労資格5年以上）',
      routeSpouse: '日本人・永住者の配偶者特例ルート（婚姻3年・在留1年）',
      routeHsp80: '高度専門職80点特例ルート（最短1年）',
      routeHsp70: '高度専門職70点特例ルート（最短3年）',
      stayYears: '日本継続在留年数',
      workYears: '就労資格での在留年数',
      marriageYears: '実態のある婚姻期間（年）',
      visaPeriod: '現に有している在留期間',
      visa3or5: '3年または5年（受理要件を満たします）',
      visa1: '1年（原則として不受理・要件未達）',
      singleAbroad: '1回の最長連続出国日数（日）',
      totalAbroad: '年間合計出国日数（日）',
      income: '直近年度の年間総所得（万円）',
      dependents: '税法上の扶養親族数',
      taxCheck: '審査対象期間の住民税等を1日も遅れず100%納期内に納付している',
      pensionCheck: '直近2年間の公的年金・健康保険料を納期内に完納している',
      guarantorCheck: '身元保証人（日本人または永住者）を確保している',
      conductCheck: '重大な法令違反・罰金刑・度重なる交通違反歴がないこと',
      scoreTitle: '永住申請準備スコア',
      highReadiness: '準備万全 — 6大要件をすべて満たしています',
      moderateReadiness: '概ね良好 — 一部補強資料の準備を推奨',
      lowReadiness: '準備不足 — 納税実績や年数の積み直しが必要',
      disqualified: '要件未達 — 形式的不備または重大な阻害要因あり',
      passedDimensionText: (p, tot) => `6大法定要件のうち ${p} / ${tot} 項目を満たしています`,
      dimensionsTitle: '永住許可ガイドライン 6大審査基準チェック',
      financialTitle: '独立生計要件・安定収入判定',
      incomeBenchmark: '生活維持推奨目安年収：',
      actualIncome: '申告年収：',
      incomeSufficient: '安全基準を満たしています',
      incomeInsufficient: '推奨目安年収を下回っています',
      feeTitle: '永住許可手数料（収入印紙）',
      feeApp: '申請時手数料: 0円（無料）',
      feeGrant: '許可時納付額:',
      feeNote: '許可決定時に新しい在留カードを受領する際のみ納付。',
      docsTitle: '出入国在留管理庁 提出書類リスト',
      reformTitle: '入管法改正情報（永住取消制度）',
      met: '適合',
      unmet: '未達',
    },
    en: {
      toolTitle: 'Permanent Residence Readiness Checker',
      toolDesc: 'Objective readiness evaluation across 6 statutory dimensions under Immigration Act Article 22 and ISA Guidelines.',
      badge: 'Immigration Act Art. 22',
      routeLabel: 'Permanent Residence Application Route',
      routeStandard: 'Standard 10-Year Route (Min. 5 years on work status)',
      routeSpouse: 'Spouse of Japanese National / Permanent Resident Route',
      routeHsp80: 'Highly Skilled Professional 80+ Points (Fast-track 1 year)',
      routeHsp70: 'Highly Skilled Professional 70+ Points (Fast-track 3 years)',
      stayYears: 'Continuous Residence in Japan (Years)',
      workYears: 'Years on Work Visa',
      marriageYears: 'Years of Substantive Marriage',
      visaPeriod: 'Current Visa Period of Stay',
      visa3or5: '3 or 5 Years (Satisfies filing guideline)',
      visa1: '1 Year (Disqualifying under current rules)',
      singleAbroad: 'Longest Single Trip Abroad (Days)',
      totalAbroad: 'Total Days Abroad per Year (Days)',
      income: 'Annual Taxable Income (in 10,000 JPY)',
      dependents: 'Number of Tax Dependents',
      taxCheck: 'Paid 100% of inhabitant and income taxes on or before due date',
      pensionCheck: 'Paid 100% of pension and health insurance on time for the past 2 years',
      guarantorCheck: 'Secured an eligible Guarantor (Japanese citizen or PR)',
      conductCheck: 'Clean criminal record and no repeated traffic infractions',
      scoreTitle: 'Permanent Residence Readiness Score',
      highReadiness: 'High Readiness — All 6 Statutory Criteria Fulfilled',
      moderateReadiness: 'Moderate Readiness — Supplementary Proof Recommended',
      lowReadiness: 'Low Readiness — Needs Further Compliance History',
      disqualified: 'Disqualified — Unmet Mandatory Filing Condition',
      passedDimensionText: (p, tot) => `Satisfied ${p} of ${tot} core statutory dimensions`,
      dimensionsTitle: 'Inspection across 6 Core Statutory Dimensions',
      financialTitle: 'Economic Self-Sufficiency & Income Stability',
      incomeBenchmark: 'Recommended Income Benchmark:',
      actualIncome: 'Reported Income:',
      incomeSufficient: 'Meets safe income benchmark',
      incomeInsufficient: 'Below benchmark (Supplementary savings needed)',
      feeTitle: 'Permanent Residence Official Fee Schedule',
      feeApp: 'Filing Fee: 0 JPY (Free)',
      feeGrant: 'Grant Fee upon Approval:',
      feeNote: 'Payable exclusively upon issuance of the PR card via revenue stamps.',
      docsTitle: 'Official ISA Document Checklist',
      reformTitle: 'Immigration Reform Context (Status Revocation)',
      met: 'Met',
      unmet: 'Unmet',
    }
  };
  const t = I18N[lang] || I18N.vi;

  return (
    <StandardToolLayout
      title={t.toolTitle}
      description={t.toolDesc}
      badge={t.badge}
      maxWidth="max-w-[1240px]"
    >
      <div className="space-y-6">
        {/* Form Thiết Lập */}
        <div className="bg-surface-container border border-outline-variant rounded-2xl p-6 shadow-sm space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Tuyến nộp hồ sơ */}
            <div className="space-y-1.5">
              <label htmlFor={routeInput} className="block text-sm font-semibold text-on-surface">
                {t.routeLabel}
              </label>
              <select
                id={routeInput}
                aria-label={t.routeLabel}
                value={routeId}
                onChange={(e) => setRouteId(e.target.value)}
                className="w-full bg-surface border border-outline-variant rounded-xl px-3.5 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="standard_10_year">{t.routeStandard}</option>
                <option value="spouse_of_japanese_or_pr">{t.routeSpouse}</option>
                <option value="hsp_80_points">{t.routeHsp80}</option>
                <option value="hsp_70_points">{t.routeHsp70}</option>
              </select>
            </div>

            {/* Thời hạn visa hiện tại */}
            <div className="space-y-1.5">
              <label htmlFor={visaPeriodInput} className="block text-sm font-semibold text-on-surface">
                {t.visaPeriod}
              </label>
              <select
                id={visaPeriodInput}
                aria-label={t.visaPeriod}
                value={currentVisaPeriodYears}
                onChange={(e) => setCurrentVisaPeriodYears(Number(e.target.value))}
                className="w-full bg-surface border border-outline-variant rounded-xl px-3.5 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value={3}>3 năm (Đạt chuẩn nộp hồ sơ)</option>
                <option value={5}>5 năm (Đạt chuẩn nộp hồ sơ)</option>
                <option value={1}>1 năm (Chưa đủ điều kiện nộp)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Số năm ở Nhật */}
            <div className="space-y-1.5">
              <label htmlFor={stayYearsInput} className="block text-sm font-semibold text-on-surface">
                {t.stayYears}
              </label>
              <input
                id={stayYearsInput}
                type="number"
                min={0}
                max={50}
                aria-label={t.stayYears}
                value={yearsContinuousStay}
                onChange={(e) => setYearsContinuousStay(Number(e.target.value) || 0)}
                className="w-full bg-surface border border-outline-variant rounded-xl px-3.5 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary font-mono"
              />
            </div>

            {/* Số năm đi làm (nếu là tuyến 10 năm) */}
            {routeId === 'standard_10_year' && (
              <div className="space-y-1.5">
                <label htmlFor={workYearsInput} className="block text-sm font-semibold text-on-surface">
                  {t.workYears}
                </label>
                <input
                  id={workYearsInput}
                  type="number"
                  min={0}
                  max={50}
                  aria-label={t.workYears}
                  value={yearsWorkStay}
                  onChange={(e) => setYearsWorkStay(Number(e.target.value) || 0)}
                  className="w-full bg-surface border border-outline-variant rounded-xl px-3.5 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                />
              </div>
            )}

            {/* Số năm kết hôn (nếu là tuyến vợ chồng) */}
            {routeId === 'spouse_of_japanese_or_pr' && (
              <div className="space-y-1.5">
                <label htmlFor={marriageYearsInput} className="block text-sm font-semibold text-on-surface">
                  {t.marriageYears}
                </label>
                <input
                  id={marriageYearsInput}
                  type="number"
                  min={0}
                  max={50}
                  aria-label={t.marriageYears}
                  value={yearsMarriage}
                  onChange={(e) => setYearsMarriage(Number(e.target.value) || 0)}
                  className="w-full bg-surface border border-outline-variant rounded-xl px-3.5 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                />
              </div>
            )}

            {/* Thu nhập hàng năm */}
            <div className="space-y-1.5">
              <label htmlFor={incomeInput} className="block text-sm font-semibold text-on-surface">
                {t.income}
              </label>
              <input
                id={incomeInput}
                type="number"
                step={10}
                min={0}
                aria-label={t.income}
                value={annualIncomeMan}
                onChange={(e) => setAnnualIncomeMan(Number(e.target.value) || 0)}
                className="w-full bg-surface border border-outline-variant rounded-xl px-3.5 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Số người phụ thuộc */}
            <div className="space-y-1.5">
              <label htmlFor={dependentInput} className="block text-sm font-semibold text-on-surface">
                {t.dependents}
              </label>
              <input
                id={dependentInput}
                type="number"
                min={0}
                max={10}
                aria-label={t.dependents}
                value={dependentCount}
                onChange={(e) => setDependentCount(Number(e.target.value) || 0)}
                className="w-full bg-surface border border-outline-variant rounded-xl px-3.5 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary font-mono"
              />
            </div>

            {/* Xuất cảnh dài nhất */}
            <div className="space-y-1.5">
              <label htmlFor={singleAbroadInput} className="block text-sm font-semibold text-on-surface">
                {t.singleAbroad}
              </label>
              <input
                id={singleAbroadInput}
                type="number"
                min={0}
                aria-label={t.singleAbroad}
                value={maxConsecutiveDaysAbroad}
                onChange={(e) => setMaxConsecutiveDaysAbroad(Number(e.target.value) || 0)}
                className="w-full bg-surface border border-outline-variant rounded-xl px-3.5 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary font-mono"
              />
            </div>

            {/* Tổng ngày xuất cảnh/năm */}
            <div className="space-y-1.5">
              <label htmlFor={totalAbroadInput} className="block text-sm font-semibold text-on-surface">
                {t.totalAbroad}
              </label>
              <input
                id={totalAbroadInput}
                type="number"
                min={0}
                aria-label={t.totalAbroad}
                value={totalDaysAbroadPerYear}
                onChange={(e) => setTotalDaysAbroadPerYear(Number(e.target.value) || 0)}
                className="w-full bg-surface border border-outline-variant rounded-xl px-3.5 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary font-mono"
              />
            </div>
          </div>

          {/* 4 Checkbox điều kiện cứng */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <label htmlFor={taxCheckboxInput} className="flex items-center gap-2.5 p-3.5 bg-surface border border-outline-variant rounded-xl cursor-pointer text-sm font-medium text-on-surface">
              <input
                id={taxCheckboxInput}
                type="checkbox"
                aria-label={t.taxCheck}
                checked={taxPaidOnTimeAllYears}
                onChange={(e) => setTaxPaidOnTimeAllYears(e.target.checked)}
                className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary"
              />
              <span>{t.taxCheck}</span>
            </label>

            <label htmlFor={pensionCheckboxInput} className="flex items-center gap-2.5 p-3.5 bg-surface border border-outline-variant rounded-xl cursor-pointer text-sm font-medium text-on-surface">
              <input
                id={pensionCheckboxInput}
                type="checkbox"
                aria-label={t.pensionCheck}
                checked={pensionPaidOnTimeAllYears}
                onChange={(e) => setPensionPaidOnTimeAllYears(e.target.checked)}
                className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary"
              />
              <span>{t.pensionCheck}</span>
            </label>

            <label htmlFor={guarantorCheckboxInput} className="flex items-center gap-2.5 p-3.5 bg-surface border border-outline-variant rounded-xl cursor-pointer text-sm font-medium text-on-surface">
              <input
                id={guarantorCheckboxInput}
                type="checkbox"
                aria-label={t.guarantorCheck}
                checked={hasGuarantor}
                onChange={(e) => setHasGuarantor(e.target.checked)}
                className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary"
              />
              <span>{t.guarantorCheck}</span>
            </label>

            <label htmlFor={conductCheckboxInput} className="flex items-center gap-2.5 p-3.5 bg-surface border border-outline-variant rounded-xl cursor-pointer text-sm font-medium text-on-surface">
              <input
                id={conductCheckboxInput}
                type="checkbox"
                aria-label={t.conductCheck}
                checked={hasCleanCriminalRecord}
                onChange={(e) => setHasCleanCriminalRecord(e.target.checked)}
                className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary"
              />
              <span>{t.conductCheck}</span>
            </label>
          </div>
        </div>

        {/* Kết Quả Thẩm Định */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cột trái: Điểm số & 6 Chiều kích */}
          <div className="lg:col-span-2 space-y-6">
            {/* Thẻ Điểm số */}
            <div className={`p-6 rounded-2xl border ${
              assessment.readinessCategory === 'high_readiness'
                ? 'bg-primary text-on-primary border-primary'
                : assessment.readinessCategory === 'disqualified'
                ? 'bg-red-700 text-white border-red-800'
                : assessment.readinessCategory === 'low_readiness'
                ? 'bg-orange-600 text-white border-orange-700'
                : 'bg-amber-600 text-white border-amber-700'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs uppercase font-bold tracking-wider">{t.scoreTitle}</span>
                  <h3 className="text-2xl font-black mt-1">
                    {assessment.readinessCategory === 'high_readiness' && t.highReadiness}
                    {assessment.readinessCategory === 'moderate_readiness' && t.moderateReadiness}
                    {assessment.readinessCategory === 'low_readiness' && t.lowReadiness}
                    {assessment.readinessCategory === 'disqualified' && t.disqualified}
                  </h3>
                  <p className="text-sm font-medium mt-1">
                    {t.passedDimensionText(assessment.passedCount, assessment.totalDimensions)}
                  </p>
                </div>
                <div className="text-5xl font-black font-mono pl-4">
                  {assessment.readinessScore}%
                </div>
              </div>
            </div>

            {/* Bảng 6 Chiều kích */}
            <div className="bg-surface-container border border-outline-variant rounded-2xl p-5 space-y-4">
              <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
                <Scale className="w-5 h-5 text-primary" />
                <span>{t.dimensionsTitle}</span>
              </h3>
              <div className="space-y-3">
                {assessment.dimensions.map((dim) => (
                  <div key={dim.id} className="p-3.5 bg-surface rounded-xl border border-outline-variant space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-on-surface">
                        {lang === 'ja' ? dim.title_ja : lang === 'en' ? dim.title_en : dim.title_vn}
                      </span>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                        dim.met ? 'bg-primary text-on-primary' : 'bg-red-700 text-white'
                      }`}>
                        {dim.met ? t.met : t.unmet}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant">
                      {lang === 'ja' ? dim.guidance_ja : lang === 'en' ? dim.guidance_en : dim.guidance_vn}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Cảnh báo & Án lệ McLean */}
            <div className="space-y-3">
              {assessment.warnings.map((warn) => (
                <div
                  key={warn.code}
                  className={`p-4 rounded-xl border space-y-1 ${
                    warn.severity === 'danger'
                      ? 'border-red-600 bg-red-950/10 text-red-900 dark:text-red-200'
                      : warn.severity === 'warning'
                      ? 'border-amber-600 bg-amber-950/10 text-amber-900 dark:text-amber-200'
                      : 'border-outline-variant bg-surface-container text-on-surface'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-sm">
                    {warn.severity === 'danger' ? <XCircle className="w-4 h-4 text-red-600" /> : <Info className="w-4 h-4 text-primary" />}
                    <span>{lang === 'ja' ? warn.title_ja : lang === 'en' ? warn.title_en : warn.title_vn}</span>
                  </div>
                  <p className="text-xs leading-relaxed font-normal">
                    {lang === 'ja' ? warn.message_ja : lang === 'en' ? warn.message_en : warn.message_vn}
                  </p>
                </div>
              ))}
            </div>

            {/* Thẻ Cải cách 2026 */}
            <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-950/10 text-on-surface space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm text-primary">
                <ShieldCheck className="w-4 h-4" />
                <span>{lang === 'ja' ? assessment.reform2026Notice.title_ja : lang === 'en' ? assessment.reform2026Notice.title_en : assessment.reform2026Notice.title_vn}</span>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                {lang === 'ja' ? assessment.reform2026Notice.content_ja : lang === 'en' ? assessment.reform2026Notice.content_en : assessment.reform2026Notice.content_vn}
              </p>
            </div>
          </div>

          {/* Cột phải: Kinh tế, Lệ phí & Hồ sơ */}
          <div className="space-y-6">
            {/* Độc lập kinh tế */}
            <div className="bg-surface-container border border-outline-variant rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-primary font-bold text-sm">
                <Coins className="w-4 h-4" />
                <span>{t.financialTitle}</span>
              </div>
              <div className="p-3.5 bg-surface rounded-xl border border-outline-variant space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">{t.actualIncome}</span>
                  <span className="font-bold font-mono text-on-surface">
                    {assessment.financialAnalysis.annualIncome.toLocaleString()} JPY
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">{t.incomeBenchmark}</span>
                  <span className="font-bold font-mono text-primary">
                    {assessment.financialAnalysis.benchmarkIncome.toLocaleString()} JPY
                  </span>
                </div>
                <div className="pt-2 border-t border-outline-variant text-center font-bold">
                  {assessment.financialAnalysis.isSufficient ? (
                    <span className="text-primary">{t.incomeSufficient}</span>
                  ) : (
                    <span className="text-amber-600">{t.incomeInsufficient}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Lệ phí */}
            <div className="bg-surface-container border border-outline-variant rounded-2xl p-5 space-y-3">
              <span className="text-xs font-bold text-primary block">{t.feeTitle}</span>
              <div className="p-3.5 bg-surface rounded-xl border border-outline-variant text-center space-y-1">
                <div className="text-2xl font-extrabold text-primary font-mono">
                  {assessment.feeSchedule.grantFee.toLocaleString()} <span className="text-sm font-normal">JPY</span>
                </div>
                <span className="text-xs text-on-surface-variant block">
                  {t.feeNote}
                </span>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                {assessment.feeSchedule.note}
              </p>
            </div>

            {/* Hồ sơ yêu cầu */}
            <div className="bg-surface-container border border-outline-variant rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-primary font-bold text-sm">
                <FileText className="w-4 h-4" />
                <span>{t.docsTitle}</span>
              </div>
              <ul className="space-y-2 text-xs text-on-surface">
                {assessment.documents.map((doc, idx) => (
                  <li key={idx} className="p-2.5 bg-surface rounded-lg border border-outline-variant flex items-start gap-2">
                    <span className="text-primary font-bold">•</span>
                    <span>{doc}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </StandardToolLayout>
  );
}
