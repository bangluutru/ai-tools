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

// M3: Childcare Leave Benefit Simulator (育児休業給付金シミュレーター)
export * from './rules/childcareBenefitRules.js';
export * from './engines/childcareBenefitEngine.js';

// M4: Child Allowance Checker (児童手当チェッカー)
export * from './rules/childAllowanceRules.js';
export * from './engines/childAllowanceEngine.js';

// M5: Birth Wizard & Life-Event Orchestrator (妊娠・出産・育児ガイド)
export * from './rules/birthWizardRules.js';
export * from './rules/birthDefinition.js';
export * from './engines/birthWizardEngine.js';


