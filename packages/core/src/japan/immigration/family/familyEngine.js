/**
 * @file packages/core/src/japan/immigration/family/familyEngine.js
 * @description
 * Động cơ thẩm định điều kiện bảo lãnh gia đình và tư cách 家族滞在 (Dependent).
 * Tuân thủ nghiêm ngặt nguyên tắc Zero-Inference & McLean Doctrine:
 * - Đối soát khách quan các giới hạn pháp định của Luật Nhập quản.
 * - Cảnh báo nghiêm ngặt về ranh giới cha mẹ/anh chị em ruột và giới hạn 28h làm thêm.
 */

import {
  SPONSOR_STATUS_ELIGIBILITY,
  RELATIONSHIP_SCOPES,
  SPONSOR_FINANCIAL_BENCHMARKS,
  FAMILY_APPLICATION_PROCEDURES,
  DEPENDENT_WORK_PERMIT_RULES,
} from './familyRules.js';
import { getStatusChangeFeeSchedule } from '../statusChange/statusChangeRules.js';
import {
  parseLocalDate,
  formatLocalDate,
  addDaysLocal,
  diffCalendarDays,
  resolveCurrentDate,
  todayLocalISO,
} from '../shared/localDate.js';

/**
 * Người bảo lãnh là công dân Nhật hoặc người Vĩnh trú: vợ/chồng/con KHÔNG dùng 家族滞在
 * mà dùng tư cách thân phận (日本人の配偶者等 / 永住者の配偶者等 / 定住者...).
 */
const STATUS_BASED_SPONSORS = {
  japanese_national: {
    targetStatus_ja: '日本人の配偶者等',
    targetStatus_vn: 'Vợ/chồng hoặc con của người Nhật (日本人の配偶者等)',
    targetStatus_en: 'Spouse or Child of Japanese National',
  },
  permanent_resident: {
    targetStatus_ja: '永住者の配偶者等（日本で出生し引き続き在留する子を含む。それ以外の子は「定住者」等）',
    targetStatus_vn: 'Vợ/chồng hoặc con của người Vĩnh trú (永住者の配偶者等 — con sinh ra tại Nhật và ở liên tục; con sinh ở nước ngoài thường xét diện 定住者)',
    targetStatus_en: 'Spouse or Child of Permanent Resident (children born abroad are usually considered under Long-Term Resident)',
  },
};

/**
 * Đánh giá điều kiện bảo lãnh người thân sang Nhật Bản
 * 
 * @param {Object} input
 * @param {string} input.sponsorStatusId - Mã visa của người bảo lãnh (e.g. 'engineer_specialist', 'specified_skilled_1')
 * @param {string} input.relationshipType - 'spouse' | 'child' | 'parent' | 'sibling'
 * @param {number} [input.sponsorAnnualIncome] - Thu nhập hàng năm của người bảo lãnh (JPY)
 * @param {number} [input.dependentCount] - Số lượng người phụ thuộc muốn bảo lãnh / đang bảo lãnh
 * @param {boolean} [input.sponsorTaxCompliant] - Đã nộp đủ thuế cư trú, không nợ thuế
 * @param {boolean} [input.sponsorPensionCompliant] - Đã nộp đủ bảo hiểm y tế và nenkin
 * @param {string} [input.currentLocation] - 'overseas' | 'in_japan' | 'newborn_in_japan'
 * @param {string} [input.applicationDate] - Ngày dự kiến nộp đơn (YYYY-MM-DD)
 * @param {string} [input.childBirthDate] - Ngày sinh của trẻ (nếu sinh tại Nhật Bản)
 * @param {boolean} [input.intendsToWorkPartTime] - Người thân có dự định đi làm thêm không
 * @param {string} [input.currentDate] - Ngày đối chiếu "hôm nay" (YYYY-MM-DD) — dùng cho test
 * @param {'counter'|'online'} [input.filingMethod='counter']
 * @param {string} [input.expectedPeriod='1y'] - Bậc thời hạn dự kiến được cấp (ảnh hưởng phí từ 01/10/2026)
 * @returns {Object} Kết quả đánh giá pháp lý và danh mục hướng dẫn
 */
export function evaluateFamilyImmigration(input = {}) {
  const {
    sponsorStatusId = 'engineer_specialist',
    relationshipType = 'spouse',
    sponsorAnnualIncome = 3500000,
    dependentCount = 1,
    sponsorTaxCompliant = true,
    currentLocation = 'overseas',
    applicationDate = todayLocalISO(),
    childBirthDate = null,
    intendsToWorkPartTime = false,
    currentDate,
    filingMethod = 'counter',
    expectedPeriod,
  } = input;

  const warnings = [];
  const prerequisites = [];
  let readinessStatus = 'ready';

  // 1. Kiểm tra Mối quan hệ thân nhân (Relationship Check)
  const relScope = RELATIONSHIP_SCOPES[relationshipType.toUpperCase()] || RELATIONSHIP_SCOPES.SPOUSE;

  if (!relScope.eligibleForKazokuTaizai) {
    readinessStatus = 'ineligible';

    if (relationshipType === 'parent') {
      warnings.push({
        code: 'PARENT_NOT_ELIGIBLE_FOR_DEPENDENT',
        severity: 'danger',
        title_ja: '父母・義父母は「家族滞在」の対象外です',
        title_vn: 'Cha mẹ ruột / Cha mẹ vợ chồng KHÔNG ĐƯỢC CẤP VISA GIA ĐÌNH (家族滞在)',
        title_en: 'Parents are strictly ineligible for Dependent status (Kazoku Taizai)',
        message_ja: '入管法別表第1の4において「家族滞在」の対象は配偶者と子に限定されています。親を帯同できるのは高度専門職外国人（世帯年収800万円以上・7歳未満の子の養育等）の特定活動告示第34号、または極めて例外的な人道配慮による特定活動（特定事情の告示外）に限られます。',
        message_vn: 'Theo Phụ lục 1-4 Luật Nhập cảnh Nhật Bản, tư cách 「家族滞在」 CHỈ áp dụng cho VỢ/CHỒNG và CON CÁI. Cha mẹ chỉ có thể được xem xét sang diện 特定活動 nếu bạn là Lao động chất lượng cao (HSP thu nhập >= 8M JPY, có con dưới 7 tuổi) hoặc trường hợp nhân đạo đặc biệt cao độ (cha mẹ già yếu bệnh tật không nơi nương tựa).',
        message_en: 'Under Annexed Table 1-4 of the Immigration Act, Dependent status is restricted exclusively to spouse and children. Parents can only qualify via Designated Activities under HSP rules (income >= 8M JPY & rearing child under 7) or exceptional humanitarian relief.'
      });
    } else if (relationshipType === 'sibling') {
      warnings.push({
        code: 'SIBLING_NOT_ELIGIBLE_FOR_DEPENDENT',
        severity: 'danger',
        title_ja: '兄弟・姉妹は「家族滞在」で呼ぶことはできません',
        title_vn: 'Anh chị em ruột KHÔNG THUỘC DIỆN BẢO LÃNH VISA GIA ĐÌNH',
        title_en: 'Siblings cannot be sponsored under Dependent status',
        message_ja: '入管法上、兄弟姉妹を呼ぶための家族系ビザは存在しません。留学、技術・人文知識・国際業務、特定技能などの独立した在留資格を取得して来日する必要があります。',
        message_vn: 'Luật Nhập cảnh Nhật Bản hoàn toàn không có loại visa bảo lãnh dành cho anh chị em ruột. Người thân muốn sang Nhật phải tự nộp hồ sơ xin visa độc lập (như Du học, Đi làm kỹ thuật, hoặc Kỹ năng đặc định).',
        message_en: 'Japanese immigration law provides no dependent sponsorship for siblings. They must qualify for independent statuses (Student, Work, Specified Skilled Worker, etc.).'
      });
    }
  }

  prerequisites.push({
    id: 'relationship_qualification',
    title_ja: '在留資格「家族滞在」の該当関係（配偶者または子）',
    title_vn: 'Mối quan hệ đủ điều kiện diện Gia đình (Vợ/Chồng hoặc Con cái)',
    title_en: 'Qualifying family relationship (Spouse or Child)',
    met: relScope.eligibleForKazokuTaizai,
    required: true,
    guidance_ja: relScope.notes_ja,
    guidance_vn: relScope.notes_vn,
    guidance_en: relScope.notes_en
  });

  // 2. Kiểm tra Tư cách người bảo lãnh (Sponsor Status Eligibility)
  const isSponsorBarred = SPONSOR_STATUS_ELIGIBILITY.BARRED_STATUSES.includes(sponsorStatusId);
  const isSponsorAllowed = SPONSOR_STATUS_ELIGIBILITY.ALLOWED_STATUSES.includes(sponsorStatusId);

  const statusBasedSponsor = STATUS_BASED_SPONSORS[sponsorStatusId] || null;
  const sponsorEligible = !isSponsorBarred && isSponsorAllowed;

  prerequisites.push({
    id: 'sponsor_status_eligibility',
    title_ja: '扶養者（スポンサー）の在留資格適格性',
    title_vn: 'Tư cách lưu trú của người bảo lãnh cho phép đưa gia đình sang',
    title_en: 'Sponsor residence status eligibility to bring dependents',
    met: sponsorEligible,
    required: true,
    guidance_ja: isSponsorBarred
      ? '特定技能1号および技能実習は法令上、家族の帯同が認められていません（特定技能2号への移行等が必要です）。'
      : statusBasedSponsor
        ? `扶養者が日本人・永住者の場合、配偶者・子は「家族滞在」ではなく「${statusBasedSponsor.targetStatus_ja}」で申請します。`
        : isSponsorAllowed
          ? '就労ビザ（技術・人文知識・国際業務等）や高度専門職は家族の帯同が認められています。'
          : '選択された扶養者の在留資格では「家族滞在」の対象か確認できません。出入国在留管理庁の公式情報で確認してください。',
    guidance_vn: isSponsorBarred
      ? 'Visa Kỹ năng đặc định số 1 (特定技能1号) và Thực tập sinh (技能実習) BỊ CẤM BẢO LÃNH GIA ĐÌNH theo luật. Muốn bảo lãnh bạn phải nâng cấp lên 特定技能2号 hoặc visa 技人国.'
      : statusBasedSponsor
        ? `Người bảo lãnh là người Nhật/người Vĩnh trú: vợ/chồng và con KHÔNG xin 家族滞在 mà xin tư cách "${statusBasedSponsor.targetStatus_vn}".`
        : isSponsorAllowed
          ? 'Các tư cách lao động chuyên môn (Kỹ thuật/Nhân văn/Quốc tế, Quản lý, v.v.) được quyền bảo lãnh gia đình.'
          : 'Không xác định được tư cách của người bảo lãnh có thuộc diện bảo lãnh 家族滞在 hay không. Hãy kiểm tra thông tin chính thức của Cục XNC.',
    guidance_en: isSponsorBarred
      ? 'Specified Skilled Worker (i) and Technical Interns are legally prohibited from bringing dependents (requires transition to SSW ii).'
      : statusBasedSponsor
        ? `When the sponsor is a Japanese national or Permanent Resident, the spouse/child applies for "${statusBasedSponsor.targetStatus_en}", not Dependent.`
        : isSponsorAllowed
          ? 'Professional work statuses (Engineer/Specialist, Manager, etc.) are entitled to sponsor dependents.'
          : 'Could not confirm that this sponsor status can sponsor Dependent status. Please check official ISA information.'
  });

  if (!isSponsorBarred && !sponsorEligible && readinessStatus === 'ready') {
    readinessStatus = 'missing_requirements';
  }

  if (isSponsorBarred) {
    readinessStatus = 'ineligible';
    warnings.push({
      code: 'SPONSOR_STATUS_BARRED',
      severity: 'danger',
      title_ja: '特定技能1号・技能実習生は家族の帯同が認められていません',
      title_vn: 'Tư cách Kỹ năng đặc định số 1 & Thực tập sinh KHÔNG ĐƯỢC PHÉP bảo lãnh gia đình',
      title_en: 'SSW (i) and Technical Interns are barred from bringing family members',
      message_ja: '入管法及び特定技能運用要領に基づき、特定技能1号及び技能実習では配偶者・子の「家族滞在」は不可です。特定技能2号に合格・変更するか、技人国等の就労ビザを取得する必要があります。',
      message_vn: 'Theo quy định của Cục Nhập cảnh, người giữ visa Kỹ năng đặc định số 1 (SSW 1) và Thực tập sinh không được phép đưa vợ chồng con cái sang cư trú dài hạn. Cần thi đỗ kỳ thi Kỹ năng đặc định số 2 (SSW 2) hoặc chuyển sang visa kỹ sư để được mở quyền bảo lãnh.',
      message_en: 'Under immigration regulations, SSW 1 and Intern holders cannot sponsor dependents under Kazoku Taizai. They must pass tests to transition to SSW 2 or professional work visas.'
    });
  }

  if (statusBasedSponsor) {
    warnings.push({
      code: 'USE_STATUS_BASED_VISA_NOT_DEPENDENT',
      severity: 'warning',
      title_ja: `日本人・永住者の家族は「家族滞在」ではなく「${statusBasedSponsor.targetStatus_ja}」です`,
      title_vn: `Gia đình người Nhật / người Vĩnh trú không xin 家族滞在 — cần xin "${statusBasedSponsor.targetStatus_vn}"`,
      title_en: `Family of Japanese/PR: apply for "${statusBasedSponsor.targetStatus_en}", not Dependent`,
      message_ja: '「家族滞在」は就労系等の在留資格を持つ外国人の扶養家族のための在留資格です。日本人・永住者の配偶者や子は身分系在留資格の要件（婚姻の実態、身元保証、生計等）で審査されます。',
      message_vn: 'Tư cách 家族滞在 chỉ dành cho người phụ thuộc của người nước ngoài có visa lao động/du học... Vợ/chồng, con của người Nhật hoặc người Vĩnh trú được xét theo tư cách thân phận (điều kiện: hôn nhân thực tế, người bảo lãnh, khả năng kinh tế…). Hãy dùng công cụ Hướng dẫn đổi tư cách lưu trú để xem điều kiện.',
      message_en: 'Dependent status is for family of foreign nationals holding work/study statuses. Spouses/children of Japanese nationals or PRs are examined under status-based categories (genuine marriage, guarantor, livelihood).'
    });
  }

  // 3. Đánh giá Năng lực Tài chính của Người bảo lãnh (Financial Capacity)
  const count = Math.max(1, Number(dependentCount) || 1);
  const benchmarkIncome = SPONSOR_FINANCIAL_BENCHMARKS.BASE_ANNUAL_INCOME_ONE_DEPENDENT +
    (count - 1) * SPONSOR_FINANCIAL_BENCHMARKS.ADDITIONAL_PER_DEPENDENT;

  const hasSufficientIncome = sponsorAnnualIncome >= benchmarkIncome;

  prerequisites.push({
    id: 'sponsor_income_benchmark',
    title_ja: `扶養能力の立証（実務上の目安年収: ${benchmarkIncome.toLocaleString()}円程度・公表基準ではありません）`,
    title_vn: `Năng lực chu cấp kinh tế (mốc ước tính thực tế: ${benchmarkIncome.toLocaleString()} JPY/năm — không phải tiêu chuẩn chính thức)`,
    title_en: `Demonstrated financial support capacity (practitioner estimate: ${benchmarkIncome.toLocaleString()} JPY/yr, not an official standard)`,
    met: hasSufficientIncome,
    required: true,
    guidance_ja: `扶養者1人につき約250万円＋追加1人ごとに約60万円という数値は実務家による経験則（目安）であり、出入国在留管理庁が公表した基準ではありません。実際には直近の住民税課税・納税証明書等で世帯の生計維持能力が総合的に審査されます。`,
    guidance_vn: `Mốc khoảng 2.500.000 JPY cho 1 người phụ thuộc + khoảng 600.000 JPY cho mỗi người tiếp theo chỉ là ƯỚC TÍNH THEO KINH NGHIỆM của các văn phòng hành chính (gyoseishoshi), KHÔNG phải tiêu chuẩn công bố của Cục XNC. Cục xét tổng thể khả năng nuôi gia đình dựa trên Giấy chứng nhận thuế cư trú (課税・納税証明書) và các giấy tờ khác.`,
    guidance_en: `The ~2.5M JPY for 1 dependent plus ~600k JPY per additional dependent figure is a practitioner rule of thumb, not a published ISA standard. ISA assesses household livelihood holistically using municipal tax certificates and other evidence.`
  });

  if (!hasSufficientIncome && readinessStatus === 'ready') {
    readinessStatus = 'missing_requirements';
    warnings.push({
      code: 'LOW_SPONSOR_INCOME',
      severity: 'warning',
      title_ja: '扶養能力に関する審査リスク（推奨目安年収を下回っています）',
      title_vn: 'Thu nhập của người bảo lãnh thấp hơn mốc ước tính thực tế',
      title_en: 'Sponsor income is below the recommended immigration benchmark',
      message_ja: `現在の申告年収（${sponsorAnnualIncome.toLocaleString()}円）は扶養対象${count}名の目安（${benchmarkIncome.toLocaleString()}円）を下回っています。預金残高証明書等の追加疎明資料を提出しない場合、生計維持困難として不許可となるリスクがあります。`,
      message_vn: `Mức thu nhập ${sponsorAnnualIncome.toLocaleString()} JPY hiện tại thấp hơn ngưỡng khuyến nghị cho ${count} người phụ thuộc (${benchmarkIncome.toLocaleString()} JPY). Cần nộp bổ sung Giấy xác nhận số dư tài khoản tiết kiệm ngân hàng để hỗ trợ hồ sơ.`,
      message_en: `Reported annual income (${sponsorAnnualIncome.toLocaleString()} JPY) is below the benchmark for ${count} dependents (${benchmarkIncome.toLocaleString()} JPY). Bank balance certificates should be submitted as supplementary evidence.`
    });
  }

  // Tuân thủ thuế và an sinh xã hội
  prerequisites.push({
    id: 'tax_compliance',
    title_ja: '公租公課（住民税）の適正な申告および納税義務の履行',
    title_vn: 'Thực hiện đầy đủ nghĩa vụ khai báo và nộp thuế cư trú, không nợ đọng',
    title_en: 'Timely filing and complete payment of local inhabitant tax',
    met: Boolean(sponsorTaxCompliant),
    required: true,
    guidance_ja: '直近年度の住民税に未納や滞納がある場合、生活維持能力および素行善良要件に欠けると判断され不許可となる可能性が極めて高くなります。',
    guidance_vn: 'Bất kỳ khoản nợ đọng thuế cư trú nào cũng sẽ bị Cục Nhập cảnh đánh trượt hồ sơ ngay lập tức. Phải hoàn thành 100% việc nộp thuế trước khi nộp đơn.',
    guidance_en: 'Any delinquency or late payment in local resident tax will almost certainly cause refusal. All arrears must be cleared before applying.'
  });

  if (!sponsorTaxCompliant) {
    readinessStatus = 'missing_requirements';
    warnings.push({
      code: 'TAX_ARREARS_DETECTED',
      severity: 'danger',
      title_ja: '住民税の未納・滞納がある場合は申請前に完納が必要です',
      title_vn: 'Cảnh báo nợ thuế cư trú: Phải nộp đủ trước khi nộp hồ sơ bảo lãnh',
      title_en: 'Unpaid local resident taxes: Must be fully settled prior to application',
      message_ja: '未納分がある場合は速やかに区役所・市役所で完納し、領収証書または未納額がない納税証明書を取得してください。',
      message_vn: 'Nếu đang nợ thuế cư trú, bạn cần đến ngay UBND quận/thành phố nộp hết và xin Giấy xác nhận không còn nợ thuế trước khi nộp vào Cục Xuất nhập cảnh.',
      message_en: 'Settle all outstanding tax liabilities at your municipality immediately and obtain clean certificates of tax payment.'
    });
  }

  // 4. Phân luồng Thủ tục (Procedure Routing)
  let procedureInfo = FAMILY_APPLICATION_PROCEDURES.COE;
  let feeSchedule = { amount: 0, currency: 'JPY', paymentMethod: 'なし（手数料無料）' };
  let newbornDeadlines = null;

  if (currentLocation === 'newborn_in_japan') {
    procedureInfo = FAMILY_APPLICATION_PROCEDURES.CHILD_BORN_IN_JAPAN;
    feeSchedule = { amount: 0, currency: 'JPY', paymentMethod: 'なし（無料）' };

    const birth = parseLocalDate(childBirthDate);
    if (birth) {
      // 入管法第22条の2: 出生の日から60日を超えて在留しようとする場合、出生の日から30日以内に在留資格取得許可申請
      const filingDeadline = addDaysLocal(birth, 30);
      const maxStayLimit = addDaysLocal(birth, 60);
      const today = resolveCurrentDate(currentDate);
      const daysToFiling = diffCalendarDays(today, filingDeadline);
      const daysToMaxStay = diffCalendarDays(today, maxStayLimit);

      newbornDeadlines = {
        childBirthDate: formatLocalDate(birth),
        filingDeadline30Days: formatLocalDate(filingDeadline),
        maxStayLimit60Days: formatLocalDate(maxStayLimit),
        daysRemainingToFile: daysToFiling,
        statutoryBasis: '出入国管理及び難民認定法第22条の2'
      };

      if (daysToMaxStay < 0) {
        warnings.push({
          code: 'NEWBORN_OVER_60_DAYS',
          severity: 'danger',
          title_ja: '出生後60日を超過しています（不法滞在リスク）',
          title_vn: 'Đã quá 60 ngày kể từ ngày sinh của trẻ: Nguy cơ vi phạm cư trú bất hợp pháp',
          title_en: 'Over 60 days since birth: High risk of unlawful residence',
          message_ja: '入管法第22条の2の期間（60日）を経過しています。速やかに入管に出頭し手続を行ってください。',
          message_vn: 'Trẻ đã ở quá thời hạn 60 ngày sau sinh mà chưa có tư cách lưu trú. Cần đến ngay Cục Nhập cảnh trình báo và làm thủ tục.',
          message_en: 'The 60-day period under Art. 22-2 has lapsed. Report to immigration authorities immediately.'
        });
      } else if (daysToFiling < 0) {
        warnings.push({
          code: 'NEWBORN_FILING_DEADLINE_PASSED',
          severity: 'danger',
          title_ja: '出生後30日の申請期限を過ぎています',
          title_vn: 'Đã quá hạn 30 ngày kể từ ngày sinh để nộp đơn xin tư cách lưu trú cho trẻ',
          title_en: 'The 30-day filing deadline after birth has passed',
          message_ja: `在留資格取得許可申請は出生の日から30日以内（${formatLocalDate(filingDeadline)}まで）に行う必要がありました。60日（${formatLocalDate(maxStayLimit)}）を超えて在留する予定であれば、直ちに入管へ申請・相談してください。`,
          message_vn: `Đơn xin cấp tư cách lưu trú cho trẻ phải nộp trong vòng 30 ngày kể từ ngày sinh (hạn: ${formatLocalDate(filingDeadline)}). Nếu trẻ sẽ ở Nhật quá 60 ngày (sau ${formatLocalDate(maxStayLimit)}), hãy đến Cục XNC nộp đơn và giải trình NGAY.`,
          message_en: `The acquisition application was due within 30 days of birth (${formatLocalDate(filingDeadline)}). If the child will stay beyond 60 days (${formatLocalDate(maxStayLimit)}), apply and consult ISA immediately.`
        });
      } else if (daysToFiling <= 7) {
        warnings.push({
          code: 'NEWBORN_FILING_DEADLINE_APPROACHING',
          severity: 'warning',
          title_ja: `在留資格取得許可申請の期限まであと${daysToFiling}日です`,
          title_vn: `Chỉ còn ${daysToFiling} ngày để nộp đơn xin tư cách lưu trú cho trẻ`,
          title_en: `${daysToFiling} day(s) left to file the newborn status acquisition`,
          message_ja: `期限：${formatLocalDate(filingDeadline)}（出生の日から30日以内）。`,
          message_vn: `Hạn chót: ${formatLocalDate(filingDeadline)} (trong vòng 30 ngày kể từ ngày sinh).`,
          message_en: `Deadline: ${formatLocalDate(filingDeadline)} (within 30 days of birth).`
        });
      }
    }
  } else if (currentLocation === 'in_japan') {
    procedureInfo = FAMILY_APPLICATION_PROCEDURES.STATUS_CHANGE;
    const changeFee = getStatusChangeFeeSchedule(applicationDate, { method: filingMethod, expectedPeriod });
    feeSchedule = {
      ...changeFee,
      amount: changeFee.amount,
      currency: 'JPY',
      paymentMethod: changeFee.paymentMethod_ja,
      statutoryBasis: changeFee.statutoryBasis
    };
  }

  // 5. Tư vấn Giấy phép làm thêm (Part-Time Work Advisory)
  const workAdvisory = {
    intendsToWorkPartTime: Boolean(intendsToWorkPartTime),
    permitName: DEPENDENT_WORK_PERMIT_RULES.PERMIT_NAME,
    weeklyHourLimit: DEPENDENT_WORK_PERMIT_RULES.WEEKLY_HOUR_LIMIT,
    taxDependencyCeiling: DEPENDENT_WORK_PERMIT_RULES.TAX_DEPENDENCY_CEILING,
    prohibitedIndustries: DEPENDENT_WORK_PERMIT_RULES.PROHIBITED_INDUSTRIES,
    guidance_ja: '「家族滞在」ビザの所持者は、資格外活動許可（包括許可・無料）を取得することで週28時間以内のアルバイトが適法に行えます。風俗営業店での勤務は法律で厳禁されています。年収が130万円を超えると扶養から外れ、健康保険料の自己負担が発生するとともに、ビザ更新時に「独立生計能力がある」として家族滞在の該当性が問われるリスクがあります。',
    guidance_vn: 'Người giữ visa 家族滞在 được phép làm thêm tối đa 28 giờ/tuần sau khi xin Giấy phép hoạt động ngoài tư cách (miễn phí). TUYỆT ĐỐI CẤM làm việc tại các cơ sở giải trí đặc biệt (quán bar, pachinko, v.v.). Nếu thu nhập hàng năm vượt quá 1,3 triệu JPY, người thân sẽ bị cắt khỏi diện phụ thuộc BHYT và có nguy cơ bị từ chối gia hạn visa do không còn tính chất phụ thuộc kinh tế.',
    guidance_en: 'Dependent status holders may work up to 28 hours/week upon obtaining a free Permit for Activities Outside Status. Adult entertainment industries are strictly forbidden. Exceeding 1.3M JPY annual income causes loss of health insurance dependent coverage and creates renewal denial risks.'
  };

  // 6. Danh mục Hồ sơ Tài liệu Chuẩn (Document Checklist)
  const documents = [];
  if (relationshipType === 'spouse') {
    documents.push(
      '在留資格認定証明書交付申請書（または変更許可申請書）',
      '婚姻関係を証明する文書（本国の結婚証明書、日本の戸籍謄本など）',
      '扶養者（スポンサー）の在職証明書（勤務先発行）',
      '扶養者の直近年度の住民税課税（非課税）証明書及び納税証明書',
      '世帯全員が記載された住民票の写し（日本在住時）',
      '扶養者のパスポートおよび在留カードのコピー'
    );
  } else if (relationshipType === 'child') {
    documents.push(
      '在留資格認定証明書交付申請書（または取得許可申請書）',
      '親子関係を証明する公的文書（本国の出生証明書、認知証明書など）',
      '扶養者の在職証明書',
      '扶養者の住民税課税証明書および納税証明書',
      '世帯全員記載の住民票',
      '扶養者のパスポートおよび在留カードのコピー'
    );
  }

  // 7. Nhắc nhở Thẩm quyền Tự do Hành chính (McLean Precedent Safeguard)
  warnings.push({
    code: 'MINISTERIAL_DISCRETION',
    severity: 'info',
    title_ja: '法務大臣の広範な裁量権（マクリーン判決準拠）',
    title_vn: 'Bảo lưu thẩm quyền thẩm định của Cục Quản lý Xuất nhập cảnh',
    title_en: 'Immigration Discretionary Power (McLean Precedent)',
    message_ja: '家族滞在ビザの交付は法務大臣の裁量処分であり、必要書類を提出したことのみをもって許可が法的に確約されるものではありません。',
    message_vn: 'Việc cấp visa 家族滞在 thuộc thẩm quyền tự do xem xét của Bộ Tư pháp. Đáp ứng đủ giấy tờ hình thức không phải là cam kết chắc chắn 100% được cấp phép.',
    message_en: 'Granting of Dependent status is a discretionary administrative action. Satisfying standard documentary criteria does not constitute guaranteed visa issuance.'
  });

  return {
    sponsorStatusId,
    relationshipType,
    readinessStatus,
    prerequisites,
    warnings,
    procedureInfo,
    feeSchedule,
    newbornDeadlines,
    workAdvisory,
    documents,
    financialAnalysis: {
      sponsorAnnualIncome,
      dependentCount: count,
      benchmarkIncome,
      isSufficient: hasSufficientIncome
    }
  };
}
