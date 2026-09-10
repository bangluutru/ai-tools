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

// M3: Affiliation Change Checker (転職・所属機関変更チェッカー)
export * from './affiliation/affiliationRules.js';
export * from './affiliation/affiliationEngine.js';

// M4: Status Change Guide (在留資格変更ガイド)
export * from './statusChange/statusChangeRules.js';
export * from './statusChange/statusChangeEngine.js';

// M5: Family Immigration Guide (家族滞在・家族呼寄せガイド)
export * from './family/familyRules.js';
export * from './family/familyEngine.js';

// M6: Permanent Residence Readiness Checker (永住申請準備度チェッカー)
export * from './permanentResidence/prRules.js';
export * from './permanentResidence/prEngine.js';

// M7: Arriving in Japan Setup Guide (来日後セットアップガイド - 4th Life Event)
export * from './arrival/arrivalRules.js';
export * from './arrival/arrivalEngine.js';
export * from './arrival/arrivalDefinition.js';

// M8: Leaving Japan Procedure Guide (日本を離れる手続きガイド - 5th Life Event)
export * from './departure/departureRules.js';
export * from './departure/departureEngine.js';
export * from './departure/departureDefinition.js';
