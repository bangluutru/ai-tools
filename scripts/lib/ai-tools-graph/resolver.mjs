/**
 * @file scripts/lib/ai-tools-graph/resolver.mjs
 * Resolves import paths and monorepo workspace aliases to absolute file paths on disk.
 */

import fs from 'node:fs';
import path from 'node:path';

const JS_EXTENSIONS = ['.jsx', '.js', '.mjs', '.json'];

/**
 * Resolve an import source to an absolute path or external package info.
 * @param {string} source - Raw import string (e.g. '@ai-tools/core', './utils/helper', 'react')
 * @param {string} fromFilePath - Absolute path of the file containing the import
 * @param {string} rootDir - Root directory of the monorepo
 * @returns {{ isExternal: boolean, isResolved: boolean, resolvedPath?: string, packageName?: string, error?: string }}
 */
export function resolveImportPath(source, fromFilePath, rootDir) {
  // 1. External packages (e.g. 'react', 'lucide-react', '@dnd-kit/core')
  if (!source.startsWith('.') && !source.startsWith('/') && !source.startsWith('@ai-tools/')) {
    const pkgName = source.startsWith('@') ? source.split('/').slice(0, 2).join('/') : source.split('/')[0];
    return {
      isExternal: true,
      isResolved: true,
      packageName: pkgName,
    };
  }

  const coreDir = path.join(rootDir, 'packages/core');
  let targetPath = null;

  // 2. Workspace Alias: @ai-tools/core
  if (source === '@ai-tools/core') {
    targetPath = path.join(coreDir, 'src/index.js');
  } else if (source.startsWith('@ai-tools/core/')) {
    const subPath = source.replace('@ai-tools/core/', '');
    // Check if subPath starts with components/, utils/, hooks/, services/, theme/
    targetPath = path.join(coreDir, 'src', subPath);
  }

  // 3. Relative Import (./ or ../)
  else if (source.startsWith('.')) {
    targetPath = path.resolve(path.dirname(fromFilePath), source);
  }

  // 4. Absolute within repo
  else if (source.startsWith('/')) {
    targetPath = source;
  }

  if (!targetPath) {
    return {
      isExternal: false,
      isResolved: false,
      error: `Unrecognized import source pattern: "${source}"`,
    };
  }

  // Resolve extension & index files
  const resolved = tryResolveFile(targetPath);
  if (resolved) {
    return {
      isExternal: false,
      isResolved: true,
      resolvedPath: resolved,
    };
  }

  return {
    isExternal: false,
    isResolved: false,
    rawTarget: targetPath,
    error: `File not found on disk: "${source}" (attempted: ${targetPath})`,
  };
}

/**
 * Try resolving a candidate path against extensions and index files
 * @param {string} candidate
 * @returns {string|null}
 */
function tryResolveFile(candidate) {
  // Direct file match
  if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
    return candidate;
  }

  // Try appending extensions
  for (const ext of JS_EXTENSIONS) {
    const withExt = candidate + ext;
    if (fs.existsSync(withExt) && fs.statSync(withExt).isFile()) {
      return withExt;
    }
  }

  // Try directory index files
  if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
    for (const ext of JS_EXTENSIONS) {
      const indexFile = path.join(candidate, `index${ext}`);
      if (fs.existsSync(indexFile) && fs.statSync(indexFile).isFile()) {
        return indexFile;
      }
    }
  }

  return null;
}
