import assert from 'node:assert/strict';
import test from 'node:test';

import { uniqueFilename } from '../src/utils/files/uniqueFilename.js';

test('keeps every colliding ZIP entry by adding a stable suffix', () => {
  const used = new Set();
  assert.equal(uniqueFilename('report.pdf', used), 'report.pdf');
  assert.equal(uniqueFilename('report.pdf', used), 'report (2).pdf');
  assert.equal(uniqueFilename('report.pdf', used), 'report (3).pdf');
});
