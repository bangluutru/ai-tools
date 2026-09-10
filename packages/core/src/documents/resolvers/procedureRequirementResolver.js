/**
 * @file procedureRequirementResolver.js
 * Pure resolver for procedures, contextual document requirements, and freshness validation.
 */

import { CANONICAL_PROCEDURES } from '../registry/procedureRegistry.js';
import { CANONICAL_REQUIREMENTS, REQUIREMENT_NECESSITY } from '../requirements/requirementRegistry.js';
import { getDocumentById } from './documentResolver.js';

/**
 * Get procedure by ID.
 * @param {string} id - e.g. 'procedure.residence-status-renewal'
 * @returns {object|null}
 */
export function getProcedureById(id) {
  if (!id) return null;
  return CANONICAL_PROCEDURES[id] || null;
}

/**
 * Get all registered procedures.
 * @returns {object[]}
 */
export function getAllProcedures() {
  return Object.values(CANONICAL_PROCEDURES);
}

/**
 * Find procedures matching a search string.
 * @param {string} query
 * @returns {object[]}
 */
export function findProceduresByQuery(query) {
  if (!query || typeof query !== 'string') return [];
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];

  const results = [];

  for (const proc of Object.values(CANONICAL_PROCEDURES)) {
    let score = 0;

    if (proc.id.toLowerCase() === normalized) score += 100;
    if (proc.titleJa.toLowerCase().includes(normalized)) score += 50;

    if (Array.isArray(proc.aliases)) {
      for (const alias of proc.aliases) {
        if (alias.toLowerCase().includes(normalized)) {
          score += 40;
          break;
        }
      }
    }

    if (proc.titleI18n) {
      if (proc.titleI18n.vi && proc.titleI18n.vi.toLowerCase().includes(normalized)) score += 30;
      if (proc.titleI18n.en && proc.titleI18n.en.toLowerCase().includes(normalized)) score += 30;
    }

    if (score > 0) results.push({ proc, score });
  }

  results.sort((a, b) => b.score - a.score);
  return results.map((r) => r.proc);
}

/**
 * Resolve all requirements for a procedure, including populated canonical document definitions.
 * @param {string} procedureId
 * @returns {object|null}
 */
export function getRequirementsForProcedure(procedureId) {
  const procedure = getProcedureById(procedureId);
  if (!procedure) return null;

  const resolvedRequirements = [];
  const grouped = {
    mandatory: [],
    conditional: [],
    ifApplicable: [],
    optional: [],
  };

  for (const reqId of procedure.documentRequirementIds || []) {
    const rawReq = CANONICAL_REQUIREMENTS[reqId];
    if (!rawReq) continue;

    const document = getDocumentById(rawReq.documentId);
    const resolvedReq = {
      ...rawReq,
      document: document || {
        id: rawReq.documentId,
        canonicalNameJa: '未登録の証明書',
        nameI18n: { ja: '未登録の証明書', vi: 'Giấy tờ chưa đăng ký', en: 'Unregistered Document' },
      },
    };

    resolvedRequirements.push(resolvedReq);

    switch (resolvedReq.necessity) {
      case REQUIREMENT_NECESSITY.MANDATORY:
        grouped.mandatory.push(resolvedReq);
        break;
      case REQUIREMENT_NECESSITY.CONDITIONAL:
        grouped.conditional.push(resolvedReq);
        break;
      case REQUIREMENT_NECESSITY.IF_APPLICABLE:
        grouped.ifApplicable.push(resolvedReq);
        break;
      case REQUIREMENT_NECESSITY.OPTIONAL:
      default:
        grouped.optional.push(resolvedReq);
        break;
    }
  }

  return {
    procedure,
    allRequirements: resolvedRequirements,
    groupedRequirements: grouped,
    totalCount: resolvedRequirements.length,
    mandatoryCount: grouped.mandatory.length,
  };
}

/**
 * Validate whether a document is fresh enough for a specific requirement.
 * 
 * CORE RULE:
 * 住民票 does not have an inherent 3-month lifespan. The procedure requirement dictates maxAgeMonths.
 * 
 * @param {object} requirement - DocumentRequirement object with maxAgeMonths
 * @param {string|Date} issueDate - Issue date (ISO string 'YYYY-MM-DD' or Date)
 * @param {Date} [referenceDate=new Date()] - Reference date to measure against
 * @returns {object} { isValid: boolean, reason: string, ageMonths?: number, maxAgeMonths?: number }
 */
export function validateDocumentFreshness(requirement, issueDate, referenceDate = new Date()) {
  if (!requirement) {
    return { isValid: false, reason: 'missing_requirement' };
  }

  if (requirement.maxAgeMonths === null || requirement.maxAgeMonths === undefined) {
    return {
      isValid: true,
      reason: 'no_freshness_limit',
      ageMonths: null,
      maxAgeMonths: null,
    };
  }

  if (!issueDate) {
    return {
      isValid: false,
      reason: 'missing_issue_date',
      maxAgeMonths: requirement.maxAgeMonths,
    };
  }

  const issued = new Date(issueDate);
  if (isNaN(issued.getTime())) {
    return {
      isValid: false,
      reason: 'invalid_issue_date',
      maxAgeMonths: requirement.maxAgeMonths,
    };
  }

  const ref = new Date(referenceDate);

  // Future date check
  if (issued.getTime() > ref.getTime()) {
    return {
      isValid: false,
      reason: 'future_issue_date',
      maxAgeMonths: requirement.maxAgeMonths,
    };
  }

  // Calculate approximate months elapsed
  const yearDiff = ref.getFullYear() - issued.getFullYear();
  const monthDiff = ref.getMonth() - issued.getMonth();
  const dayDiff = ref.getDate() - issued.getDate();

  let elapsedMonths = yearDiff * 12 + monthDiff;
  if (dayDiff < 0) {
    elapsedMonths -= 0.5;
  }

  const roundedAge = Math.max(0, Math.round(elapsedMonths * 10) / 10);
  const isValid = roundedAge <= requirement.maxAgeMonths;

  return {
    isValid,
    reason: isValid ? 'fresh' : 'expired',
    ageMonths: roundedAge,
    maxAgeMonths: requirement.maxAgeMonths,
  };
}
