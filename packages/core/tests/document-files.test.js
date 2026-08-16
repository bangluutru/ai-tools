import assert from 'node:assert/strict';
import test from 'node:test';

import {
  CONVERT_LIMITS,
  EXCEL_FILE_LIMITS,
  hasExpectedDocumentSignature,
  IMAGE_INPUT_LIMITS,
  PDF_COMPRESS_LIMITS,
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


test('recognises the signatures of the formats the newer miniapps accept', () => {
  const bytes = (...values) => Uint8Array.from(values);

  // OOXML (.docx/.pptx) dùng chung vỏ ZIP với .xlsx.
  assert.equal(hasExpectedDocumentSignature(bytes(0x50, 0x4b, 0x03, 0x04), '.docx'), true);
  assert.equal(hasExpectedDocumentSignature(bytes(0x50, 0x4b, 0x03, 0x04), '.pptx'), true);
  assert.equal(hasExpectedDocumentSignature(bytes(0x25, 0x50, 0x44, 0x46), '.docx'), false);

  assert.equal(hasExpectedDocumentSignature(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a), '.png'), true);
  assert.equal(hasExpectedDocumentSignature(bytes(0xff, 0xd8, 0xff, 0xe0), '.jpg'), true);
  assert.equal(hasExpectedDocumentSignature(bytes(0xff, 0xd8, 0xff, 0xe0), '.jpeg'), true);
  assert.equal(hasExpectedDocumentSignature(bytes(0x47, 0x49, 0x46, 0x38, 0x39, 0x61), '.gif'), true);

  // WebP là RIFF....WEBP nên phải đọc quá 8 byte đầu mới xác định được.
  const webp = bytes(0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50);
  assert.equal(hasExpectedDocumentSignature(webp, '.webp'), true);
  const riffWave = bytes(0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x41, 0x56, 0x45);
  assert.equal(hasExpectedDocumentSignature(riffWave, '.webp'), false);

  // Ảnh giả danh: đuôi .png nhưng ruột là JPEG.
  assert.equal(hasExpectedDocumentSignature(bytes(0xff, 0xd8, 0xff, 0xe0), '.png'), false);
});


test('the newer miniapps have limit presets to share', () => {
  for (const limits of [PDF_COMPRESS_LIMITS, CONVERT_LIMITS, IMAGE_INPUT_LIMITS]) {
    assert.equal(limits.maxFiles > 0, true);
    assert.equal(limits.maxFileBytes > 0, true);
    assert.equal(limits.maxTotalBytes >= limits.maxFileBytes, true);
    assert.equal(Array.isArray(limits.extensions) && limits.extensions.length > 0, true);
  }
  assert.equal(CONVERT_LIMITS.extensions.includes('.docx'), true);
  assert.equal(IMAGE_INPUT_LIMITS.maxFiles, 1);
});
