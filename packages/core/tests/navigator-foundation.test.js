import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  createNavigatorContext,
  validateNavigatorContext,
  ALLOWED_NAVIGATOR_FIELDS,
  PROHIBITED_SENSITIVE_FIELDS,
  stripSensitiveData,
  extractHandoffPayload,
  ConfidenceType,
  Priority,
  Timing,
  Jurisdiction,
  Coverage,
  createRecommendation,
  calculateRecommendationScore,
  rankRecommendations,
  evaluateAndRankRecommendations,
  resolveCapability,
  getCapabilityMetadata,
  filterContextForCapability,
  buildCapabilityDeepLink,
} from '../src/navigator/index.js';

describe('Phase 9 — Navigator Foundation (M1)', () => {
  describe('NavigatorContext & Context Minimization', () => {
    it('creates a default minimal context', () => {
      const ctx = createNavigatorContext();
      assert.equal(ctx.country, 'JP');
      assert.equal(ctx.lifeSituation, null);
      assert.equal(ctx.employmentStatus, null);
      assert.equal(ctx.familyContext, null);
      assert.equal(ctx.eventDates, null);
    });

    it('populates valid non-sensitive fields', () => {
      const ctx = createNavigatorContext({
        lifeSituation: 'starting-life',
        employmentStatus: 'regular_employee',
        residenceStatus: 'engineer_specialist',
        municipality: 'tokyo-shinjuku',
        familyContext: {
          hasSpouse: true,
          childrenCount: 2,
        },
        eventDates: {
          arrivalDate: '2026-10-01',
        },
      });

      assert.equal(ctx.lifeSituation, 'starting-life');
      assert.equal(ctx.employmentStatus, 'regular_employee');
      assert.equal(ctx.municipality, 'tokyo-shinjuku');
      assert.equal(ctx.familyContext.hasSpouse, true);
      assert.equal(ctx.familyContext.childrenCount, 2);
      assert.equal(ctx.eventDates.arrivalDate, '2026-10-01');
    });

    it('validates context correctly', () => {
      const validCtx = createNavigatorContext({ country: 'JP', employmentStatus: 'student' });
      const res = validateNavigatorContext(validCtx);
      assert.equal(res.valid, true);
      assert.equal(res.errors.length, 0);

      const invalidCtx = { country: 12345, familyContext: 'not-an-object' };
      const res2 = validateNavigatorContext(invalidCtx);
      assert.equal(res2.valid, false);
      assert.ok(res2.errors.length >= 2);
    });

    it('strictly strips sensitive PII fields upon context creation', () => {
      const rawInput = {
        lifeSituation: 'changing-job',
        employmentStatus: 'regular_employee',
        myNumber: '1234-5678-9012',
        myNumberCardPin: '9999',
        passportNumber: 'N1234567',
        bankAccountNumber: '0123456',
        exactSalary: 500000,
        medicalHistory: 'confidential diagnosis',
      };

      const ctx = createNavigatorContext(rawInput);
      assert.equal(ctx.lifeSituation, 'changing-job');
      assert.equal(ctx.employmentStatus, 'regular_employee');
      assert.equal(ctx.myNumber, undefined);
      assert.equal(ctx.myNumberCardPin, undefined);
      assert.equal(ctx.passportNumber, undefined);
      assert.equal(ctx.bankAccountNumber, undefined);
      assert.equal(ctx.exactSalary, undefined);
      assert.equal(ctx.medicalHistory, undefined);
    });

    it('safely extracts handoff payloads via capability allowlists', () => {
      const ctx = {
        residenceStatus: 'engineer_specialist',
        newJobStartDate: '2026-11-01',
        resignationDate: '2026-10-15',
        unrelatedSecretField: 'secret',
        myNumber: '12345678',
      };

      const accepted = ['residenceStatus', 'newJobStartDate'];
      const payload = extractHandoffPayload(ctx, accepted);

      assert.deepEqual(payload, {
        residenceStatus: 'engineer_specialist',
        newJobStartDate: '2026-11-01',
      });
      assert.equal(payload.unrelatedSecretField, undefined);
      assert.equal(payload.myNumber, undefined);
    });
  });

  describe('Recommendation Contract & Typing', () => {
    it('creates a validated recommendation with legal ConfidenceType', () => {
      const rec = createRecommendation({
        id: 'rec.test.address',
        title: { vi: 'Đăng ký cư trú', ja: '住民票登録', en: 'Register address' },
        priority: Priority.URGENT,
        timing: Timing.NOW,
        reasonCode: 'REASON_MUNICIPAL_ADDRESS_14DAYS',
        deadline: {
          statutoryLimitDays: 14,
        },
        jurisdiction: Jurisdiction.MUNICIPAL,
        confidenceType: ConfidenceType.DETERMINISTIC,
      });

      assert.equal(rec.id, 'rec.test.address');
      assert.equal(rec.priority, 'urgent');
      assert.equal(rec.timing, 'now');
      assert.equal(rec.reasonCode, 'REASON_MUNICIPAL_ADDRESS_14DAYS');
      assert.equal(rec.deadline.statutoryLimitDays, 14);
      assert.equal(rec.jurisdiction, 'municipal');
      assert.equal(rec.confidenceType, 'deterministic');
    });

    it('throws error when id is missing', () => {
      assert.throws(() => {
        createRecommendation({});
      }, /must have at least an id/);
    });
  });

  describe('Ranking Engine', () => {
    it('ranks urgent over required, and shorter deadline higher', () => {
      const recUrgent = createRecommendation({
        id: 'rec.urgent.14days',
        priority: Priority.URGENT,
        timing: Timing.NOW,
        deadline: { statutoryLimitDays: 14 },
        reasonCode: 'R1',
      });

      const recUrgentLater = createRecommendation({
        id: 'rec.urgent.nolimit',
        priority: Priority.URGENT,
        timing: Timing.LATER,
        reasonCode: 'R2',
      });

      const recRequired = createRecommendation({
        id: 'rec.required',
        priority: Priority.REQUIRED,
        timing: Timing.NOW,
        reasonCode: 'R3',
      });

      const recOptional = createRecommendation({
        id: 'rec.optional',
        priority: Priority.OPTIONAL,
        timing: Timing.LATER,
        reasonCode: 'R4',
      });

      const ranked = rankRecommendations([recOptional, recRequired, recUrgentLater, recUrgent]);

      assert.equal(ranked[0].id, 'rec.urgent.14days'); // urgent + now + 14d bonus
      assert.equal(ranked[1].id, 'rec.required'); // required + now (800 + 500 = 1300) > urgent + later (1000 + 100 = 1100)
      assert.equal(ranked[2].id, 'rec.urgent.nolimit');
      assert.equal(ranked[3].id, 'rec.optional');
    });

    it('has deterministic tie-break based on id', () => {
      const recA = createRecommendation({ id: 'rec.b.item', priority: Priority.REQUIRED, timing: Timing.NOW, reasonCode: 'R' });
      const recB = createRecommendation({ id: 'rec.a.item', priority: Priority.REQUIRED, timing: Timing.NOW, reasonCode: 'R' });

      const ranked = rankRecommendations([recA, recB]);
      assert.equal(ranked[0].id, 'rec.a.item');
      assert.equal(ranked[1].id, 'rec.b.item');
    });
  });

  describe('Capability Resolution & Metadata', () => {
    it('resolves semantic capability to Tool ID and metadata', () => {
      const res = resolveCapability('employment.unemployment.eligibility');
      assert.equal(res.isAvailable, true);
      assert.equal(res.toolId, 'unemployment-eligibility-jp');
      assert.equal(res.hashRoute, '#/tools/unemployment-eligibility-jp');
      assert.ok(res.metadata);
      assert.equal(res.metadata.domain, 'employment');
      assert.equal(res.metadata.isRegulatory, true);
      assert.ok(res.metadata.acceptedContextFields.includes('employmentStatus'));
    });

    it('handles missing capability gracefully without breaking', () => {
      const res = resolveCapability('non.existent.capability');
      assert.equal(res.isAvailable, false);
      assert.equal(res.toolId, null);
      assert.equal(res.hashRoute, null);
      assert.equal(res.metadata, null);
    });

    it('builds capability deep link with safely filtered payload', () => {
      const link = buildCapabilityDeepLink('immigration.affiliationChange.check', {
        residenceStatus: 'engineer_specialist',
        resignationDate: '2026-09-30',
        myNumber: '99999999', // sensitive, must be filtered out
        unrelatedData: 'hello', // not in acceptedContextFields, must be filtered out
      });

      assert.ok(link.startsWith('#/tools/affiliation-change-checker-jp?'));
      assert.ok(link.includes('residenceStatus=engineer_specialist'));
      assert.ok(link.includes('resignationDate=2026-09-30'));
      assert.ok(!link.includes('myNumber'));
      assert.ok(!link.includes('unrelatedData'));
    });
  });

  describe('Locality Coverage Handling in Recommendation Engine', () => {
    it('adjusts municipal recommendations when municipality is unsupported or unknown', () => {
      const municipalRec = {
        id: 'rec.muni.juminhyo',
        title: 'Lấy phiếu cư trú',
        capabilityId: 'documents.certificate.guide',
        jurisdiction: Jurisdiction.MUNICIPAL,
        priority: Priority.REQUIRED,
        timing: Timing.NOW,
        confidenceType: ConfidenceType.DETERMINISTIC,
        reasonCode: 'REASON_DOC_ACQUISITION',
      };

      const result = evaluateAndRankRecommendations([municipalRec], { municipality: 'unknown' });
      assert.equal(result.length, 1);
      const evaluated = result[0];

      assert.equal(evaluated.coverage, Coverage.UNKNOWN);
      assert.equal(evaluated.confidenceType, ConfidenceType.LOCAL_DATA_UNVERIFIED);
      assert.ok(evaluated.localityNote);
      assert.ok(evaluated.localityNote.vi.includes('Tòa thị chính'));
      assert.equal(evaluated.toolId, 'certificate-acquisition-guide-jp');
    });

    it('preserves verified coverage when valid municipality is provided', () => {
      const municipalRec = {
        id: 'rec.muni.juminhyo',
        title: 'Lấy phiếu cư trú',
        capabilityId: 'documents.certificate.guide',
        jurisdiction: Jurisdiction.MUNICIPAL,
        priority: Priority.REQUIRED,
        timing: Timing.NOW,
        confidenceType: ConfidenceType.DETERMINISTIC,
        reasonCode: 'REASON_DOC_ACQUISITION',
      };

      const result = evaluateAndRankRecommendations([municipalRec], { municipality: 'tokyo-shinjuku' });
      const evaluated = result[0];
      assert.equal(evaluated.coverage, Coverage.VERIFIED);
      assert.equal(evaluated.confidenceType, ConfidenceType.DETERMINISTIC);
    });
  });
});
