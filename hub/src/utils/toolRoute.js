const TOOL_ROUTE = /^#\/tools\/([a-z0-9-]+)$/;

export function toolHash(toolId) {
  return toolId ? `#/tools/${toolId}` : '';
}

export function resolveToolId(hash, registry) {
  const match = TOOL_ROUTE.exec(hash || '');
  if (!match) return null;

  // Miniapp đang phát triển không được build nên deep-link tới chúng phải rơi về hub.
  const tool = registry.find((candidate) => candidate.id === match[1]);
  return tool && tool.readiness !== 'in-development' ? tool.id : null;
}

export function toolUrl(locationLike, toolId) {
  const base = `${locationLike.pathname || '/'}${locationLike.search || ''}`;
  return `${base}${toolHash(toolId)}`;
}
