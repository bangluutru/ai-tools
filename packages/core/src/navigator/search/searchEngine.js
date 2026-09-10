/**
 * @file packages/core/src/navigator/search/searchEngine.js
 * @description
 * Deterministic Search Engine for Japan Life Navigator.
 * Searches across the 5 entity types (tools, capabilities, life events, procedures, documents).
 * Features:
 * - Multilingual query normalization (Vietnamese unaccented, Japanese Kanji/Kana, English, Romaji)
 * - Deterministic relevance scoring with token & substring weights
 * - Entity type filtering and locale resolution
 * - Contextual boosting based on active NavigatorContext
 */

import { getUnifiedSearchIndex, ENTITY_TYPES } from './unifiedSearchIndex.js';

/**
 * Chuẩn hóa chuỗi tìm kiếm (xóa dấu tiếng Việt, chuyển chữ thường, chuẩn hóa dấu cách)
 * @param {string} text
 * @returns {string}
 */
export function normalizeSearchQuery(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove Vietnamese diacritics
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .normalize('NFC')
    .trim();
}

/**
 * Tách các từ khóa (tokens) có ý nghĩa từ câu truy vấn
 * @param {string} query
 * @returns {Array<string>}
 */
export function tokenizeQuery(query) {
  if (!query) return [];
  const raw = query.toLowerCase().trim();
  const normalized = normalizeSearchQuery(raw);

  // Tách theo khoảng trắng và ký tự đặc biệt
  const rawTokens = raw.split(/[\s,./\-_+]+/).filter((t) => t.length > 0);
  const normTokens = normalized.split(/[\s,./\-_+]+/).filter((t) => t.length > 0);

  // Gộp các tokens duy nhất
  const unique = new Set([...rawTokens, ...normTokens]);
  return Array.from(unique);
}

/**
 * Kiểm tra xem chuỗi có chứa ký tự CJK (Kanji/Kana) hay không
 * @param {string} str
 * @returns {boolean}
 */
function containsCJK(str) {
  return /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/.test(str);
}

/**
 * Tính điểm khớp giữa một mục tìm kiếm và câu truy vấn
 * @param {Object} item - Một mục từ unifiedSearchIndex
 * @param {string} rawQuery - Câu truy vấn gốc
 * @param {string} normalizedQuery - Câu truy vấn đã chuẩn hóa
 * @param {Array<string>} tokens - Danh sách tokens
 * @param {Object} [context={}] - Ngữ cảnh người dùng hiện tại
 * @returns {{ score: number, matchedFields: Array<string> }}
 */
function scoreItem(item, rawQuery, normalizedQuery, tokens, context = {}) {
  let score = 0;
  const matchedFields = [];

  const itemId = item.id.toLowerCase();
  const titleVi = item.title?.vi || '';
  const titleJa = item.title?.ja || '';
  const titleEn = item.title?.en || '';
  const normTitleVi = normalizeSearchQuery(titleVi);
  const normTitleEn = normalizeSearchQuery(titleEn);

  const descVi = item.description?.vi || '';
  const descJa = item.description?.ja || '';
  const descEn = item.description?.en || '';
  const normDescVi = normalizeSearchQuery(descVi);
  const normDescEn = normalizeSearchQuery(descEn);

  const aliases = (item.aliases || []).map((a) => a.toLowerCase());
  const normAliases = aliases.map((a) => normalizeSearchQuery(a));
  const keywords = (item.keywords || []).map((k) => k.toLowerCase());
  const normKeywords = keywords.map((k) => normalizeSearchQuery(k));

  // 1. Exact ID Match (+150)
  if (itemId === rawQuery || itemId === normalizedQuery) {
    score += 150;
    matchedFields.push('id_exact');
  } else if (itemId.includes(rawQuery) || itemId.includes(normalizedQuery)) {
    score += 60;
    matchedFields.push('id_substring');
  }

  // 2. Exact Title Match (+120)
  if (
    rawQuery === titleVi.toLowerCase() ||
    rawQuery === titleJa ||
    rawQuery === titleEn.toLowerCase() ||
    normalizedQuery === normTitleVi ||
    normalizedQuery === normTitleEn
  ) {
    score += 120;
    matchedFields.push('title_exact');
  }

  // 3. Substring in Title (+50)
  if (
    (titleJa && rawQuery.length >= 2 && titleJa.includes(rawQuery)) ||
    (normTitleVi && normTitleVi.includes(normalizedQuery)) ||
    (normTitleEn && normTitleEn.includes(normalizedQuery))
  ) {
    score += 50;
    matchedFields.push('title_substring');
  }

  // 4. Exact / Substring in Aliases (+40 / +25)
  for (let i = 0; i < aliases.length; i++) {
    const a = aliases[i];
    const na = normAliases[i];
    if (a === rawQuery || na === normalizedQuery) {
      score += 40;
      matchedFields.push('alias_exact');
      break;
    } else if (
      (rawQuery.length >= 2 && a.includes(rawQuery)) ||
      (normalizedQuery.length >= 2 && na.includes(normalizedQuery))
    ) {
      score += 25;
      matchedFields.push('alias_substring');
      break;
    }
  }

  // 5. Exact / Substring in Keywords (+30 / +20)
  for (let i = 0; i < keywords.length; i++) {
    const k = keywords[i];
    const nk = normKeywords[i];
    if (k === rawQuery || nk === normalizedQuery) {
      score += 30;
      matchedFields.push('keyword_exact');
      break;
    } else if (
      (rawQuery.length >= 2 && k.includes(rawQuery)) ||
      (normalizedQuery.length >= 2 && nk.includes(normalizedQuery))
    ) {
      score += 20;
      matchedFields.push('keyword_substring');
      break;
    }
  }

  // 6. Token matching: cộng điểm cho từng từ khóa khớp
  let tokenMatches = 0;
  for (const token of tokens) {
    if (token.length < 2) continue;
    let matchedInItem = false;

    if (
      itemId.includes(token) ||
      normTitleVi.includes(token) ||
      titleJa.includes(token) ||
      normTitleEn.includes(token)
    ) {
      matchedInItem = true;
    } else if (
      normAliases.some((a) => a.includes(token)) ||
      normKeywords.some((k) => k.includes(token))
    ) {
      matchedInItem = true;
    }

    if (matchedInItem) {
      tokenMatches++;
      // Ký tự Kanji/Kana mang trọng số cao hơn
      score += containsCJK(token) ? 25 : 15;
    }
  }

  if (tokenMatches > 0) {
    matchedFields.push(`tokens_${tokenMatches}`);
  }

  // 7. Substring in Description (+10)
  if (
    (descJa && rawQuery.length >= 2 && descJa.includes(rawQuery)) ||
    (normDescVi && normDescVi.includes(normalizedQuery)) ||
    (normDescEn && normDescEn.includes(normalizedQuery))
  ) {
    score += 10;
    matchedFields.push('description_substring');
  }

  // 8. Context Boost (+25)
  if (context && typeof context === 'object') {
    // Nếu context đang ở sự kiện đời sống tương ứng
    if (context.currentLifeEventId && item.meta?.lifeEventId === context.currentLifeEventId) {
      score += 30;
      matchedFields.push('context_life_event_match');
    }

    // Context về nghỉ việc / chuyển việc
    if (
      (context.employmentStatus === 'leaving' || context.employmentStatus === 'unemployed') &&
      (item.category === 'employment' || item.id.includes('job') || item.id.includes('unemployment'))
    ) {
      score += 25;
      matchedFields.push('context_employment_boost');
    }

    // Context về sinh con
    if (
      (context.hasBaby || context.householdStatus === 'expecting_baby') &&
      (item.category === 'family' || item.id.includes('birth') || item.id.includes('child'))
    ) {
      score += 25;
      matchedFields.push('context_family_boost');
    }

    // Context về chuyển nhà
    if (
      context.isMoving &&
      (item.category === 'housing' || item.id.includes('moving') || item.id.includes('address'))
    ) {
      score += 25;
      matchedFields.push('context_moving_boost');
    }

    // Context về rời Nhật / về nước
    if (
      context.isLeavingJapan &&
      (item.id.includes('leaving-japan') || item.id.includes('dattai') || item.id.includes('kanrinin'))
    ) {
      score += 25;
      matchedFields.push('context_leaving_japan_boost');
    }
  }

  // 9. Entity Type Base Priority: Life Events và Tools ưu tiên nhẹ so với document rời rạc
  if (item.entityType === ENTITY_TYPES.LIFE_EVENT) {
    score += 5;
  } else if (item.entityType === ENTITY_TYPES.TOOL) {
    score += 3;
  }

  return { score, matchedFields };
}

/**
 * Tìm kiếm trong chỉ mục hợp nhất
 * @param {string} query - Câu truy vấn của người dùng
 * @param {Object} [options={}]
 * @param {Array<string>} [options.types] - Lọc theo entity types (tool, capability, life_event, procedure, document)
 * @param {string} [options.locale='vi'] - Ngôn ngữ hiển thị ưu tiên ('vi' | 'ja' | 'en')
 * @param {number} [options.limit=20] - Giới hạn số lượng kết quả
 * @param {Object} [options.context={}] - Ngữ cảnh NavigatorContext
 * @param {Array<Object>} [options.index] - Tùy chỉnh danh sách index thay vì mặc định
 * @returns {{ query: string, totalCount: number, results: Array<Object> }}
 */
export function searchUnifiedIndex(query, options = {}) {
  const {
    types = null,
    locale = 'vi',
    limit = 20,
    context = {},
    index = null,
  } = options;

  if (!query || typeof query !== 'string' || !query.trim()) {
    return {
      query: '',
      totalCount: 0,
      results: [],
    };
  }

  const rawQuery = query.trim().toLowerCase();
  const normalizedQuery = normalizeSearchQuery(rawQuery);
  const tokens = tokenizeQuery(rawQuery);

  const searchPool = Array.isArray(index) ? index : getUnifiedSearchIndex();
  const allowedTypes = Array.isArray(types) && types.length > 0 ? new Set(types) : null;

  const scoredResults = [];

  for (const item of searchPool) {
    // Lọc theo entity type nếu có yêu cầu
    if (allowedTypes && !allowedTypes.has(item.entityType)) {
      continue;
    }

    const { score, matchedFields } = scoreItem(item, rawQuery, normalizedQuery, tokens, context);

    if (score > 0) {
      const localizedTitle = item.title?.[locale] || item.title?.vi || item.title?.ja || item.title?.en || item.id;
      const localizedDescription = item.description?.[locale] || item.description?.vi || item.description?.ja || item.description?.en || '';

      scoredResults.push({
        entityType: item.entityType,
        id: item.id,
        title: item.title,
        description: item.description,
        localizedTitle,
        localizedDescription,
        category: item.category,
        link: item.link,
        score,
        matchedFields,
        meta: item.meta || {},
      });
    }
  }

  // Sắp xếp giảm dần theo điểm số
  scoredResults.sort((a, b) => b.score - a.score);

  const slicedResults = scoredResults.slice(0, limit);

  return {
    query,
    totalCount: scoredResults.length,
    results: slicedResults,
  };
}
