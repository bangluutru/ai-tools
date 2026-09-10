import React, { useState, useMemo } from 'react';
import {
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  RotateCcw,
  ExternalLink,
  ShieldCheck,
  Home,
  Building,
  HeartHandshake,
  DollarSign,
  FileCheck,
  ArrowRight,
  Info
} from 'lucide-react';
import {
  evaluateDependentInsuranceEligibility,
  RELATIONSHIPS,
  RESIDENCE_EXCEPTIONS
} from '../../japan/insurance/index.js';
import RegulatorySourceView from '../regulatory/RegulatorySourceView.jsx';

const I18N = {
  ja: {
    badge: '全国健康保険協会（協会けんぽ）被扶養者認定基準',
    title: '社会保険の扶養判定（健康保険・被扶養者）',
    subtitle: '健康保険の被扶養者（保険料自己負担ゼロ）に該当するかを、親族範囲・同居別居・見込み年収130万/180万円・主たる生計維持要件に基づき精密判定します。',
    taxDistinctionAlert: '【税法上の扶養との違い】このツールは社会保険（健康保険・国民年金第3号）専用の判定です。所得税や住民税の扶養控除（配偶者控除・扶養控除）の試算は「Japan Tax Simulator」をご利用ください。',
    openTaxTool: 'Japan Tax を開く',
    inputTitle: '被扶養者（扶養に入りたい方）の状況',
    relationship: '被保険者（本人）との続柄',
    dependentAge: '被扶養者の年齢',
    isDisabled: '障害厚生年金受給要件に該当する障害の有無',
    disabledHint: '※ 60歳以上または障害者の場合、収入上限が180万円未満に緩和されます。',
    cohabitation: '居住形態（生計関係）',
    cohabitingYes: '同居（同一世帯・生計を共にしている）',
    cohabitingNo: '別居（実家・単身赴任・海外等）',
    incomeTitle: '収入および仕送り（今後1年間の見込み額）',
    incomeHint: '※ 過去の確定申告実績ではなく、認定時点から将来1年間の見込み収入（給与・事業・年金・失業等給付を含む）を入力してください。',
    depIncome: '被扶養者の年間見込み収入 (円)',
    insIncome: '被保険者（本人）の年間収入 (円)',
    remittance: '被保険者からの年間仕送り額 (円)',
    remittanceHint: '※ 別居の場合は定期的な送金証明（振込明細等）が必須です。仕送り額が被扶養者の収入を上回る必要があります。',
    residence: '住民票・国内居住要件',
    residesInJapan: '日本国内に住民票がある',
    residenceException: '海外在住の場合の例外事由',
    overtimeProof: '事業主の証明書（一時的な増収の枠組み）あり',
    overtimeProofHint: '※ 繁忙期等の残業による一時的な収入変動（最大2年間）を事業主が証明する場合、130万円を超えても扶養に残れる特例があります。',
    resultTitle: '判定結果サマリー',
    statusEligible: '被扶養者として認定される可能性が高い',
    statusIneligible: '現行要件では被扶養者に認定されない可能性が高い',
    statusCaseDependent: '総合的な生計実態審査（要個別確認・申立て）',
    checklistTitle: '法定5要件の適合チェック結果',
    whyTitle: '社会保険の扶養に関する重要ルール',
    officialSources: '公的根拠・典拠データ',
    reset: '初期値に戻す',
    ceilingText: '適用される年収上限基準',
  },
  vi: {
    badge: 'Chuẩn Thẩm Định BHYT Toàn Quốc (全国健康保険協会 / 協会けんぽ)',
    title: 'Kiểm Tra Điều Kiện Người Phụ Thuộc BHXH (被扶養者)',
    subtitle: 'Chẩn đoán điều kiện làm người phụ thuộc BHYT công ty (không phải đóng phí BHYT & Hưu trí Quốc dân) theo phạm vi thân nhân 3 đời, sống chung/riêng, trần thu nhập 130 vạn / 180 vạn và tỷ lệ chu cấp.',
    taxDistinctionAlert: '【LƯU Ý QUAN TRỌNG: PHÂN BIỆT VỚI THUẾ】Công cụ này CHỈ chẩn đoán người phụ thuộc BẢO HIỂM XÃ HỘI (BHYT & Hưu trí Quốc dân số 3), HOÀN TOÀN KHÁC với Giảm trừ gia cảnh thuế thu nhập cá nhân (税法上の扶養). Để tính thuế, vui lòng mở "Japan Tax Simulator".',
    openTaxTool: 'Mở Japan Tax Simulator',
    inputTitle: 'Thông Tin Người Phụ Thuộc (Người muốn vào diện bảo hiểm)',
    relationship: 'Mối quan hệ với người bảo hiểm chính (続柄)',
    dependentAge: 'Tuổi của người phụ thuộc',
    isDisabled: 'Là người khuyết tật (thuộc điều kiện nhận trợ cấp khuyết tật)',
    disabledHint: '※ Người từ 60 tuổi trở lên hoặc khuyết tật được nâng trần thu nhập lên dưới 180 vạn Yên/năm.',
    cohabitation: 'Hình thức cư trú & sinh hoạt',
    cohabitingYes: 'Sống chung cùng một hộ gia đình (同居)',
    cohabitingNo: 'Sống riêng (ở quê, ở riêng, ở nước ngoài...) (別居)',
    incomeTitle: 'Thu Nhập Dự Kiến & Khoản Chu Cấp (Trong 1 năm tới)',
    incomeHint: '※ Lưu ý: BHXH tính thu nhập DỰ KIẾN TRONG 1 NĂM TỚI (bao gồm cả lương, trợ cấp thất nghiệp, thai sản, tiền hưu), không phải thu nhập quá khứ như quyết toán thuế.',
    depIncome: 'Thu nhập dự kiến của người phụ thuộc (円/năm)',
    insIncome: 'Tổng thu nhập của người bảo hiểm chính (円/năm)',
    remittance: 'Tiền chu cấp hàng năm gửi từ người bảo hiểm (円/năm)',
    remittanceHint: '※ Sống riêng bắt buộc phải có chứng nhận chuyển khoản ngân hàng định kỳ và tiền chu cấp phải lớn hơn thu nhập tự thân của người phụ thuộc.',
    residence: 'Điều kiện cư trú tại Nhật Bản (国内居住要件)',
    residesInJapan: 'Có đăng ký sổ thường trú tại Nhật Bản',
    residenceException: 'Trường hợp ngoại lệ nếu sống ở nước ngoài',
    overtimeProof: 'Có văn bản xác nhận của công ty về việc tăng thu nhập tạm thời',
    overtimeProofHint: '※ Gói hỗ trợ bức tường thu nhập: nếu tăng ca tạm thời khiến thu nhập vượt 130 vạn nhưng có chứng nhận của chủ DN thì vẫn được giữ bảo hiểm tối đa 2 năm liên tiếp.',
    resultTitle: 'Kết Quả Chẩn Đoán',
    statusEligible: 'Khả Năng Cao Đủ Điều Kiện Làm Người Phụ Thuộc',
    statusIneligible: 'Khả Năng Cao Chưa Đủ Điều Kiện',
    statusCaseDependent: 'Cần Thẩm Định Hồ Sơ Chi Tiết (Xét duyệt cá biệt)',
    checklistTitle: 'Chi Tiết Đối Chiếu 5 Điều Kiện Luật Định',
    whyTitle: 'Các Quy Tắc Then Chốt Về Phụ Thuộc BHXH',
    officialSources: 'Căn Cứ Pháp Lý & Cơ Quan Ban Hành',
    reset: 'Đặt lại',
    ceilingText: 'Trần thu nhập luật định áp dụng',
  },
  en: {
    badge: 'Kyokai Kenpo Dependent Health Insurance Certification Criteria',
    title: 'Social Insurance Dependent Checker (被扶養者)',
    subtitle: 'Evaluate whether a family member qualifies as a dependent under company health insurance (0 JPY premium contribution) based on statutory kinship, cohabitation, future income ceilings (1.3M/1.8M JPY), and primary financial support tests.',
    taxDistinctionAlert: '[CRITICAL DISTINCTION] This evaluation is strictly for SOCIAL INSURANCE (Health Insurance & Pension Dependent) and NOT for Income Tax dependent deductions. To simulate tax dependents, please open "Japan Tax Simulator".',
    openTaxTool: 'Open Japan Tax Simulator',
    inputTitle: 'Dependent Information',
    relationship: 'Relationship to Primary Insured Person',
    dependentAge: 'Dependent Age',
    isDisabled: 'Has statutory disability certification',
    disabledHint: '※ The annual income ceiling is raised to < 1.8M JPY for seniors aged 60+ or individuals with disabilities.',
    cohabitation: 'Living Arrangement',
    cohabitingYes: 'Cohabiting (Same household / 同居)',
    cohabitingNo: 'Living Apart (Separate household / 別居)',
    incomeTitle: 'Projected Future Income & Remittance (Upcoming 1 Year)',
    incomeHint: '※ Social insurance evaluates projected future income from the evaluation date onwards (including wages, unemployment benefits, and pensions), not past calendar-year tax returns.',
    depIncome: 'Dependent Projected Annual Income (JPY)',
    insIncome: 'Primary Insured Person Annual Income (JPY)',
    remittance: 'Annual Remittance from Primary Insured (JPY)',
    remittanceHint: '※ Living apart requires regular bank transfer statements. Remittance must exceed the dependent personal income.',
    residence: 'Domestic Residence Requirement',
    residesInJapan: 'Has registered address in Japan',
    residenceException: 'Statutory exception if residing abroad',
    overtimeProof: 'Has employer certification for temporary overtime surge',
    overtimeProofHint: '※ Income barrier relief package: If overtime causes income to temporarily exceed 1.3M JPY, dependent status can be retained up to 2 consecutive years with employer proof.',
    resultTitle: 'Evaluation Summary',
    statusEligible: 'High Likelihood of Meeting Dependent Eligibility',
    statusIneligible: 'Likely Ineligible Under Statutory Criteria',
    statusCaseDependent: 'Requires Comprehensive Case Review / Inquiry',
    checklistTitle: 'Detailed Statutory Criteria Evaluation',
    whyTitle: 'Key Social Insurance Dependent Guidelines',
    officialSources: 'Official Regulatory Sources',
    reset: 'Reset',
    ceilingText: 'Applicable Annual Income Ceiling',
  }
};

export function DependentInsuranceView({ lang = 'ja' }) {
  const [relationship, setRelationship] = useState('spouse');
  const [dependentAge, setDependentAge] = useState(30);
  const [isDisabled, setIsDisabled] = useState(false);
  const [isCohabiting, setIsCohabiting] = useState(true);
  const [dependentFutureAnnualIncome, setDependentFutureAnnualIncome] = useState(1000000);
  const [insuredAnnualIncome, setInsuredAnnualIncome] = useState(5000000);
  const [annualRemittance, setAnnualRemittance] = useState(1200000);
  const [residesInJapan, setResidesInJapan] = useState(true);
  const [residenceException, setResidenceException] = useState('none');
  const [hasEmployerOvertimeProof, setHasEmployerOvertimeProof] = useState(false);

  const t = I18N[lang] || I18N.ja;

  const handleReset = () => {
    setRelationship('spouse');
    setDependentAge(30);
    setIsDisabled(false);
    setIsCohabiting(true);
    setDependentFutureAnnualIncome(1000000);
    setInsuredAnnualIncome(5000000);
    setAnnualRemittance(1200000);
    setResidesInJapan(true);
    setResidenceException('none');
    setHasEmployerOvertimeProof(false);
  };

  const result = useMemo(() => {
    return evaluateDependentInsuranceEligibility({
      relationship,
      dependentAge,
      isDisabled,
      isCohabiting,
      dependentFutureAnnualIncome,
      insuredAnnualIncome,
      annualRemittance,
      residesInJapan,
      residenceException,
      hasEmployerOvertimeProof
    });
  }, [
    relationship,
    dependentAge,
    isDisabled,
    isCohabiting,
    dependentFutureAnnualIncome,
    insuredAnnualIncome,
    annualRemittance,
    residesInJapan,
    residenceException,
    hasEmployerOvertimeProof
  ]);

  // Status mapping configuration
  const statusConfig = {
    likely_eligible: {
      bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200',
      icon: CheckCircle2,
      badgeBg: 'bg-emerald-800 text-white dark:bg-emerald-700',
      borderAccent: 'border-l-4 border-l-emerald-700',
      title: t.statusEligible
    },
    likely_ineligible: {
      bg: 'bg-rose-500/10 border-rose-500/30 text-rose-900 dark:text-rose-200',
      icon: XCircle,
      badgeBg: 'bg-rose-800 text-white dark:bg-rose-700',
      borderAccent: 'border-l-4 border-l-rose-700',
      title: t.statusIneligible
    },
    case_dependent: {
      bg: 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200',
      icon: AlertTriangle,
      badgeBg: 'bg-amber-800 text-white dark:bg-amber-700',
      borderAccent: 'border-l-4 border-l-amber-700',
      title: t.statusCaseDependent
    }
  };

  const currentCfg = statusConfig[result.status] || statusConfig.case_dependent;
  const StatusIcon = currentCfg.icon;

  return (
    <div className="w-full max-w-[1240px] mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header Bar */}
      <div className="bg-surface-container rounded-2xl p-6 sm:p-8 border border-outline-variant/30 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
              <HeartHandshake className="w-3.5 h-3.5" />
              <span>{t.badge}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
              {t.title}
            </h1>
            <p className="text-sm sm:text-base text-on-surface-variant max-w-3xl leading-relaxed">
              {t.subtitle}
            </p>
          </div>

          {/* Reset control */}
          <div className="flex items-center gap-2 self-start md:self-center shrink-0">
            <button
              onClick={handleReset}
              className="p-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high border border-outline-variant/30 transition-all"
              title={t.reset}
              aria-label={t.reset}
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Prominent Tax vs Social Insurance Distinction Alert */}
      <div className="bg-amber-500/10 border-l-4 border-l-amber-600 rounded-xl p-4 sm:p-5 border border-amber-500/20 text-xs sm:text-sm text-on-surface space-y-2">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5 text-sm">
              <Info className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
              <span>Phân Định Rạch Ròi: Phụ Thuộc Bảo Hiểm vs Phụ Thuộc Thuế</span>
            </div>
            <p className="text-on-surface-variant leading-relaxed">
              {t.taxDistinctionAlert}
            </p>
          </div>
          <a
            href="#/tools/japan-tax-simulator"
            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-amber-800 text-white hover:bg-amber-900 transition-colors shadow-sm"
          >
            <span>{t.openTaxTool}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Main Grid: Inputs (5 cols) & Results (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Input Form */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-surface-container rounded-2xl p-6 border border-outline-variant/30 shadow-sm space-y-5">
            <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <span>{t.inputTitle}</span>
            </h2>

            {/* Relationship */}
            <div className="space-y-1.5">
              <label htmlFor="dep-rel" className="text-xs font-semibold text-on-surface-variant">
                {t.relationship}
              </label>
              <select
                id="dep-rel"
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl bg-surface border border-outline-variant/50 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary font-medium"
              >
                {Object.values(RELATIONSHIPS).map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name[lang] || r.name.ja}
                  </option>
                ))}
              </select>
            </div>

            {/* Age & Disability */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="dep-age" className="text-xs font-semibold text-on-surface-variant">
                  {t.dependentAge}
                </label>
                <input
                  id="dep-age"
                  type="number"
                  min="0"
                  max="120"
                  value={dependentAge}
                  onChange={(e) => setDependentAge(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm rounded-xl bg-surface border border-outline-variant/50 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary font-semibold"
                />
              </div>

              <div className="pt-6">
                <label className="flex items-center gap-2 text-xs font-semibold text-on-surface cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isDisabled}
                    onChange={(e) => setIsDisabled(e.target.checked)}
                    className="w-4 h-4 text-primary rounded border-outline-variant/50 focus:ring-primary"
                  />
                  <span>Khuyết tật (障害者)</span>
                </label>
              </div>
            </div>

            {/* Cohabitation Option */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-on-surface-variant">
                {t.cohabitation}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIsCohabiting(true)}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                    isCohabiting
                      ? 'bg-primary text-on-primary border-primary shadow-sm'
                      : 'bg-surface border-outline-variant/40 text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>Sống chung (同居)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsCohabiting(false)}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                    !isCohabiting
                      ? 'bg-primary text-on-primary border-primary shadow-sm'
                      : 'bg-surface border-outline-variant/40 text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  <Building className="w-3.5 h-3.5" />
                  <span>Sống riêng (別居)</span>
                </button>
              </div>
            </div>

            {/* Incomes & Remittance */}
            <div className="pt-2 border-t border-outline-variant/20 space-y-4">
              <div className="space-y-1">
                <label htmlFor="dep-income" className="text-xs font-semibold text-on-surface-variant flex items-center justify-between">
                  <span>{t.depIncome}</span>
                  <span className="text-primary font-bold">{dependentFutureAnnualIncome.toLocaleString('ja-JP')} 円</span>
                </label>
                <input
                  id="dep-income"
                  type="number"
                  step="10000"
                  min="0"
                  value={dependentFutureAnnualIncome}
                  onChange={(e) => setDependentFutureAnnualIncome(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm rounded-xl bg-surface border border-outline-variant/50 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary font-semibold"
                />
                <p className="text-[11px] text-on-surface-variant">{t.incomeHint}</p>
              </div>

              <div className="space-y-1">
                <label htmlFor="ins-income" className="text-xs font-semibold text-on-surface-variant flex items-center justify-between">
                  <span>{t.insIncome}</span>
                  <span className="text-on-surface font-bold">{insuredAnnualIncome.toLocaleString('ja-JP')} 円</span>
                </label>
                <input
                  id="ins-income"
                  type="number"
                  step="50000"
                  min="0"
                  value={insuredAnnualIncome}
                  onChange={(e) => setInsuredAnnualIncome(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm rounded-xl bg-surface border border-outline-variant/50 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary font-semibold"
                />
              </div>

              {/* If living apart: Remittance */}
              {!isCohabiting && (
                <div className="space-y-1 p-3 rounded-xl bg-primary/5 border border-primary/20">
                  <label htmlFor="dep-remittance" className="text-xs font-semibold text-on-surface-variant flex items-center justify-between">
                    <span className="text-primary font-bold">{t.remittance}</span>
                    <span className="text-primary font-bold">{annualRemittance.toLocaleString('ja-JP')} 円</span>
                  </label>
                  <input
                    id="dep-remittance"
                    type="number"
                    step="10000"
                    min="0"
                    value={annualRemittance}
                    onChange={(e) => setAnnualRemittance(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm rounded-xl bg-surface border border-outline-variant/50 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary font-semibold"
                  />
                  <p className="text-[11px] text-on-surface-variant">{t.remittanceHint}</p>
                </div>
              )}
            </div>

            {/* Domestic Residence & Overtime Proof Checkboxes */}
            <div className="pt-2 border-t border-outline-variant/20 space-y-3">
              <label className="flex items-center gap-2 text-xs font-semibold text-on-surface cursor-pointer">
                <input
                  type="checkbox"
                  checked={residesInJapan}
                  onChange={(e) => setResidesInJapan(e.target.checked)}
                  className="w-4 h-4 text-primary rounded border-outline-variant/50 focus:ring-primary"
                />
                <span>{t.residesInJapan}</span>
              </label>

              {!residesInJapan && (
                <div className="space-y-1 pl-6">
                  <label htmlFor="dep-res-exception" className="text-[11px] font-semibold text-on-surface-variant">
                    {t.residenceException}
                  </label>
                  <select
                    id="dep-res-exception"
                    value={residenceException}
                    onChange={(e) => setResidenceException(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-surface border border-outline-variant/50 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {Object.values(RESIDENCE_EXCEPTIONS).map((ex) => (
                      <option key={ex.id} value={ex.id}>
                        {ex.name[lang] || ex.name.ja}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <label className="flex items-start gap-2 text-xs font-semibold text-on-surface cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasEmployerOvertimeProof}
                  onChange={(e) => setHasEmployerOvertimeProof(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-primary rounded border-outline-variant/50 focus:ring-primary"
                />
                <div className="space-y-0.5">
                  <span>{t.overtimeProof}</span>
                  <p className="text-[11px] text-on-surface-variant font-normal leading-relaxed">
                    {t.overtimeProofHint}
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right: Results & Checklist (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Status Banner */}
          <div className={`rounded-2xl p-6 border shadow-sm ${currentCfg.bg} ${currentCfg.borderAccent} space-y-3`}>
            <div className="flex items-center gap-3">
              <StatusIcon className="w-8 h-8 shrink-0" />
              <div>
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${currentCfg.badgeBg} mb-1`}>
                  {result.status === 'likely_eligible'
                    ? 'ĐỦ ĐIỀU KIỆN'
                    : result.status === 'likely_ineligible'
                    ? 'KHÔNG ĐỦ ĐIỀU KIỆN'
                    : 'CẦN THẨM ĐỊNH'}
                </span>
                <h3 className="text-lg sm:text-xl font-extrabold text-on-surface">
                  {currentCfg.title}
                </h3>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-semibold text-on-surface">
              <div>
                <span className="text-on-surface-variant">{t.ceilingText}: </span>
                <span className="text-primary font-bold">{result.ceiling.toLocaleString('ja-JP')} 円/năm</span>
              </div>
              <div>
                <span className="text-on-surface-variant">Bình quân tháng: </span>
                <span className="font-bold">{result.monthlyCeiling.toLocaleString('ja-JP')} 円/tháng</span>
              </div>
            </div>
          </div>

          {/* 5 Statutory Checks */}
          <div className="bg-surface-container rounded-2xl p-6 border border-outline-variant/30 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
              <FileCheck className="w-4.5 h-4.5 text-primary" />
              <span>{t.checklistTitle}</span>
            </h3>

            <div className="space-y-3">
              {result.checks.map((c) => {
                const isPass = c.status === 'pass';
                const isWarn = c.status === 'warning';
                return (
                  <div
                    key={c.id}
                    className={`p-4 rounded-xl border text-xs space-y-1.5 transition-colors ${
                      isPass
                        ? 'bg-emerald-500/5 border-emerald-500/20'
                        : isWarn
                        ? 'bg-amber-500/5 border-amber-500/20'
                        : 'bg-rose-500/5 border-rose-500/20'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-on-surface text-sm flex items-center gap-2">
                        {isPass ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-800 dark:text-emerald-300 shrink-0" />
                        ) : isWarn ? (
                          <AlertTriangle className="w-4 h-4 text-amber-800 dark:text-amber-300 shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-700 dark:text-rose-300 shrink-0" />
                        )}
                        <span>{c.name[lang] || c.name.ja}</span>
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isPass
                            ? 'bg-emerald-800 text-white dark:bg-emerald-700'
                            : isWarn
                            ? 'bg-amber-800 text-white dark:bg-amber-700'
                            : 'bg-rose-700 text-white dark:bg-rose-800'
                        }`}
                      >
                        {isPass ? 'PASS' : isWarn ? 'CHECK' : 'FAIL'}
                      </span>
                    </div>
                    <p className="text-on-surface-variant text-[12px] leading-relaxed pl-6">
                      {c.message[lang] || c.message.ja}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Educational Insights Box */}
          <div className="bg-surface-container rounded-2xl p-6 border border-outline-variant/30 shadow-sm space-y-3">
            <h4 className="text-xs font-bold text-on-surface flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span>{t.whyTitle}</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-surface border border-outline-variant/30 space-y-1">
                <div className="font-bold text-on-surface">Không chỉ là lương gross</div>
                <p className="text-on-surface-variant text-[11px] leading-relaxed">
                  Thu nhập xét duyệt BHYT bao gồm tiền lương, thu nhập tự do, tiền hưu trí, trợ cấp thất nghiệp (失業等給付) và tiền trợ cấp thai sản (出産手当金).
                </p>
              </div>
              <div className="p-3 rounded-xl bg-surface border border-outline-variant/30 space-y-1">
                <div className="font-bold text-on-surface">Bảo hiểm Quốc dân số 3</div>
                <p className="text-on-surface-variant text-[11px] leading-relaxed">
                  Nếu người phụ thuộc là vợ/chồng (từ 20 đến 59 tuổi), sẽ được tự động miễn đóng phí Hưu trí Quốc dân (國民年金第3号被保険者).
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Official Sources Section */}
      <RegulatorySourceView
        sourceIds={result.sources}
        title={t.officialSources}
        subtitle="Căn cứ pháp lý chuẩn hóa theo Điều 3 Khoản 7 Luật Bảo hiểm Y tế Nhật Bản (健康保険法) và Hướng dẫn thẩm định người phụ thuộc của Hiệp hội BHYT Nhật Bản (全国健康保険協会 / 協会けんぽ)."
      />
    </div>
  );
}

export default DependentInsuranceView;
