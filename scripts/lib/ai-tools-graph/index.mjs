/**
 * @file scripts/lib/ai-tools-graph/index.mjs
 * Main facade and engine for ai-tools Native Code Intelligence Graph.
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { parseSourceFile } from './parser.mjs';
import { resolveImportPath } from './resolver.mjs';
import {
  classifyFile,
  checkDomainBoundaryViolation,
  findCircularDependencies,
  calculateRiskTier,
  VERIFIED_MINIAPPS,
} from './rules.mjs';
import { generateMermaidDiagram } from './visualizer.mjs';

const SCAN_DIRS = ['hub/src', 'packages/core/src'];
const IGNORE_PATTERNS = ['node_modules', '.git', 'dist', 'build', 'coverage'];

/**
 * Scan a directory recursively for JS/JSX/MJS files.
 * @param {string} dir
 * @param {string[]} results
 */
function scanFiles(dir, results = []) {
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (IGNORE_PATTERNS.includes(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanFiles(fullPath, results);
    } else if (
      entry.isFile() &&
      (entry.name.endsWith('.jsx') || entry.name.endsWith('.js') || entry.name.endsWith('.mjs')) &&
      !entry.name.endsWith('.test.js') &&
      !entry.name.endsWith('.test.jsx')
    ) {
      results.push(fullPath);
    }
  }
  return results;
}

/**
 * Build the complete Monorepo Dependency Knowledge Graph.
 * @param {string} rootDir - Monorepo root directory
 * @param {object} options - Configuration options
 * @returns {object} Graph instance with query and audit methods
 */
export function buildGraph(rootDir, _options = {}) {
  const nodes = new Map(); // filePath -> metadata
  const edges = []; // { from, to, isDynamic, line }
  const forwardMap = new Map(); // from -> Set<to>
  const reverseMap = new Map(); // to -> Set<from>
  const externalDeps = new Map(); // filePath -> Set<packageName>
  const unresolvedImports = []; // { from, source, line, error }

  // 1. Discover all source files
  const allFiles = [];
  for (const sub of SCAN_DIRS) {
    scanFiles(path.join(rootDir, sub), allFiles);
  }

  // 2. Initialize Nodes
  for (const file of allFiles) {
    const classification = classifyFile(file, rootDir);
    nodes.set(file, {
      path: file,
      relPath: path.relative(rootDir, file).replace(/\\/g, '/'),
      ...classification,
    });
    forwardMap.set(file, new Set());
    reverseMap.set(file, new Set());
    externalDeps.set(file, new Set());
  }

  // 3. Parse and Resolve Dependencies
  for (const file of allFiles) {
    const { imports, error } = parseSourceFile(file);
    if (error) {
      // Record parse warning
      continue;
    }

    for (const imp of imports) {
      const resolution = resolveImportPath(imp.source, file, rootDir);

      if (resolution.isExternal) {
        externalDeps.get(file).add(resolution.packageName);
      } else if (resolution.isResolved && resolution.resolvedPath) {
        const target = resolution.resolvedPath;
        // If target file was not in our scan (e.g. outside scan dirs), add it to nodes
        if (!nodes.has(target)) {
          const classification = classifyFile(target, rootDir);
          nodes.set(target, {
            path: target,
            relPath: path.relative(rootDir, target).replace(/\\/g, '/'),
            ...classification,
          });
          forwardMap.set(target, new Set());
          reverseMap.set(target, new Set());
          externalDeps.set(target, new Set());
        }

        edges.push({
          from: file,
          to: target,
          isDynamic: imp.isDynamic || false,
          isReExport: imp.isReExport || false,
          line: imp.line,
        });

        forwardMap.get(file).add(target);
        reverseMap.get(target).add(file);
      } else {
        unresolvedImports.push({
          from: file,
          relFrom: path.relative(rootDir, file).replace(/\\/g, '/'),
          source: imp.source,
          line: imp.line,
          error: resolution.error || 'Cannot resolve path',
        });
      }
    }
  }

  // Helper: Get forward dependencies up to maxDepth
  function getDependencies(filePath, maxDepth = 10) {
    const result = new Set();
    const queue = [{ file: filePath, depth: 0 }];
    const seen = new Set([filePath]);

    while (queue.length > 0) {
      const { file, depth } = queue.shift();
      if (depth >= maxDepth) continue;

      const neighbors = forwardMap.get(file) || new Set();
      for (const n of neighbors) {
        if (!seen.has(n)) {
          seen.add(n);
          result.add(n);
          queue.push({ file: n, depth: depth + 1 });
        }
      }
    }
    return result;
  }

  // Helper: Get reverse consumers (who depends on this file) up to maxDepth
  function getConsumers(filePath, maxDepth = 10) {
    const direct = [];
    const transitive = [];
    const queue = [{ file: filePath, depth: 0 }];
    const seen = new Set([filePath]);

    while (queue.length > 0) {
      const { file, depth } = queue.shift();
      const callers = reverseMap.get(file) || new Set();

      for (const c of callers) {
        if (!seen.has(c)) {
          seen.add(c);
          if (depth === 0) {
            direct.push(c);
          } else {
            transitive.push(c);
          }
          if (depth + 1 < maxDepth) {
            queue.push({ file: c, depth: depth + 1 });
          }
        }
      }
    }

    return { direct, transitive };
  }

  // Helper: Calculate Blast Radius for a given file
  function getBlastRadius(targetFilePath) {
    const normalizedTarget = path.isAbsolute(targetFilePath)
      ? targetFilePath
      : path.resolve(rootDir, targetFilePath);

    const targetNode = nodes.get(normalizedTarget) || {
      path: normalizedTarget,
      relPath: path.relative(rootDir, normalizedTarget).replace(/\\/g, '/'),
      ...classifyFile(normalizedTarget, rootDir),
    };

    const { direct, transitive } = getConsumers(normalizedTarget);
    const allConsumers = [...direct, ...transitive];

    // Collect affected tools and verified tools
    const affectedToolsSet = new Set();
    const affectedVerifiedToolsSet = new Set();
    let isShellAffected = false;

    for (const consumerFile of allConsumers) {
      const cNode = nodes.get(consumerFile);
      if (!cNode) continue;

      if (cNode.zone === 'HUB_SHELL') {
        isShellAffected = true;
      }
      if (cNode.toolId) {
        affectedToolsSet.add(cNode.toolId);
        if (cNode.isVerified || VERIFIED_MINIAPPS.has(cNode.toolId)) {
          affectedVerifiedToolsSet.add(cNode.toolId);
        }
      }
    }

    const blastSummary = {
      target: targetNode,
      directCount: direct.length,
      directConsumers: direct.map((f) => ({
        file: f,
        relPath: path.relative(rootDir, f).replace(/\\/g, '/'),
        meta: nodes.get(f),
      })),
      transitiveCount: transitive.length,
      transitiveConsumers: transitive.map((f) => ({
        file: f,
        relPath: path.relative(rootDir, f).replace(/\\/g, '/'),
        meta: nodes.get(f),
      })),
      totalConsumersCount: allConsumers.length,
      affectedTools: Array.from(affectedToolsSet),
      affectedVerifiedTools: Array.from(affectedVerifiedToolsSet),
      isShellAffected,
    };

    const risk = calculateRiskTier(blastSummary);

    return {
      ...blastSummary,
      risk,
    };
  }

  // Helper: Architectural Audit (Check boundaries, cycles, broken imports)
  function audit() {
    const boundaryViolations = [];
    const missingImports = [...unresolvedImports];

    // Check domain boundary violations for all edges
    for (const edge of edges) {
      const check = checkDomainBoundaryViolation(edge.from, edge.to, rootDir);
      if (check.isViolation) {
        boundaryViolations.push({
          from: edge.from,
          to: edge.to,
          relFrom: path.relative(rootDir, edge.from).replace(/\\/g, '/'),
          relTo: path.relative(rootDir, edge.to).replace(/\\/g, '/'),
          message: check.message,
          line: edge.line,
        });
      }
    }

    // Check cycles
    const cycles = findCircularDependencies(forwardMap).map((cycle) =>
      cycle.map((f) => path.relative(rootDir, f).replace(/\\/g, '/'))
    );

    return {
      passed: boundaryViolations.length === 0 && cycles.length === 0 && missingImports.length === 0,
      boundaryViolations,
      cycles,
      missingImports,
      stats: {
        totalFiles: nodes.size,
        totalEdges: edges.length,
        totalVerifiedTools: VERIFIED_MINIAPPS.size,
      },
    };
  }

  // Helper: Detect Git Diff and compute total blast radius
  function detectGitDiff() {
    try {
      const gitStatus = execSync('git status --porcelain', { cwd: rootDir, encoding: 'utf8' });
      const changedFiles = [];

      for (const line of gitStatus.split('\n')) {
        if (!line || line.length < 4) continue;
        const filePathPart = line.substring(3).trim();
        // Handle renamed files "old -> new"
        const finalPath = filePathPart.includes('->')
          ? filePathPart.split('->')[1].trim()
          : filePathPart;

        const abs = path.resolve(rootDir, finalPath);
        if (
          fs.existsSync(abs) &&
          (abs.endsWith('.js') || abs.endsWith('.jsx') || abs.endsWith('.mjs')) &&
          !abs.includes('node_modules')
        ) {
          changedFiles.push(abs);
        }
      }

      const results = [];
      const aggregatedAffectedTools = new Set();
      const aggregatedVerifiedTools = new Set();
      let highestRiskTier = 'R0';

      const tierPriority = { R0: 0, R1: 1, R2: 2, R3: 3 };

      for (const file of changedFiles) {
        const blast = getBlastRadius(file);
        results.push(blast);
        for (const t of blast.affectedTools) aggregatedAffectedTools.add(t);
        for (const vt of blast.affectedVerifiedTools) aggregatedVerifiedTools.add(vt);
        if (tierPriority[blast.risk.tier] > tierPriority[highestRiskTier]) {
          highestRiskTier = blast.risk.tier;
        }
      }

      return {
        hasChanges: changedFiles.length > 0,
        changedFilesCount: changedFiles.length,
        results,
        overallSummary: {
          affectedTools: Array.from(aggregatedAffectedTools),
          affectedVerifiedTools: Array.from(aggregatedVerifiedTools),
          highestRiskTier,
        },
      };
    } catch (err) {
      return {
        hasChanges: false,
        error: `Git command error: ${err.message}`,
      };
    }
  }

  // Mermaid visualizer
  function toMermaid(options = {}) {
    return generateMermaidDiagram(
      {
        nodes,
        edges,
        rootDir,
        getDependencies,
        getConsumers: (f) => {
          const c = getConsumers(f);
          return [...c.direct, ...c.transitive];
        },
      },
      options
    );
  }

  return {
    rootDir,
    nodes,
    edges,
    forwardMap,
    reverseMap,
    externalDeps,
    unresolvedImports,
    getDependencies,
    getConsumers,
    getBlastRadius,
    audit,
    detectGitDiff,
    toMermaid,
  };
}
