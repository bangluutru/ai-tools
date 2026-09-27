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
  GENERIC_RENEWAL_DOCUMENTS,
} from './renewalRules.js';
import {
  parseLocalDate,
  formatLocalDate,
  addMonthsClamped,
  diffCalendarDays,
  resolveCurrentDate,
} from '../shared/localDate.js';

const formatDateISO = formatLocalDate;

/**
 * Tư cách KHÔNG làm thủ tục 在留期間更新 thông thường.
 */
const NON_RENEWABLE_STATUSES = {
  'permanent-resident': {
    code: 'PERMANENT_RESIDENT_CARD_RENEWAL_ONLY',
    message_ja: '「永住者」には在留期間がないため、在留期間更新許可申請は不要です。必要なのは在留カードの有効期間更新申請のみで、有効期間満了日の3か月前から満了日までに申請でき、手数料はかかりません（特例期間の制度もありません）。有効期間を過ぎると罰則の対象となるため、満了日までに必ず申請してください。',
    message_vi: 'Người Vĩnh trú (永住者) KHÔNG có thời hạn lưu trú nên không làm thủ tục gia hạn lưu trú. Bạn chỉ cần xin gia hạn hiệu lực THẺ cư trú (在留カードの有効期間更新申請): nộp trong khoảng từ 3 tháng trước đến ngày hết hiệu lực ghi trên thẻ, KHÔNG mất lệ phí, và KHÔNG có "thời kỳ đặc lệ" 2 tháng. Quá hạn thẻ có thể bị xử phạt — hãy nộp trước ngày hết hiệu lực.',
    message_en: 'Permanent Residents have no period of stay, so no extension of stay is needed. Only the residence card validity renewal is required: apply from 3 months before the card expiry date until that date, free of charge; there is no special (tokurei) period. Apply before the card expires.',
    officialUrl: 'https://www.moj.go.jp/isa/applications/procedures/nyuukokukanri10_00011.html',
  },
  'highly-skilled-professional-2': {
    code: 'HSP2_NO_PERIOD_OF_STAY',
    message_ja: '「高度専門職2号」の在留期間は無期限のため、在留期間更新許可申請はありません。在留カードの有効期間更新申請（手数料なし）のみ必要です。',
    message_vi: 'Tư cách "Nhân lực chất lượng cao số 2" có thời hạn lưu trú vô thời hạn nên không có thủ tục gia hạn lưu trú. Chỉ cần gia hạn hiệu lực thẻ cư trú (không mất lệ phí).',
    message_en: 'Highly Skilled Professional (ii) has an unlimited period of stay; no extension is needed. Only the residence card validity renewal (free) applies.',
    officialUrl: 'https://www.moj.go.jp/isa/applications/procedures/nyuukokukanri10_00011.html',
  },
  'temporary-visitor': {
    code: 'TEMPORARY_VISITOR_EXTENSION_EXCEPTIONAL',
    message_ja: '「短期滞在」の在留期間更新は、病気・事故など人道上やむを得ない事情がある場合に限り例外的に認められるもので、本ツールの対象外です。管轄の出入国在留管理局に直接ご相談ください。',
    message_vi: 'Gia hạn "Lưu trú ngắn hạn" (短期滞在) chỉ được xét ngoại lệ khi có lý do bất khả kháng (bệnh, tai nạn…) và nằm ngoài phạm vi công cụ này. Hãy liên hệ trực tiếp Cục XNC khu vực.',
    message_en: 'Extension of Temporary Visitor status is only exceptionally granted for unavoidable reasons (illness, accident) and is outside this tool. Consult your regional immigration bureau.',
    officialUrl: 'https://www.moj.go.jp/isa/applications/procedures/16-3.html',
  },
};

/**
 * Tính toán toàn diện thủ tục gia hạn thời hạn lưu trú
 *
 * Mọi so sánh ngày theo NGÀY LỊCH địa phương: ngày hết hạn (満了日) vẫn là ngày hợp lệ,
 * chỉ từ ngày hôm sau mới là quá hạn.
 *
 * @param {Object} params
 * @param {string} params.residenceStatus - Mã tư cách lưu trú
 * @param {string|Date} params.expirationDate - Ngày hết hạn lưu trú (YYYY-MM-DD)
 * @param {string|Date} [params.applicationDate] - Ngày Cục XNC tiếp nhận hồ sơ (mặc định: hôm nay)
 * @param {string|Date} [params.currentDate] - Ngày đối chiếu (mặc định: hôm nay)
 * @param {number} [params.applicantAge=30]
 * @param {boolean} [params.hasFiled=false]
 * @param {boolean} [params.hasTaxArrears=false]
 * @param {boolean} [params.hasPensionArrears=false]
 * @param {number} [params.companyCategory=3]
 * @param {'counter'|'online'} [params.filingMethod='counter'] - Nộp tại quầy hay online
 * @param {string} [params.expectedPeriod='1y'] - Bậc thời hạn dự kiến được cấp (ảnh hưởng phí từ 01/10/2026)
 * @param {'ja'|'en'|'vi'} [params.language='vi']
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
  filingMethod = 'counter',
  expectedPeriod,
  language = 'vi',
}) {
  if (!expirationDate) {
    throw new Error('expirationDate is required for renewal schedule calculation');
  }

  const exp = parseLocalDate(expirationDate);
  if (!exp) {
    throw new Error(`Invalid expirationDate: ${expirationDate}`);
  }

  const now = resolveCurrentDate(currentDate);
  const appDate = parseLocalDate(applicationDate) || now;
  const pickLang = (o, base) => (language === 'ja' ? o[`${base}_ja`] : language === 'en' ? o[`${base}_en`] : o[`${base}_vi`]);

  // 0. Tư cách không áp dụng thủ tục gia hạn thông thường
  const nonRenewable = NON_RENEWABLE_STATUSES[residenceStatus];
  if (nonRenewable) {
    return {
      windowStatus: 'not-applicable',
      notApplicable: {
        code: nonRenewable.code,
        message: pickLang(nonRenewable, 'message'),
        officialUrl: nonRenewable.officialUrl,
      },
      windowStart: null,
      expirationDate: formatDateISO(exp),
      gracePeriodLimit: null,
      daysRemaining: diffCalendarDays(now, exp),
      fee: null,
      photoRequirement: null,
      documents: [],
      warnings: [{ type: 'info', code: nonRenewable.code, message: pickLang(nonRenewable, 'message') }],
      regulatoryNotice: null,
    };
  }

  // 1. Cửa sổ nộp hồ sơ (thông thường 3 tháng trước khi hết hạn)
  const windowStart = addMonthsClamped(exp, -3);

  // 2. Thời kỳ đặc lệ (特例期間 - Điều 20 Khoản 6 áp dụng qua Điều 21 Khoản 4): tối đa đến ngày tròn 2 tháng sau ngày hết hạn
  const gracePeriodLimit = addMonthsClamped(exp, 2);

  // 3. Số ngày lịch còn lại đến ngày hết hạn (0 = hôm nay là ngày hết hạn, vẫn hợp lệ)
  const daysRemaining = diffCalendarDays(now, exp);
  const daysToWindow = diffCalendarDays(now, windowStart);
  const daysToGraceLimit = diffCalendarDays(now, gracePeriodLimit);

  // 4. Xác định trạng thái thời gian nộp đơn
  let windowStatus = 'open';
  if (daysToWindow > 0) {
    windowStatus = 'too-early';
  } else if (daysRemaining >= 0) {
    windowStatus = 'open';
  } else if (hasFiled) {
    windowStatus = daysToGraceLimit >= 0 ? 'grace-period' : 'grace-period-expired';
  } else {
    windowStatus = 'overstay';
  }

  // 5. Xác định lệ phí (Revenue Stamp) áp dụng theo applicationDate
  const feeInfo = getRenewalFee(appDate, { method: filingMethod, expectedPeriod });

  // 6. Kiểm tra quy định nộp ảnh thẻ (xét theo tuổi và ngày nộp đơn)
  const photoRule = checkPhotoRequired(applicantAge, appDate);

  // 7. Lập danh mục hồ sơ giấy tờ cần thiết
  const catalogDocs = STATUS_DOCUMENTS_CATALOG[residenceStatus];
  const documentsModeled = Boolean(catalogDocs);
  const rawDocs = catalogDocs || GENERIC_RENEWAL_DOCUMENTS;
  const documents = rawDocs.map((doc) => {
    const item = { ...doc };
    // Cập nhật điều kiện ảnh
    if (item.id.startsWith('doc-photo')) {
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

  if (!documentsModeled) {
    warnings.push({
      type: 'warning',
      code: 'DOCUMENTS_NOT_MODELED',
      message: language === 'ja'
        ? 'この在留資格の提出書類一覧は本ツールでは未整備です。共通書類（申請書・写真・旅券・在留カード）のみ表示しています。在留資格ごとの必要書類は出入国在留管理庁の公式ページで必ず確認してください。'
        : language === 'en'
          ? 'The document list for this status is not modeled in this tool. Only common items (form, photo, passport, residence card) are shown. Check the official ISA page for status-specific documents.'
          : 'Công cụ chưa có danh mục giấy tờ riêng cho tư cách này. Chỉ hiển thị giấy tờ chung (đơn, ảnh, hộ chiếu, thẻ cư trú). Hãy kiểm tra giấy tờ riêng theo tư cách trên trang chính thức của Cục XNC.',
    });
  }

  if (feeInfo.regime === 'post-2026-10') {
    warnings.push({
      type: 'info',
      code: 'FEE_DEPENDS_ON_GRANTED_PERIOD',
      message: language === 'ja' ? feeInfo.transitionNote_ja : language === 'en' ? feeInfo.transitionNote_en : feeInfo.transitionNote_vi,
    });
  } else {
    warnings.push({
      type: 'info',
      code: 'FEE_REVISION_2026_10_NOTICE',
      message: language === 'ja' ? feeInfo.transitionNote_ja : language === 'en' ? feeInfo.transitionNote_en : feeInfo.transitionNote_vi,
    });
  }

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
    documentsModeled,
    fee: feeInfo,
    photoRequirement: photoRule,
    documents,
    warnings,
    regulatoryNotice,
  };
}
