/**
 * @file packages/core/src/navigator/recommendations/recommendationEngine.js
 * @description
 * Recommendation Engine for Japan Life Navigator.
 * Evaluates NavigatorContext against registered deterministic rules,
 * resolves capabilities, checks locality coverage, and outputs ranked recommendations.
 */

import {
  createRecommendation,
  ConfidenceType,
  Coverage,
} from './recommendationContract.js';
import { resolveCapability } from '../capabilityGraph/capabilityResolver.js';
import { rankRecommendations } from '../ranking/recommendationRanker.js';

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
    if (rec.jurisdiction === 'municipal') {
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
