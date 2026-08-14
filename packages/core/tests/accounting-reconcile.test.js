import assert from 'node:assert/strict';
import test from 'node:test';

import {
  normalizeInvoiceNumber,
  parseLocalizedNumber,
  reconcileAccountingData,
} from '../src/utils/accounting/reconcile.js';


test('normalizes invoice numbers without losing alphanumeric prefixes', () => {
  assert.equal(normalizeInvoiceNumber(' 0000123 '), '123');
  assert.equal(normalizeInvoiceNumber(' ab-001 '), 'AB-001');
  assert.equal(normalizeInvoiceNumber(null), '');
});


test('parses common Vietnamese and international numeric formats', () => {
  assert.equal(parseLocalizedNumber('1.234,56'), 1234.56);
  assert.equal(parseLocalizedNumber('1,234.56'), 1234.56);
  assert.equal(parseLocalizedNumber('1.234.567'), 1234567);
  assert.equal(parseLocalizedNumber('(2.500)'), -2500);
  assert.equal(parseLocalizedNumber('không phải số'), null);
});


test('aggregates duplicate BR rows and marks them for human review', () => {
  const result = reconcileAccountingData({
    511: [{ invoice: '001', value: 300, sourceRow: 5 }],
    33311: [{ invoice: '001', value: 30, sourceRow: 5 }],
    br: [
      { invoice: '1', chuaThue: 100, thue: 10, sourceRow: 6 },
      { invoice: '1', chuaThue: 200, thue: 20, sourceRow: 7 },
    ],
  });

  assert.equal(result.report511[0].status, 'MATCH');
  assert.equal(result.report511[0].valBR, 300);
  assert.equal(result.report511[0].needsReview, true);
  assert.equal(result.report33311[0].status, 'MATCH');
  assert.equal(result.summary.needsReview, 1);
});


test('uses tolerance and distinguishes missing ledger from missing BR', () => {
  const result = reconcileAccountingData(
    {
      511: [
        { invoice: '10', value: 100.2 },
        { invoice: '20', value: 50 },
      ],
      33311: [],
      br: [
        { invoice: '10', chuaThue: 100, thue: 0 },
        { invoice: '30', chuaThue: 75, thue: 7.5 },
      ],
    },
    { tolerance: 0.5 },
  );

  assert.equal(result.report511.find((row) => row.invoice === '10').status, 'MATCH');
  assert.equal(result.report511.find((row) => row.invoice === '20').status, 'MISSING_BR');
  assert.equal(result.report511.find((row) => row.invoice === '30').status, 'MISSING_LEDGER');
  assert.equal(result.summary.missingInBR, 1);
  assert.equal(result.summary.missingInLedger, 1);
});
