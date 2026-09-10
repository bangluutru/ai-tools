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
 * @returns {Object} Kết quả đánh giá pháp lý và danh mục hướng dẫn
 */
export function evaluateFamilyImmigration(input = {}) {
  const {
    sponsorStatusId = 'engineer_specialist',
    relationshipType = 'spouse',
    sponsorAnnualIncome = 3500000,
    dependentCount = 1,
    sponsorTaxCompliant = true,
    sponsorPensionCompliant = true,
    currentLocation = 'overseas',
    applicationDate = new Date().toISOString().slice(0, 10),
    childBirthDate = null,
    intendsToWorkPartTime = false
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

  prerequisites.push({
    id: 'sponsor_status_eligibility',
    title_ja: '扶養者（スポンサー）の在留資格適格性',
    title_vn: 'Tư cách lưu trú của người bảo lãnh cho phép đưa gia đình sang',
    title_en: 'Sponsor residence status eligibility to bring dependents',
    met: !isSponsorBarred && isSponsorAllowed,
    required: true,
    guidance_ja: isSponsorBarred
      ? '特定技能1号および技能実習は法令上、家族の帯同が認められていません（特定技能2号への移行等が必要です）。'
      : '就労ビザ（技術・人文知識・国際業務等）や高度専門職は家族の帯同が認められています。',
    guidance_vn: isSponsorBarred
      ? 'Visa Kỹ năng đặc định số 1 (特定技能1号) và Thực tập sinh (技能実習) BỊ CẤM BẢO LÃNH GIA ĐÌNH theo luật. Muốn bảo lãnh bạn phải nâng cấp lên 特定技能2号 hoặc visa 技人国.'
      : 'Các tư cách lao động chuyên môn (Kỹ thuật/Nhân văn/Quốc tế, Quản lý, v.v.) được quyền bảo lãnh gia đình.',
    guidance_en: isSponsorBarred
      ? 'Specified Skilled Worker (i) and Technical Interns are legally prohibited from bringing dependents (requires transition to SSW ii).'
      : 'Professional work statuses (Engineer/Specialist, Manager, etc.) are entitled to sponsor dependents.'
  });

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

  // 3. Đánh giá Năng lực Tài chính của Người bảo lãnh (Financial Capacity)
  const count = Math.max(1, Number(dependentCount) || 1);
  const benchmarkIncome = SPONSOR_FINANCIAL_BENCHMARKS.BASE_ANNUAL_INCOME_ONE_DEPENDENT +
    (count - 1) * SPONSOR_FINANCIAL_BENCHMARKS.ADDITIONAL_PER_DEPENDENT;

  const hasSufficientIncome = sponsorAnnualIncome >= benchmarkIncome;

  prerequisites.push({
    id: 'sponsor_income_benchmark',
    title_ja: `扶養能力の立証（目安年収: ${benchmarkIncome.toLocaleString()}円程度以上）`,
    title_vn: `Năng lực chu cấp kinh tế độc lập (Mức thu nhập khuyến nghị từ: ${benchmarkIncome.toLocaleString()} JPY/năm)`,
    title_en: `Demonstrated financial support capacity (Income benchmark: ${benchmarkIncome.toLocaleString()} JPY/yr)`,
    met: hasSufficientIncome,
    required: true,
    guidance_ja: `扶養者1人につき約250万円、追加扶養1人ごとに約60万円が生活維持能力の審査目安となります。直近の住民税課税・納税証明書で審査されます。`,
    guidance_vn: `Mức ước tính chuẩn của Cục Nhập cảnh là khoảng 2.500.000 JPY cho 1 người phụ thuộc, thêm khoảng 600.000 JPY cho mỗi người tiếp theo. Căn cứ trên Giấy chứng nhận thuế cư trú (課税証明書).`,
    guidance_en: `Standard immigration benchmark is approx. 2.5M JPY for 1 dependent plus 600k JPY per additional dependent, verified via municipal tax certificates.`
  });

  if (!hasSufficientIncome && readinessStatus === 'ready') {
    readinessStatus = 'missing_requirements';
    warnings.push({
      code: 'LOW_SPONSOR_INCOME',
      severity: 'warning',
      title_ja: '扶養能力に関する審査リスク（推奨目安年収を下回っています）',
      title_vn: 'Thu nhập của người bảo lãnh thấp hơn ngưỡng tiêu chuẩn khuyến nghị',
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

    if (childBirthDate) {
      const birth = new Date(childBirthDate);
      const filingDeadline = new Date(birth);
      filingDeadline.setDate(filingDeadline.getDate() + 30);

      const maxStayLimit = new Date(birth);
      maxStayLimit.setDate(maxStayLimit.getDate() + 60);

      newbornDeadlines = {
        childBirthDate,
        filingDeadline30Days: filingDeadline.toISOString().slice(0, 10),
        maxStayLimit60Days: maxStayLimit.toISOString().slice(0, 10),
        statutoryBasis: '出入国管理及び難民認定法第22条の2'
      };

      const today = new Date();
      if (today > maxStayLimit) {
        warnings.push({
          code: 'NEWBORN_OVER_60_DAYS',
          severity: 'danger',
          title_ja: '出生後60日を超過しています（不法滞在リスク）',
          title_vn: 'Đã quá 60 ngày kể từ ngày sinh của trẻ: Nguy cơ vi phạm cư trú bất hợp pháp',
          title_en: 'Over 60 days since birth: High risk of unlawful residence',
          message_ja: '入管法第22条の2の特例期間（60日）を経過しています。速やかに入管に出頭し手続を行ってください。',
          message_vn: 'Trẻ đã ở quá thời hạn 60 ngày miễn thị thực sau sinh. Cần đến ngay Cục Nhập cảnh trình báo và làm thủ tục cấp phép cư trú.',
          message_en: 'The 60-day exemption period under Art. 22-2 has lapsed. Report to immigration authorities immediately.'
        });
      }
    }
  } else if (currentLocation === 'in_japan') {
    procedureInfo = FAMILY_APPLICATION_PROCEDURES.STATUS_CHANGE;
    const changeFee = getStatusChangeFeeSchedule(applicationDate);
    feeSchedule = {
      amount: changeFee.amount,
      currency: 'JPY',
      paymentMethod: '収入印紙 (Revenue Stamp)',
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
