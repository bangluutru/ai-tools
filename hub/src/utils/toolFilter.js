export const ALL_CATEGORY = 'all';

/**
 * Lọc các công cụ người dùng đã ẩn trong cài đặt cục bộ.
 */
export function partitionTools(tools, hiddenToolIds = []) {
  const hidden = new Set(hiddenToolIds);

  return { active: tools.filter((tool) => !hidden.has(tool.id)) };
}

export function toolsForCategory(tools, category, hiddenToolIds = []) {
  const { active } = partitionTools(tools, hiddenToolIds);
  if (category === ALL_CATEGORY) return active;
  return active.filter((tool) => tool.category === category);
}

/**
 * Nhóm nào còn miniapp thì mới hiện tab.
 */
export function visibleCategoryIds(tools, hiddenToolIds = []) {
  const { active } = partitionTools(tools, hiddenToolIds);
  const ids = new Set(active.map((tool) => tool.category));

  ids.add(ALL_CATEGORY);
  return ids;
}
