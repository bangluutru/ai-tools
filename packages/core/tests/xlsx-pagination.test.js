import assert from 'node:assert/strict';
import test from 'node:test';

import { MAX_ROWS_PER_PDF_PAGE, paginateRows } from '../src/utils/omniconvert/xlsxPagination.js';

test('paginates every Excel row without truncation', () => {
  const rows = Array.from({ length: 205 }, (_, index) => [`row-${index + 1}`]);
  const pages = paginateRows(rows);

  assert.equal(MAX_ROWS_PER_PDF_PAGE, 100);
  assert.deepEqual(pages.map((page) => page.length), [100, 100, 5]);
  assert.deepEqual(pages.flat(), rows);
});

test('creates one header-only page for an empty worksheet', () => {
  assert.deepEqual(paginateRows([]), [[]]);
});
