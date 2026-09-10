/**
 * @file formHelperEngine.js
 * Engine for Official Government Form Assistance.
 * 
 * CORE RULES:
 * 1. Form explanation and validation.
 * 2. In-memory client-side draft evaluation.
 * 3. Never transmits draft data remotely.
 */

import { getOfficialFormById, getAllOfficialForms } from './officialFormsRegistry.js';

/**
 * Get form assistance package by form ID.
 * @param {string} formId
 * @returns {object|null}
 */
export function getFormAssistance(formId) {
  const form = getOfficialFormById(formId);
  if (!form) return null;

  // Flatten all fields for easy lookup
  const allFields = [];
  form.sections.forEach((s) => {
    s.fields.forEach((f) => {
      allFields.push({
        ...f,
        sectionId: s.sectionId,
        sectionTitleJa: s.titleJa,
      });
    });
  });

  return {
    form,
    allFields,
    totalFieldsCount: allFields.length,
    sensitiveFieldsCount: allFields.filter((f) => f.isSensitive).length,
  };
}

/**
 * Check if a form revision is still considered currently effective.
 * @param {object} form
 * @param {Date} [referenceDate=new Date()]
 * @returns {boolean}
 */
export function isFormVersionEffective(form, referenceDate = new Date()) {
  if (!form || !form.effectivePeriod) return false;
  const from = new Date(form.effectivePeriod.validFrom);
  if (isNaN(from.getTime())) return false;

  const ref = new Date(referenceDate);
  if (ref < from) return false;

  if (form.effectivePeriod.validTo) {
    const to = new Date(form.effectivePeriod.validTo);
    if (!isNaN(to.getTime()) && ref > to) return false;
  }

  return true;
}
