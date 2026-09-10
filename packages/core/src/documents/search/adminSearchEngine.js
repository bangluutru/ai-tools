/**
 * @file adminSearchEngine.js
 * Intelligent Multilingual Search & Disambiguation Engine for Administrative Procedures & Documents.
 * 
 * CORE RULES:
 * 1. Multilingual alias matching (Kanji, Hiragana, Vietnamese, English).
 * 2. Disambiguation cards for ambiguous terms (e.g. "thuế", "納税証明", "hộ tịch").
 * 3. Structured intent routing to specific Phase 8 tools.
 */

import { findDocumentsByQuery, getAllDocuments } from '../resolvers/documentResolver.js';
import { findProceduresByQuery, getAllProcedures } from '../resolvers/procedureRequirementResolver.js';

export const DISAMBIGUATION_CARDS = {
  tax_certificate_ambiguity: {
    id: 'disambiguation.tax-certificates',
    triggerKeywords: [
      'tax',
      'thuế',
      'thue',
      'nộp thuế',
      'nop thue',
      'đóng thuế',
      'dong thue',
      'thu nhập',
      'thu nhap',
      '課税',
      '納税',
      '所得',
      '税金',
      'ぜいきん',
    ],
    titleJa: '税の証明書：どれが必要ですか？',
    titleI18n: {
      ja: '税の証明書：どれが必要ですか？',
      vi: 'Bạn cần loại giấy tờ thuế nào? (Phân biệt 4 loại giấy)',
      en: 'Which tax certificate do you actually need?',
    },
    options: [
      {
        documentId: 'document.taxation-certificate',
        titleJa: '住民税課税（非課税）証明書',
        descI18n: {
          ja: '前年の「所得金額」と決定された「住民税額」を証明（1月1日時点の市区町村で取得）。',
          vi: 'Chứng nhận tổng thu nhập và mức thuế cư trú được tính trong năm (Lấy tại Tòa thị chính nơi ở ngày 1/1).',
          en: 'Certifies prior year income and assessed inhabitant tax (issued by Jan 1 municipality).',
        },
        targetTool: 'certificate-acquisition-guide-jp',
      },
      {
        documentId: 'document.tax-payment-certificate',
        titleJa: '住民税納税証明書',
        descI18n: {
          ja: '課税された住民税を「実際に納付したこと」「未納がないこと」を証明。',
          vi: 'Chứng nhận đã thực tế nộp đủ thuế cư trú, không còn nợ đọng (Lấy tại Tòa thị chính).',
          en: 'Certifies that assessed inhabitant tax was actually paid with zero arrears.',
        },
        targetTool: 'certificate-acquisition-guide-jp',
      },
      {
        documentId: 'document.national-tax-payment-cert',
        titleJa: '国税納税証明書（その1〜その3）',
        descI18n: {
          ja: '所得税・消費税等の国税に未納がないことを証明（市役所ではなく「税務署」で取得）。',
          vi: 'Chứng nhận nộp thuế quốc gia (thuế thu nhập, tiêu dùng). Lấy tại Chi cục Thuế Zeimusho, KHÔNG lấy ở Tòa thị chính.',
          en: 'Certifies national tax payment status. Obtained at National Tax Office (Zeimusho), NOT city hall.',
        },
        targetTool: 'certificate-acquisition-guide-jp',
      },
      {
        documentId: 'document.withholding-tax-slip',
        titleJa: '給与所得の源泉徴収票',
        descI18n: {
          ja: '1年間の給与総額と天引き税額を勤務先が発行（役所ではなく「会社」で取得）。',
          vi: 'Phiếu tổng kết thu nhập và thuế khấu trừ do Doanh nghiệp phát hành sau年末調整 (Lấy tại Công ty).',
          en: 'Withholding slip showing salary and taxes withheld. Issued by your Employer, NOT government.',
        },
        targetTool: 'certificate-acquisition-guide-jp',
      },
    ],
  },

  family_register_ambiguity: {
    id: 'disambiguation.family-register',
    triggerKeywords: [
      'koseki',
      '戸籍',
      'こせき',
      'hộ tịch',
      'ho tich',
      'family register',
      'koseki tohon',
      'koseki shohon',
    ],
    titleJa: '戸籍の証明書：どれが必要ですか？',
    titleI18n: {
      ja: '戸籍の証明書：どれが必要ですか？',
      vi: 'Bạn cần loại giấy tờ Hộ tịch nào? (Toàn bộ hay Cá nhân hay Lịch sử địa chỉ)',
      en: 'Which family register certificate do you need?',
    },
    options: [
      {
        documentId: 'document.family-register-full',
        titleJa: '戸籍全部事項証明書（戸籍謄本）',
        descI18n: {
          ja: '戸籍内の全員の身分関係を証明。婚姻届やビザ申請では原則こちらが求められます。',
          vi: 'Ghi toàn bộ thành viên trong hộ tịch. Hồ sơ kết hôn và visa thường yêu cầu bản này.',
          en: 'Covers all household members. Generally required for marriage and immigration.',
        },
        targetTool: 'certificate-acquisition-guide-jp',
      },
      {
        documentId: 'document.family-register-individual',
        titleJa: '戸籍個人事項証明書（戸籍抄本）',
        descI18n: {
          ja: '特定の個人1名のみを抜粋して証明。',
          vi: 'Chỉ trích lục riêng thông tin của một người.',
          en: 'Extracts record for one specific individual only.',
        },
        targetTool: 'certificate-acquisition-guide-jp',
      },
      {
        documentId: 'document.family-register-tag',
        titleJa: '戸籍の附票の写し',
        descI18n: {
          ja: '過去から現在までのすべての「住所の履歴」を証明。',
          vi: 'Ghi lại toàn bộ chuỗi lịch sử thay đổi địa chỉ cư trú qua các thời kỳ.',
          en: 'Certifies complete historical chain of all residential addresses.',
        },
        targetTool: 'certificate-acquisition-guide-jp',
      },
    ],
  },
};

/**
 * Execute unified administrative search.
 * 
 * @param {string} query - Raw search query
 * @returns {object} { matchedDocuments, matchedProcedures, disambiguationCard }
 */
export function searchAdministrativeDomain(query) {
  if (!query || typeof query !== 'string') {
    return {
      matchedDocuments: [],
      matchedProcedures: [],
      disambiguationCard: null,
    };
  }

  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return {
      matchedDocuments: [],
      matchedProcedures: [],
      disambiguationCard: null,
    };
  }

  // 1. Check for disambiguation trigger
  let disambiguationCard = null;
  for (const card of Object.values(DISAMBIGUATION_CARDS)) {
    if (card.triggerKeywords.some((kw) => normalized.includes(kw) || kw.includes(normalized))) {
      disambiguationCard = card;
      break;
    }
  }

  // 2. Search documents
  const matchedDocuments = findDocumentsByQuery(normalized);

  // 3. Search procedures
  const matchedProcedures = findProceduresByQuery(normalized);

  return {
    query,
    matchedDocuments,
    matchedProcedures,
    disambiguationCard,
    hasResults: matchedDocuments.length > 0 || matchedProcedures.length > 0 || Boolean(disambiguationCard),
  };
}
