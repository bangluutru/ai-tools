import assert from 'node:assert/strict';
import test from 'node:test';
import { tools, activeTools } from '../../src/config/toolsRegistry.js';
import { TEMPLATE_DEFINITIONS } from '../../../packages/core/src/utils/business-card/templates.js';
import { DEFAULT_CARD_DIMENSION } from '../../../packages/core/src/utils/business-card/cardSizes.js';
import { SAMPLE_PROFILES } from '../../../packages/core/src/utils/business-card/samples.js';
import { PreflightVerificationService } from '../../../packages/core/src/utils/business-card/preflightChecker.js';
import { QrCodeService } from '../../../packages/core/src/utils/business-card/qrGenerator.js';

test('business-card-studio is correctly registered in toolsRegistry', () => {
  const tool = tools.find((t) => t.id === 'business-card-studio');
  assert.ok(tool, 'Tool business-card-studio must be defined in tools');
  assert.equal(tool.category, 'image');
  assert.equal(tool.readiness, 'beta');
  assert.equal(tool.processing, 'browser');
  assert.equal(tool.outputPurpose, 'utility');
  assert.ok(tool.name_vn && tool.name_en && tool.name_ja, 'Must have trilingual names');
  assert.ok(tool.desc_vn && tool.desc_en && tool.desc_ja, 'Must have trilingual descriptions');

  const isActive = activeTools.some((t) => t.id === 'business-card-studio');
  assert.equal(isActive, true, 'Tool must be in activeTools');
});

test('28 production templates all generate valid front and back sides', () => {
  assert.equal(TEMPLATE_DEFINITIONS.length, 28, 'Must have exactly 28 templates');
  const sampleProfile = SAMPLE_PROFILES[0].profile;
  const dim = DEFAULT_CARD_DIMENSION;

  for (const tmpl of TEMPLATE_DEFINITIONS) {
    assert.ok(tmpl.id, 'Template must have an id');
    assert.ok(tmpl.name, 'Template must have a name');
    assert.equal(typeof tmpl.generator, 'function', `${tmpl.id} must have a generator function`);

    const result = tmpl.generator(sampleProfile, dim, 'horizontal');
    assert.ok(result.front, `${tmpl.id} must produce front side`);
    assert.ok(result.back, `${tmpl.id} must produce back side`);
    assert.ok(Array.isArray(result.front.elements), `${tmpl.id} front elements must be an array`);
    assert.ok(result.front.elements.length > 0, `${tmpl.id} front must have elements`);
    assert.ok(Array.isArray(result.back.elements), `${tmpl.id} back elements must be an array`);
  }
});

test('preflight inspector evaluates project and outputs valid score', () => {
  const sampleProfile = SAMPLE_PROFILES[0].profile;
  const dim = DEFAULT_CARD_DIMENSION;
  const tmpl = TEMPLATE_DEFINITIONS[0];
  const generated = tmpl.generator(sampleProfile, dim, 'horizontal');

  const project = {
    id: 'test-proj',
    title: 'Test Card',
    dimension: dim,
    orientation: 'horizontal',
    isDoubleSided: true,
    profile: sampleProfile,
    front: generated.front,
    back: generated.back,
  };

  const report = PreflightVerificationService.inspect(project);
  assert.ok(report, 'Preflight report must exist');
  assert.equal(typeof report.score, 'number');
  assert.ok(report.score >= 0 && report.score <= 100);
  assert.ok(Array.isArray(report.issues));
});

test('vCard formatter creates valid vCard 3.0 string', () => {
  const sampleProfile = SAMPLE_PROFILES[0].profile;
  const vcard = QrCodeService.formatVCard(sampleProfile);
  assert.ok(vcard.startsWith('BEGIN:VCARD'));
  assert.ok(vcard.includes(`FN:${sampleProfile.fullName}`));
  assert.ok(vcard.includes(`ORG:${sampleProfile.companyName}`));
  assert.ok(vcard.endsWith('END:VCARD'));
});

test('calculateSnap correctly snaps element to card center and generates active guides', async () => {
  const { calculateSnap } = await import('../../../packages/core/src/utils/business-card/alignmentSnapper.js');
  
  // Element near horizontal center (cardW = 91mm -> center = 45.5mm)
  // Element width = 20mm -> element center is at xMm + 10mm
  // If xMm = 35.2mm, element center is 45.2mm (0.3mm away from 45.5mm, within 1.0mm threshold)
  const movingEl = { id: 'el-1', xMm: 35.2, yMm: 10, widthMm: 20, heightMm: 10 };
  const snapResult = calculateSnap({
    movingEl,
    allElements: [],
    cardW: 91,
    cardH: 55,
    safeMargin: 3,
    thresholdMm: 1.0
  });

  // Snapped center should be 45.5 - 10 = 35.5mm
  assert.equal(snapResult.xMm, 35.5, 'xMm should snap to center 35.5mm');
  assert.ok(snapResult.guides.length > 0, 'Should return active guides');
  assert.equal(snapResult.guides[0].posMm, 45.5, 'Guide line position should be at card center 45.5mm');
});

test('calculateResize resizes element dimensions correctly across 8 handles and locks 1:1 for QR', async () => {
  const { calculateResize } = await import('../../../packages/core/src/utils/business-card/alignmentSnapper.js');

  const startEl = { id: 'text-1', type: 'text', xMm: 10, yMm: 10, widthMm: 30, heightMm: 15 };

  // Drag 'se' handle by +5mm X and +3mm Y
  const resizeSe = calculateResize({ startEl, handle: 'se', deltaXMm: 5, deltaYMm: 3 });
  assert.equal(resizeSe.widthMm, 35);
  assert.equal(resizeSe.heightMm, 18);
  assert.equal(resizeSe.xMm, 10);
  assert.equal(resizeSe.yMm, 10);

  // Drag 'nw' handle by +2mm X and +2mm Y (shrinks width/height, increases x/y)
  const resizeNw = calculateResize({ startEl, handle: 'nw', deltaXMm: 2, deltaYMm: 2 });
  assert.equal(resizeNw.widthMm, 28);
  assert.equal(resizeNw.heightMm, 13);
  assert.equal(resizeNw.xMm, 12);
  assert.equal(resizeNw.yMm, 12);

  // QR Code element must stay 1:1 square
  const qrEl = { id: 'qr-1', type: 'qr', xMm: 10, yMm: 10, widthMm: 15, heightMm: 15 };
  const resizeQr = calculateResize({ startEl: qrEl, handle: 'se', deltaXMm: 5, deltaYMm: 1 });
  assert.equal(resizeQr.widthMm, 20);
  assert.equal(resizeQr.heightMm, 20, 'QR height must match width for 1:1 square ratio');
});

test('alignElementToCard aligns element to center and margins accurately', async () => {
  const { alignElementToCard } = await import('../../../packages/core/src/utils/business-card/alignmentSnapper.js');

  const el = { id: 'el-1', xMm: 10, yMm: 10, widthMm: 31, heightMm: 15 };
  const cardConfig = { cardW: 91, cardH: 55, safeMargin: 3 };

  const centerH = alignElementToCard(el, 'center-h', cardConfig);
  assert.equal(centerH.xMm, 30); // (91 - 31) / 2 = 30mm

  const centerV = alignElementToCard(el, 'center-v', cardConfig);
  assert.equal(centerV.yMm, 20); // (55 - 15) / 2 = 20mm

  const leftSafe = alignElementToCard(el, 'left', cardConfig);
  assert.equal(leftSafe.xMm, 3); // safe margin 3mm

  const rightSafe = alignElementToCard(el, 'right', cardConfig);
  assert.equal(rightSafe.xMm, 57); // 91 - 3 - 31 = 57mm
});

test('alignMultipleElements aligns group of elements and distributes spacing evenly', async () => {
  const { alignMultipleElements } = await import('../../../packages/core/src/utils/business-card/alignmentSnapper.js');

  const elements = [
    { id: 'el-1', xMm: 10, yMm: 10, widthMm: 20, heightMm: 10 },
    { id: 'el-2', xMm: 40, yMm: 25, widthMm: 30, heightMm: 15 },
    { id: 'el-3', xMm: 80, yMm: 45, widthMm: 10, heightMm: 5 },
  ];

  // Align Left -> all xMm become minX = 10
  const alignedLeft = alignMultipleElements(elements, 'left');
  assert.equal(alignedLeft[0].xMm, 10);
  assert.equal(alignedLeft[1].xMm, 10);
  assert.equal(alignedLeft[2].xMm, 10);

  // Align Center-H -> bounding box minX = 10, maxX = 90, centerX = 50
  const alignedCenterH = alignMultipleElements(elements, 'center-h');
  assert.equal(alignedCenterH[0].xMm, 40); // 50 - 10
  assert.equal(alignedCenterH[1].xMm, 35); // 50 - 15
  assert.equal(alignedCenterH[2].xMm, 45); // 50 - 5

  // Distribute Horizontal -> span from 10 to 90 (total = 80mm). Total widths = 20 + 30 + 10 = 60mm.
  // Gap = (80 - 60) / 2 = 10mm.
  // el-1: x=10, width=20 -> right=30.
  // el-2: x=30 + 10 = 40, width=30 -> right=70.
  // el-3: x=70 + 10 = 80.
  const distributedH = alignMultipleElements(elements, 'distribute-h');
  assert.equal(distributedH[0].xMm, 10);
  assert.equal(distributedH[1].xMm, 40);
  assert.equal(distributedH[2].xMm, 80);
});

test('translations for business-card studio do not contain "miễn phí" or "無料"', async () => {
  const { TRANSLATIONS } = await import('../../../packages/core/src/utils/business-card/translations.js');
  const serialized = JSON.stringify(TRANSLATIONS);

  assert.equal(serialized.includes('miễn phí'), false, 'Translations must not contain "miễn phí"');
  assert.equal(serialized.includes('Miễn phí'), false, 'Translations must not contain "Miễn phí"');
  assert.equal(serialized.includes('無料'), false, 'Translations must not contain "無料"');
});

