/**
 * @file procedureRequirementResolver.js
 * Pure resolver for procedures, contextual document requirements, and freshness validation.
 */

import { CANONICAL_PROCEDURES } from '../registry/procedureRegistry.js';
import { foldText, minSubstringLength } from '../search/textFold.js';
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
  const normalized = foldText(query);
  if (!normalized || normalized.length < minSubstringLength(normalized)) return [];

  const results = [];

  for (const proc of Object.values(CANONICAL_PROCEDURES)) {
    let score = 0;

    if (proc.id.toLowerCase() === normalized) score += 100;
    if (foldText(proc.titleJa).includes(normalized)) score += 50;

    if (Array.isArray(proc.aliases)) {
      for (const alias of proc.aliases) {
        if (foldText(alias).includes(normalized)) {
          score += 40;
          break;
        }
      }
    }

    if (proc.titleI18n) {
      if (proc.titleI18n.vi && foldText(proc.titleI18n.vi).includes(normalized)) score += 30;
      if (proc.titleI18n.en && foldText(proc.titleI18n.en).includes(normalized)) score += 30;
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

  const issued = toLocalDateParts(issueDate);
  if (!issued) {
    return {
      isValid: false,
      reason: 'invalid_issue_date',
      maxAgeMonths: requirement.maxAgeMonths,
    };
  }

  const ref = toLocalDateParts(referenceDate) || toLocalDateParts(new Date());
  const issuedKey = dateKey(issued);
  const refKey = dateKey(ref);

  // Future date check
  if (issuedKey > refKey) {
    return {
      isValid: false,
      reason: 'future_issue_date',
      maxAgeMonths: requirement.maxAgeMonths,
    };
  }

  // Hạn hiệu lực = ngày cấp + maxAgeMonths (theo lịch địa phương, kẹp ngày cuối tháng:
  // 2026-11-30 + 3 tháng = 2027-02-28). Hợp lệ khi ngày tham chiếu <= ngày hết hạn.
  const expiry = addMonthsClamped(issued, requirement.maxAgeMonths);
  const isValid = refKey <= dateKey(expiry);

  // Tuổi giấy tờ (tháng, xấp xỉ 1 chữ số thập phân) — chỉ để hiển thị.
  let elapsedMonths = (ref.y - issued.y) * 12 + (ref.m - issued.m);
  if (ref.d < issued.d) elapsedMonths -= 0.5;
  const roundedAge = Math.max(0, Math.round(elapsedMonths * 10) / 10);

  return {
    isValid,
    reason: isValid ? 'fresh' : 'expired',
    ageMonths: roundedAge,
    maxAgeMonths: requirement.maxAgeMonths,
    expiresOn: formatDateParts(expiry),
  };
}

const ISO_DATE_RE = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;

function daysInMonth(y, m) {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/**
 * Chuyển 'YYYY-MM-DD' hoặc Date thành {y, m, d} theo lịch địa phương (không lệch múi giờ).
 * 'YYYY-MM-DD' được đọc nguyên văn (không qua new Date() vốn parse theo UTC).
 */
function toLocalDateParts(value) {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return { y: value.getFullYear(), m: value.getMonth() + 1, d: value.getDate() };
  }
  if (typeof value === 'string') {
    const match = ISO_DATE_RE.exec(value.trim().slice(0, 10));
    if (match) {
      const y = Number(match[1]);
      const m = Number(match[2]);
      const d = Number(match[3]);
      if (m < 1 || m > 12 || d < 1 || d > daysInMonth(y, m)) return null;
      return { y, m, d };
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : toLocalDateParts(parsed);
  }
  return null;
}

function addMonthsClamped({ y, m, d }, months) {
  const total = y * 12 + (m - 1) + Math.trunc(Number(months) || 0);
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  return { y: ny, m: nm, d: Math.min(d, daysInMonth(ny, nm)) };
}

function dateKey({ y, m, d }) {
  return y * 10000 + m * 100 + d;
}

function formatDateParts({ y, m, d }) {
  return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}
