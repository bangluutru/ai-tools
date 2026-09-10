/**
 * @file packages/core/src/japan/immigration/workScope/workScopeEngine.js
 * @description
 * Động cơ Đánh giá Phạm vi Hoạt động & Làm việc (Work Scope Engine).
 * Khớp nối giữa tư cách lưu trú hiện tại và hoạt động dự kiến theo Bảng quy chuẩn của ISA.
 * 
 * Tuân thủ nghiêm ngặt Chính sách An toàn & Thẩm quyền Hành chính (Discretion Safety Policy):
 * - Tuyệt đối không đưa ra kết luận pháp lý chắc chắn 100% ("được phép hoàn toàn", "hợp pháp 100%").
 * - Luôn sử dụng thang phân loại khách quan: 'generally-within-scope', 'potentially-outside-scope',
 *   'requires-extra-permission', 'depends-on-details', 'needs-confirmation'.
 */

import { getStatusDefinition } from '../status/statusCatalog.js';
import { ACTIVITY_CATEGORIES, EXTRA_ACTIVITY_LIMITS } from './workScopeRules.js';

/**
 * @typedef {'generally-within-scope'
 *   | 'potentially-outside-scope'
 *   | 'requires-extra-permission'
 *   | 'depends-on-details'
 *   | 'needs-confirmation'} WorkScopeEvaluationTier
 *
 * @typedef {Object} WorkScopeInput
 * @property {string} residenceStatus - Canonical residence status ID
 * @property {string} activityCategory - ID nhóm hoạt động dự kiến
 * @property {string} [jobDescription] - Mô tả công việc cụ thể
 * @property {string} [employmentType='full-time'] - Hình thức làm việc
 * @property {boolean} [hasExtraActivityPermission=false] - Đã có 資格外活動許可
 * @property {number} [weeklyHours=0] - Số giờ làm việc dự kiến / tuần
 * @property {boolean} [isSchoolVacation=false] - Đang trong kỳ nghỉ dài chính thức của trường (dành cho du học sinh)
 * @property {string} [designatedActivityDetails] - Chi tiết giấy chỉ định (dành cho 特定活動)
 *
 * @typedef {Object} WorkScopeResult
 * @property {WorkScopeEvaluationTier} evaluationTier - Phân tầng đánh giá
 * @property {string} badgeType - 'success' | 'warning' | 'error' | 'info'
 * @property {string} summaryJa
 * @property {string} summaryVi
 * @property {string} summaryEn
 * @property {string[]} detailsJa
 * @property {string[]} detailsVi
 * @property {string[]} detailsEn
 * @property {Array<{ id: string, severity: 'critical' | 'warning' | 'info', textJa: string, textVi: string, textEn: string }>} warnings
 * @property {string[]} legalCitations
 * @property {Array<{ stepOrder: number, actionJa: string, actionVi: string, actionEn: string }>} nextActions
 * @property {string} legalDisclaimerJa
 * @property {string} legalDisclaimerVi
 * @property {string} legalDisclaimerEn
 */

const STANDARD_DISCLAIMER_JA = '本結果は出入国在留管理庁の公表基準に基づく一般的な情報提供であり、就労の適法性や許可を保証するものではありません。個別の雇用契約や業務内容の適合性については、出入国在留管理局窓口または弁護士・行政書士等の専門家へご相談ください。';
const STANDARD_DISCLAIMER_VI = 'Kết quả đối chiếu dựa trên quy chuẩn công bố của Cục Quản lý Xuất nhập cảnh (ISA) và không cấu thành sự bảo đảm pháp lý. Tính hợp lệ thực tế phụ thuộc vào nội dung hợp đồng lao động và xét duyệt của cơ quan quản lý. Vui lòng liên hệ ISA hoặc chuyên gia để được tư vấn chính xác.';
const STANDARD_DISCLAIMER_EN = 'This assessment provides general guidance based on published ISA criteria and does not constitute a legal guarantee. Actual legality depends on specific contract terms and immigration authority review. Please consult with an immigration bureau or certified specialist.';

/**
 * Đánh giá phạm vi làm việc của tư cách lưu trú
 * @param {WorkScopeInput} input
 * @returns {WorkScopeResult}
 */
export function evaluateWorkScope(input = {}) {
  const statusId = (input.residenceStatus || '').trim();
  const activityCatId = (input.activityCategory || '').trim();
  const hasExtraPerm = Boolean(input.hasExtraActivityPermission);
  const weeklyHours = typeof input.weeklyHours === 'number' && !isNaN(input.weeklyHours) ? input.weeklyHours : 0;
  const isSchoolVacation = Boolean(input.isSchoolVacation);
  const designatedDetails = (input.designatedActivityDetails || '').trim();
  const employmentType = input.employmentType || 'full-time';

  const statusDef = getStatusDefinition(statusId);
  const activityDef = ACTIVITY_CATEGORIES[activityCatId] || ACTIVITY_CATEGORIES.other_activity;

  // 0. Trường hợp dữ liệu đầu vào không đủ để xác định
  if (!statusDef) {
    return {
      evaluationTier: 'needs-confirmation',
      badgeType: 'warning',
      summaryJa: '在留資格が特定されていないか、未選択です。',
      summaryVi: 'Chưa chọn hoặc không xác định được tư cách lưu trú.',
      summaryEn: 'Residence status is not specified or unrecognized.',
      detailsJa: ['正確な就労範囲を確認するため、お持ちの在留カードに記載された在留資格を選択してください。'],
      detailsVi: ['Vui lòng chọn đúng tư cách lưu trú ghi trên thẻ ngoại kiều để đối chiếu phạm vi làm việc.'],
      detailsEn: ['Please specify the exact residence status as stated on your Residence Card.'],
      warnings: [],
      legalCitations: ['isa-ica-annexed-table-1'],
      nextActions: [
        {
          stepOrder: 1,
          actionJa: '在留カード表面の「在留資格」欄を確認する',
          actionVi: 'Kiểm tra mục "Tư cách lưu trú" (在留資格) trên mặt trước thẻ ngoại kiều',
          actionEn: 'Check the "Status of Residence" section on the front of your Residence Card',
        }
      ],
      legalDisclaimerJa: STANDARD_DISCLAIMER_JA,
      legalDisclaimerVi: STANDARD_DISCLAIMER_VI,
      legalDisclaimerEn: STANDARD_DISCLAIMER_EN,
    };
  }

  // 1. NHÓM BIỂU 2 - THÂN PHẬN (永住者, 日本人の配偶者等, 永住者の配偶者等, 定住者)
  // Không có giới hạn hoạt động nghề nghiệp theo luật
  if (statusDef.category === 'table-2-status') {
    const isAdult = activityDef.isAdultEntertainment;
    const warnings = [];

    if (isAdult) {
      warnings.push({
        id: 'table2_adult_entertainment_note',
        severity: 'info',
        textJa: '身分系の在留資格は就労職種制限がありませんが、風俗営業での従事は風営適正化法上の店舗許認可基準や年齢確認法令を遵守している必要があります。',
        textVi: 'Tư cách thân phận không hạn chế việc làm, nhưng nếu làm việc tại cơ sở kinh doanh phong tục cần tuân thủ đầy đủ Luật Phong tục (giấy phép của quán, độ tuổi, v.v.).',
        textEn: 'Status-based residents have no immigration work limits, but employment in adult businesses must strictly adhere to the Adult Entertainment Law and licensing rules.'
      });
    }

    return {
      evaluationTier: 'generally-within-scope',
      badgeType: 'success',
      summaryJa: `「${statusDef.nameJa}」は就労活動の制限がなく、原則としてあらゆる合法的業務に従事可能です。`,
      summaryVi: `Tư cách "${statusDef.nameVi}" không bị giới hạn ngành nghề làm việc, về nguyên tắc được tự do làm mọi công việc hợp pháp.`,
      summaryEn: `Status "${statusDef.nameEn}" has no statutory employment restrictions and permits virtually any lawful occupation.`,
      detailsJa: [
        `入管法別表第二（身分・地位に基づく在留資格）に該当するため、正社員、契約社員、派遣、パート・アルバイト、自営業・会社経営、単純労働等、あらゆる形態で就労できます。`,
        `資格外活動許可の取得は不要です。就労時間の週28時間制限もありません。`
      ],
      detailsVi: [
        `Do thuộc Biểu 2 của Luật Nhập quản (tư cách dựa trên thân phận), bạn có thể làm việc dưới mọi hình thức: nhân viên chính thức, hợp đồng, phái cử, làm thêm, lao động phổ thông hoặc mở công ty riêng.`,
        `Không cần xin Giấy phép hoạt động ngoài tư cách (資格外活動許可). Không bị giới hạn 28 giờ/tuần.`
      ],
      detailsEn: [
        `Because this falls under Annexed Table 2 of the Immigration Control Act, work is permitted in full-time, contract, part-time, manual labor, or independent business roles.`,
        `No Permission to Engage in Activity other than that Permitted (資格外活動許可) is required. There is no 28-hour weekly limit.`
      ],
      warnings,
      legalCitations: ['isa-ica-annexed-table-2'],
      nextActions: [
        {
          stepOrder: 1,
          actionJa: '勤務先との雇用契約や労働基準法上の労働条件通知書を確認する',
          actionVi: 'Kiểm tra hợp đồng lao động và điều kiện làm việc theo Luật Tiêu chuẩn Lao động Nhật',
          actionEn: 'Review your employment contract and working conditions under the Labor Standards Act',
        }
      ],
      legalDisclaimerJa: STANDARD_DISCLAIMER_JA,
      legalDisclaimerVi: STANDARD_DISCLAIMER_VI,
      legalDisclaimerEn: STANDARD_DISCLAIMER_EN,
    };
  }

  // 2. NHÓM HOẠT ĐỘNG CHỈ ĐỊNH (特定活動 - Designated Activities)
  // Bắt buộc phụ thuộc vào Giấy chỉ định (指定書)
  if (statusDef.id === 'designated-activities') {
    return {
      evaluationTier: 'depends-on-details',
      badgeType: 'info',
      summaryJa: '「特定活動」の就労範囲は、パスポートに貼付された「指定書」の個別記載内容により定まります。',
      summaryVi: 'Phạm vi làm việc của "Hoạt động chỉ định" phụ thuộc hoàn toàn vào nội dung in trên "Giấy chỉ định" (指定書) dán trong hộ chiếu.',
      summaryEn: 'Work permissions for "Designated Activities" depend strictly on individual terms written on the Designation Certificate in your passport.',
      detailsJa: [
        '「特定活動」はワーキングホリデー、本邦大学卒業者の就職活動、インターンシップ、EPA看護・介護、特定研究活動など多岐にわたります。',
        '在留資格の名称だけでは就労の可否を判定できません。パスポートの指定書に記載された「指定された活動」の文言を確認してください。',
        designatedDetails ? `入力された指定内容: ${designatedDetails}` : '指定書の内容が未入力です。'
      ],
      detailsVi: [
        'Tư cách "特定活動" bao gồm nhiều loại hình rất khác nhau: Working Holiday, tốt nghiệp đại học Nhật tìm việc, thực tập quốc tế, điều dưỡng EPA, Digital Nomad...',
        'Không thể đánh giá dựa trên tên visa chung. Bạn bắt buộc phải mở hộ chiếu xem tờ "Giấy chỉ định" (指定書) dán kèm để xem có dòng chữ cho phép làm việc hay không.',
        designatedDetails ? `Thông tin bạn đã nhập: ${designatedDetails}` : 'Chưa có thông tin cụ thể từ Giấy chỉ định.'
      ],
      detailsEn: [
        'Designated Activities encompasses diverse pathways: Working Holiday, graduate job hunting, internships, EPA medical staff, digital nomads, etc.',
        'Legality cannot be judged by status title alone. You must check the specific text on the Designation Certificate (指定書) affixed to your passport.',
        designatedDetails ? `Provided details: ${designatedDetails}` : 'Designation Certificate text was not provided.'
      ],
      warnings: [
        {
          id: 'designated_activities_shiteisho_required',
          severity: 'warning',
          textJa: '指定書に「報酬を受ける活動を除く」と記載されている場合は、就労できません。就労可能な場合でも職種や勤務先が限定されていることがあります。',
          textVi: 'Nếu Giấy chỉ định ghi "loại trừ hoạt động nhận thù lao" (報酬を受ける活動を除く) thì tuyệt đối không được đi làm. Nếu được làm thì có thể bị giới hạn nơi làm việc cụ thể.',
          textEn: 'If your certificate states "excluding activities for remuneration", work is strictly forbidden. Permitted work may also be tied to a specific employer.'
        }
      ],
      legalCitations: ['isa-ica-annexed-table-1'],
      nextActions: [
        {
          stepOrder: 1,
          actionJa: 'パスポートに貼付された「指定書（指定された活動）」の全文を確認する',
          actionVi: 'Mở hộ chiếu đọc toàn văn Giấy chỉ định (指定書) dán cùng visa',
          actionEn: 'Inspect the full text on the Designation Certificate (指定書) in your passport',
        },
        {
          stepOrder: 2,
          actionJa: '疑義がある場合は管轄の出入国在留管理局窓口またはFRESCへ相談する',
          actionVi: 'Nếu chưa rõ ràng, liên hệ Cục Quản lý Xuất nhập cảnh hoặc Trung tâm FRESC',
          actionEn: 'Consult your regional immigration bureau counter or FRESC if uncertain',
        }
      ],
      legalDisclaimerJa: STANDARD_DISCLAIMER_JA,
      legalDisclaimerVi: STANDARD_DISCLAIMER_VI,
      legalDisclaimerEn: STANDARD_DISCLAIMER_EN,
    };
  }

  // 2.5 Lưu trú ngắn hạn (短期滞在) - Tuyệt đối không được phép làm việc và không được cấp 資格外活動許可
  if (statusDef.id === 'temporary-visitor') {
    return {
      evaluationTier: 'potentially-outside-scope',
      badgeType: 'error',
      summaryJa: '「短期滞在」での就労活動は、いかなる形態であっても法律上禁止されています。',
      summaryVi: 'Làm việc dưới tư cách "Lưu trú ngắn hạn" (Du lịch/Thăm thân) bị LUẬT PHÁP NGHIÊM CẤM dưới mọi hình thức.',
      summaryEn: 'Working under "Temporary Visitor" status is strictly prohibited under any circumstances.',
      detailsJa: ['「短期滞在」は観光や商用連絡を目的とする在留資格であり、資格外活動許可の対象にもなりません。日本国内で報酬を得る活動を行うことはできません。'],
      detailsVi: ['Tư cách "Lưu trú ngắn hạn" chỉ dành cho du lịch, thăm thân hoặc công tác khảo sát ngắn hạn. Không thể xin cấp giấy phép làm thêm và tuyệt đối không được nhận lương/thù lao tại Nhật Bản.'],
      detailsEn: ['Temporary Visitor is strictly for tourism, visiting relatives, or short business trips. Remunerated work is strictly forbidden.'],
      warnings: [
        {
          id: 'temporary_visitor_work_prohibited',
          severity: 'critical',
          textJa: '重大な不法就労違反となります。',
          textVi: 'Vi phạm nghiêm trọng (Lao động bất hợp pháp).',
          textEn: 'Constitutes severe unauthorized work violation.'
        }
      ],
      legalCitations: ['isa-ica-annexed-table-1'],
      nextActions: [],
      legalDisclaimerJa: STANDARD_DISCLAIMER_JA,
      legalDisclaimerVi: STANDARD_DISCLAIMER_VI,
      legalDisclaimerEn: STANDARD_DISCLAIMER_EN,
    };
  }

  // 3. NHÓM DU HỌC (留学) & GIA ĐÌNH (家族滞在)
  // Không được làm việc theo nguyên tắc, trừ khi có 資格外活動許可
  if (statusDef.category === 'table-1-non-work') {
    // 3.1 Ngành phong tục (風俗営業) -> CẤM TUYỆT ĐỐI KHÔNG CÓ NGOẠI LỆ
    if (activityDef.isAdultEntertainment) {
      return {
        evaluationTier: 'potentially-outside-scope',
        badgeType: 'error',
        summaryJa: '風俗営業関連の業務は、資格外活動許可の有無にかかわらず法律上厳格に禁止されています。',
        summaryVi: 'Các công việc thuộc ngành phong tục / giải trí người lớn bị LUẬT PHÁP NGHIÊM CẤM TUYỆT ĐỐI, kể cả khi đã có giấy phép làm thêm.',
        summaryEn: 'Work in adult entertainment establishments is strictly prohibited by law, regardless of work permission status.',
        detailsJa: [
          '出入国管理及び難民認定法施行規則第19条第2項により、留学・家族滞在の資格外活動許可保有者であっても、風俗営業（キャバクラ、ホストクラブ、スナックでの接待、パチンコ店、麻雀店、性風俗等）に従事することは固く禁じられています。',
          '皿洗いや清掃などの間接的業務であっても、店舗自体が風俗営業等に該当する場合は違法（資格外活動違反）となります。違反した場合は退去強制（国外退去）や刑事罰の対象となります。'
        ],
        detailsVi: [
          'Theo Điều 19 Khoản 2 Quy tắc Thi hành Luật Nhập quản, dù bạn đã có Giấy phép 資格外活動許可, du học sinh và người có visa gia đình cũng TUYỆT ĐỐI KHÔNG ĐƯỢC làm việc tại cơ sở kinh doanh phong tục (quán bar tiếp rượu, host club, quán snack có tiếp khách, pachinko, mạt chược, mát-xa kích dục...).',
          'Kể cả công việc gián tiếp như rửa bát hay dọn dẹp, nếu địa điểm kinh doanh thuộc phạm vi Luật Phong tục thì vẫn bị xem là VI PHẠM TƯ CÁCH LƯU TRÚ (làm việc bất hợp pháp), có nguy cơ bị TRỤC XUẤT và phạt hình sự.'
        ],
        detailsEn: [
          'Under Article 19(2) of the ICA Enforcement Ordinance, students and dependents holding extra-activity permission are strictly prohibited from working in adult entertainment businesses (cabaret clubs, hostess bars, pachinko, sex industry, etc.).',
          'Even backstage roles like dishwashing or cleaning are unlawful if the establishment falls under the Adult Entertainment Law, risking immediate deportation and criminal penalties.'
        ],
        warnings: [
          {
            id: 'adult_entertainment_strict_ban',
            severity: 'critical',
            textJa: '重大な法令違反（不法就労・資格外活動違反）となるため、絶対に従事しないでください。',
            textVi: 'Hành vi vi phạm nghiêm trọng (Lao động bất hợp pháp). Tuyệt đối không nhận việc.',
            textEn: 'Severe legal violation (unauthorized work). Never engage in this employment.'
          }
        ],
        legalCitations: ['isa-ica-art19-work-scope', 'isa-extra-activity-perm'],
        nextActions: [
          {
            stepOrder: 1,
            actionJa: '当該アルバイトの応募・就労を直ちに取りやめる',
            actionVi: 'Hủy bỏ ngay việc ứng tuyển hoặc làm việc tại cơ sở này',
            actionEn: 'Immediately cancel applications or employment at this establishment',
          }
        ],
        legalDisclaimerJa: STANDARD_DISCLAIMER_JA,
        legalDisclaimerVi: STANDARD_DISCLAIMER_VI,
        legalDisclaimerEn: STANDARD_DISCLAIMER_EN,
      };
    }

    // 3.2 Chưa có Giấy phép hoạt động ngoài tư cách (資格外活動許可)
    if (!hasExtraPerm) {
      return {
        evaluationTier: 'requires-extra-permission',
        badgeType: 'warning',
        summaryJa: `「${statusDef.nameJa}」でアルバイト等の就労を行うには、あらかじめ「資格外活動許可」の取得が必須です。`,
        summaryVi: `Để đi làm thêm với tư cách "${statusDef.nameVi}", bạn BẮT BUỘC phải xin "Giấy phép hoạt động ngoài tư cách" (資格外活動許可) trước.`,
        summaryEn: `To engage in part-time work under "${statusDef.nameEn}", obtaining Permission to Engage in Activity other than that Permitted is mandatory.`,
        detailsJa: [
          `「${statusDef.nameJa}」は本来就労を目的としない在留資格であるため、許可を受けずに有償の仕事に従事すると「不法就労（資格外活動違反）」となります。`,
          '出入国在留管理局窓口にて資格外活動許可（包括許可）を申請し、在留カード裏面に許可印を受ける必要があります（手数料無料）。'
        ],
        detailsVi: [
          `Do tư cách "${statusDef.nameVi}" vốn không nhằm mục đích làm việc, nếu bạn đi làm có nhận thù lao khi chưa được cấp phép thì sẽ bị coi là LAO ĐỘNG BẤT HỢP PHÁP.`,
          'Bạn cần nộp đơn xin 資格外活動許可 (loại giấy phép toàn diện - 包括許可) tại Cục Xuất nhập cảnh và được đóng dấu cho phép lên mặt sau thẻ ngoại kiều (thủ tục này hoàn toàn miễn phí).'
        ],
        detailsEn: [
          `Because "${statusDef.nameEn}" is a non-working status, working for pay without prior permission constitutes illegal unauthorized employment.`,
          'You must apply for comprehensive permission at your regional immigration bureau and receive the permission stamp on the back of your Residence Card (free of charge).'
        ],
        warnings: [
          {
            id: 'unauthorized_work_risk_no_permission',
            severity: 'critical',
            textJa: '無許可での就労は入管法違反となり、在留期間の更新不許可や退去強制の対象となります。',
            textVi: 'Làm việc khi chưa có giấy phép là vi phạm Luật Nhập quản, dẫn đến việc bị từ chối gia hạn visa hoặc trục xuất.',
            textEn: 'Working without permission violates the Immigration Control Act, leading to renewal denial or deportation.'
          }
        ],
        legalCitations: ['isa-ica-art19-work-scope', 'isa-extra-activity-perm'],
        nextActions: [
          {
            stepOrder: 1,
            actionJa: '出入国在留管理局窓口で「資格外活動許可申請書」を提出する（無料）',
            actionVi: 'Nộp Đơn xin phép hoạt động ngoài tư cách (資格外活動許可申請書) tại Cục Xuất nhập cảnh (miễn phí)',
            actionEn: 'Submit Application for Permission to Engage in Activity other than that Permitted to ISA (free of charge)',
          },
          {
            stepOrder: 2,
            actionJa: '在留カード裏面に許可スタンプ（原則週28時間以内）が押印されてから勤務を開始する',
            actionVi: 'Chỉ bắt đầu đi làm sau khi mặt sau thẻ ngoại kiều đã được đóng dấu cho phép',
            actionEn: 'Commence work only after the permission stamp is affixed to the back of your Residence Card',
          }
        ],
        legalDisclaimerJa: STANDARD_DISCLAIMER_JA,
        legalDisclaimerVi: STANDARD_DISCLAIMER_VI,
        legalDisclaimerEn: STANDARD_DISCLAIMER_EN,
      };
    }

    // 3.3 Đã có 資格外活動許可 -> Kiểm tra số giờ làm việc (週28時間ルール)
    const limitHours = (statusDef.id === 'student' && isSchoolVacation)
      ? EXTRA_ACTIVITY_LIMITS.studentVacationWeeklyHoursMax
      : EXTRA_ACTIVITY_LIMITS.standardWeeklyHoursMax;

    if (weeklyHours > limitHours) {
      return {
        evaluationTier: 'potentially-outside-scope',
        badgeType: 'error',
        summaryJa: `予定勤務時間（週${weeklyHours}時間）が法定上限（週${limitHours}時間以内）を超過しています。`,
        summaryVi: `Số giờ làm việc dự kiến (${weeklyHours}h/tuần) đã VƯỢT QUÁ giới hạn theo luật định (tối đa ${limitHours}h/tuần).`,
        summaryEn: `Planned work hours (${weeklyHours} hrs/week) exceed the statutory maximum (${limitHours} hrs/week).`,
        detailsJa: [
          `包括的な資格外活動許可では、原則として全就労先を合算して「週28時間以内」と定められています。`,
          statusDef.id === 'student'
            ? '留学生の場合、在籍教育機関が学則で定めた長期休業期間（夏休み・冬休み・春休み）に限り、1日8時間・週40時間まで認められますが、長期休暇証明書の保持が必要です。'
            : '家族滞在の場合、長期休暇による時間の引き上げ特例はなく、常に週28時間以内を厳守しなければなりません。',
          '週28時間の上限は「いかなる週であっても超えてはならない」絶対要件であり、月平均での計算は認められません。掛け持ち（ダブルワーク）の場合は全雇用先の合算時間で判定されます。'
        ],
        detailsVi: [
          'Giấy phép hoạt động ngoài tư cách quy định rõ tổng thời gian làm việc tại TẤT CẢ các nơi cộng lại không được vượt quá 28 giờ/tuần.',
          statusDef.id === 'student'
            ? 'Đối với du học sinh, chỉ trong kỳ nghỉ dài chính thức theo quy chế của trường (nghỉ hè, nghỉ đông, nghỉ xuân) mới được làm tối đa 8h/ngày và 40h/tuần (phải có giấy chứng nhận kỳ nghỉ của trường).'
            : 'Đối với visa gia đình (家族滞在), không có chế độ tăng giờ trong kỳ nghỉ, bắt buộc luôn tuân thủ tối đa 28 giờ/tuần.',
          'Giới hạn 28h/tuần là giới hạn tuyệt đối của TỪNG TUẦN riêng lẻ, không được tính bình quân theo tháng. Nếu làm 2-3 nơi (làm đôi) thì cộng gộp tất cả lại.'
        ],
        detailsEn: [
          'Comprehensive permission strictly caps total working hours across ALL employers at 28 hours per week.',
          statusDef.id === 'student'
            ? 'For students, up to 8 hours/day and 40 hours/week is permitted ONLY during official long school vacation periods defined by school regulations.'
            : 'For dependents, no vacation extension exists; the 28-hour limit applies continuously year-round.',
          'The 28-hour cap applies strictly to any single week and cannot be calculated as a monthly average. Multiple jobs are summed together.'
        ],
        warnings: [
          {
            id: 'hours_over_28_breach',
            severity: 'critical',
            textJa: '時間超過は悪質な入管法違反（不法就労）として摘発対象となり、次回更新不許可の最大要因となります。',
            textVi: 'Làm quá giờ là hành vi vi phạm pháp luật nghiêm trọng, là nguyên nhân hàng đầu bị từ chối gia hạn visa và bị xử lý.',
            textEn: 'Exceeding hour caps is a critical immigration violation and a leading cause of visa renewal denial.'
          }
        ],
        legalCitations: ['isa-ica-art19-work-scope', 'isa-extra-activity-perm'],
        nextActions: [
          {
            stepOrder: 1,
            actionJa: `すべてのアルバイトのシフトを合算し、週${limitHours}時間以内に収まるようシフトを調整する`,
            actionVi: `Cộng dồn tất cả các ca làm thêm và điều chỉnh giảm xuống dưới ${limitHours} giờ/tuần`,
            actionEn: `Aggregate all part-time shifts and adjust them to remain strictly under ${limitHours} hrs/week`,
          }
        ],
        legalDisclaimerJa: STANDARD_DISCLAIMER_JA,
        legalDisclaimerVi: STANDARD_DISCLAIMER_VI,
        legalDisclaimerEn: STANDARD_DISCLAIMER_EN,
      };
    }

    // Hợp lệ: có phép và trong giới hạn giờ
    return {
      evaluationTier: 'generally-within-scope',
      badgeType: 'success',
      summaryJa: `「${statusDef.nameJa}」（資格外活動許可あり）のもとで、週${weeklyHours > 0 ? weeklyHours : 28}時間以内の一般アルバイトとして原則範囲内です。`,
      summaryVi: `Tư cách "${statusDef.nameVi}" (đã có giấy phép 資格外活動許可) được phép làm thêm nói chung trong giới hạn ${weeklyHours > 0 ? weeklyHours : 28}h/tuần.`,
      summaryEn: `Under "${statusDef.nameEn}" with extra-activity permission, general part-time work within ${weeklyHours > 0 ? weeklyHours : 28} hrs/week appears generally within scope.`,
      detailsJa: [
        `資格外活動許可（包括許可）の範囲内（週${limitHours}時間以内）であり、かつ風俗営業等に該当しない一般アルバイトに従事できます。`,
        '複数のアルバイト先がある場合は、すべての就労時間の合算が週28時間（長期休暇中留学生は40時間）を超えないよう厳格に勤怠を管理してください。'
      ],
      detailsVi: [
        `Công việc nằm trong phạm vi của Giấy phép làm thêm (tối đa ${limitHours}h/tuần) và không thuộc các ngành nghề cấm.`,
        'Nếu làm nhiều nơi cùng lúc, hãy tự ghi chép và kiểm soát giờ làm việc để tổng số giờ của tất cả các nơi không vượt quá 28h/tuần.'
      ],
      detailsEn: [
        `Permitted within the scope of comprehensive permission (under ${limitHours} hrs/week) in general non-adult employment.`,
        'If holding multiple jobs, maintain strict personal records to ensure combined hours across all employers never exceed limits.'
      ],
      warnings: [],
      legalCitations: ['isa-ica-art19-work-scope', 'isa-extra-activity-perm'],
      nextActions: [
        {
          stepOrder: 1,
          actionJa: '雇用先に在留カード裏面の資格外活動許可印を提示し、週28時間制限を共有する',
          actionVi: 'Xuất trình dấu phép làm thêm sau thẻ ngoại kiều cho chủ lao động và xác nhận giới hạn 28h/tuần',
          actionEn: 'Present the permission stamp on your card back to your employer and confirm the 28-hour limit',
        }
      ],
      legalDisclaimerJa: STANDARD_DISCLAIMER_JA,
      legalDisclaimerVi: STANDARD_DISCLAIMER_VI,
      legalDisclaimerEn: STANDARD_DISCLAIMER_EN,
    };
  }

  // 4. NHÓM LAO ĐỘNG CHUYÊN MÔN THEO BIỂU 1 (技人国, 経営・管理, 技能, etc.)
  // Phải đối chiếu nội dung công việc với phạm vi quy định của từng tư cách
  if (statusDef.category === 'table-1-work') {
    // 4.1 Ngành phong tục -> Tuyệt đối không phù hợp với bất kỳ visa lao động chuyên môn nào
    if (activityDef.isAdultEntertainment) {
      return {
        evaluationTier: 'potentially-outside-scope',
        badgeType: 'error',
        summaryJa: `「${statusDef.nameJa}」では風俗営業関連の業務に従事することはできません。`,
        summaryVi: `Tư cách "${statusDef.nameVi}" KHÔNG ĐƯỢC PHÉP làm việc trong ngành phong tục / giải trí người lớn.`,
        summaryEn: `Employment in adult entertainment is strictly outside the permitted scope for "${statusDef.nameEn}".`,
        detailsJa: ['就労系在留資格で許可される活動は、法律で定められた高度な専門知識・技術または特定の産業分野に限られます。風俗営業への従事は資格外活動違反となります。'],
        detailsVi: ['Tư cách lưu trú lao động chỉ cho phép làm các công việc chuyên môn/kỹ thuật theo quy định. Làm việc tại cơ sở phong tục là vi phạm pháp luật.'],
        detailsEn: ['Working statuses only authorize specialized professional duties. Adult entertainment work is unlawful.'],
        warnings: [
          {
            id: 'work_visa_adult_prohibited',
            severity: 'critical',
            textJa: '在留資格の取消しおよび退去強制の対象となる重大な違反です。',
            textVi: 'Hành vi vi phạm dẫn đến nguy cơ bị thu hồi tư cách lưu trú và trục xuất.',
            textEn: 'Severe violation subject to status revocation and deportation.'
          }
        ],
        legalCitations: ['isa-ica-art19-work-scope'],
        nextActions: [],
        legalDisclaimerJa: STANDARD_DISCLAIMER_JA,
        legalDisclaimerVi: STANDARD_DISCLAIMER_VI,
        legalDisclaimerEn: STANDARD_DISCLAIMER_EN,
      };
    }

    // 4.2 Kỹ sư / Nhân văn / Quốc tế (技人国)
    if (statusDef.id === 'engineer-humanities-international') {
      if (activityCatId === 'engineering_it' || activityCatId === 'humanities_business') {
        return {
          evaluationTier: 'generally-within-scope',
          badgeType: 'success',
          summaryJa: `「${statusDef.nameJa}」の活動範囲（技術系・事務専門職系）に概ね適合していると考えられます。`,
          summaryVi: `Công việc dự kiến phù hợp với phạm vi chuẩn của tư cách "Kỹ sư / Tri thức nhân văn / Nghiệp vụ quốc tế".`,
          summaryEn: `Planned activity appears generally consistent with the standard scope of "${statusDef.nameEn}".`,
          detailsJa: [
            `学歴（大学・専門学校の専攻科目）または実務経験と、従事する業務内容（IT、エンジニアリング、貿易、通訳、マーケティング等）との関連性が認められる必要があります。`,
            `日本人が従事する場合と同等額以上の報酬を受けることが法定要件です。`,
            employmentType === 'self-employed'
              ? '個人事業主（フリーランス）としての活動の場合、複数の公私の機関との継続的な業務委託契約があり、安定した収入が見込めることが厳格に審査されます。'
              : '企業等との雇用契約に基づくフルタイム就労が一般的です。'
          ],
          detailsVi: [
            'Điều kiện luật định yêu cầu phải có mối liên quan giữa chuyên ngành học tại Đại học/Senmon (hoặc số năm kinh nghiệm) với nội dung công việc thực tế.',
            'Mức thù lao (lương) nhận được phải bằng hoặc cao hơn so với người Nhật làm cùng vị trí.',
            employmentType === 'self-employed'
              ? 'Nếu làm việc theo hình thức Freelancer/Cá nhân kinh doanh, bạn cần chứng minh có các hợp đồng ủy thác công việc ổn định với nhiều công ty và thu nhập độc lập vững chắc.'
              : 'Hình thức phổ biến nhất là hợp đồng lao động trực tiếp với doanh nghiệp.'
          ],
          detailsEn: [
            'Statutory requirements demand relevance between academic major/background and actual job duties (IT, engineering, trade, marketing, etc.).',
            'Remuneration must be equal to or greater than that of a Japanese national in an equivalent role.',
            employmentType === 'self-employed'
              ? 'For independent contracting/freelancing, continuous contracts with Japanese entities providing stable income are strictly reviewed.'
              : 'Standard employment with an enterprise is standard.'
          ],
          warnings: [],
          legalCitations: ['isa-ica-annexed-table-1', 'isa-ica-art19-work-scope'],
          nextActions: [
            {
              stepOrder: 1,
              actionJa: '大学等の卒業証明書・履修科目と職務内容の関連性を説明できるように整理する',
              actionVi: 'Chuẩn bị bằng tốt nghiệp, bảng điểm để chứng minh mối liên quan với nội dung công việc',
              actionEn: 'Ensure relevance between degree transcripts and proposed job description',
            }
          ],
          legalDisclaimerJa: STANDARD_DISCLAIMER_JA,
          legalDisclaimerVi: STANDARD_DISCLAIMER_VI,
          legalDisclaimerEn: STANDARD_DISCLAIMER_EN,
        };
      }

      // 技人国 mà làm lao động phổ thông thuần túy hoặc làm thêm bồi bàn
      if (activityCatId === 'manual_labor' || activityCatId === 'part_time_general') {
        return {
          evaluationTier: 'potentially-outside-scope',
          badgeType: 'error',
          summaryJa: `単純労働や一般アルバイト業務は、「${statusDef.nameJa}」の許可範囲外となる可能性が高いです。`,
          summaryVi: `Lao động phổ thông thuần túy hoặc làm phục vụ bàn / combini CÓ NGUY CƠ CAO nằm ngoài phạm vi tư cách "${statusDef.nameVi}".`,
          summaryEn: `Pure manual labor or general part-time tasks are likely outside the authorized scope for "${statusDef.nameEn}".`,
          detailsJa: [
            '「技術・人文知識・国際業務」は一定水準以上の専門的知識・技術または外国文化に基づく感受性を必要とする職務のための在留資格です。',
            '工場ラインでの単純作業、清掃、倉庫での荷物仕分け、飲食店のホール接客や調理補助のみを主たる業務とする雇用は、原則として許可されません。',
            '新入社員研修の一環として一時的に現場実習を行う場合を除き、専ら単純労働に従事すると在留資格の更新が不許可となるか、取消しの対象となります。'
          ],
          detailsVi: [
            'Tư cách "Kỹ sư / Nhân văn / Quốc tế" chỉ dành cho công việc đòi hỏi kiến thức chuyên môn trình độ cao hoặc nghiệp vụ quốc tế.',
            'Nếu công việc chính là đứng dây chuyền lắp ráp tại xưởng, bốc xếp kho bãi, dọn dẹp, hoặc bồi bàn/phụ bếp nhà hàng thì KHÔNG ĐƯỢC CHẤP THUẬN.',
            'Trừ trường hợp thực tập hiện trường ngắn hạn dành cho nhân viên mới (thời gian giới hạn có kế hoạch), việc làm lao động phổ thông lâu dài sẽ dẫn đến bị TỪ CHỐI GIA HẠN VISA.'
          ],
          detailsEn: [
            'This status is strictly designated for duties requiring professional expertise, technology, or international perspectives.',
            'Employment consisting primarily of factory assembly, cleaning, warehouse packing, or restaurant waitstaff cannot be authorized.',
            'Except for limited introductory field training for new hires, engaging in manual labor risks renewal denial or status revocation.'
          ],
          warnings: [
            {
              id: 'gijinkoku_manual_work_mismatch',
              severity: 'critical',
              textJa: '職務内容と在留資格の不一致は、次回更新時に入管から厳しく追及され不許可となるリスクがあります。',
              textVi: 'Sự không phù hợp giữa công việc thực tế và tư cách lưu trú sẽ bị Cục Xuất nhập cảnh xem xét kỹ và từ chối gia hạn.',
              textEn: 'Mismatch between job duties and residence status creates severe risk of renewal refusal.'
            }
          ],
          legalCitations: ['isa-ica-annexed-table-1', 'isa-ica-art19-work-scope'],
          nextActions: [
            {
              stepOrder: 1,
              actionJa: '会社側と職務内容を再確認し、専門知識・技術を要する業務への配置変更を相談する',
              actionVi: 'Trao đổi lại với công ty về bảng mô tả công việc, điều chuyển sang vị trí chuyên môn kỹ thuật phù hợp',
              actionEn: 'Consult with employer to adjust job duties to technical or specialized tasks',
            },
            {
              stepOrder: 2,
              actionJa: '現場作業が中心となる場合は、「特定技能」等への在留資格変更の可能性を検討する',
              actionVi: 'Nếu công việc thực tế là lao động hiện trường, xem xét chuyển đổi sang tư cách "Kỹ năng đặc định" (Tokutei Gino)',
              actionEn: 'If manual work is primary, consider changing status to Specified Skilled Worker',
            }
          ],
          legalDisclaimerJa: STANDARD_DISCLAIMER_JA,
          legalDisclaimerVi: STANDARD_DISCLAIMER_VI,
          legalDisclaimerEn: STANDARD_DISCLAIMER_EN,
        };
      }

      // 技人国 mà đứng ra thành lập và tự vận hành công ty (kinh doanh quản lý)
      if (activityCatId === 'business_management') {
        return {
          evaluationTier: 'potentially-outside-scope',
          badgeType: 'warning',
          summaryJa: `代表取締役としての会社経営活動は、「経営・管理」への在留資格変更許可が必要となる可能性が高いです。`,
          summaryVi: `Hoạt động điều hành doanh nghiệp với tư cách Giám đốc đại diện có khả năng cao đòi hỏi phải đổi sang visa "Kinh doanh / Quản lý" (経営・管理).`,
          summaryEn: `Managing a business as executive director likely requires changing status to "Business Manager".`,
          detailsJa: [
            '「技術・人文知識・国際業務」のまま自身が代表者となって会社を経営することは、在留資格の本来の活動範囲（公私の機関に雇用されて専門業務を行うこと）と乖離します。',
            '役員報酬を得て本格的な事業経営を行う場合は、資本金500万円以上や独立した事業所の確保などの要件を満たした上で「経営・管理」への在留資格変更許可申請を行うことが通例です。'
          ],
          detailsVi: [
            'Tư cách "Kỹ sư / Nhân văn" vốn dành cho việc làm thuê nhận lương theo hợp đồng chuyên môn với một cơ quan tiếp nhận, không bao gồm hoạt động điều hành toàn bộ công ty.',
            'Nếu bạn mở công ty và nhận lương giám đốc điều hành, bạn cần đáp ứng các điều kiện (vốn điều lệ từ 5 triệu yên trở lên, văn phòng làm việc độc lập...) và nộp đơn xin đổi sang visa "Kinh doanh / Quản lý" (経営・管理).'
          ],
          detailsEn: [
            'Running an enterprise as principal executive deviates from the primary scope of being employed as a professional specialist.',
            'Transitioning to "Business Manager" status (requiring 5M+ JPY capital, physical office, etc.) is typically necessary.'
          ],
          warnings: [
            {
              id: 'management_activity_requires_status_change',
              severity: 'warning',
              textJa: '無断で経営活動を開始すると資格外活動違反とみなされる恐れがあります。',
              textVi: 'Tự ý điều hành kinh doanh khi chưa đổi visa có nguy cơ bị coi là hoạt động ngoài tư cách.',
              textEn: 'Conducting management activities without authorization risks being treated as unauthorized activity.'
            }
          ],
          legalCitations: ['isa-ica-annexed-table-1', 'isa-ica-art20-change'],
          nextActions: [
            {
              stepOrder: 1,
              actionJa: '「経営・管理」への在留資格変更の要件（資本金・事業所・事業計画）を確認する',
              actionVi: 'Kiểm tra các điều kiện chuyển đổi sang visa Kinh doanh / Quản lý (vốn, mặt bằng, kế hoạch kinh doanh)',
              actionEn: 'Review prerequisites for Business Manager status change (capital, office, business plan)',
            }
          ],
          legalDisclaimerJa: STANDARD_DISCLAIMER_JA,
          legalDisclaimerVi: STANDARD_DISCLAIMER_VI,
          legalDisclaimerEn: STANDARD_DISCLAIMER_EN,
        };
      }
    }

    // 4.3 Kinh doanh / Quản lý (経営・管理)
    if (statusDef.id === 'business-manager') {
      if (activityCatId === 'business_management') {
        return {
          evaluationTier: 'generally-within-scope',
          badgeType: 'success',
          summaryJa: `「経営・管理」の活動範囲（事業の経営・管理）に適合しています。`,
          summaryVi: `Phù hợp với phạm vi chuẩn của tư cách "Kinh doanh / Quản lý".`,
          summaryEn: `Consistent with the authorized activities of "Business Manager".`,
          detailsJa: ['貿易その他の事業の経営、または管理職としての統括業務に従事できます。実質的な事業活動が継続していることが重要です。'],
          detailsVi: ['Được phép điều hành, quản lý doanh nghiệp thương mại hoặc các ngành nghề kinh doanh hợp pháp khác.'],
          detailsEn: ['Authorized to operate and manage commercial enterprise. Continuous substantial business operation is required.'],
          warnings: [],
          legalCitations: ['isa-ica-annexed-table-1'],
          nextActions: [],
          legalDisclaimerJa: STANDARD_DISCLAIMER_JA,
          legalDisclaimerVi: STANDARD_DISCLAIMER_VI,
          legalDisclaimerEn: STANDARD_DISCLAIMER_EN,
        };
      }
    }

    // 4.4 Kỹ năng (技能 - Đầu bếp đặc thù)
    if (statusDef.id === 'skilled-labor') {
      if (activityCatId === 'specialized_cuisine') {
        return {
          evaluationTier: 'generally-within-scope',
          badgeType: 'success',
          summaryJa: `「技能」の活動範囲（外国料理の調理師等）に適合しています。`,
          summaryVi: `Phù hợp với phạm vi chuẩn của tư cách "Kỹ năng" (Đầu bếp chuyên nghiệp món ăn nước ngoài).`,
          summaryEn: `Consistent with the authorized activities of "Skilled Labor" (Specialized foreign cuisine).`,
          detailsJa: ['外国料理の専門店において熟練した調理業務に従事できます。ホール専従や単純作業は認められません。'],
          detailsVi: ['Được làm công việc đầu bếp chuyên nghiệp tại nhà hàng chuyên món ăn nước ngoài. Không được chỉ làm phục vụ bàn hoặc dọn dẹp đơn thuần.'],
          detailsEn: ['Authorized for seasoned culinary preparation at specialty foreign restaurants. Exclusively waitstaff duties are not permitted.'],
          warnings: [],
          legalCitations: ['isa-ica-annexed-table-1'],
          nextActions: [],
          legalDisclaimerJa: STANDARD_DISCLAIMER_JA,
          legalDisclaimerVi: STANDARD_DISCLAIMER_VI,
          legalDisclaimerEn: STANDARD_DISCLAIMER_EN,
        };
      }
    }

    // Fallback cho các trường hợp khác
    return {
      evaluationTier: 'needs-confirmation',
      badgeType: 'info',
      summaryJa: `「${statusDef.nameJa}」における当該活動の適合性は、職務内容の詳細や契約関係を個別に確認する必要があります。`,
      summaryVi: `Tính phù hợp của công việc với tư cách "${statusDef.nameVi}" cần được đối chiếu chi tiết theo hợp đồng và bảng mô tả công việc cụ thể.`,
      summaryEn: `Compatibility for "${statusDef.nameEn}" requires individual review of detailed duties and contract terms.`,
      detailsJa: [
        '在留資格に定められた活動の範囲と、実際の雇用契約における職務内容が合致している必要があります。',
        '判断に迷う場合は、出入国在留管理局に対して「就労資格証明書交付申請」を行うことで、事前に就労活動の適法性を確認することが可能です。'
      ],
      detailsVi: [
        'Nội dung công việc thực tế cần phải đối chiếu chính xác với phạm vi luật định của tư cách lưu trú.',
        'Nếu có băn khoăn, bạn có thể nộp đơn xin "Giấy chứng nhận tư cách làm việc" (就労資格証明書) tại Cục Xuất nhập cảnh để được cơ quan thẩm quyền xác nhận trước.'
      ],
      detailsEn: [
        'Actual duties must match the statutory scope of your residence status.',
        'When in doubt, applying for a Certificate of Authorized Employment (就労資格証明書) at the immigration bureau provides official pre-verification.'
      ],
      warnings: [],
      legalCitations: ['isa-ica-annexed-table-1', 'isa-ica-art19-work-scope'],
      nextActions: [
        {
          stepOrder: 1,
          actionJa: '出入国在留管理局窓口にて「就労資格証明書交付申請」（手数料1,200円）の利用を検討する',
          actionVi: 'Cân nhắc nộp đơn xin Giấy chứng nhận tư cách làm việc (就労資格証明書 - lệ phí 1,200 yên) tại ISA',
          actionEn: 'Consider applying for a Certificate of Authorized Employment (fee: 1,200 JPY) at ISA',
        }
      ],
      legalDisclaimerJa: STANDARD_DISCLAIMER_JA,
      legalDisclaimerVi: STANDARD_DISCLAIMER_VI,
      legalDisclaimerEn: STANDARD_DISCLAIMER_EN,
    };
  }

  // Mặc định
  return {
    evaluationTier: 'needs-confirmation',
    badgeType: 'info',
    summaryJa: '出入国在留管理庁への個別確認を推奨します。',
    summaryVi: 'Khuyến nghị xác nhận cụ thể với Cục Quản lý Xuất nhập cảnh.',
    summaryEn: 'Individual consultation with the immigration bureau is recommended.',
    detailsJa: ['具体的な就労可否は、活動の詳細な契約内容と法令基準に照らして判断されます。'],
    detailsVi: ['Tính hợp lệ thực tế cần dựa trên hợp đồng cụ thể và văn bản pháp quy hiện hành.'],
    detailsEn: ['Actual permissibility must be assessed against specific contract terms and statutory rules.'],
    warnings: [],
    legalCitations: ['isa-ica-art19-work-scope'],
    nextActions: [],
    legalDisclaimerJa: STANDARD_DISCLAIMER_JA,
    legalDisclaimerVi: STANDARD_DISCLAIMER_VI,
    legalDisclaimerEn: STANDARD_DISCLAIMER_EN,
  };
}
