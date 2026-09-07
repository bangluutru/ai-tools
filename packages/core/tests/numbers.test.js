import assert from 'node:assert/strict';
import test from 'node:test';

import { parseLocalizedNumber } from '../src/utils/numbers.js';
import { parseLocalizedNumber as reExportedParse } from '../src/utils/accounting/reconcile.js';

test('parseLocalizedNumber parses finite numbers directly', () => {
  assert.equal(parseLocalizedNumber(1234.56), 1234.56);
  assert.equal(parseLocalizedNumber(0), 0);
  assert.equal(parseLocalizedNumber(-500), -500);
  assert.equal(parseLocalizedNumber(NaN), null);
  assert.equal(parseLocalizedNumber(Infinity), null);
});

test('parseLocalizedNumber returns null for null, undefined, or empty input', () => {
  assert.equal(parseLocalizedNumber(null), null);
  assert.equal(parseLocalizedNumber(undefined), null);
  assert.equal(parseLocalizedNumber(''), null);
  assert.equal(parseLocalizedNumber('   '), null);
  assert.equal(parseLocalizedNumber('abc'), null);
});

test('parseLocalizedNumber parses standard decimal strings', () => {
  assert.equal(parseLocalizedNumber('1234.56'), 1234.56);
  assert.equal(parseLocalizedNumber('1234,56'), 1234.56);
  assert.equal(parseLocalizedNumber('1,234.56'), 1234.56);
  assert.equal(parseLocalizedNumber('1.234,56'), 1234.56);
});

test('parseLocalizedNumber parses Vietnamese currency strings with symbols and spaces', () => {
  assert.equal(parseLocalizedNumber('1.500.000 ₫'), 1500000);
  assert.equal(parseLocalizedNumber('1,500,000 VND'), 1500000);
  assert.equal(parseLocalizedNumber('250.000 đ'), 250000);
});

test('parseLocalizedNumber parses accounting negative numbers in parentheses or minus', () => {
  assert.equal(parseLocalizedNumber('(1.500.000)'), -1500000);
  assert.equal(parseLocalizedNumber('-1.500.000'), -1500000);
  assert.equal(parseLocalizedNumber('(2,345.67)'), -2345.67);
});

test('parseLocalizedNumber is identically re-exported by accounting/reconcile.js', () => {
  assert.equal(reExportedParse, parseLocalizedNumber);
});
