/**
 * @file packages/core/src/navigator/ranking/recommendationRanker.js
 * @description
 * Deterministic recommendation ranker for Japan Life Navigator.
 * Orders recommendations based on legal urgency, statutory deadlines, timing, and procedural precedence.
 */

import { Priority, Timing } from '../recommendations/recommendationContract.js';

const PRIORITY_WEIGHTS = Object.freeze({
  [Priority.URGENT]: 1000,
  [Priority.REQUIRED]: 800,
  [Priority.RECOMMENDED]: 600,
  [Priority.OPTIONAL]: 400,
  [Priority.INFORMATIONAL]: 200,
});

const TIMING_WEIGHTS = Object.freeze({
  [Timing.NOW]: 500,
  [Timing.BEFORE_EVENT]: 400,
  [Timing.ON_EVENT]: 300,
  [Timing.AFTER_EVENT]: 200,
  [Timing.LATER]: 100,
});

/**
 * Tính điểm xếp hạng tất định cho một khuyến nghị
 * @param {Record<string, any>} rec
 * @returns {number}
 */
export function calculateRecommendationScore(rec) {
  let score = 0;

  // Trọng số mức độ ưu tiên
  const priorityScore = PRIORITY_WEIGHTS[rec.priority] ?? PRIORITY_WEIGHTS[Priority.RECOMMENDED];
  score += priorityScore;

  // Trọng số thời điểm
  const timingScore = TIMING_WEIGHTS[rec.timing] ?? TIMING_WEIGHTS[Timing.NOW];
  score += timingScore;

  // Điểm cộng hạn chót luật định (Statutory deadline urgency)
  if (rec.deadline) {
    const limitDays = rec.deadline.statutoryLimitDays ?? rec.deadline.daysFromEvent;
    if (typeof limitDays === 'number' && limitDays > 0) {
      if (limitDays <= 7) {
        score += 400; // Cực kỳ gấp (trong 7 ngày)
      } else if (limitDays <= 14) {
        score += 300; // Rất gấp (trong 14 ngày - chuẩn thông dụng tại Nhật)
      } else if (limitDays <= 30) {
        score += 150; // Trong 1 tháng
      }
    }
  }

  return score;
}

/**
 * Sắp xếp danh sách khuyến nghị theo thứ tự ưu tiên tất định
 * @param {Array<Record<string, any>>} recommendations
 * @returns {Array<Record<string, any>>}
 */
export function rankRecommendations(recommendations) {
  if (!Array.isArray(recommendations)) {
    return [];
  }

  const scored = recommendations.map((rec) => ({
    rec,
    score: calculateRecommendationScore(rec),
  }));

  // Sắp xếp giảm dần theo điểm số, hòa điểm thì sắp xếp theo ID tăng dần (Deterministic tie-break)
  scored.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return String(a.rec.id).localeCompare(String(b.rec.id));
  });

  return scored.map((item) => item.rec);
}
