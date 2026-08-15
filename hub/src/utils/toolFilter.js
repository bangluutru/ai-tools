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
