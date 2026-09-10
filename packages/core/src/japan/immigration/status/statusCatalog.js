/**
 * @file packages/core/src/japan/immigration/status/statusCatalog.js
 * @description
 * Danh mục và các hàm tiện ích tra cứu tư cách lưu trú (Residence Status Catalog).
 * Đảm bảo logic tra cứu thống nhất, hỗ trợ 3 ngôn ngữ (JA, VI, EN) và phân nhóm danh mục trực quan.
 */

import { RESIDENCE_STATUS_DEFINITIONS } from './statusDefinitions.js';

/**
 * Tra cứu định nghĩa của một tư cách lưu trú
 * @param {string} statusId
 * @returns {import('./statusDefinitions.js').OfficialStatusDefinition|null}
 */
export function getStatusDefinition(statusId) {
  if (!statusId || typeof statusId !== 'string') return null;
  return RESIDENCE_STATUS_DEFINITIONS[statusId.trim()] || null;
}

/**
 * Kiểm tra xem một statusId có hợp lệ trong danh mục chính thức hay không
 * @param {string} statusId
 * @returns {boolean}
 */
export function isValidStatusId(statusId) {
  return Boolean(getStatusDefinition(statusId));
}

/**
 * Lấy nhãn hiển thị theo ngôn ngữ
 * @param {string} statusId
 * @param {'ja' | 'vi' | 'en'} [lang='ja']
 * @returns {string}
 */
export function getStatusLabel(statusId, lang = 'ja') {
  const def = getStatusDefinition(statusId);
  if (!def) return statusId || '';
  if (lang === 'vi') return `${def.nameVi} (${def.nameJa})`;
  if (lang === 'en') return `${def.nameEn} (${def.nameJa})`;
  return def.nameJa;
}

/**
 * Lấy toàn bộ danh sách tư cách lưu trú
 * @returns {import('./statusDefinitions.js').OfficialStatusDefinition[]}
 */
export function getAllStatuses() {
  return Object.values(RESIDENCE_STATUS_DEFINITIONS);
}

/**
 * Lấy danh sách tư cách theo nhóm
 * @param {import('./statusDefinitions.js').StatusCategoryType} category
 * @returns {import('./statusDefinitions.js').OfficialStatusDefinition[]}
 */
export function getStatusesByCategory(category) {
  return getAllStatuses().filter((s) => s.category === category);
}

/**
 * Lấy danh sách tùy chọn gom nhóm dành cho UI Select / Radio
 * @param {'ja' | 'vi' | 'en'} [lang='ja']
 * @returns {{ category: string, categoryLabel: string, items: { value: string, label: string }[] }[]}
 */
export function getStatusOptionsGrouped(lang = 'ja') {
  const groups = [
    {
      category: 'table-1-work',
      categoryLabel: lang === 'vi' ? '1. Nhóm Lao động Chuyên môn / Kỹ thuật (Biểu 1)' : lang === 'en' ? '1. Professional & Working Statuses (Table 1)' : '1. 就労系在留資格（別表第一）',
    },
    {
      category: 'table-1-non-work',
      categoryLabel: lang === 'vi' ? '2. Nhóm Du học / Gia đình / Không đi làm (Biểu 1)' : lang === 'en' ? '2. Non-Working Statuses: Student, Dependent (Table 1)' : '2. 非就労系在留資格（留学・家族滞在等）',
    },
    {
      category: 'table-1-designated',
      categoryLabel: lang === 'vi' ? '3. Hoạt động Chỉ định (Biểu 1)' : lang === 'en' ? '3. Designated Activities (Table 1)' : '3. 特定活動（別表第一の五）',
    },
    {
      category: 'table-2-status',
      categoryLabel: lang === 'vi' ? '4. Nhóm Thân phận: Vĩnh trú, Kết hôn... (Không giới hạn làm việc)' : lang === 'en' ? '4. Status-based: Permanent Resident, Spouse... (Unrestricted)' : '4. 身分系在留資格（永住者・配偶者等・就労制限なし）',
    },
  ];

  return groups.map((g) => ({
    category: g.category,
    categoryLabel: g.categoryLabel,
    items: getStatusesByCategory(/** @type {*} */ (g.category)).map((s) => ({
      value: s.id,
      label: getStatusLabel(s.id, lang),
      def: s,
    })),
  }));
}
