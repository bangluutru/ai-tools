/**
 * @file packages/core/tests/regulatory-foundation.test.js
 * @description Unit tests cho hạ tầng pháp quy chung (Regulatory Foundation Primitives).
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  OFFICIAL_SOURCE_REGISTRY,
  getSource,
  hasSource,
  getAllSources,
  createApplicablePeriod,
  isRuleApplicable,
  formatPeriodLabel,
  SUPPORTED_COUNTRIES,
  createJurisdiction,
  isValidJurisdiction,
  defineRuleMetadata,
  validateRuleMetadata,
  scanForForbiddenPlaceholders,
  checkStaleness,
  verifyRuleSourceBinding,
} from '../src/regulatory/index.js';

test('sourceRegistry provides registered Tier-1 primary sources without broken URLs', () => {
  assert.ok(OFFICIAL_SOURCE_REGISTRY['nta-no1410-2026'], 'Must contain NTA No.1410');
  assert.ok(OFFICIAL_SOURCE_REGISTRY['nta-no1199-2026'], 'Must contain NTA No.1199');
  assert.ok(OFFICIAL_SOURCE_REGISTRY['jps-national-pension-2026'], 'Must contain JPS National Pension');
  assert.ok(OFFICIAL_SOURCE_REGISTRY['mhlw-employment-rate-2026'], 'Must contain MHLW Employment Rate');
  assert.ok(OFFICIAL_SOURCE_REGISTRY['kyoukaikenpo-rates-2026'], 'Must contain Kyokai Kenpo rates');

  // Verify getSource & hasSource
  assert.equal(hasSource('nta-no1410-2026'), true);
  assert.equal(hasSource('unknown-source-xyz'), false);
  const source = getSource('nta-no1410-2026');
  assert.equal(source.country, 'JP');
  assert.equal(source.status, 'official-primary');
  assert.ok(source.url.startsWith('https://'));

  // getAllSources filter
  const jpSources = getAllSources({ country: 'JP' });
  assert.ok(jpSources.length >= 5);
  assert.equal(jpSources.every((s) => s.country === 'JP'), true);
});

test('effectivePeriod handles distinction between calendar-year, tax-year and fiscal-year', () => {
  // 1. Tax Year (e.g. 2026 Tax reform applies to 2026 income, effective 2026-12-01)
  const taxRule = {
    effectiveFrom: '2026-12-01',
    applicablePeriod: createApplicablePeriod('tax-year', 2026, 2027),
  };

  assert.equal(isRuleApplicable(taxRule, { taxYear: 2026 }), true);
  assert.equal(isRuleApplicable(taxRule, { taxYear: 2025 }), false);
  assert.equal(isRuleApplicable(taxRule, { taxYear: 2028 }), false);

  // 2. Fiscal Year (e.g. Kokumin Nenkin FY2026: 2026-04-01 -> 2027-03-31)
  const fiscalRule = {
    effectiveFrom: '2026-04-01',
    effectiveTo: '2027-03-31',
    applicablePeriod: createApplicablePeriod('fiscal-year', 2026),
  };

  assert.equal(isRuleApplicable(fiscalRule, { fiscalYear: 2026 }), true);
  assert.equal(isRuleApplicable(fiscalRule, { fiscalYear: 2025 }), false);
  // With dates: 2026-05-15 is FY2026
  assert.equal(isRuleApplicable(fiscalRule, { date: '2026-05-15' }), true);
  // 2026-03-15 is FY2025 (before April)
  assert.equal(isRuleApplicable(fiscalRule, { date: '2026-03-15' }), false);

  // 3. Formatting labels
  const labelJa = formatPeriodLabel(taxRule.applicablePeriod, 'ja');
  assert.ok(labelJa.includes('2026') || labelJa.includes('令和8'));
  const labelVi = formatPeriodLabel(taxRule.applicablePeriod, 'vi');
  assert.ok(labelVi.includes('2026'));
});

test('jurisdiction validates supported countries and subdivisions', () => {
  assert.ok(SUPPORTED_COUNTRIES.JP);
  assert.ok(SUPPORTED_COUNTRIES.VN);

  const validJp = createJurisdiction({ country: 'JP', prefecture: 'fukuoka' });
  assert.equal(validJp.country, 'JP');
  assert.equal(validJp.prefecture, 'fukuoka');
  assert.equal(isValidJurisdiction(validJp), true);

  assert.throws(() => {
    createJurisdiction({ country: 'INVALID_COUNTRY' });
  });
});

test('ruleMetadata contract enforces validation and source binding', () => {
  const meta = defineRuleMetadata({
    id: 'test-rule-2026',
    jurisdiction: { country: 'JP' },
    sourceId: 'nta-no1410-2026',
    effectiveFrom: '2026-12-01',
    applicablePeriod: { type: 'tax-year', from: 2026 },
    version: '2026.1',
    lastVerifiedAt: '2026-09-10',
    status: 'verified',
  });

  assert.equal(meta.id, 'test-rule-2026');
  assert.equal(meta.status, 'verified');

  const validation = validateRuleMetadata(meta);
  assert.equal(validation.valid, true);

  const binding = verifyRuleSourceBinding({ metadata: meta });
  assert.equal(binding.valid, true);
  assert.equal(binding.source.id, 'nta-no1410-2026');

  // Negative validation
  const invalidValidation = validateRuleMetadata({ id: 'bad' });
  assert.equal(invalidValidation.valid, false);
  assert.ok(invalidValidation.errors.length > 0);
});

test('verification detects forbidden dummy placeholders and checks staleness', () => {
  const cleanCode = 'const rate = 0.1011; // 10.11% official Kyokai Kenpo rate';
  assert.deepEqual(scanForForbiddenPlaceholders(cleanCode), []);

  const dirtyCode = 'const rate = 0.10; // TODO rate placeholder rate for now';
  const found = scanForForbiddenPlaceholders(dirtyCode);
  assert.ok(found.includes('TODO rate'));
  assert.ok(found.includes('placeholder rate'));

  // Staleness
  const fresh = checkStaleness('2026-09-01', { currentDate: '2026-09-10' });
  assert.equal(fresh.isStale, false);
  assert.equal(fresh.needsReview, false);

  const stale = checkStaleness('2024-01-01', { currentDate: '2026-09-10' });
  assert.equal(stale.isStale, true);
  assert.equal(stale.needsReview, true);
});
