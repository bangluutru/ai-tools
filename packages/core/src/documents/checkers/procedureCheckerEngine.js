/**
 * @file procedureCheckerEngine.js
 * Engine for "Tôi đã chuẩn bị đủ chưa?" (Procedure Requirement Readiness Checker).
 * Evaluates readiness across 3 distinct dimensions without overstepping substantive domain approval.
 */

import { getRequirementsForProcedure, validateDocumentFreshness } from '../resolvers/procedureRequirementResolver.js';

export const READINESS_LEVELS = {
  READY: 'ready',
  ACTION_REQUIRED: 'action_required',
  NOT_READY: 'not_ready',
};

/**
 * Evaluate overall submission readiness for a procedure.
 * 
 * @param {object} params
 * @param {string} params.procedureId
 * @param {object} [params.timingState={}] - { daysUntilDeadline, isWithinFilingWindow }
 * @param {object} [params.preparedDocs={}] - { [reqId]: { hasDocument: boolean, issueDate?: string, isOriginal?: boolean } }
 * @param {object} [params.submissionState={}] - { selectedMethod: string, hasFeePrepared: boolean }
 * @param {Date} [params.referenceDate=new Date()]
 * @returns {object} Evaluation report
 */
export function evaluateProcedureReadiness({
  procedureId,
  timingState = {},
  preparedDocs = {},
  submissionState = {},
  referenceDate = new Date(),
}) {
  const reqData = getRequirementsForProcedure(procedureId);
  if (!reqData) return null;

  const { procedure, allRequirements, groupedRequirements } = reqData;

  // 1. Evaluate Dimension 1: Procedure Prerequisites & Timing
  const timing = {
    isWithinWindow: timingState.isWithinFilingWindow ?? true,
    daysUntilDeadline: timingState.daysUntilDeadline ?? null,
    status: (timingState.isWithinFilingWindow ?? true) ? 'pass' : 'warning',
    messageI18n: (timingState.isWithinFilingWindow ?? true)
      ? { ja: '申請受付期間内です', vi: 'Đang trong thời gian tiếp nhận hợp lệ', en: 'Within valid filing window' }
      : { ja: '申請受付期間外です', vi: 'Chưa đến hoặc đã quá thời hạn nộp', en: 'Outside valid filing window' },
  };

  // 2. Evaluate Dimension 2: Documents Readiness
  const evaluatedDocs = allRequirements.map((req) => {
    const userDoc = preparedDocs[req.id] || {};
    const hasDoc = Boolean(userDoc.hasDocument);
    const isOriginal = Boolean(userDoc.isOriginal ?? true);

    let freshness = { isValid: true, reason: 'no_freshness_limit' };
    if (hasDoc && req.maxAgeMonths !== null && userDoc.issueDate) {
      freshness = validateDocumentFreshness(req, userDoc.issueDate, referenceDate);
    } else if (hasDoc && req.maxAgeMonths !== null && !userDoc.issueDate) {
      freshness = { isValid: false, reason: 'missing_issue_date', maxAgeMonths: req.maxAgeMonths };
    }

    // Determine status
    let status = 'missing';
    if (hasDoc) {
      if (!freshness.isValid) {
        status = 'expired';
      } else if (req.originalOrCopy === 'original_only' && !isOriginal) {
        status = 'copy_not_allowed';
      } else {
        status = 'ready';
      }
    }

    return {
      requirementId: req.id,
      documentId: req.documentId,
      documentNameJa: req.document?.canonicalNameJa || '公的書類',
      documentNameI18n: req.document?.nameI18n,
      necessity: req.necessity,
      maxAgeMonths: req.maxAgeMonths,
      hasDocument: hasDoc,
      issueDate: userDoc.issueDate || null,
      isOriginal,
      freshness,
      status, // 'ready' | 'missing' | 'expired' | 'copy_not_allowed'
    };
  });

  const mandatoryDocs = evaluatedDocs.filter((d) => d.necessity === 'mandatory');
  const mandatoryReadyCount = mandatoryDocs.filter((d) => d.status === 'ready').length;
  const mandatoryTotalCount = mandatoryDocs.length;
  const documentsScore = mandatoryTotalCount > 0 ? Math.round((mandatoryReadyCount / mandatoryTotalCount) * 100) : 100;

  // 3. Evaluate Dimension 3: Submission Readiness
  const submissionMethod = submissionState.selectedMethod || procedure.submissionMethods[0];
  const feePrepared = submissionState.hasFeePrepared ?? false;
  const isFeeRequired = procedure.feeRules?.feeAmountJpy > 0;

  const submission = {
    selectedMethod: submissionMethod,
    feePrepared: isFeeRequired ? feePrepared : true,
    isFeeRequired,
    feeAmountJpy: procedure.feeRules?.feeAmountJpy || 0,
    feeType: procedure.feeRules?.feeType || 'free',
  };

  // Overall Score Calculation (out of 100)
  // Weight: Documents 60%, Timing 20%, Submission prep 20%
  let overallScore = Math.round(
    documentsScore * 0.6 +
      (timing.status === 'pass' ? 20 : 0) +
      (submission.feePrepared ? 20 : 0)
  );

  let overallLevel = READINESS_LEVELS.READY;
  if (overallScore < 60 || mandatoryReadyCount < mandatoryTotalCount) {
    overallLevel = READINESS_LEVELS.ACTION_REQUIRED;
  }
  if (!timing.isWithinWindow) {
    overallLevel = READINESS_LEVELS.NOT_READY;
  }

  // Identify Actionable Gaps
  const gaps = [];
  evaluatedDocs.forEach((d) => {
    if (d.necessity === 'mandatory') {
      if (d.status === 'missing') {
        gaps.push({
          type: 'missing_document',
          documentNameJa: d.documentNameJa,
          messageI18n: {
            ja: `${d.documentNameJa}がまだ準備されていません。`,
            vi: `Chưa chuẩn bị: ${d.documentNameJa} (${d.documentNameI18n?.vi || ''})`,
            en: `Missing: ${d.documentNameJa}`,
          },
        });
      } else if (d.status === 'expired') {
        gaps.push({
          type: 'expired_document',
          documentNameJa: d.documentNameJa,
          messageI18n: {
            ja: `${d.documentNameJa}の発行日が古すぎます（${d.maxAgeMonths}か月以内の原本が必要）。再取得してください。`,
            vi: `${d.documentNameJa} đã quá hạn hiệu lực (yêu cầu cấp trong vòng ${d.maxAgeMonths} tháng). Cần xin cấp lại.`,
            en: `${d.documentNameJa} is expired (must be within ${d.maxAgeMonths} months). Re-issuance required.`,
          },
        });
      } else if (d.status === 'copy_not_allowed') {
        gaps.push({
          type: 'copy_not_allowed',
          documentNameJa: d.documentNameJa,
          messageI18n: {
            ja: `${d.documentNameJa}は原本の提出が必須です（コピー不可）。`,
            vi: `${d.documentNameJa} bắt buộc phải nộp bản gốc (không chấp nhận bản photocopy).`,
            en: `${d.documentNameJa} must be original (copies not allowed).`,
          },
        });
      }
    }
  });

  if (isFeeRequired && !submission.feePrepared) {
    gaps.push({
      type: 'fee_not_prepared',
      messageI18n: {
        ja: `手数料（${submission.feeAmountJpy}円の収入印紙等）の準備が必要です。`,
        vi: `Chưa chuẩn bị lệ phí (${submission.feeAmountJpy}円 tiền tem Shūnyū Inshi).`,
        en: `Fee (${submission.feeAmountJpy} JPY revenue stamp) not prepared yet.`,
      },
    });
  }

  return {
    procedure,
    overallScore,
    overallLevel,
    timing,
    documents: {
      score: documentsScore,
      mandatoryReadyCount,
      mandatoryTotalCount,
      evaluatedDocs,
    },
    submission,
    gaps,
  };
}
