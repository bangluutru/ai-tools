/**
 * @file packages/core/src/japan/family/index.js
 * @description
 * Public exports for Japan Life -> Family & Child (家族・子育て) domain.
 */

// Locality & Jurisdiction
export * from './locality/municipalRegistry.js';

// M1: Maternity Allowance (出産手当金)
export * from './rules/maternityAllowanceRules.js';
export * from './engines/maternityAllowanceEngine.js';

// M2: Childcare Leave & Benefit Eligibility (育児休業・給付チェッカー)
export * from './rules/childcareLeaveRules.js';
export * from './engines/childcareLeaveEngine.js';

