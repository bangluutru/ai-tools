/**
 * @file packages/core/src/navigator/capabilityGraph/capabilityResolver.js
 * @description
 * Capability Resolver & Metadata Engine for Japan Life Navigator.
 * Maps semantic capability IDs (e.g. 'employment.unemployment.eligibility') to concrete Tool IDs
 * via CapabilityRegistry, checks coverage status, and safely filters context via accepted fields allowlists.
 */

import {
  resolveCapability as baseResolveCapability,
  buildCapabilityDeepLink as baseBuildCapabilityDeepLink,
  getAllCapabilities as baseGetAllCapabilities,
} from '../../life-events/capability/capabilityRegistry.js';
import { extractHandoffPayload } from '../context/contextSanitizer.js';

/**
 * Metadata mở rộng cho các capabilities trong hệ sinh thái Japan Life
 * Được chuẩn hóa từ JAPAN_LIFE_CAPABILITY_AUDIT.md
 * @type {Record<string, {
 *   domain: string,
 *   type: 'calculator' | 'checker' | 'wizard' | 'guide' | 'helper' | 'navigator',
 *   acceptedContextFields: string[],
 *   producedContextFields: string[],
 *   isRegulatory: boolean,
 *   isLifeEventCompatible: boolean,
 *   coverageStatus: 'covered' | 'partially-covered' | 'guide-only' | 'missing' | 'intentionally-out-of-scope',
 * }>}
 */
export const CAPABILITY_METADATA = Object.freeze({
  // Employment
  'employment.overtime.calculate': {
    domain: 'employment',
    type: 'calculator',
    acceptedContextFields: ['employmentStatus'],
    producedContextFields: ['overtimePayEstimate'],
    isRegulatory: true,
    isLifeEventCompatible: true,
    coverageStatus: 'covered',
  },
  'employment.paidLeave.check': {
    domain: 'employment',
    type: 'checker',
    acceptedContextFields: ['employmentStatus', 'hireDate'],
    producedContextFields: ['grantedLeaveDays'],
    isRegulatory: true,
    isLifeEventCompatible: true,
    coverageStatus: 'covered',
  },
  'employment.unemployment.eligibility': {
    domain: 'employment',
    type: 'checker',
    acceptedContextFields: ['employmentStatus', 'resignationDate', 'insuredMonths'],
    producedContextFields: ['isEligibleForUnemployment'],
    isRegulatory: true,
    isLifeEventCompatible: true,
    coverageStatus: 'covered',
  },
  'employment.unemployment.benefit': {
    domain: 'employment',
    type: 'calculator',
    acceptedContextFields: ['age', 'insuredMonths', 'separationReason'],
    producedContextFields: ['dailyBenefitRate', 'totalBenefitDays'],
    isRegulatory: true,
    isLifeEventCompatible: true,
    coverageStatus: 'covered',
  },
  'employment.leavingJob.guide': {
    domain: 'employment',
    type: 'wizard',
    acceptedContextFields: ['resignationDate', 'employmentStatus'],
    producedContextFields: ['exitChecklistComplete'],
    isRegulatory: true,
    isLifeEventCompatible: true,
    coverageStatus: 'covered',
  },

  // Insurance & Pension
  'insurance.socialInsurance.calculate': {
    domain: 'insurance',
    type: 'calculator',
    acceptedContextFields: ['prefecture', 'age', 'employmentStatus'],
    producedContextFields: ['healthInsurancePremium', 'pensionPremium'],
    isRegulatory: true,
    isLifeEventCompatible: true,
    coverageStatus: 'covered',
  },
  'insurance.socialInsurance.eligibility': {
    domain: 'insurance',
    type: 'checker',
    acceptedContextFields: ['employmentStatus', 'weeklyHours', 'monthlyWageEstimate'],
    producedContextFields: ['isMandatoryEnrolled'],
    isRegulatory: true,
    isLifeEventCompatible: true,
    coverageStatus: 'covered',
  },
  'insurance.pension.national': {
    domain: 'insurance',
    type: 'guide',
    acceptedContextFields: ['employmentStatus', 'residenceStatus'],
    producedContextFields: ['nationalPensionEnrolled'],
    isRegulatory: true,
    isLifeEventCompatible: true,
    coverageStatus: 'covered',
  },
  'insurance.health.dependent': {
    domain: 'insurance',
    type: 'checker',
    acceptedContextFields: ['annualIncomeEstimate', 'relationshipToSponsor'],
    producedContextFields: ['isDependentEligible'],
    isRegulatory: true,
    isLifeEventCompatible: true,
    coverageStatus: 'covered',
  },

  // Family & Child
  'family.maternity.allowance': {
    domain: 'family',
    type: 'calculator',
    acceptedContextFields: ['expectedBirthDate', 'insuranceType'],
    producedContextFields: ['maternityAllowanceAmount'],
    isRegulatory: true,
    isLifeEventCompatible: true,
    coverageStatus: 'covered',
  },
  'family.childcare.eligibility': {
    domain: 'family',
    type: 'checker',
    acceptedContextFields: ['employmentStatus', 'insuredMonthsAtLeave'],
    producedContextFields: ['isChildcareEligible'],
    isRegulatory: true,
    isLifeEventCompatible: true,
    coverageStatus: 'covered',
  },
  'family.childcare.benefit': {
    domain: 'family',
    type: 'calculator',
    acceptedContextFields: ['childBirthDate', 'wageBaseEstimate'],
    producedContextFields: ['childcareBenefitAmount'],
    isRegulatory: true,
    isLifeEventCompatible: true,
    coverageStatus: 'covered',
  },
  'family.childAllowance.calculate': {
    domain: 'family',
    type: 'calculator',
    acceptedContextFields: ['familyContext', 'municipality'],
    producedContextFields: ['monthlyAllowancePerChild'],
    isRegulatory: true,
    isLifeEventCompatible: true,
    coverageStatus: 'covered',
  },
  'family.birth.guide': {
    domain: 'family',
    type: 'wizard',
    acceptedContextFields: ['expectedBirthDate', 'municipality', 'employmentStatus'],
    producedContextFields: ['birthProcedureProgress'],
    isRegulatory: true,
    isLifeEventCompatible: true,
    coverageStatus: 'covered',
  },

  // Tax
  'tax.japan.calculate': {
    domain: 'tax',
    type: 'calculator',
    acceptedContextFields: ['employmentStatus', 'municipality', 'familyContext'],
    producedContextFields: ['incomeTaxAmount', 'residenceTaxAmount'],
    isRegulatory: true,
    isLifeEventCompatible: true,
    coverageStatus: 'covered',
  },

  // Housing & Moving
  'housing.moving.cost.calculate': {
    domain: 'housing',
    type: 'calculator',
    acceptedContextFields: ['moveDate', 'familyContext'],
    producedContextFields: ['estimatedMovingCost'],
    isRegulatory: false,
    isLifeEventCompatible: true,
    coverageStatus: 'covered',
  },
  'housing.moving.admin.check': {
    domain: 'housing',
    type: 'checker',
    acceptedContextFields: ['oldMunicipality', 'newMunicipality', 'moveDate'],
    producedContextFields: ['movingAdminChecklist'],
    isRegulatory: true,
    isLifeEventCompatible: true,
    coverageStatus: 'covered',
  },
  'housing.address.change.check': {
    domain: 'housing',
    type: 'checker',
    acceptedContextFields: ['moveDate'],
    producedContextFields: ['addressChecklistComplete'],
    isRegulatory: true,
    isLifeEventCompatible: true,
    coverageStatus: 'covered',
  },
  'housing.moving.guide': {
    domain: 'housing',
    type: 'wizard',
    acceptedContextFields: ['oldMunicipality', 'newMunicipality', 'moveDate'],
    producedContextFields: ['movingJourneyProgress'],
    isRegulatory: true,
    isLifeEventCompatible: true,
    coverageStatus: 'covered',
  },

  // Residence & Immigration
  'immigration.workScope.check': {
    domain: 'immigration',
    type: 'checker',
    acceptedContextFields: ['residenceStatus', 'jobActivityCategory'],
    producedContextFields: ['isWorkPermitted'],
    isRegulatory: true,
    isLifeEventCompatible: true,
    coverageStatus: 'covered',
  },
  'immigration.residenceRenewal.guide': {
    domain: 'immigration',
    type: 'guide',
    acceptedContextFields: ['residenceStatus', 'residenceExpiryDate'],
    producedContextFields: ['renewalReadyScore'],
    isRegulatory: true,
    isLifeEventCompatible: true,
    coverageStatus: 'covered',
  },
  'immigration.affiliationChange.check': {
    domain: 'immigration',
    type: 'checker',
    acceptedContextFields: ['residenceStatus', 'resignationDate', 'newJobStartDate'],
    producedContextFields: ['isAffiliationNoticeRequired'],
    isRegulatory: true,
    isLifeEventCompatible: true,
    coverageStatus: 'covered',
  },
  'immigration.statusChange.guide': {
    domain: 'immigration',
    type: 'guide',
    acceptedContextFields: ['residenceStatus', 'targetStatus'],
    producedContextFields: ['statusChangeRequirements'],
    isRegulatory: true,
    isLifeEventCompatible: true,
    coverageStatus: 'covered',
  },
  'immigration.familyImmigration.guide': {
    domain: 'immigration',
    type: 'guide',
    acceptedContextFields: ['residenceStatus', 'relationshipToSponsor'],
    producedContextFields: ['familyCOERequirements'],
    isRegulatory: true,
    isLifeEventCompatible: true,
    coverageStatus: 'covered',
  },
  'immigration.permanentResidence.check': {
    domain: 'immigration',
    type: 'checker',
    acceptedContextFields: ['yearsInJapan', 'residenceStatus'],
    producedContextFields: ['prEligibilityStatus'],
    isRegulatory: true,
    isLifeEventCompatible: true,
    coverageStatus: 'covered',
  },
  'immigration.arrivingInJapan.guide': {
    domain: 'immigration',
    type: 'wizard',
    acceptedContextFields: ['residenceStatus', 'arrivalDate', 'municipality'],
    producedContextFields: ['arrivalSettlingProgress'],
    isRegulatory: true,
    isLifeEventCompatible: true,
    coverageStatus: 'covered',
  },
  'immigration.leavingJapan.guide': {
    domain: 'immigration',
    type: 'wizard',
    acceptedContextFields: ['residenceStatus', 'departureDate'],
    producedContextFields: ['departureSettlingProgress'],
    isRegulatory: true,
    isLifeEventCompatible: true,
    coverageStatus: 'covered',
  },

  // Administrative Procedures & Documents
  'documents.finder': {
    domain: 'documents',
    type: 'finder',
    acceptedContextFields: ['procedureId', 'residenceStatus', 'municipality'],
    producedContextFields: ['requiredDocumentList'],
    isRegulatory: true,
    isLifeEventCompatible: true,
    coverageStatus: 'covered',
  },
  'documents.certificate.guide': {
    domain: 'documents',
    type: 'guide',
    acceptedContextFields: ['documentId', 'municipality'],
    producedContextFields: ['acquisitionGuidance'],
    isRegulatory: true,
    isLifeEventCompatible: true,
    coverageStatus: 'covered',
  },
  'documents.mynumber.guide': {
    domain: 'documents',
    type: 'guide',
    acceptedContextFields: ['residenceStatus', 'moveDate', 'municipality'],
    producedContextFields: ['mynumberGuidance'],
    isRegulatory: true,
    isLifeEventCompatible: true,
    coverageStatus: 'covered',
  },
  'documents.form.helper': {
    domain: 'documents',
    type: 'helper',
    acceptedContextFields: ['formId'],
    producedContextFields: ['draftFormReady'],
    isRegulatory: true,
    isLifeEventCompatible: true,
    coverageStatus: 'covered',
  },
  'documents.requirement.check': {
    domain: 'documents',
    type: 'checker',
    acceptedContextFields: ['procedureId'],
    producedContextFields: ['procedureReadinessScore'],
    isRegulatory: true,
    isLifeEventCompatible: true,
    coverageStatus: 'covered',
  },
  'documents.admin.navigate': {
    domain: 'documents',
    type: 'navigator',
    acceptedContextFields: ['searchQuery'],
    producedContextFields: ['navigatedTarget'],
    isRegulatory: true,
    isLifeEventCompatible: true,
    coverageStatus: 'covered',
  },
});

/**
 * Phân giải semantic capability ID sang Tool ID kèm metadata đầy đủ
 * @param {string} capabilityId
 * @returns {{
 *   capabilityId: string,
 *   toolId: string | null,
 *   hashRoute: string | null,
 *   isAvailable: boolean,
 *   metadata: typeof CAPABILITY_METADATA[keyof typeof CAPABILITY_METADATA] | null
 * }}
 */
export function resolveCapability(capabilityId) {
  const base = baseResolveCapability(capabilityId);
  const metadata = CAPABILITY_METADATA[base.capabilityId] || null;

  return {
    ...base,
    metadata,
  };
}

/**
 * Lấy metadata của một capability
 * @param {string} capabilityId
 * @returns {typeof CAPABILITY_METADATA[keyof typeof CAPABILITY_METADATA] | null}
 */
export function getCapabilityMetadata(capabilityId) {
  return CAPABILITY_METADATA[capabilityId] || null;
}

/**
 * Trích xuất context hợp lệ để handoff sang capability dựa trên metadata allowlist của capability đó
 * @param {string} capabilityId
 * @param {Record<string, any>} context
 * @returns {Record<string, any>}
 */
export function filterContextForCapability(capabilityId, context) {
  const meta = getCapabilityMetadata(capabilityId);
  const acceptedFields = meta ? meta.acceptedContextFields : [];
  return extractHandoffPayload(context, acceptedFields);
}

/**
 * Tạo deep link URL hash an toàn kèm payload allowlisted
 * @param {string} capabilityId
 * @param {Record<string, any>} [context=null]
 * @returns {string | null}
 */
export function buildCapabilityDeepLink(capabilityId, context = null) {
  if (!context) {
    return baseBuildCapabilityDeepLink(capabilityId, null);
  }
  const safePayload = filterContextForCapability(capabilityId, context);
  return baseBuildCapabilityDeepLink(capabilityId, safePayload);
}

/**
 * Lấy toàn bộ danh sách mapping hiện có
 */
export function getAllCapabilities() {
  return baseGetAllCapabilities();
}
