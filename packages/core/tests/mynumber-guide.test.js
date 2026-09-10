import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  MYNUMBER_PROCEDURE_TYPES,
  CERTIFICATE_TYPES,
  getAllMyNumberProcedures,
  getMyNumberProcedureGuidance,
} from '../src/documents/mynumber/mynumberGuideEngine.js';

describe('Phase 8 - M4: My Number Procedure Guide Engine', () => {
  it('returns all 7 registered My Number procedures', () => {
    const list = getAllMyNumberProcedures();
    assert.ok(list.length >= 7);
  });

  it('provides critical guidance for visa extension renewal', () => {
    const proc = getMyNumberProcedureGuidance(MYNUMBER_PROCEDURE_TYPES.VISA_EXTENSION_RENEWAL);
    assert.ok(proc);
    assert.equal(proc.urgencyLevel, 'high');
    assert.ok(proc.warningNoticeI18n.ja.includes('超重要'));
    assert.ok(proc.warningNoticeI18n.vi.includes('CỰC KỲ QUAN TRỌNG'));
    assert.ok(proc.gracePeriodRuleJa.includes('2か月'));
    assert.ok(proc.requiredItemsI18n.ja.length >= 3);
  });

  it('provides 24/7 hotline and emergency steps for lost or stolen card', () => {
    const lost = getMyNumberProcedureGuidance(MYNUMBER_PROCEDURE_TYPES.LOST_OR_STOLEN);
    assert.ok(lost);
    assert.equal(lost.urgencyLevel, 'critical');
    assert.ok(lost.hotlineI18n.ja.includes('0120-95-0178'));
    assert.ok(lost.hotlineI18n.vi.includes('0120-95-0178'));
    assert.ok(lost.stepsJa.length >= 3);
  });

  it('distinguishes between Signature and User Authentication certificates', () => {
    const sig = CERTIFICATE_TYPES.SIGNATURE_CERT;
    const userAuth = CERTIFICATE_TYPES.USER_AUTH_CERT;

    // PIN formats
    assert.ok(sig.pinFormatJa.includes('6桁〜16桁'));
    assert.ok(userAuth.pinFormatJa.includes('数字4桁'));

    // Lockout rules
    assert.ok(sig.lockoutRuleJa.includes('5回'));
    assert.ok(userAuth.lockoutRuleJa.includes('3回'));

    // Address change invalidation rule
    assert.ok(sig.invalidationTriggerJa.includes('自動失効'));
    assert.ok(userAuth.invalidationTriggerJa.includes('失効せず'));
  });
});
