/**
 * @file packages/core/src/components/immigration/FamilyImmigrationGuideView.jsx
 * @description
 * Giao diện Hướng dẫn Bảo lãnh Gia đình & Tư cách 家族滞在 (Family Immigration Guide).
 * Tuân thủ chuẩn MAIS Gate 1-4:
 * - Nguồn sự thật duy nhất (SOT) cho ngôn ngữ: props.lang
 * - Chuẩn Trợ năng WCAG 2.1 AA (mọi input có label/id/aria-label, tương phản cao)
 * - Tương thích Theme CSS Tokens
 */

import React, { useState, useId, useMemo } from 'react';
import StandardToolLayout from '../shared/StandardToolLayout.jsx';
import RegulatorySourceView from '../regulatory/RegulatorySourceView.jsx';
import {
  evaluateFamilyImmigration,
  SPONSOR_STATUS_ELIGIBILITY,
  RELATIONSHIP_SCOPES,
  DEPENDENT_WORK_PERMIT_RULES
} from '../../japan/immigration/index.js';
import {
  Users,
  Heart,
  Baby,
  Building,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Coins,
  FileText,
  Briefcase,
  ShieldCheck,
  Scale,
  Info
} from 'lucide-react';

export default function FamilyImmigrationGuideView({ lang = 'vi' }) {
  const sponsorStatusInput = useId();
  const relationshipInput = useId();
  const dependentCountInput = useId();
  const sponsorIncomeInput = useId();
  const locationInput = useId();
  const birthDateInput = useId();
  const appDateInput = useId();
  const taxCheckboxInput = useId();
  const partTimeCheckboxInput = useId();

  // State
  const [sponsorStatusId, setSponsorStatusId] = useState('engineer_specialist');
  const [relationshipType, setRelationshipType] = useState('spouse');
  const [dependentCount, setDependentCount] = useState(1);
  const [sponsorAnnualIncomeMan, setSponsorAnnualIncomeMan] = useState(380); // 万 (man) JPY
  const [currentLocation, setCurrentLocation] = useState('overseas');
  const [childBirthDate, setChildBirthDate] = useState('');
  const [applicationDate, setApplicationDate] = useState(new Date().toISOString().slice(0, 10));
  const [sponsorTaxCompliant, setSponsorTaxCompliant] = useState(true);
  const [intendsToWorkPartTime, setIntendsToWorkPartTime] = useState(true);

  // Thẩm định
  const assessment = useMemo(() => {
    return evaluateFamilyImmigration({
      sponsorStatusId,
      relationshipType,
      sponsorAnnualIncome: (Number(sponsorAnnualIncomeMan) || 0) * 10000,
      dependentCount: Number(dependentCount) || 1,
      sponsorTaxCompliant,
      sponsorPensionCompliant: true,
      currentLocation,
      applicationDate: applicationDate || new Date().toISOString().slice(0, 10),
      childBirthDate: childBirthDate || null,
      intendsToWorkPartTime
    });
  }, [
    sponsorStatusId,
    relationshipType,
    sponsorAnnualIncomeMan,
    dependentCount,
    sponsorTaxCompliant,
    currentLocation,
    applicationDate,
    childBirthDate,
    intendsToWorkPartTime
  ]);

  // Từ điển nội bộ
  const t = {
    vi: {
      toolTitle: 'Hướng Dẫn Bảo Lãnh Gia Đình (家族滞在)',
      toolDesc: 'Hướng dẫn điều kiện, thủ tục bảo lãnh vợ/chồng, con cái sang Nhật và quy định làm thêm 28h (Luật Nhập quản Bảng 1-4).',
      badge: 'Luật Nhập Quản Bảng 1-4',
      sponsorStatus: 'Tư cách lưu trú của người bảo lãnh (Sponsor)',
      relationship: 'Mối quan hệ thân nhân muốn bảo lãnh',
      relSpouse: 'Vợ hoặc Chồng hợp pháp (Đã đăng ký kết hôn)',
      relChild: 'Con cái phụ thuộc (Con ruột hoặc con nuôi hợp pháp)',
      relParent: 'Cha mẹ ruột / Cha mẹ vợ chồng (Lưu ý: Không thuộc diện 家族滞在)',
      relSibling: 'Anh chị em ruột (Lưu ý: Không thuộc diện 家族滞在)',
      dependentCount: 'Số người phụ thuộc bảo lãnh',
      sponsorIncome: 'Thu nhập hàng năm của người bảo lãnh (Vạn Yên)',
      location: 'Vị trí hiện tại của người thân',
      locOverseas: 'Đang ở ngoài Nhật Bản (Thủ tục xin cấp COE)',
      locInJapan: 'Đang ở Nhật Bản với visa khác (Thủ tục Đổi visa sang 家族滞在)',
      locNewborn: 'Trẻ sơ sinh mới sinh tại Nhật Bản (Điều 22-2: Cấp visa trong 30 ngày)',
      childBirthDate: 'Ngày sinh của trẻ (nếu sinh tại Nhật Bản)',
      appDate: 'Ngày dự kiến nộp đơn',
      taxCompliant: 'Đã hoàn thành 100% nghĩa vụ thuế cư trú tại Nhật Bản (không nợ thuế)',
      partTime: 'Người thân dự kiến sẽ đi làm thêm (baito) sau khi sang Nhật',
      readyTitle: 'Đủ điều kiện hồ sơ ban đầu',
      missingTitle: 'Cần bổ sung điều kiện hoặc chứng từ tài chính',
      ineligibleTitle: 'Không thuộc đối tượng bảo lãnh theo luật',
      financialTitle: 'Phân tích Năng lực Chu cấp Kinh tế',
      benchmarkNeeded: 'Mức thu nhập khuyến nghị:',
      actualIncome: 'Thu nhập khai báo:',
      incomeSufficient: 'Đạt ngưỡng thu nhập an toàn',
      incomeInsufficient: 'Dưới ngưỡng khuyến nghị - Cần bổ sung sổ tiết kiệm',
      newbornCardTitle: 'Thời hạn khẩn cấp cho trẻ sinh tại Nhật (Điều 22-2)',
      filingDeadline: 'Hạn nộp hồ sơ xin cấp visa (trong vòng 30 ngày):',
      maxStayDeadline: 'Hạn chót cư trú miễn visa tối đa (60 ngày):',
      procedureTitle: 'Quy trình và Thủ tục',
      feeTitle: 'Lệ phí hành chính',
      docsTitle: 'Hồ sơ tài liệu chuẩn bị',
      partTimeTitle: 'Quy định Làm Thêm cho Người Phụ Thuộc (28h/tuần)',
      legalNotes: 'Lưu ý pháp lý và Án lệ McLean',
      met: 'Đạt',
      unmet: 'Chưa đạt',
    },
    ja: {
      toolTitle: '家族滞在・家族呼寄せ手続ガイド',
      toolDesc: '入管法別表第1の4に基づく「家族滞在」ビザの該当性、扶養能力、出生手続（第22条の2）、資格外活動（週28時間）を判定。',
      badge: '入管法別表第1の4',
      sponsorStatus: '扶養者（スポンサー）の在留資格',
      relationship: '呼寄せ対象の親族関係',
      relSpouse: '配偶者（法的に婚姻関係にある夫または妻）',
      relChild: '子（実子、養子、扶養下にある子）',
      relParent: '父母・義父母（※家族滞在ビザの対象外）',
      relSibling: '兄弟・姉妹（※家族滞在ビザの対象外）',
      dependentCount: '扶養対象人数',
      sponsorIncome: '扶養者の年間総収入（万円）',
      location: '呼寄せ対象者の現在の所在',
      locOverseas: '日本国外（在留資格認定証明書交付申請・COE）',
      locInJapan: '日本国内に別資格で在留中（在留資格変更許可申請）',
      locNewborn: '日本国内で出生した子ども（入管法第22条の2：30日以内取得）',
      childBirthDate: '子の出生年月日（日本出生時）',
      appDate: '申請予定日',
      taxCompliant: '住民税等の公租公課に滞納がないこと',
      partTime: '来日後にアルバイト就労を希望する（週28時間以内）',
      readyTitle: '形式的要件・立証準備が整っています',
      missingTitle: '追加の疎明資料または前提要件の充足が必要です',
      ineligibleTitle: '法令上、「家族滞在」の対象外です',
      financialTitle: '扶養能力・生計維持分析',
      benchmarkNeeded: '生活維持推奨目安年収：',
      actualIncome: '申告年収：',
      incomeSufficient: '安全水準に達しています',
      incomeInsufficient: '推奨年収未満（預金残高証明等の補強を推奨）',
      newbornCardTitle: '日本出生時の法定特例期限（入管法第22条の2）',
      filingDeadline: '在留資格取得申請期限（出生後30日以内）：',
      maxStayDeadline: '適法滞在限度（出生後60日以内）：',
      procedureTitle: '手続概要及び提出先',
      feeTitle: '申請手数料',
      docsTitle: '提出立証書類リスト',
      partTimeTitle: '家族滞在者の就労制限（包括資格外活動許可）',
      legalNotes: '法務大臣の裁量と留意事項',
      met: '適合',
      unmet: '未達',
    },
    en: {
      toolTitle: 'Family Immigration & Dependent Visa Guide',
      toolDesc: 'Statutory criteria for Dependent (Kazoku Taizai) status, sponsor financial benchmarks, and 28h part-time rules.',
      badge: 'Immigration Act Table 1-4',
      sponsorStatus: 'Sponsor Residence Status',
      relationship: 'Family Relationship to Sponsor',
      relSpouse: 'Legal Spouse (Legally married)',
      relChild: 'Dependent Child (Biological or adopted)',
      relParent: 'Parents / In-laws (Note: Ineligible for Dependent status)',
      relSibling: 'Brothers / Sisters (Note: Ineligible for Dependent status)',
      dependentCount: 'Number of Dependents',
      sponsorIncome: 'Sponsor Annual Income (in 10,000 JPY)',
      location: 'Current Location of Family Member',
      locOverseas: 'Overseas (Certificate of Eligibility - COE)',
      locInJapan: 'In Japan under another status (Status Change to Dependent)',
      locNewborn: 'Newborn in Japan (Art. 22-2: Status Acquisition in 30 days)',
      childBirthDate: 'Child Birth Date (if born in Japan)',
      appDate: 'Planned Filing Date',
      taxCompliant: '100% compliant with local inhabitant tax payments (no arrears)',
      partTime: 'Family member intends to work part-time after arriving',
      readyTitle: 'Initial Criteria Fulfilled',
      missingTitle: 'Additional Requirements or Financial Proof Needed',
      ineligibleTitle: 'Ineligible for Dependent Status under Immigration Law',
      financialTitle: 'Financial Support Capacity Analysis',
      benchmarkNeeded: 'Recommended Income Benchmark:',
      actualIncome: 'Reported Income:',
      incomeSufficient: 'Meets safe benchmark threshold',
      incomeInsufficient: 'Below benchmark (Bank balance proof recommended)',
      newbornCardTitle: 'Statutory Deadlines for Newborn in Japan (Art. 22-2)',
      filingDeadline: 'Filing Deadline (within 30 days of birth):',
      maxStayDeadline: 'Maximum Legal Exemption Stay (60 days):',
      procedureTitle: 'Procedure & Jurisdiction',
      feeTitle: 'Official Fee Schedule',
      docsTitle: 'Document Checklist',
      partTimeTitle: 'Part-Time Work Rules for Dependents (28h/week)',
      legalNotes: 'Regulatory Safeguards & McLean Doctrine',
      met: 'Met',
      unmet: 'Unmet',
    }
  }[lang] || t.vi;

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
            {/* Tư cách người bảo lãnh */}
            <div className="space-y-1.5">
              <label htmlFor={sponsorStatusInput} className="block text-sm font-semibold text-on-surface">
                {t.sponsorStatus}
              </label>
              <select
                id={sponsorStatusInput}
                aria-label={t.sponsorStatus}
                value={sponsorStatusId}
                onChange={(e) => setSponsorStatusId(e.target.value)}
                className="w-full bg-surface border border-outline-variant rounded-xl px-3.5 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="engineer_specialist">Kỹ thuật / Nhân văn / Quốc tế (技術・人文知識・国際業務)</option>
                <option value="highly_skilled_professional">Lao động chất lượng cao (高度専門職)</option>
                <option value="business_manager">Kinh doanh / Quản lý (経営・管理)</option>
                <option value="professor">Giáo sư / Nghiên cứu (教授・研究)</option>
                <option value="specified_skilled_2">Kỹ năng đặc định số 2 (特定技能2号 - Được bảo lãnh)</option>
                <option value="specified_skilled_1">Kỹ năng đặc định số 1 (特定技能1号 - BỊ CẤM BẢO LÃNH)</option>
                <option value="technical_intern">Thực tập sinh kỹ năng (技能実習 - BỊ CẤM BẢO LÃNH)</option>
              </select>
            </div>

            {/* Mối quan hệ */}
            <div className="space-y-1.5">
              <label htmlFor={relationshipInput} className="block text-sm font-semibold text-on-surface">
                {t.relationship}
              </label>
              <select
                id={relationshipInput}
                aria-label={t.relationship}
                value={relationshipType}
                onChange={(e) => setRelationshipType(e.target.value)}
                className="w-full bg-surface border border-outline-variant rounded-xl px-3.5 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="spouse">{t.relSpouse}</option>
                <option value="child">{t.relChild}</option>
                <option value="parent">{t.relParent}</option>
                <option value="sibling">{t.relSibling}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Số người phụ thuộc */}
            <div className="space-y-1.5">
              <label htmlFor={dependentCountInput} className="block text-sm font-semibold text-on-surface">
                {t.dependentCount}
              </label>
              <input
                id={dependentCountInput}
                type="number"
                min={1}
                max={6}
                aria-label={t.dependentCount}
                value={dependentCount}
                onChange={(e) => setDependentCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-full bg-surface border border-outline-variant rounded-xl px-3.5 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Thu nhập người bảo lãnh */}
            <div className="space-y-1.5">
              <label htmlFor={sponsorIncomeInput} className="block text-sm font-semibold text-on-surface">
                {t.sponsorIncome}
              </label>
              <input
                id={sponsorIncomeInput}
                type="number"
                step={10}
                min={0}
                aria-label={t.sponsorIncome}
                value={sponsorAnnualIncomeMan}
                onChange={(e) => setSponsorAnnualIncomeMan(Number(e.target.value) || 0)}
                className="w-full bg-surface border border-outline-variant rounded-xl px-3.5 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary font-mono"
              />
            </div>

            {/* Vị trí hiện tại */}
            <div className="space-y-1.5">
              <label htmlFor={locationInput} className="block text-sm font-semibold text-on-surface">
                {t.location}
              </label>
              <select
                id={locationInput}
                aria-label={t.location}
                value={currentLocation}
                onChange={(e) => setCurrentLocation(e.target.value)}
                className="w-full bg-surface border border-outline-variant rounded-xl px-3.5 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="overseas">{t.locOverseas}</option>
                <option value="in_japan">{t.locInJapan}</option>
                <option value="newborn_in_japan">{t.locNewborn}</option>
              </select>
            </div>
          </div>

          {/* Ngày sinh nếu sinh tại Nhật */}
          {currentLocation === 'newborn_in_japan' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl border border-primary/30 bg-surface">
              <div className="space-y-1.5">
                <label htmlFor={birthDateInput} className="block text-sm font-semibold text-on-surface flex items-center gap-1.5">
                  <Baby className="w-4 h-4 text-primary" />
                  {t.childBirthDate}
                </label>
                <input
                  id={birthDateInput}
                  type="date"
                  aria-label={t.childBirthDate}
                  value={childBirthDate}
                  onChange={(e) => setChildBirthDate(e.target.value)}
                  className="w-full bg-surface border border-outline-variant rounded-xl px-3.5 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          )}

          {/* Tùy chọn kiểm tra */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <label htmlFor={taxCheckboxInput} className="flex items-center gap-2.5 p-3.5 bg-surface border border-outline-variant rounded-xl cursor-pointer text-sm font-medium text-on-surface">
              <input
                id={taxCheckboxInput}
                type="checkbox"
                aria-label={t.taxCompliant}
                checked={sponsorTaxCompliant}
                onChange={(e) => setSponsorTaxCompliant(e.target.checked)}
                className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary"
              />
              <span>{t.taxCompliant}</span>
            </label>

            <label htmlFor={partTimeCheckboxInput} className="flex items-center gap-2.5 p-3.5 bg-surface border border-outline-variant rounded-xl cursor-pointer text-sm font-medium text-on-surface">
              <input
                id={partTimeCheckboxInput}
                type="checkbox"
                aria-label={t.partTime}
                checked={intendsToWorkPartTime}
                onChange={(e) => setIntendsToWorkPartTime(e.target.checked)}
                className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary"
              />
              <span>{t.partTime}</span>
            </label>
          </div>
        </div>

        {/* Kết Quả Thẩm Định */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cột trái: Đánh giá & Pháp lý */}
          <div className="lg:col-span-2 space-y-6">
            {/* Thẻ Trạng thái */}
            <div className={`p-5 rounded-2xl border ${
              assessment.readinessStatus === 'ready'
                ? 'bg-primary text-on-primary border-primary'
                : assessment.readinessStatus === 'ineligible'
                ? 'bg-red-700 text-white border-red-800'
                : 'bg-amber-600 text-white border-amber-700'
            }`}>
              <div className="flex items-center gap-3">
                {assessment.readinessStatus === 'ready' && <CheckCircle2 className="w-6 h-6 flex-shrink-0" />}
                {assessment.readinessStatus === 'missing_requirements' && <AlertTriangle className="w-6 h-6 flex-shrink-0" />}
                {assessment.readinessStatus === 'ineligible' && <XCircle className="w-6 h-6 flex-shrink-0" />}
                <div>
                  <h3 className="text-lg font-bold">
                    {assessment.readinessStatus === 'ready' && t.readyTitle}
                    {assessment.readinessStatus === 'missing_requirements' && t.missingTitle}
                    {assessment.readinessStatus === 'ineligible' && t.ineligibleTitle}
                  </h3>
                  <p className="text-sm opacity-90">
                    {assessment.procedureInfo.name_ja}
                  </p>
                </div>
              </div>
            </div>

            {/* Thẻ Thời Hạn Trẻ Sinh Tại Nhật */}
            {assessment.newbornDeadlines && (
              <div className="bg-surface-container border border-outline-variant rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-primary font-bold text-sm">
                  <Baby className="w-4 h-4" />
                  <span>{t.newbornCardTitle}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-surface rounded-xl border border-outline-variant">
                    <span className="text-on-surface-variant block mb-1">{t.filingDeadline}</span>
                    <span className="text-base font-bold text-primary font-mono">{assessment.newbornDeadlines.filingDeadline30Days}</span>
                  </div>
                  <div className="p-3 bg-surface rounded-xl border border-outline-variant">
                    <span className="text-on-surface-variant block mb-1">{t.maxStayDeadline}</span>
                    <span className="text-base font-bold text-red-600 font-mono">{assessment.newbornDeadlines.maxStayLimit60Days}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Tiêu chí pháp định */}
            <div className="bg-surface-container border border-outline-variant rounded-2xl p-5 space-y-4">
              <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
                <Scale className="w-5 h-5 text-primary" />
                <span>Tiêu chuẩn thẩm định pháp lý</span>
              </h3>
              <div className="space-y-3">
                {assessment.prerequisites.map((req) => (
                  <div key={req.id} className="p-3.5 bg-surface rounded-xl border border-outline-variant space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-on-surface">
                        {lang === 'ja' ? req.title_ja : lang === 'en' ? req.title_en : req.title_vn}
                      </span>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                        req.met ? 'bg-primary text-on-primary' : 'bg-red-700 text-white'
                      }`}>
                        {req.met ? t.met : t.unmet}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant">
                      {lang === 'ja' ? req.guidance_ja : lang === 'en' ? req.guidance_en : req.guidance_vn}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quy định làm thêm 28h */}
            <div className="bg-surface-container border border-outline-variant rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-primary font-bold text-sm">
                <Briefcase className="w-4 h-4" />
                <span>{t.partTimeTitle}</span>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                {lang === 'ja' ? assessment.workAdvisory.guidance_ja : lang === 'en' ? assessment.workAdvisory.guidance_en : assessment.workAdvisory.guidance_vn}
              </p>
              <div className="p-3 bg-surface rounded-xl border border-outline-variant flex items-center justify-between text-xs">
                <span className="font-semibold text-on-surface">Giới hạn thời gian làm thêm:</span>
                <span className="font-bold text-primary font-mono">Tối đa 28 giờ / tuần</span>
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
                  <p className="text-xs leading-relaxed opacity-90">
                    {lang === 'ja' ? warn.message_ja : lang === 'en' ? warn.message_en : warn.message_vn}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Cột phải: Tài chính & Hồ sơ */}
          <div className="space-y-6">
            {/* Phân tích tài chính */}
            <div className="bg-surface-container border border-outline-variant rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-primary font-bold text-sm">
                <Coins className="w-4 h-4" />
                <span>{t.financialTitle}</span>
              </div>
              <div className="p-3.5 bg-surface rounded-xl border border-outline-variant space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">{t.actualIncome}</span>
                  <span className="font-bold font-mono text-on-surface">
                    {assessment.financialAnalysis.sponsorAnnualIncome.toLocaleString()} JPY
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">{t.benchmarkNeeded}</span>
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
            <div className="bg-surface-container border border-outline-variant rounded-2xl p-5 space-y-2">
              <span className="text-xs font-bold text-primary block">{t.feeTitle}</span>
              <div className="p-3.5 bg-surface rounded-xl border border-outline-variant text-center">
                <div className="text-2xl font-extrabold text-primary font-mono">
                  {assessment.feeSchedule.amount.toLocaleString()} <span className="text-sm font-normal">JPY</span>
                </div>
                <span className="text-xs text-on-surface-variant block mt-1">
                  {assessment.feeSchedule.paymentMethod}
                </span>
              </div>
            </div>

            {/* Hồ sơ yêu cầu */}
            {assessment.documents.length > 0 && (
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
            )}
          </div>
        </div>
      </div>
    </StandardToolLayout>
  );
}
