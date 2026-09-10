/**
 * @file packages/core/src/navigator/index.js
 * @description
 * Public entrypoint for Japan Life Navigator layer.
 */

// Context & Sanitizer
export {
  ALLOWED_NAVIGATOR_FIELDS,
  VALID_EMPLOYMENT_STATUSES,
  createNavigatorContext,
  validateNavigatorContext,
} from './context/navigatorContext.js';
export {
  PROHIBITED_SENSITIVE_FIELDS,
  stripSensitiveData,
  extractHandoffPayload,
} from './context/contextSanitizer.js';

// Recommendation Contract & Ranking
export {
  ConfidenceType,
  Priority,
  Timing,
  Jurisdiction,
  Coverage,
  createRecommendation,
} from './recommendations/recommendationContract.js';
export {
  calculateRecommendationScore,
  rankRecommendations,
} from './ranking/recommendationRanker.js';
export {
  evaluateAndRankRecommendations,
} from './recommendations/recommendationEngine.js';

// Capability Graph
export {
  CAPABILITY_METADATA,
  resolveCapability,
  getCapabilityMetadata,
  filterContextForCapability,
  buildCapabilityDeepLink,
  getAllCapabilities,
} from './capabilityGraph/capabilityResolver.js';

// Intent & Routing
export {
  CANONICAL_INTENTS,
} from './intent/intentTaxonomy.js';
export {
  DISAMBIGUATION_SCENARIOS,
  checkQueryAmbiguity,
  resolveDisambiguatedOption,
} from './intent/intentDisambiguator.js';
export {
  normalizeQuery,
  getAllIntents,
  getIntentById,
  resolveIntentFromText,
} from './intent/intentResolver.js';
