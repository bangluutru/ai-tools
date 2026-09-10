/**
 * @file packages/core/src/navigator/intent/intentDisambiguator.js
 * @description
 * Disambiguation engine for ambiguous natural language queries.
 * Instead of auto-routing vaguely, asks a single targeted question to guide the user.
 */

/**
 * Các kịch bản mơ hồ thường gặp
 */
export const DISAMBIGUATION_SCENARIOS = Object.freeze({
  'ambiguity.visa.change': {
    id: 'ambiguity.visa.change',
    patterns: [
      'doi visa', 'đổi visa', 'chuyen visa', 'chuyển visa', 'change visa', 'visa change',
      'ビザ変更', '在留資格変更', 'visa henkou',
    ],
    question: {
      vi: 'Bạn đang muốn đổi visa vì lý do gì?',
      ja: '在留資格（ビザ）を変更する主な理由は何ですか？',
      en: 'What is the primary reason for changing your residence status?',
    },
    options: [
      {
        id: 'opt.job.change',
        label: {
          vi: 'Chuyển sang công ty khác (chuyển việc)',
          ja: '別の会社に転職する',
          en: 'Changing to another company (Job change)',
        },
        targetIntentId: 'intent.jp.job.change',
      },
      {
        id: 'opt.student.to.work',
        label: {
          vi: 'Tốt nghiệp từ trường tiếng / senmon / đại học đi làm',
          ja: '留学・進学から就労への変更',
          en: 'Graduating from school to full-time employment',
        },
        targetIntentId: 'intent.jp.residence.renew',
      },
      {
        id: 'opt.marriage',
        label: {
          vi: 'Kết hôn với người Nhật hoặc người có Vĩnh trú',
          ja: '日本人または永住者との結婚',
          en: 'Marriage with Japanese national or permanent resident',
        },
        targetIntentId: 'intent.jp.family.invite',
      },
      {
        id: 'opt.business',
        label: {
          vi: 'Mở công ty / chuyển sang visa Kinh doanh - Quản lý',
          ja: '起業・経営管理ビザへの変更',
          en: 'Starting a business / Business Manager status',
        },
        targetIntentId: 'intent.jp.residence.renew',
      },
    ],
  },

  'ambiguity.tax.document': {
    id: 'ambiguity.tax.document',
    patterns: [
      'giay thue', 'giấy thuế', 'giay to thue', 'giấy tờ thuế', 'tax document', 'tax certificate',
      '税金の書類', '税金の証明書', 'zeikin shoumeisho',
    ],
    question: {
      vi: 'Bạn cần loại giấy tờ thuế nào?',
      ja: 'どの種類の税務関連書類が必要ですか？',
      en: 'Which type of tax-related document do you need?',
    },
    options: [
      {
        id: 'opt.kazei',
        label: {
          vi: 'Giấy chứng nhận thu nhập / thuế thị dân (課税・非課税証明書)',
          ja: '課税・非課税証明書（所得の証明）',
          en: 'Taxation / Tax-Exempt Certificate (Income proof)',
        },
        targetIntentId: 'intent.jp.document.obtain',
      },
      {
        id: 'opt.nouzei',
        label: {
          vi: 'Giấy chứng nhận đã nộp đủ thuế (納税証明書)',
          ja: '納税証明書（未納がないことの証明）',
          en: 'Tax Payment Certificate (Proof of payment / no arrears)',
        },
        targetIntentId: 'intent.jp.document.obtain',
      },
      {
        id: 'opt.gensen',
        label: {
          vi: 'Phiếu khấu trừ thuế thu nhập từ công ty (源泉徴収票)',
          ja: '源泉徴収票（会社から発行される書類）',
          en: 'Withholding Slip from Employer (Gensen Choshuhyo)',
        },
        targetIntentId: 'intent.jp.document.obtain',
      },
    ],
  },
});

/**
 * Kiểm tra xem truy vấn người dùng có rơi vào trường hợp mơ hồ cần hỏi lại không
 * @param {string} query
 * @returns {{
 *   isAmbiguous: boolean,
 *   scenario: typeof DISAMBIGUATION_SCENARIOS[keyof typeof DISAMBIGUATION_SCENARIOS] | null
 * }}
 */
export function checkQueryAmbiguity(query) {
  if (!query || typeof query !== 'string') {
    return { isAmbiguous: false, scenario: null };
  }

  const normalized = query.trim().toLowerCase();

  for (const scenario of Object.values(DISAMBIGUATION_SCENARIOS)) {
    const isMatch = scenario.patterns.some((pattern) => {
      const p = pattern.toLowerCase();
      return normalized === p || normalized.startsWith(p) || normalized.includes(p);
    });

    if (isMatch) {
      return {
        isAmbiguous: true,
        scenario,
      };
    }
  }

  return { isAmbiguous: false, scenario: null };
}

/**
 * Phân giải lựa chọn từ câu hỏi phân định sang Intent ID chính thức
 * @param {string} scenarioId
 * @param {string} selectedOptionId
 * @returns {string | null} Canonical Intent ID hoặc null
 */
export function resolveDisambiguatedOption(scenarioId, selectedOptionId) {
  const scenario = DISAMBIGUATION_SCENARIOS[scenarioId];
  if (!scenario) {
    return null;
  }

  const option = scenario.options.find((opt) => opt.id === selectedOptionId);
  return option ? option.targetIntentId : null;
}
