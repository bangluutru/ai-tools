import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as PDFLib from 'pdf-lib';

import {
  A4_SIZE,
  buildPdf,
  ensurePdfName,
  fitToA4Placement,
  normalizeRotation,
  pageNumberPlacement,
  parsePageRanges,
  rangeLabel,
} from '../../src/tools/pdf-toolkit/pdfToolkitCore.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

async function makePdf(sizes) {
  const doc = await PDFLib.PDFDocument.create();
  const font = await doc.embedFont(PDFLib.StandardFonts.Helvetica);
  sizes.forEach(([w, h], i) => {
    const page = doc.addPage([w, h]);
    page.drawText(`Page ${i + 1}`, { x: 20, y: 20, size: 12, font });
  });
  return doc.save();
}

test('parsePageRanges parses lists, open ranges and rejects invalid input instead of falling back to page 1', () => {
  assert.deepEqual(parsePageRanges('1-3, 5, 8-', 10).ranges, [[1, 2, 3], [5], [8, 9, 10]]);
  assert.deepEqual(parsePageRanges('2', 3), { ranges: [[2]], errors: [] });
  assert.ok(parsePageRanges('abc', 5).errors.length > 0);
  assert.ok(parsePageRanges('4-2', 5).errors.length > 0);
  assert.ok(parsePageRanges('9', 5).errors.length > 0);
  assert.ok(parsePageRanges('0', 5).errors.length > 0);
  assert.ok(parsePageRanges('', 5).errors.length > 0);
  assert.ok(parsePageRanges(' , ', 5).errors.length > 0);
});

test('normalizeRotation keeps angles within 0/90/180/270', () => {
  assert.equal(normalizeRotation(360), 0);
  assert.equal(normalizeRotation(450), 90);
  assert.equal(normalizeRotation(-90), 270);
  assert.equal(normalizeRotation(270 + 90), 0);
});

test('fitToA4Placement picks orientation from the displayed page and fits inside A4', () => {
  const portrait = fitToA4Placement(612, 792, 0); // US Letter
  assert.deepEqual(portrait.pageSize, [A4_SIZE.width, A4_SIZE.height]);
  assert.ok(612 * portrait.scale <= A4_SIZE.width + 1e-6);
  assert.ok(792 * portrait.scale <= A4_SIZE.height + 1e-6);

  const rotated = fitToA4Placement(612, 792, 90); // portrait page shown landscape
  assert.deepEqual(rotated.pageSize, [A4_SIZE.height, A4_SIZE.width]);
  assert.equal(rotated.rotate, -90);
});

test('pageNumberPlacement follows the visual bottom edge for rotated pages', () => {
  const box = { x0: 0, y0: 0, width: 600, height: 800 };
  assert.equal(pageNumberPlacement(box, 0, 20).rotate, 0);
  assert.equal(pageNumberPlacement(box, 0, 20).y, 18);
  const r90 = pageNumberPlacement(box, 90, 20);
  assert.equal(r90.rotate, 90);
  assert.equal(r90.x, 600 - 18);
  assert.equal(pageNumberPlacement(box, 180, 20).y, 800 - 18);
  assert.equal(pageNumberPlacement(box, 270, 20).x, 18);
});

test('buildPdf applies order, rotation, A4 normalization and page numbering', async () => {
  const a = await makePdf([[612, 792], [300, 300]]);
  const b = await makePdf([[842, 595]]);
  const sources = [{ key: 'a', bytes: a }, { key: 'b', bytes: b }];

  const plain = await buildPdf(PDFLib, sources, [
    { sourceKey: 'b', pageIndex: 0 },
    { sourceKey: 'a', pageIndex: 1, rotation: 450 },
  ]);
  const plainDoc = await PDFLib.PDFDocument.load(plain.bytes);
  assert.equal(plain.pageCount, 2);
  assert.equal(plainDoc.getPage(0).getWidth(), 842);
  assert.equal(plainDoc.getPage(1).getRotation().angle, 90);

  const a4 = await buildPdf(PDFLib, sources, [
    { sourceKey: 'a', pageIndex: 0 },
    { sourceKey: 'a', pageIndex: 1 },
    { sourceKey: 'b', pageIndex: 0 },
  ], { normalizeA4: true, pageNumbering: true });
  const a4Doc = await PDFLib.PDFDocument.load(a4.bytes);
  const sizes = a4Doc.getPages().map((p) => [Math.round(p.getWidth()), Math.round(p.getHeight())]);
  assert.deepEqual(sizes, [[595, 842], [595, 842], [842, 595]]);
});

test('buildPdf refuses an empty page list and ensurePdfName/rangeLabel format names', async () => {
  await assert.rejects(() => buildPdf(PDFLib, [], []), /NO_PAGES/);
  assert.equal(ensurePdfName('report'), 'report.pdf');
  assert.equal(ensurePdfName('a/b:c.PDF'), 'a_b_c.PDF');
  assert.equal(rangeLabel([3, 4, 5]), '3-5');
  assert.equal(rangeLabel([7]), '7');
});

test('pdf-toolkit wires the page settings into execution and drops unsupported claims', () => {
  const content = fs.readFileSync(path.join(repoRoot, 'hub/src/tools/pdf-toolkit/PdfToolkitTool.jsx'), 'utf8');
  assert.doesNotMatch(content, /keepBookmarks/);
  assert.doesNotMatch(content, /Khổ A4 chuẩn/);
  assert.doesNotMatch(content, /nén giảm dung lượng/);
  assert.doesNotMatch(content, /pdfjs-dist\/build\/pdf\.worker/);
  assert.match(content, /normalizeA4,\s*\n\s*pageNumbering,/);
  assert.match(content, /PDF_MERGE_LIMITS\.maxPages/);
  assert.match(content, /IntersectionObserver/);
});
