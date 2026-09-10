/**
 * @file packages/core/src/regulatory/effectivePeriod.js
 * @description Mô hình hóa chu kỳ áp dụng và thời điểm hiệu lực pháp lý (Applicable Period vs Effective Date).
 * Phân định rạch ròi giữa:
 * - calendar-year: Năm dương lịch (01/01 - 31/12)
 * - tax-year: Năm tính thuế áp dụng (ví dụ: 所得税 2026 áp dụng cho toàn bộ thu nhập năm 2026, kể cả khi luật có hiệu lực từ 01/12/2026)
 * - fiscal-year: Năm tài chính nhà nước (ví dụ: 令和8年度 từ 01/04/2026 đến 31/03/2027 cho 国民年金, 雇用保険, 協会けんぽ)
 * - effective-date-range: Khoảng thời gian hiệu lực tuyệt đối [effectiveFrom, effectiveTo]
 */

/**
 * @typedef {'calendar-year' | 'tax-year' | 'fiscal-year' | 'effective-date-range'} ApplicablePeriodType
 *
 * @typedef {Object} ApplicablePeriod
 * @property {ApplicablePeriodType} type - Loại kỳ áp dụng
 * @property {number|string} from - Điểm bắt đầu (năm hoặc ngày YYYY-MM-DD)
 * @property {number|string} [to] - Điểm kết thúc (năm hoặc ngày YYYY-MM-DD)
 */

/**
 * Tạo một cấu trúc ApplicablePeriod chuẩn hóa.
 * @param {ApplicablePeriodType} type
 * @param {number|string} from
 * @param {number|string} [to]
 * @returns {ApplicablePeriod}
 */
export function createApplicablePeriod(typeOrObj, from, to = null) {
  if (typeof typeOrObj === 'object' && typeOrObj !== null) {
    const obj = typeOrObj;
    const resolvedFrom = obj.from ?? obj.taxYear ?? obj.fiscalYear;
    const resolvedTo = obj.to ?? resolvedFrom;
    return Object.freeze({
      type: obj.type || 'calendar-year',
      from: resolvedFrom,
      to: resolvedTo,
    });
  }
  return Object.freeze({
    type: typeOrObj,
    from,
    to: to ?? from,
  });
}

/**
 * Kiểm tra xem một quy tắc có áp dụng cho một ngữ cảnh cụ thể hay không.
 * @param {Object} rule - Rule metadata object
 * @param {Object} context
 * @param {number} [context.taxYear] - Năm tính thuế (ví dụ: 2026)
 * @param {number} [context.fiscalYear] - Năm tài chính (ví dụ: 2026 cho 2026-04 -> 2027-03)
 * @param {string} [context.date] - Ngày cụ thể dạng YYYY-MM-DD
 * @returns {boolean}
 */
export function isRuleApplicable(rule, context = {}) {
  if (!rule) return false;

  const { applicablePeriod, effectiveFrom, effectiveTo } = rule;

  // 1. Kiểm tra ngày hiệu lực tuyệt đối nếu có date trong context
  if (context.date) {
    if (effectiveFrom && context.date < effectiveFrom) return false;
    if (effectiveTo && context.date > effectiveTo) return false;
  }

  // 2. Nếu không có applicablePeriod, fallback theo effectiveFrom/effectiveTo
  if (!applicablePeriod) {
    if (context.taxYear && effectiveFrom) {
      const effYear = parseInt(String(effectiveFrom).substring(0, 4), 10);
      return context.taxYear === effYear;
    }
    return true;
  }

  // 3. Kiểm tra theo từng loại kỳ áp dụng
  switch (applicablePeriod.type) {
    case 'tax-year': {
      if (context.taxYear !== undefined) {
        const fromYear = Number(applicablePeriod.from);
        const toYear = Number(applicablePeriod.to);
        return context.taxYear >= fromYear && context.taxYear <= toYear;
      }
      return true;
    }
    case 'fiscal-year': {
      if (context.fiscalYear !== undefined) {
        const fromFY = Number(applicablePeriod.from);
        const toFY = Number(applicablePeriod.to);
        return context.fiscalYear >= fromFY && context.fiscalYear <= toFY;
      }
      // Nếu context cung cấp date, tự động quy đổi sang Japanese Fiscal Year (01/04 -> 31/03)
      if (context.date) {
        const [y, m] = context.date.split('-').map(Number);
        const calculatedFY = m >= 4 ? y : y - 1;
        const fromFY = Number(applicablePeriod.from);
        const toFY = Number(applicablePeriod.to);
        return calculatedFY >= fromFY && calculatedFY <= toFY;
      }
      return true;
    }
    case 'calendar-year': {
      if (context.taxYear !== undefined) {
        const fromY = Number(applicablePeriod.from);
        const toY = Number(applicablePeriod.to);
        return context.taxYear >= fromY && context.taxYear <= toY;
      }
      return true;
    }
    case 'effective-date-range': {
      if (context.date) {
        return context.date >= String(applicablePeriod.from) && context.date <= String(applicablePeriod.to);
      }
      return true;
    }
    default:
      return true;
  }
}

/**
 * Định dạng nhãn hiển thị cho kỳ áp dụng theo ngôn ngữ.
 * @param {ApplicablePeriod} period
 * @param {'vi' | 'ja' | 'en'} [lang='vi']
 * @returns {string}
 */
export function formatPeriodLabel(period, lang = 'vi') {
  if (!period) return '';
  const { type, from, to } = period;

  if (type === 'tax-year') {
    if (from === to) {
      if (lang === 'ja') return `令和${Number(from) - 2018}年分（${from}年分税制）`;
      if (lang === 'en') return `Tax Year ${from}`;
      return `Kỳ tính thuế năm ${from}`;
    }
    if (lang === 'ja') return `${from}年～${to}年分税制`;
    if (lang === 'en') return `Tax Years ${from}–${to}`;
    return `Kỳ tính thuế ${from}–${to}`;
  }

  if (type === 'fiscal-year') {
    if (from === to) {
      if (lang === 'ja') return `令和${Number(from) - 2018}年度（${from}年度・4月～翌年3月）`;
      if (lang === 'en') return `Fiscal Year ${from} (Apr ${from} – Mar ${Number(from) + 1})`;
      return `Năm tài chính ${from} (04/${from} – 03/${Number(from) + 1})`;
    }
    return `FY ${from}–${to}`;
  }

  return `${from} → ${to}`;
}

/**
 * Trả về năm tài chính Nhật Bản (FY) tương ứng với ngày YYYY-MM-DD.
 * Tháng 4 đến tháng 12: FY = năm hiện tại.
 * Tháng 1 đến tháng 3: FY = năm trước.
 * @param {string|Date} date
 * @returns {number}
 */
export function getJapaneseFiscalYear(date) {
  if (!date) return new Date().getFullYear();
  if (date instanceof Date) {
    const y = date.getFullYear();
    const m = date.getMonth() + 1;
    return m >= 4 ? y : y - 1;
  }
  const [y, m] = String(date).split('-').map(Number);
  return m >= 4 ? y : y - 1;
}

export const EffectivePeriod = {
  create: createApplicablePeriod,
  createApplicablePeriod,
  isRuleApplicable,
  formatPeriodLabel,
  getJapaneseFiscalYear,
  isApplicableForTaxYear(ruleOrPeriod, taxYear) {
    const period = ruleOrPeriod?.applicablePeriod || ruleOrPeriod;
    return isRuleApplicable({ applicablePeriod: period }, { taxYear });
  },
  isApplicableAtDate(ruleOrPeriod, date) {
    const period = ruleOrPeriod?.applicablePeriod || ruleOrPeriod;
    return isRuleApplicable({ applicablePeriod: period }, { date });
  },
};
