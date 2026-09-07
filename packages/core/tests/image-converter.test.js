import assert from 'node:assert/strict';
import test from 'node:test';

import {
  SUPPORTED_TARGET_FORMATS,
  convertImage,
  convertImageToWebP,
} from '../src/utils/image/converter.js';

test('converter exports supported target formats including webp, avif, jpg, jpeg', () => {
  assert.ok(SUPPORTED_TARGET_FORMATS && typeof SUPPORTED_TARGET_FORMATS === 'object');
  const formats = Object.keys(SUPPORTED_TARGET_FORMATS);
  assert.ok(formats.includes('webp'));
  assert.ok(formats.includes('avif'));
  assert.ok(formats.includes('jpg'));
  assert.ok(formats.includes('jpeg'));

  assert.equal(SUPPORTED_TARGET_FORMATS.webp.mime, 'image/webp');
  assert.equal(SUPPORTED_TARGET_FORMATS.avif.mime, 'image/avif');
  assert.equal(SUPPORTED_TARGET_FORMATS.jpg.mime, 'image/jpeg');
  assert.equal(SUPPORTED_TARGET_FORMATS.jpeg.mime, 'image/jpeg');
});

test('convertImageToWebP function exists for 100% backward compatibility', () => {
  assert.equal(typeof convertImageToWebP, 'function');
  assert.equal(typeof convertImage, 'function');
});

test('convertImage validates that a file must be provided', async () => {
  await assert.rejects(
    async () => {
      await convertImage(null);
    },
    {
      message: /File ảnh rỗng hoặc không hợp lệ/i,
    }
  );
});
