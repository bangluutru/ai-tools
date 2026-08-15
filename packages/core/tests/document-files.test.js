import assert from 'node:assert/strict';
import test from 'node:test';

import {
  EXCEL_FILE_LIMITS,
  hasExpectedDocumentSignature,
  validateDocumentFiles,
} from '../src/utils/documentFiles.js';

test('document limits reject unsupported, oversized and excess files', () => {
  const files = [
    { name: 'ledger.xlsx', size: 100 },
    { name: 'notes.txt', size: 100 },
    { name: 'large.xls', size: EXCEL_FILE_LIMITS.maxFileBytes + 1 },
  ];
  const result = validateDocumentFiles(files, [], EXCEL_FILE_LIMITS);
  assert.deepEqual(result.accepted.map((file) => file.name), ['ledger.xlsx']);
  assert.equal(result.rejected.length, 2);
});

test('recognizes PDF, XLSX and legacy XLS signatures', () => {
  assert.equal(hasExpectedDocumentSignature(new TextEncoder().encode('%PDF-1.7'), '.pdf'), true);
  assert.equal(hasExpectedDocumentSignature(Uint8Array.from([0x50, 0x4b, 0x03, 0x04]), '.xlsx'), true);
  assert.equal(hasExpectedDocumentSignature(Uint8Array.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]), '.xls'), true);
  assert.equal(hasExpectedDocumentSignature(new TextEncoder().encode('<html>'), '.pdf'), false);
});
