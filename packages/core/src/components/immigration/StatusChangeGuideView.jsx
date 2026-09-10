/**
 * @file packages/core/src/components/immigration/StatusChangeGuideView.jsx
 * @description
 * Giao diện Hướng dẫn Thay đổi Tư cách Lưu trú (在留資格変更ガイド).
 * Đạt chuẩn MAIS Gate 1-4:
 * - Nguồn sự thật duy nhất (SOT) cho ngôn ngữ: props.lang
 * - Chuẩn Trợ năng WCAG 2.1 AA (mọi input có label/id/aria-label, tương phản cao)
 * - Tương thích Theme CSS Tokens
 */

import React, { useState, useId, useMemo } from 'react';
import StandardToolLayout from '../shared/StandardToolLayout.jsx';
import RegulatorySourceView from '../regulatory/RegulatorySourceView.jsx';
import {
  evaluateStatusChange,
  STATUS_CHANGE_DOCUMENT_CATEGORIES
} from '../../japan/immigration/index.js';
import {
  ArrowRightLeft,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  Calendar,
  Building,
  GraduationCap,
  Briefcase,
  Heart,
  Coins,
  Scale,
  Clock,
  ShieldCheck,
  Info
} from 'lucide-react';

export default function StatusChangeGuideView({ lang = 'vi' }) {
  const currentStatusIdInput = useId();
  const targetStatusIdInput = useId();
  const expirationDateInput = useId();
  const applicationDateInput = useId();
  const educationLevelInput = useId();
  const employerCategoryInput = useId();
  const coeCheckboxInput = useId();
  const jobOfferCheckboxInput = useId();
  const majorCheckboxInput = useId();
  const salaryCheckboxInput = useId();
  const sswSkillsCheckboxInput = useId();
  const sswLangCheckboxInput = useId();
  const sswTitpCheckboxInput = useId();
  const officeCheckboxInput = useId();
  const capitalCheckboxInput = useId();
  const planCheckboxInput = useId();
  const marriageCheckboxInput = useId();
  const cohabitCheckboxInput = useId();
  const guarantorCheckboxInput = useId();

  // Form State
  const [currentStatusId, setCurrentStatusId] = useState('student');
  const [targetStatusId, setTargetStatusId] = useState('engineer_specialist');
  const [currentExpirationDate, setCurrentExpirationDate] = useState('');
  const [applicationDate, setApplicationDate] = useState(new Date().toISOString().slice(0, 10));

  // Profile State
  const [educationLevel, setEducationLevel] = useState('university_degree');
  const [employerCategory, setEmployerCategory] = useState(3);
  const [hasCOE, setHasCOE] = useState(false);
  const [hasJobOffer, setHasJobOffer] = useState(true);
  const [jobMatchesMajor, setJobMatchesMajor] = useState(true);
  const [salaryEquivalentToJapanese, setSalaryEquivalentToJapanese] = useState(true);
  const [hasPassedSkillsTest, setHasPassedSkillsTest] = useState(false);
  const [hasPassedLanguageTest, setHasPassedLanguageTest] = useState(false);
  const [completedInternTraining2, setCompletedInternTraining2] = useState(false);
  const [hasPhysicalOffice, setHasPhysicalOffice] = useState(false);
  const [capitalAtLeast5M, setCapitalAtLeast5M] = useState(false);
  const [hasFeasibleBusinessPlan, setHasFeasibleBusinessPlan] = useState(false);
  const [hasLegalMarriage, setHasLegalMarriage] = useState(false);
  const [livingTogether, setLivingTogether] = useState(false);
  const [hasGuarantor, setHasGuarantor] = useState(false);

  // Thẩm định
  const assessment = useMemo(() => {
    return evaluateStatusChange({
      currentStatusId,
      targetStatusId,
      currentExpirationDate: currentExpirationDate || null,
      applicationDate: applicationDate || new Date().toISOString().slice(0, 10),
      applicantProfile: {
        educationLevel,
        employerCategory: Number(employerCategory),
        hasCOE,
        hasJobOffer,
        jobMatchesMajor,
        salaryEquivalentToJapanese,
        hasPassedSkillsTest,
        hasPassedLanguageTest,
        completedInternTraining2,
        hasPhysicalOffice,
        capitalAtLeast5M,
        hasFeasibleBusinessPlan,
        hasLegalMarriage,
        livingTogether,
        hasGuarantor
      }
    });
  }, [
    currentStatusId,
    targetStatusId,
    currentExpirationDate,
    applicationDate,
    educationLevel,
    employerCategory,
    hasCOE,
    hasJobOffer,
    jobMatchesMajor,
    salaryEquivalentToJapanese,
    hasPassedSkillsTest,
    hasPassedLanguageTest,
    completedInternTraining2,
    hasPhysicalOffice,
    capitalAtLeast5M,
    hasFeasibleBusinessPlan,
    hasLegalMarriage,
    livingTogether,
    hasGuarantor
  ]);

  // Từ điển nội bộ
  const t = {
    vi: {
      toolTitle: 'Hướng Dẫn Thay Đổi Tư Cách Lưu Trú',
      toolDesc: 'Hướng dẫn điều kiện, thẩm định tiêu chí và hồ sơ xin chuyển đổi visa Nhật Bản (Điều 20 Luật Nhập quản).',
      badge: 'Luật Nhập Quản Đ.20',
      currentStatus: 'Tư cách lưu trú hiện tại',
      targetStatus: 'Tư cách muốn chuyển sang',
      currentExpDate: 'Ngày hết hạn thẻ hiện tại',
      appDate: 'Ngày dự kiến nộp hồ sơ',
      profileConditions: 'Điều kiện & Tiêu chí cụ thể',
      eduLevel: 'Trình độ học vấn cao nhất',
      eduUniv: 'Đại học / Thạc sĩ / Tiến sĩ (Nhật hoặc Nước ngoài)',
      eduSenmon: 'Senmon-shi (Chuyên gia kỹ thuật - Trường nghề Nhật)',
      eduHighSchool: 'Tốt nghiệp THPT / Khác (Không đủ chuẩn visa lao động thông thường)',
      jobOffer: 'Đã nhận hợp đồng / giấy báo trúng tuyển',
      jobMatchesMajor: 'Công việc liên quan trực tiếp đến chuyên ngành đã học',
      salaryEqual: 'Mức lương từ mức tương đương người Nhật cùng vị trí',
      catOrg: 'Phân loại công ty tuyển dụng (Category 1 - 4)',
      cat1: 'Category 1 (Doanh nghiệp niêm yết trên sàn chứng khoán)',
      cat2: 'Category 2 (Doanh nghiệp nộp thuế khấu trừ tại nguồn > 10 triệu JPY)',
      cat3: 'Category 3 (Doanh nghiệp vừa và nhỏ có nộp bảng khấu trừ thuế)',
      cat4: 'Category 4 (Doanh nghiệp mới thành lập / Chưa có quyết toán)',
      sswSkills: 'Đã thi đậu kỳ thi Kỹ năng đặc định ngành tương ứng',
      sswLang: 'Chứng chỉ tiếng Nhật JLPT N4 trở lên hoặc JFT-Basic A2',
      sswTitp: 'Đã hoàn thành tốt Thực tập sinh số 2 cùng ngành (Miễn thi)',
      office: 'Đã thuê văn phòng kinh doanh thực tế, độc lập (không phải văn phòng ảo)',
      capital: 'Vốn điều lệ từ 5.000.000 JPY trở lên (hoặc thuê 2 nhân viên toàn thời gian)',
      plan: 'Có bản kế hoạch kinh doanh chi tiết và phương án thu chi khả thi',
      marriage: 'Hôn nhân hợp pháp đã đăng ký tại cả Nhật Bản và nước sở tại',
      cohabit: 'Đang cùng chung sống thực tế (có tên chung trong Juminhyo, ảnh chụp)',
      guarantor: 'Người bạn đời cam kết bảo lãnh và có thu nhập nộp thuế đầy đủ',
      hasCOE: 'Đã được cấp sẵn Giấy chứng nhận tư cách lưu trú (COE)',
      readinessReady: 'Hồ sơ đã chuẩn bị đầy đủ tiêu chí ban đầu',
      readinessMissing: 'Cần bổ sung thêm điều kiện tiên quyết',
      readinessRestricted: 'Cảnh báo nghiêm ngặt: Rủi ro pháp lý cao',
      tokureiTitle: 'Thời hạn đặc lệ chờ kết quả (Điều 20 Khoản 6)',
      tokureiDesc: 'Nếu nộp đơn trước khi thẻ hết hạn, bạn được ở lại hợp pháp tối đa thêm 2 tháng trong lúc chờ Cục xét duyệt:',
      maxTokureiDate: 'Hạn chót ở lại theo diện đặc lệ:',
      feeTitle: 'Lệ phí hành chính cấp thẻ mới',
      feeNote: 'Chỉ nộp khi ĐƯỢC CHẤP THUẬN CẤP THẺ (bằng tem doanh thu 収入印紙). Từ chối không mất phí.',
      docTitle: 'Hồ sơ tài liệu cần chuẩn bị',
      statutoryPrerequisites: 'Tiêu chuẩn pháp định đối soát',
      met: 'Đạt',
      unmet: 'Chưa đạt',
      legalNotes: 'Lưu ý pháp lý quan trọng',
    },
    ja: {
      toolTitle: '在留資格変更許可手続ガイド',
      toolDesc: '入管法第20条に基づく在留資格変更の法定要件、必要書類、特例期間および手数料を判定。',
      badge: '入管法第20条',
      currentStatus: '現在の在留資格',
      targetStatus: '変更を希望する在留資格',
      currentExpDate: '現在の在留期限',
      appDate: '申請予定日',
      profileConditions: '該当要件・個別プロファイル',
      eduLevel: '最高学歴',
      eduUniv: '大学・大学院・短大（日本または外国）',
      eduSenmon: '専修学校専門士・高度専門士（日本の専修学校）',
      eduHighSchool: '高卒・その他（就労資格の学歴基準を満たしません）',
      jobOffer: '雇用契約または採用内定通知書の受領',
      jobMatchesMajor: '専攻科目と従事する職務内容の直接の関連性',
      salaryEqual: '日本人と同等額以上の報酬待遇',
      catOrg: '受入機関の区分（カテゴリー1〜4）',
      cat1: 'カテゴリー1（日本の証券取引所上場企業等）',
      cat2: 'カテゴリー2（法定調書合計表の源泉徴収税額1,000万円以上）',
      cat3: 'カテゴリー3（前年実績のある中小企業等）',
      cat4: 'カテゴリー4（新設会社・法定調書合計表のない事業所等）',
      sswSkills: '該当分野の特定技能評価試験に合格している',
      sswLang: '日本語能力試験N4以上またはJFT-Basic A2に合格',
      sswTitp: '技能実習2号を同一職種で良好に修了（試験免除）',
      office: '独立した実態のある事業所（事務所）を確保済（バーチャル不可）',
      capital: '資本金500万円以上の出資または常勤職員2名以上の雇用',
      plan: '継続性・実現可能性を立証する事業計画書および収支試算あり',
      marriage: '日本及び本国双方で法的に有効に婚姻が成立している',
      cohabit: '同居および共同生活の実態がある（住民票同居・写真等）',
      guarantor: '配偶者による身元保証および安定的納税実態がある',
      hasCOE: '在留資格認定証明書（COE）の交付を既に受けている',
      readinessReady: '形式的要件・立証書類の準備が整っています',
      readinessMissing: '前提要件・立証書類の追加準備が必要です',
      readinessRestricted: '厳格制限：入管法上の制限または不許可リスクあり',
      tokureiTitle: '特例期間の適用（入管法第20条第6項）',
      tokureiDesc: '在留期間の満了日までに申請を受理させれば、結果が出るか満了日から最長2か月適法に在留可能：',
      maxTokureiDate: '特例期間満了予定日：',
      feeTitle: '申請手数料（収入印紙）',
      feeNote: '許可時のみ納付（不許可の場合は不要）。2026年10月1日以降の手数料改定に留意。',
      docTitle: '提出必要書類リスト',
      statutoryPrerequisites: '法定要件チェック',
      met: '適合',
      unmet: '未達',
      legalNotes: '法的重要注意事項',
    },
    en: {
      toolTitle: 'Change of Status of Residence Guide',
      toolDesc: 'Statutory requirements, document checklist, special period, and fees under Article 20 of the Immigration Act.',
      badge: 'Immigration Act Art. 20',
      currentStatus: 'Current Status of Residence',
      targetStatus: 'Target Status to Change To',
      currentExpDate: 'Current Expiration Date',
      appDate: 'Planned Filing Date',
      profileConditions: 'Applicant Profile & Conditions',
      eduLevel: 'Highest Education Degree',
      eduUniv: 'University / Master / PhD (Japan or Overseas)',
      eduSenmon: 'Senmon-shi Diploma (Japanese Vocational School)',
      eduHighSchool: 'High School / Other (Does not meet general work visa degree rule)',
      jobOffer: 'Received official job offer or signed contract',
      jobMatchesMajor: 'Job responsibilities directly match academic major',
      salaryEqual: 'Salary equal to or higher than Japanese peers in equivalent roles',
      catOrg: 'Sponsoring Employer Category (1-4)',
      cat1: 'Category 1 (Publicly listed corporations on Japanese exchanges)',
      cat2: 'Category 2 (Withholding tax amount of 10M+ JPY in statutory table)',
      cat3: 'Category 3 (SMEs with previous statutory tax withholding records)',
      cat4: 'Category 4 (Newly established companies / No statutory records)',
      sswSkills: 'Passed field-specific skills evaluation test',
      sswLang: 'Passed JLPT N4+ or JFT-Basic A2',
      sswTitp: 'Completed Technical Intern Training (ii) in same field (Exempt)',
      office: 'Secured dedicated physical office premises (virtual office not allowed)',
      capital: 'Capital of 5,000,000+ JPY or hiring 2+ full-time residents',
      plan: 'Detailed business plan with viable financial projections',
      marriage: 'Legally registered marriage in both Japan and home country',
      cohabit: 'Genuine cohabitation and shared marital household',
      guarantor: 'Spouse guarantor letter with verified tax payment records',
      hasCOE: 'Possess an already issued Certificate of Eligibility (COE)',
      readinessReady: 'Initial documentary criteria fulfilled',
      readinessMissing: 'Additional prerequisites or documents required',
      readinessRestricted: 'Statutory restriction: high refusal risk',
      tokureiTitle: 'Special Period (Tokurei - Art. 20 Para. 6)',
      tokureiDesc: 'If filed before current expiry, legal stay is extended up to 2 months while awaiting the decision:',
      maxTokureiDate: 'Maximum special period expiration:',
      feeTitle: 'Official Fee Schedule (Revenue Stamp)',
      feeNote: 'Payable only upon approval (no fee if denied). Note Oct 2026 fee revision.',
      docTitle: 'Required Documents Checklist',
      statutoryPrerequisites: 'Statutory Criteria Inspection',
      met: 'Met',
      unmet: 'Unmet',
      legalNotes: 'Critical Regulatory Safeguards',
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
        {/* Panel Nhập liệu */}
        <div className="bg-surface-container border border-outline-variant rounded-2xl p-6 shadow-sm space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Tư cách hiện tại */}
            <div className="space-y-1.5">
              <label htmlFor={currentStatusIdInput} className="block text-sm font-semibold text-on-surface">
                {t.currentStatus}
              </label>
              <select
                id={currentStatusIdInput}
                aria-label={t.currentStatus}
                value={currentStatusId}
                onChange={(e) => setCurrentStatusId(e.target.value)}
                className="w-full bg-surface border border-outline-variant rounded-xl px-3.5 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="student">Du học (留学 - Student)</option>
                <option value="dependent">Gia đình phụ thuộc (家族滞在 - Dependent)</option>
                <option value="engineer_specialist">Kỹ thuật / Nhân văn / Quốc tế (技術・人文知識・国際業務)</option>
                <option value="temporary_visitor">Ngắn hạn / Du lịch (短期滞在 - Temporary Visitor)</option>
                <option value="technical_intern">Thực tập sinh (技能実習 - Technical Intern)</option>
              </select>
            </div>

            {/* Tư cách mục tiêu */}
            <div className="space-y-1.5">
              <label htmlFor={targetStatusIdInput} className="block text-sm font-semibold text-on-surface">
                {t.targetStatus}
              </label>
              <select
                id={targetStatusIdInput}
                aria-label={t.targetStatus}
                value={targetStatusId}
                onChange={(e) => setTargetStatusId(e.target.value)}
                className="w-full bg-surface border border-outline-variant rounded-xl px-3.5 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="engineer_specialist">Kỹ thuật / Nhân văn / Quốc tế (技術・人文知識・国際業務)</option>
                <option value="specified_skilled_1">Kỹ năng đặc định số 1 (特定技能1号)</option>
                <option value="business_manager">Kinh doanh / Quản lý (経営・管理)</option>
                <option value="spouse_japanese">Người phối ngẫu người Nhật (日本人の配偶者等)</option>
                <option value="spouse_permanent_resident">Người phối ngẫu người Vĩnh trú (永住者の配偶者等)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Ngày hết hạn thẻ hiện tại */}
            <div className="space-y-1.5">
              <label htmlFor={expirationDateInput} className="block text-sm font-semibold text-on-surface">
                {t.currentExpDate}
              </label>
              <input
                id={expirationDateInput}
                type="date"
                aria-label={t.currentExpDate}
                value={currentExpirationDate}
                onChange={(e) => setCurrentExpirationDate(e.target.value)}
                className="w-full bg-surface border border-outline-variant rounded-xl px-3.5 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Ngày dự kiến nộp */}
            <div className="space-y-1.5">
              <label htmlFor={applicationDateInput} className="block text-sm font-semibold text-on-surface">
                {t.appDate}
              </label>
              <input
                id={applicationDateInput}
                type="date"
                aria-label={t.appDate}
                value={applicationDate}
                onChange={(e) => setApplicationDate(e.target.value)}
                className="w-full bg-surface border border-outline-variant rounded-xl px-3.5 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Các điều kiện tùy theo tư cách mục tiêu */}
          <div className="border-t border-outline-variant pt-5 space-y-4">
            <h2 className="text-base font-semibold text-on-surface flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-primary" />
              {t.profileConditions}
            </h2>

            {/* Điều kiện khi đi từ Visa Ngắn hạn */}
            {currentStatusId === 'temporary_visitor' && (
              <div className="p-4 rounded-xl border border-red-500/30 bg-surface space-y-3">
                <label htmlFor={coeCheckboxInput} className="flex items-center gap-3 cursor-pointer text-sm font-medium text-on-surface">
                  <input
                    id={coeCheckboxInput}
                    type="checkbox"
                    aria-label={t.hasCOE}
                    checked={hasCOE}
                    onChange={(e) => setHasCOE(e.target.checked)}
                    className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary"
                  />
                  <span>{t.hasCOE}</span>
                </label>
              </div>
            )}

            {/* Điều kiện khi sang Visa Kỹ thuật / Nhân văn / Quốc tế */}
            {targetStatusId === 'engineer_specialist' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor={educationLevelInput} className="block text-sm font-semibold text-on-surface">
                      {t.eduLevel}
                    </label>
                    <select
                      id={educationLevelInput}
                      aria-label={t.eduLevel}
                      value={educationLevel}
                      onChange={(e) => setEducationLevel(e.target.value)}
                      className="w-full bg-surface border border-outline-variant rounded-xl px-3.5 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="university_degree">{t.eduUniv}</option>
                      <option value="japan_vocational_diploma">{t.eduSenmon}</option>
                      <option value="high_school">{t.eduHighSchool}</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor={employerCategoryInput} className="block text-sm font-semibold text-on-surface">
                      {t.catOrg}
                    </label>
                    <select
                      id={employerCategoryInput}
                      aria-label={t.catOrg}
                      value={employerCategory}
                      onChange={(e) => setEmployerCategory(e.target.value)}
                      className="w-full bg-surface border border-outline-variant rounded-xl px-3.5 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value={1}>{t.cat1}</option>
                      <option value={2}>{t.cat2}</option>
                      <option value={3}>{t.cat3}</option>
                      <option value={4}>{t.cat4}</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label htmlFor={jobOfferCheckboxInput} className="flex items-center gap-2 p-3 bg-surface border border-outline-variant rounded-xl cursor-pointer text-sm font-medium text-on-surface">
                    <input
                      id={jobOfferCheckboxInput}
                      type="checkbox"
                      aria-label={t.jobOffer}
                      checked={hasJobOffer}
                      onChange={(e) => setHasJobOffer(e.target.checked)}
                      className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary"
                    />
                    <span>{t.jobOffer}</span>
                  </label>

                  <label htmlFor={majorCheckboxInput} className="flex items-center gap-2 p-3 bg-surface border border-outline-variant rounded-xl cursor-pointer text-sm font-medium text-on-surface">
                    <input
                      id={majorCheckboxInput}
                      type="checkbox"
                      aria-label={t.jobMatchesMajor}
                      checked={jobMatchesMajor}
                      onChange={(e) => setJobMatchesMajor(e.target.checked)}
                      className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary"
                    />
                    <span>{t.jobMatchesMajor}</span>
                  </label>

                  <label htmlFor={salaryCheckboxInput} className="flex items-center gap-2 p-3 bg-surface border border-outline-variant rounded-xl cursor-pointer text-sm font-medium text-on-surface">
                    <input
                      id={salaryCheckboxInput}
                      type="checkbox"
                      aria-label={t.salaryEqual}
                      checked={salaryEquivalentToJapanese}
                      onChange={(e) => setSalaryEquivalentToJapanese(e.target.checked)}
                      className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary"
                    />
                    <span>{t.salaryEqual}</span>
                  </label>
                </div>
              </div>
            )}

            {/* Điều kiện khi sang Visa Kỹ năng đặc định số 1 */}
            {targetStatusId === 'specified_skilled_1' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label htmlFor={sswSkillsCheckboxInput} className="flex items-center gap-2 p-3 bg-surface border border-outline-variant rounded-xl cursor-pointer text-sm font-medium text-on-surface">
                  <input
                    id={sswSkillsCheckboxInput}
                    type="checkbox"
                    aria-label={t.sswSkills}
                    checked={hasPassedSkillsTest}
                    onChange={(e) => setHasPassedSkillsTest(e.target.checked)}
                    className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary"
                  />
                  <span>{t.sswSkills}</span>
                </label>

                <label htmlFor={sswLangCheckboxInput} className="flex items-center gap-2 p-3 bg-surface border border-outline-variant rounded-xl cursor-pointer text-sm font-medium text-on-surface">
                  <input
                    id={sswLangCheckboxInput}
                    type="checkbox"
                    aria-label={t.sswLang}
                    checked={hasPassedLanguageTest}
                    onChange={(e) => setHasPassedLanguageTest(e.target.checked)}
                    className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary"
                  />
                  <span>{t.sswLang}</span>
                </label>

                <label htmlFor={sswTitpCheckboxInput} className="flex items-center gap-2 p-3 bg-surface border border-outline-variant rounded-xl cursor-pointer text-sm font-medium text-on-surface">
                  <input
                    id={sswTitpCheckboxInput}
                    type="checkbox"
                    aria-label={t.sswTitp}
                    checked={completedInternTraining2}
                    onChange={(e) => setCompletedInternTraining2(e.target.checked)}
                    className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary"
                  />
                  <span>{t.sswTitp}</span>
                </label>
              </div>
            )}

            {/* Điều kiện khi sang Visa Quản lý / Kinh doanh */}
            {targetStatusId === 'business_manager' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label htmlFor={officeCheckboxInput} className="flex items-center gap-2 p-3 bg-surface border border-outline-variant rounded-xl cursor-pointer text-sm font-medium text-on-surface">
                  <input
                    id={officeCheckboxInput}
                    type="checkbox"
                    aria-label={t.office}
                    checked={hasPhysicalOffice}
                    onChange={(e) => setHasPhysicalOffice(e.target.checked)}
                    className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary"
                  />
                  <span>{t.office}</span>
                </label>

                <label htmlFor={capitalCheckboxInput} className="flex items-center gap-2 p-3 bg-surface border border-outline-variant rounded-xl cursor-pointer text-sm font-medium text-on-surface">
                  <input
                    id={capitalCheckboxInput}
                    type="checkbox"
                    aria-label={t.capital}
                    checked={capitalAtLeast5M}
                    onChange={(e) => setCapitalAtLeast5M(e.target.checked)}
                    className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary"
                  />
                  <span>{t.capital}</span>
                </label>

                <label htmlFor={planCheckboxInput} className="flex items-center gap-2 p-3 bg-surface border border-outline-variant rounded-xl cursor-pointer text-sm font-medium text-on-surface">
                  <input
                    id={planCheckboxInput}
                    type="checkbox"
                    aria-label={t.plan}
                    checked={hasFeasibleBusinessPlan}
                    onChange={(e) => setHasFeasibleBusinessPlan(e.target.checked)}
                    className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary"
                  />
                  <span>{t.plan}</span>
                </label>
              </div>
            )}

            {/* Điều kiện khi sang Visa Kết hôn */}
            {(targetStatusId === 'spouse_japanese' || targetStatusId === 'spouse_permanent_resident') && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label htmlFor={marriageCheckboxInput} className="flex items-center gap-2 p-3 bg-surface border border-outline-variant rounded-xl cursor-pointer text-sm font-medium text-on-surface">
                  <input
                    id={marriageCheckboxInput}
                    type="checkbox"
                    aria-label={t.marriage}
                    checked={hasLegalMarriage}
                    onChange={(e) => setHasLegalMarriage(e.target.checked)}
                    className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary"
                  />
                  <span>{t.marriage}</span>
                </label>

                <label htmlFor={cohabitCheckboxInput} className="flex items-center gap-2 p-3 bg-surface border border-outline-variant rounded-xl cursor-pointer text-sm font-medium text-on-surface">
                  <input
                    id={cohabitCheckboxInput}
                    type="checkbox"
                    aria-label={t.cohabit}
                    checked={livingTogether}
                    onChange={(e) => setLivingTogether(e.target.checked)}
                    className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary"
                  />
                  <span>{t.cohabit}</span>
                </label>

                <label htmlFor={guarantorCheckboxInput} className="flex items-center gap-2 p-3 bg-surface border border-outline-variant rounded-xl cursor-pointer text-sm font-medium text-on-surface">
                  <input
                    id={guarantorCheckboxInput}
                    type="checkbox"
                    aria-label={t.guarantor}
                    checked={hasGuarantor}
                    onChange={(e) => setHasGuarantor(e.target.checked)}
                    className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary"
                  />
                  <span>{t.guarantor}</span>
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Kết Quả Thẩm Định */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cột trái: Đánh giá & Tiêu chuẩn */}
          <div className="lg:col-span-2 space-y-6">
            {/* Thẻ Trạng thái chuẩn bị */}
            <div className={`p-5 rounded-2xl border ${
              assessment.readinessStatus === 'ready'
                ? 'bg-primary text-on-primary border-primary'
                : assessment.readinessStatus === 'restricted'
                ? 'bg-red-700 text-white border-red-800'
                : 'bg-amber-600 text-white border-amber-700'
            }`}>
              <div className="flex items-center gap-3">
                {assessment.readinessStatus === 'ready' && <CheckCircle2 className="w-6 h-6 flex-shrink-0" />}
                {assessment.readinessStatus === 'missing_requirements' && <AlertTriangle className="w-6 h-6 flex-shrink-0" />}
                {assessment.readinessStatus === 'restricted' && <XCircle className="w-6 h-6 flex-shrink-0" />}
                <div>
                  <h3 className="text-lg font-bold">
                    {assessment.readinessStatus === 'ready' && t.readinessReady}
                    {assessment.readinessStatus === 'missing_requirements' && t.readinessMissing}
                    {assessment.readinessStatus === 'restricted' && t.readinessRestricted}
                  </h3>
                  <p className="text-sm opacity-90">
                    {assessment.legalBasis}
                  </p>
                </div>
              </div>
            </div>

            {/* Đặc Lệ (Tokurei Period) nếu có nhập ngày hết hạn */}
            {assessment.tokureiInfo && (
              <div className="bg-surface-container border border-outline-variant rounded-2xl p-5 space-y-2">
                <div className="flex items-center gap-2 text-primary font-bold text-sm">
                  <Clock className="w-4 h-4" />
                  <span>{t.tokureiTitle}</span>
                </div>
                <p className="text-sm text-on-surface-variant">
                  {t.tokureiDesc}
                </p>
                <div className="flex items-center justify-between p-3 bg-surface rounded-xl border border-outline-variant">
                  <span className="text-sm text-on-surface font-medium">{t.maxTokureiDate}</span>
                  <span className="text-base font-bold text-primary font-mono">{assessment.tokureiInfo.tokureiExpirationDate}</span>
                </div>
              </div>
            )}

            {/* Bảng đối soát tiêu chuẩn pháp định */}
            <div className="bg-surface-container border border-outline-variant rounded-2xl p-5 space-y-4">
              <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
                <Scale className="w-5 h-5 text-primary" />
                {t.statutoryPrerequisites}
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

            {/* Cảnh báo pháp lý & Án lệ McLean */}
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

          {/* Cột phải: Lệ phí & Hồ sơ */}
          <div className="space-y-6">
            {/* Thẻ Lệ Phí */}
            <div className="bg-surface-container border border-outline-variant rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-primary font-bold text-sm">
                <Coins className="w-4 h-4" />
                <span>{t.feeTitle}</span>
              </div>
              <div className="p-4 bg-surface rounded-xl border border-outline-variant text-center space-y-1">
                <div className="text-3xl font-extrabold text-primary font-mono">
                  {assessment.feeSchedule.amount.toLocaleString()} <span className="text-base font-normal">JPY</span>
                </div>
                <p className="text-xs text-on-surface-variant font-medium">
                  {lang === 'ja' ? assessment.feeSchedule.condition_ja : lang === 'en' ? assessment.feeSchedule.condition_en : assessment.feeSchedule.condition_vn}
                </p>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                {t.feeNote}
              </p>
            </div>

            {/* Thẻ Hồ Sơ Yêu Cầu */}
            {assessment.documentChecklist.length > 0 && (
              <div className="bg-surface-container border border-outline-variant rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-primary font-bold text-sm">
                  <FileText className="w-4 h-4" />
                  <span>{t.docTitle}</span>
                </div>
                <ul className="space-y-2 text-xs text-on-surface">
                  {assessment.documentChecklist.map((doc) => (
                    <li key={doc.id} className="p-2.5 bg-surface rounded-lg border border-outline-variant flex items-start gap-2">
                      <span className="text-primary font-bold">•</span>
                      <span>{doc.name}</span>
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
