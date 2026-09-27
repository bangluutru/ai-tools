import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';

import {
  NS,
  applyDocxWatermark,
  applyPptxWatermark,
  applyXlsxBackground,
  fitAspect,
  insertWorksheetPicture,
  parseXml,
  resolveRelative,
  resolveTarget,
} from '../src/utils/watermark/ooxmlWatermark.js';

const xml = { DOMParser, XMLSerializer };
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

const W = NS.w;
const CT = `<?xml version="1.0" encoding="UTF-8"?><Types xmlns="${NS.ct}"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`;
const RELS = (inner = '') => `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="${NS.rels}">${inner}</Relationships>`;
const DOC = (body) => `<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="${W}" xmlns:r="${NS.r}"><w:body>${body}</w:body></w:document>`;

const paragraph = (relId) => `<w:p xmlns:w="${W}" xmlns:r="${NS.r}" xmlns:v="${NS.v}" xmlns:o="${NS.o}"><w:r><w:pict><v:shape id="WM">${relId ? `<v:imagedata r:id="${relId}"/>` : ''}</v:shape></w:pict></w:r></w:p>`;

async function docx(body, extraRels = '', files = {}) {
  const zip = new JSZip();
  zip.file('[Content_Types].xml', CT);
  zip.file('word/document.xml', DOC(body));
  zip.file('word/_rels/document.xml.rels', RELS(extraRels));
  for (const [p, c] of Object.entries(files)) zip.file(p, c);
  return zip;
}

const countRefs = (docXml) => (docXml.match(/<w:headerReference/g) || []).length;

test('DOCX: self-closing <w:sectPr/> gets a default header reference (no regex mangling)', async () => {
  const zip = await docx('<w:p><w:r><w:t>Hi</w:t></w:r></w:p><w:sectPr/>');
  const result = await applyDocxWatermark(zip, { paragraphXml: paragraph }, xml);
  const docXml = await zip.file('word/document.xml').async('string');
  assert.equal(countRefs(docXml), 1);
  assert.match(docXml, /<w:sectPr><w:headerReference w:type="default" r:id="rIdWatermarkHeader"\/><\/w:sectPr>/);
  assert.equal(result.newHeaderPath, 'word/header_wm1.xml');
  const ct = await zip.file('[Content_Types].xml').async('string');
  assert.match(ct, /PartName="\/word\/header_wm1.xml"/);
  const rels = await zip.file('word/_rels/document.xml.rels').async('string');
  assert.match(rels, /Target="header_wm1.xml"/);
  // XML đầu ra phải parse lại được.
  parseXml(docXml, xml);
});

test('DOCX: <w:sectPrChange> copies are ignored and existing default headers are reused, not duplicated', async () => {
  const body = '<w:p><w:pPr><w:sectPr><w:headerReference w:type="default" r:id="rIdH1"/><w:pgSz w:w="11906" w:h="16838"/></w:sectPr></w:pPr></w:p>'
    + '<w:sectPr><w:headerReference w:type="default" r:id="rIdH1"/><w:titlePg/><w:sectPrChange w:id="1"><w:sectPr/></w:sectPrChange></w:sectPr>';
  const zip = await docx(body,
    `<Relationship Id="rIdH1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/>`,
    { 'word/header1.xml': `<?xml version="1.0"?><w:hdr xmlns:w="${W}"><w:p><w:r><w:t>Company</w:t></w:r></w:p></w:hdr>` });
  const result = await applyDocxWatermark(zip, { paragraphXml: paragraph }, xml);
  const docXml = await zip.file('word/document.xml').async('string');
  // 2 default cũ + 1 "first" mới cho section có titlePg; sectPr trong sectPrChange không bị đụng tới.
  assert.equal(countRefs(docXml), 3);
  assert.match(docXml, /<w:sectPrChange w:id="1"><w:sectPr\/><\/w:sectPrChange>/);
  assert.equal((docXml.match(/w:type="default"/g) || []).length, 2);
  assert.match(docXml, /w:type="first"/);
  const header = await zip.file('word/header1.xml').async('string');
  assert.equal((header.match(/id="WM"/g) || []).length, 1, 'header dùng chung chỉ được chèn một lần');
  assert.match(header, /Company/);
  assert.ok(result.headerParts.includes('word/header1.xml'));
});

test('DOCX image watermark: media, header rels and Default png content type are added', async () => {
  const zip = await docx('<w:sectPr/>');
  await applyDocxWatermark(zip, { paragraphXml: paragraph, image: { bytes: new Uint8Array([1, 2, 3]), ext: 'png' } }, xml);
  assert.ok(zip.file('word/media/watermark_1.png'));
  const hdrRels = await zip.file('word/_rels/header_wm1.xml.rels').async('string');
  assert.match(hdrRels, /Target="media\/watermark_1.png"/);
  const header = await zip.file('word/header_wm1.xml').async('string');
  assert.match(header, /r:id="rIdWatermarkImg"/);
  const ct = await zip.file('[Content_Types].xml').async('string');
  assert.match(ct, /<Default Extension="png" ContentType="image\/png"\/>/);
  assert.ok(ct.indexOf('Extension="png"') < ct.indexOf('<Override'), 'Default đứng trước Override');
});

test('XLSX: <picture> is inserted before tableParts/extLst and xmlns:r is ensured', async () => {
  const sheet = `<?xml version="1.0"?><worksheet xmlns="${NS.s}"><sheetData/><pageMargins left="0.7"/><tableParts count="1"><tablePart/></tableParts><extLst/></worksheet>`;
  const doc = parseXml(sheet, xml);
  insertWorksheetPicture(doc, 'rId9');
  const out = new XMLSerializer().serializeToString(doc);
  assert.ok(out.indexOf('<picture') < out.indexOf('<tableParts'));
  assert.match(out, /xmlns:r="http:\/\/schemas.openxmlformats.org\/officeDocument\/2006\/relationships"/);
  assert.match(out, /<picture r:id="rId9"\/>/);

  const zip = new JSZip();
  zip.file('[Content_Types].xml', `<Types xmlns="${NS.ct}"><Default Extension="PNG" ContentType="image/png"/></Types>`);
  zip.file('xl/worksheets/sheet1.xml', sheet);
  zip.file('xl/worksheets/_rels/sheet1.xml.rels', RELS('<Relationship Id="rIdWatermarkBg" Type="x" Target="../tables/table1.xml"/>'));
  await applyXlsxBackground(zip, new Uint8Array([1]), xml);
  const rels = await zip.file('xl/worksheets/_rels/sheet1.xml.rels').async('string');
  assert.match(rels, /Id="rIdWatermarkBg1"[^>]*Target="..\/media\/watermark_bg1.png"/);
  const ct = await zip.file('[Content_Types].xml').async('string');
  assert.equal((ct.match(/Extension="png"/gi) || []).length, 1, 'không thêm Default png trùng (so khớp không phân biệt hoa thường)');
});

test('PPTX: slide size from p:sldSz, unique shape ids, aspect kept', async () => {
  const zip = new JSZip();
  zip.file('[Content_Types].xml', `<Types xmlns="${NS.ct}"></Types>`);
  zip.file('ppt/presentation.xml', `<p:presentation xmlns:p="${NS.p}"><p:sldSz cx="9144000" cy="6858000"/></p:presentation>`);
  zip.file('ppt/slides/slide1.xml', `<p:sld xmlns:p="${NS.p}" xmlns:a="${NS.a}"><p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/></p:nvGrpSpPr><p:sp><p:nvSpPr><p:cNvPr id="42" name="t"/></p:nvSpPr></p:sp></p:spTree></p:cSld></p:sld>`);
  const seen = [];
  const result = await applyPptxWatermark(zip, {
    image: { bytes: new Uint8Array([1]), ext: 'png' },
    shapeXml: (ctx) => {
      seen.push(ctx);
      return `<p:pic xmlns:p="${NS.p}"><p:nvPicPr><p:cNvPr id="${ctx.id}" name="wm"/></p:nvPicPr></p:pic>`;
    },
  }, xml);
  assert.deepEqual(result.slideSize, { cx: 9144000, cy: 6858000 });
  assert.equal(seen[0].id, 43);
  assert.ok(seen[0].relId);
  const slide = await zip.file('ppt/slides/slide1.xml').async('string');
  assert.match(slide, /<p:cNvPr id="43" name="wm"\/>/);
  assert.match(await zip.file('ppt/slides/_rels/slide1.xml.rels').async('string'), /Target="..\/media\/watermark_1.png"/);
  assert.deepEqual(fitAspect(400, 100, 1000), { width: 1000, height: 250 });
  assert.deepEqual(fitAspect(100, 400, 1000), { width: 250, height: 1000 });
});

test('relationship path helpers', () => {
  assert.equal(resolveTarget('word/document.xml', 'header1.xml'), 'word/header1.xml');
  assert.equal(resolveTarget('xl/worksheets/sheet1.xml', '../media/a.png'), 'xl/media/a.png');
  assert.equal(resolveRelative('xl/worksheets/sheet1.xml', 'xl/media/a.png'), '../media/a.png');
  assert.equal(resolveRelative('word/header2.xml', 'word/media/a.png'), 'media/a.png');
});

test('Watermark Studio UI: honest options, dynamic heavy imports, legacy formats rejected', () => {
  const view = fs.readFileSync(path.join(repoRoot, 'packages/core/src/components/WatermarkStudioView.jsx'), 'utf8');
  assert.doesNotMatch(view, /^import .* from 'pdf-lib';$/m);
  assert.doesNotMatch(view, /^import JSZip from 'jszip';$/m);
  assert.doesNotMatch(view, /Timestamp & User ID/);
  assert.doesNotMatch(view, /Flatten layers/);
  assert.doesNotMatch(view, /PDF-Lib WebAssembly/);
  assert.doesNotMatch(view, /Vẽ vector watermark/);
  assert.doesNotMatch(view, /In-Memory WASM/);
  assert.doesNotMatch(view, /fileItems\.length \* 4/);
  assert.doesNotMatch(view, /\['docx', 'doc'\]|\['xlsx', 'xls', 'csv'\]|\['pptx', 'ppt'\]/);
  assert.doesNotMatch(view, /URL\.createObjectURL\(resultBlob\)/);
  assert.match(view, /không in ra giấy/);
});

test('DOCX: later sections without header references keep inheriting the original header', async () => {
  const body = '<w:p><w:pPr><w:sectPr><w:headerReference w:type="default" r:id="rIdH1"/></w:sectPr></w:pPr></w:p><w:sectPr><w:pgSz w:w="11906"/></w:sectPr>';
  const zip = await docx(body,
    `<Relationship Id="rIdH1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/>`,
    { 'word/header1.xml': `<?xml version="1.0"?><w:hdr xmlns:w="${W}"><w:p/></w:hdr>` });
  const result = await applyDocxWatermark(zip, { paragraphXml: paragraph }, xml);
  const docXml = await zip.file('word/document.xml').async('string');
  assert.equal(countRefs(docXml), 1, 'section 2 kế thừa header1 (đã có watermark), không thêm header mới');
  assert.equal(result.newHeaderPath, null);
  assert.match(await zip.file('word/header1.xml').async('string'), /id="WM"/);
});
