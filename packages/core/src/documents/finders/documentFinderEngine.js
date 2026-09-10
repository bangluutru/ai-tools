/**
 * @file documentFinderEngine.js
 * Engine for "Tôi cần giấy gì?" (What documents do I need?)
 * Deterministic, catalog-driven requirement resolver.
 */

import { getProcedureById, getAllProcedures, getRequirementsForProcedure } from '../resolvers/procedureRequirementResolver.js';
import { getDocumentById } from '../resolvers/documentResolver.js';

export const USER_INTENT_CATALOG = [
  {
    intentId: 'intent.visa-renewal',
    procedureId: 'procedure.residence-status-renewal',
    category: 'immigration',
    labelI18n: {
      ja: 'ビザ（在留期間）を更新したい',
      vi: 'Tôi muốn gia hạn visa / thời hạn lưu trú',
      en: 'I want to renew my visa / period of stay',
    },
    iconName: 'FileCheck',
  },
  {
    intentId: 'intent.permanent-residence',
    procedureId: 'procedure.permanent-residence-application',
    category: 'immigration',
    labelI18n: {
      ja: '永住許可（永住権）を申請したい',
      vi: 'Tôi muốn nộp hồ sơ xin visa Vĩnh trú',
      en: 'I want to apply for Permanent Residence (PR)',
    },
    iconName: 'Award',
  },
  {
    intentId: 'intent.child-allowance',
    procedureId: 'procedure.child-allowance-claim',
    category: 'family',
    labelI18n: {
      ja: '子どもが生まれた・転入したため児童手当を申請したい',
      vi: 'Tôi mới sinh con / chuyển đến, muốn xin trợ cấp trẻ em',
      en: 'I want to claim Child Allowance (newborn or moved)',
    },
    iconName: 'Baby',
  },
  {
    intentId: 'intent.moving-in',
    procedureId: 'procedure.moving-in-notification',
    category: 'moving',
    labelI18n: {
      ja: '新しい住所へ引っ越したため転入届・住所変更をしたい',
      vi: 'Tôi vừa chuyển nhà, cần làm thủ tục nhập cư trú (Tennyu)',
      en: 'I moved to a new address and need to register moving-in',
    },
    iconName: 'Home',
  },
  {
    intentId: 'intent.unemployment-benefit',
    procedureId: 'procedure.employment-insurance-benefit-claim',
    category: 'employment',
    labelI18n: {
      ja: '会社を退職したためハローワークで失業給付を申請したい',
      vi: 'Tôi vừa nghỉ việc, muốn nộp hồ sơ hưởng trợ cấp thất nghiệp',
      en: 'I resigned and want to claim unemployment insurance',
    },
    iconName: 'Briefcase',
  },
];

/**
 * Get all available user intents.
 */
export function getAvailableIntents() {
  return USER_INTENT_CATALOG;
}

/**
 * Resolve documents required for an intent or procedure ID.
 * 
 * @param {object} params
 * @param {string} [params.procedureId]
 * @param {string} [params.intentId]
 * @param {object} [params.context={}] - User situational toggles
 * @returns {object|null}
 */
export function findRequiredDocuments({ procedureId, intentId, context = {} }) {
  let targetProcedureId = procedureId;

  if (!targetProcedureId && intentId) {
    const matchedIntent = USER_INTENT_CATALOG.find((i) => i.intentId === intentId);
    if (matchedIntent) {
      targetProcedureId = matchedIntent.procedureId;
    }
  }

  if (!targetProcedureId) return null;

  const result = getRequirementsForProcedure(targetProcedureId);
  if (!result) return null;

  const { procedure, allRequirements, groupedRequirements } = result;

  // Enhance each requirement with display-ready metadata
  const enrich = (req) => {
    const doc = req.document || getDocumentById(req.documentId);
    return {
      ...req,
      documentNameJa: doc?.canonicalNameJa || '公的書類',
      documentNameI18n: doc?.nameI18n || { ja: '公的書類', vi: 'Giấy tờ công quyền', en: 'Official Document' },
      issuerType: doc?.issuerType || 'municipal_current_residence',
      supportedChannels: doc?.supportedChannels || ['municipal_counter'],
      isSensitive: Boolean(doc?.containsSensitiveData),
      statutoryBasis: doc?.statutoryBasis || null,
      officialSourceId: doc?.officialSourceId || null,
    };
  };

  return {
    procedure,
    totalCount: allRequirements.length,
    mandatory: groupedRequirements.mandatory.map(enrich),
    conditional: groupedRequirements.conditional.map(enrich),
    ifApplicable: groupedRequirements.ifApplicable.map(enrich),
    optional: groupedRequirements.optional.map(enrich),
  };
}
