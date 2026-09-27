import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';
import * as XLSX from 'xlsx';

import { computeSlices, MIN_SLICE_PX } from '../src/utils/omniconvert/htmlPdfRenderer.js';
import {
  markdownToHtml,
  markdownToRenderBlocks,
  parseMarkdownBlocks,
  renderInline,
  textToRenderBlocks,
} from '../src/utils/omniconvert/markdownHtml.js';
import {
  convertPptxToMd,
  convertPptxToTxt,
  extractParagraphsFromSlideXml,
  extractPptxSlides,
} from '../src/utils/omniconvert/pptxTextConverter.js';
import { buildSheetBlocks, convertXlsxToCsv, sheetFileName } from '../src/utils/omniconvert/xlsxPdfConverter.js';
import { COMPATIBILITY_MATRIX, getSupportedTargets } from '../src/utils/omniconvert/formats.js';
import { convertMdToHtml } from '../src/utils/omniconvert/markdownConverter.js';
import { CONVERT_LIMITS, hasExpectedDocumentSignature } from '../src/utils/documentFiles.js';
import { mayHaveAlpha, resolveRasterSize } from '../src/utils/omniconvert/imagePdfConverter.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const read = (rel) => fs.readFileSync(path.join(repoRoot, rel), 'utf8');

const SLIDE = (body) => `<?xml version="1.0" encoding="UTF-8"?><p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><p:cSld><p:spTree>${body}</p:spTree></p:cSld></p:sld>`;
const SHAPE = (paras) => `<p:sp><p:txBody><a:bodyPr/>${paras.map((runs) => `<a:p><a:pPr lvl="0"/>${runs.map((t) => `<a:r><a:rPr lang="vi-VN"/><a:t>${t}</a:t></a:r>`).join('')}</a:p>`).join('')}</p:txBody></p:sp>`;

async function makePptx() {
  const zip = new JSZip();
  zip.file('[Content_Types].xml', '<Types/>');
  zip.file('ppt/slides/slide1.xml', SLIDE(SHAPE([['Báo cáo ', 'Quý 3'], ['Doanh thu &amp; lợi nhuận']])));
  zip.file('ppt/slides/slide10.xml', SLIDE(SHAPE([['Kết luận']])));
  zip.file('ppt/slides/slide2.xml', SLIDE(SHAPE([['日本語のスライド'], ['- điểm 1']])));
  zip.file('ppt/notesSlides/notesSlide1.xml', SLIDE(SHAPE([['Ghi chú người nói'], ['1']])));
  return zip.generateAsync({ type: 'uint8array' });
}

test('PPTX text extraction keeps slide order (2 before 10), runs, entities and notes', async () => {
  const slides = await extractPptxSlides(await makePptx());
  assert.deepEqual(slides.map((s) => s.number), [1, 2, 10]);
  assert.deepEqual(slides[0].paragraphs, ['Báo cáo Quý 3', 'Doanh thu & lợi nhuận']);
  assert.deepEqual(slides[0].notes, ['Ghi chú người nói']);
  assert.deepEqual(slides[1].paragraphs, ['日本語のスライド', '- điểm 1']);
  assert.deepEqual(extractParagraphsFromSlideXml('<a:p><a:r><a:t>A</a:t></a:r><a:br/><a:r><a:t>B</a:t></a:r></a:p>'), ['A\nB']);
  // <a:tbl>/<a:tc> không được nhầm là <a:t>.
  assert.deepEqual(extractParagraphsFromSlideXml('<a:p><a:tbl></a:tbl><a:r><a:t>X</a:t></a:r></a:p>'), ['X']);
});

test('convertPptxToTxt / convertPptxToMd produce text outputs', async () => {
  const bytes = await makePptx();
  const file = new File([bytes], 'deck.pptx');
  const txt = await convertPptxToTxt(file);
  assert.equal(txt.filename, 'deck.txt');
  const text = await txt.blob.text();
  assert.match(text, /--- Slide 1 ---\nBáo cáo Quý 3/);
  const md = await convertPptxToMd(file);
  const mdText = await md.blob.text();
  assert.match(mdText, /^# deck/);
  assert.match(mdText, /## Slide 1: Báo cáo Quý 3/);
  assert.match(mdText, /> Ghi chú người nói/);
  await assert.rejects(() => extractPptxSlides(new JSZip().generateAsync({ type: 'uint8array' })), /không chứa slide/);
});

test('PPTX is offered only as text source; pdf→pptx target removed; xls/bmp accepted', () => {
  assert.deepEqual(getSupportedTargets('pptx'), ['txt', 'md']);
  for (const targets of Object.values(COMPATIBILITY_MATRIX)) assert.equal(targets.includes('pptx'), false);
  assert.deepEqual(getSupportedTargets('xls'), ['pdf', 'csv', 'md']);
  assert.equal(CONVERT_LIMITS.extensions.includes('.xls'), true);
  assert.equal(CONVERT_LIMITS.extensions.includes('.bmp'), true);
  assert.equal(hasExpectedDocumentSignature(Uint8Array.from([0x42, 0x4d, 0, 0]), '.bmp'), true);
  assert.equal(hasExpectedDocumentSignature(Uint8Array.from([0x89, 0x50]), '.bmp'), false);
});

test('Markdown → HTML escapes raw HTML, blocks unsafe links and wraps list items', async () => {
  const html = markdownToHtml('# T\n\n<script>alert(1)</script>\n\n- a\n- **b**\n\n1. x\n2. y\n\n[ok](https://example.com) [bad](javascript:alert(1))');
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /<ul><li>a<\/li><li><strong>b<\/strong><\/li><\/ul>/);
  assert.match(html, /<ol><li>x<\/li><li>y<\/li><\/ol>/);
  assert.match(html, /<a href="https:\/\/example.com">ok<\/a>/);
  assert.doesNotMatch(html, /javascript:/);
  assert.equal(renderInline('`<b>`'), '<code>&lt;b&gt;</code>');

  const file = new File(['# A\n\n<img src=x onerror=alert(1)>\n\n- one'], 'x.md');
  const out = await (await convertMdToHtml(file)).blob.text();
  assert.doesNotMatch(out, /<img src=x/);
  assert.match(out, /<ul><li>one<\/li><\/ul>/);
});

test('Markdown blocks: tables, code fences and page-splittable render blocks', () => {
  const blocks = parseMarkdownBlocks('| A | B |\n| --- | :-: |\n| 1 | 2 |\n\n```\nline1\nline2\n```');
  assert.equal(blocks[0].type, 'table');
  assert.deepEqual(blocks[0].header, ['A', 'B']);
  assert.deepEqual(blocks[0].rows, [['1', '2']]);
  assert.deepEqual(blocks[1], { type: 'code', lines: ['line1', 'line2'] });
  const render = markdownToRenderBlocks('- a\n- b\n\n```\nx\ny\n```');
  assert.equal(render.length, 4, 'mỗi mục danh sách / dòng code là một khối để ngắt trang');
  const txt = textToRenderBlocks('Tiếng Việt <b>\n\n日本語');
  assert.equal(txt.length, 3);
  assert.match(txt[0].html, /Tiếng Việt &lt;b&gt;/);
});

test('computeSlices never yields fractional or sliver slices', () => {
  const slices = computeSlices(2000.4, 841.89 * 2);
  assert.deepEqual(slices.map((s) => s.height), [1683, 317]);
  assert.ok(slices.every((s) => Number.isInteger(s.y) && Number.isInteger(s.height)));
  const sliver = computeSlices(1684, 1683);
  assert.equal(sliver.length, 1, `phần dư < ${MIN_SLICE_PX}px bị bỏ`);
});

test('buildSheetBlocks paginates via a row-splittable table with a repeated header', () => {
  const rows = [['Tên', 'Số'], ...Array.from({ length: 1000 }, (_, i) => [`<r${i}>`, i])];
  const blocks = buildSheetBlocks('Sheet <1>', rows);
  assert.match(blocks[0].html, /Sheet &lt;1&gt;/);
  const table = blocks.find((b) => b.table).table;
  assert.equal(table.rowsHtml.length, 1000);
  assert.match(table.headerHtml, /<th>Tên<\/th><th>Số<\/th>/);
  assert.match(table.rowsHtml[0], /&lt;r0&gt;/);
  const capped = buildSheetBlocks('S', rows, 10);
  assert.equal(capped.find((b) => b.table).table.rowsHtml.length, 10);
  assert.ok(capped.some((b) => b.html && /10 \/ 1000/.test(b.html)));
  assert.deepEqual(buildSheetBlocks('Empty', []), []);
});

test('XLSX → CSV exports every non-empty sheet (ZIP when more than one)', async () => {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['a', 'b'], [1, 2]]), 'Doanh thu');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([]), 'Trống');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['x'], ['日本']]), 'Chi<phí');
  const bytes = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const result = await convertXlsxToCsv(new File([bytes], 'book.xlsx'));
  assert.equal(result.isZip, true);
  assert.equal(result.filename, 'book_csv.zip');
  const zip = await JSZip.loadAsync(await result.blob.arrayBuffer());
  assert.deepEqual(Object.keys(zip.files).sort(), ['01_Doanh thu.csv', '03_Chi_phí.csv']);
  assert.match(await zip.file('03_Chi_phí.csv').async('string'), /日本/);
  assert.equal(sheetFileName('a:b', 0), '01_a_b.csv');

  const single = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(single, XLSX.utils.aoa_to_sheet([['only']]), 'S1');
  const one = await convertXlsxToCsv(new File([XLSX.write(single, { bookType: 'xlsx', type: 'array' })], 'one.xlsx'));
  assert.equal(one.isZip, false);
  assert.equal(one.filename, 'one.csv');
});

test('image → PDF keeps alpha for PNG/WebP/SVG and guards SVG without size', () => {
  assert.equal(mayHaveAlpha({ name: 'a.png', type: 'image/png' }), true);
  assert.equal(mayHaveAlpha({ name: 'a.webp', type: '' }), true);
  assert.equal(mayHaveAlpha({ name: 'a.svg', type: 'image/svg+xml' }), true);
  assert.equal(mayHaveAlpha({ name: 'a.jpg', type: 'image/jpeg' }), false);
  assert.deepEqual(resolveRasterSize(0, 0), { width: 1024, height: 1024 });
  const big = resolveRasterSize(20000, 20000);
  assert.ok(big.width * big.height <= 40_000_000);
});

test('OmniConvert UI drops unsupported claims, PPTX target and raw DOCX HTML injection', () => {
  const view = read('packages/core/src/components/OmniConvertView.jsx');
  assert.doesNotMatch(view, /WASM ENGINE/);
  assert.doesNotMatch(view, /WebAssembly —/);
  assert.doesNotMatch(view, /pixel-perfect/);
  assert.doesNotMatch(view, /dangerouslySetInnerHTML/);
  assert.doesNotMatch(view, /keepHyperlinks|embedFonts|compressImages/);
  assert.doesNotMatch(view, /id: 'pptx',\s*\n\s*title: 'PowerPoint Thuyết Trình'/);
  assert.match(view, /sandbox=""/);
  const helper = read('packages/core/src/utils/omniconvert/pdfHelper.js');
  assert.doesNotMatch(helper, /unpkg\.com/);
  assert.doesNotMatch(helper, /GlobalWorkerOptions/);
  const loader = read('packages/core/src/utils/pdfjs.js');
  assert.match(loader, /pdfjs-dist\/legacy\/build\/pdf\.mjs/);
  assert.match(loader, /pdfjs-dist\/legacy\/build\/pdf\.worker\.min\.mjs\?url/);
  assert.doesNotMatch(loader, /https?:\/\/(unpkg|cdn\.jsdelivr|cdnjs)/);
  const router = read('packages/core/src/utils/omniconvert/engineRouter.js');
  assert.doesNotMatch(router, /setFont\('helvetica'/);
  assert.doesNotMatch(read('packages/core/src/utils/omniconvert/markdownConverter.js'), /setFont\('helvetica'/);
});
