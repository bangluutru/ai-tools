/**
 * @file packages/core/src/navigator/context/navigatorContext.js
 * @description
 * Minimal NavigatorContext factory, validator, and sanitizer.
 * Follows the Context Minimization principle: only collect dimensions that alter recommendations.
 * No Master User Profile, no sensitive PII.
 */

import { stripSensitiveData } from './contextSanitizer.js';

/**
 * Danh sách allowlist các trường được phép có trong NavigatorContext
 */
export const ALLOWED_NAVIGATOR_FIELDS = Object.freeze([
  'country',
  'lifeSituation',
  'municipality',
  'employmentStatus',
  'residenceStatus',
  'insuranceType',
  'familyContext',
  'eventDates',
]);

/**
 * Các giá trị hợp lệ cho employmentStatus
 */
export const VALID_EMPLOYMENT_STATUSES = Object.freeze([
  'regular_employee', // 正社員
  'contract_employee', // 契約社員
  'dispatch_employee', // 派遣社員
  'part_time', // パート・アルバイト
  'student', // 留学生・学生
  'unemployed', // 無職・離職中
  'self_employed', // 個人事業主・フリーランス
  'dependent', // 被扶養者
]);

/**
 * Tạo một đối tượng NavigatorContext tối giản, hợp lệ
 * @param {Partial<{
 *   country?: string,
 *   lifeSituation?: string | null,
 *   municipality?: string | null,
 *   employmentStatus?: string | null,
 *   residenceStatus?: string | null,
 *   insuranceType?: string | null,
 *   familyContext?: {
 *     hasSpouse?: boolean,
 *     childrenCount?: number,
 *     spouseStatus?: string,
 *   } | null,
 *   eventDates?: {
 *     arrivalDate?: string | null,
 *     resignationDate?: string | null,
 *     newJobStartDate?: string | null,
 *     moveDate?: string | null,
 *     birthDate?: string | null,
 *   } | null,
 * }>} [initialData={}]
 * @returns {Record<string, any>}
 */
export function createNavigatorContext(initialData = {}) {
  const safeData = stripSensitiveData(initialData || {});

  const context = {
    country: safeData.country || 'JP',
    lifeSituation: safeData.lifeSituation || null,
    municipality: safeData.municipality || null,
    employmentStatus: safeData.employmentStatus || null,
    residenceStatus: safeData.residenceStatus || null,
    insuranceType: safeData.insuranceType || null,
    familyContext: safeData.familyContext
      ? {
          hasSpouse: Boolean(safeData.familyContext.hasSpouse),
          childrenCount: Number(safeData.familyContext.childrenCount) || 0,
          spouseStatus: safeData.familyContext.spouseStatus || null,
        }
      : null,
    eventDates: safeData.eventDates
      ? {
          arrivalDate: safeData.eventDates.arrivalDate || null,
          resignationDate: safeData.eventDates.resignationDate || null,
          newJobStartDate: safeData.eventDates.newJobStartDate || null,
          moveDate: safeData.eventDates.moveDate || null,
          birthDate: safeData.eventDates.birthDate || null,
        }
      : null,
  };

  return Object.freeze(context);
}

/**
 * Kiểm tra tính hợp lệ của NavigatorContext
 * @param {any} context
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateNavigatorContext(context) {
  const errors = [];

  if (!context || typeof context !== 'object') {
    return { valid: false, errors: ['NavigatorContext must be a non-null object'] };
  }

  if (context.country && typeof context.country !== 'string') {
    errors.push('country must be a string (e.g. "JP")');
  }

  if (context.employmentStatus && !VALID_EMPLOYMENT_STATUSES.includes(context.employmentStatus)) {
    // Không cấm cứng nếu mở rộng, nhưng ghi nhận cảnh báo
    // errors.push(`Unknown employmentStatus: ${context.employmentStatus}`);
  }

  if (context.familyContext !== null && context.familyContext !== undefined) {
    if (typeof context.familyContext !== 'object') {
      errors.push('familyContext must be an object or null');
    } else if (
      context.familyContext.childrenCount !== undefined &&
      typeof context.familyContext.childrenCount !== 'number'
    ) {
      errors.push('familyContext.childrenCount must be a number');
    }
  }

  if (context.eventDates !== null && context.eventDates !== undefined) {
    if (typeof context.eventDates !== 'object') {
      errors.push('eventDates must be an object or null');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
