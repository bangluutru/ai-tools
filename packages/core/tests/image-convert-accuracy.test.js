import assert from 'node:assert/strict';
import test from 'node:test';

import {
  SUPPORTED_TARGET_FORMATS,
  computeTargetDimensions,
  encodeCanvasToBlob,
  formatFromMime,
} from '../src/utils/image/converter.js';
import { calculateSavedPercent, formatSizeChange } from '../src/utils/image/formatters.js';
import { isAnimatedGif } from '../src/utils/image/gif.js';
import { IOS_MAX_CANVAS_PIXELS, getMaxCanvasPixels, isIOSLike } from '../src/utils/image/limits.js';
import { extensionForMime } from '../src/utils/screenCapture/download.js';

// Canvas giả: toBlob trả về MIME do "trình duyệt" quyết định (Safari: luôn PNG cho WebP).
function fakeCanvas(produce) {
  return {
    width: 10,
    height: 10,
    toBlob(cb, mime) {
      const type = produce(mime);
      cb(type ? { type, size: 123 } : null);
    },
  };
}

test('WebP requests that the browser silently encodes as PNG are reported as PNG', async () => {
  const safari = fakeCanvas((mime) => (mime === 'image/jpeg' ? 'image/jpeg' : 'image/png'));
  const result = await encodeCanvasToBlob(safari, 'webp', 0.8);
  assert.equal(result.actualFormat, 'png');
  assert.equal(result.actualMime, 'image/png');
  assert.equal(result.fallbackFrom, 'webp');
  assert.equal(SUPPORTED_TARGET_FORMATS[result.actualFormat].ext, '.png');

  const chrome = fakeCanvas((mime) => mime);
  const ok = await encodeCanvasToBlob(chrome, 'webp', 0.8);
  assert.equal(ok.actualFormat, 'webp');
  assert.equal(ok.fallbackFrom, undefined);

  const jpeg = await encodeCanvasToBlob(chrome, 'jpeg', 0.8);
  assert.equal(jpeg.actualFormat, 'jpg');
  assert.equal(jpeg.fallbackFrom, undefined);
});

test('AVIF fallback reports the format that was really produced', async () => {
  // Không có document/VideoEncoder trong node → đi thẳng tới nhánh dự phòng.
  const safari = fakeCanvas(() => 'image/png');
  const r = await encodeCanvasToBlob(safari, 'avif', 0.8);
  assert.equal(r.actualFormat, 'png');
  assert.equal(r.fallbackFrom, 'avif');

  const chrome = fakeCanvas((mime) => mime);
  const w = await encodeCanvasToBlob(chrome, 'avif', 0.8);
  assert.equal(w.actualFormat, 'webp');
  assert.equal(w.fallbackFrom, 'avif');

  await assert.rejects(() => encodeCanvasToBlob(fakeCanvas(() => null), 'webp', 0.8));
});

test('MIME helpers map to real formats and extensions', () => {
  assert.equal(formatFromMime('image/jpeg'), 'jpg');
  assert.equal(formatFromMime('image/webp;codecs=x'), 'webp');
  assert.equal(formatFromMime('application/octet-stream'), null);
  assert.equal(extensionForMime('image/png'), 'png');
  assert.equal(extensionForMime('image/jpeg'), 'jpg');
});

test('files that got bigger show a positive growth percentage instead of 0%', () => {
  assert.equal(calculateSavedPercent(1000, 400), 60);
  assert.equal(calculateSavedPercent(1000, 1250), -25);
  assert.equal(formatSizeChange(60), '-60%');
  assert.equal(formatSizeChange(-25), '+25%');
  assert.equal(formatSizeChange(0), '0%');
});

test('target dimensions respect user limits and the iOS canvas pixel cap', () => {
  assert.deepEqual(computeTargetDimensions(4000, 3000, { maxWidth: 1920 }), {
    width: 1920,
    height: 1440,
    downscaledForDevice: false,
  });
  const ios = computeTargetDimensions(7000, 5000, { maxCanvasPixels: IOS_MAX_CANVAS_PIXELS });
  assert.equal(ios.downscaledForDevice, true);
  assert.ok(ios.width * ios.height <= IOS_MAX_CANVAS_PIXELS);
  assert.ok(Math.abs(ios.width / ios.height - 7000 / 5000) < 0.01);
  assert.equal(computeTargetDimensions(800, 600, { maxCanvasPixels: IOS_MAX_CANVAS_PIXELS }).downscaledForDevice, false);
});

test('iOS / iPadOS detection drives the lower canvas limit', () => {
  assert.equal(isIOSLike({ userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)' }), true);
  assert.equal(isIOSLike({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', maxTouchPoints: 5 }), true);
  assert.equal(isIOSLike({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', maxTouchPoints: 0 }), false);
  assert.equal(getMaxCanvasPixels({ userAgent: 'iPad' }), IOS_MAX_CANVAS_PIXELS);
  assert.equal(getMaxCanvasPixels({ userAgent: 'Windows NT 10.0' }), 40_000_000);
});

function gif(frames) {
  const header = [0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 1, 0, 1, 0, 0x00, 0, 0]; // GIF89a 1x1, no GCT
  const frame = [
    0x21, 0xf9, 0x04, 0x00, 0x0a, 0x00, 0x00, 0x00, // graphic control extension
    0x2c, 0, 0, 0, 0, 1, 0, 1, 0, 0x00, // image descriptor
    0x02, 0x02, 0x44, 0x01, 0x00, // LZW data
  ];
  const bytes = [...header];
  for (let i = 0; i < frames; i++) bytes.push(...frame);
  bytes.push(0x3b);
  return Uint8Array.from(bytes);
}

test('animated GIFs are detected so the UI can warn that only the first frame is kept', () => {
  assert.equal(isAnimatedGif(gif(1)), false);
  assert.equal(isAnimatedGif(gif(3)), true);
  assert.equal(isAnimatedGif(Uint8Array.from([0x89, 0x50, 0x4e, 0x47])), false);
});
