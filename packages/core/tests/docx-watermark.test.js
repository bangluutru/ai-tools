import assert from 'node:assert/strict';
import test from 'node:test';

import { attachWatermarkHeaderReference } from '../src/utils/watermark/docxHeader.js';

test('adds a DOCX watermark reference inside every self-closing section', () => {
  const source = '<w:document><w:body><w:p/><w:sectPr/></w:body></w:document>';
  const result = attachWatermarkHeaderReference(source, 'rIdWatermark');

  assert.match(result, /<w:sectPr><w:headerReference w:type="default" r:id="rIdWatermark"\/><\/w:sectPr>/);
});

test('adds the reference to each explicit DOCX section', () => {
  const source = '<w:body><w:sectPr><w:pgSz/></w:sectPr><w:sectPr><w:pgMar/></w:sectPr></w:body>';
  const result = attachWatermarkHeaderReference(source, 'rIdWatermark');

  assert.equal((result.match(/r:id="rIdWatermark"/g) || []).length, 2);
  assert.match(result, /<w:sectPr><w:headerReference[^>]+\/><w:pgSz\/><\/w:sectPr>/);
});

test('does not replace a pre-existing DOCX header', () => {
  const source = '<w:body><w:sectPr><w:headerReference w:type="default" r:id="rIdExisting"/></w:sectPr></w:body>';
  assert.throws(() => attachWatermarkHeaderReference(source, 'rIdWatermark'), /đã có header/);
});
