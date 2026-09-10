import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ENTITY_TYPES,
  buildUnifiedSearchIndex,
  getUnifiedSearchIndex,
  normalizeSearchQuery,
  tokenizeQuery,
  searchUnifiedIndex,
  RECOMMENDATION_REASON_CODES,
  generateContextualRecommendations,
  Coverage,
  ConfidenceType,
} from '../src/navigator/index.js';

test('UnifiedSearch: index contains all 5 entity types with minimum 100 entries', () => {
  const index = getUnifiedSearchIndex();
  assert.ok(Array.isArray(index), 'Index must be an array');
  assert.ok(index.length >= 100, `Index should have at least 100 items, got ${index.length}`);

  const types = new Set(index.map((item) => item.entityType));
  assert.ok(types.has(ENTITY_TYPES.TOOL), 'Must contain tools');
  assert.ok(types.has(ENTITY_TYPES.CAPABILITY), 'Must contain capabilities');
  assert.ok(types.has(ENTITY_TYPES.LIFE_EVENT), 'Must contain life events');
  assert.ok(types.has(ENTITY_TYPES.PROCEDURE), 'Must contain procedures');
  assert.ok(types.has(ENTITY_TYPES.DOCUMENT), 'Must contain documents');

  // Verify structure of every entry
  for (const entry of index) {
    assert.ok(entry.id, 'Entry must have id');
    assert.ok(entry.entityType, `Entry ${entry.id} must have entityType`);
    assert.ok(entry.title, `Entry ${entry.id} must have title`);
    assert.ok(entry.link, `Entry ${entry.id} must have link`);
  }
});

test('UnifiedSearch: normalizeSearchQuery handles Vietnamese diacritics and Japanese CJK', () => {
  assert.equal(
    normalizeSearchQuery('Chuyển việc và Sinh con tại Nhật Bản'),
    'chuyen viec va sinh con tai nhat ban'
  );
  assert.equal(normalizeSearchQuery('住民票・在留カード'), '住民票・在留カード');
  assert.equal(normalizeSearchQuery('   '), '');
});

test('UnifiedSearch: tokenizeQuery extracts unique tokens', () => {
  const tokens = tokenizeQuery('Gia hạn visa, đổi địa chỉ');
  assert.ok(tokens.includes('visa'));
  assert.ok(tokens.includes('gia'));
  assert.ok(tokens.includes('han'));
  assert.ok(tokens.includes('dia'));
  assert.ok(tokens.includes('chi'));
});

test('UnifiedSearch: searchUnifiedIndex finds exact tool ID with highest score', () => {
  const result = searchUnifiedIndex('japan-tax-simulator');
  assert.ok(result.results.length > 0);
  assert.equal(result.results[0].id, 'japan-tax-simulator');
  assert.equal(result.results[0].entityType, ENTITY_TYPES.TOOL);
  assert.ok(result.results[0].score >= 150, 'Exact ID match must score >= 150');
});

test('UnifiedSearch: searchUnifiedIndex resolves Vietnamese queries across tools and life events', () => {
  const result = searchUnifiedIndex('chuyển việc', { locale: 'vi' });
  assert.ok(result.results.length > 0);

  const matchedIds = result.results.map((r) => r.id);
  assert.ok(
    matchedIds.includes('life.jp.changing-job') || matchedIds.includes('leaving-job-wizard-jp'),
    'Should match changing job life event or leaving job wizard'
  );
});

test('UnifiedSearch: searchUnifiedIndex resolves Japanese CJK queries with accurate localization', () => {
  const result = searchUnifiedIndex('ビザ更新', { locale: 'ja' });
  assert.ok(result.results.length > 0);

  const top = result.results[0];
  assert.ok(
    top.id.includes('residence') || top.id.includes('visa'),
    `Top result should relate to visa/residence, got ${top.id}`
  );
  assert.ok(top.localizedTitle, 'Must have localized title');
});

test('UnifiedSearch: searchUnifiedIndex supports entity type filtering', () => {
  const docResult = searchUnifiedIndex('juminhyo', { types: [ENTITY_TYPES.DOCUMENT] });
  assert.ok(docResult.results.length > 0);
  for (const item of docResult.results) {
    assert.equal(item.entityType, ENTITY_TYPES.DOCUMENT, 'All results must be documents');
  }

  const lifeEventResult = searchUnifiedIndex('nhật', { types: [ENTITY_TYPES.LIFE_EVENT] });
  for (const item of lifeEventResult.results) {
    assert.equal(item.entityType, ENTITY_TYPES.LIFE_EVENT, 'All results must be life events');
  }
});

test('UnifiedSearch: context boosting raises relevance of context-specific items', () => {
  const withoutContext = searchUnifiedIndex('thủ tục');
  const withLeavingContext = searchUnifiedIndex('thủ tục', {
    context: { employmentStatus: 'leaving' },
  });

  // Items related to employment should score higher with employment context
  const empItemWithout = withoutContext.results.find((r) => r.category === 'employment');
  const empItemWith = withLeavingContext.results.find((r) => r.category === 'employment');

  if (empItemWithout && empItemWith) {
    assert.ok(
      empItemWith.score > empItemWithout.score,
      'Item should have higher score when context matches'
    );
  }
});

test('Recommendations: generateContextualRecommendations for job change with employment gap', () => {
  const recs = generateContextualRecommendations({
    currentLifeEventId: 'life.jp.changing-job',
    employmentStatus: 'leaving',
    hasNewJob: false,
    hasEmploymentGap: true,
  });

  assert.ok(recs.length >= 4, 'Should emit at least 4 key recommendations');

  const reasonCodes = recs.map((r) => r.reasonCode);
  assert.ok(reasonCodes.includes(RECOMMENDATION_REASON_CODES.JOB_CHANGE_VISA_NOTIFY));
  assert.ok(reasonCodes.includes(RECOMMENDATION_REASON_CODES.KENPO_SWITCH));
  assert.ok(reasonCodes.includes(RECOMMENDATION_REASON_CODES.NENKIN_SWITCH));
  assert.ok(reasonCodes.includes(RECOMMENDATION_REASON_CODES.UNEMPLOYMENT_BENEFIT));

  // Top recommendations should have urgent 14-day statutory score
  assert.equal(recs[0].reasonCode, RECOMMENDATION_REASON_CODES.JOB_CHANGE_VISA_NOTIFY);
  assert.equal(recs[0].rankingScore, 1800);
});

test('Recommendations: generateContextualRecommendations for newborn baby with locality checking', () => {
  // Test with unsupported municipality
  const unverifiedRecs = generateContextualRecommendations({
    currentLifeEventId: 'life.jp.birth',
    hasBaby: true,
    municipality: 'unknown',
  });

  const childAllowanceUnverified = unverifiedRecs.find(
    (r) => r.reasonCode === RECOMMENDATION_REASON_CODES.CHILD_ALLOWANCE_15DAYS
  );
  assert.ok(childAllowanceUnverified);
  assert.equal(childAllowanceUnverified.coverage, Coverage.UNKNOWN);
  assert.equal(childAllowanceUnverified.confidenceType, ConfidenceType.LOCAL_DATA_UNVERIFIED);
  assert.ok(childAllowanceUnverified.localityNote.vi.includes('Tòa thị chính'));

  // Test with verified municipality
  const verifiedRecs = generateContextualRecommendations({
    currentLifeEventId: 'life.jp.birth',
    hasBaby: true,
    municipality: '131091', // Shinagawa-ku
  });

  const childAllowanceVerified = verifiedRecs.find(
    (r) => r.reasonCode === RECOMMENDATION_REASON_CODES.CHILD_ALLOWANCE_15DAYS
  );
  assert.ok(childAllowanceVerified);
  assert.equal(childAllowanceVerified.coverage, Coverage.VERIFIED);
});

test('Recommendations: generateContextualRecommendations for moving and leaving Japan', () => {
  const movingRecs = generateContextualRecommendations({
    currentLifeEventId: 'life.jp.moving',
    isMoving: true,
  });

  const movingReasons = movingRecs.map((r) => r.reasonCode);
  assert.ok(movingReasons.includes(RECOMMENDATION_REASON_CODES.MOVING_TENSHUTSU));
  assert.ok(movingReasons.includes(RECOMMENDATION_REASON_CODES.MOVING_TENNYU));
  assert.ok(movingReasons.includes(RECOMMENDATION_REASON_CODES.MYNUMBER_ADDRESS_UPDATE));

  const leavingRecs = generateContextualRecommendations({
    currentLifeEventId: 'life.jp.leaving-japan',
    isLeavingJapan: true,
  });

  const leavingReasons = leavingRecs.map((r) => r.reasonCode);
  assert.ok(leavingReasons.includes(RECOMMENDATION_REASON_CODES.LEAVING_TAX_REPRESENTATIVE));
  assert.ok(leavingReasons.includes(RECOMMENDATION_REASON_CODES.LEAVING_NENKIN_DATTAI));
});
