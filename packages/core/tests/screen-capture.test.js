import assert from 'node:assert/strict';
import test from 'node:test';

import {
  REDACT_FILL_COLOR,
  REDACT_FILL_THRESHOLD,
  REDACT_MIN_BLOCK,
  applyRedaction,
  effectiveBlockSize,
  normalizeRedactRect,
  pixelateImageData,
} from '../src/utils/screenCapture/redact.js';
import {
  HISTORY_STORAGE_KEY,
  fitHistoryToBudget,
  readHistory,
  scaleToFit,
  upsertHistoryItem,
  writeHistory,
} from '../src/utils/screenCapture/history.js';
import { SCREEN_CAPTURE_I18N, formatMessage } from '../src/utils/screenCapture/i18n.js';

// Ảnh giả lập có "chữ": mỗi pixel một màu khác nhau để phát hiện pixel nào bị bỏ sót.
function makeImageData(width, height) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      data[i] = (x * 37 + y * 11) % 256;
      data[i + 1] = (x * 5 + y * 29) % 256;
      data[i + 2] = (x * 13 + y * 3) % 256;
      data[i + 3] = (x + y) % 2 ? 255 : 120;
    }
  }
  return { data, width, height };
}

test('normalizeRedactRect floors/ceils fractional drags and clamps to the canvas', () => {
  assert.deepEqual(normalizeRedactRect(10.6, 20.2, 137.4, 18.6, 800, 600), {
    x: 10,
    y: 20,
    width: 138,
    height: 19,
  });
  // Kéo ngược (w/h âm) và tràn ra ngoài canvas.
  assert.deepEqual(normalizeRedactRect(50.5, 40.5, -80.2, -60.9, 100, 100), {
    x: 0,
    y: 0,
    width: 51,
    height: 41,
  });
  assert.deepEqual(normalizeRedactRect(90.2, 90.2, 40, 40, 100, 100), {
    x: 90,
    y: 90,
    width: 10,
    height: 10,
  });
  assert.equal(normalizeRedactRect(10, 10, 0, 5, 100, 100), null);
  assert.equal(normalizeRedactRect(200, 200, 10, 10, 100, 100), null);
  assert.equal(normalizeRedactRect(NaN, 0, 10, 10, 100, 100), null);
});

test('pixelateImageData touches every pixel of a non-block-aligned area', () => {
  const width = 138; // không chia hết cho kích thước khối
  const height = 19;
  const original = makeImageData(width, height);
  const before = Uint8ClampedArray.from(original.data);
  const out = pixelateImageData(original, 12);

  let unchanged = 0;
  for (let p = 0; p < width * height; p++) {
    const i = p * 4;
    if (
      out.data[i] === before[i] &&
      out.data[i + 1] === before[i + 1] &&
      out.data[i + 2] === before[i + 2] &&
      out.data[i + 3] === before[i + 3]
    ) {
      unchanged++;
    }
    assert.equal(out.data[i + 3], 255, 'alpha must be forced opaque');
  }
  // Bản lỗi cũ bỏ sót ~96% byte; nay chỉ pixel trùng màu trung bình (hiếm) mới "không đổi".
  assert.ok(unchanged / (width * height) < 0.02, `too many untouched pixels: ${unchanged}`);

  // Mỗi khối là một màu duy nhất.
  const block = effectiveBlockSize(12);
  for (let by = 0; by < height; by += block) {
    for (let bx = 0; bx < width; bx += block) {
      const ref = (by * width + bx) * 4;
      for (let y = by; y < Math.min(height, by + block); y++) {
        for (let x = bx; x < Math.min(width, bx + block); x++) {
          const i = (y * width + x) * 4;
          assert.deepEqual(
            [out.data[i], out.data[i + 1], out.data[i + 2]],
            [out.data[ref], out.data[ref + 1], out.data[ref + 2]]
          );
        }
      }
    }
  }
});

test('block size never drops below the unrecoverable minimum; max strength is a solid fill', () => {
  assert.equal(effectiveBlockSize(4), REDACT_MIN_BLOCK);
  assert.equal(effectiveBlockSize(20), 20);

  const img = makeImageData(40, 30);
  pixelateImageData(img, REDACT_FILL_THRESHOLD);
  const [r, g, b] = REDACT_FILL_COLOR;
  for (let i = 0; i < img.data.length; i += 4) {
    assert.deepEqual([img.data[i], img.data[i + 1], img.data[i + 2], img.data[i + 3]], [r, g, b, 255]);
  }
});

test('applyRedaction reads/writes integer, in-bounds regions and falls back to a fill when pixels are unreadable', () => {
  const calls = [];
  const backing = makeImageData(64, 32);
  const ctx = {
    canvas: { width: 64, height: 32 },
    getImageData(x, y, w, h) {
      calls.push(['get', x, y, w, h]);
      return makeImageData(w, h);
    },
    putImageData(data, x, y) {
      calls.push(['put', x, y, data.width, data.height]);
    },
  };
  assert.equal(applyRedaction(ctx, { x: 60.7, y: -3.2, w: 20.5, h: 10.1 }, 12), true);
  assert.deepEqual(calls, [
    ['get', 60, 0, 4, 7],
    ['put', 60, 0, 4, 7],
  ]);
  for (const call of calls) call.slice(1).forEach((n) => assert.ok(Number.isInteger(n)));

  const fills = [];
  const tainted = {
    canvas: { width: 64, height: 32 },
    getImageData() {
      throw new Error('SecurityError');
    },
    fillRect(...args) {
      fills.push(args);
    },
  };
  assert.equal(applyRedaction(tainted, { x: 1.5, y: 1.5, w: 10, h: 10 }, 12), true);
  assert.deepEqual(fills, [[1, 1, 11, 11]]);
  assert.equal(backing.width, 64);
});

test('draft history keeps one entry per session and trims to the storage budget', () => {
  const a = { id: 's1', dataUrl: 'data:image/webp;base64,' + 'A'.repeat(100) };
  const b = { id: 's2', dataUrl: 'data:image/webp;base64,' + 'B'.repeat(100) };
  let list = upsertHistoryItem([], a);
  list = upsertHistoryItem(list, b);
  list = upsertHistoryItem(list, { ...a, dataUrl: a.dataUrl + 'x' });
  assert.deepEqual(list.map((it) => it.id), ['s1', 's2']);

  const trimmed = fitHistoryToBudget(list, JSON.stringify([list[0]]).length + 5);
  assert.deepEqual(trimmed.map((it) => it.id), ['s1']);

  assert.deepEqual(scaleToFit(3200, 1000, 1600), { width: 1600, height: 500 });
  assert.deepEqual(scaleToFit(800, 600, 1600), { width: 800, height: 600 });
});

test('history storage drops the legacy unredacted key and survives quota errors', () => {
  const store = new Map([
    ['snapcraft_history', '[{"dataUrl":"data:image/png;base64,RAW"}]'],
  ]);
  let quota = 250;
  const storage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    removeItem: (k) => store.delete(k),
    setItem: (k, v) => {
      if (v.length > quota) throw new Error('QuotaExceededError');
      store.set(k, v);
    },
  };
  assert.deepEqual(readHistory(storage), []);
  assert.equal(store.has('snapcraft_history'), false);

  const items = [
    { id: '1', dataUrl: 'd'.repeat(100) },
    { id: '2', dataUrl: 'd'.repeat(100) },
    { id: '3', dataUrl: 'd'.repeat(100) },
  ];
  const saved = writeHistory(storage, items);
  assert.deepEqual(saved.map((it) => it.id), ['1', '2']);
  assert.deepEqual(readHistory(storage).map((it) => it.id), ['1', '2']);

  quota = 0;
  assert.deepEqual(writeHistory(storage, items), []);
  assert.equal(store.has(HISTORY_STORAGE_KEY), false);
});

test('vi/en/ja dictionaries expose exactly the same keys', () => {
  const keysOf = (obj, prefix = '') =>
    Object.entries(obj).flatMap(([k, v]) =>
      v && typeof v === 'object' ? keysOf(v, `${prefix}${k}.`) : [`${prefix}${k}`]
    ).sort();
  const vi = keysOf(SCREEN_CAPTURE_I18N.vi);
  assert.deepEqual(keysOf(SCREEN_CAPTURE_I18N.en), vi);
  assert.deepEqual(keysOf(SCREEN_CAPTURE_I18N.ja), vi);
  assert.equal(formatMessage('{a} → {b}', { a: 'WEBP', b: 'PNG' }), 'WEBP → PNG');
});
