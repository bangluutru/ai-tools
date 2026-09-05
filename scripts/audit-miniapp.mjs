#!/usr/bin/env node
/**
 * @file scripts/audit-miniapp.mjs
 * ============================================================================
 * Automated Static Audit CLI for Miniapps (Gates 1, 2, and 3)
 * Evaluates miniapps against the Miniapp Architecture & Integration Standards (MAIS).
 *
 * Usage:
 *   node scripts/audit-miniapp.mjs --all
 *   node scripts/audit-miniapp.mjs id-photo-studio
 * ============================================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const hubDir = path.join(rootDir, 'hub');
const coreDir = path.join(rootDir, 'packages/core');

// ANSI Color Helpers
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

const warn = (msg) => `${colors.yellow}⚠ WARN${colors.reset} ${msg}`;
const fail = (msg) => `${colors.red}✖ FAIL${colors.reset} ${msg}`;

// Load Tools Registry
async function loadRegistry() {
  const registryPath = path.join(hubDir, 'src/config/toolsRegistry.js');
  const registryModule = await import(`file://${registryPath}`);
  return {
    tools: registryModule.tools || [],
    activeTools: registryModule.activeTools || [],
    inDevelopmentTools: registryModule.inDevelopmentTools || [],
    categories: registryModule.categories || [],
  };
}

// Find all source files related to a miniapp
function getToolSourceFiles(toolId) {
  const files = [];

  // 1. Check hub/src/tools/<id>
  const activeToolDir = path.join(hubDir, 'src/tools', toolId);
  const pausedToolDir = path.join(hubDir, 'src/tools-in-development', toolId);
  const toolDir = fs.existsSync(activeToolDir) ? activeToolDir : (fs.existsSync(pausedToolDir) ? pausedToolDir : null);

  if (toolDir && fs.existsSync(toolDir)) {
    const list = fs.readdirSync(toolDir);
    for (const f of list) {
      if (f.endsWith('.jsx') || f.endsWith('.js')) {
        files.push(path.join(toolDir, f));
      }
    }
  }

  // 2. Check if wrapper delegates to @ai-tools/core/components/
  for (const filePath of [...files]) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const coreImports = content.matchAll(/from\s+['"]@ai-tools\/core\/components\/([^'"]+)['"]/g);
      for (const m of coreImports) {
        let subPath = m[1];
        if (!subPath.endsWith('.jsx') && !subPath.endsWith('.js')) {
          if (fs.existsSync(path.join(coreDir, 'src/components', `${subPath}.jsx`))) {
            subPath = `${subPath}.jsx`;
          } else if (fs.existsSync(path.join(coreDir, 'src/components', `${subPath}.js`))) {
            subPath = `${subPath}.js`;
          }
        }
        const resolved = path.join(coreDir, 'src/components', subPath);
        if (fs.existsSync(resolved) && !files.includes(resolved)) {
          files.push(resolved);
        }
      }
    } catch {}
  }

  return { toolDir, files };
}

// Gate 1: Contract & Architecture Audit
function auditGate1(tool, registryInfo) {
  const issues = [];
  const warnings = [];

  // Required Registry Fields
  const requiredFields = [
    'id', 'name_vn', 'name_en', 'name_ja',
    'desc_vn', 'desc_en', 'desc_ja',
    'category', 'icon', 'readiness', 'processing', 'outputPurpose'
  ];

  for (const field of requiredFields) {
    if (!tool[field]) {
      issues.push(`Thiếu trường bắt buộc trong registry: "${field}"`);
    }
  }

  // Valid Category
  const validCategoryIds = registryInfo.categories.map((c) => c.id);
  if (tool.category && !validCategoryIds.includes(tool.category)) {
    issues.push(`Danh mục không hợp lệ: "${tool.category}". Cho phép: ${validCategoryIds.join(', ')}`);
  }

  // Folder and Component Existence
  const { toolDir, files } = getToolSourceFiles(tool.id);
  if (!toolDir) {
    issues.push(`Không tìm thấy thư mục của miniapp tại hub/src/tools/${tool.id} hoặc hub/src/tools-in-development/${tool.id}`);
  } else if (files.length === 0) {
    issues.push(`Thư mục miniapp rỗng hoặc không chứa file .jsx/.js`);
  }

  // App.jsx Wiring (for active tools)
  if (tool.readiness !== 'in-development') {
    const appPath = path.join(hubDir, 'src/App.jsx');
    const appContent = fs.readFileSync(appPath, 'utf8');

    const lazyMatch = new RegExp(`lazy\\(\\s*\\(\\)\\s*=>\\s*import\\(['"]\\./tools/${tool.id}/[^'"]+['"]\\)\\)`);
    if (!lazyMatch.test(appContent)) {
      issues.push(`Chưa khai báo React.lazy import trong hub/src/App.jsx`);
    }

    const mapMatch = new RegExp(`['"]${tool.id}['"]\\s*:`);
    if (!mapMatch.test(appContent)) {
      issues.push(`Chưa đăng ký vào toolComponentMap trong hub/src/App.jsx`);
    }
  } else {
    // In-development tools must have unavailableReason
    if (!tool.unavailableReason) {
      issues.push(`Miniapp ở trạng thái in-development bắt buộc phải khai báo 'unavailableReason'`);
    }
  }

  return {
    name: 'Gate 1: Contract & Architecture',
    passed: issues.length === 0,
    issues,
    warnings,
  };
}

// Gate 2: Static Token & UI Linter
function auditGate2(tool, files) {
  const issues = [];
  const warnings = [];

  // Forbidden static light-mode class patterns (violates dark mode normalization)
  // We check for hardcoded background or text colors that break theme switching
  const forbiddenPatterns = [
    { regex: /\bbg-white\b/g, label: 'Lạm dụng class "bg-white" (phải dùng "bg-surface-container" hoặc CSS token)' },
    { regex: /\btext-black\b/g, label: 'Lạm dụng class "text-black" (phải dùng "text-on-surface")' },
    { regex: /\btext-slate-900\b/g, label: 'Lạm dụng class "text-slate-900" (phải dùng "text-on-surface")' },
  ];

  // Raw emoji in button or action elements
  const emojiInActionPattern = /<button[^>]*>([^<]*[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}][^<]*)<\/button>/gu;

  let hasLayoutOrContainer = false;
  let handlesDisplayLang = false;

  for (const filePath of files) {
    const relPath = path.relative(rootDir, filePath);
    const content = fs.readFileSync(filePath, 'utf8');

    // Check forbidden classes (excluding comments)
    const codeOnly = content.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');

    for (const { regex, label } of forbiddenPatterns) {
      const matches = codeOnly.match(regex);
      if (matches && matches.length > 5) {
        // More than 5 occurrences is a critical fail
        issues.push(`${relPath}: Phát hiện ${matches.length} lần ${label}`);
      } else if (matches && matches.length > 0) {
        warnings.push(`${relPath}: ${matches.length} lần ${label}`);
      }
    }

    // Emoji check
    const emojiMatches = [...codeOnly.matchAll(emojiInActionPattern)];
    if (emojiMatches.length > 0) {
      warnings.push(`${relPath}: Phát hiện raw emoji làm icon nút bấm (khuyến nghị đổi sang lucide-react)`);
    }

    // Layout check
    if (
      content.includes('StandardToolLayout') ||
      content.includes('MiniAppLayout') ||
      content.includes('max-w-[1240px]') ||
      content.includes('ToolContainer')
    ) {
      hasLayoutOrContainer = true;
    }

    // displayLang check
    if (content.includes('displayLang')) {
      handlesDisplayLang = true;
    }

    // Responsive Grid Check: detect hardcoded non-responsive multi-column grids
    const rigidGridMatch = codeOnly.match(/(?<!sm:|md:|lg:|xl:)\bgrid-cols-[2-6]\b/g);
    if (rigidGridMatch && rigidGridMatch.length > 0) {
      warnings.push(`${relPath}: Phát hiện ${rigidGridMatch.length} grid không có breakpoint mobile (ví dụ grid-cols-2 cứng thay vì grid-cols-1 sm:grid-cols-2)`);
    }

    // Dual Input Dropzone Check (for file-handling tools)
    if (['pdf', 'image', 'office'].includes(tool.category)) {
      if (content.includes('Drop') || content.includes('FileUploader') || content.includes('onDrop')) {
        if (!content.includes('type="file"') && !content.includes("type='file'") && !content.includes('FileUploader')) {
          warnings.push(`${relPath}: Vùng DropZone thiếu thẻ <input type="file" className="hidden"> tương ứng`);
        }
      }
    }
  }

  if (!hasLayoutOrContainer) {
    warnings.push(`Chưa tìm thấy layout chuẩn (StandardToolLayout / MiniAppLayout / max-w-[1240px])`);
  }

  if (!handlesDisplayLang) {
    warnings.push(`Component chưa nhận hoặc sử dụng prop displayLang (i18n)`);
  }

  return {
    name: 'Gate 2: Static Token & UI Linter',
    passed: issues.length === 0,
    issues,
    warnings,
  };
}

// Gate 3: Stability & Memory Leak Audit
function auditGate3(tool, files) {
  const issues = [];
  const warnings = [];

  let createObjectURLCount = 0;
  let revokeObjectURLCount = 0;
  let rawLocalStorageKeys = [];

  for (const filePath of files) {
    const relPath = path.relative(rootDir, filePath);
    const content = fs.readFileSync(filePath, 'utf8');
    const codeOnly = content.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');

    // 1. Check createObjectURL vs revokeObjectURL
    const createMatches = codeOnly.match(/URL\.createObjectURL\s*\(/g);
    const revokeMatches = codeOnly.match(/URL\.revokeObjectURL\s*\(/g);

    if (createMatches) createObjectURLCount += createMatches.length;
    if (revokeMatches) revokeObjectURLCount += revokeMatches.length;

    // 2. Check localStorage usage
    const storageMatches = codeOnly.matchAll(/localStorage\.setItem\s*\(\s*['"`]([^'"`]+)['"`]/g);
    for (const match of storageMatches) {
      const key = match[1];
      if (!key.startsWith(`ai_tools_${tool.id}`) && !key.startsWith('hub_') && !key.startsWith('ai_tools_')) {
        rawLocalStorageKeys.push({ key, relPath });
      }
    }
  }

  // Evaluate createObjectURL vs revokeObjectURL
  if (createObjectURLCount > 0 && revokeObjectURLCount === 0) {
    issues.push(`Phát hiện ${createObjectURLCount} lần gọi URL.createObjectURL nhưng KHÔNG CÓ URL.revokeObjectURL (nguy cơ tràn RAM)`);
  } else if (createObjectURLCount > revokeObjectURLCount) {
    warnings.push(`Số lần gọi URL.createObjectURL (${createObjectURLCount}) nhiều hơn URL.revokeObjectURL (${revokeObjectURLCount}). Hãy kiểm tra cleanup.`);
  }

  // Evaluate localStorage keys
  if (rawLocalStorageKeys.length > 0) {
    for (const item of rawLocalStorageKeys) {
      warnings.push(`${item.relPath}: Key "${item.key}" trong localStorage không có namespace "ai_tools_${tool.id}_*"`);
    }
  }

  return {
    name: 'Gate 3: Stability & Memory Audit',
    passed: issues.length === 0,
    issues,
    warnings,
  };
}

// Main Runner
async function main() {
  const args = process.argv.slice(2);
  const isAll = args.includes('--all') || args.length === 0;
  const targetId = !isAll ? args[0] : null;

  console.log(`\n${colors.bold}${colors.cyan}=== 🛡️ MINIAPP ARCHITECTURE & INTEGRATION AUDIT (MAIS) ===${colors.reset}`);
  console.log(`${colors.gray}Tiêu chuẩn kiểm duyệt 3 cổng tĩnh (Gate 1, Gate 2, Gate 3)${colors.reset}\n`);

  const registry = await loadRegistry();
  const toolsToAudit = isAll
    ? registry.tools
    : registry.tools.filter((t) => t.id === targetId);

  if (toolsToAudit.length === 0) {
    console.error(`${colors.red}Không tìm thấy miniapp với id: "${targetId}" trong toolsRegistry.js${colors.reset}`);
    process.exit(1);
  }

  let totalFailed = 0;
  let totalWarnings = 0;
  const summaryRows = [];

  for (const tool of toolsToAudit) {
    const { files } = getToolSourceFiles(tool.id);
    const g1 = auditGate1(tool, registry);
    const g2 = auditGate2(tool, files);
    const g3 = auditGate3(tool, files);

    const isToolActive = tool.readiness !== 'in-development';
    const toolPassed = g1.passed && g2.passed && g3.passed;
    if (!toolPassed && isToolActive) totalFailed++;

    const toolWarningsCount = g1.warnings.length + g2.warnings.length + g3.warnings.length;
    totalWarnings += toolWarningsCount;

    let statusBadge;
    if (toolPassed) {
      statusBadge = toolWarningsCount > 0 ? `${colors.yellow}PASS w/ WARN${colors.reset}` : `${colors.green}ALL PASS${colors.reset}`;
    } else {
      statusBadge = isToolActive ? `${colors.red}FAIL (ACTIVE)${colors.reset}` : `${colors.yellow}BLOCKED (IN-DEV)${colors.reset}`;
    }

    summaryRows.push({
      id: tool.id,
      name: tool.name_vn || tool.id,
      readiness: tool.readiness,
      g1: g1.passed ? '✔' : '✖',
      g2: g2.passed ? '✔' : '✖',
      g3: g3.passed ? '✔' : '✖',
      status: statusBadge,
      issues: [...g1.issues, ...g2.issues, ...g3.issues],
      warnings: [...g1.warnings, ...g2.warnings, ...g3.warnings],
    });
  }

  // Print Summary Table
  console.log('┌───────────────────────┬──────────────┬────────┬────┬────┬────┬──────────────┐');
  console.log('│ Miniapp ID            │ Trạng thái   │ Files  │ G1 │ G2 │ G3 │ Kết quả      │');
  console.log('├───────────────────────┼──────────────┼────────┼────┼────┼────┼──────────────┤');

  for (const row of summaryRows) {
    const { files } = getToolSourceFiles(row.id);
    const idCol = row.id.padEnd(21).slice(0, 21);
    const readinessCol = row.readiness.padEnd(12).slice(0, 12);
    const filesCol = String(files.length).padStart(6);
    const g1Col = row.g1 === '✔' ? `${colors.green}PASS${colors.reset}` : `${colors.red}FAIL${colors.reset}`;
    const g2Col = row.g2 === '✔' ? `${colors.green}PASS${colors.reset}` : `${colors.red}FAIL${colors.reset}`;
    const g3Col = row.g3 === '✔' ? `${colors.green}PASS${colors.reset}` : `${colors.red}FAIL${colors.reset}`;

    console.log(`│ ${idCol} │ ${readinessCol} │ ${filesCol} │ ${g1Col} │ ${g2Col} │ ${g3Col} │ ${row.status.padEnd(21)}│`);
  }
  console.log('└───────────────────────┴──────────────┴────────┴────┴────┴────┴──────────────┘');

  // Print Detailed Issues / Warnings if requested or on failure
  let hasDetails = false;
  for (const row of summaryRows) {
    if (row.issues.length > 0 || row.warnings.length > 0) {
      if (!hasDetails) {
        console.log(`\n${colors.bold}Chi tiết các điểm cần lưu ý:${colors.reset}`);
        hasDetails = true;
      }
      console.log(`\n${colors.bold}${colors.cyan}▶ [${row.id}] - ${row.name}:${colors.reset}`);
      for (const issue of row.issues) {
        console.log(`  ${fail(issue)}`);
      }
      for (const w of row.warnings) {
        console.log(`  ${warn(w)}`);
      }
    }
  }

  console.log(`\n${colors.bold}TỔNG KẾT KIỂM DUYỆT:${colors.reset}`);
  console.log(`- Tổng số miniapp được quét: ${toolsToAudit.length}`);
  console.log(`- Đạt chuẩn (Pass): ${colors.green}${toolsToAudit.length - totalFailed}${colors.reset}`);
  console.log(`- Cần khắc phục (Fail): ${totalFailed > 0 ? colors.red + totalFailed + colors.reset : '0'}`);
  console.log(`- Khuyến nghị tối ưu (Warnings): ${totalWarnings > 0 ? colors.yellow + totalWarnings + colors.reset : '0'}\n`);

  if (totalFailed > 0) {
    console.error(`${colors.red}✖ KIỂM DUYỆT KHÔNG ĐẠT: Có ${totalFailed} miniapp vi phạm tiêu chuẩn kỹ thuật MAIS.${colors.reset}\n`);
    process.exit(1);
  } else {
    console.log(`${colors.green}✔ TẤT CẢ MINIAPP ĐẠT TIÊU CHUẨN KIỂM DUYỆT TĨNH (GATES 1, 2, 3)!${colors.reset}\n`);
    process.exit(0);
  }
}

main().catch((err) => {
  console.error(`${colors.red}Lỗi thực thi audit:${colors.reset}`, err);
  process.exit(1);
});
