/**
 * @file scripts/lib/ai-tools-graph/visualizer.mjs
 * Mermaid Dependency Diagram Generator for ai-tools monorepo.
 */

import path from 'node:path';

/**
 * Generate a Mermaid diagram string from the graph data.
 * @param {object} graphData - Output of buildGraph()
 * @param {object} options - { toolId?: string, maxDepth?: number, focusFile?: string }
 * @returns {string} Mermaid markdown snippet
 */
export function generateMermaidDiagram(graphData, options = {}) {
  const { nodes, edges, rootDir } = graphData;
  const { toolId, focusFile } = options;

  // Filter nodes if toolId or focusFile is specified
  let relevantFiles = new Set();

  if (focusFile) {
    relevantFiles.add(focusFile);
    // Add forward dependencies
    const forward = graphData.getDependencies(focusFile, 2);
    for (const f of forward) relevantFiles.add(f);
    // Add reverse consumers (blast radius)
    const reverse = graphData.getConsumers(focusFile, 2);
    for (const f of reverse) relevantFiles.add(f);
  } else if (toolId) {
    for (const [file, meta] of nodes.entries()) {
      if (meta.toolId === toolId) {
        relevantFiles.add(file);
        // Add dependencies of this tool
        const deps = graphData.getDependencies(file, 2);
        for (const d of deps) relevantFiles.add(d);
      }
    }
  } else {
    // Show overall monorepo structure (capped to avoid massive rendering)
    for (const [file] of nodes.entries()) {
      relevantFiles.add(file);
    }
  }

  // Node ID helper (safe alphanumeric string)
  const idMap = new Map();
  let counter = 0;
  function getNodeId(filePath) {
    if (!idMap.has(filePath)) {
      idMap.set(filePath, `node_${counter++}`);
    }
    return idMap.get(filePath);
  }

  const lines = ['flowchart TD'];

  // Categorize relevant files into subgraphs
  const groups = {
    shell: [],
    tools: [],
    coreViews: [],
    coreUtils: [],
    coreShared: [],
  };

  for (const file of relevantFiles) {
    const meta = nodes.get(file);
    if (!meta) continue;
    const rel = path.relative(rootDir, file).replace(/\\/g, '/');

    if (meta.zone === 'HUB_SHELL') groups.shell.push({ file, rel, meta });
    else if (meta.zone === 'HUB_TOOL' || meta.zone === 'HUB_TOOL_IN_DEV') groups.tools.push({ file, rel, meta });
    else if (meta.zone === 'CORE_VIEW') groups.coreViews.push({ file, rel, meta });
    else if (meta.zone === 'CORE_DOMAIN_UTIL' || meta.zone === 'CORE_SHARED_UTIL') groups.coreUtils.push({ file, rel, meta });
    else groups.coreShared.push({ file, rel, meta });
  }

  // Render Subgraphs
  function renderGroup(title, list) {
    if (list.length === 0) return;
    lines.push(`    subgraph "${title}"`);
    for (const item of list) {
      const nid = getNodeId(item.file);
      const label = path.basename(item.file);
      const badge = item.meta.isVerified ? ' (Verified)' : (item.meta.toolId ? ` [${item.meta.toolId}]` : '');
      lines.push(`        ${nid}["${label}${badge}"]`);
    }
    lines.push('    end');
  }

  renderGroup('🖥️ Hub Shell', groups.shell);
  renderGroup('🛠️ Miniapps (Hub)', groups.tools);
  renderGroup('👁️ Core Miniapp Views', groups.coreViews);
  renderGroup('⚙️ Core Utilities', groups.coreUtils);
  renderGroup('📦 Core Shared Infra', groups.coreShared);

  // Render Edges
  lines.push('');
  for (const edge of edges) {
    if (relevantFiles.has(edge.from) && relevantFiles.has(edge.to)) {
      const fromId = getNodeId(edge.from);
      const toId = getNodeId(edge.to);
      const edgeStyle = edge.isDynamic ? '-.->|lazy|' : '-->';
      lines.push(`    ${fromId} ${edgeStyle} ${toId}`);
    }
  }

  return '```mermaid\n' + lines.join('\n') + '\n```';
}
