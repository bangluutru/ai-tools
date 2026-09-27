import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import zlib from 'node:zlib';
import { Buffer } from 'node:buffer';
import { createRequire } from 'node:module';
import path from 'node:path';
import {
  setJpegDpiBytes,
  readJfifDensity,
  setPngDpiBytes,
  readPngPhys,
  listPngChunks,
} from '../src/utils/id-photo/imageDpi.js';
import { ID_STANDARDS, getStandardById } from '../src/utils/id-photo/standards.js';
import { computeAutoFraming, estimateHeadBounds } from '../src/utils/id-photo/faceDetection.js';
import { validateFraming } from '../src/utils/id-photo/validation.js';
import { resolveSheetDpi, MAX_SAFE_CANVAS_PIXELS, mmToPixels } from '../src/utils/id-photo/exportEngine.js';
import { MEDIAPIPE_VERSION, IMGLY_VERSION, FACE_DETECTOR_MODEL_URL, SELFIE_SEGMENTER_MODEL_URL, IMGLY_MODEL } from '../src/utils/id-photo/mediapipeConfig.js';

const require = createRequire(import.meta.url);

// --- JPEG ---------------------------------------------------------------
function minimalJpeg({ withJfif = true } = {}) {
  const soi = [0xff, 0xd8];
  const app0 = [0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00];
  const dqt = [0xff, 0xdb, 0x00, 0x04, 0xaa, 0xbb];
  const sos = [0xff, 0xda, 0x00, 0x02, 0x11, 0x22, 0x33];
  const eoi = [0xff, 0xd9];
  return new Uint8Array([...soi, ...(withJfif ? app0 : []), ...dqt, ...sos, ...eoi]);
}

test('JPEG DPI: patches JFIF units/density at the spec offsets (p+11..p+15)', () => {
  const src = minimalJpeg();
  const out = setJpegDpiBytes(src, 300);
  assert.equal(out.length, src.length);
  const d = readJfifDensity(out);
  assert.deepEqual({ units: d.units, x: d.xDensity, y: d.yDensity }, { units: 1, x: 300, y: 300 });
  const p = d.offset;
  assert.equal(p, 2);
  // "JFIF\0" and version untouched, thumbnail bytes untouched
  assert.deepEqual([...out.slice(p + 4, p + 11)], [0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01]);
  assert.deepEqual([...out.slice(p + 16, p + 18)], [0, 0]);
  // bytes outside the density fields are unchanged
  for (let i = 0; i < src.length; i++) {
    if (i >= p + 11 && i <= p + 15) continue;
    assert.equal(out[i], src[i], `byte ${i} changed`);
  }
  assert.equal(readJfifDensity(setJpegDpiBytes(src, 600)).xDensity, 600);
});

test('JPEG DPI: inserts a JFIF APP0 when missing', () => {
  const src = minimalJpeg({ withJfif: false });
  const out = setJpegDpiBytes(src, 300);
  assert.equal(out.length, src.length + 18);
  const d = readJfifDensity(out);
  assert.equal(d.offset, 2);
  assert.equal(d.units, 1);
  assert.equal(d.xDensity, 300);
  assert.equal(d.yDensity, 300);
});

// --- PNG ----------------------------------------------------------------
function crc32(buf) {
  let c;
  let crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function minimalPng() {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(1, 0);
  ihdr.writeUInt32BE(1, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const raw = Buffer.from([0, 255, 0, 0]);
  return new Uint8Array(Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]));
}

test('PNG DPI: inserts a valid pHYs chunk (px/m, unit=1) before IDAT', () => {
  const out = setPngDpiBytes(minimalPng(), 300);
  const phys = readPngPhys(out);
  assert.equal(phys.xPpm, Math.round(300 / 0.0254));
  assert.equal(phys.yPpm, 11811);
  assert.equal(phys.unit, 1);
  assert.equal(phys.crcValid, true);
  const types = listPngChunks(out).map((c) => c.type);
  assert.deepEqual(types, ['IHDR', 'pHYs', 'IDAT', 'IEND']);
  // re-applying replaces instead of duplicating
  const again = setPngDpiBytes(out, 600);
  assert.deepEqual(listPngChunks(again).map((c) => c.type), ['IHDR', 'pHYs', 'IDAT', 'IEND']);
  assert.equal(readPngPhys(again).xPpm, Math.round(600 / 0.0254));
  // every chunk CRC stays valid
  for (const c of listPngChunks(again)) {
    const td = again.subarray(c.offset + 4, c.offset + 8 + c.length);
    const crc = Buffer.from(again.subarray(c.offset + 8 + c.length, c.offset + 12 + c.length)).readUInt32BE();
    assert.equal(crc32(td), crc, `${c.type} CRC`);
  }
});

// --- Standards ----------------------------------------------------------
test('standards: exact ranges from mm specs (no ±5 slack)', () => {
  const jp = getStandardById('jp-passport');
  assert.equal(jp.spec.level, 'official');
  assert.ok(Math.abs(jp.faceHeightPercentMin - 32 / 45 * 100) < 1e-9);
  assert.ok(Math.abs(jp.faceHeightPercentMax - 80) < 1e-9);
  assert.ok(Math.abs(jp.topMarginPercentMin - 2 / 45 * 100) < 1e-9);
  assert.ok(Math.abs(jp.topMarginPercentMax - 6 / 45 * 100) < 1e-9);
  const us = getStandardById('us-visa');
  assert.equal(us.widthMm, 50.8);
  assert.ok(Math.abs(us.faceHeightPercentMin - 50) < 1e-9);
  assert.ok(Math.abs(us.faceHeightPercentMax - 68.75) < 1e-9);
  const vn = getStandardById('vn-id-card');
  assert.ok(!/CCCD\s*\(/.test(vn.name.ja) && !vn.name.ja.includes('CCCD'), 'ja name must not present the photo as a CCCD photo');
  for (const s of ID_STANDARDS) {
    assert.ok(s.spec && ['official', 'reference'].includes(s.spec.level), `${s.id} spec level`);
    assert.ok(s.faceHeightPercentMin < s.faceHeightPercentMax);
    assert.ok(s.topMarginPercentMin < s.topMarginPercentMax);
  }
});

test('auto-align result passes validation for every standard (shared head model)', () => {
  const imageW = 1600;
  const imageH = 2000;
  const face = {
    box: { x: 620, y: 700, width: 360, height: 420 },
    landmarks: {
      rightEye: { x: 720, y: 840 },
      leftEye: { x: 880, y: 842 },
      noseTip: { x: 800, y: 930 },
      mouthCenter: { x: 800, y: 1010 },
    },
    tiltAngleDeg: 0.7,
    confidence: 0.95,
  };
  const head = estimateHeadBounds(face);
  assert.ok(head.chinY > face.landmarks.mouthCenter.y && head.crownY < face.box.y);
  for (const s of ID_STANDARDS) {
    const transform = { ...computeAutoFraming(face, imageW, imageH, s), brightness: 0, contrast: 0, saturation: 0, sharpness: 0 };
    const v = validateFraming(face, imageW, imageH, s, transform);
    const codes = v.warnings.map((w) => w.code);
    assert.ok(v.isFaceRatioAcceptable, `${s.id}: face ratio ${v.faceHeightRatio}% not in [${s.faceHeightPercentMin}, ${s.faceHeightPercentMax}]`);
    assert.ok(v.isTopMarginAcceptable, `${s.id}: top margin ${v.topMarginPercent}%`);
    assert.ok(!codes.includes('FACE_TOO_LARGE') && !codes.includes('FACE_TOO_SMALL'), `${s.id}: ${codes}`);
  }
});

test('validation rejects a face just outside the exact JP passport range', () => {
  const s = getStandardById('jp-passport');
  const face = {
    box: { x: 620, y: 700, width: 360, height: 420 },
    landmarks: { rightEye: { x: 720, y: 840 }, leftEye: { x: 880, y: 840 }, noseTip: { x: 800, y: 930 }, mouthCenter: { x: 800, y: 1010 } },
    tiltAngleDeg: 0,
  };
  const base = computeAutoFraming(face, 1600, 2000, s);
  const v0 = validateFraming(face, 1600, 2000, s, { ...base });
  // scale so the face is 81% (> 80% max) — previously accepted thanks to the +5% slack
  const bigger = { ...base, scale: base.scale * 81 / v0.faceHeightRatio };
  const v = validateFraming(face, 1600, 2000, s, bigger);
  assert.equal(v.isFaceRatioAcceptable, false);
  assert.ok(v.warnings.some((w) => w.code === 'FACE_TOO_LARGE'));
});

// --- Export limits ------------------------------------------------------
test('sheet DPI is capped to the safe canvas area (A4 @600 → 300)', () => {
  const a4 = resolveSheetDpi(210, 297, 600);
  assert.equal(a4.downgraded, true);
  assert.equal(a4.dpi, 300);
  assert.ok(mmToPixels(210, a4.dpi) * mmToPixels(297, a4.dpi) <= MAX_SAFE_CANVAS_PIXELS);
  assert.deepEqual(resolveSheetDpi(89, 127, 600), { dpi: 600, downgraded: false });
});

// --- Runtime asset pinning ---------------------------------------------
test('MediaPipe wasm version matches the installed JS; model URLs are pinned', () => {
  // package.json is not in the packages' "exports" → read it next to the resolved entry file
  const pkgVersion = (name) => {
    let dir = path.dirname(require.resolve(name));
    while (!fs.existsSync(path.join(dir, 'package.json')) || JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8')).name !== name) {
      dir = path.dirname(dir);
    }
    return JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8')).version;
  };
  assert.equal(MEDIAPIPE_VERSION, pkgVersion('@mediapipe/tasks-vision'));
  assert.equal(IMGLY_VERSION, pkgVersion('@imgly/background-removal'));
  assert.equal(IMGLY_MODEL, 'isnet_quint8');
  for (const url of [FACE_DETECTOR_MODEL_URL, SELFIE_SEGMENTER_MODEL_URL]) assert.ok(!url.includes('/latest/'), url);
  for (const f of ['faceDetection.js', 'backgroundRemoval.js']) {
    const src = fs.readFileSync(new URL(`../src/utils/id-photo/${f}`, import.meta.url), 'utf8');
    assert.ok(!src.includes('tasks-vision@0.10.14'), `${f} must not pin an old wasm version`);
    assert.ok(!src.includes('/latest/'), `${f} must not use /latest/ model URLs`);
  }
  const bg = fs.readFileSync(new URL('../src/utils/id-photo/backgroundRemoval.js', import.meta.url), 'utf8');
  assert.ok(bg.includes('AGPL-3.0'), 'AGPL licensing note must be present');
  assert.ok(!/setTimeout\([^)]*15000/.test(bg), 'no hard 15s timeout');
});
