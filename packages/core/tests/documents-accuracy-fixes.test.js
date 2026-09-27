import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { validateDocumentFreshness } from '../src/documents/resolvers/procedureRequirementResolver.js';
import { evaluateProcedureReadiness } from '../src/documents/checkers/procedureCheckerEngine.js';
import { getImmigrationFee, isRevisedFeeRegime } from '../src/documents/registry/immigrationFees.js';
import { resolveLocality, isKonbiniServiceActive } from '../src/documents/acquisition/localityRegistry.js';
import { resolveAcquisitionGuidance } from '../src/documents/resolvers/acquisitionResolver.js';
import { findDocumentsByQuery } from '../src/documents/resolvers/documentResolver.js';
import { searchUnifiedIndex } from '../src/navigator/search/searchEngine.js';

const req3 = { maxAgeMonths: 3 };

describe('H6: document freshness uses local calendar dates + month-end clamp', () => {
  it('valid on the exact expiry day, invalid the day after', () => {
    assert.equal(validateDocumentFreshness(req3, '2026-06-15', '2026-09-15').isValid, true);
    assert.equal(validateDocumentFreshness(req3, '2026-06-15', '2026-09-16').isValid, false);
  });
  it('clamps month-end (11/30 + 3 months = 2/28)', () => {
    const r = validateDocumentFreshness(req3, '2026-11-30', '2027-02-28');
    assert.equal(r.isValid, true);
    assert.equal(r.expiresOn, '2027-02-28');
    assert.equal(validateDocumentFreshness(req3, '2026-11-30', '2027-03-01').isValid, false);
  });
  it('rejects invalid ISO dates', () => {
    assert.equal(validateDocumentFreshness(req3, '2026-02-30', '2026-03-01').reason, 'invalid_issue_date');
  });
});

describe('C3: immigration fees depend on application date (moj.go.jp/isa/01_00644.html)', () => {
  it('until 2026-09-30: 6,000 counter / 5,500 online; PR 10,000', () => {
    assert.equal(isRevisedFeeRegime('2026-09-30'), false);
    assert.equal(getImmigrationFee({ kind: 'change_renewal', applicationDate: '2026-09-30' }).amountJpy, 6000);
    assert.equal(getImmigrationFee({ kind: 'change_renewal', method: 'online', applicationDate: '2026-09-30' }).amountJpy, 5500);
    assert.equal(getImmigrationFee({ kind: 'permanent', applicationDate: '2026-09-30' }).amountJpy, 10000);
  });
  it('from 2026-10-01: banded by period granted; PR 200,000', () => {
    const range = getImmigrationFee({ kind: 'change_renewal', applicationDate: '2026-10-01' });
    assert.equal(range.amountJpy, null);
    assert.equal(range.minJpy, 10000);
    assert.equal(range.maxJpy, 75000);
    assert.equal(getImmigrationFee({ kind: 'change_renewal', applicationDate: '2026-10-01', grantedPeriodMonths: 12 }).amountJpy, 33000);
    assert.equal(getImmigrationFee({ kind: 'change_renewal', method: 'online', applicationDate: '2026-10-01', grantedPeriodMonths: 12 }).amountJpy, 27000);
    assert.equal(getImmigrationFee({ kind: 'change_renewal', applicationDate: '2026-10-01', grantedPeriodMonths: 36 }).amountJpy, 64000);
    assert.equal(getImmigrationFee({ kind: 'change_renewal', method: 'online', applicationDate: '2026-10-01', grantedPeriodMonths: 60 }).amountJpy, 65000);
    assert.equal(getImmigrationFee({ kind: 'permanent', applicationDate: '2026-10-01' }).amountJpy, 200000);
  });
  it('checker shows the date-aware fee and survives null inputs', () => {
    const before = evaluateProcedureReadiness({ procedureId: 'procedure.residence-status-renewal', referenceDate: new Date(2026, 8, 30) });
    assert.equal(before.submission.feeAmountJpy, 6000);
    const after = evaluateProcedureReadiness({ procedureId: 'procedure.residence-status-renewal', referenceDate: new Date(2026, 9, 1) });
    assert.equal(after.submission.feeMinJpy, 10000);
    assert.equal(after.submission.feeMaxJpy, 75000);
    assert.doesNotThrow(() =>
      evaluateProcedureReadiness({ procedureId: 'procedure.residence-status-renewal', preparedDocs: null, timingState: null, submissionState: null })
    );
  });
});

describe('H9: locality data', () => {
  it('Nagoya konbini starts 2026-12-16', () => {
    const nagoya = resolveLocality('231002');
    assert.equal(isKonbiniServiceActive(nagoya, new Date(2026, 11, 15)), false);
    assert.equal(isKonbiniServiceActive(nagoya, new Date(2026, 11, 16)), true);
    const g = resolveAcquisitionGuidance('document.resident-record-copy', { municipalityQuery: '231002', hasMyNumberCard: true, referenceDate: new Date(2026, 8, 27) });
    const konbini = g.channels.find((c) => c.channelId === 'convenience_store');
    assert.equal(konbini.konbiniSupportStatus, 'not_started');
  });
  it('Yokohama does not issue tax certificates at konbini; 戸籍 450円', () => {
    const tax = resolveAcquisitionGuidance('document.taxation-certificate', { municipalityQuery: '141003', hasMyNumberCard: true });
    const k = tax.channels.find((c) => c.channelId === 'convenience_store');
    if (k) assert.equal(k.isSupportedInQueriedLocality, false);
    assert.equal(resolveLocality('141003').fees.familyRegisterFull.konbini, 450);
    assert.equal(resolveLocality('271004').fees.familyRegisterFull.konbini, 450);
    for (const m of ['131041', '131131', '131032', '131122', '271004', '231002', '141003', '401307']) {
      assert.ok(resolveLocality(m).verifiedAt, `${m} thiếu verifiedAt`);
    }
  });
});

describe('M9: search precision', () => {
  it('single Latin letter returns nothing; unrelated context does not add results', () => {
    assert.equal(searchUnifiedIndex('a').totalCount, 0);
    assert.equal(searchUnifiedIndex('zzqx', { context: { hasBaby: true } }).totalCount, 0);
  });
  it('document search is diacritic-insensitive', () => {
    const a = findDocumentsByQuery('giấy chứng nhận thuế cư trú').map((d) => d.id);
    const b = findDocumentsByQuery('giay chung nhan thue cu tru').map((d) => d.id);
    assert.deepEqual(a, b);
    assert.ok(b.includes('document.taxation-certificate'));
  });
  it('vietnam-consular-jp is indexed', () => {
    const ids = searchUnifiedIndex('apostille').results.map((r) => r.id);
    assert.ok(ids.includes('vietnam-consular-jp') || ids.includes('vn_consular_legalization_jp_docs'));
  });
});
