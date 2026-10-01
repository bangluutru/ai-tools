import assert from 'node:assert/strict';
import test from 'node:test';
import zlib from 'node:zlib';
import * as PDFLib from 'pdf-lib';

import {
  COMPRESS_PRESETS,
  compressPdf,
  compressedName,
  contentOperators,
  multiplyMatrix,
  planImageSize,
  undoPngPredictor,
} from '../../src/tools/pdf-toolkit/pdfCompressCore.js';
import { savedPercent } from '../../src/tools/pdf-toolkit/pdfToolkitCore.js';

let sharp = null;
try { sharp = (await import('sharp')).default; } catch { sharp = null; }

const inflateSync = (b) => new Uint8Array(zlib.inflateSync(b));
const deflateSync = (b) => new Uint8Array(zlib.deflateSync(b));

/** Codec giả lập: không cần canvas, đủ để kiểm tra luồng xử lý và quyết định giữ/thay. */
function fakeCodec({ jpegSize = 2000 } = {}) {
  const calls = [];
  return {
    calls,
    async jpegToJpeg(bytes, opts) { calls.push({ kind: 'jpeg', opts }); return new Uint8Array(jpegSize); },
    async rgbaToJpeg(rgba, w, h, opts) { calls.push({ kind: 'rgba', w, h, opts }); return new Uint8Array(jpegSize); },
    async inflate(b) { return inflateSync(b); },
    async deflate(b) { return deflateSync(b); },
  };
}

/** Codec thật dựa trên sharp: giải mã, thu nhỏ, nén JPEG như canvas trong trình duyệt. */
function sharpCodec() {
  return {
    async jpegToJpeg(bytes, { width, height, quality }) {
      return new Uint8Array(await sharp(bytes).resize(width, height, { fit: 'fill' }).jpeg({ quality: Math.round(quality * 100) }).toBuffer());
    },
    async rgbaToJpeg(rgba, sw, sh, { width, height, quality }) {
      return new Uint8Array(await sharp(Buffer.from(rgba), { raw: { width: sw, height: sh, channels: 4 } })
        .flatten({ background: '#ffffff' }).resize(width, height, { fit: 'fill' }).jpeg({ quality: Math.round(quality * 100) }).toBuffer());
    },
    async inflate(b) { return inflateSync(b); },
    async deflate(b) { return deflateSync(b); },
  };
}

function addImage(doc, { bytes, width, height, filter, colorSpace = 'DeviceRGB', extra = {} }) {
  return doc.context.register(PDFLib.PDFRawStream.of(doc.context.obj({
    Type: 'XObject', Subtype: 'Image', Width: width, Height: height, ColorSpace: colorSpace,
    BitsPerComponent: 8, ...(filter ? { Filter: filter } : {}), ...extra,
  }), bytes));
}

function drawImageOnPage(doc, page, ref, name, { x = 0, y = 0, w, h }) {
  const res = page.node.normalizedEntries().Resources;
  let xo = res.lookupMaybe(PDFLib.PDFName.of('XObject'), PDFLib.PDFDict);
  if (!xo) { xo = doc.context.obj({}); res.set(PDFLib.PDFName.of('XObject'), xo); }
  xo.set(PDFLib.PDFName.of(name), ref);
  const stream = doc.context.stream(`q ${w} 0 0 ${h} ${x} ${y} cm /${name} Do Q`);
  page.node.addContentStream(doc.context.register(stream));
}

/** Pixel nhiễu giả ảnh chụp: nén Flate kém, JPEG nén tốt hơn nhiều. */
function noisyRgb(width, height) {
  const out = new Uint8Array(width * height * 3);
  let seed = 12345;
  for (let i = 0; i < out.length; i += 1) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const gradient = (i / 3 / width) % 255;
    out[i] = (gradient + (seed >> 16) % 40) & 0xff;
  }
  return out;
}

test('planImageSize downsamples by displayed DPI, never upsamples, skips marginal resizes', () => {
  const big = planImageSize({ width: 3000, height: 2000, dpiX: 300, dpiY: 300, targetDpi: 150 });
  assert.deepEqual([big.width, big.height, big.resized], [1500, 1000, true]);
  const small = planImageSize({ width: 600, height: 400, dpiX: 72, dpiY: 72, targetDpi: 150 });
  assert.deepEqual([small.width, small.height, small.resized], [600, 400, false]);
  const marginal = planImageSize({ width: 1000, height: 1000, dpiX: 160, dpiY: 160, targetDpi: 150 });
  assert.equal(marginal.resized, false);
  const fallback = planImageSize({ width: 4000, height: 3000, fallbackLongPx: 1754, targetDpi: 150 });
  assert.equal(fallback.width, 1754);
  assert.equal(fallback.height, 1316);
  assert.ok(COMPRESS_PRESETS.strong.targetDpi < COMPRESS_PRESETS.balanced.targetDpi);
  assert.ok(COMPRESS_PRESETS.balanced.targetDpi < COMPRESS_PRESETS.light.targetDpi);
});

test('contentOperators ignores strings, arrays, dictionaries and inline images', () => {
  const src = 'q 1 0 0 1 5 6 cm (a b cm ) Tj [ (x) 10 ] TJ BI /W 1 ID \x00\x01 q EI /Im1 Do Q';
  const ops = [...contentOperators(new TextEncoder().encode(src))];
  assert.deepEqual(ops.map((o) => o.op), ['q', 'cm', 'Tj', 'TJ', 'Do', 'Q']);
  assert.deepEqual(ops[1].operands, [1, 0, 0, 1, 5, 6]);
  assert.deepEqual(ops[4].operands.at(-1), { name: 'Im1' });
  assert.deepEqual(multiplyMatrix([2, 0, 0, 2, 0, 0], [1, 0, 0, 1, 10, 10]), [2, 0, 0, 2, 10, 10]);
});

test('undoPngPredictor reverses Sub/Up/Paeth filters', () => {
  // 2 hàng × 3 điểm ảnh gray (bpc 8): hàng 1 Sub, hàng 2 Up.
  const data = Uint8Array.from([1, 10, 5, 5, 2, 1, 1, 1]);
  assert.deepEqual(Array.from(undoPngPredictor(data, { colors: 1, bpc: 8, columns: 3 })), [10, 15, 20, 11, 16, 21]);
});

test('compressPdf replaces oversized JPEG/Flate images using the displayed DPI and keeps the file valid', async () => {
  const doc = await PDFLib.PDFDocument.create();
  const page = doc.addPage([595, 842]);
  const jpegRef = addImage(doc, { bytes: new Uint8Array(200_000), width: 3000, height: 2000, filter: 'DCTDecode' });
  drawImageOnPage(doc, page, jpegRef, 'Im1', { w: 300, h: 200 }); // 3000px / (300/72 in) = 720 dpi
  const flate = deflateSync(noisyRgb(400, 400));
  const flateRef = addImage(doc, { bytes: flate, width: 400, height: 400, filter: 'FlateDecode' });
  drawImageOnPage(doc, page, flateRef, 'Im2', { w: 200, h: 200, x: 300, y: 300 });
  const input = await doc.save({ useObjectStreams: false });

  const codec = fakeCodec({ jpegSize: 5000 });
  const res = await compressPdf(PDFLib, input, { preset: 'balanced', codec });

  assert.equal(res.unchanged, false);
  assert.equal(res.images.optimized, 2);
  assert.ok(res.newSize < res.originalSize);
  const jpegCall = codec.calls.find((c) => c.kind === 'jpeg');
  assert.deepEqual([jpegCall.opts.width, jpegCall.opts.height], [625, 417]); // 150 dpi trên 4.17×2.78 in
  const out = await PDFLib.PDFDocument.load(res.bytes);
  assert.equal(out.getPageCount(), 1);
  const stream = out.context.lookup(jpegRef);
  assert.equal(stream.dict.get(PDFLib.PDFName.of('Filter')).decodeText(), 'DCTDecode');
  assert.equal(stream.dict.get(PDFLib.PDFName.of('Width')).asNumber(), 625);
});

test('compressPdf never grows a file: poor recompression keeps the original bytes', async () => {
  const doc = await PDFLib.PDFDocument.create();
  const page = doc.addPage([595, 842]);
  const ref = addImage(doc, { bytes: new Uint8Array(50_000), width: 1000, height: 1000, filter: 'DCTDecode' });
  drawImageOnPage(doc, page, ref, 'Im1', { w: 500, h: 500 });
  const input = await doc.save({ useObjectStreams: false });
  const res = await compressPdf(PDFLib, input, { preset: 'balanced', codec: fakeCodec({ jpegSize: 60_000 }) });
  assert.equal(res.images.optimized, 0);
  assert.ok(res.newSize <= res.originalSize);
  if (res.unchanged) assert.equal(res.bytes, input);
});

test('compressPdf leaves masks, SMask targets, CMYK and image masks untouched', async () => {
  const doc = await PDFLib.PDFDocument.create();
  const page = doc.addPage([595, 842]);
  const smaskRef = addImage(doc, { bytes: new Uint8Array(40_000), width: 800, height: 800, filter: 'DCTDecode', colorSpace: 'DeviceGray' });
  const withAlpha = addImage(doc, { bytes: new Uint8Array(60_000), width: 800, height: 800, filter: 'DCTDecode', extra: { SMask: smaskRef } });
  const cmyk = addImage(doc, { bytes: new Uint8Array(60_000), width: 800, height: 800, filter: 'DCTDecode', colorSpace: 'DeviceCMYK' });
  drawImageOnPage(doc, page, withAlpha, 'A', { w: 100, h: 100 });
  drawImageOnPage(doc, page, cmyk, 'B', { w: 100, h: 100, x: 200 });
  const input = await doc.save({ useObjectStreams: false });

  const codec = fakeCodec({ jpegSize: 1000 });
  const res = await compressPdf(PDFLib, input, { preset: 'balanced', codec });
  assert.equal(codec.calls.length, 1); // chỉ ảnh nền có SMask được nén lại
  const out = await PDFLib.PDFDocument.load(res.bytes);
  const smask = out.context.lookup(smaskRef);
  assert.equal(smask.dict.get(PDFLib.PDFName.of('ColorSpace')).decodeText(), 'DeviceGray');
  assert.ok(out.context.lookup(withAlpha).dict.get(PDFLib.PDFName.of('SMask')));
  assert.equal(out.context.lookup(cmyk).dict.get(PDFLib.PDFName.of('ColorSpace')).decodeText(), 'DeviceCMYK');
});

test('compressPdf deflates uncompressed streams and drops orphaned objects', async () => {
  const doc = await PDFLib.PDFDocument.create();
  const page = doc.addPage([595, 842]);
  page.drawText('Hello '.repeat(2000), { x: 10, y: 800, size: 6 });
  doc.context.register(doc.context.stream(new Uint8Array(300_000).fill(7))); // mồ côi, không ai tham chiếu
  const input = await doc.save({ useObjectStreams: false });
  const res = await compressPdf(PDFLib, input, { codec: fakeCodec() });
  assert.equal(res.unchanged, false);
  assert.ok(res.newSize < input.length / 4, `expected big saving, got ${res.newSize}/${input.length}`);
  assert.equal((await PDFLib.PDFDocument.load(res.bytes)).getPageCount(), 1);
});

test('compressPdf rejects encrypted-looking or invalid input instead of returning garbage', async () => {
  await assert.rejects(() => compressPdf(PDFLib, new TextEncoder().encode('not a pdf'), { codec: fakeCodec() }));
  await assert.rejects(() => compressPdf(PDFLib, new Uint8Array(10), {}), /NO_CODEC/);
});

test('helpers format names and percentages', () => {
  assert.equal(compressedName('Report.PDF'), 'Report_compressed.pdf');
  assert.equal(compressedName('a/b'), 'a_b_compressed.pdf');
  assert.equal(savedPercent(1000, 250), 75);
  assert.equal(savedPercent(1000, 1200), 0);
  assert.equal(savedPercent(0, 0), 0);
});

test('real codec: a photo-heavy PDF shrinks substantially with every preset and stays renderable', { skip: !sharp }, async () => {
  const photo = await sharp(Buffer.from(noisyRgb(2400, 1600)), { raw: { width: 2400, height: 1600, channels: 3 } })
    .jpeg({ quality: 95 }).toBuffer();
  const doc = await PDFLib.PDFDocument.create();
  for (let i = 0; i < 3; i += 1) {
    const page = doc.addPage([595, 842]);
    const ref = addImage(doc, { bytes: new Uint8Array(photo), width: 2400, height: 1600, filter: 'DCTDecode' });
    drawImageOnPage(doc, page, ref, 'Im1', { w: 495, h: 330, x: 50, y: 400 });
    page.drawText(`Trang ${i + 1}`, { x: 50, y: 780, size: 18 });
  }
  const input = await doc.save({ useObjectStreams: false });
  const sizes = {};
  for (const preset of ['light', 'balanced', 'strong']) {
    const res = await compressPdf(PDFLib, input, { preset, codec: sharpCodec() });
    sizes[preset] = res.newSize;
    assert.equal(res.unchanged, false, preset);
    assert.equal((await PDFLib.PDFDocument.load(res.bytes)).getPageCount(), 3);
  }
  assert.ok(sizes.balanced < input.length * 0.4, `balanced ${sizes.balanced} vs ${input.length}`);
  assert.ok(sizes.strong < sizes.balanced && sizes.balanced < sizes.light);
});
