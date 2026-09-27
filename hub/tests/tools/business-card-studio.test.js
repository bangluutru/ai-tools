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

test('undo/redo history stack correctly restores previous states across drag-and-drop operations', () => {
  // Simulating the state machine in EditorStep
  const state0 = {
    id: 'proj-1',
    front: {
      elements: [{ id: 'el-name', xMm: 12, yMm: 24, content: 'Taro Yamada' }]
    }
  };

  let history = [JSON.parse(JSON.stringify(state0))];
  let historyIdx = 0;

  const pushHistory = (newState) => {
    const cloned = JSON.parse(JSON.stringify(newState));
    history = [...history.slice(0, historyIdx + 1), cloned];
    historyIdx++;
  };

  const undo = () => {
    if (historyIdx > 0) {
      historyIdx--;
      return JSON.parse(JSON.stringify(history[historyIdx]));
    }
    return null;
  };

  const redo = () => {
    if (historyIdx < history.length - 1) {
      historyIdx++;
      return JSON.parse(JSON.stringify(history[historyIdx]));
    }
    return null;
  };

  // 1. User drags element from xMm=12 to xMm=45. During drag, live preview changes, but history is committed ONCE on mouseup.
  const state1 = {
    id: 'proj-1',
    front: {
      elements: [{ id: 'el-name', xMm: 45, yMm: 30, content: 'Taro Yamada' }]
    }
  };
  pushHistory(state1);

  assert.equal(history.length, 2);
  assert.equal(historyIdx, 1);
  assert.equal(history[historyIdx].front.elements[0].xMm, 45);

  // 2. User clicks Undo -> should restore state0 (xMm=12)
  const undoneState = undo();
  assert.equal(historyIdx, 0);
  assert.equal(undoneState.front.elements[0].xMm, 12, 'Undo must restore original coordinate 12mm');

  // 3. User clicks Redo -> should restore state1 (xMm=45)
  const redoneState = redo();
  assert.equal(historyIdx, 1);
  assert.equal(redoneState.front.elements[0].xMm, 45, 'Redo must restore dragged coordinate 45mm');

  // 4. From state0, if user performs another action, future redo history is truncated
  undo();
  assert.equal(historyIdx, 0);
  const state2 = {
    id: 'proj-1',
    front: {
      elements: [{ id: 'el-name', xMm: 80, yMm: 10, content: 'Taro Yamada' }]
    }
  };
  pushHistory(state2);
  assert.equal(history.length, 2);
  assert.equal(historyIdx, 1);
  assert.equal(history[1].front.elements[0].xMm, 80);
  assert.equal(redo(), null, 'Cannot redo after a new branch action');
});



// ---------------------------------------------------------------------------
// Accuracy review fixes (OCR, print layout, vCard, batch, CSV)
// ---------------------------------------------------------------------------

const baseProject = (profile = SAMPLE_PROFILES[0].profile, templateId = 'qr-first-connect') => {
  const tmpl = TEMPLATE_DEFINITIONS.find((t) => t.id === templateId) || TEMPLATE_DEFINITIONS[0];
  const generated = tmpl.generator(profile, DEFAULT_CARD_DIMENSION, 'horizontal');
  return {
    id: 'p1',
    title: 'Test',
    dimension: DEFAULT_CARD_DIMENSION,
    orientation: 'horizontal',
    isDoubleSided: true,
    profile,
    front: generated.front,
    back: generated.back,
    templateId: tmpl.id,
  };
};

test('vCard: CRLF, escaping, N field and no "undefined" values', () => {
  const vcard = QrCodeService.formatVCard({
    fullName: '田中 健二',
    companyName: 'ACME, Inc; Japan',
    jobTitle: undefined,
    phone: undefined,
    email: 'k@acme.jp',
    address: '東京都千代田区1-1',
    postalCode: '〒100-0005',
  });
  const lines = vcard.split('\r\n');
  assert.equal(lines[0], 'BEGIN:VCARD');
  assert.equal(lines.at(-1), 'END:VCARD');
  assert.ok(!/\n(?<!\r\n)/.test(vcard.replace(/\r\n/g, '')), 'no bare LF');
  assert.ok(lines.includes('N:田中;健二;;;'));
  assert.ok(lines.includes('ORG:ACME\\, Inc\\; Japan'));
  assert.ok(lines.includes('ADR;TYPE=WORK:;;東京都千代田区1-1;;;100-0005;'));
  assert.ok(!vcard.includes('undefined'));
  assert.ok(!vcard.includes('TEL'), 'empty phone must be omitted');
});

test('templates with vCard QR use the formatter (no TEL:undefined)', () => {
  const profile = { ...SAMPLE_PROFILES[0].profile, phone: undefined };
  for (const tmpl of TEMPLATE_DEFINITIONS) {
    const g = tmpl.generator(profile, DEFAULT_CARD_DIMENSION, 'horizontal');
    for (const el of [...g.front.elements, ...g.back.elements]) {
      if (el.type === 'qr' && el.qrType === 'vcard') {
        assert.ok(!el.data.includes('undefined'), `${tmpl.id} vCard contains undefined`);
        assert.ok(el.data.includes('\r\n'), `${tmpl.id} vCard must use CRLF`);
      }
    }
  }
});

test('batch: each employee gets their own vCard QR and contact text', async () => {
  const { StorageService } = await import('../../../packages/core/src/utils/business-card/storage.js');
  const master = baseProject();
  const vcardEl = master.back.elements.find((el) => el.qrType === 'vcard');
  assert.ok(vcardEl, 'qr-first-connect back must have a vCard QR');
  const emp = { ...master.profile, fullName: '鈴木 一郎', email: 'i.suzuki@example.jp', mobile: '080-0000-1111', jobTitle: '部長' };
  const card = StorageService.applyEmployeeProfileToTemplate(master, emp);
  const qr = card.back.elements.find((el) => el.id === vcardEl.id);
  assert.ok(qr.data.includes('FN:鈴木 一郎'));
  assert.ok(qr.data.includes('EMAIL;TYPE=INTERNET,PREF:i.suzuki@example.jp'));
  assert.ok(!qr.data.includes(master.profile.email), 'master email must not leak into employee vCard');
  const allText = [...card.front.elements, ...card.back.elements].filter((e) => e.type === 'text').map((e) => e.content).join('\n');
  assert.ok(!allText.includes(master.profile.email), 'master email must not remain in employee text');
  assert.ok(allText.includes('i.suzuki@example.jp'));
});

test('CSV import: quoted fields, header mapping, personal fields not copied from master', async () => {
  const { StorageService, parseCsv } = await import('../../../packages/core/src/utils/business-card/storage.js');
  assert.deepEqual(parseCsv('a,"b,c","d""e"\r\nx,"l1\nl2",z\n'), [['a', 'b,c', 'd"e'], ['x', 'l1\nl2', 'z']]);
  const base = { companyName: 'ACME', fullName: 'Master', email: 'm@acme.jp', mobile: '090', phone: '03-1', jobTitle: 'CEO' };
  const rows = StorageService.parseEmployeeCsv('﻿氏名,メールアドレス,役職\r\n"鈴木, 一郎",s@acme.jp,部長\r\n佐藤 花子,,\r\n', base);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].fullName, '鈴木, 一郎');
  assert.equal(rows[0].email, 's@acme.jp');
  assert.equal(rows[0].jobTitle, '部長');
  assert.equal(rows[0].phone, '03-1', 'company phone falls back to master');
  assert.equal(rows[1].email, '', 'personal email must not be copied from master');
  assert.equal(rows[1].jobTitle, '');
  assert.equal(rows[1].mobile, '');
});

test('CSV decode: falls back to Shift_JIS when UTF-8 yields replacement chars', async () => {
  const { StorageService } = await import('../../../packages/core/src/utils/business-card/storage.js');
  const ascii = (s) => [...s].map((c) => c.charCodeAt(0));
  // "fullName\r\n田中\r\n" encoded in Shift_JIS (田 = 93 63, 中 = 92 86)
  const bytes = new Uint8Array([...ascii('fullName\r\n'), 0x93, 0x63, 0x92, 0x86, ...ascii('\r\n')]);
  assert.equal(StorageService.decodeCsvBytes(bytes), 'fullName\r\n田中\r\n');
  const utf8 = new TextEncoder().encode('fullName\r\n田中\r\n');
  assert.equal(StorageService.decodeCsvBytes(utf8), 'fullName\r\n田中\r\n');
});

test('print layout: トンボ sit in an outer margin outside the bleed, bleed-only option is 97×61', async () => {
  const { computePrintLayout, CROP_MARK_GAP_MM } = await import('../../../packages/core/src/utils/business-card/pdfExporter.js');
  const project = baseProject();
  const l = computePrintLayout(project, { mode: 'tonbo' });
  assert.equal(l.trimW, 91);
  assert.equal(l.trimH, 55);
  assert.equal(l.pageW, 91 + 2 * (3 + 10));
  assert.equal(l.pageH, 55 + 2 * (3 + 10));
  assert.equal(l.artX, 10);
  assert.equal(l.trimX, 13);
  assert.ok(l.marks.length >= 24);
  const eps = 1e-9;
  for (const m of l.marks) {
    // every mark segment is fully outside the bleed box (+gap) and inside the page
    const outsideX = Math.max(m.x1, m.x2) <= l.artX - CROP_MARK_GAP_MM + eps || Math.min(m.x1, m.x2) >= l.artX + l.artW + CROP_MARK_GAP_MM - eps;
    const outsideY = Math.max(m.y1, m.y2) <= l.artY - CROP_MARK_GAP_MM + eps || Math.min(m.y1, m.y2) >= l.artY + l.artH + CROP_MARK_GAP_MM - eps;
    assert.ok(outsideX || outsideY, `mark ${JSON.stringify(m)} intrudes into bleed`);
    for (const v of [m.x1, m.x2]) assert.ok(v >= -eps && v <= l.pageW + eps);
    for (const v of [m.y1, m.y2]) assert.ok(v >= -eps && v <= l.pageH + eps);
  }
  // trim lines and bleed lines are both marked
  const verticalXs = new Set(l.marks.filter((m) => m.x1 === m.x2 && m.kind === 'corner').map((m) => m.x1));
  for (const x of [l.artX, l.trimX, l.trimX + l.trimW, l.artX + l.artW]) assert.ok(verticalXs.has(x));

  const b = computePrintLayout(project, { mode: 'bleed' });
  assert.equal(b.pageW, 97);
  assert.equal(b.pageH, 61);
  assert.equal(b.marks.length, 0);
  // legacy options map to the new modes
  assert.equal(computePrintLayout(project, { includeBleed: true, includeCropMarks: true }).mode, 'tonbo');
  assert.equal(computePrintLayout(project, { includeBleed: false }).mode, 'trim');
});

test('preflight flags placeholder QR URLs and auto-fix replaces them', () => {
  assert.equal(QrCodeService.isPlaceholderData('https://tech.sample'), true);
  assert.equal(QrCodeService.isPlaceholderData('https://yuka.sample/design'), true);
  assert.equal(QrCodeService.isPlaceholderData('https://www.example-company.co.jp'), false);
  const profile = { ...SAMPLE_PROFILES[0].profile, website: '' , sns: ''};
  const project = baseProject(profile, 'tech-innovator');
  const report = PreflightVerificationService.inspect(project);
  const issue = report.issues.find((i) => i.ruleCode === 'QR_PLACEHOLDER_URL');
  assert.ok(issue, 'placeholder QR must be flagged');
  const fixed = PreflightVerificationService.applyAutoFix(project, issue);
  const el = fixed[issue.side].elements.find((e) => e.id === issue.elementId);
  assert.ok(el.data.startsWith('BEGIN:VCARD'));
});

test('OCR: no hard-coded demo profile, merge never overwrites user fields by default', async () => {
  const fs = await import('node:fs');
  const src = fs.readFileSync(new URL('../../../packages/core/src/utils/business-card/ocrParser.js', import.meta.url), 'utf8');
  assert.ok(!src.includes('\\u30B0\\u30ED\\u30FC\\u30D0\\u30EB\\u30A4\\u30CE\\u30D9') && !src.includes('グローバルイノベ'), 'demo company must not be injected');
  assert.ok(!src.includes('0.94'), 'no fake confidence');
  assert.ok(src.includes("import(\"tesseract.js\")"), 'tesseract.js must be lazily imported');
  const { BusinessCardOcrService } = await import('../../../packages/core/src/utils/business-card/ocrParser.js');
  const merged = BusinessCardOcrService.mergeOcrProfile({ fullName: 'User', email: '' }, { fullName: 'OCR', email: 'o@x.jp' });
  assert.equal(merged.fullName, 'User');
  assert.equal(merged.email, 'o@x.jp');
  const parsed = BusinessCardOcrService.parseCardText('〒100-0005 東京都千代田区丸の内1-1-1\nTEL: 03-5555-0199');
  assert.equal(parsed.postalCode, '〒100-0005');
  assert.equal(parsed.phone, '03-5555-0199');
});

test('ZIP manifest has no fictional order data and uses Toolio branding', async () => {
  const { buildPrintManifest } = await import('../../../packages/core/src/utils/business-card/zipPackager.js');
  const { computePrintLayout } = await import('../../../packages/core/src/utils/business-card/pdfExporter.js');
  const project = baseProject();
  const m = buildPrintManifest(project, computePrintLayout(project, {}), PreflightVerificationService.inspect(project));
  const json = JSON.stringify(m);
  assert.equal(m.orderSpecification, undefined);
  assert.ok(!json.includes('CMYK'));
  assert.ok(!json.includes('Meishi Studio'));
  assert.equal(m.generator, 'Toolio Business Card Studio');
  assert.equal(m.cardSpecification.imageType, 'raster');
});

test('business-card proof PNG DPI helper writes the same pHYs as the id-photo helper', async () => {
  const { setPngDpiBytes } = await import('../../../packages/core/src/utils/business-card/pngDpi.js');
  const idPhoto = await import('../../../packages/core/src/utils/id-photo/imageDpi.js');
  // 1×1 RGB PNG
  const b64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGP4z8AAAAMBAQDJ/pLvAAAAAElFTkSuQmCC';
  const png = new Uint8Array(Buffer.from(b64, 'base64'));
  const a = setPngDpiBytes(png, 300);
  assert.deepEqual([...a], [...idPhoto.setPngDpiBytes(png, 300)]);
  const phys = idPhoto.readPngPhys(a);
  assert.equal(phys.xPpm, 11811);
  assert.equal(phys.unit, 1);
  assert.equal(phys.crcValid, true);
});
