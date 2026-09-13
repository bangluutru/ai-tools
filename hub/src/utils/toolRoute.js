const TOOL_ROUTE = /^#\/tools\/([a-z0-9-]+)/;

// Legacy tool IDs → current merged tool ID + tab hint.
const LEGACY_REDIRECTS = {
  'pdf-split': { toolId: 'pdf-toolkit', tab: 'split' },
  'pdf-merge': { toolId: 'pdf-toolkit', tab: 'merge' },
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
    // Stash the tab hint so the toolkit component can read it on mount.
    if (redirect.tab) {
      try { sessionStorage.setItem('pdf_toolkit_legacy_tab', redirect.tab); } catch { /* noop */ }
    }
    const tool = registry.find((candidate) => candidate.id === redirect.toolId);
    return tool ? tool.id : null;
  }

  const tool = registry.find((candidate) => candidate.id === rawId);
  return tool ? tool.id : null;
}

export function toolUrl(locationLike, toolId) {
  const base = `${locationLike.pathname || '/'}${locationLike.search || ''}`;
  return `${base}${toolHash(toolId)}`;
}
