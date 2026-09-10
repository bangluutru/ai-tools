/**
 * @file packages/core/src/components/employment/UnemploymentEligibilityView.jsx
 * @description
 * Giao diện Tra cứu & Kiểm tra Điều kiện Hưởng Trợ cấp Thất nghiệp Nhật Bản (失業給付受給資格チェッカー)
 * Tuân thủ nghiêm ngặt MAIS: StandardToolLayout 1240px, Design Tokens, Trilingual (ja/vi/en), WCAG AA.
 */

import React, { useState, useMemo } from 'react';
import {
  FileSearch,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Briefcase,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  Calendar,
  FileText,
  UserCheck,
  HelpCircle,
  ArrowRight,
  Sparkles
} from 'lucide-react';

import StandardToolLayout from '../shared/StandardToolLayout.jsx';
import RegulatorySourceView from '../regulatory/RegulatorySourceView.jsx';
import {
  checkUnemploymentEligibility,
  SEPARATION_REASONS,
  ELIGIBILITY_CRITERIA_BY_CATEGORY
} from '../../japan/employment/index.js';

const TRANSLATIONS = {
  ja: {
    toolTitle: '失業保険受給資格チェッカー（特定受給資格者・自己都合・給付制限・受給期間延長判定）',
    toolDesc: '雇用保険法第13条・第23条・第33条に基づき、離職理由ごとの受給要件（被保険者期間6ヶ月/12ヶ月）、給付制限（なし/2ヶ月/3ヶ月）、待期期間、受給期間延長を判定します。',
    sectionInput: '1. 離職状況・雇用保険加入歴の入力',
    reasonLabel: '離職理由（退職の主たる原因）',
    reasonHint: '※ 離職理由によって必要な加入期間（6ヶ月 vs 12ヶ月）および給付制限期間が大きく異なります。',
    groupCompany: '【会社都合等・特定受給資格者】倒産・解雇・ハラスメント等',
    groupSpecific: '【正当な理由・特定理由離職者】雇止め・病気・介護等',
    groupPersonal: '【自己都合・その他】転職・キャリアアップ・懲戒解雇等',
    insuredMonthsLabel: '通算被保険者期間（雇用保険に加入していた月数）',
    insuredMonthsHint: '※ 原則として離職前2年（特定受給資格等は1年）の間に、賃金支払基礎日数が11日以上ある月を1ヶ月とカウントします。',
    monthsUnit: 'ヶ月',
    abilityLabel: '現在の就労意欲および身体能力（労働の意思と能力）',
    abilityYes: 'はい（健康状態に問題なく、すぐに就職活動・勤務が可能）',
    abilityNo: 'いいえ（病気・負傷・出産・育児・介護等ですぐに働けない）',
    temporaryInabilityLabel: '病気・怪我・妊娠出産・育児・家族介護等による一時的な就労不能ですか？',
    temporaryInabilityHint: '※ 一時的な就労不能の場合、受給期間（原則1年）を最大4年まで延長する手続きが可能です。',
    daysOffLabel: '療養・休業により賃金支払を受けられなかった日数（任意）',
    daysOffHint: '※ 30日以上賃金を受けられなかった場合、算定対象期間が延長されます。',
    daysUnit: '日',
    sectionResult: '2. 受給資格および給付スケジュールの判定結果',
    statusQualified: '基本手当の受給資格を満たしています',
    statusExtension: '受給期間の延長手続き（最大4年）が必要です',
    statusNotQualified: '現時点では基本手当の受給資格を満たしていません',
    cardClassification: '法的区分（離職区分）',
    cardRequiredMonths: '必要被保険者期間',
    cardInsuredMonths: '現在の加入期間',
    cardRestriction: '給付制限（待期後の制限）',
    cardFirstPayment: '初回の支給目安',
    noRestriction: 'なし（待期7日後すぐに支給対象）',
    weeksUnit: '週',
    sectionTimeline: '3. 手続きの流れと支給タイムライン',
    step1Title: 'ハローワークへ離職票を提出',
    step1Desc: '離職票-1・離職票-2を持参して求職の申込みを行います。受給資格の決定が行われます。',
    step2Title: '7日間の待期期間（法定）',
    step2Desc: '離職理由にかかわらず全員一律7日間です。この期間中にアルバイトや就労をすると待期が延長されます。',
    step3Title: '給付制限期間の経過',
    step3DescNo: '特定受給資格者または特定理由離職者のため、給付制限はありません。初回認定日後にすぐ支給されます。',
    step3DescYes: '自己都合退職のため2ヶ月間（または懲戒3ヶ月間）の給付制限があります。その後に支給が開始されます。',
    step4Title: '指定口座へ初回の基本手当振込',
    step4Desc: '失業認定を受け、通常認定日から約1週間程度で指定の金融機関口座へ振り込まれます。',
    sectionChecklist: '4. ハローワーク申請時の必要書類チェックリスト',
    checklistGuide: '退職後、会社から離職票が届いたら速やかに管轄のハローワークへ持参してください。',
    requiredBadge: '必須',
    optionalBadge: '該当者のみ',
    ctaSimulateBenefit: 'この条件で「失業給付の受給金額・日数シミュレーター」を開く',
    legalNotesTitle: '雇用保険法・ハローワーク取扱要領のポイント',
    legalPoint1Title: '特定受給資格者と特定理由離職者の優遇措置',
    legalPoint1Body: '倒産・解雇・雇止め・残業過多等による離職は、直前1年間に通算6ヶ月以上の加入で受給可能となり、2ヶ月の給付制限も免除されます。',
    legalPoint2Title: '離職理由に異議がある場合（判定の不服）',
    legalPoint2Body: '離職票に記載された離職理由が「自己都合」となっていても、残業記録や医師の診断書をハローワークに提出することで「特定理由離職者」に変更認定される場合があります。',
    legalPoint3Title: '受給期間の延長申請（第20条）',
    legalPoint3Body: '病気や育児ですぐに働けない場合、離職後30日経過してから早期に受給期間延長を申請してください。受給権の時効（通常1年）を最大4年まで延長できます。'
  },
  vi: {
    toolTitle: 'Kiểm Tra Điều Kiện Hưởng Trợ Cấp Thất Nghiệp Nhật Bản (受給資格チェッカー)',
    toolDesc: 'Căn cứ Điều 13, 23, 33 Luật Bảo hiểm Việc làm (雇用保険法), kiểm tra điều kiện thâm niên (6 tháng vs 12 tháng), thời gian hạn chế chi trả (0 vs 2 vs 3 tháng), 7 ngày chờ thụ lý và gia hạn tối đa 4 năm.',
    sectionInput: '1. Nhập lý do thôi việc & Quá trình tham gia bảo hiểm',
    reasonLabel: 'Lý do thôi việc (Nguyên nhân chính dẫn đến chấm dứt hợp đồng)',
    reasonHint: '※ Lý do thôi việc quyết định trực tiếp số tháng bảo hiểm tối thiểu cần có (6 tháng vs 12 tháng) và thời gian bị giam tiền (給付制限).',
    groupCompany: '【Lỗi công ty / Khách quan - 特定受給資格者】Phá sản, sa thải, quấy rối, tăng ca quá mức',
    groupSpecific: '【Lý do chính đáng - 特定理由離職者】Hết hạn hợp đồng, ốm đau, nuôi con, chăm sóc người thân',
    groupPersonal: '【Tự ý nghỉ việc - 一般離職者】Chuyển việc, nâng cao bản thân, hoặc sa thải kỷ luật',
    insuredMonthsLabel: 'Tổng số tháng đã đóng bảo hiểm việc làm (通算被保険者期間)',
    insuredMonthsHint: '※ Tính số tháng có từ 11 ngày làm việc trở lên trong vòng 2 năm trước khi nghỉ việc (hoặc 1 năm đối với diện ưu tiên).',
    monthsUnit: 'tháng',
    abilityLabel: 'Khả năng và ý chí đi làm ngay (労働の意思及び能力)',
    abilityYes: 'Có (Sức khỏe tốt, sẵn sàng đi phỏng vấn và đi làm ngay)',
    abilityNo: 'Không (Đang chữa bệnh, sinh con, chăm sóc gia đình chưa thể đi làm ngay)',
    temporaryInabilityLabel: 'Đây có phải là gián đoạn tạm thời do ốm đau, thai sản, nuôi con nhỏ hoặc chăm sóc gia đình?',
    temporaryInabilityHint: '※ Nếu tạm thời chưa đi làm được, bạn được làm thủ tục xin GIA HẠN THỜI HẠN THỤ HƯỞNG (tối đa 4 năm) để bảo lưu quyền lợi.',
    daysOffLabel: 'Số ngày nghỉ không hưởng lương do ốm đau / tai nạn (nếu có)',
    daysOffHint: '※ Nghỉ liên tục từ 30 ngày trở lên sẽ được cộng thêm vào thời kỳ tính toán bảo lưu.',
    daysUnit: 'ngày',
    sectionResult: '2. Kết quả kiểm tra thụ hưởng & Tiến trình nhận trợ cấp',
    statusQualified: 'Bạn ĐỦ ĐIỀU KIỆN nhận trợ cấp thất nghiệp (基本手当)',
    statusExtension: 'Cần làm thủ tục XIN GIA HẠN THỜI HẠN NHẬN TRỢ CẤP (tối đa 4 năm)',
    statusNotQualified: 'Hiện tại CHƯA ĐỦ ĐIỀU KIỆN nhận trợ cấp thất nghiệp',
    cardClassification: 'Diện phân loại pháp lý',
    cardRequiredMonths: 'Yêu cầu tối thiểu',
    cardInsuredMonths: 'Số tháng thực tế',
    cardRestriction: 'Hạn chế chi trả (給付制限)',
    cardFirstPayment: 'Ước tính nhận tiền đợt 1',
    noRestriction: 'Không hạn chế (Sau 7 ngày chờ nhận ngay)',
    weeksUnit: 'tuần',
    sectionTimeline: '3. Quy trình nộp đơn & Tiến độ giải ngân tại Hello Work',
    step1Title: 'Nộp giấy Rishokuhyo tại Hello Work',
    step1Desc: 'Mang phiếu thôi việc (Rishokuhyo 1 & 2) do công ty gửi về đến văn phòng Hello Work nơi cư trú để nộp đơn xin việc.',
    step2Title: '7 ngày chờ xét duyệt luật định (待期期間)',
    step2Desc: 'Tất cả mọi đối tượng đều phải trải qua 7 ngày này. TUYỆT ĐỐI KHÔNG LÀM THÊM (baito) trong 7 ngày này để tránh bị hủy hiệu lực.',
    step3Title: 'Thời gian hạn chế chi trả (給付制限)',
    step3DescNo: 'Diện công ty sa thải hoặc lý do chính đáng: KHÔNG BỊ HẠN CHẾ. Tiền trợ cấp được tính ngay sau khi kết thúc 7 ngày chờ.',
    step3DescYes: 'Tự ý nghỉ việc cá nhân: Bị hạn chế chi trả 2 tháng (hoặc 3 tháng nếu bị sa thải kỷ luật). Sau 2 tháng mới bắt đầu được tính tiền.',
    step4Title: 'Nhận tiền chuyển khoản đợt đầu',
    step4Desc: 'Sau buổi chứng nhận thất nghiệp định kỳ, tiền sẽ được chuyển thẳng vào tài khoản ngân hàng của bạn trong khoảng 1 tuần.',
    sectionChecklist: '4. Danh mục giấy tờ cần chuẩn bị nộp Hello Work',
    checklistGuide: 'Sau khi nhận được Phiếu thôi việc (離職票) từ công ty (khoảng 10-14 ngày sau khi nghỉ việc), mang đầy đủ các giấy tờ sau đến Hello Work:',
    requiredBadge: 'Bắt buộc',
    optionalBadge: 'Nếu có',
    ctaSimulateBenefit: 'Mô phỏng chi tiết Số tiền & Ngày hưởng trợ cấp thất nghiệp',
    legalNotesTitle: 'Quy tắc pháp lý quan trọng cần biết',
    legalPoint1Title: 'Được chuyển đổi từ "Tự ý nghỉ" sang "Lý do đặc định"',
    legalPoint1Body: 'Dù trên giấy thôi việc công ty ghi là "Tự ý thôi việc" (自己都合), nếu bạn có bằng chứng tăng ca quá mức (thẻ chấm công) hoặc giấy bác sĩ yêu cầu đổi môi trường, Hello Work sẽ đổi sang diện được nhận tiền ngay không bị giam 2 tháng.',
    legalPoint2Title: 'Cấm làm thêm trong 7 ngày chờ (待期期間)',
    legalPoint2Body: 'Trong 7 ngày chờ đầu tiên sau khi nộp đơn, tuyệt đối không làm bất kỳ công việc phát sinh thù lao nào. Nếu làm việc, 7 ngày chờ sẽ bị dời lại.',
    legalPoint3Title: 'Gia hạn thời hạn nhận trợ cấp tối đa 4 năm (Điều 20)',
    legalPoint3Body: 'Quyền nhận trợ cấp thất nghiệp có thời hiệu thông thường là 1 năm. Nếu sau khi nghỉ việc bị ốm đau/sinh con không thể tìm việc, phải nộp đơn gia hạn sau 30 ngày để kéo dài thời hạn lên đến 4 năm.'
  },
  en: {
    toolTitle: 'Japan Unemployment Benefits Eligibility Checker (受給資格チェッカー)',
    toolDesc: 'Statutory eligibility verification under Employment Insurance Act Articles 13, 23 & 33. Verifies insured months (6 vs 12 mos), benefit restriction periods (none vs 2 mos), 7-day standby, and up to 4-year extension.',
    sectionInput: '1. Separation Reason & Insurance Record',
    reasonLabel: 'Primary Reason for Separation',
    reasonHint: '※ The separation category determines the minimum insured period needed (6 mos vs 12 mos) and whether payment restriction applies.',
    groupCompany: '[Company-Attributable / Type A] Bankruptcy, Dismissal, Harassment, Overtime',
    groupSpecific: '[Specific Justified / Type B] Contract Expiry Refused, Illness, Caregiving',
    groupPersonal: '[Personal Voluntary / Type C] Career Move, Personal Break, Disciplinary',
    insuredMonthsLabel: 'Total Insured Months in Employment Insurance',
    insuredMonthsHint: '※ Counted as months with 11+ wage payment days within 2 years (or 1 year for Type A/B) prior to separation.',
    monthsUnit: 'months',
    abilityLabel: 'Immediate Willingness & Ability to Work',
    abilityYes: 'Yes (Healthy, ready to interview and accept employment immediately)',
    abilityNo: 'No (Currently unable to work due to illness, pregnancy, caregiving)',
    temporaryInabilityLabel: 'Is this inability temporary due to illness, injury, maternity, childcare or elder care?',
    temporaryInabilityHint: '※ Temporary inability qualifies for "Benefit Period Extension" (up to 4 years) to preserve eligibility.',
    daysOffLabel: 'Unpaid days off due to medical leave/injury (Optional)',
    daysOffHint: '※ 30+ consecutive unpaid days extends the statutory reference period.',
    daysUnit: 'days',
    sectionResult: '2. Eligibility Determination & Payment Timeline',
    statusQualified: 'You are QUALIFIED for Employment Insurance Benefits',
    statusExtension: 'Benefit Period EXTENSION APPLICATION REQUIRED (up to 4 years)',
    statusNotQualified: 'Currently NOT QUALIFIED for Unemployment Benefits',
    cardClassification: 'Legal Classification',
    cardRequiredMonths: 'Min. Insured Required',
    cardInsuredMonths: 'Current Insured Months',
    cardRestriction: 'Benefit Restriction',
    cardFirstPayment: 'Est. First Payment',
    noRestriction: 'None (Immediate after 7-day standby)',
    weeksUnit: 'weeks',
    sectionTimeline: '3. Application Procedure & Disbursement Timeline',
    step1Title: 'Submit Rishokuhyo at Hello Work',
    step1Desc: 'Bring separation forms (Rishokuhyo 1 & 2) to your local Public Employment Security Office.',
    step2Title: '7-Day Statutory Standby (待期期間)',
    step2Desc: 'Universal 7-day waiting period. Strict ban on part-time work or side earnings during these 7 days.',
    step3Title: 'Benefit Restriction Period',
    step3DescNo: 'Company-attributable or specific justified reason: 0 restriction months. Eligible immediately after standby.',
    step3DescYes: 'Voluntary resignation: 2 months restriction period before payment eligibility commences.',
    step4Title: 'First Allowance Bank Transfer',
    step4Desc: 'Following your first official unemployment certification day, funds transfer within 1 week.',
    sectionChecklist: '4. Hello Work Application Document Checklist',
    checklistGuide: 'Once you receive your Rishokuhyo from your employer (approx. 10-14 days after leaving), bring these documents:',
    requiredBadge: 'Required',
    optionalBadge: 'Conditional',
    ctaSimulateBenefit: 'Calculate Exact Daily Benefit Amount & Total Duration',
    legalNotesTitle: 'Key Statutory Rules to Keep in Mind',
    legalPoint1Title: 'Reclassifying Voluntary Resignation to Type B',
    legalPoint1Body: 'Even if the employer recorded "voluntary resignation", submitting evidence of chronic overtime or medical advice can reclassify your claim to immediate payout without the 2-month delay.',
    legalPoint2Title: 'Strict Work Prohibition during 7-Day Standby',
    legalPoint2Body: 'Do not perform any paid labor during the initial 7-day standby period; working resets the standby calculation.',
    legalPoint3Title: 'Benefit Extension up to 4 Years (Article 20)',
    legalPoint3Body: 'Unemployment rights expire in 1 year by default. If incapacitated, apply for an extension after 30 days to stretch validity up to 4 years.'
  }
};

export default function UnemploymentEligibilityView({ lang = 'ja' }) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.ja;

  // Form State
  const [reasonId, setReasonId] = useState('contract_expired_refused');
  const [totalInsuredMonths, setTotalInsuredMonths] = useState(12);
  const [isAbleToWorkImmediately, setIsAbleToWorkImmediately] = useState(true);
  const [isInabilityTemporary, setIsInabilityTemporary] = useState(true);
  const [daysOffUnableToWork, setDaysOffUnableToWork] = useState(0);

  // User interactive checklist state
  const [checkedDocs, setCheckedDocs] = useState({});

  const toggleDocCheck = (id) => {
    setCheckedDocs((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Tính toán kết quả điều kiện thông qua Statutory Engine
  const result = useMemo(() => {
    return checkUnemploymentEligibility({
      reasonId,
      totalInsuredMonths: Number(totalInsuredMonths) || 0,
      isAbleToWorkImmediately,
      isInabilityTemporary,
      daysOffUnableToWork: Number(daysOffUnableToWork) || 0
    });
  }, [reasonId, totalInsuredMonths, isAbleToWorkImmediately, isInabilityTemporary, daysOffUnableToWork]);

  return (
    <StandardToolLayout
      title={t.toolTitle}
      description={t.toolDesc}
    >
      <div className="space-y-8 max-w-[1240px] mx-auto text-on-surface">
        {/* Section 1: Inputs */}
        <section className="bg-surface-container rounded-2xl p-6 border border-outline-variant/30 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-outline-variant/20 pb-4">
            <Briefcase className="w-6 h-6 text-primary" />
            <h2 className="text-lg font-bold text-on-surface">{t.sectionInput}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Reason for Separation */}
            <div className="space-y-2 md:col-span-2">
              <label
                htmlFor="reason-select"
                className="block text-sm font-semibold text-on-surface"
              >
                {t.reasonLabel}
              </label>
              <select
                id="reason-select"
                aria-label={t.reasonLabel}
                value={reasonId}
                onChange={(e) => setReasonId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/50 bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary text-sm font-medium"
              >
                <optgroup label={t.groupCompany}>
                  {SEPARATION_REASONS.COMPANY_CAUSE.map((r) => (
                    <option key={r.id} value={r.id}>
                      {lang === 'ja' ? r.ja : lang === 'vi' ? `${r.vi} (${r.ja})` : `${r.en} (${r.ja})`}
                    </option>
                  ))}
                </optgroup>
                <optgroup label={t.groupSpecific}>
                  {SEPARATION_REASONS.SPECIFIC_REASONS.map((r) => (
                    <option key={r.id} value={r.id}>
                      {lang === 'ja' ? r.ja : lang === 'vi' ? `${r.vi} (${r.ja})` : `${r.en} (${r.ja})`}
                    </option>
                  ))}
                </optgroup>
                <optgroup label={t.groupPersonal}>
                  {SEPARATION_REASONS.PERSONAL_VOLUNTARY.map((r) => (
                    <option key={r.id} value={r.id}>
                      {lang === 'ja' ? r.ja : lang === 'vi' ? `${r.vi} (${r.ja})` : `${r.en} (${r.ja})`}
                    </option>
                  ))}
                </optgroup>
              </select>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                {t.reasonHint}
              </p>
            </div>

            {/* Total Insured Months */}
            <div className="space-y-2">
              <label
                htmlFor="insured-months-input"
                className="block text-sm font-semibold text-on-surface"
              >
                {t.insuredMonthsLabel}
              </label>
              <div className="relative">
                <input
                  id="insured-months-input"
                  aria-label={t.insuredMonthsLabel}
                  type="number"
                  min="0"
                  max="480"
                  value={totalInsuredMonths}
                  onChange={(e) => setTotalInsuredMonths(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/50 bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary font-semibold text-sm pr-16"
                />
                <span className="absolute right-4 top-2.5 text-sm text-on-surface-variant font-medium">
                  {t.monthsUnit}
                </span>
              </div>
              <p className="text-xs text-on-surface-variant">
                {t.insuredMonthsHint}
              </p>
            </div>

            {/* Immediate Ability to Work */}
            <div className="space-y-2">
              <label
                htmlFor="ability-select"
                className="block text-sm font-semibold text-on-surface"
              >
                {t.abilityLabel}
              </label>
              <select
                id="ability-select"
                aria-label={t.abilityLabel}
                value={isAbleToWorkImmediately ? 'true' : 'false'}
                onChange={(e) => setIsAbleToWorkImmediately(e.target.value === 'true')}
                className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/50 bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary text-sm font-medium"
              >
                <option value="true">{t.abilityYes}</option>
                <option value="false">{t.abilityNo}</option>
              </select>
            </div>

            {/* Conditional: Extension & Days Off */}
            {!isAbleToWorkImmediately && (
              <div className="md:col-span-2 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-4">
                <div className="flex items-start gap-3">
                  <input
                    id="temp-inability-check"
                    aria-label={t.temporaryInabilityLabel}
                    type="checkbox"
                    checked={isInabilityTemporary}
                    onChange={(e) => setIsInabilityTemporary(e.target.checked)}
                    className="mt-1 w-4 h-4 text-primary rounded border-outline-variant/50 focus:ring-primary"
                  />
                  <div>
                    <label
                      htmlFor="temp-inability-check"
                      className="text-sm font-semibold text-on-surface cursor-pointer"
                    >
                      {t.temporaryInabilityLabel}
                    </label>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      {t.temporaryInabilityHint}
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5 max-w-sm">
                  <label
                    htmlFor="days-off-input"
                    className="block text-xs font-semibold text-on-surface"
                  >
                    {t.daysOffLabel}
                  </label>
                  <div className="relative">
                    <input
                      id="days-off-input"
                      aria-label={t.daysOffLabel}
                      type="number"
                      min="0"
                      max="1460"
                      value={daysOffUnableToWork}
                      onChange={(e) => setDaysOffUnableToWork(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className="w-full px-3 py-1.5 rounded-lg border border-outline-variant/50 bg-surface text-on-surface text-sm font-medium pr-12"
                    />
                    <span className="absolute right-3 top-1.5 text-xs text-on-surface-variant">
                      {t.daysUnit}
                    </span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant">
                    {t.daysOffHint}
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Section 2: Results Overview */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 border-b border-outline-variant/20 pb-3">
            <CheckCircle2 className="w-6 h-6 text-primary" />
            <h2 className="text-lg font-bold text-on-surface">{t.sectionResult}</h2>
          </div>

          {/* Master Status Banner */}
          {result.status === 'QUALIFIED' && (
            <div className="p-5 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/40 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base md:text-lg font-extrabold text-emerald-800 dark:text-emerald-300">
                  {t.statusQualified}
                </h3>
                <p className="text-xs md:text-sm text-on-surface-variant font-medium">
                  {lang === 'ja' ? result.timeline.summaryJa : result.timeline.summaryVi}
                </p>
              </div>
            </div>
          )}

          {result.status === 'EXTENSION_REQUIRED' && (
            <div className="p-5 rounded-2xl bg-amber-500/10 border-2 border-amber-500/40 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base md:text-lg font-extrabold text-amber-800 dark:text-amber-300">
                  {t.statusExtension}
                </h3>
                <p className="text-xs md:text-sm text-on-surface-variant font-medium">
                  {result.warnings[0]?.[lang] || result.warnings[0]?.ja}
                </p>
              </div>
            </div>
          )}

          {result.status === 'NOT_QUALIFIED' && (
            <div className="p-5 rounded-2xl bg-rose-500/10 border-2 border-rose-500/40 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-rose-500/20 text-rose-700 dark:text-rose-400 flex items-center justify-center shrink-0">
                <XCircle className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base md:text-lg font-extrabold text-rose-800 dark:text-rose-300">
                  {t.statusNotQualified}
                </h3>
                <p className="text-xs md:text-sm text-on-surface-variant font-medium">
                  {result.warnings[0]?.[lang] || result.warnings[0]?.ja}
                </p>
              </div>
            </div>
          )}

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Card 1: Legal Category */}
            <div className="bg-surface-container rounded-xl p-4 border border-outline-variant/30 space-y-1.5 shadow-sm">
              <span className="text-xs text-on-surface-variant font-medium block">
                {t.cardClassification}
              </span>
              <p className="text-sm md:text-base font-extrabold text-primary line-clamp-2">
                {lang === 'ja'
                  ? result.classificationNameJa
                  : lang === 'vi'
                  ? result.classificationNameVi
                  : result.classificationNameEn}
              </p>
            </div>

            {/* Card 2: Insured Months */}
            <div className="bg-surface-container rounded-xl p-4 border border-outline-variant/30 space-y-1.5 shadow-sm">
              <span className="text-xs text-on-surface-variant font-medium block">
                {t.cardInsuredMonths} / {t.cardRequiredMonths}
              </span>
              <p className="text-lg md:text-xl font-extrabold text-on-surface">
                {result.totalInsuredMonths} <span className="text-xs font-normal">/ {result.requiredInsuredMonths} {t.monthsUnit}</span>
              </p>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full inline-block ${
                result.isInsuredMonthsSufficient
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                  : 'bg-rose-500/15 text-rose-700 dark:text-rose-400'
              }`}>
                {result.isInsuredMonthsSufficient ? 'OK (要件クリア)' : '不足'}
              </span>
            </div>

            {/* Card 3: Restriction */}
            <div className="bg-surface-container rounded-xl p-4 border border-outline-variant/30 space-y-1.5 shadow-sm">
              <span className="text-xs text-on-surface-variant font-medium block">
                {t.cardRestriction}
              </span>
              <p className="text-lg md:text-xl font-extrabold text-on-surface">
                {result.timeline.benefitRestrictionMonths === 0 ? (
                  <span className="text-emerald-700 dark:text-emerald-400">{t.noRestriction}</span>
                ) : (
                  <span>{result.timeline.benefitRestrictionMonths} {t.monthsUnit}</span>
                )}
              </p>
              <span className="text-[11px] text-on-surface-variant block">
                待期 7 日間
              </span>
            </div>

            {/* Card 4: First Payment */}
            <div className="bg-surface-container rounded-xl p-4 border border-outline-variant/30 space-y-1.5 shadow-sm">
              <span className="text-xs text-on-surface-variant font-medium block">
                {t.cardFirstPayment}
              </span>
              <p className="text-lg md:text-xl font-extrabold text-primary">
                ~{result.timeline.estimatedWeeksToFirstPayment} <span className="text-xs font-normal">{t.weeksUnit}</span>
              </p>
              <span className="text-[11px] text-on-surface-variant block">
                約 {Math.round(result.timeline.estimatedWeeksToFirstPayment / 4)} ヶ月後
              </span>
            </div>
          </div>
        </section>

        {/* Section 3: Step-by-Step Procedure Timeline */}
        <section className="bg-surface-container rounded-2xl p-6 border border-outline-variant/30 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-outline-variant/20 pb-4">
            <Clock className="w-6 h-6 text-primary" />
            <h2 className="text-lg font-bold text-on-surface">{t.sectionTimeline}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Step 1 */}
            <div className="p-4 rounded-xl bg-surface border border-outline-variant/30 space-y-2 relative">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-extrabold flex items-center justify-center text-sm">
                1
              </div>
              <h3 className="text-sm font-bold text-on-surface">{t.step1Title}</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">{t.step1Desc}</p>
            </div>

            {/* Step 2 */}
            <div className="p-4 rounded-xl bg-surface border border-outline-variant/30 space-y-2 relative">
              <div className="w-8 h-8 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 font-extrabold flex items-center justify-center text-sm">
                2
              </div>
              <h3 className="text-sm font-bold text-on-surface">{t.step2Title}</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">{t.step2Desc}</p>
            </div>

            {/* Step 3 */}
            <div className="p-4 rounded-xl bg-surface border border-outline-variant/30 space-y-2 relative">
              <div className={`w-8 h-8 rounded-full font-extrabold flex items-center justify-center text-sm ${
                result.timeline.benefitRestrictionMonths === 0
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                  : 'bg-blue-500/15 text-blue-700 dark:text-blue-400'
              }`}>
                3
              </div>
              <h3 className="text-sm font-bold text-on-surface">{t.step3Title}</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                {result.timeline.benefitRestrictionMonths === 0 ? t.step3DescNo : t.step3DescYes}
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-4 rounded-xl bg-surface border border-outline-variant/30 space-y-2 relative">
              <div className="w-8 h-8 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-extrabold flex items-center justify-center text-sm">
                4
              </div>
              <h3 className="text-sm font-bold text-on-surface">{t.step4Title}</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">{t.step4Desc}</p>
            </div>
          </div>
        </section>

        {/* Section 4: Document Checklist & Evidence */}
        <section className="bg-surface-container rounded-2xl p-6 border border-outline-variant/30 shadow-sm space-y-4">
          <div className="flex items-center gap-3 border-b border-outline-variant/20 pb-4">
            <FileText className="w-6 h-6 text-primary" />
            <div>
              <h2 className="text-lg font-bold text-on-surface">{t.sectionChecklist}</h2>
              <p className="text-xs text-on-surface-variant">{t.checklistGuide}</p>
            </div>
          </div>

          <div className="space-y-3">
            {result.checklist.map((item) => {
              const isChecked = !!checkedDocs[item.id];
              return (
                <div
                  key={item.id}
                  onClick={() => toggleDocCheck(item.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                    isChecked
                      ? 'bg-emerald-500/5 border-emerald-500/40'
                      : 'bg-surface border-outline-variant/30 hover:border-outline-variant/60'
                  }`}
                >
                  <input
                    id={`doc-check-${item.id}`}
                    aria-label={item.nameJa}
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleDocCheck(item.id)}
                    className="mt-1 w-4 h-4 text-primary rounded border-outline-variant/50 focus:ring-primary"
                  />
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-sm font-bold ${isChecked ? 'line-through text-on-surface-variant' : 'text-on-surface'}`}>
                        {lang === 'ja' ? item.nameJa : lang === 'vi' ? item.nameVi : item.nameEn}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.required
                          ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400'
                          : 'bg-surface-container-high text-on-surface-variant'
                      }`}>
                        {item.required ? t.requiredBadge : t.optionalBadge}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant">
                      {item.source}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section 5: Deep Link CTA to Benefit Simulator */}
        <section className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl p-6 border border-primary/20 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              {t.ctaSimulateBenefit}
            </h3>
            <p className="text-xs text-on-surface-variant">
              Tiếp tục tính toán số tiền thực nhận mỗi tháng (賃金日額・給付率50%〜80%) và tổng số ngày được hưởng trợ cấp (90日〜330日).
            </p>
          </div>
          <a
            href="#/tools/unemployment-benefit-jp"
            className="px-5 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-sm hover:opacity-90 transition-opacity flex items-center gap-2 shrink-0 shadow-sm"
          >
            <span>{t.ctaSimulateBenefit}</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </section>

        {/* Section 6: Legal Notes */}
        <section className="bg-surface-container rounded-2xl p-6 border border-outline-variant/30 shadow-sm space-y-4">
          <div className="flex items-center gap-3 border-b border-outline-variant/20 pb-4">
            <ShieldCheck className="w-6 h-6 text-primary" />
            <h2 className="text-lg font-bold text-on-surface">{t.legalNotesTitle}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-surface border border-outline-variant/30 space-y-1.5">
              <h3 className="font-bold text-on-surface flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                {t.legalPoint1Title}
              </h3>
              <p className="text-on-surface-variant leading-relaxed">{t.legalPoint1Body}</p>
            </div>

            <div className="p-4 rounded-xl bg-surface border border-outline-variant/30 space-y-1.5">
              <h3 className="font-bold text-on-surface flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                {t.legalPoint2Title}
              </h3>
              <p className="text-on-surface-variant leading-relaxed">{t.legalPoint2Body}</p>
            </div>

            <div className="p-4 rounded-xl bg-surface border border-outline-variant/30 space-y-1.5">
              <h3 className="font-bold text-on-surface flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                {t.legalPoint3Title}
              </h3>
              <p className="text-on-surface-variant leading-relaxed">{t.legalPoint3Body}</p>
            </div>
          </div>
        </section>

        {/* Section 7: Regulatory Sources */}
        <RegulatorySourceView sources={result.sources} lang={lang} />
      </div>
    </StandardToolLayout>
  );
}
