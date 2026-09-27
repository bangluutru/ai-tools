import { BIRTH_REGISTRATION_FORM } from './birthRegistrationForm.js';
import { NATIONALITY_AGREEMENT_FORM } from './nationalityAgreementForm.js';
import { passportTK02Form } from './passportTK02Form.js';
import { marriageRegistrationForm } from './marriageRegistrationForm.js';
import { powerOfAttorneyForm } from './powerOfAttorneyForm.js';

export const birthRegistrationForm = BIRTH_REGISTRATION_FORM;
export const nationalityAgreementForm = NATIONALITY_AGREEMENT_FORM;

export {
  BIRTH_REGISTRATION_FORM,
  NATIONALITY_AGREEMENT_FORM,
  passportTK02Form,
  marriageRegistrationForm,
  powerOfAttorneyForm,
};

export const CONSULAR_FORMS = [
  passportTK02Form,
  birthRegistrationForm,
  nationalityAgreementForm,
  marriageRegistrationForm,
  powerOfAttorneyForm,
];

export const CONSULAR_FORM_MAP = new Map(
  CONSULAR_FORMS.flatMap((form) => [
    [form.id, form],
    [form.code, form],
  ])
);

export const getFormById = (formId) => {
  if (!formId) return null;
  // Support both 'birth_registration' and 'form_birth_registration'
  return (
    CONSULAR_FORM_MAP.get(formId) ||
    CONSULAR_FORM_MAP.get(formId.replace(/^form_/, '')) ||
    CONSULAR_FORM_MAP.get(`form_${formId}`) ||
    null
  );
};

/**
 * Bảng tra cứu nguồn của các BẢN NHÁP hỗ trợ điền.
 * Toolio KHÔNG lưu mã băm (SHA-256) của mẫu gốc nào — không hiển thị "đã xác thực".
 */
const registryEntry = (form, basis, sourceUrl) => ({
  sha256: null,
  status: form.status,
  isDraftHelper: true,
  basis,
  sourceUrl,
});

export const FORM_INTEGRITY_REGISTRY = {
  [passportTK02Form.id]: registryEntry(passportTK02Form, passportTK02Form.standardBasis, passportTK02Form.sourceUrl),
  [birthRegistrationForm.id]: registryEntry(birthRegistrationForm, birthRegistrationForm.legal_basis, birthRegistrationForm.official_source_url),
  [nationalityAgreementForm.id]: registryEntry(nationalityAgreementForm, nationalityAgreementForm.legal_basis, nationalityAgreementForm.official_source_url),
  [marriageRegistrationForm.id]: registryEntry(marriageRegistrationForm, marriageRegistrationForm.standardBasis, marriageRegistrationForm.sourceUrl),
  [powerOfAttorneyForm.id]: registryEntry(powerOfAttorneyForm, powerOfAttorneyForm.standardBasis, powerOfAttorneyForm.sourceUrl),
};
