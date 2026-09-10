/**
 * @file packages/core/src/navigator/lifeEvents/lifeEventRegistry.js
 * @description
 * Canonical Life Event Registry for Japan Life Navigator & Toolio.
 * Centralizes all 7 canonical life events with standardized IDs (life.jp.*),
 * cross-domain composition fragments, and legacy alias support.
 *
 * Sits in the Navigator Orchestration Layer (Layer 4) to ensure Unidirectional
 * Dependency Graph (Domains -> Foundations; Navigator -> Domains & Foundations).
 */

import { startingLifeDefinition, startingLifeRuntime } from '../../life-events/definitions/startingLifeDefinition.js';
import { changingJobDefinition, changingJobRuntime } from '../../life-events/definitions/changingJobDefinition.js';
import { familyJoiningDefinition, familyJoiningRuntime } from '../../life-events/definitions/familyJoiningDefinition.js';
import { leavingJobDefinition, leavingJobRuntime } from '../../japan/employment/rules/leavingJobDefinition.js';
import { birthDefinition, birthRuntime } from '../../japan/family/rules/birthDefinition.js';
import { movingWizardDefinition, movingWizardRuntime } from '../../japan/housing/rules/movingWizardDefinition.js';
import { departureDefinition, departureRuntime } from '../../japan/immigration/departure/departureDefinition.js';

/**
 * Danh sách 7 sự kiện đời sống chính thức (Canonical 7 Life Events)
 */
export const CANONICAL_LIFE_EVENTS = Object.freeze({
  'life.jp.starting-life': {
    id: 'life.jp.starting-life',
    aliases: ['arriving-in-japan', 'starting-life'],
    definition: startingLifeDefinition,
    runtime: startingLifeRuntime,
    category: 'immigration-arrival',
  },
  'life.jp.changing-job': {
    id: 'life.jp.changing-job',
    aliases: ['changing-job'],
    definition: changingJobDefinition,
    runtime: changingJobRuntime,
    category: 'employment',
  },
  'life.jp.leaving-job': {
    id: 'life.jp.leaving-job',
    aliases: ['leaving-job', 'unemployment'],
    definition: leavingJobDefinition,
    runtime: leavingJobRuntime,
    category: 'employment',
  },
  'life.jp.pregnancy-birth': {
    id: 'life.jp.pregnancy-birth',
    aliases: ['birth', 'pregnancy-birth', 'childcare', 'life.jp.birth'],
    definition: birthDefinition,
    runtime: birthRuntime,
    category: 'family',
  },
  'life.jp.moving': {
    id: 'life.jp.moving',
    aliases: ['moving', 'relocation', 'housing-moving'],
    definition: movingWizardDefinition,
    runtime: movingWizardRuntime,
    category: 'housing',
  },
  'life.jp.family-joining': {
    id: 'life.jp.family-joining',
    aliases: ['family-joining', 'family-immigration'],
    definition: familyJoiningDefinition,
    runtime: familyJoiningRuntime,
    category: 'family-immigration',
  },
  'life.jp.leaving-japan': {
    id: 'life.jp.leaving-japan',
    aliases: ['leaving-japan', 'departure'],
    definition: departureDefinition,
    runtime: departureRuntime,
    category: 'immigration-departure',
  },
});

/**
 * Phân giải mã sự kiện bất kỳ (canonical hoặc alias) sang Canonical ID chuẩn
 * @param {string} rawId
 * @returns {string | null}
 */
export function getCanonicalLifeEventId(rawId) {
  if (!rawId || typeof rawId !== 'string') {
    return null;
  }

  const clean = rawId.trim();

  // Kiểm tra trực tiếp canonical id
  if (CANONICAL_LIFE_EVENTS[clean]) {
    return clean;
  }

  // Kiểm tra qua aliases
  for (const entry of Object.values(CANONICAL_LIFE_EVENTS)) {
    if (entry.aliases && entry.aliases.includes(clean)) {
      return entry.id;
    }
  }

  return null;
}

/**
 * Lấy đối tượng Life Event theo ID hoặc alias
 * @param {string} idOrAlias
 * @returns {typeof CANONICAL_LIFE_EVENTS[keyof typeof CANONICAL_LIFE_EVENTS] | null}
 */
export function getLifeEventById(idOrAlias) {
  const canonicalId = getCanonicalLifeEventId(idOrAlias);
  return canonicalId ? CANONICAL_LIFE_EVENTS[canonicalId] : null;
}

/**
 * Lấy thực thể Runtime của sự kiện
 * @param {string} idOrAlias
 * @returns {any | null}
 */
export function getLifeEventRuntime(idOrAlias) {
  const entry = getLifeEventById(idOrAlias);
  return entry ? entry.runtime : null;
}

/**
 * Lấy toàn bộ danh sách 7 sự kiện đời sống
 * @returns {Array<typeof CANONICAL_LIFE_EVENTS[keyof typeof CANONICAL_LIFE_EVENTS]>}
 */
export function getAllLifeEvents() {
  return Object.values(CANONICAL_LIFE_EVENTS);
}
