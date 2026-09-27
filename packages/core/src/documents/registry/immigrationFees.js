/**
 * @file immigrationFees.js
 * Lệ phí cấp phép lưu trú của Cục Quản lý Xuất nhập cảnh và Lưu trú Nhật Bản (在留許可手数料), có xét ngày nộp hồ sơ.
 *
 * Nguồn chính thức (kiểm tra 2026-09-27):
 *  - https://www.moj.go.jp/isa/01_00644.html  (令和8年10月1日付け在留許可手数料の額の改定等について)
 *  - https://www.moj.go.jp/isa/11_00107.html  (オンライン申請における手数料額 — 2026-10-01 trở đi, cộng phí thanh toán 330円/550円)
 *  - https://www.moj.go.jp/isa/applications/faq/01_00650.html (Q&A)
 *
 * Quy tắc áp dụng: căn cứ NGÀY TIẾP NHẬN hồ sơ (受付日), không phải ngày được cấp phép.
 * Hồ sơ tiếp nhận đến hết 2026-09-30 → mức cũ, kể cả khi được cấp phép sau 2026-10-01.
 */

export const IMMIGRATION_FEE_REVISION_DATE = '2026-10-01';

export const IMMIGRATION_FEE_SOURCES = [
  'https://www.moj.go.jp/isa/01_00644.html',
  'https://www.moj.go.jp/isa/11_00107.html',
];

/** Mức phí trước cải cách (hồ sơ tiếp nhận đến hết 2026-09-30). */
const LEGACY_FEES = {
  change_renewal: { counter: 6000, online: 5500 },
  permanent: { counter: 10000, online: 10000 },
};

/**
 * Mức phí từ hồ sơ tiếp nhận 2026-10-01 — theo thời hạn lưu trú được cấp.
 * maxMonths: cận trên (bao gồm) theo tháng; null = không giới hạn.
 */
const REVISED_CHANGE_RENEWAL_BANDS = [
  { id: 'le_3m', labelVi: '≤ 3 tháng', labelJa: '3月以下', counter: 10000, online: 10000 },
  { id: 'gt_3m_le_6m', labelVi: 'trên 3 đến 6 tháng', labelJa: '3月超6月以下', counter: 18000, online: 15000 },
  { id: 'gt_6m_lt_1y', labelVi: 'trên 6 tháng đến dưới 1 năm', labelJa: '6月超1年未満', counter: 25000, online: 21000 },
  { id: 'eq_1y', labelVi: '1 năm', labelJa: '1年', counter: 33000, online: 27000 },
  { id: 'gt_1y_lt_3y', labelVi: 'trên 1 năm đến dưới 3 năm', labelJa: '1年超3年未満', counter: 48000, online: 42000 },
  { id: 'ge_3y_lt_5y', labelVi: 'từ 3 năm đến dưới 5 năm', labelJa: '3年以上5年未満', counter: 64000, online: 56000 },
  { id: 'ge_5y', labelVi: 'từ 5 năm trở lên', labelJa: '5年以上', counter: 75000, online: 65000 },
];

const REVISED_PERMANENT_FEE = 200000;

function toDateKey(value) {
  if (!value) return null;
  if (typeof value === 'string') {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
    if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  }
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Hồ sơ tiếp nhận vào ngày này có áp dụng mức phí mới không. */
export function isRevisedFeeRegime(applicationDate = new Date()) {
  const key = toDateKey(applicationDate) || toDateKey(new Date());
  return key >= IMMIGRATION_FEE_REVISION_DATE;
}

function bandForMonths(months) {
  if (months == null || !Number.isFinite(Number(months))) return null;
  const mo = Number(months);
  if (mo <= 3) return REVISED_CHANGE_RENEWAL_BANDS[0];
  if (mo <= 6) return REVISED_CHANGE_RENEWAL_BANDS[1];
  if (mo < 12) return REVISED_CHANGE_RENEWAL_BANDS[2];
  if (mo === 12) return REVISED_CHANGE_RENEWAL_BANDS[3];
  if (mo < 36) return REVISED_CHANGE_RENEWAL_BANDS[4];
  if (mo < 60) return REVISED_CHANGE_RENEWAL_BANDS[5];
  return REVISED_CHANGE_RENEWAL_BANDS[6];
}

const fmt = (n) => `${Number(n).toLocaleString('ja-JP')}円`;

/**
 * Tính lệ phí.
 * @param {object} p
 * @param {'change_renewal'|'permanent'} p.kind
 * @param {'counter'|'online'} [p.method='counter']
 * @param {string|Date} [p.applicationDate=new Date()] - ngày dự kiến nộp/tiếp nhận hồ sơ
 * @param {number|null} [p.grantedPeriodMonths=null] - thời hạn lưu trú được cấp (chỉ biết khi có kết quả)
 * @returns {{ regime: 'legacy'|'revised', amountJpy: number|null, minJpy: number, maxJpy: number, band: object|null, noteI18n: object, sources: string[] }}
 */
export function getImmigrationFee({
  kind,
  method = 'counter',
  applicationDate = new Date(),
  grantedPeriodMonths = null,
} = {}) {
  const channel = method === 'online' || method === 'online_portal' ? 'online' : 'counter';
  const revised = isRevisedFeeRegime(applicationDate);
  const onlineExtra = 'Nộp trực tuyến từ 01/10/2026: thanh toán qua combini/ngân hàng, cộng phí thanh toán (決済手数料) 330円 với thời hạn dưới 3 năm hoặc 550円 với thời hạn từ 3 năm trở lên (theo moj.go.jp/isa/11_00107.html).';

  if (!revised) {
    const amount = LEGACY_FEES[kind]?.[channel] ?? null;
    return {
      regime: 'legacy',
      amountJpy: amount,
      minJpy: amount ?? 0,
      maxJpy: amount ?? 0,
      band: null,
      noteI18n: {
        vi: `Hồ sơ được TIẾP NHẬN đến hết 30/09/2026: ${fmt(amount)} (${channel === 'online' ? 'trực tuyến' : 'tại quầy, tem 収入印紙'}), nộp khi nhận kết quả. Hồ sơ tiếp nhận từ 01/10/2026 áp dụng biểu phí mới theo thời hạn được cấp (xem moj.go.jp/isa/01_00644.html).`,
        ja: `令和8年9月30日までに受付した申請: ${fmt(amount)}（${channel === 'online' ? 'オンライン' : '窓口・収入印紙'}）。10月1日以降の受付分は許可される在留期間に応じた新手数料。`,
        en: `Applications accepted by 2026-09-30: ${fmt(amount)} (${channel}). From 2026-10-01 new fees depend on the period granted.`,
      },
      sources: IMMIGRATION_FEE_SOURCES,
    };
  }

  if (kind === 'permanent') {
    return {
      regime: 'revised',
      amountJpy: REVISED_PERMANENT_FEE,
      minJpy: REVISED_PERMANENT_FEE,
      maxJpy: REVISED_PERMANENT_FEE,
      band: null,
      noteI18n: {
        vi: `Hồ sơ vĩnh trú tiếp nhận từ 01/10/2026: ${fmt(REVISED_PERMANENT_FEE)}, nộp khi được cấp phép.${channel === 'online' ? ' ' + onlineExtra : ''}`,
        ja: `令和8年10月1日以降受付の永住許可: ${fmt(REVISED_PERMANENT_FEE)}`,
        en: `Permanent residence applications accepted from 2026-10-01: ${fmt(REVISED_PERMANENT_FEE)}`,
      },
      sources: IMMIGRATION_FEE_SOURCES,
    };
  }

  const band = bandForMonths(grantedPeriodMonths);
  const values = REVISED_CHANGE_RENEWAL_BANDS.map((b) => b[channel]);
  const minJpy = Math.min(...values);
  const maxJpy = Math.max(...values);
  const table = REVISED_CHANGE_RENEWAL_BANDS.map((b) => `${b.labelVi}: ${fmt(b[channel])}`).join('; ');
  return {
    regime: 'revised',
    amountJpy: band ? band[channel] : null,
    minJpy: band ? band[channel] : minJpy,
    maxJpy: band ? band[channel] : maxJpy,
    band,
    noteI18n: {
      vi: `Hồ sơ tiếp nhận từ 01/10/2026: lệ phí phụ thuộc thời hạn lưu trú ĐƯỢC CẤP (${channel === 'online' ? 'trực tuyến' : 'tại quầy'}) — ${table}. ${band ? `Với thời hạn ${band.labelVi}: ${fmt(band[channel])}.` : `Khoảng ${fmt(minJpy)} – ${fmt(maxJpy)}; số tiền chính xác chỉ biết khi có kết quả.`}${channel === 'online' ? ' ' + onlineExtra : ''}`,
      ja: `令和8年10月1日以降受付分は許可される在留期間により${fmt(minJpy)}〜${fmt(maxJpy)}（${channel === 'online' ? 'オンライン' : '窓口'}）。`,
      en: `Applications accepted from 2026-10-01: ${fmt(minJpy)}–${fmt(maxJpy)} depending on period granted (${channel}).`,
    },
    sources: IMMIGRATION_FEE_SOURCES,
  };
}

export const REVISED_IMMIGRATION_FEE_BANDS = REVISED_CHANGE_RENEWAL_BANDS;
