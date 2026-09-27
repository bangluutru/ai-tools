/**
 * @file packages/core/src/japan/immigration/affiliation/affiliationEngine.js
 * @description
 * Công cụ tính toán thời hạn thông báo 14 ngày, đánh giá rủi ro thu hồi tư cách sau 3 tháng
 * và khuyến nghị thủ tục khi chuyển việc / thay đổi đơn vị công tác (所属機関変更).
 */

import { FILING_METHODS, NOTIFICATION_TYPE_BY_STATUS, NOTIFICATION_FORM_URLS } from './affiliationRules.js';
import { getStatusDefinition } from '../status/statusCatalog.js';
import { getOtherImmigrationFee } from '../shared/immigrationFeeTable.js';
import {
  parseLocalDate,
  formatLocalDate,
  addDaysLocal,
  addMonthsClamped,
  diffCalendarDays,
  resolveCurrentDate,
} from '../shared/localDate.js';

const formatDateISO = formatLocalDate;
const addDays = addDaysLocal;
const addMonths = addMonthsClamped;

const SPOUSE_EVENTS = ['divorce', 'spouse-death'];

/**
 * Loại nghĩa vụ thông báo theo Điều 19-16 cho một tư cách lưu trú.
 * @param {string} residenceStatus
 * @returns {'activity-institution'|'contract-institution'|'spouse'|'none'}
 */
export function getAffiliationNotificationType(residenceStatus) {
  return NOTIFICATION_TYPE_BY_STATUS[residenceStatus] || 'none';
}

/**
 * Kiểm tra toàn diện tình trạng chuyển việc và thay đổi cơ quan trực thuộc
 *
 * Nghĩa vụ thông báo 14 ngày (Điều 19-16) CHỈ áp dụng cho:
 * - Nhóm 活動機関 (số 1): 教授, 高度専門職1号ハ, 経営・管理, 法律・会計業務, 医療, 教育, 企業内転勤, 技能実習, 留学, 研修
 * - Nhóm 契約機関 (số 2): 高度専門職1号イ・ロ, 研究, 技術・人文知識・国際業務, 介護, 興行, 技能, 特定技能
 * - Nhóm 配偶者 (số 3): 家族滞在, 特定活動(配偶者), 日本人の配偶者等, 永住者の配偶者等 — CHỈ khi ly hôn / vợ chồng qua đời
 * Các tư cách khác (永住者, 定住者, 文化活動, 短期滞在, phần lớn 特定活動...) không có nghĩa vụ này.
 *
 * Mọi so sánh ngày theo ngày lịch địa phương: ngày hạn chót vẫn còn trong hạn.
 *
 * @param {Object} params
 * @param {string} params.residenceStatus - Mã tư cách lưu trú
 * @param {'left-company'|'joined-company'|'transferred'|'contract-change'|'divorce'|'spouse-death'} [params.eventType='transferred']
 * @param {string|Date} params.eventDate - Ngày diễn ra sự kiện
 * @param {string|Date} [params.currentDate] - Ngày đối chiếu (mặc định là hôm nay)
 * @param {boolean} [params.isSameJobScope=true]
 * @param {boolean} [params.isJobHunting=true]
 * @param {boolean} [params.isHelloWorkRegistered=false]
 * @param {boolean} [params.hasFiled14DayNotice=false]
 * @param {'ja'|'en'|'vi'} [params.language='vi']
 */
export function checkAffiliationChange({
  residenceStatus = 'engineer-humanities-international',
  eventType = 'transferred',
  eventDate,
  currentDate,
  isSameJobScope = true,
  isJobHunting = true,
  isHelloWorkRegistered = false,
  hasFiled14DayNotice = false,
  language = 'vi',
}) {
  if (!eventDate) {
    throw new Error('eventDate is required for affiliation change check');
  }

  const evDate = parseLocalDate(eventDate);
  if (!evDate) {
    throw new Error(`Invalid eventDate: ${eventDate}`);
  }

  const now = resolveCurrentDate(currentDate);
  const pick = (ja, en, vi) => (language === 'ja' ? ja : language === 'en' ? en : vi);

  const statusDef = getStatusDefinition(residenceStatus);
  const notificationType = getAffiliationNotificationType(residenceStatus);
  const isSpouseEvent = SPOUSE_EVENTS.includes(eventType);

  // 1. Không thuộc diện thông báo (hoặc tư cách diện "vợ/chồng" nhưng sự kiện là chuyển việc)
  const exempt = notificationType === 'none' || (notificationType === 'spouse' && !isSpouseEvent);
  if (exempt) {
    let guidanceMessage;
    if (notificationType === 'spouse') {
      guidanceMessage = pick(
        'この在留資格では、転職・退職による所属機関の届出義務はありません。第19条の16に基づく「配偶者に関する届出」は、配偶者と離婚又は死別した場合に限り14日以内に必要です。',
        'This status has no employer-change notification duty. A "notification regarding spouse" under Art. 19-16 is required within 14 days only upon divorce from or death of the spouse.',
        'Với tư cách này, KHÔNG có nghĩa vụ thông báo khi chuyển việc/nghỉ việc. Chỉ khi LY HÔN hoặc VỢ/CHỒNG QUA ĐỜI mới phải nộp "Thông báo liên quan đến vợ/chồng" (配偶者に関する届出) trong vòng 14 ngày (Điều 19-16).'
      );
    } else if (statusDef?.category === 'table-2-status') {
      guidanceMessage = pick(
        '身分系在留資格（永住者、定住者等）は所属機関の届出義務（第19条の16）の対象外です。転職・退職時に入管への届出は不要です。',
        'Status-based residents (Permanent Resident, Long-Term Resident, etc.) are exempt from the Art. 19-16 notification. No immigration notification is required upon changing jobs.',
        'Tư cách thân phận (Vĩnh trú, Định trú...) KHÔNG thuộc đối tượng phải thông báo cơ quan trực thuộc theo Điều 19-16. Chuyển việc không cần báo Cục XNC.'
      );
    } else {
      guidanceMessage = pick(
        'この在留資格は第19条の16の所属機関等に関する届出の対象として定められていません（文化活動、短期滞在、多くの特定活動等）。ただし、活動内容の変更が在留資格の範囲を超える場合は、在留資格変更許可等が必要となる場合があります。',
        'This status is not covered by the Art. 19-16 affiliation notification (e.g. Cultural Activities, Temporary Visitor, most Designated Activities). However, a change of activities outside your status may require a change of status.',
        'Tư cách này không thuộc diện phải thông báo cơ quan trực thuộc theo Điều 19-16 (ví dụ: 文化活動, 短期滞在, phần lớn 特定活動). Tuy nhiên nếu hoạt động mới vượt phạm vi tư cách thì có thể phải xin đổi tư cách lưu trú.'
      );
    }
    return {
      isExemptFromNotification: true,
      notificationType,
      residenceStatus,
      statusCategory: statusDef?.category || null,
      notificationDeadline: null,
      daysRemainingForNotification: null,
      isNotificationOverdue: false,
      threeMonthRevocationLimit: null,
      revocationRisk: 'none',
      requiresStatusChange: false,
      certificateOfAuthorizedEmployment: null,
      filingMethods: [],
      warnings: [],
      guidanceMessage,
      regulatoryNotice: {
        nature: 'deterministic',
        legalBasis: '出入国管理及び難民認定法第19条の16（対象在留資格の限定列挙）',
      },
    };
  }

  // 2. Hạn chót thông báo 14 ngày theo luật (Điều 19-16): ngày hạn chót vẫn còn trong hạn
  const notificationDeadline = addDays(evDate, 14);
  const daysRemainingForNotification = diffCalendarDays(now, notificationDeadline);
  const isNotificationOverdue = daysRemainingForNotification < 0 && !hasFiled14DayNotice;

  // 3. Nguy cơ thu hồi tư cách sau 3 tháng không hoạt động (Điều 22-4 khoản 1 mục 6)
  const isUnemployedTrack = eventType === 'left-company' && notificationType !== 'spouse';
  let threeMonthRevocationLimit = null;
  let daysUntilThreeMonthLimit = null;
  let revocationRisk = 'none';

  if (isUnemployedTrack) {
    threeMonthRevocationLimit = addMonths(evDate, 3);
    daysUntilThreeMonthLimit = diffCalendarDays(now, threeMonthRevocationLimit);

    if (daysUntilThreeMonthLimit < 0) {
      if (isHelloWorkRegistered || isJobHunting) {
        revocationRisk = 'mitigated'; // Đã quá 3 tháng nhưng có lý do chính đáng (đang tìm việc tích cực)
      } else {
        revocationRisk = 'high-risk'; // Đã quá 3 tháng không tìm việc -> Nguy cơ thu hồi rất cao
      }
    } else {
      // Trong vòng 3 tháng
      if (isHelloWorkRegistered || isJobHunting) {
        revocationRisk = 'low';
      } else {
        revocationRisk = 'moderate';
      }
    }
  }

  // 4. Kiểm tra sự phù hợp của ngành nghề (Scope Mismatch)
  const requiresStatusChange = !isSameJobScope && notificationType !== 'spouse';

  // 5. Khuyến nghị Giấy chứng nhận tư cách làm việc (就労資格証明書)
  const certFee = getOtherImmigrationFee('authorizedEmploymentCertificate', { method: 'counter', acceptanceDate: now });
  const certificateOfAuthorizedEmployment = notificationType === 'spouse' ? null : {
    recommended: isSameJobScope && (eventType === 'joined-company' || eventType === 'transferred'),
    fee: {
      amount: certFee.counterAmount,
      onlineAmount: certFee.onlineAmount,
      onlinePaymentFee: getOtherImmigrationFee('authorizedEmploymentCertificate', { method: 'online', acceptanceDate: now }).onlinePaymentFee,
      currency: 'JPY',
      payableWith: 'revenue-stamp',
      legalBasis: '出入国管理及び難民認定法第19条の2（就労資格証明書）・窓口2,000円／オンライン1,600円',
      officialUrl: certFee.officialUrl,
    },
    purpose_vi: 'Xác nhận trước với Cục Xuất nhập cảnh rằng công ty và công việc mới hoàn toàn hợp pháp với visa hiện tại, giúp kỳ gia hạn sau này diễn ra trơn tru không bị từ chối đột ngột.',
    purpose_ja: '新しい勤務先での業務が現在の在留資格の範囲内であることを入管が事前に公証する証明書。次回の在留期間更新許可申請がスムーズになります。',
    purpose_en: 'Official certificate confirming that your duties at the new employer fall within your current status of residence, ensuring next renewal is problem-free.',
  };

  // 6. Tổng hợp các cảnh báo pháp lý & rủi ro tuân thủ
  const warnings = [];

  if (isNotificationOverdue) {
    warnings.push({
      type: 'critical',
      code: 'NOTIFICATION_14_DAYS_OVERDUE',
      message: language === 'ja'
        ? `所属機関の変更届出の期限（${formatDateISO(notificationDeadline)}：事由発生から14日以内）を過ぎています。20万円以下の罰金の対象となるほか、次回更新・永住審査に重大な悪影響を及ぼす恐れがあります。至急電子届出または郵送で提出してください。`
        : language === 'en'
          ? `The 14-day statutory deadline (${formatDateISO(notificationDeadline)}) has passed. Failure to notify can be fined up to 200,000 JPY and adversely affects renewals and Permanent Residence applications. Submit immediately via online portal or post.`
          : `Đã quá hạn thông báo 14 ngày theo luật (${formatDateISO(notificationDeadline)}). Việc không/chậm thông báo có thể bị phạt tiền đến 200.000 JPY và tạo vết đen trong hồ sơ gia hạn visa / xin vĩnh trú sau này. Bạn cần nộp thông báo ngay lập tức qua mạng hoặc đường bưu điện.`,
    });
  } else if (!hasFiled14DayNotice) {
    warnings.push({
      type: 'warning',
      code: 'NOTIFICATION_14_DAYS_PENDING',
      message: language === 'ja'
        ? `事由発生から14日以内（期限：${formatDateISO(notificationDeadline)}、残り${daysRemainingForNotification}日${daysRemainingForNotification === 0 ? '・本日が期限' : ''}）に入管への届出が法律上義務付けられています。`
        : language === 'en'
          ? `Statutory notification to ISA is mandatory within 14 days (${formatDateISO(notificationDeadline)}, ${daysRemainingForNotification} day(s) remaining${daysRemainingForNotification === 0 ? ' — today is the last day' : ''}).`
          : `Bạn bắt buộc phải hoàn thành thông báo trong vòng 14 ngày kể từ ngày phát sinh sự việc (Hạn chót: ${formatDateISO(notificationDeadline)}, còn ${daysRemainingForNotification} ngày${daysRemainingForNotification === 0 ? ' — HÔM NAY là ngày cuối' : ''}).`,
    });
  }

  if (requiresStatusChange) {
    warnings.push({
      type: 'critical',
      code: 'SCOPE_MISMATCH_STATUS_CHANGE_MANDATORY',
      message: language === 'ja'
        ? '新しい業務内容は現在の在留資格の活動範囲外となる可能性が高いです。入社・就労を開始する前に、必ず「在留資格変更許可申請」を行い、許可を得る必要があります。許可前の就労は不法就労となります。'
        : language === 'en'
          ? 'The new job duties appear outside the scope of your current residence status. You MUST file for a Change of Status of Residence (在留資格変更許可) and obtain approval BEFORE starting work. Working prior to approval constitutes illegal labor.'
          : 'Công việc mới khác chuyên môn visa hiện tại. Bạn BẮT BUỘC phải nộp đơn xin Chuyển đổi tư cách lưu trú (在留資格変更許可) và PHẢI ĐƯỢC PHÊ DUYỆT TRƯỚC KHI BẮT ĐẦU ĐI LÀM. Làm việc trước khi có kết quả sẽ bị coi là lao động bất hợp pháp.',
    });
  }

  if (notificationType === 'spouse' && isSpouseEvent) {
    warnings.push({
      type: 'warning',
      code: 'SPOUSE_STATUS_BASIS_LOST',
      message: language === 'ja'
        ? '配偶者としての在留資格（日本人の配偶者等・永住者の配偶者等・家族滞在等）は、離婚・死別により活動の基礎を失います。配偶者の身分を有する者としての活動を継続して6か月以上行わない場合は在留資格取消の対象となり得るため（正当な理由がある場合を除く）、早めに「定住者」や就労資格等への在留資格変更を検討してください。'
        : language === 'en'
          ? 'Spouse-based statuses lose their basis upon divorce or death of the spouse. Not engaging in activities as a spouse for 6+ months may lead to revocation (unless there is a justifiable reason). Consider changing to Long-Term Resident or a work status early.'
          : 'Tư cách lưu trú theo diện vợ/chồng (日本人の配偶者等, 永住者の配偶者等, 家族滞在...) mất cơ sở khi ly hôn hoặc vợ/chồng qua đời. Nếu không còn hoạt động với tư cách vợ/chồng liên tục từ 6 tháng trở lên (không có lý do chính đáng) có thể bị thu hồi tư cách. Hãy sớm cân nhắc đổi sang 定住者 hoặc visa lao động.',
    });
  }

  if (revocationRisk === 'high-risk') {
    warnings.push({
      type: 'critical',
      code: 'REVOCATION_RISK_HIGH',
      message: language === 'ja'
        ? `退職後3か月（${formatDateISO(threeMonthRevocationLimit)}）を超過しており、求職活動等の正当な理由が確認できない場合、在留資格取消手続（第22条の4第1項第6号）の対象となる重大なリスクがあります。ハローワーク登録や求職証拠を速やかに整理してください。`
        : language === 'en'
          ? `Over 3 months have elapsed since leaving employment (${formatDateISO(threeMonthRevocationLimit)}). Without documented legitimate reasons such as active job hunting, your status is at risk of revocation (Art. 22-4-1-6). Register with Hello Work and compile proof immediately.`
          : `Đã quá 3 tháng kể từ ngày nghỉ việc (${formatDateISO(threeMonthRevocationLimit)}) mà không có hoạt động tìm việc hợp pháp. Bạn đối mặt với nguy cơ bị thu hồi tư cách lưu trú (Điều 22-4 khoản 1 mục 6). Hãy đăng ký ngay với Hello Work và lưu giữ tài liệu tìm việc.`,
    });
  } else if (revocationRisk === 'mitigated') {
    warnings.push({
      type: 'info',
      code: 'REVOCATION_RISK_MITIGATED',
      message: language === 'ja'
        ? '退職から3か月を超えていますが、ハローワーク登録や積極的な求職活動を継続している場合、「正当な理由」として認められ在留資格取消の対象外となる運用がなされています。応募履歴・面接案内メール等の証拠を厳重に保管してください。'
        : language === 'en'
          ? 'Although over 3 months have passed, continuous active job hunting and Hello Work registration are recognized as legitimate reasons preventing status revocation. Keep all application emails and interview logs.'
          : 'Dù đã quá 3 tháng kể từ khi nghỉ việc, nhưng việc bạn đang tích cực tìm việc và đăng ký Hello Work được coi là "lý do chính đáng" (正当な理由) để không bị thu hồi tư cách lưu trú. Hãy lưu giữ cẩn thận email ứng tuyển và lịch phỏng vấn.',
    });
  }

  // 7. Cam kết an toàn thẩm quyền hành chính
  const regulatoryNotice = {
    nature: 'administrative-discretion',
    legalBasis: '出入国管理及び難民認定法第19条の16（届出義務）/ 第22条の4（取消事由）',
    disclaimer_ja: '所属機関の届出や在留資格の取消審査、就労資格証明書の交付審査は出入国在留管理庁の行政権限に基づき個別事案ごとに判断されます。本ツールは法令基準に基づく義務期日および手続要件の事前整理支援を目的としています。',
    disclaimer_en: 'Notifications, revocation reviews, and issuance of employment qualification certificates are determined individually by the Immigration Services Agency. This tool provides preparation assistance based on statutory criteria.',
    disclaimer_vi: 'Việc tiếp nhận thông báo, xem xét lý do chính đáng để không thu hồi tư cách lưu trú hay cấp Giấy chứng nhận tư cách làm việc thuộc thẩm quyền của Cục Quản lý Xuất nhập cảnh Nhật Bản. Công cụ này chỉ hỗ trợ tính toán thời hạn pháp lý và hướng dẫn quy trình.',
  };

  return {
    isExemptFromNotification: false,
    notificationType,
    notificationFormUrl: NOTIFICATION_FORM_URLS[notificationType] || null,
    residenceStatus,
    eventType,
    eventDate: formatDateISO(evDate),
    notificationDeadline: formatDateISO(notificationDeadline),
    daysRemainingForNotification,
    isNotificationOverdue,
    threeMonthRevocationLimit: threeMonthRevocationLimit ? formatDateISO(threeMonthRevocationLimit) : null,
    daysUntilThreeMonthLimit,
    revocationRisk,
    requiresStatusChange,
    certificateOfAuthorizedEmployment,
    filingMethods: FILING_METHODS.map((m) => (m.id === 'postal-mail' && NOTIFICATION_FORM_URLS[notificationType] ? { ...m, url: NOTIFICATION_FORM_URLS[notificationType] } : m)),
    warnings,
    regulatoryNotice,
  };
}
