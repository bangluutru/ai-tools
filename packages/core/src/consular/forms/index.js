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
 * Bảng kiểm định tính toàn vẹn và SHA-256 của các biểu mẫu
 */
export const FORM_INTEGRITY_REGISTRY = {
  [passportTK02Form.id]: {
    sha256: passportTK02Form.sha256Fingerprint,
    status: passportTK02Form.status,
    basis: passportTK02Form.standardBasis,
    sourceUrl: passportTK02Form.sourceUrl,
  },
  [birthRegistrationForm.id]: {
    sha256: birthRegistrationForm.fingerprint || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    status: birthRegistrationForm.status,
    basis: birthRegistrationForm.legal_basis,
    sourceUrl: birthRegistrationForm.official_source_url,
  },
  [nationalityAgreementForm.id]: {
    sha256: nationalityAgreementForm.fingerprint || 'a4b8e23f9901d8c1192ef941bc4811a7f05282a567e9124a91f5820468f7aa11',
    status: nationalityAgreementForm.status,
    basis: nationalityAgreementForm.legal_basis,
    sourceUrl: nationalityAgreementForm.official_source_url,
  },
  [marriageRegistrationForm.id]: {
    sha256: marriageRegistrationForm.sha256Fingerprint,
    status: marriageRegistrationForm.status,
    basis: marriageRegistrationForm.standardBasis,
    sourceUrl: marriageRegistrationForm.sourceUrl,
  },
  [powerOfAttorneyForm.id]: {
    sha256: powerOfAttorneyForm.sha256Fingerprint,
    status: powerOfAttorneyForm.status,
    basis: powerOfAttorneyForm.standardBasis,
    sourceUrl: powerOfAttorneyForm.sourceUrl,
  },
};
