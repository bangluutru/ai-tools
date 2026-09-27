/**
 * @file packages/core/src/japan/immigration/shared/immigrationFeeTable.js
 * @description
 * BẢNG LỆ PHÍ DUY NHẤT (single source of truth) cho các thủ tục lưu trú của ISA.
 * Mọi engine (gia hạn, đổi tư cách, vĩnh trú, gia đình, rời Nhật, chuyển việc) phải đọc từ đây.
 *
 * Nguồn chính thức (đã kiểm chứng 2026-09-27):
 * - https://www.moj.go.jp/isa/01_00644.html  (令和8年10月1日付け在留許可手数料の額の改定等について + poster PDF)
 * - https://www.moj.go.jp/isa/11_00107.html  (オンライン申請における手数料額及び手数料納付方法 — 決済手数料)
 * - https://www.moj.go.jp/isa/applications/faq/01_00650.html (Q&A)
 * - https://www.moj.go.jp/isa/10_00273.html  (減額・免除措置)
 * - https://www.moj.go.jp/isa/immigration/procedures/16-5.html (再入国許可: 4,000/7,000円, online 3,500/6,500円)
 * - https://www.moj.go.jp/isa/applications/procedures/16-9.html (就労資格証明書: 2,000円, online 1,600円)
 *
 * Quy tắc then chốt:
 * 1. Mức phí xác định theo NGÀY TIẾP NHẬN hồ sơ (受付日), không phải ngày cấp phép:
 *    hồ sơ được tiếp nhận đến hết 30/09/2026 nộp mức cũ dù được cấp phép sau 01/10/2026.
 * 2. Từ 01/10/2026, phí 変更/更新 phụ thuộc THỜI HẠN LƯU TRÚ ĐƯỢC CẤP (許可に係る在留期間) — chỉ biết khi có kết quả.
 * 3. Nộp online từ 01/10/2026: chỉ thanh toán コンビニ/銀行決済 (không dùng 収入印紙) + phí thanh toán riêng.
 * 4. 永住許可 chỉ nộp tại quầy (窓口).
 */

import { parseLocalDate, formatLocalDate, todayLocalISO } from './localDate.js';

export const FEE_REVISION_2026_EFFECTIVE_DATE = '2026-10-01';

export const FEE_OFFICIAL_URLS = Object.freeze({
  revision: 'https://www.moj.go.jp/isa/01_00644.html',
  onlineFees: 'https://www.moj.go.jp/isa/11_00107.html',
  faq: 'https://www.moj.go.jp/isa/applications/faq/01_00650.html',
  reduction: 'https://www.moj.go.jp/isa/10_00273.html',
  reentry: 'https://www.moj.go.jp/isa/immigration/procedures/16-5.html',
  authorizedEmploymentCertificate: 'https://www.moj.go.jp/isa/applications/procedures/16-9.html',
});

/** Mức phí trước cải cách (áp dụng từ 2025-04-01 cho hồ sơ tiếp nhận đến 2026-09-30). */
export const PRE_2026_10_FEES = Object.freeze({
  change: { counter: 6000, online: 5500 },
  renewal: { counter: 6000, online: 5500 },
  permanent: { counter: 10000, online: null },
});

/**
 * Bậc phí theo thời hạn lưu trú được cấp (hồ sơ tiếp nhận từ 2026-10-01).
 * onlinePaymentFee: phí thanh toán cho đơn vị thanh toán chỉ định (決済手数料).
 */
export const PERIOD_OF_STAY_FEE_TIERS = Object.freeze([
  { id: 'upTo3m', counter: 10000, online: 10000, onlinePaymentFee: 330, label_ja: '3月以下', label_vi: 'Từ 3 tháng trở xuống', label_en: '3 months or less' },
  { id: 'over3mTo6m', counter: 18000, online: 15000, onlinePaymentFee: 330, label_ja: '3月超6月以下', label_vi: 'Trên 3 tháng đến 6 tháng', label_en: 'Over 3 up to 6 months' },
  { id: 'over6mUnder1y', counter: 25000, online: 21000, onlinePaymentFee: 330, label_ja: '6月超1年未満', label_vi: 'Trên 6 tháng, dưới 1 năm', label_en: 'Over 6 months, under 1 year' },
  { id: '1y', counter: 33000, online: 27000, onlinePaymentFee: 330, label_ja: '1年', label_vi: '1 năm', label_en: '1 year' },
  { id: 'over1yUnder3y', counter: 48000, online: 42000, onlinePaymentFee: 330, label_ja: '1年超3年未満', label_vi: 'Trên 1 năm, dưới 3 năm', label_en: 'Over 1 year, under 3 years' },
  { id: '3yUnder5y', counter: 64000, online: 56000, onlinePaymentFee: 550, label_ja: '3年以上5年未満', label_vi: 'Từ 3 năm đến dưới 5 năm (vd: visa 3 năm)', label_en: '3 years to under 5 years' },
  { id: '5yPlus', counter: 75000, online: 65000, onlinePaymentFee: 550, label_ja: '5年以上', label_vi: 'Từ 5 năm trở lên (vd: visa 5 năm)', label_en: '5 years or more' },
]);

export const DEFAULT_EXPECTED_PERIOD_TIER = '1y';

/** 永住許可 (hồ sơ tiếp nhận từ 2026-10-01) — chỉ nộp tại quầy. */
export const POST_2026_10_PERMANENT_RESIDENCE_FEE = 200000;

/** Mức phí sau khi được giảm (減額措置) — chỉ áp dụng khi nộp tại quầy. */
export const REDUCED_FEES_2026_10 = Object.freeze({ change: 10000, renewal: 10000, permanent: 20000 });

/** Các lệ phí khác (không đổi ngày 2026-10-01; online từ 2026-10-01 cộng phí thanh toán 220円). */
export const OTHER_IMMIGRATION_FEES = Object.freeze({
  reentrySingle: { counter: 4000, online: 3500 },
  reentryMultiple: { counter: 7000, online: 6500 },
  authorizedEmploymentCertificate: { counter: 2000, online: 1600 },
  onlinePaymentFeeFrom2026Oct: 220,
  certificateOfEligibility: 0,
  permissionForExtraActivity: 0,
  statusAcquisition: 0,
});

/**
 * Chuyển số tháng lưu trú dự kiến sang bậc phí.
 * @param {number} months
 * @returns {string} tier id
 */
export function periodMonthsToTierId(months) {
  const m = Number(months);
  if (!Number.isFinite(m) || m <= 0) return DEFAULT_EXPECTED_PERIOD_TIER;
  if (m <= 3) return 'upTo3m';
  if (m <= 6) return 'over3mTo6m';
  if (m < 12) return 'over6mUnder1y';
  if (m === 12) return '1y';
  if (m < 36) return 'over1yUnder3y';
  if (m < 60) return '3yUnder5y';
  return '5yPlus';
}

/**
 * Mức phí có thuộc chế độ mới (hồ sơ tiếp nhận từ 2026-10-01) hay không.
 * @param {string|Date} acceptanceDate
 * @returns {boolean}
 */
export function isPost2026FeeRegime(acceptanceDate) {
  const d = parseLocalDate(acceptanceDate) || parseLocalDate(todayLocalISO());
  return formatLocalDate(d) >= FEE_REVISION_2026_EFFECTIVE_DATE;
}

const TRANSITION_NOTE = {
  ja: '2026年9月30日までに受付された申請は、許可が10月1日以降でも改定前の手数料（変更・更新：窓口6,000円／オンライン5,500円、永住：10,000円）です。2026年10月1日以降に受付された申請は、許可される在留期間に応じて手数料が決まります（永住許可は200,000円）。',
  vi: 'Hồ sơ được Cục XNC TIẾP NHẬN đến hết ngày 30/09/2026 vẫn nộp mức phí cũ (đổi tư cách/gia hạn: 6.000 yên tại quầy, 5.500 yên online; Vĩnh trú: 10.000 yên) kể cả khi có kết quả sau 01/10/2026. Hồ sơ tiếp nhận từ 01/10/2026: phí tính theo thời hạn lưu trú ĐƯỢC CẤP (Vĩnh trú: 200.000 yên).',
  en: 'Applications accepted by 30 Sep 2026 pay the old fee (change/renewal: 6,000 JPY counter / 5,500 JPY online; permanent residence: 10,000 JPY) even if granted after 1 Oct 2026. Applications accepted from 1 Oct 2026 pay according to the period of stay granted (permanent residence: 200,000 JPY).',
};

const REDUCTION_NOTE = {
  ja: '生活保護受給者など生活に困窮し人道上の配慮が必要な方は、手数料が減額（変更・更新1万円、永住2万円）される場合があります。減額はオンライン申請では対応しておらず、窓口で疎明資料を提出する必要があります。',
  vi: 'Người có hoàn cảnh rất khó khăn (vd: đang nhận trợ cấp sinh hoạt 生活保護, thu nhập năm gần nhất rất thấp) có thể được GIẢM phí (đổi tư cách/gia hạn còn 10.000 yên, Vĩnh trú còn 20.000 yên). Chế độ giảm KHÔNG áp dụng cho nộp online — phải nộp tại quầy kèm giấy tờ chứng minh.',
  en: 'Applicants in severe financial hardship (e.g. public assistance recipients) may qualify for a reduced fee (change/renewal 10,000 JPY, PR 20,000 JPY). Reductions are not available for online applications; apply at the counter with supporting evidence.',
};

/**
 * Tính lệ phí cấp phép lưu trú (変更 / 更新 / 永住).
 *
 * @param {Object} params
 * @param {'change'|'renewal'|'permanent'} params.procedure
 * @param {string|Date} [params.acceptanceDate] - Ngày Cục XNC tiếp nhận hồ sơ (mặc định: hôm nay)
 * @param {'counter'|'online'} [params.method='counter']
 * @param {string} [params.expectedPeriod='1y'] - ID bậc thời hạn dự kiến (xem PERIOD_OF_STAY_FEE_TIERS)
 */
export function getResidencePermitFee({
  procedure = 'renewal',
  acceptanceDate,
  method = 'counter',
  expectedPeriod = DEFAULT_EXPECTED_PERIOD_TIER,
} = {}) {
  const accepted = parseLocalDate(acceptanceDate) || parseLocalDate(todayLocalISO());
  const acceptedISO = formatLocalDate(accepted);
  const isPost = acceptedISO >= FEE_REVISION_2026_EFFECTIVE_DATE;
  const proc = ['change', 'renewal', 'permanent'].includes(procedure) ? procedure : 'renewal';
  let effectiveMethod = method === 'online' ? 'online' : 'counter';
  let onlineNotAvailable = false;
  if (proc === 'permanent' && effectiveMethod === 'online') {
    effectiveMethod = 'counter';
    onlineNotAvailable = true;
  }

  const base = {
    procedure: proc,
    acceptanceDate: acceptedISO,
    method: effectiveMethod,
    onlineNotAvailable,
    currency: 'JPY',
    payableOn: 'issuance',
    regime: isPost ? 'post-2026-10' : 'pre-2026-10',
    effectivePeriod: isPost ? '2026-10-01~' : '2025-04-01~2026-09-30',
    transitionNote_ja: TRANSITION_NOTE.ja,
    transitionNote_vi: TRANSITION_NOTE.vi,
    transitionNote_en: TRANSITION_NOTE.en,
    reductionNote_ja: REDUCTION_NOTE.ja,
    reductionNote_vi: REDUCTION_NOTE.vi,
    reductionNote_en: REDUCTION_NOTE.en,
    officialUrl: FEE_OFFICIAL_URLS.revision,
    faqUrl: FEE_OFFICIAL_URLS.faq,
    reductionUrl: FEE_OFFICIAL_URLS.reduction,
    onlineFeesUrl: FEE_OFFICIAL_URLS.onlineFees,
  };

  const paymentMethod = effectiveMethod === 'online' && isPost
    ? { ja: 'コンビニ決済又は銀行決済のみ（収入印紙不可）＋別途決済手数料', vi: 'Chỉ thanh toán qua combini hoặc ngân hàng (KHÔNG dùng tem 収入印紙) + phí thanh toán riêng', en: 'Convenience store or bank payment only (no revenue stamps) + separate payment fee' }
    : { ja: '収入印紙（許可時に納付）', vi: 'Tem doanh thu 収入印紙 (nộp khi nhận kết quả được cấp phép)', en: 'Revenue stamps (paid upon grant)' };

  if (!isPost) {
    const amount = PRE_2026_10_FEES[proc][effectiveMethod];
    return {
      ...base,
      amount,
      range: { min: amount, max: amount },
      dependsOnGrantedPeriod: false,
      expectedPeriod: null,
      tiers: [],
      onlinePaymentFee: 0,
      totalPayable: amount,
      paymentMethod_ja: paymentMethod.ja,
      paymentMethod_vi: paymentMethod.vi,
      paymentMethod_en: paymentMethod.en,
      legalBasis: '出入国管理及び難民認定法施行令（2025年4月1日改定後の額・2026年9月30日受付分まで）',
    };
  }

  if (proc === 'permanent') {
    return {
      ...base,
      amount: POST_2026_10_PERMANENT_RESIDENCE_FEE,
      range: { min: POST_2026_10_PERMANENT_RESIDENCE_FEE, max: POST_2026_10_PERMANENT_RESIDENCE_FEE },
      dependsOnGrantedPeriod: false,
      expectedPeriod: null,
      tiers: [],
      onlinePaymentFee: 0,
      totalPayable: POST_2026_10_PERMANENT_RESIDENCE_FEE,
      reducedAmount: REDUCED_FEES_2026_10.permanent,
      paymentMethod_ja: paymentMethod.ja,
      paymentMethod_vi: paymentMethod.vi,
      paymentMethod_en: paymentMethod.en,
      legalBasis: '改正入管法施行令第25条第1項（2026年10月1日施行）',
    };
  }

  const tierId = PERIOD_OF_STAY_FEE_TIERS.some((t) => t.id === expectedPeriod) ? expectedPeriod : DEFAULT_EXPECTED_PERIOD_TIER;
  const tiers = PERIOD_OF_STAY_FEE_TIERS.map((t) => ({
    id: t.id,
    label_ja: t.label_ja,
    label_vi: t.label_vi,
    label_en: t.label_en,
    amount: t[effectiveMethod],
    onlinePaymentFee: effectiveMethod === 'online' ? t.onlinePaymentFee : 0,
    isExpected: t.id === tierId,
  }));
  const expectedTier = tiers.find((t) => t.isExpected);
  const amounts = tiers.map((t) => t.amount);

  return {
    ...base,
    amount: expectedTier.amount,
    range: { min: Math.min(...amounts), max: Math.max(...amounts) },
    dependsOnGrantedPeriod: true,
    expectedPeriod: tierId,
    tiers,
    onlinePaymentFee: expectedTier.onlinePaymentFee,
    totalPayable: expectedTier.amount + expectedTier.onlinePaymentFee,
    reducedAmount: REDUCED_FEES_2026_10[proc],
    paymentMethod_ja: paymentMethod.ja,
    paymentMethod_vi: paymentMethod.vi,
    paymentMethod_en: paymentMethod.en,
    legalBasis: '改正入管法施行令第25条第1項（2026年10月1日施行・許可に係る在留期間の区分に応じた額）',
  };
}

/**
 * Lệ phí các thủ tục khác (không phụ thuộc thời hạn).
 * @param {'reentrySingle'|'reentryMultiple'|'authorizedEmploymentCertificate'} kind
 * @param {{ method?: 'counter'|'online', acceptanceDate?: string|Date }} [opts]
 */
export function getOtherImmigrationFee(kind, { method = 'counter', acceptanceDate } = {}) {
  const row = OTHER_IMMIGRATION_FEES[kind];
  if (!row || typeof row !== 'object') return null;
  const m = method === 'online' ? 'online' : 'counter';
  const isPost = isPost2026FeeRegime(acceptanceDate);
  const onlinePaymentFee = m === 'online' && isPost ? OTHER_IMMIGRATION_FEES.onlinePaymentFeeFrom2026Oct : 0;
  return {
    kind,
    method: m,
    amount: row[m],
    counterAmount: row.counter,
    onlineAmount: row.online,
    onlinePaymentFee,
    totalPayable: row[m] + onlinePaymentFee,
    currency: 'JPY',
    officialUrl: kind.startsWith('reentry') ? FEE_OFFICIAL_URLS.reentry : FEE_OFFICIAL_URLS.authorizedEmploymentCertificate,
  };
}

/**
 * Dòng mô tả ngắn phí (dùng cho UI) — hiển thị khoảng phí + bậc dự kiến.
 * @param {ReturnType<typeof getResidencePermitFee>} fee
 * @param {'ja'|'vi'|'en'} lang
 * @returns {string}
 */
export function describeResidencePermitFee(fee, lang = 'vi') {
  const yen = (n) => (lang === 'vi' ? `${n.toLocaleString('de-DE')} yên` : lang === 'en' ? `${n.toLocaleString('en-US')} JPY` : `${n.toLocaleString('ja-JP')}円`);
  if (!fee.dependsOnGrantedPeriod) {
    return yen(fee.amount);
  }
  const tier = fee.tiers.find((t) => t.isExpected);
  const label = lang === 'ja' ? tier.label_ja : lang === 'en' ? tier.label_en : tier.label_vi;
  if (lang === 'ja') return `${yen(fee.range.min)}〜${yen(fee.range.max)}（許可される在留期間で決定。${label}の場合：${yen(fee.amount)}）`;
  if (lang === 'en') return `${yen(fee.range.min)}–${yen(fee.range.max)} (set by the period granted; for ${label}: ${yen(fee.amount)})`;
  return `${yen(fee.range.min)} – ${yen(fee.range.max)} (tùy thời hạn được cấp; nếu được ${label}: ${yen(fee.amount)})`;
}
