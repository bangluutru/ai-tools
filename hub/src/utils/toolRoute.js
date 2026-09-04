const TOOL_ROUTE = /^#\/tools\/([a-z0-9-]+)/;

// Legacy tool IDs → new merged tool ID + tab hint.
// When a user visits an old bookmark the route resolves to the merged tool and
// the tab hint is stashed in sessionStorage so PdfToolkitTool can open the
// correct tab on mount.
const LEGACY_REDIRECTS = {
  'pdf-split': { toolId: 'pdf-toolkit', tab: 'split' },
  'pdf-merge': { toolId: 'pdf-toolkit', tab: 'merge' },
  'pdf-compress': { toolId: 'pdf-toolkit', tab: 'compress' },
  'invoice-webapp': { toolId: 'invoice-studio' },
};

export function toolHash(toolId) {
  return toolId ? `#/tools/${toolId}` : '';
}

export function resolveToolId(hash, registry) {
  const match = TOOL_ROUTE.exec(hash || '');
  if (!match) return null;

  const rawId = match[1];

  // Handle legacy redirects
  const redirect = LEGACY_REDIRECTS[rawId];
  if (redirect) {
    // Stash the tab hint so the toolkit component can read it on mount
    try { sessionStorage.setItem('pdf_toolkit_legacy_tab', redirect.tab); } catch { /* noop */ }
    const tool = registry.find((candidate) => candidate.id === redirect.toolId);
    return tool && tool.readiness !== 'in-development' ? tool.id : null;
  }

  // Miniapp đang phát triển không được build nên deep-link tới chúng phải rơi về hub.
  const tool = registry.find((candidate) => candidate.id === rawId);
  return tool && tool.readiness !== 'in-development' ? tool.id : null;
}

export function toolUrl(locationLike, toolId) {
  const base = `${locationLike.pathname || '/'}${locationLike.search || ''}`;
  return `${base}${toolHash(toolId)}`;
}
