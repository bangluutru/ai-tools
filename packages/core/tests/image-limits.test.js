import assert from 'node:assert/strict';
import test from 'node:test';

import { IMAGE_LIMITS, SUPPORTED_IMAGE_EXTENSIONS, validateImageFiles } from '../src/utils/image/limits.js';
import { IMAGE_CONVERT_LIMITS } from '../src/utils/documentFiles.js';


const file = (name, size) => ({ name, size });


test('accepts only the browser formats explicitly supported by the portal', () => {
  const result = validateImageFiles([
    file('photo.JPG', 1024),
    file('scan.tiff', 1024),
    file('vector.svg', 1024),
  ]);

  assert.deepEqual(result.accepted.map((item) => item.name), ['photo.JPG']);
  assert.equal(result.rejected.length, 2);
});


test('enforces per-file, total-byte and count limits', () => {
  const customLimits = {
    ...IMAGE_LIMITS,
    maxFiles: 2,
    maxFileBytes: 10,
    maxTotalBytes: 15,
  };
  const result = validateImageFiles(
    [file('a.png', 6), file('b.jpg', 10), file('c.webp', 3)],
    [],
    customLimits,
  );

  assert.deepEqual(result.accepted.map((item) => item.name), ['a.png', 'c.webp']);
  // Câu chữ nay dùng chung với các miniapp khác thay vì mỗi nơi một kiểu.
  assert.match(result.rejected[0].reason, /Vượt tổng/i);
});


test('image limits come from the shared preset, not a second copy', () => {
  assert.equal(IMAGE_LIMITS, IMAGE_CONVERT_LIMITS);
  assert.equal(SUPPORTED_IMAGE_EXTENSIONS, IMAGE_CONVERT_LIMITS.extensions);
  // maxPixels là ràng buộc riêng của ảnh và phải sống sót qua lần gộp này.
  assert.equal(IMAGE_LIMITS.maxPixels, 40_000_000);
});


test('counts bytes already loaded, which the tool tracks as originalSize', () => {
  const existing = [{ originalSize: 20 }, { originalFile: { size: 5 } }];
  const result = validateImageFiles(
    [file('new.png', 10)],
    existing,
    { ...IMAGE_LIMITS, maxTotalBytes: 30 },
  );

  assert.deepEqual(result.accepted, []);
  assert.match(result.rejected[0].reason, /Vượt tổng/i);
});
