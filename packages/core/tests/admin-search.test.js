import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { searchAdministrativeDomain } from '../src/documents/search/adminSearchEngine.js';

describe('Phase 8 - M7: Administrative Search & Disambiguation Engine', () => {
  it('triggers tax certificate disambiguation card on ambiguous tax queries', () => {
    const viSearch = searchAdministrativeDomain('thuế');
    assert.ok(viSearch.disambiguationCard);
    assert.equal(viSearch.disambiguationCard.id, 'disambiguation.tax-certificates');
    assert.equal(viSearch.disambiguationCard.options.length, 4);

    const jaSearch = searchAdministrativeDomain('納税');
    assert.ok(jaSearch.disambiguationCard);
    assert.equal(jaSearch.disambiguationCard.id, 'disambiguation.tax-certificates');
  });

  it('triggers family register disambiguation card on ambiguous Koseki queries', () => {
    const kosekiSearch = searchAdministrativeDomain('hộ tịch');
    assert.ok(kosekiSearch.disambiguationCard);
    assert.equal(kosekiSearch.disambiguationCard.id, 'disambiguation.family-register');
    assert.equal(kosekiSearch.disambiguationCard.options.length, 3);
  });

  it('resolves exact documents by Japanese or Vietnamese terms', () => {
    const juminhyo = searchAdministrativeDomain('住民票');
    assert.ok(juminhyo.matchedDocuments.some((d) => d.id === 'document.resident-record-copy'));

    const gensen = searchAdministrativeDomain('phieu khau tru thue');
    assert.ok(gensen.matchedDocuments.some((d) => d.id === 'document.withholding-tax-slip'));
  });

  it('resolves procedures by keyword', () => {
    const procSearch = searchAdministrativeDomain('visa renewal');
    assert.ok(procSearch.matchedProcedures.some((p) => p.id === 'procedure.residence-status-renewal'));
  });

  it('handles empty and unknown queries gracefully without throwing', () => {
    const empty = searchAdministrativeDomain('');
    assert.strictEqual(empty.hasResults, undefined);
    assert.equal(empty.matchedDocuments.length, 0);

    const unknown = searchAdministrativeDomain('unknown_random_query_xyz');
    assert.strictEqual(unknown.hasResults, false);
    assert.equal(unknown.matchedDocuments.length, 0);
    assert.equal(unknown.disambiguationCard, null);
  });
});
