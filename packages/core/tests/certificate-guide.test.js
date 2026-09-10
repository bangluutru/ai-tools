import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  getCommonCertificates,
  buildCertificateAcquisitionGuide,
} from '../src/documents/acquisition/certificateGuideEngine.js';

describe('Phase 8 - M3: Certificate Acquisition Guide Engine', () => {
  it('returns frequently requested common certificates', () => {
    const list = getCommonCertificates();
    assert.ok(list.length >= 8);
    assert.ok(list.some((d) => d.id === 'document.resident-record-copy'));
    assert.ok(list.some((d) => d.id === 'document.seal-registration-certificate'));
  });

  it('generates multi-channel acquisition guidance with detailed steps for Jūminhyō', () => {
    const guide = buildCertificateAcquisitionGuide({
      documentId: 'document.resident-record-copy',
      municipalityQuery: 'Shinjuku',
      hasMyNumberCard: true,
    });

    assert.ok(guide);
    assert.equal(guide.document.canonicalNameJa, '住民票の写し');
    assert.ok(guide.detailedSteps.convenience_store.length >= 4);
    assert.ok(guide.detailedSteps.municipal_counter.length >= 3);
    assert.ok(guide.detailedSteps.mail_request.length >= 3);

    // Kiosk PIN step verification (4-digit User Authentication PIN)
    const pinStep = guide.detailedSteps.convenience_store.find((s) => s.step === 2);
    assert.ok(pinStep);
    assert.ok(pinStep.descI18n.ja.includes('数字4桁'));
    assert.ok(pinStep.descI18n.vi.includes('PIN 4 số'));
  });

  it('alerts user when Inhabitant Tax certificate requires Jan 1 municipality after relocation', () => {
    const guide = buildCertificateAcquisitionGuide({
      documentId: 'document.taxation-certificate',
      municipalityQuery: 'Shinjuku',
      movedAfterJan1: true,
      jan1Municipality: 'Nagoya City',
    });

    assert.ok(guide);
    assert.ok(guide.issuer.criticalCaveatI18n);
    assert.ok(guide.issuer.criticalCaveatI18n.ja.includes('引越し注意'));
    assert.ok(guide.issuer.criticalCaveatI18n.vi.includes('Cảnh báo chuyển nhà'));
  });

  it('alerts user to Koseki kiosk advance registration when residing away from registered domicile', () => {
    const guide = buildCertificateAcquisitionGuide({
      documentId: 'document.family-register-full',
      livesOutsideRegisteredDomicile: true,
      registeredDomicileMunicipality: 'Fukuoka City',
    });

    assert.ok(guide);
    assert.ok(guide.issuer.criticalCaveatI18n);
    assert.ok(guide.issuer.criticalCaveatI18n.ja.includes('本籍地利用登録'));
  });

  it('correctly maps Gensen Choshuhyo to Employer without government counter steps', () => {
    const guide = buildCertificateAcquisitionGuide({
      documentId: 'document.withholding-tax-slip',
    });

    assert.ok(guide);
    assert.equal(guide.issuer.type, 'employer');
    assert.ok(guide.issuer.locationGuidanceI18n.ja.includes('勤務先企業'));
  });
});
