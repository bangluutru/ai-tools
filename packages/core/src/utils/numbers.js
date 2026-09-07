/**
 * @file Shared Number Utilities
 * General-purpose numeric parsing and formatting functions across miniapps.
 * Decoupled from accounting business logic.
 */

/**
 * Parses a localized number string or numeric value into a finite JavaScript number.
 * Supports Vietnamese, European, and US number formatting (commas/dots as thousand/decimal separators),
 * negative numbers in parentheses (accounting format) or with leading minus, and currency symbols (₫, đ, VND).
 *
 * @param {string|number|null|undefined} value
 * @returns {number|null} Parsed number or null if invalid/empty
 */
export function parseLocalizedNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (value === null || value === undefined) return null;

  let text = String(value).trim();
  if (!text) return null;

  const negative = /^\(.*\)$/.test(text) || text.startsWith('-');
  text = text.replace(/[()\s₫đVND]/gi, '').replace(/[^\d,.-]/g, '');
  text = text.replace(/^-/, '');
  if (!text || !/\d/.test(text)) return null;

  const lastComma = text.lastIndexOf(',');
  const lastDot = text.lastIndexOf('.');
  let normalized;

  if (lastComma >= 0 && lastDot >= 0) {
    const decimalSeparator = lastComma > lastDot ? ',' : '.';
    const thousandsSeparator = decimalSeparator === ',' ? '.' : ',';
    normalized = text.split(thousandsSeparator).join('').replace(decimalSeparator, '.');
  } else {
    const separator = lastComma >= 0 ? ',' : lastDot >= 0 ? '.' : null;
    if (!separator) {
      normalized = text;
    } else {
      const groups = text.split(separator);
      const lastGroup = groups.at(-1);
      const looksLikeThousands =
        groups.length > 2 || (groups.length === 2 && lastGroup.length === 3);
      normalized = looksLikeThousands
        ? groups.join('')
        : `${groups.slice(0, -1).join('')}.${lastGroup}`;
    }
  }

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) return null;
  return negative ? -parsed : parsed;
}
