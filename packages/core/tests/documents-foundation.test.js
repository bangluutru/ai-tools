import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  CANONICAL_DOCUMENTS,
  CANONICAL_PROCEDURES,
  CANONICAL_REQUIREMENTS,
  DOCUMENT_CATEGORIES,
  ISSUER_TYPES,
  SENSITIVITY_TIERS,
  ACQUISITION_CHANNELS,
  LOCALITY_TIERS,
  getDocumentById,
  getAllDocuments,
  getDocumentsByCategory,
  getDocumentsByIssuer,
  findDocumentsByQuery,
  isSensitiveDocument,
  getProcedureById,
  getAllProcedures,
  findProceduresByQuery,
  getRequirementsForProcedure,
  validateDocumentFreshness,
  resolveLocality,
  resolveAcquisitionGuidance,
} from '../src/documents/index.js';

describe('Phase 8: Document & Procedure Foundation', () => {
  // =========================================================================
  // 1. Canonical Document Definitions & Registries
  // =========================================================================
  describe('Canonical Document Registry', () => {
    it('contains all 17 canonical administrative documents', () => {
      const allDocs = getAllDocuments();
      assert.ok(allDocs.length >= 17, `Expected at least 17 documents, found ${allDocs.length}`);
    });

    it('retrieves canonical documents by ID correctly', () => {
      const juminhyo = getDocumentById('document.resident-record-copy');
      assert.ok(juminhyo);
      assert.equal(juminhyo.canonicalNameJa, '住民票の写し');
      assert.equal(juminhyo.category, DOCUMENT_CATEGORIES.IDENTITY_RESIDENCE);
      assert.equal(juminhyo.issuerType, ISSUER_TYPES.MUNICIPAL_CURRENT_RESIDENCE);
    });

    it('NEGATIVE TEST: DocumentDefinition MUST NOT contain procedure-specific maxAgeMonths', () => {
      const juminhyo = getDocumentById('document.resident-record-copy');
      assert.strictEqual(
        juminhyo.maxAgeMonths,
        undefined,
        '住民票 definition must NOT contain maxAgeMonths (freshness belongs to requirement)'
      );

      const kazei = getDocumentById('document.taxation-certificate');
      assert.strictEqual(
        kazei.maxAgeMonths,
        undefined,
        '課税証明書 definition must NOT contain maxAgeMonths'
      );
    });

    it('NEGATIVE TEST: Tax documents must NOT be merged into a single generic tax document', () => {
      const kazei = getDocumentById('document.taxation-certificate');
      const nozei = getDocumentById('document.tax-payment-certificate');
      const shotoku = getDocumentById('document.tax-income-certificate');
      const kokuzei = getDocumentById('document.national-tax-payment-cert');
      const gensen = getDocumentById('document.withholding-tax-slip');

      assert.ok(kazei && nozei && shotoku && kokuzei && gensen);
      assert.notEqual(kazei.id, nozei.id);
      assert.notEqual(nozei.id, kokuzei.id);
      assert.notEqual(kazei.id, gensen.id);

      // Verify Issuers
      assert.equal(kazei.issuerType, ISSUER_TYPES.MUNICIPAL_TAX_RESIDENCE);
      assert.equal(kokuzei.issuerType, ISSUER_TYPES.NATIONAL_TAX_OFFICE);
      assert.equal(gensen.issuerType, ISSUER_TYPES.EMPLOYER);
    });

    it('correctly classifies sensitive documents', () => {
      assert.strictEqual(isSensitiveDocument('document.mynumber-card'), true);
      assert.strictEqual(isSensitiveDocument('document.taxation-certificate'), true);
      assert.strictEqual(isSensitiveDocument('document.seal-registration-certificate'), true);
      assert.strictEqual(isSensitiveDocument('document.resident-record-copy'), false);
    });
  });

  // =========================================================================
  // 2. Multilingual Search & Alias Resolution
  // =========================================================================
  describe('Document Search & Aliases', () => {
    it('resolves by Japanese kanji, hiragana, and kana aliases', () => {
      const byKanji = findDocumentsByQuery('住民票');
      assert.ok(byKanji.some((d) => d.id === 'document.resident-record-copy'));

      const byHiragana = findDocumentsByQuery('じゅうみんひょう');
      assert.ok(byHiragana.some((d) => d.id === 'document.resident-record-copy'));

      const byKoseki = findDocumentsByQuery('戸籍謄本');
      assert.ok(byKoseki.some((d) => d.id === 'document.family-register-full'));
    });

    it('resolves by Vietnamese administrative terminology', () => {
      const byVi = findDocumentsByQuery('phieu cu tru');
      assert.ok(byVi.some((d) => d.id === 'document.resident-record-copy'));

      const byGensen = findDocumentsByQuery('phieu khau tru thue');
      assert.ok(byGensen.some((d) => d.id === 'document.withholding-tax-slip'));

      const byHoTich = findDocumentsByQuery('ho tich toan bo');
      assert.ok(byHoTich.some((d) => d.id === 'document.family-register-full'));
    });

    it('resolves by English administrative terms', () => {
      const byEn = findDocumentsByQuery('withholding tax');
      assert.ok(byEn.some((d) => d.id === 'document.withholding-tax-slip'));

      const bySeal = findDocumentsByQuery('seal certificate');
      assert.ok(bySeal.some((d) => d.id === 'document.seal-registration-certificate'));
    });

    it('returns empty array on blank or unknown queries', () => {
      assert.deepEqual(findDocumentsByQuery(''), []);
      assert.deepEqual(findDocumentsByQuery(null), []);
      assert.deepEqual(findDocumentsByQuery('completely_unknown_xyz123'), []);
    });
  });

  // =========================================================================
  // 3. Procedures & Requirements Binding
  // =========================================================================
  describe('Procedure Requirement Resolution', () => {
    it('resolves requirements for Residence Status Renewal', () => {
      const result = getRequirementsForProcedure('procedure.residence-status-renewal');
      assert.ok(result);
      assert.equal(result.procedure.id, 'procedure.residence-status-renewal');
      assert.ok(result.totalCount >= 5);
      assert.ok(result.mandatoryCount >= 4);

      // Verify attached canonical documents
      const juminhyoReq = result.allRequirements.find(
        (r) => r.documentId === 'document.resident-record-copy'
      );
      assert.ok(juminhyoReq);
      assert.equal(juminhyoReq.maxAgeMonths, 3);
      assert.equal(juminhyoReq.originalOrCopy, 'original_only');
      assert.equal(juminhyoReq.document.canonicalNameJa, '住民票の写し');
    });

    it('prohibits My Number in Jūminhyō for ISA procedures', () => {
      const result = getRequirementsForProcedure('procedure.residence-status-renewal');
      const juminhyoReq = result.allRequirements.find(
        (r) => r.documentId === 'document.resident-record-copy'
      );
      assert.ok(
        juminhyoReq.prohibitedFieldsJa.some((f) => f.includes('マイナンバー')),
        'Must explicitly forbid My Number on resident record copy for immigration'
      );
    });

    it('CROSS-DOMAIN REUSE: Canonical 住民票 is reused across multiple procedures with distinct rules', () => {
      const renewal = getRequirementsForProcedure('procedure.residence-status-renewal');
      const childAllowance = getRequirementsForProcedure('procedure.child-allowance-claim');

      const renewalJuminhyo = renewal.allRequirements.find(
        (r) => r.documentId === 'document.resident-record-copy'
      );
      const childJuminhyo = childAllowance.allRequirements.find(
        (r) => r.documentId === 'document.resident-record-copy'
      );

      assert.ok(renewalJuminhyo && childJuminhyo);
      assert.equal(renewalJuminhyo.document.id, childJuminhyo.document.id);

      // Renewal: mandatory, within 3 months
      assert.equal(renewalJuminhyo.necessity, 'mandatory');
      assert.equal(renewalJuminhyo.maxAgeMonths, 3);

      // Child allowance: conditional (only if living apart), within 1 month
      assert.equal(childJuminhyo.necessity, 'conditional');
      assert.equal(childJuminhyo.maxAgeMonths, 1);
    });
  });

  // =========================================================================
  // 4. Freshness Validation Engine
  // =========================================================================
  describe('Document Freshness Validation', () => {
    const threeMonthsReq = CANONICAL_REQUIREMENTS['req.renewal.resident-record'];
    const passportReq = CANONICAL_REQUIREMENTS['req.renewal.passport'];

    it('validates a document issued within the required period', () => {
      const refDate = new Date('2026-09-15');
      const issueDate = '2026-08-01'; // 1.5 months old

      const check = validateDocumentFreshness(threeMonthsReq, issueDate, refDate);
      assert.strictEqual(check.isValid, true);
      assert.strictEqual(check.reason, 'fresh');
      assert.ok(check.ageMonths <= 3);
    });

    it('rejects an expired document exceeding maxAgeMonths', () => {
      const refDate = new Date('2026-09-15');
      const issueDate = '2026-05-01'; // 4.5 months old

      const check = validateDocumentFreshness(threeMonthsReq, issueDate, refDate);
      assert.strictEqual(check.isValid, false);
      assert.strictEqual(check.reason, 'expired');
      assert.ok(check.ageMonths > 3);
    });

    it('handles documents with no expiration limit (e.g. Passport)', () => {
      const refDate = new Date('2026-09-15');
      const issueDate = '2020-01-01';

      const check = validateDocumentFreshness(passportReq, issueDate, refDate);
      assert.strictEqual(check.isValid, true);
      assert.strictEqual(check.reason, 'no_freshness_limit');
      assert.strictEqual(check.maxAgeMonths, null);
    });

    it('rejects future issue dates safely', () => {
      const refDate = new Date('2026-09-15');
      const futureDate = '2026-10-01';

      const check = validateDocumentFreshness(threeMonthsReq, futureDate, refDate);
      assert.strictEqual(check.isValid, false);
      assert.strictEqual(check.reason, 'future_issue_date');
    });
  });

  // =========================================================================
  // 5. Locality & Acquisition Resolution
  // =========================================================================
  describe('Locality Registry & Acquisition Guidance', () => {
    it('resolves Tier 1 verified municipality (Shinjuku City)', () => {
      const locality = resolveLocality('131041');
      assert.strictEqual(locality.tier, LOCALITY_TIERS.TIER_1_VERIFIED);
      assert.strictEqual(locality.isFallback, false);
      assert.strictEqual(locality.nameJa, '東京都新宿区');
      assert.strictEqual(locality.fees.residentRecord.konbini, 200); // 100 JPY discount
    });

    it('resolves by city name in English or Japanese', () => {
      const byEn = resolveLocality('Shibuya');
      assert.strictEqual(byEn.code, '131131');

      const byJa = resolveLocality('大阪市');
      assert.strictEqual(byJa.code, '271004');
    });

    it('NEGATIVE TEST: Unverified locality MUST NOT say service unavailable; must return graceful fallback', () => {
      const unverified = resolveLocality('UnknownVillage999');
      assert.strictEqual(unverified.tier, LOCALITY_TIERS.TIER_3_UNVERIFIED);
      assert.strictEqual(unverified.isFallback, true);
      assert.ok(unverified.unverifiedAdvisoryI18n.ja.includes('Toolioで未確認'));
      assert.ok(unverified.standardFees.residentRecord.counter === 300);
    });

    it('resolves acquisition guidance for 住民票 with convenience store discount in Shinjuku', () => {
      const guidance = resolveAcquisitionGuidance('document.resident-record-copy', {
        municipalityQuery: 'Shinjuku',
        hasMyNumberCard: true,
      });

      assert.ok(guidance);
      assert.equal(guidance.document.canonicalNameJa, '住民票の写し');
      assert.equal(guidance.locality.nameJa, '東京都新宿区');

      const konbiniChannel = guidance.channels.find(
        (c) => c.channelId === ACQUISITION_CHANNELS.CONVENIENCE_STORE
      );
      assert.ok(konbiniChannel);
      assert.equal(konbiniChannel.feeJpy, 200); // discounted in Shinjuku
      assert.equal(konbiniChannel.isAvailableWithUserSetup, true);
    });

    it('correctly routes Inhabitant Tax Certificate to Jan 1 municipality when user moved', () => {
      const guidance = resolveAcquisitionGuidance('document.taxation-certificate', {
        municipalityQuery: 'Shinjuku',
        movedAfterJan1: true,
        jan1Municipality: 'Osaka City',
      });

      assert.ok(guidance);
      assert.equal(guidance.issuer.type, ISSUER_TYPES.MUNICIPAL_TAX_RESIDENCE);
      assert.ok(guidance.issuer.criticalCaveatI18n.ja.includes('引越し注意'));
      assert.ok(guidance.issuer.criticalCaveatI18n.vi.includes('Cảnh báo chuyển nhà'));
    });

    it('correctly warns about Koseki convenience-store advance registration when living elsewhere', () => {
      const guidance = resolveAcquisitionGuidance('document.family-register-full', {
        livesOutsideRegisteredDomicile: true,
        registeredDomicileMunicipality: 'Kyoto City',
      });

      assert.ok(guidance);
      assert.equal(guidance.issuer.type, ISSUER_TYPES.MUNICIPAL_REGISTERED_DOMICILE);
      assert.ok(guidance.issuer.criticalCaveatI18n.ja.includes('本籍地利用登録'));
    });
  });
});
