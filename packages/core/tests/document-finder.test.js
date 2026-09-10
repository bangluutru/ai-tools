import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  getAvailableIntents,
  findRequiredDocuments,
} from '../src/documents/finders/documentFinderEngine.js';

describe('Phase 8 - M2: Document Finder Engine', () => {
  it('returns all registered user intents', () => {
    const intents = getAvailableIntents();
    assert.ok(intents.length >= 5);
    const renewalIntent = intents.find((i) => i.intentId === 'intent.visa-renewal');
    assert.ok(renewalIntent);
    assert.equal(renewalIntent.procedureId, 'procedure.residence-status-renewal');
  });

  it('resolves required documents by user intent (visa renewal)', () => {
    const result = findRequiredDocuments({ intentId: 'intent.visa-renewal' });
    assert.ok(result);
    assert.equal(result.procedure.id, 'procedure.residence-status-renewal');
    assert.ok(result.mandatory.length >= 5);

    // Verify Jūminhyō requirement attributes
    const juminhyo = result.mandatory.find((d) => d.documentId === 'document.resident-record-copy');
    assert.ok(juminhyo);
    assert.equal(juminhyo.documentNameJa, '住民票の写し');
    assert.equal(juminhyo.maxAgeMonths, 3);
    assert.equal(juminhyo.originalOrCopy, 'original_only');
    assert.ok(juminhyo.prohibitedFieldsJa.some((f) => f.includes('マイナンバー')));
  });

  it('resolves required documents by direct procedure ID (child allowance)', () => {
    const result = findRequiredDocuments({ procedureId: 'procedure.child-allowance-claim' });
    assert.ok(result);
    assert.equal(result.procedure.id, 'procedure.child-allowance-claim');

    // Child allowance has conditional resident record (only when living apart)
    assert.ok(result.conditional.some((d) => d.documentId === 'document.resident-record-copy'));
  });

  it('returns null when neither procedureId nor valid intentId is provided', () => {
    assert.strictEqual(findRequiredDocuments({}), null);
    assert.strictEqual(findRequiredDocuments({ intentId: 'non_existent_intent' }), null);
  });
});
