import assert from 'node:assert/strict';
import test from 'node:test';

import {
  FORMAT_TYPES,
  FORMAT_DETAILS,
  COMPATIBILITY_MATRIX,
  getSupportedTargets,
  isFormatSupported
} from '../src/utils/omniconvert/formats.js';

import {
  convertTxtToMd,
  convertXlsxToMd,
  convertMdToTxt,
  convertMdToHtml,
  convertMdToDocx,
  convertMdToPdf
} from '../src/utils/omniconvert/markdownConverter.js';

test('formats.js declares Markdown (.md) and HTML (.html) formats correctly', () => {
  assert.equal(FORMAT_TYPES.MD, 'md');
  assert.equal(FORMAT_TYPES.HTML, 'html');
  assert.equal(isFormatSupported('md'), true);
  assert.equal(isFormatSupported('html'), true);
  assert.equal(FORMAT_DETAILS.md.category, 'document');
  assert.equal(FORMAT_DETAILS.md.ext, 'md');
});

test('COMPATIBILITY_MATRIX supports bidirectional Markdown conversion', () => {
  const docxTargets = getSupportedTargets('docx');
  assert.equal(docxTargets.includes('md'), true);

  const pdfTargets = getSupportedTargets('pdf');
  assert.equal(pdfTargets.includes('md'), true);

  const xlsxTargets = getSupportedTargets('xlsx');
  assert.equal(xlsxTargets.includes('md'), true);

  const csvTargets = getSupportedTargets('csv');
  assert.equal(csvTargets.includes('md'), true);

  const txtTargets = getSupportedTargets('txt');
  assert.equal(txtTargets.includes('md'), true);

  const mdTargets = getSupportedTargets('md');
  assert.equal(mdTargets.includes('pdf'), true);
  assert.equal(mdTargets.includes('docx'), true);
  assert.equal(mdTargets.includes('txt'), true);
  assert.equal(mdTargets.includes('html'), true);
});

test('convertTxtToMd converts plain text into Markdown document', async () => {
  const file = new File(['Dong 1 noi dung\nDong 2 noi dung'], 'test_sample.txt', { type: 'text/plain' });
  const result = await convertTxtToMd(file);

  assert.equal(result.filename, 'test_sample.md');
  assert.equal(result.mimeType, 'text/markdown;charset=utf-8');
  assert.ok(result.blob.size > 0);

  const content = await result.blob.text();
  assert.ok(content.startsWith('# test_sample'));
  assert.ok(content.includes('Dong 1 noi dung'));
});

test('convertMdToTxt strips markdown syntax cleanly', async () => {
  const md = '# Tieu De\n\n**In dam** va *in nghieng* va `code`.\n\n- Item 1\n- Item 2\n\n| Cot 1 | Cot 2 |\n| --- | --- |\n| A | B |';
  const file = new File([md], 'notes.md', { type: 'text/markdown' });
  const result = await convertMdToTxt(file);

  assert.equal(result.filename, 'notes.txt');
  const txt = await result.blob.text();
  assert.equal(txt.includes('**In dam**'), false);
  assert.equal(txt.includes('*in nghieng*'), false);
  assert.equal(txt.includes('`code`'), false);
  assert.ok(txt.includes('In dam va in nghieng va code.'));
});

test('convertMdToHtml generates standalone HTML document with CSS', async () => {
  const md = '# Tieu De Lon\n\n## Muc Con\n\nDoan van thu nghiem.';
  const file = new File([md], 'sample.md', { type: 'text/markdown' });
  const result = await convertMdToHtml(file);

  assert.equal(result.filename, 'sample.html');
  const html = await result.blob.text();
  assert.ok(html.includes('<!DOCTYPE html>'));
  assert.ok(html.includes('<h1>Tieu De Lon</h1>'));
  assert.ok(html.includes('<h2>Muc Con</h2>'));
  assert.ok(html.includes('<style>'));
});

test('convertMdToDocx creates valid Microsoft Word (.docx) document', async () => {
  const md = '# Bao Cao Tien Do\n\n## Noi Dung 1\n\n- Cong viec 1\n- Cong viec 2\n\n| Chi muc | Noi dung |\n| --- | --- |\n| 01 | Hoan thanh |';
  const file = new File([md], 'report.md', { type: 'text/markdown' });
  const result = await convertMdToDocx(file);

  assert.equal(result.filename, 'report.docx');
  assert.equal(result.mimeType, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  assert.ok(result.blob.size > 1000);
});

test('convertMdToPdf creates valid PDF document from Markdown', async () => {
  const md = '# Tai Lieu Huong Dan\n\n## 1. Cai Dat\n\nChay lenh `npm install`.\n\n- Buoc 1\n- Buoc 2';
  const file = new File([md], 'guide.md', { type: 'text/markdown' });
  const result = await convertMdToPdf(file);

  assert.equal(result.filename, 'guide.pdf');
  assert.equal(result.mimeType, 'application/pdf');
  assert.ok(result.blob.size > 500);
});
