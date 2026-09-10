/**
 * @file documentResolver.js
 * Pure resolver functions for canonical documents and certificates.
 */

import { CANONICAL_DOCUMENTS, SENSITIVITY_TIERS } from '../registry/documentRegistry.js';

/**
 * Get a canonical document by its unique ID.
 * @param {string} id - e.g. 'document.resident-record-copy'
 * @returns {object|null} Document definition or null
 */
export function getDocumentById(id) {
  if (!id) return null;
  return CANONICAL_DOCUMENTS[id] || null;
}

/**
 * Get all registered canonical documents.
 * @returns {object[]} List of all DocumentDefinitions
 */
export function getAllDocuments() {
  return Object.values(CANONICAL_DOCUMENTS);
}

/**
 * Filter documents by category.
 * @param {string} category - Category identifier from DOCUMENT_CATEGORIES
 * @returns {object[]} List of matching documents
 */
export function getDocumentsByCategory(category) {
  if (!category) return [];
  return Object.values(CANONICAL_DOCUMENTS).filter((doc) => doc.category === category);
}

/**
 * Filter documents by issuing authority type.
 * @param {string} issuerType - Issuer identifier from ISSUER_TYPES
 * @returns {object[]} List of matching documents
 */
export function getDocumentsByIssuer(issuerType) {
  if (!issuerType) return [];
  return Object.values(CANONICAL_DOCUMENTS).filter((doc) => doc.issuerType === issuerType);
}

/**
 * Find documents matching a query string across IDs, Japanese titles, aliases, and trilingual names.
 * @param {string} query - Search term (Japanese, Vietnamese, English, Romaji)
 * @returns {object[]} Matched document definitions ordered by relevance
 */
export function findDocumentsByQuery(query) {
  if (!query || typeof query !== 'string') return [];
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];

  const results = [];

  for (const doc of Object.values(CANONICAL_DOCUMENTS)) {
    let score = 0;

    // 1. Exact ID match
    if (doc.id.toLowerCase() === normalized) {
      score += 100;
    }

    // 2. Exact or partial canonical Japanese name
    if (doc.canonicalNameJa.toLowerCase() === normalized) {
      score += 80;
    } else if (doc.canonicalNameJa.toLowerCase().includes(normalized)) {
      score += 40;
    }

    // 3. Aliases matching
    if (Array.isArray(doc.aliases)) {
      for (const alias of doc.aliases) {
        const aliasLower = alias.toLowerCase();
        if (aliasLower === normalized) {
          score += 60;
          break;
        } else if (aliasLower.includes(normalized) || normalized.includes(aliasLower)) {
          score += 25;
          break;
        }
      }
    }

    // 4. Multilingual names
    if (doc.nameI18n) {
      if (doc.nameI18n.vi && doc.nameI18n.vi.toLowerCase().includes(normalized)) {
        score += 30;
      }
      if (doc.nameI18n.en && doc.nameI18n.en.toLowerCase().includes(normalized)) {
        score += 30;
      }
      if (doc.nameI18n.ja && doc.nameI18n.ja.toLowerCase().includes(normalized)) {
        score += 30;
      }
    }

    if (score > 0) {
      results.push({ doc, score });
    }
  }

  // Sort descending by match score
  results.sort((a, b) => b.score - a.score);
  return results.map((r) => r.doc);
}

/**
 * Check if a document is considered sensitive identifying or highly sensitive.
 * @param {string} documentId
 * @returns {boolean}
 */
export function isSensitiveDocument(documentId) {
  const doc = getDocumentById(documentId);
  if (!doc) return false;
  return (
    doc.sensitivity === SENSITIVITY_TIERS.SENSITIVE_IDENTIFYING ||
    doc.sensitivity === SENSITIVITY_TIERS.HIGHLY_SENSITIVE
  );
}
