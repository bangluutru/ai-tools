/**
 * @file packages/core/src/navigator/intent/intentResolver.js
 * @description
 * Multilingual Intent Resolver for Japan Life Navigator.
 * Deterministically maps natural language queries to Canonical Intent IDs
 * without requiring an LLM at runtime.
 */

import { CANONICAL_INTENTS } from './intentTaxonomy.js';
import { checkQueryAmbiguity } from './intentDisambiguator.js';

/**
 * Chuẩn hóa chuỗi truy vấn (chuyển chữ thường, bỏ khoảng trắng thừa)
 * @param {string} text
 * @returns {string}
 */
export function normalizeQuery(text) {
  if (!text || typeof text !== 'string') {
    return '';
  }
  return text.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Lấy toàn bộ danh sách Canonical Intents
 * @returns {Record<string, any>}
 */
export function getAllIntents() {
  return CANONICAL_INTENTS;
}

/**
 * Lấy chi tiết một intent theo ID
 * @param {string} intentId
 * @returns {Record<string, any> | null}
 */
export function getIntentById(intentId) {
  return CANONICAL_INTENTS[intentId] || null;
}

/**
 * Phân giải truy vấn văn bản tự do của người dùng sang Canonical Intent
 * @param {string} rawQuery
 * @returns {{
 *   intentId: string | null,
 *   targetSituation: string | null,
 *   matchedIntent: Record<string, any> | null,
 *   confidence: 'exact' | 'high' | 'medium' | 'none',
 *   matchedAlias: string | null,
 *   isAmbiguous: boolean,
 *   disambiguation: Record<string, any> | null,
 * }}
 */
export function resolveIntentFromText(rawQuery) {
  const query = normalizeQuery(rawQuery);

  if (!query) {
    return {
      intentId: null,
      targetSituation: null,
      matchedIntent: null,
      confidence: 'none',
      matchedAlias: null,
      isAmbiguous: false,
      disambiguation: null,
    };
  }

  // 1. Kiểm tra trường hợp mơ hồ (Ambiguity Check)
  const ambiguityCheck = checkQueryAmbiguity(query);
  if (ambiguityCheck.isAmbiguous) {
    return {
      intentId: null,
      targetSituation: null,
      matchedIntent: null,
      confidence: 'none',
      matchedAlias: null,
      isAmbiguous: true,
      disambiguation: ambiguityCheck.scenario,
    };
  }

  // 2. Tìm kiếm khớp chính xác (Exact match) với bí danh
  for (const intent of Object.values(CANONICAL_INTENTS)) {
    for (const alias of intent.aliases) {
      const normAlias = normalizeQuery(alias);
      if (query === normAlias) {
        return {
          intentId: intent.id,
          targetSituation: intent.targetSituation,
          matchedIntent: intent,
          confidence: 'exact',
          matchedAlias: alias,
          isAmbiguous: false,
          disambiguation: null,
        };
      }
    }
  }

  // 3. Tìm kiếm khớp chứa chuỗi (Substring / In-text match)
  let bestMatch = null;
  let bestScore = 0;
  let bestAlias = null;

  for (const intent of Object.values(CANONICAL_INTENTS)) {
    for (const alias of intent.aliases) {
      const normAlias = normalizeQuery(alias);
      if (query.includes(normAlias) || normAlias.includes(query)) {
        // Tính điểm ưu tiên: độ dài và tính định hướng
        const isCJK = /[\u4e00-\u9fa5\u3040-\u309f\u30a0-\u30ff]/.test(normAlias);
        let score = isCJK ? normAlias.length * 3 : normAlias.length;
        
        // Nếu câu người dùng chứa trọn vẹn alias (query.includes(normAlias)), ưu tiên cao hơn
        if (query.includes(normAlias)) {
          score += 5;
        }

        if (score > bestScore) {
          bestScore = score;
          bestMatch = intent;
          bestAlias = alias;
        }
      }
    }
  }

  if (bestMatch && bestScore >= 5) {
    return {
      intentId: bestMatch.id,
      targetSituation: bestMatch.targetSituation,
      matchedIntent: bestMatch,
      confidence: bestScore >= 8 ? 'high' : 'medium',
      matchedAlias: bestAlias,
      isAmbiguous: false,
      disambiguation: null,
    };
  }

  return {
    intentId: null,
    targetSituation: null,
    matchedIntent: null,
    confidence: 'none',
    matchedAlias: null,
    isAmbiguous: false,
    disambiguation: null,
  };
}
