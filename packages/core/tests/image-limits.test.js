import assert from 'node:assert/strict';
import test from 'node:test';

import { IMAGE_LIMITS, validateImageFiles } from '../src/utils/image/limits.js';


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
  assert.match(result.rejected[0].reason, /tổng dung lượng/i);
});
