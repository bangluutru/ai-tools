/**
 * @file hub/src/utils/hubRoute.js
 * ============================================================================
 * Hash-based Route Resolver for Toolio Hub Information Architecture
 * Strictly backward-compatible with toolRoute.js contract (#/tools/:toolId)
 *
 * Routes supported:
 * - Home: '' | '#' | '#/'
 * - Tools (Common): '#/tools' | '#/common' (with optional ?category=...)
 * - Japan Life: '#/japan-life' (with optional ?domain=...)
 * - Vietnam Life: '#/vietnam-life' (with optional ?domain=...)
 * - Miniapp: '#/tools/:toolId' (delegated to resolveToolId)
 * ============================================================================
 */

import { resolveToolId, toolUrl as baseToolUrl } from './toolRoute.js';

const DOMAIN_ROUTE_REGEX = /^#\/(tools|common|japan-life|vietnam-life)(\?.*)?$/;

/**
 * Parses query parameters from hash or search string
 * @param {string} hash
 * @param {string} paramKey
 * @returns {string|null}
 */
export function parseHashQueryParam(hash, paramKey) {
  if (!hash || !hash.includes('?')) return null;
  const queryString = hash.split('?')[1];
  const searchParams = new URLSearchParams(queryString);
  return searchParams.get(paramKey);
}

/**
 * Resolves the route from the browser location hash
 * @param {string} hash - window.location.hash
 * @param {Array} registry - list of tools from toolsRegistry
 * @returns {{ type: 'tool', toolId: string } | { type: 'domain', domain: string, filter: string } | { type: 'home' }}
 */
export function resolveHubRoute(hash, registry) {
  const normalizedHash = (hash || '').trim();

  // 1. Check if it is a specific tool route (#/tools/:toolId)
  const toolId = resolveToolId(normalizedHash, registry);
  if (toolId) {
    return { type: 'tool', toolId };
  }

  // 2. Check if it matches a top-level domain route
  const domainMatch = DOMAIN_ROUTE_REGEX.exec(normalizedHash);
  if (domainMatch) {
    const rawDomain = domainMatch[1];
    const canonicalDomain = rawDomain === 'tools' ? 'common' : rawDomain;
    const filter =
      parseHashQueryParam(normalizedHash, 'domain') ||
      parseHashQueryParam(normalizedHash, 'category') ||
      'all';

    return {
      type: 'domain',
      domain: canonicalDomain,
      filter,
    };
  }

  // 3. Otherwise, fallback safely to Home
  return { type: 'home' };
}

/**
 * Builds static-host-compatible hash for a domain and optional filter
 * @param {string} domainId - 'common' | 'japan-life' | 'vietnam-life'
 * @param {string} [filterId]
 * @returns {string}
 */
export function buildDomainHash(domainId, filterId) {
  if (!domainId || domainId === 'home') return '#/';
  const slug = domainId === 'common' ? 'tools' : domainId;
  const paramKey = domainId === 'common' ? 'category' : 'domain';

  if (filterId && filterId !== 'all') {
    return `#/${slug}?${paramKey}=${encodeURIComponent(filterId)}`;
  }
  return `#/${slug}`;
}

const BROWSE_CONTEXT_KEY = 'toolio_last_browse_context';

/**
 * Persists the last active domain browse context for back navigation
 * @param {string} domain
 * @param {string} filter
 */
export function saveLastBrowseContext(domain, filter = 'all') {
  try {
    sessionStorage.setItem(
      BROWSE_CONTEXT_KEY,
      JSON.stringify({ domain, filter, timestamp: Date.now() })
    );
  } catch {
    // Non-blocking in restricted storage environments
  }
}

/**
 * Retrieves the last active domain browse context
 * @returns {{ domain: string, filter: string } | null}
 */
export function getLastBrowseContext() {
  try {
    const raw = sessionStorage.getItem(BROWSE_CONTEXT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.domain) {
      return parsed;
    }
  } catch {
    // Return null on parsing failure
  }
  return null;
}
