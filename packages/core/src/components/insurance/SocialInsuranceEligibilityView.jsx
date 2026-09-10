/**
 * @file packages/core/src/components/insurance/SocialInsuranceEligibilityView.jsx
 * @description Giao diện chẩn đoán điều kiện tham gia BHXH Nhật Bản (社会保険加入判定).
 * Trả về 4 trạng thái:
 * 1. Likely mandatory (加入義務の可能性が極めて高い)
 * 2. Likely not mandatory (現行法では加入義務の対象外の可能性が高い)
 * 3. Case-dependent (個別の労働条件・企業規模により判定が分かれる)
 * 4. Insufficient information (入力情報が不足しています)
 */

import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Clock,
  Coins,
  Building2,
  GraduationCap,
  Calendar,
  User,
  ArrowRight,
  Info,
} from 'lucide-react';
import { evaluateSocialInsuranceEligibility } from '../../japan/insurance/index.js';
import RegulatorySourceView from '../regulatory/RegulatorySourceView.jsx';

export default function SocialInsuranceEligibilityView({ lang = 'ja' }) {
  const [employmentType, setEmploymentType] = useState('part_time');
  const [weeklyHours, setWeeklyHours] = useState(24);
  const [monthlyWage, setMonthlyWage] = useState(92000);
  const [companySize, setCompanySize] = useState('51_to_100');
  const [contractDurationMonths, setContractDurationMonths] = useState(12);
  const [isStudent, setIsStudent] = useState(false);
  const [studentType, setStudentType] = useState('daytime');
  const [age, setAge] = useState(28);
  const [hasLaborAgreement, setHasLaborAgreement] = useState(false);

  const result = useMemo(() => {
    return evaluateSocialInsuranceEligibility({
      employmentType,
      weeklyHours: Number(weeklyHours) || 0,
      monthlyWage: Number(monthlyWage) || 0,
      companySize,
      contractDurationMonths: Number(contractDurationMonths) || 0,
      isStudent,
      studentType,
      age: Number(age) || 30,
      hasLaborAgreement,
    });
  }, [
    employmentType,
    weeklyHours,
    monthlyWage,
    companySize,
    contractDurationMonths,
    isStudent,
    studentType,
    age,
    hasLaborAgreement,
  ]);

  const labels = {
    ja: {
      title: '社会保険加入判定（適用チェッカー）',
      subtitle: 'パート・アルバイト・契約社員が社会保険（健康保険・厚生年金）の加入義務対象かを判定',
      inputHeader: '就労条件・企業条件の入力',
      empType: '雇用形態',
      empRegular: '正社員・常勤役員',
      empPartTime: 'パート・アルバイト',
      empContract: '契約社員・嘱託',
      weeklyHours: '週の所定労働時間',
      hoursHint: '※雇用契約書等に定められた週の所定労働時間',
      monthlyWage: '月額賃金（基本給・諸手当）',
      wageHint: '※残業代・交通費・賞与・休日手当を除く所定内賃金',
      companySize: '勤務先の社会保険被保険者数',
      companySmall: '50人以下（中小企業）',
      companyMedium: '51人〜100人（特定適用事業所）',
      companyLarge: '101人以上（特定適用事業所）',
      duration: '雇用の見込み期間',
      durationOver2: '2ヶ月を超える見込みあり',
      durationUnder2: '2ヶ月以内の短期契約',
      studentHeader: '在学状況',
      notStudent: '学生ではない（一般）',
      dayStudent: '昼間学生（大学・短大・高校・専門学校）',
      nightStudent: '夜間部・通信制・定時制・休学中',
      ageLabel: '年齢',
      laborAgreementLabel: '勤務先が労使合意に基づく任意特定適用事業所である',
      resultHeader: '判定結果',
      checklistTitle: '法定適用要件の判定内訳',
      coverageTitle: '適用される保険制度',
      healthTitle: '健康保険（協会けんぽ等）',
      pensionTitle: '厚生年金保険',
      employmentTitle: '雇用保険（失業給付）',
      confidenceBadge: '令和8年度 厚労省基準準拠',
      covered: '加入対象',
      notCovered: '対象外',
      whyTitle: '社会保険適用拡大（106万円の壁）の解説',
      why1: 'なぜ週20時間・月額8.8万円で加入義務が発生するのか？',
      why1Desc: '2024年10月より、従業員数51人以上の企業で働く短時間労働者（パート・アルバイト）に対する社会保険の適用拡大が全面施行されています。',
      why2: '学生特例の注意点',
      why2Desc: '大学等の昼間学生は原則適用除外ですが、夜間学部・通信制課程の学生、または休学中の方は一般労働者と同様に加入対象となります。',
    },
    vi: {
      title: 'Chẩn đoán điều kiện tham gia BHXH (社会保険加入判定)',
      subtitle: 'Kiểm tra người lao động Part-time/Hợp đồng có bắt buộc tham gia BHYT & Hưu trí Kosei Nenkin không',
      inputHeader: 'Thông tin điều kiện làm việc',
      empType: 'Hình thức làm việc',
      empRegular: 'Nhân viên chính thức / Cán bộ quản lý',
      empPartTime: 'Part-time / Baito (パート・アルバイト)',
      empContract: 'Hợp đồng lao động ngắn hạn / Phái cử',
      weeklyHours: 'Thời gian làm việc theo hợp đồng (giờ/tuần)',
      hoursHint: '※ Số giờ làm việc quy định trong hợp đồng (週所定労働時間)',
      monthlyWage: 'Lương cố định tháng (Yên)',
      wageHint: '※ Không bao gồm tiền làm thêm giờ (tăng ca), phụ cấp đi lại, tiền thưởng',
      companySize: 'Quy mô số người tham gia BHXH của công ty',
      companySmall: 'Dưới hoặc bằng 50 người',
      companyMedium: 'Từ 51 đến 100 người (Thuộc diện mở rộng)',
      companyLarge: 'Trên 100 người (Thuộc diện mở rộng)',
      duration: 'Thời hạn hợp đồng dự kiến',
      durationOver2: 'Dự kiến trên 2 tháng',
      durationUnder2: 'Hợp đồng ngắn hạn dưới 2 tháng',
      studentHeader: 'Tình trạng đi học',
      notStudent: 'Không phải học sinh, sinh viên',
      dayStudent: 'Sinh viên chính quy ban ngày (Đại học/Cao đẳng/Senmon)',
      nightStudent: 'Học ban đêm / Từ xa / Đang bảo lưu nghỉ học',
      ageLabel: 'Tuổi',
      laborAgreementLabel: 'Công ty dưới 51 người nhưng có đăng ký tự nguyện áp dụng (労使合意)',
      resultHeader: 'Kết luận chẩn đoán',
      checklistTitle: 'Chi tiết đối chiếu 5 điều kiện luật định',
      coverageTitle: 'Các chế độ bảo hiểm tương ứng',
      healthTitle: 'BHYT Công ty (協会けんぽ)',
      pensionTitle: 'Hưu trí Phúc lợi (厚生年金)',
      employmentTitle: 'Bảo hiểm Thất nghiệp (雇用保険)',
      confidenceBadge: 'Chuẩn quy định MHLW 2026',
      covered: 'Bắt buộc tham gia',
      notCovered: 'Chưa bắt buộc',
      whyTitle: 'Tìm hiểu về quy định mở rộng BHXH (Bức tường 106 vạn)',
      why1: 'Tại sao làm 20 giờ/tuần và lương 8.8 vạn Yên lại phải đóng BHXH?',
      why1Desc: 'Từ tháng 10/2024, Nhật Bản chính thức áp dụng quy chuẩn mở rộng bắt buộc BHXH cho doanh nghiệp từ 51 người trở lên đối với lao động ngắn hạn.',
      why2: 'Quy định đối với du học sinh / sinh viên',
      why2Desc: 'Sinh viên chính quy học ban ngày được miễn trừ. Tuy nhiên sinh viên học ca đêm, từ xa hoặc đang bảo lưu kết quả học tập vẫn phải tham gia nếu đủ điều kiện.',
    },
    en: {
      title: 'Japan Social Insurance Eligibility Checker',
      subtitle: 'Diagnose whether part-time/contract employees are statutorily required to enroll in Social Insurance',
      inputHeader: 'Employment & Company Conditions',
      empType: 'Employment Type',
      empRegular: 'Regular Full-time / Executive',
      empPartTime: 'Part-time / Hourly Worker',
      empContract: 'Fixed-term Contract',
      weeklyHours: 'Scheduled Weekly Hours',
      hoursHint: '※ Contracted weekly working hours',
      monthlyWage: 'Scheduled Monthly Wage (JPY)',
      wageHint: '※ Excluding overtime pay, commutation allowances, and bonuses',
      companySize: 'Company Insured Employee Count',
      companySmall: '50 or fewer employees',
      companyMedium: '51 to 100 employees (Expanded Coverage)',
      companyLarge: 'Over 100 employees (Expanded Coverage)',
      duration: 'Expected Employment Tenure',
      durationOver2: 'Expected over 2 months',
      durationUnder2: '2 months or less (Short-term)',
      studentHeader: 'Student Status',
      notStudent: 'Not a student',
      dayStudent: 'Daytime student (University / College / Vocational)',
      nightStudent: 'Night course / Correspondence / On leave of absence',
      ageLabel: 'Age',
      laborAgreementLabel: 'Company has fewer than 51 workers but filed a voluntary labor agreement',
      resultHeader: 'Eligibility Diagnosis',
      checklistTitle: 'Statutory Criteria Evaluation',
      coverageTitle: 'Applicable Insurance Schemes',
      healthTitle: 'Health Insurance (Kyokai Kenpo)',
      pensionTitle: 'Welfare Pension Insurance',
      employmentTitle: 'Employment Insurance',
      confidenceBadge: 'MHLW FY2026 Compliant',
      covered: 'Mandatory',
      notCovered: 'Exempt / Not Required',
      whyTitle: 'Understanding Expanded Coverage (The 1.06M Barrier)',
      why1: 'Why 20 hours and 88,000 JPY triggers mandatory coverage?',
      why1Desc: 'Since October 2024, enterprises with 51+ insured employees must cover short-time workers meeting the statutory criteria.',
      why2: 'Student Exemption Nuances',
      why2Desc: 'While regular daytime students are exempt, night course, distance learning, and students on official leave are subject to mandatory coverage.',
    },
  };

  const t = labels[lang] || labels.ja;

  // Status visual mapping
  const statusConfig = {
    likely_mandatory: {
      bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200',
      icon: CheckCircle2,
      badgeBg: 'bg-emerald-500 text-white',
      borderAccent: 'border-l-4 border-l-emerald-500',
    },
    likely_not_mandatory: {
      bg: 'bg-blue-500/10 border-blue-500/30 text-blue-900 dark:text-blue-200',
      icon: Info,
      badgeBg: 'bg-blue-600 text-white',
      borderAccent: 'border-l-4 border-l-blue-500',
    },
    case_dependent: {
      bg: 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200',
      icon: AlertTriangle,
      badgeBg: 'bg-amber-500 text-white',
      borderAccent: 'border-l-4 border-l-amber-500',
    },
    insufficient_info: {
      bg: 'bg-surface-container-high border-border-subtle text-on-surface',
      icon: HelpCircle,
      badgeBg: 'bg-surface-container-highest text-on-surface',
      borderAccent: 'border-l-4 border-l-outline',
    },
  };

  const currentCfg = statusConfig[result.status] || statusConfig.insufficient_info;
  const StatusIcon = currentCfg.icon;

  return (
    <div className="max-w-[1240px] mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-border-subtle bg-surface-container-low p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-on-surface tracking-tight">
                {t.title}
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-on-surface-variant max-w-3xl">
              {t.subtitle}
            </p>
          </div>

          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {t.confidenceBadge}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Input Form vs Diagnosis Result */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Input Form (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="rounded-2xl border border-border-subtle bg-surface p-5 space-y-4 shadow-sm">
            <h2 className="font-bold text-sm text-on-surface pb-2 border-b border-border-subtle flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <span>{t.inputHeader}</span>
            </h2>

            {/* Employment Type */}
            <div className="space-y-1.5">
              <label htmlFor="emp-type-select" className="block text-xs font-bold text-on-surface">
                {t.empType}
              </label>
              <select
                id="emp-type-select"
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-border-subtle bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="part_time">{t.empPartTime}</option>
                <option value="regular">{t.empRegular}</option>
                <option value="contract">{t.empContract}</option>
              </select>
            </div>

            {/* Weekly Hours */}
            {employmentType !== 'regular' && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="weekly-hours-input" className="block text-xs font-bold text-on-surface flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    <span>{t.weeklyHours}</span>
                  </label>
                  <span className="text-xs font-bold font-mono text-primary">{weeklyHours} 時間/週</span>
                </div>
                <input
                  id="weekly-hours-input"
                  type="range"
                  min="0"
                  max="45"
                  step="1"
                  value={weeklyHours}
                  onChange={(e) => setWeeklyHours(Number(e.target.value))}
                  className="w-full accent-primary cursor-pointer"
                />
                <p className="text-[11px] text-on-surface-variant leading-tight">
                  {t.hoursHint}
                </p>
              </div>
            )}

            {/* Monthly Wage */}
            {employmentType !== 'regular' && (
              <div className="space-y-1.5">
                <label htmlFor="wage-input" className="block text-xs font-bold text-on-surface flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-primary" />
                  <span>{t.monthlyWage}</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant font-bold text-sm">
                    ¥
                  </span>
                  <input
                    id="wage-input"
                    type="number"
                    step="5000"
                    min="0"
                    max="1000000"
                    value={monthlyWage}
                    onChange={(e) => setMonthlyWage(Math.max(0, Number(e.target.value) || 0))}
                    className="w-full pl-8 pr-4 py-2 text-sm rounded-xl border border-border-subtle bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono font-bold"
                  />
                </div>
                <p className="text-[11px] text-on-surface-variant leading-tight">
                  {t.wageHint}
                </p>
              </div>
            )}

            {/* Company Size */}
            {employmentType !== 'regular' && (
              <div className="space-y-1.5">
                <label htmlFor="company-size-select" className="block text-xs font-bold text-on-surface flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-primary" />
                  <span>{t.companySize}</span>
                </label>
                <select
                  id="company-size-select"
                  value={companySize}
                  onChange={(e) => setCompanySize(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-border-subtle bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="51_to_100">{t.companyMedium}</option>
                  <option value="over_100">{t.companyLarge}</option>
                  <option value="under_51">{t.companySmall}</option>
                </select>
              </div>
            )}

            {/* Expected Duration */}
            {employmentType !== 'regular' && (
              <div className="space-y-1.5">
                <label htmlFor="duration-select" className="block text-xs font-bold text-on-surface flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  <span>{t.duration}</span>
                </label>
                <select
                  id="duration-select"
                  value={contractDurationMonths}
                  onChange={(e) => setContractDurationMonths(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-border-subtle bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value={12}>{t.durationOver2}</option>
                  <option value={2}>{t.durationUnder2}</option>
                </select>
              </div>
            )}

            {/* Student Status */}
            {employmentType !== 'regular' && (
              <div className="space-y-2 pt-1 border-t border-border-subtle">
                <label htmlFor="student-type-select" className="block text-xs font-bold text-on-surface flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-primary" />
                  <span>{t.studentHeader}</span>
                </label>
                <select
                  id="student-type-select"
                  value={isStudent ? studentType : 'none'}
                  onChange={(e) => {
                    if (e.target.value === 'none') {
                      setIsStudent(false);
                    } else {
                      setIsStudent(true);
                      setStudentType(e.target.value);
                    }
                  }}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-border-subtle bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="none">{t.notStudent}</option>
                  <option value="daytime">{t.dayStudent}</option>
                  <option value="night">{t.nightStudent}</option>
                </select>
              </div>
            )}

            {/* Small enterprise voluntary agreement */}
            {employmentType !== 'regular' && companySize === 'under_51' && (
              <div className="p-3 rounded-xl bg-surface-container-low border border-border-subtle space-y-1.5">
                <label className="flex items-start gap-2 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={hasLaborAgreement}
                    onChange={(e) => setHasLaborAgreement(e.target.checked)}
                    className="mt-0.5 accent-primary"
                  />
                  <span className="text-on-surface font-medium leading-tight">
                    {t.laborAgreementLabel}
                  </span>
                </label>
              </div>
            )}

            {/* Age */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="age-eligibility-input" className="block text-xs font-bold text-on-surface flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-primary" />
                  <span>{t.ageLabel}</span>
                </label>
                <span className="text-xs font-mono text-on-surface-variant">{age} 歳</span>
              </div>
              <input
                id="age-eligibility-input"
                type="range"
                min="16"
                max="80"
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="w-full accent-primary cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Diagnosis Result (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Main Status Headline Card */}
          <div className={`rounded-2xl border p-5 space-y-3 ${currentCfg.bg} ${currentCfg.borderAccent} shadow-sm`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <StatusIcon className="w-6 h-6 shrink-0" />
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider block opacity-80">
                    {t.resultHeader}
                  </span>
                  <h3 className="text-base sm:text-lg font-black leading-snug">
                    {lang === 'vi' ? result.headlineVi : lang === 'en' ? result.headlineEn : result.headlineJa}
                  </h3>
                </div>
              </div>
            </div>

            <p className="text-xs sm:text-sm leading-relaxed opacity-90">
              {lang === 'vi' ? result.summaryVi : lang === 'en' ? result.summaryEn : result.summaryJa}
            </p>

            {/* Special notices if any */}
            {result.specialNotes && result.specialNotes.length > 0 && (
              <div className="p-3 rounded-xl bg-surface/70 border border-border-subtle/50 text-xs space-y-1 text-on-surface">
                {result.specialNotes.map((note, idx) => (
                  <div key={idx} className="flex items-start gap-1.5 leading-relaxed">
                    <Info className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                    <span>{note}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Applicable Insurances Grid */}
          <div className="rounded-2xl border border-border-subtle bg-surface p-5 space-y-3 shadow-sm">
            <h3 className="font-bold text-xs text-on-surface flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span>{t.coverageTitle}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {/* Health Insurance */}
              <div className="p-3 rounded-xl bg-surface-container-low border border-border-subtle space-y-1">
                <span className="text-[11px] text-on-surface-variant block font-medium">
                  {t.healthTitle}
                </span>
                <div className="flex items-center gap-1.5 font-bold text-sm">
                  {result.applicableInsurances.healthInsurance ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-emerald-700 dark:text-emerald-300">{t.covered}</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-outline" />
                      <span className="text-on-surface-variant">{t.notCovered}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Welfare Pension */}
              <div className="p-3 rounded-xl bg-surface-container-low border border-border-subtle space-y-1">
                <span className="text-[11px] text-on-surface-variant block font-medium">
                  {t.pensionTitle}
                </span>
                <div className="flex items-center gap-1.5 font-bold text-sm">
                  {result.applicableInsurances.welfarePension ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-emerald-700 dark:text-emerald-300">{t.covered}</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-outline" />
                      <span className="text-on-surface-variant">{t.notCovered}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Employment Insurance */}
              <div className="p-3 rounded-xl bg-surface-container-low border border-border-subtle space-y-1">
                <span className="text-[11px] text-on-surface-variant block font-medium">
                  {t.employmentTitle}
                </span>
                <div className="flex items-center gap-1.5 font-bold text-sm">
                  {result.applicableInsurances.employmentInsurance ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-emerald-700 dark:text-emerald-300">{t.covered}</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-outline" />
                      <span className="text-on-surface-variant">{t.notCovered}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Criteria Checklist Breakdown */}
          {result.criteriaEvaluations && result.criteriaEvaluations.length > 0 && (
            <div className="rounded-2xl border border-border-subtle bg-surface p-5 space-y-3 shadow-sm">
              <h3 className="font-bold text-xs text-on-surface flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                <span>{t.checklistTitle}</span>
              </h3>

              <div className="space-y-2 text-xs">
                {result.criteriaEvaluations.map((c) => (
                  <div
                    key={c.id}
                    className="p-3 rounded-xl bg-surface-container-low border border-border-subtle flex items-start sm:items-center justify-between gap-2"
                  >
                    <div className="space-y-0.5">
                      <div className="font-bold text-on-surface">
                        {lang === 'vi' ? c.nameVi : c.nameJa}
                      </div>
                      <div className="text-[11px] text-on-surface-variant">
                        {lang === 'vi' ? c.explanationVi : c.explanationJa}
                      </div>
                    </div>

                    <div className="shrink-0">
                      {c.isMet ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" />
                          達成
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-800 dark:text-rose-300 border border-rose-500/30">
                          <XCircle className="w-3 h-3" />
                          未達成
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Educational Explanations (Why?) */}
          <div className="rounded-2xl border border-border-subtle bg-surface-container-low p-5 space-y-3">
            <h3 className="font-bold text-xs text-on-surface flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-primary" />
              <span>{t.whyTitle}</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-surface border border-border-subtle space-y-1">
                <div className="font-bold text-on-surface flex items-center gap-1">
                  <ArrowRight className="w-3.5 h-3.5 text-primary" />
                  <span>{t.why1}</span>
                </div>
                <p className="text-on-surface-variant leading-relaxed">
                  {t.why1Desc}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-surface border border-border-subtle space-y-1">
                <div className="font-bold text-on-surface flex items-center gap-1">
                  <ArrowRight className="w-3.5 h-3.5 text-primary" />
                  <span>{t.why2}</span>
                </div>
                <p className="text-on-surface-variant leading-relaxed">
                  {t.why2Desc}
                </p>
              </div>
            </div>
          </div>

          {/* Official Statutory Sources Section */}
          <RegulatorySourceView
            sourceIds={['mhlw-shakai-hoken-tekio-2026', 'kyokai-kenpo-monthly-table-2026', 'jps-welfare-pension-table-2026']}
            era="令和8年度（2026年）"
            applicablePeriodText="令和6年10月施行・令和8年度継続適用"
            lastVerified="2026-09-10"
            disclaimer="本チェッカーの判定は厚生労働省および日本年金機構の公式ガイドラインに基づく参考判定です。実際の適用にあたっては、雇用契約書の記載内容や労働実態、会社の適用事業所届出状況を勤務先の人事・総務部門または年金事務所にご確認ください。"
            lang={lang}
          />
        </div>
      </div>
    </div>
  );
}
