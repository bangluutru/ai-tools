/**
 * @file scripts/lib/ai-tools-graph/parser.mjs
 * Native AST Parser for JavaScript and JSX files using @babel/parser.
 */

import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const babelParser = require('@babel/parser');

/**
 * Parse a JS/JSX/MJS file and extract all imports and exports.
 * @param {string} filePath - Absolute path to file
 * @returns {{ imports: Array<{ source: string, specifiers: string[], isDynamic: boolean, line: number }>, exports: Array<{ name: string, source: string|null, line: number }>, error: string|null }}
 */
export function parseSourceFile(filePath) {
  let content = '';
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    return { imports: [], exports: [], error: `Cannot read file: ${err.message}` };
  }

  try {
    const ast = babelParser.parse(content, {
      sourceType: 'module',
      plugins: ['jsx'],
      errorRecovery: true,
    });

    const imports = [];
    const exports = [];

    // Helper to extract specifier names
    function getSpecifiers(specifiers) {
      if (!specifiers) return [];
      return specifiers.map((s) => {
        if (s.type === 'ImportDefaultSpecifier') return 'default';
        if (s.type === 'ImportNamespaceSpecifier') return '*';
        return s.imported ? s.imported.name : s.local.name;
      });
    }

    // Traverse body nodes
    for (const node of ast.program.body) {
      // 1. Static Imports: import ... from '...'
      if (node.type === 'ImportDeclaration') {
        imports.push({
          source: node.source.value,
          specifiers: getSpecifiers(node.specifiers),
          isDynamic: false,
          line: node.loc ? node.loc.start.line : 1,
        });
      }

      // 2. Re-exports with source: export ... from '...'
      else if (node.type === 'ExportNamedDeclaration' && node.source) {
        imports.push({
          source: node.source.value,
          specifiers: getSpecifiers(node.specifiers),
          isDynamic: false,
          isReExport: true,
          line: node.loc ? node.loc.start.line : 1,
        });
        for (const spec of node.specifiers || []) {
          exports.push({
            name: spec.exported ? spec.exported.name : spec.local.name,
            source: node.source.value,
            line: node.loc ? node.loc.start.line : 1,
          });
        }
      }

      // 3. Re-export all: export * from '...'
      else if (node.type === 'ExportAllDeclaration' && node.source) {
        imports.push({
          source: node.source.value,
          specifiers: ['*'],
          isDynamic: false,
          isReExport: true,
          line: node.loc ? node.loc.start.line : 1,
        });
        exports.push({
          name: '*',
          source: node.source.value,
          line: node.loc ? node.loc.start.line : 1,
        });
      }

      // 4. Named exports: export const a = ..., export function b()...
      else if (node.type === 'ExportNamedDeclaration') {
        if (node.declaration) {
          if (node.declaration.declarations) {
            for (const d of node.declaration.declarations) {
              if (d.id && d.id.name) {
                exports.push({ name: d.id.name, source: null, line: node.loc ? node.loc.start.line : 1 });
              }
            }
          } else if (node.declaration.id) {
            exports.push({ name: node.declaration.id.name, source: null, line: node.loc ? node.loc.start.line : 1 });
          }
        } else if (node.specifiers) {
          for (const spec of node.specifiers) {
            exports.push({
              name: spec.exported ? spec.exported.name : spec.local.name,
              source: null,
              line: node.loc ? node.loc.start.line : 1,
            });
          }
        }
      }

      // 5. Default export: export default ...
      else if (node.type === 'ExportDefaultDeclaration') {
        exports.push({ name: 'default', source: null, line: node.loc ? node.loc.start.line : 1 });
      }
    }

    // 6. Dynamic imports: React.lazy(() => import('...')), import('...')
    // Fast AST scan for Import expression nodes
    findDynamicImports(ast, imports);

    return { imports, exports, error: null };
  } catch (parseErr) {
    return { imports: [], exports: [], error: `AST Parse error: ${parseErr.message}` };
  }
}

/**
 * Scan AST for dynamic imports (import('...'))
 */
function findDynamicImports(node, imports) {
  if (!node || typeof node !== 'object') return;

  if (node.type === 'CallExpression') {
    if (node.callee && node.callee.type === 'Import') {
      const arg = node.arguments && node.arguments[0];
      if (arg && arg.type === 'StringLiteral') {
        imports.push({
          source: arg.value,
          specifiers: ['*'],
          isDynamic: true,
          line: node.loc ? node.loc.start.line : 1,
        });
      }
    }
  }

  for (const key of Object.keys(node)) {
    if (key === 'loc' || key === 'range') continue;
    const child = node[key];
    if (Array.isArray(child)) {
      for (const c of child) {
        findDynamicImports(c, imports);
      }
    } else if (child && typeof child === 'object') {
      findDynamicImports(child, imports);
    }
  }
}
