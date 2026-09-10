/**
 * @file packages/core/src/japan/immigration/index.js
 * @description
 * Điểm xuất khẩu đồng nhất cho miền Quản lý Cư trú & Xuất nhập cảnh Nhật Bản (Japan Residence & Immigration).
 * 
 * Tuân thủ nghiêm ngặt:
 * 1. Zero Cross-Domain Direct Imports (Không import chéo sang Tax, Employment, Insurance, Family, Housing).
 * 2. Tích hợp trực tiếp với Regulatory Foundation (RuleMetadata, SourceRegistry, EffectivePeriod).
 * 3. Hỗ trợ 3 ngôn ngữ (JA / VI / EN) và bảo vệ an toàn thẩm quyền hành chính (Discretion Safety).
 */

// Context
export * from './context/residenceContext.js';

// Status Definitions & Catalog
export * from './status/statusDefinitions.js';
export * from './status/statusCatalog.js';

// M1: Work Scope Checker (在留資格・就労範囲チェッカー)
export * from './workScope/workScopeRules.js';
export * from './workScope/workScopeEngine.js';

// M2: Residence Renewal Guide (在留期間更新ガイド)
export * from './renewal/renewalRules.js';
export * from './renewal/renewalEngine.js';

