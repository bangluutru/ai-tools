/**
 * @file packages/core/src/japan/immigration/affiliation/affiliationEngine.js
 * @description
 * Công cụ tính toán thời hạn thông báo 14 ngày, đánh giá rủi ro thu hồi tư cách sau 3 tháng
 * và khuyến nghị thủ tục khi chuyển việc / thay đổi đơn vị công tác (所属機関変更).
 */

import { FILING_METHODS } from './affiliationRules.js';
import { getStatusDefinition } from '../status/statusCatalog.js';

/**
 * Format ngày dạng YYYY-MM-DD
 * @param {Date} date 
 * @returns {string}
 */
function formatDateISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Thêm số ngày vào Date
 * @param {Date} date 
 * @param {number} days 
 * @returns {Date}
 */
function addDays(date, days) {
  const d = new Date(date.getTime());
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Thêm số tháng vào Date
 * @param {Date} date 
 * @param {number} months 
 * @returns {Date}
 */
function addMonths(date, months) {
  const d = new Date(date.getTime());
  const expectedMonth = (d.getMonth() + months) % 12;
  d.setMonth(d.getMonth() + months);
  if (d.getMonth() !== (expectedMonth < 0 ? expectedMonth + 12 : expectedMonth)) {
    d.setDate(0);
  }
  return d;
}

/**
 * Kiểm tra toàn diện tình trạng chuyển việc và thay đổi cơ quan trực thuộc
 * 
 * @param {Object} params
 * @param {string} params.residenceStatus - Mã tư cách lưu trú (vd: 'engineer-humanities-international', 'permanent-resident')
 * @param {'left-company'|'joined-company'|'transferred'|'contract-change'} [params.eventType='transferred'] - Loại sự kiện
 * @param {string|Date} params.eventDate - Ngày diễn ra sự kiện (ngày nghỉ việc hoặc ngày nhận việc mới)
 * @param {string|Date} [params.currentDate] - Ngày đối chiếu (mặc định là hôm nay)
 * @param {boolean} [params.isSameJobScope=true] - Công việc mới có cùng nhóm chuyên môn với visa hiện tại không?
 * @param {boolean} [params.isJobHunting=true] - Có đang tích cực tìm kiếm việc làm mới không?
 * @param {boolean} [params.isHelloWorkRegistered=false] - Đã đăng ký tìm việc tại Trung tâm giới thiệu việc làm Hello Work chưa?
 * @param {boolean} [params.hasFiled14DayNotice=false] - Đã nộp thông báo cơ quan trực thuộc chưa?
 * @param {'ja'|'en'|'vi'} [params.language='vi'] - Ngôn ngữ hiển thị
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

  const evDate = new Date(eventDate);
  if (isNaN(evDate.getTime())) {
    throw new Error(`Invalid eventDate: ${eventDate}`);
  }

  const now = currentDate ? new Date(currentDate) : new Date();
  const msPerDay = 24 * 60 * 60 * 1000;

  // 1. Kiểm tra tư cách lưu trú thuộc Biểu 2 (Thân phận) hay Biểu 1 (Hoạt động)
  const statusDef = getStatusDefinition(residenceStatus);
  const isTable2Status = statusDef?.category === 'table-2-status';

  // Tư cách Biểu 2 (Vĩnh trú, Vợ chồng người Nhật, Định trú) không bị ràng buộc bởi Điều 19-16
  if (isTable2Status) {
    return {
      isExemptFromNotification: true,
      residenceStatus,
      statusCategory: 'table-2-status',
      notificationDeadline: null,
      daysRemainingForNotification: null,
      isNotificationOverdue: false,
      threeMonthRevocationLimit: null,
      revocationRisk: 'none',
      requiresStatusChange: false,
      certificateOfAuthorizedEmployment: null,
      filingMethods: [],
      warnings: [],
      guidanceMessage: language === 'ja'
        ? '身分系在留資格（永住者、日本人の配偶者等、定住者等）は所属機関の届出義務（第19条の16）の対象外です。転職・退職時に入管への届出は原則不要です。'
        : language === 'en'
          ? 'Table 2 statuses (Permanent Resident, Spouse of Japanese, etc.) are exempt from Article 19-16 affiliation notification. No immigration notification required upon changing jobs.'
          : 'Tư cách lưu trú theo thân phận (Vĩnh trú, Vợ/chồng người Nhật, Định trú...) KHÔNG thuộc đối tượng phải nộp thông báo cơ quan trực thuộc theo Điều 19-16. Bạn được tự do chuyển việc mà không cần báo Cục XNC.',
      regulatoryNotice: {
        nature: 'deterministic',
        legalBasis: '出入国管理及び難民認定法第19条の16本文（別表第二該当者は対象外）',
      },
    };
  }

  // 2. Hạn chót thông báo 14 ngày theo luật (Điều 19-16)
  const notificationDeadline = addDays(evDate, 14);
  const daysRemainingForNotification = Math.ceil((notificationDeadline.getTime() - now.getTime()) / msPerDay);
  const isNotificationOverdue = now > notificationDeadline && !hasFiled14DayNotice;

  // 3. Nguy cơ thu hồi tư cách sau 3 tháng không hoạt động (Điều 22-4 khoản 1 mục 6)
  const isUnemployedTrack = eventType === 'left-company';
  let threeMonthRevocationLimit = null;
  let daysUntilThreeMonthLimit = null;
  let revocationRisk = 'none';

  if (isUnemployedTrack) {
    threeMonthRevocationLimit = addMonths(evDate, 3);
    daysUntilThreeMonthLimit = Math.ceil((threeMonthRevocationLimit.getTime() - now.getTime()) / msPerDay);

    if (now > threeMonthRevocationLimit) {
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
  const requiresStatusChange = !isSameJobScope;

  // 5. Khuyến nghị Giấy chứng nhận tư cách làm việc (就労資格証明書)
  const certificateOfAuthorizedEmployment = {
    recommended: isSameJobScope && (eventType === 'joined-company' || eventType === 'transferred'),
    fee: {
      amount: 1200,
      currency: 'JPY',
      payableWith: 'revenue-stamp',
      legalBasis: '出入国管理及び難民認定法第19条の2（就労資格証明書）',
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
        ? `所属機関の変更届出の期限（${formatDateISO(notificationDeadline)}：事由発生から14日以内）を過ぎています。20万円以下の罰金（第71条の3）または次回更新・永住審査に重大な悪影響を及ぼす恐れがあります。至急電子届出または郵送で提出してください。`
        : language === 'en'
          ? `The 14-day statutory deadline (${formatDateISO(notificationDeadline)}) has passed. Failure to notify carries fines up to 200,000 JPY (Art. 71-3) and adversely affects renewals and Permanent Residence applications. Submit immediately via online portal or post.`
          : `Đã quá hạn thông báo 14 ngày theo luật (${formatDateISO(notificationDeadline)}). Việc chậm thông báo có thể bị phạt tiền đến 200.000 JPY (Điều 71-3) và tạo vết đen trong hồ sơ gia hạn visa / xin vĩnh trú sau này. Bạn cần nộp thông báo ngay lập tức qua mạng hoặc đường bưu điện.`,
    });
  } else if (!hasFiled14DayNotice) {
    warnings.push({
      type: 'warning',
      code: 'NOTIFICATION_14_DAYS_PENDING',
      message: language === 'ja'
        ? `退職・転職後14日以内（期限：${formatDateISO(notificationDeadline)}、残り${daysRemainingForNotification}日）に入管への届出が法律上義務付けられています。`
        : language === 'en'
          ? `Statutory notification to ISA is mandatory within 14 days (${formatDateISO(notificationDeadline)}, ${daysRemainingForNotification} day(s) remaining).`
          : `Bạn bắt buộc phải hoàn thành thông báo trong vòng 14 ngày kể từ ngày chuyển việc/nghỉ việc (Hạn chót: ${formatDateISO(notificationDeadline)}, còn ${daysRemainingForNotification} ngày).`,
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
    filingMethods: FILING_METHODS,
    warnings,
    regulatoryNotice,
  };
}
