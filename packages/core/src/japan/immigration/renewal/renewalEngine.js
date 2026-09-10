/**
 * @file packages/core/src/japan/immigration/renewal/renewalEngine.js
 * @description
 * Công cụ tính toán lịch trình, hồ sơ và kiểm tra điều kiện gia hạn thời hạn lưu trú (在留期間更新).
 * Không sử dụng LLM, đảm bảo tính tất định và tuân thủ chặt chẽ ranh giới thẩm quyền hành chính.
 */

import {
  getRenewalFee,
  checkPhotoRequired,
  STATUS_DOCUMENTS_CATALOG,
} from './renewalRules.js';

/**
 * Thêm hoặc bớt số tháng trên một đối tượng ngày (an toàn theo chuẩn lịch).
 * @param {Date} date 
 * @param {number} months 
 * @returns {Date}
 */
function addMonths(date, months) {
  const d = new Date(date.getTime());
  const expectedMonth = (d.getMonth() + months) % 12;
  d.setMonth(d.getMonth() + months);
  // Xử lý tràn ngày cuối tháng (vd: 31/05 - 3 tháng)
  if (d.getMonth() !== (expectedMonth < 0 ? expectedMonth + 12 : expectedMonth)) {
    d.setDate(0); // ngày cuối cùng tháng trước
  }
  return d;
}

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
 * Tính toán toàn diện thủ tục gia hạn thời hạn lưu trú
 * 
 * @param {Object} params
 * @param {string} params.residenceStatus - Mã tư cách lưu trú (vd: 'engineer-specialist', 'dependent', 'student', 'spouse-japanese')
 * @param {string|Date} params.expirationDate - Ngày hết hạn thẻ cư trú (YYYY-MM-DD)
 * @param {string|Date} [params.applicationDate] - Ngày nộp đơn (mặc định là hôm nay)
 * @param {string|Date} [params.currentDate] - Ngày đối chiếu hiện tại (mặc định là hôm nay)
 * @param {number} [params.applicantAge=30] - Tuổi của người nộp đơn
 * @param {boolean} [params.hasFiled=false] - Đã nộp đơn lên Cục XNC trước ngày hết hạn chưa?
 * @param {boolean} [params.hasTaxArrears=false] - Có nợ thuế cư trú không?
 * @param {boolean} [params.hasPensionArrears=false] - Có nợ tiền bảo hiểm hưu trí Nenkin không?
 * @param {number} [params.companyCategory=3] - Phân loại doanh nghiệp tiếp nhận (1, 2, 3, 4)
 * @param {'ja'|'en'|'vi'} [params.language='vi'] - Ngôn ngữ hiển thị
 */
export function calculateRenewalSchedule({
  residenceStatus = 'engineer-specialist',
  expirationDate,
  applicationDate,
  currentDate,
  applicantAge = 30,
  hasFiled = false,
  hasTaxArrears = false,
  hasPensionArrears = false,
  companyCategory = 3,
  language = 'vi',
}) {
  if (!expirationDate) {
    throw new Error('expirationDate is required for renewal schedule calculation');
  }

  const exp = new Date(expirationDate);
  if (isNaN(exp.getTime())) {
    throw new Error(`Invalid expirationDate: ${expirationDate}`);
  }

  const now = currentDate ? new Date(currentDate) : new Date();
  const appDate = applicationDate ? new Date(applicationDate) : now;

  // 1. Cửa sổ nộp hồ sơ (thông thường 3 tháng trước khi hết hạn)
  const windowStart = addMonths(exp, -3);

  // 2. Thời kỳ đặc lệ (特例期間 - Tokurei Kikan): tối đa 2 tháng sau ngày hết hạn
  const gracePeriodLimit = addMonths(exp, 2);

  // 3. Số ngày còn lại đến khi hết hạn
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysRemaining = Math.ceil((exp.getTime() - now.getTime()) / msPerDay);

  // 4. Xác định trạng thái thời gian nộp đơn
  let windowStatus = 'open';
  if (now < windowStart) {
    windowStatus = 'too-early';
  } else if (now <= exp) {
    windowStatus = 'open';
  } else {
    // now > exp (Đã qua ngày hết hạn)
    if (hasFiled) {
      if (now <= gracePeriodLimit) {
        windowStatus = 'grace-period';
      } else {
        windowStatus = 'grace-period-expired';
      }
    } else {
      windowStatus = 'overstay';
    }
  }

  // 5. Xác định lệ phí (Revenue Stamp) áp dụng theo applicationDate
  const feeInfo = getRenewalFee(appDate);

  // 6. Kiểm tra quy định nộp ảnh thẻ (xét theo tuổi và ngày nộp đơn)
  const photoRule = checkPhotoRequired(applicantAge, appDate);

  // 7. Lập danh mục hồ sơ giấy tờ cần thiết
  const rawDocs = STATUS_DOCUMENTS_CATALOG[residenceStatus] || STATUS_DOCUMENTS_CATALOG['engineer-specialist'];
  const documents = rawDocs.map((doc) => {
    const item = { ...doc };
    // Cập nhật điều kiện ảnh
    if (item.id === 'doc-photo' || item.id === 'doc-photo-dep') {
      item.required = photoRule.required;
      if (!photoRule.required) {
        item.conditional = true;
        item.conditionDescription = language === 'ja'
          ? photoRule.reason_ja
          : language === 'en'
            ? photoRule.reason_en
            : photoRule.reason_vi;
      }
    }
    // Cập nhật tài liệu theo Category doanh nghiệp
    if (item.id === 'doc-statutory-statement') {
      if (companyCategory === 1) {
        item.required = false;
        item.conditionDescription = language === 'ja'
          ? 'カテゴリー1（上場企業等）のため提出免除です。'
          : language === 'en'
            ? 'Exempt for Category 1 (listed companies).'
            : 'Được miễn nộp vì doanh nghiệp thuộc Category 1 (công ty niêm yết).';
      } else {
        item.required = true;
      }
    }
    return item;
  });

  // 8. Cảnh báo tuân thủ pháp luật & các yếu tố rủi ro xét duyệt
  const warnings = [];

  if (windowStatus === 'too-early') {
    warnings.push({
      type: 'info',
      code: 'WINDOW_NOT_OPEN',
      message: language === 'ja'
        ? `在留期間更新の申請受付は満了日の3か月前（${formatDateISO(windowStart)}）から開始されます。`
        : language === 'en'
          ? `Applications open 3 months before expiration (${formatDateISO(windowStart)}).`
          : `Thủ tục gia hạn chỉ tiếp nhận từ 3 tháng trước khi hết hạn (từ ngày ${formatDateISO(windowStart)}).`,
    });
  }

  if (windowStatus === 'open' && daysRemaining <= 14 && daysRemaining >= 0) {
    warnings.push({
      type: 'warning',
      code: 'DEADLINE_APPROACHING',
      message: language === 'ja'
        ? `満了日まであと${daysRemaining}日です。速やかに申請書類を入管へ提出してください。`
        : language === 'en'
          ? `Only ${daysRemaining} day(s) remaining until expiration. Please submit promptly to ISA.`
          : `Chỉ còn ${daysRemaining} ngày nữa là hết hạn thẻ cư trú. Hãy nhanh chóng nộp hồ sơ lên Cục Xuất nhập cảnh.`,
    });
  }

  if (windowStatus === 'grace-period') {
    warnings.push({
      type: 'info',
      code: 'TOKUREI_KIKAN_ACTIVE',
      message: language === 'ja'
        ? `特例期間中（満了日：${formatDateISO(gracePeriodLimit)}）です。処分が出るか特例期間満了まで適法に滞在・就労可能です。`
        : language === 'en'
          ? `Currently in Grace Period (limit: ${formatDateISO(gracePeriodLimit)}). Lawful stay/work permitted until decision or limit.`
          : `Bạn đang trong Thời kỳ Đặc lệ (tối đa đến ${formatDateISO(gracePeriodLimit)}). Bạn được cư trú và làm việc hợp pháp cho đến khi có kết quả hoặc hết 2 tháng.`,
    });
  }

  if (windowStatus === 'overstay') {
    warnings.push({
      type: 'critical',
      code: 'OVERSTAY_ALERT',
      message: language === 'ja'
        ? '在留期間が満了しており、更新申請が確認できていません。不法残留となる重大なリスクがあります。至急入管にご相談ください。'
        : language === 'en'
          ? 'Your period of stay has expired without filed renewal. You are at critical risk of unlawful overstay. Consult ISA immediately.'
          : 'Thẻ cư trú đã hết hạn mà chưa nộp đơn gia hạn. Bạn có nguy cơ cư trú bất hợp pháp nghiêm trọng. Cần đến Cục XNC ngay lập tức.',
    });
  }

  if (hasTaxArrears) {
    warnings.push({
      type: 'critical',
      code: 'TAX_ARREARS_RISK',
      message: language === 'ja'
        ? '公的義務（住民税等）の未納・滞納がある場合、在留期間更新の不許可または期間短縮（1年付与）の主たる原因となります。'
        : language === 'en'
          ? 'Tax arrears (e.g. resident tax) are a primary cause for denial or shortening of period of stay to 1 year.'
          : 'Tình trạng chậm hoặc nợ thuế cư trú là một trong những lý do hàng đầu khiến hồ sơ gia hạn bị từ chối hoặc bị hạ thời hạn xuống 1 năm.',
    });
  }

  if (hasPensionArrears) {
    warnings.push({
      type: 'warning',
      code: 'PENSION_ARREARS_RISK',
      message: language === 'ja'
        ? '公的年金の未納状況は入管の審査において公的義務の履行状況として厳格に確認されます。'
        : language === 'en'
          ? 'Pension payment records are scrutinized by immigration authorities as part of mandatory public obligations.'
          : 'Lịch sử nộp bảo hiểm hưu trí (Nenkin) được Cục Xuất nhập cảnh đối chiếu chặt chẽ khi xem xét tư cách công dân và gia hạn.',
    });
  }

  // 9. Cam kết an toàn thẩm quyền hành chính (Discretion Safety Notice)
  const regulatoryNotice = {
    nature: 'administrative-discretion',
    legalBasis: '出入国管理及び難民認定法第21条（法務大臣の裁量処分）/ マクリーン事件最高裁判決',
    disclaimer_ja: '在留期間の更新は法務大臣の広範な裁量権に属し、更新が100%許可される権利は法律上保障されていません。本ツールは公的ガイドラインに基づくスケジュール・提出書類の事前整理支援を目的としており、許可・不許可の結果を決定または保証するものではありません。',
    disclaimer_en: 'Extension of stay is subject to the administrative discretion of the Minister of Justice under Japanese law. No individual is legally guaranteed an extension. This tool provides preparation guidance and does not predict or guarantee any immigration decision.',
    disclaimer_vi: 'Việc gia hạn thời hạn lưu trú thuộc toàn quyền xem xét và quyết định của Bộ trưởng Bộ Tư pháp Nhật Bản (Cục Quản lý Xuất nhập cảnh). Không có bất kỳ cá nhân nào được pháp luật đảm bảo 100% việc cấp phép. Công cụ này hỗ trợ chuẩn bị lịch trình và hồ sơ theo quy định chính thức, không đưa ra bất kỳ khẳng định hay dự đoán xác suất nào về kết quả.',
  };

  return {
    windowStatus,
    windowStart: formatDateISO(windowStart),
    expirationDate: formatDateISO(exp),
    gracePeriodLimit: formatDateISO(gracePeriodLimit),
    daysRemaining,
    fee: feeInfo,
    photoRequirement: photoRule,
    documents,
    warnings,
    regulatoryNotice,
  };
}
