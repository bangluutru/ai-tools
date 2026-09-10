// Đuôi .js là bắt buộc: file này được import cả từ Node test lẫn từ Vite.
import { isInDevelopment } from '../config/toolsRegistry.js';

export const IN_DEVELOPMENT_CATEGORY = 'in-development';
export const ALL_CATEGORY = 'all';

/**
 * Tách registry thành hai nhóm rời nhau.
 *
 * Miniapp đang phát triển không thuộc nhóm nào khác — kể cả "Tất cả công cụ" —
 * để trang chủ chỉ liệt kê thứ mở được. Chúng vẫn hiện trong nhóm "Đang phát
 * triển" như một lời nhắc rằng các công cụ này đang chờ làm tiếp.
 */
export function partitionTools(tools, hiddenToolIds = []) {
  const hidden = new Set(hiddenToolIds);

  return {
    active: tools.filter((tool) => !isInDevelopment(tool) && !hidden.has(tool.id)),
    inDevelopment: tools.filter(isInDevelopment),
  };
}

export function toolsForCategory(tools, category, hiddenToolIds = []) {
  const { active, inDevelopment } = partitionTools(tools, hiddenToolIds);

  if (category === IN_DEVELOPMENT_CATEGORY) return inDevelopment;
  if (category === ALL_CATEGORY) return active;
  return active.filter((tool) => tool.category === category);
}

/**
 * Nhóm nào còn miniapp thì mới hiện tab. "Đang phát triển" chỉ hiện khi thực sự
 * có công cụ đang tạm dừng.
 */
export function visibleCategoryIds(tools, hiddenToolIds = []) {
  const { active, inDevelopment } = partitionTools(tools, hiddenToolIds);
  const ids = new Set(active.map((tool) => tool.category));

  ids.add(ALL_CATEGORY);
  if (inDevelopment.length > 0) ids.add(IN_DEVELOPMENT_CATEGORY);
  return ids;
}

export const ALL_GROUPS = 'all';

/**
 * Lọc công cụ theo product / domain group (mặc định an toàn là 'common' nếu không khai báo).
 */
export function toolsForGroup(tools, group = ALL_GROUPS, hiddenToolIds = []) {
  const { active } = partitionTools(tools, hiddenToolIds);
  if (group === ALL_GROUPS) return active;
  return active.filter((tool) => (tool.group || 'common') === group);
}

/**
 * Chỉ các nhóm thực sự có công cụ hoạt động mới sinh ra ID hiển thị.
 * Giúp các nhóm chưa có công cụ (như 'vietnam-life') không gây ô nhiễm UI.
 */
export function visibleGroupIds(tools, hiddenToolIds = []) {
  const { active } = partitionTools(tools, hiddenToolIds);
  const ids = new Set(active.map((tool) => tool.group || 'common'));
  ids.add(ALL_GROUPS);
  return ids;
}

/**
 * Lọc đồng thời theo danh mục và nhóm sản phẩm.
 */
export function filterTools(tools, { category = ALL_CATEGORY, group = ALL_GROUPS, hiddenToolIds = [] } = {}) {
  const byCategory = toolsForCategory(tools, category, hiddenToolIds);
  if (category === IN_DEVELOPMENT_CATEGORY || group === ALL_GROUPS) return byCategory;
  return byCategory.filter((tool) => (tool.group || 'common') === group);
}

