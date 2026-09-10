import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  evaluateProcedureReadiness,
  READINESS_LEVELS,
} from '../src/documents/checkers/procedureCheckerEngine.js';

describe('Phase 8 - M6: Procedure Requirement Checker Engine', () => {
  const refDate = new Date('2026-09-15');

  it('evaluates fully ready procedure with all documents, fresh dates, and fee', () => {
    const result = evaluateProcedureReadiness({
      procedureId: 'procedure.residence-status-renewal',
      timingState: { isWithinFilingWindow: true },
      preparedDocs: {
        'req.renewal.passport': { hasDocument: true, isOriginal: true },
        'req.renewal.residence-card': { hasDocument: true, isOriginal: true },
        'req.renewal.resident-record': { hasDocument: true, issueDate: '2026-08-01', isOriginal: true },
        'req.renewal.taxation-cert': { hasDocument: true, issueDate: '2026-08-01', isOriginal: true },
        'req.renewal.tax-payment-cert': { hasDocument: true, issueDate: '2026-08-01', isOriginal: true },
        'req.renewal.employment-cert': { hasDocument: true, issueDate: '2026-08-01', isOriginal: true },
      },
      submissionState: { hasFeePrepared: true, selectedMethod: 'counter' },
      referenceDate: refDate,
    });

    assert.ok(result);
    assert.equal(result.overallLevel, READINESS_LEVELS.READY);
    assert.ok(result.overallScore >= 95);
    assert.equal(result.gaps.length, 0);
  });

  it('flags missing mandatory documents and identifies gaps', () => {
    const result = evaluateProcedureReadiness({
      procedureId: 'procedure.residence-status-renewal',
      timingState: { isWithinFilingWindow: true },
      preparedDocs: {
        'req.renewal.passport': { hasDocument: true },
        // Missing Jūminhyō and Tax certificates
      },
      submissionState: { hasFeePrepared: false },
      referenceDate: refDate,
    });

    assert.ok(result);
    assert.equal(result.overallLevel, READINESS_LEVELS.ACTION_REQUIRED);
    assert.ok(result.gaps.length >= 3);
    assert.ok(result.gaps.some((g) => g.type === 'missing_document'));
  });

  it('detects expired documents exceeding maxAgeMonths freshness threshold', () => {
    const result = evaluateProcedureReadiness({
      procedureId: 'procedure.residence-status-renewal',
      timingState: { isWithinFilingWindow: true },
      preparedDocs: {
        'req.renewal.passport': { hasDocument: true },
        'req.renewal.residence-card': { hasDocument: true },
        'req.renewal.resident-record': {
          hasDocument: true,
          issueDate: '2026-04-01', // 5.5 months old (> 3 months)
          isOriginal: true,
        },
      },
      referenceDate: refDate,
    });

    assert.ok(result);
    const juminhyoDoc = result.documents.evaluatedDocs.find(
      (d) => d.requirementId === 'req.renewal.resident-record'
    );
    assert.ok(juminhyoDoc);
    assert.equal(juminhyoDoc.status, 'expired');
    assert.ok(result.gaps.some((g) => g.type === 'expired_document'));
  });

  it('rejects copy when original is strictly required', () => {
    const result = evaluateProcedureReadiness({
      procedureId: 'procedure.residence-status-renewal',
      timingState: { isWithinFilingWindow: true },
      preparedDocs: {
        'req.renewal.resident-record': {
          hasDocument: true,
          issueDate: '2026-08-15',
          isOriginal: false, // Copy provided
        },
      },
      referenceDate: refDate,
    });

    assert.ok(result);
    const juminhyoDoc = result.documents.evaluatedDocs.find(
      (d) => d.requirementId === 'req.renewal.resident-record'
    );
    assert.equal(juminhyoDoc.status, 'copy_not_allowed');
    assert.ok(result.gaps.some((g) => g.type === 'copy_not_allowed'));
  });
});
