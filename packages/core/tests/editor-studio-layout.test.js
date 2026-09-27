import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DEFAULT_LAYOUT_CONFIG,
  ND30_LAYOUT,
  isNd30Layout,
  mmToTwip,
  normalizeDocStudioLang,
  resolveLayout,
} from '../src/lib/editor-studio/layoutPresets.js';

test('ND30 preset: Times New Roman 13pt, margins 20/15/20/30 mm, spacing <= 1.5', () => {
  assert.equal(isNd30Layout(DEFAULT_LAYOUT_CONFIG), true);
  const layout = resolveLayout(ND30_LAYOUT);
  assert.equal(layout.fontDocx, 'Times New Roman');
  assert.ok(layout.sizePt >= 13 && layout.sizePt <= 14);
  assert.deepEqual(layout.marginsMm, { top: 20, right: 15, bottom: 20, left: 30 });
  assert.ok(layout.marginsMm.top >= 20 && layout.marginsMm.top <= 25);
  assert.ok(layout.marginsMm.left >= 30 && layout.marginsMm.left <= 35);
  assert.ok(layout.marginsMm.right >= 15 && layout.marginsMm.right <= 20);
  assert.ok(layout.lineRatio >= 1 && layout.lineRatio <= 1.5);
  assert.equal(layout.marginsTwip.left, mmToTwip(30));
  assert.equal(mmToTwip(25.4), 1440);
});

test('legacy layout ids still resolve (backward compatible)', () => {
  const layout = resolveLayout({ fontFamily: 'font-sans', fontSize: 'text-sm', lineSpacing: 'leading-relaxed', margins: 'p-[2.5cm]' });
  assert.equal(layout.fontDocx, 'Arial');
  assert.equal(layout.sizePt, 11);
  assert.deepEqual(layout.marginsMm, { top: 25, right: 25, bottom: 25, left: 25 });
  assert.equal(isNd30Layout({ ...ND30_LAYOUT, margins: 'p-[2cm]' }), false);
});

test('hub language codes map to DocStudio dictionaries', () => {
  assert.equal(normalizeDocStudioLang('vi'), 'vn');
  assert.equal(normalizeDocStudioLang('ja'), 'jp');
  assert.equal(normalizeDocStudioLang('en'), 'en');
  assert.equal(normalizeDocStudioLang(undefined), 'vn');
});
