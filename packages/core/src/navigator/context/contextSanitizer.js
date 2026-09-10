/**
 * @file packages/core/src/navigator/context/contextSanitizer.js
 * @description
 * Sanitizer and privacy guard for Navigator context and mini-app handoffs.
 * Enforces Zero Upfront PII, eliminates sensitive credentials (My Number, PIN, Passports, Bank Accounts, Health data),
 * and generates clean handoff payloads conforming strictly to capability allowlists.
 */

/**
 * Danh sách cấm tuyệt đối các trường nhạy cảm / PII riêng tư
 */
export const PROHIBITED_SENSITIVE_FIELDS = Object.freeze([
  'myNumber',
  'mynumber',
  'myNumberCardPin',
  'pin',
  'passportNumber',
  'passport',
  'residenceCardNumber',
  'zairyuCardNumber',
  'bankAccount',
  'bankAccountNumber',
  'bankBranch',
  'creditCard',
  'creditCardNumber',
  'cvv',
  'exactSalary',
  'monthlySalary',
  'annualSalary',
  'taxPaidAmount',
  'medicalHistory',
  'healthRecord',
  'biometricData',
]);

/**
 * Loại bỏ toàn bộ các trường nhạy cảm khỏi một đối tượng bất kỳ (Deep clean)
 * @param {Record<string, any>} data
 * @returns {Record<string, any>}
 */
export function stripSensitiveData(data) {
  if (!data || typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => stripSensitiveData(item));
  }

  const clean = {};
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    const isProhibited = PROHIBITED_SENSITIVE_FIELDS.some(
      (prohibited) => lowerKey === prohibited.toLowerCase() || lowerKey.includes(prohibited.toLowerCase())
    );

    if (isProhibited) {
      // Loại bỏ trường nhạy cảm
      continue;
    }

    if (value !== null && typeof value === 'object') {
      clean[key] = stripSensitiveData(value);
    } else {
      clean[key] = value;
    }
  }

  return clean;
}

/**
 * Trích xuất payload an toàn để chuyển giao (handoff) sang một capability / mini-app
 * Chỉ trích xuất các trường nằm trong allowlist được capability chấp nhận (acceptedFields)
 * và đảm bảo đã loại bỏ triệt để mọi dữ liệu nhạy cảm.
 *
 * @param {Record<string, any>} context Ngữ cảnh Navigator hiện tại
 * @param {string[]} [acceptedFields=[]] Danh sách các trường được phép tiếp nhận
 * @returns {Record<string, any>}
 */
export function extractHandoffPayload(context, acceptedFields = []) {
  if (!context || typeof context !== 'object') {
    return {};
  }

  const safeContext = stripSensitiveData(context);

  if (!Array.isArray(acceptedFields) || acceptedFields.length === 0) {
    return {};
  }

  const payload = {};
  for (const field of acceptedFields) {
    if (field in safeContext && safeContext[field] !== undefined && safeContext[field] !== null) {
      payload[field] = safeContext[field];
    }
  }

  return payload;
}
