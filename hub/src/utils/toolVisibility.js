export const TOOL_VISIBILITY_STORAGE_KEY = 'hub_hidden_tools_v1';

export function defaultHiddenToolIds(registry) {
  return registry.filter((tool) => tool.defaultVisible === false).map((tool) => tool.id);
}

export function normalizeHiddenToolIds(value, registry) {
  const knownIds = new Set(registry.map((tool) => tool.id));
  if (!Array.isArray(value)) return defaultHiddenToolIds(registry);

  return [...new Set(value)].filter((toolId) => knownIds.has(toolId));
}

export function loadHiddenToolIds(storage, registry) {
  try {
    const storedValue = storage?.getItem(TOOL_VISIBILITY_STORAGE_KEY);
    if (!storedValue) return defaultHiddenToolIds(registry);
    return normalizeHiddenToolIds(JSON.parse(storedValue), registry);
  } catch {
    return defaultHiddenToolIds(registry);
  }
}

export function saveHiddenToolIds(storage, hiddenToolIds) {
  storage?.setItem(TOOL_VISIBILITY_STORAGE_KEY, JSON.stringify(hiddenToolIds));
}
