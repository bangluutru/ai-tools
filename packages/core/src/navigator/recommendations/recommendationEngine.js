/**
 * @file packages/core/src/navigator/recommendations/recommendationEngine.js
 * @description
 * Recommendation Engine for Japan Life Navigator.
 * Evaluates NavigatorContext against registered deterministic rules,
 * resolves capabilities, checks locality coverage, and outputs ranked recommendations
 * with structured statutory reason codes.
 */

import {
  createRecommendation,
  ConfidenceType,
  Coverage,
  Priority,
  Timing,
  Jurisdiction,
} from './recommendationContract.js';
import { resolveCapability } from '../capabilityGraph/capabilityResolver.js';
import { rankRecommendations } from '../ranking/recommendationRanker.js';

/**
 * Danh mục mã lý do (Reason Codes) chuẩn hóa cho các khuyến nghị pháp lý
 */
export const RECOMMENDATION_REASON_CODES = {
  // Việc làm & Thay đổi công việc
  JOB_CHANGE_VISA_NOTIFY: 'REASON_JOB_CHANGE_VISA_NOTIFY',
  KENPO_SWITCH: 'REASON_KENPO_SWITCH',
  NENKIN_SWITCH: 'REASON_NENKIN_SWITCH',
  UNEMPLOYMENT_BENEFIT: 'REASON_UNEMPLOYMENT_BENEFIT',
  RESIDENT_TAX_REMAINDER: 'REASON_RESIDENT_TAX_REMAINDER',
  YEAR_END_TAX_ADJUSTMENT: 'REASON_YEAR_END_TAX_ADJUSTMENT',

  // Sinh con & Gia đình
  BIRTH_LUMP_SUM: 'REASON_BIRTH_LUMP_SUM',
  CHILD_ALLOWANCE_15DAYS: 'REASON_CHILD_ALLOWANCE_15DAYS',
  CHILD_HEALTH_INSURANCE: 'REASON_CHILD_HEALTH_INSURANCE',
  FAMILY_COE_PROCEDURE: 'REASON_FAMILY_COE_PROCEDURE',
  FAMILY_HEALTH_INSURANCE_DEPENDENT: 'REASON_FAMILY_HEALTH_INSURANCE_DEPENDENT',

  // Chuyển nhà
  MOVING_TENSHUTSU: 'REASON_MOVING_TENSHUTSU',
  MOVING_TENNYU: 'REASON_MOVING_TENNYU',
  MYNUMBER_ADDRESS_UPDATE: 'REASON_MYNUMBER_ADDRESS_UPDATE',

  // Rời Nhật & Về nước
  LEAVING_NENKIN_DATTAI: 'REASON_LEAVING_NENKIN_DATTAI',
  LEAVING_TAX_REPRESENTATIVE: 'REASON_LEAVING_TAX_REPRESENTATIVE',

  // Đến Nhật & Người mới
  STARTING_LIFE_ADDRESS_REGISTRATION: 'REASON_STARTING_LIFE_ADDRESS_REGISTRATION',
  STARTING_LIFE_BANK_MOBILE: 'REASON_STARTING_LIFE_BANK_MOBILE',

  // Thị thực / Cư trú
  VISA_RENEWAL_3MONTHS: 'REASON_VISA_RENEWAL_3MONTHS',
};

/**
 * Đánh giá danh sách khuyến nghị thô trong ngữ cảnh cụ thể, làm giàu thông tin và xếp hạng
 * @param {Array<Record<string, any>>} rawRecommendations
 * @param {Record<string, any>} context
 * @returns {Array<Record<string, any>>}
 */
export function evaluateAndRankRecommendations(rawRecommendations, context = {}) {
  if (!Array.isArray(rawRecommendations)) {
    return [];
  }

  const enriched = rawRecommendations.map((rawRec) => {
    let rec = createRecommendation(rawRec);

    // 1. Phân giải capability nếu có capabilityId
    if (rec.capabilityId) {
      const resolvedCap = resolveCapability(rec.capabilityId);
      rec = {
        ...rec,
        toolId: resolvedCap.toolId,
        hashRoute: resolvedCap.hashRoute,
        isCapabilityAvailable: resolvedCap.isAvailable,
      };
    }

    // 2. Xử lý mức độ bao phủ địa phương (Locality Coverage)
    if (rec.jurisdiction === Jurisdiction.MUNICIPAL || rec.jurisdiction === 'municipal') {
      if (!context.municipality || context.municipality === 'unsupported' || context.municipality === 'unknown') {
        rec = {
          ...rec,
          coverage: Coverage.UNKNOWN,
          confidenceType:
            rec.confidenceType === ConfidenceType.DETERMINISTIC
              ? ConfidenceType.LOCAL_DATA_UNVERIFIED
              : rec.confidenceType,
          localityNote: {
            vi: 'Quy định chuẩn toàn quốc khả dụng. Thủ tục chi tiết tại địa phương cần kiểm tra tại Tòa thị chính.',
            ja: '全国標準ルールが適用されます。市区町村独自の詳細手続きは役所窓口にてご確認ください。',
            en: 'Standard national rules apply. Please verify municipality-specific requirements at your local city office.',
          },
        };
      } else {
        rec = {
          ...rec,
          coverage: Coverage.VERIFIED,
        };
      }
    }

    return rec;
  });

  return rankRecommendations(enriched);
}

/**
 * Tự động phân tích NavigatorContext và sinh danh sách khuyến nghị tiếp theo (Next Best Actions)
 * dựa trên các quy tắc nghiệp vụ luật định tất định (Deterministic Statutory Rules)
 * @param {Record<string, any>} context - NavigatorContext
 * @param {Object} [options={}]
 * @returns {Array<Record<string, any>>}
 */
export function generateContextualRecommendations(context = {}, options = {}) {
  const rawList = [];

  const eventId = context.currentLifeEventId || '';
  const empStatus = context.employmentStatus || '';
  const isLeavingJob = eventId === 'life.jp.changing-job' || eventId === 'life.jp.leaving-job' || empStatus === 'leaving' || empStatus === 'unemployed';
  const isBirth = eventId === 'life.jp.birth' || context.hasBaby || context.householdStatus === 'expecting_baby';
  const isMoving = eventId === 'life.jp.moving' || context.isMoving;
  const isFamilyJoining = eventId === 'life.jp.family-joining' || context.familyJoining;
  const isLeavingJapan = eventId === 'life.jp.leaving-japan' || context.isLeavingJapan;
  const isNewArrival = eventId === 'life.jp.starting-life' || context.isNewArrival;
  const isVisaExpiring = context.isVisaExpiringSoon || context.visaStatus === 'expiring_soon';

  // 1. Việc làm & Chuyển việc / Nghỉ việc
  if (isLeavingJob) {
    // 14 ngày khai báo Nyūkan
    rawList.push({
      id: 'rec-job-change-immigration-notify',
      title: 'Khai báo chuyển nơi làm việc với Cục Xuất nhập cảnh (14 ngày)',
      description: 'Người có tư cách lưu trú diện lao động bắt buộc phải thông báo cho Nyūkan trong vòng 14 ngày kể từ khi nghỉ việc hoặc bắt đầu công ty mới.',
      reasonCode: RECOMMENDATION_REASON_CODES.JOB_CHANGE_VISA_NOTIFY,
      priority: Priority.URGENT,
      timing: Timing.NOW,
      jurisdiction: Jurisdiction.NATIONAL,
      deadlineClass: '14_DAYS',
      deadline: { statutoryLimitDays: 14 },
      capabilityId: 'immigration.affiliationChange.check',
      confidenceType: ConfidenceType.DETERMINISTIC,
    });

    // Nếu không có việc ngay hoặc có khoảng trống chuyển việc (Gap)
    if (context.hasNewJob === false || empStatus === 'unemployed' || context.hasEmploymentGap === true) {
      // Chuyển BHYT (Kenpo -> Kokumin Kenpo hoặc Nin-i Keizoku)
      rawList.push({
        id: 'rec-kenpo-switch-leaving',
        title: 'Chuyển đổi Bảo hiểm Y tế (Kokumin Kenpo hoặc Nin-i Keizoku)',
        description: 'Bảo hiểm công ty cũ hết hạn ngay sau ngày nghỉ việc. Cần làm thủ tục tại Tòa thị chính (trong 14 ngày) hoặc đăng ký Nin-i Keizoku (trong 20 ngày).',
        reasonCode: RECOMMENDATION_REASON_CODES.KENPO_SWITCH,
        priority: Priority.URGENT,
        timing: Timing.NOW,
        jurisdiction: Jurisdiction.MUNICIPAL,
        deadlineClass: '14_DAYS',
        deadline: { statutoryLimitDays: 14 },
        capabilityId: 'insurance.socialInsurance.eligibility',
        confidenceType: ConfidenceType.DETERMINISTIC,
      });

      // Chuyển Lương hưu (Kosei Nenkin -> Kokumin Nenkin Loại 1)
      rawList.push({
        id: 'rec-nenkin-switch-leaving',
        title: 'Chuyển đổi Lương hưu Quốc dân Loại 1 trong 14 ngày',
        description: 'Thủ tục chuyển sang Lương hưu Quốc dân số 1 tại Ủy ban quận. Có thể nộp kèm đơn xin miễn giảm nộp nếu thu nhập giảm sút.',
        reasonCode: RECOMMENDATION_REASON_CODES.NENKIN_SWITCH,
        priority: Priority.URGENT,
        timing: Timing.NOW,
        jurisdiction: Jurisdiction.MUNICIPAL,
        deadlineClass: '14_DAYS',
        deadline: { statutoryLimitDays: 14 },
        capabilityId: 'insurance.pension.national',
        confidenceType: ConfidenceType.DETERMINISTIC,
      });

      // Nhận trợ cấp thất nghiệp tại Hello Work
      rawList.push({
        id: 'rec-unemployment-hello-work',
        title: 'Làm thủ tục nhận Trợ cấp Thất nghiệp tại Hello Work',
        description: 'Mang Giấy chứng nhận nghỉ việc (Rishokuhyo 1 & 2) đến Hello Work quản lý khu vực để đăng ký tìm việc và thẩm định số ngày hưởng trợ cấp.',
        reasonCode: RECOMMENDATION_REASON_CODES.UNEMPLOYMENT_BENEFIT,
        priority: Priority.REQUIRED,
        timing: Timing.AFTER_EVENT,
        jurisdiction: Jurisdiction.NATIONAL,
        capabilityId: 'employment.unemployment.eligibility',
        confidenceType: ConfidenceType.DETERMINISTIC,
      });
    }

    // Xử lý thuế cư trú còn lại (Thuế cư trú trừ 1 lần hoặc nộp trực tiếp Futsu Choshu)
    rawList.push({
      id: 'rec-resident-tax-remainder',
      title: 'Xử lý thuế cư trú các tháng còn lại sau khi thôi việc',
      description: 'Thuế cư trú của năm trước sẽ được công ty khấu trừ một lần vào lương tháng cuối (tháng 1 đến tháng 5) hoặc chuyển sang nộp qua giấy báo nộp thuế (tháng 6 đến tháng 12).',
      reasonCode: RECOMMENDATION_REASON_CODES.RESIDENT_TAX_REMAINDER,
      priority: Priority.REQUIRED,
      timing: Timing.NOW,
      jurisdiction: Jurisdiction.MUNICIPAL,
      capabilityId: 'tax.japan.calculate',
      confidenceType: ConfidenceType.DETERMINISTIC,
    });
  }

  // 2. Sinh con & Gia đình
  if (isBirth) {
    // Trợ cấp sinh con trọn gói 500,000 yên
    rawList.push({
      id: 'rec-birth-lump-sum-allowance',
      title: 'Nhận Trợ cấp Sinh con Trọn gói 500,000 yên (Shussan Ikuji Ichijikin)',
      description: 'Khoản trợ cấp cố định 500,000 yên do Quỹ BHYT chi trả trực tiếp cho bệnh viện qua cơ chế thanh toán ủy quyền (Chokusetsu Shiharai Seido).',
      reasonCode: RECOMMENDATION_REASON_CODES.BIRTH_LUMP_SUM,
      priority: Priority.RECOMMENDED,
      timing: Timing.NOW,
      jurisdiction: Jurisdiction.NATIONAL,
      capabilityId: 'family.maternity.allowance',
      confidenceType: ConfidenceType.DETERMINISTIC,
    });

    // Trợ cấp nuôi con Jidō Teate trong vòng 15 ngày
    rawList.push({
      id: 'rec-child-allowance-15days',
      title: 'Nộp đơn xin Trợ cấp Nuôi con (Jidō Teate) trong 14-15 ngày',
      description: 'Đơn xin trợ cấp nuôi con phải nộp tại Ủy ban trong vòng 15 ngày kể từ ngày sinh để không bị mất trợ cấp của tháng tiếp theo (Nguyên tắc ngày 15).',
      reasonCode: RECOMMENDATION_REASON_CODES.CHILD_ALLOWANCE_15DAYS,
      priority: Priority.URGENT,
      timing: Timing.NOW,
      jurisdiction: Jurisdiction.MUNICIPAL,
      deadlineClass: '15_DAYS',
      deadline: { statutoryLimitDays: 15 },
      capabilityId: 'family.childAllowance.calculate',
      confidenceType: ConfidenceType.DETERMINISTIC,
    });

    // Cấp thẻ BHYT và Trợ cấp Y tế Trẻ em (Iryōhi Josei)
    rawList.push({
      id: 'rec-child-health-insurance',
      title: 'Làm thẻ BHYT và Giấy chứng nhận hỗ trợ y tế trẻ em (Maru-nyū)',
      description: 'Đăng ký nhập bảo hiểm y tế cho bé theo bố hoặc mẹ và nhận thẻ miễn/giảm chi phí khám chữa bệnh trẻ em tại Tòa thị chính.',
      reasonCode: RECOMMENDATION_REASON_CODES.CHILD_HEALTH_INSURANCE,
      priority: Priority.REQUIRED,
      timing: Timing.NOW,
      jurisdiction: Jurisdiction.MUNICIPAL,
      capabilityId: 'family.birth.guide',
      confidenceType: ConfidenceType.DETERMINISTIC,
    });
  }

  // 3. Chuyển nhà (Moving)
  if (isMoving) {
    rawList.push({
      id: 'rec-moving-tenshutsu',
      title: 'Nộp Thông báo chuyển đi (Tenshutsu Todoke) trong 14 ngày trước khi chuyển',
      description: 'Nộp tại Ủy ban quận cũ để lấy Giấy chứng nhận chuyển đi (Tenshutsu Shomeisho), hoặc nộp online qua ứng dụng Mynaportal.',
      reasonCode: RECOMMENDATION_REASON_CODES.MOVING_TENSHUTSU,
      priority: Priority.URGENT,
      timing: Timing.BEFORE_EVENT,
      jurisdiction: Jurisdiction.MUNICIPAL,
      deadlineClass: '14_DAYS_BEFORE',
      deadline: { statutoryLimitDays: 14 },
      capabilityId: 'housing.moving.admin.check',
      confidenceType: ConfidenceType.DETERMINISTIC,
    });

    rawList.push({
      id: 'rec-moving-tennyu',
      title: 'Nộp Thông báo chuyển đến (Tennyu Todoke) trong 14 ngày sau khi chuyển',
      description: 'Nộp tại Ủy ban quận mới trong vòng 14 ngày kể từ ngày dọn vào nhà mới kèm theo Thẻ cư trú và Thẻ My Number để cập nhật địa chỉ.',
      reasonCode: RECOMMENDATION_REASON_CODES.MOVING_TENNYU,
      priority: Priority.URGENT,
      timing: Timing.AFTER_EVENT,
      jurisdiction: Jurisdiction.MUNICIPAL,
      deadlineClass: '14_DAYS',
      deadline: { statutoryLimitDays: 14 },
      capabilityId: 'housing.moving.admin.check',
      confidenceType: ConfidenceType.DETERMINISTIC,
    });

    rawList.push({
      id: 'rec-mynumber-address-update',
      title: 'Cập nhật địa chỉ mới trên Thẻ My Number (trong 14 ngày)',
      description: 'Phải cập nhật địa chỉ và gia hạn chứng thư số trên Thẻ My Number tại quầy hành chính. Quá 90 ngày thẻ sẽ tự động bị vô hiệu hóa.',
      reasonCode: RECOMMENDATION_REASON_CODES.MYNUMBER_ADDRESS_UPDATE,
      priority: Priority.REQUIRED,
      timing: Timing.AFTER_EVENT,
      jurisdiction: Jurisdiction.MUNICIPAL,
      deadlineClass: '14_DAYS',
      deadline: { statutoryLimitDays: 14 },
      capabilityId: 'documents.mynumber.guide',
      confidenceType: ConfidenceType.DETERMINISTIC,
    });
  }

  // 4. Đoàn tụ gia đình (Family Joining)
  if (isFamilyJoining) {
    rawList.push({
      id: 'rec-family-coe-application',
      title: 'Nộp hồ sơ xin Tư cách Lưu trú (COE) diện Visa Gia đình (Kazoku Taizai)',
      description: 'Chuẩn bị chứng minh tài chính, thu nhập (Kazei/Nouzei Shomeisho) và quan hệ hôn nhân/huyết thống nộp tại Cục Quản lý Xuất nhập cảnh.',
      reasonCode: RECOMMENDATION_REASON_CODES.FAMILY_COE_PROCEDURE,
      priority: Priority.REQUIRED,
      timing: Timing.BEFORE_EVENT,
      jurisdiction: Jurisdiction.NATIONAL,
      capabilityId: 'immigration.familyImmigration.guide',
      confidenceType: ConfidenceType.DETERMINISTIC,
    });

    rawList.push({
      id: 'rec-family-dependent-kenpo',
      title: 'Đăng ký người thân vào BHYT phụ thuộc (Fuyo Kenpo) và Lương hưu Loại 3',
      description: 'Khi vợ/chồng sang Nhật và có thu nhập ước tính dưới 1.300.000 yên/năm, làm thủ tục phụ thuộc bảo hiểm để được miễn phí đóng bảo hiểm.',
      reasonCode: RECOMMENDATION_REASON_CODES.FAMILY_HEALTH_INSURANCE_DEPENDENT,
      priority: Priority.REQUIRED,
      timing: Timing.AFTER_EVENT,
      jurisdiction: Jurisdiction.NATIONAL,
      capabilityId: 'insurance.health.dependent',
      confidenceType: ConfidenceType.DETERMINISTIC,
    });
  }

  // 5. Rời Nhật & Về nước (Leaving Japan)
  if (isLeavingJapan) {
    rawList.push({
      id: 'rec-leaving-tax-representative',
      title: 'Chỉ định Người đại diện quản lý thuế (Nōzei Kanrinin) trước khi xuất cảnh',
      description: 'Bắt buộc chỉ định người đại diện cư trú tại Nhật để nhận biên lai thuế cư trú và nộp tờ khai hoàn thuế thu nhập cho khoản rút lương hưu sau này.',
      reasonCode: RECOMMENDATION_REASON_CODES.LEAVING_TAX_REPRESENTATIVE,
      priority: Priority.URGENT,
      timing: Timing.BEFORE_EVENT,
      jurisdiction: Jurisdiction.NATIONAL,
      capabilityId: 'tax.japan.calculate',
      confidenceType: ConfidenceType.DETERMINISTIC,
    });

    rawList.push({
      id: 'rec-leaving-nenkin-dattai',
      title: 'Thủ tục xin Rút Tiền Lương Hưu Một Lần (Dattai Ichijikin)',
      description: 'Nộp hồ sơ cho Cơ quan Hưu trí Nhật Bản (Nenkin Kiko) trong vòng 2 năm sau khi xuất cảnh và hủy phiếu cư trú để nhận lại tiền bảo hiểm hưu trí.',
      reasonCode: RECOMMENDATION_REASON_CODES.LEAVING_NENKIN_DATTAI,
      priority: Priority.REQUIRED,
      timing: Timing.AFTER_EVENT,
      jurisdiction: Jurisdiction.NATIONAL,
      capabilityId: 'insurance.pension.national',
      confidenceType: ConfidenceType.DETERMINISTIC,
    });
  }

  // 6. Đến Nhật & Người mới (Starting Life)
  if (isNewArrival) {
    rawList.push({
      id: 'rec-starting-life-address-reg',
      title: 'Đăng ký địa chỉ cư trú trên Thẻ cư trú tại Ủy ban (14 ngày)',
      description: 'Trong vòng 14 ngày sau khi ổn định nơi ở, phải mang Thẻ cư trú đến Tòa thị chính quận/huyện để làm thủ tục Tennyu Todoke.',
      reasonCode: RECOMMENDATION_REASON_CODES.STARTING_LIFE_ADDRESS_REGISTRATION,
      priority: Priority.URGENT,
      timing: Timing.NOW,
      jurisdiction: Jurisdiction.MUNICIPAL,
      deadlineClass: '14_DAYS',
      deadline: { statutoryLimitDays: 14 },
      capabilityId: 'documents.requirement.check',
      confidenceType: ConfidenceType.DETERMINISTIC,
    });

    rawList.push({
      id: 'rec-starting-life-bank-mobile',
      title: 'Xin Bản sao Phiếu cư trú (Jūminhyō) để mở tài khoản ngân hàng & SIM',
      description: 'Xin cấp 2-3 bản Jūminhyō có ghi My Number để làm thủ tục mở tài khoản Yucho/ngân hàng và đăng ký hợp đồng mạng di động.',
      reasonCode: RECOMMENDATION_REASON_CODES.STARTING_LIFE_BANK_MOBILE,
      priority: Priority.RECOMMENDED,
      timing: Timing.NOW,
      jurisdiction: Jurisdiction.MUNICIPAL,
      capabilityId: 'documents.certificate.guide',
      confidenceType: ConfidenceType.DETERMINISTIC,
    });
  }

  // 7. Gia hạn Visa sắp hết hạn
  if (isVisaExpiring) {
    rawList.push({
      id: 'rec-visa-renewal-3months',
      title: 'Nộp hồ sơ Gia hạn Thời hạn Lưu trú (Visa Renewal) trước 3 tháng',
      description: 'Cục Quản lý Xuất nhập cảnh tiếp nhận hồ sơ gia hạn từ 3 tháng trước ngày hết hạn. Tránh nộp sát ngày để phòng ngừa rủi ro chậm trễ.',
      reasonCode: RECOMMENDATION_REASON_CODES.VISA_RENEWAL_3MONTHS,
      priority: Priority.URGENT,
      timing: Timing.NOW,
      jurisdiction: Jurisdiction.NATIONAL,
      capabilityId: 'immigration.residenceRenewal.guide',
      confidenceType: ConfidenceType.DETERMINISTIC,
    });
  }

  // Nếu không có khuyến nghị nào được kích hoạt theo context, cung cấp khuyến nghị mặc định
  if (rawList.length === 0) {
    rawList.push({
      id: 'rec-general-navigator-explore',
      title: 'Khám phá Lộ trình Thủ tục Cuộc sống tại Nhật (Japan Life Navigator)',
      description: 'Lựa chọn sự kiện đời sống phù hợp (Đến Nhật, Chuyển việc, Sinh con, Đổi nhà, Về nước) để được định hướng toàn diện.',
      reasonCode: 'REASON_GENERAL_NAVIGATOR',
      priority: Priority.RECOMMENDED,
      timing: Timing.AFTER_EVENT,
      jurisdiction: Jurisdiction.NATIONAL,
      capabilityId: 'navigator.japanLife',
      confidenceType: ConfidenceType.DETERMINISTIC,
    });
    rawList.push({
      id: 'rec-general-tax-check',
      title: 'Mô phỏng Thuế Thu nhập, Thuế Cư trú & BHXH 2026',
      description: 'Dự toán chính xác mức thuế thu nhập, thuế cư trú và số tiền thực nhận (Take-home pay) theo mức lương của bạn.',
      reasonCode: 'REASON_GENERAL_TAX_CHECK',
      priority: Priority.OPTIONAL,
      timing: Timing.LATER,
      jurisdiction: Jurisdiction.NATIONAL,
      capabilityId: 'tax.japan.calculate',
      confidenceType: ConfidenceType.DETERMINISTIC,
    });
  }

  return evaluateAndRankRecommendations(rawList, context);
}
