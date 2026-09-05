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
