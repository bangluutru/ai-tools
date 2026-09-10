/**
 * @file packages/core/src/japan/housing/index.js
 * @description
 * Điểm xuất khẩu đồng nhất cho tên miền Nhà ở & Chuyển nhà Nhật Bản (Japan Housing & Moving).
 */

// M4: Moving Cost Simulator (引越し費用シミュレーター)
export * from './rules/movingCostRules.js';
export * from './engines/movingCostEngine.js';

// M5: Moving Admin Procedure Checker (引越し行政手続きナビ)
export * from './rules/movingAdminRules.js';
export * from './engines/movingAdminEngine.js';
