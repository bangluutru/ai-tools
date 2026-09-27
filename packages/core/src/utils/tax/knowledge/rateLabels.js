/**
 * @file packages/core/src/utils/tax/knowledge/rateLabels.js
 * @description Tạo nhãn tỷ lệ (rate label) từ dữ liệu engine — không hardcode con số.
 */

/** 0.0985 → "9.85%" (bỏ số 0 thừa) */
export function formatPercent(rate, maxDigits = 3) {
  const value = Number(rate) || 0;
  const pct = (value * 100).toFixed(maxDigits).replace(/\.?0+$/, '');
  return `${pct}%`;
}

/**
 * Nhãn cho danh sách giai đoạn tỷ lệ [{ rate, fromMonth, toMonth, months }].
 * @param {Array} periods
 * @param {object} [opts]
 * @param {number} [opts.share=1] - hệ số nhân (vd. 0.5 để hiển thị phần NLĐ)
 * @param {string} [opts.lang='ja']
 */
export function formatRatePeriods(periods = [], { share = 1, lang = 'ja' } = {}) {
  const active = periods.filter((p) => p.rate > 0);
  if (active.length === 0) return '0%';
  if (active.length === 1 && active[0].months === 12) {
    return formatPercent(active[0].rate * share);
  }
  const monthWord = lang === 'ja' ? '月' : lang === 'vi' ? 'T' : 'M';
  return active
    .map((p) => {
      const from = Number(String(p.fromMonth).slice(5, 7));
      const to = Number(String(p.toMonth).slice(5, 7));
      const range = lang === 'ja' ? `${from}〜${to}${monthWord}分` : `${monthWord}${from}–${monthWord}${to}`;
      return `${formatPercent(p.rate * share)} (${range})`;
    })
    .join(' / ');
}

/** 1000 → "¥1,000" */
export function formatYen(amount) {
  return '¥' + Math.round(Number(amount) || 0).toLocaleString('en-US');
}
