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
    TOOL_GROUPS: registryModule.TOOL_GROUPS || {},
  };
}

import { buildGraph } from './lib/ai-tools-graph/index.mjs';
import { getAllSources } from '../packages/core/src/regulatory/sourceRegistry.js';

// Find all source files related to a miniapp (enhanced with Dependency Graph)
function getToolSourceFiles(toolId, graph = null) {
  const files = new Set();

  // 1. Check hub/src/tools/<id>
  const activeToolDir = path.join(hubDir, 'src/tools', toolId);
  const pausedToolDir = path.join(hubDir, 'src/tools-in-development', toolId);
  const toolDir = fs.existsSync(activeToolDir) ? activeToolDir : (fs.existsSync(pausedToolDir) ? pausedToolDir : null);

  if (toolDir && fs.existsSync(toolDir)) {
    const list = fs.readdirSync(toolDir);
    for (const f of list) {
      if (f.endsWith('.jsx') || f.endsWith('.js')) {
        files.add(path.join(toolDir, f));
      }
    }
  }

  // 2. Query graph if available to find core views and sub-components
  if (graph) {
    for (const [fPath, meta] of graph.nodes.entries()) {
      if (meta.toolId === toolId) {
        files.add(fPath);
      }
    }
  } else {
    // Fallback: Check if wrapper delegates to @ai-tools/core/components/
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
          if (fs.existsSync(resolved)) {
            files.add(resolved);
          }
        }
      } catch {}
    }
  }

  return { toolDir, files: Array.from(files) };
}

// Gate 0: Architectural Dependency & Boundary Audit
function auditGate0(tool, graph, files) {
  const issues = [];
  const warnings = [];

  const auditRes = graph.audit();

  // 1. Check Domain Boundary Violations
  for (const v of auditRes.boundaryViolations) {
    if (files.includes(v.from)) {
      issues.push(`Gate 0: ${v.message} (Line ${v.line})`);
    }
  }

  // 2. Check Circular Dependencies
  for (const cycle of auditRes.cycles) {
    const cycleHasToolFile = cycle.some((f) => files.some((tf) => tf.replace(/\\/g, '/').endsWith(f)));
    if (cycleHasToolFile) {
      issues.push(`Gate 0: Phát hiện chu trình phụ thuộc (Circular Dependency): ${cycle.join(' ➔ ')}`);
    }
  }

  // 3. Check Broken / Unresolved Imports
  for (const m of auditRes.missingImports) {
    if (files.includes(m.from)) {
      issues.push(`Gate 0: Import hỏng / không tìm thấy file: [Line ${m.line}] import "${m.source}"`);
    }
  }

  // 4. Dependency Footprint Metrics
  let coreUtilsCount = 0;
  let coreViewsCount = 0;
  const externalPkgs = new Set();

  for (const f of files) {
    const deps = graph.forwardMap.get(f) || new Set();
    for (const d of deps) {
      const dNode = graph.nodes.get(d);
      if (dNode) {
        if (dNode.zone === 'CORE_SHARED_UTIL' || dNode.zone === 'CORE_DOMAIN_UTIL') coreUtilsCount++;
        if (dNode.zone === 'CORE_VIEW') coreViewsCount++;
      }
    }
    const ext = graph.externalDeps.get(f) || new Set();
    for (const p of ext) externalPkgs.add(p);
  }

  return {
    name: 'Gate 0: Architectural Dependency & Boundary',
    passed: issues.length === 0,
    issues,
    warnings,
    metrics: {
      coreUtilsCount,
      coreViewsCount,
      externalPkgsCount: externalPkgs.size,
    },
  };
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

  // Tool Contract V1: Product Groups & Regulatory Consistency
  const allowedGroupIds = Object.keys(registryInfo.TOOL_GROUPS || {});
  if (tool.group && allowedGroupIds.length > 0 && !allowedGroupIds.includes(tool.group)) {
    issues.push(`Nhóm sản phẩm không hợp lệ: "${tool.group}". Cho phép: ${allowedGroupIds.join(', ')}`);
  }

  // Country / Group Consistency Rules
  if (tool.group === 'japan-life' && tool.country !== 'JP') {
    issues.push(`Công cụ thuộc nhóm 'japan-life' bắt buộc phải khai báo country: 'JP'. Hiện tại: "${tool.country}"`);
  }
  if (tool.group === 'vietnam-life' && tool.country !== 'VN') {
    issues.push(`Công cụ thuộc nhóm 'vietnam-life' bắt buộc phải khai báo country: 'VN'. Hiện tại: "${tool.country}"`);
  }

  // Regulatory field validation
  if (tool.regulatory !== undefined && typeof tool.regulatory !== 'boolean') {
    issues.push(`Trường regulatory phải là kiểu boolean (true/false). Hiện tại: "${typeof tool.regulatory}"`);
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

  // Naming Convention: Prohibit marketing fluff (PRO, Master, Studio PRO, Craft, Vip, Ultimate)
  const forbiddenFluffPatterns = [
    { regex: /\bPRO\b/i, word: 'PRO' },
    { regex: /\bMaster\b/i, word: 'Master' },
    { regex: /\bStudio\s+PRO\b/i, word: 'Studio PRO' },
    { regex: /\bCraft\b/i, word: 'Craft' },
    { regex: /\bUltimate\b/i, word: 'Ultimate' },
    { regex: /\bVip\b/i, word: 'Vip' },
  ];

  for (const langKey of ['name_vn', 'name_en', 'name_ja']) {
    const val = tool[langKey] || '';
    for (const { regex, word } of forbiddenFluffPatterns) {
      if (regex.test(val)) {
        issues.push(`Tên gọi "${langKey}: ${val}" vi phạm MAIS Gate 1 Naming Convention: Chứa từ cấm tiếp thị "${word}".`);
      }
    }
    if (val.includes(' — ') || val.includes(' - ')) {
      warnings.push(`Tên gọi "${langKey}: ${val}" chứa dấu gạch ngang slogan. Khuyến nghị rút gọn theo công thức [Hành động] + [Đối tượng].`);
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

  // A11y: Low-contrast text classes on light surfaces (violates WCAG 2.1 AA 4.5:1)
  const lowContrastTextPatterns = [
    { regex: /\btext-slate-400\b/g, label: 'Class "text-slate-400" có độ tương phản thấp (~2.5:1) trên nền sáng (khuyến nghị dùng "text-on-surface-variant" hoặc "text-outline")' },
    { regex: /\btext-gray-400\b/g, label: 'Class "text-gray-400" có độ tương phản thấp (~2.5:1) trên nền sáng (khuyến nghị dùng "text-on-surface-variant" hoặc "text-outline")' },
    { regex: /\btext-zinc-400\b/g, label: 'Class "text-zinc-400" có độ tương phản thấp (~2.5:1) trên nền sáng (khuyến nghị dùng "text-on-surface-variant" hoặc "text-outline")' },
    { regex: /\btext-neutral-400\b/g, label: 'Class "text-neutral-400" có độ tương phản thấp (~2.5:1) trên nền sáng (khuyến nghị dùng "text-on-surface-variant" hoặc "text-outline")' },
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

    // A11y low-contrast text check
    for (const { regex, label } of lowContrastTextPatterns) {
      const matches = codeOnly.match(regex);
      if (matches && matches.length > 0) {
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

    // Accessible Form Control Names Check (Range Slider, Color)
    const unlabelledInputMatch = codeOnly.match(/<input[^>]*type=["'](range|color)["'][^>]*>/g);
    if (unlabelledInputMatch) {
      const missingAria = unlabelledInputMatch.filter((tag) => !tag.includes('aria-label') && !tag.includes('id=') && !tag.includes('id ='));
      if (missingAria.length > 0) {
        warnings.push(`${relPath}: Phát hiện ${missingAria.length} thẻ <input type="range/color"> thiếu aria-label hoặc label ngữ nghĩa`);
      }
    }

    // Active Tints Contrast Trap Check
    const activeTintMatch = codeOnly.match(/\bbg-(primary-container\/20|secondary\/15)\b[^\n]*\btext-(primary-container|secondary)\b/g);
    if (activeTintMatch && activeTintMatch.length > 0) {
      warnings.push(`${relPath}: Phát hiện ${activeTintMatch.length} vị trí dùng class tint (bg-*-container/20 text-*) có nguy cơ rớt tương phản WCAG AA ở Light Mode. Khuyến nghị đổi sang 'bg-primary text-on-primary'`);
    }

    // Navbar Isolation Check: Miniapp should not re-implement ThemeToggle or global portal navbar
    if (codeOnly.includes('ThemeToggle') && !filePath.includes('ToolContainer.jsx') && !filePath.includes('Navbar.jsx')) {
      issues.push(`${relPath}: Phát hiện miniapp tự import/sử dụng ThemeToggle. Thanh điều hướng và ThemeToggle do ToolContainer đảm nhiệm duy nhất.`);
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

// Gate R: Regulatory Integrity & Source Verification Gate V1
function auditGateRegulatory(tool, files) {
  if (!tool.regulatory) {
    return {
      name: 'Gate R: Regulatory Gate V1',
      passed: true,
      notApplicable: true,
      issues: [],
      warnings: [],
    };
  }

  const issues = [];
  const warnings = [];

  // 1. Country exists & supported
  if (!tool.country || !['JP', 'VN'].includes(tool.country)) {
    issues.push(`Công cụ pháp lý "${tool.id}" thiếu country hợp lệ ('JP' hoặc 'VN') trong toolsRegistry.`);
  }

  // 2. Domain exists
  if (!tool.domain) {
    issues.push(`Công cụ pháp lý "${tool.id}" thiếu khai báo domain (ví dụ: 'tax', 'insurance') trong toolsRegistry.`);
  }

  // 3. Official Source Registry exists and has sources for country
  const countrySources = getAllSources({ country: tool.country });
  if (countrySources.length === 0) {
    issues.push(`Chưa đăng ký Official Sources nào cho quốc gia "${tool.country}" trong OfficialSourceRegistry.`);
  }

  // 4. Check regulatory rule files for sourceId and metadata based on domain
  let ruleFilePath = null;
  let goldenTestPath = null;

  if (tool.domain === 'tax') {
    ruleFilePath = path.join(coreDir, 'src/utils/tax/rules/2026/index.js');
    goldenTestPath = path.join(coreDir, 'tests/regulatory-japan-tax-golden.test.js');
  } else if (tool.domain === 'insurance') {
    ruleFilePath = path.join(coreDir, 'src/japan/insurance/rules/index.js');
    goldenTestPath = path.join(coreDir, 'tests/regulatory-japan-insurance-golden.test.js');
  }

  if (ruleFilePath && fs.existsSync(ruleFilePath)) {
    const content = fs.readFileSync(ruleFilePath, 'utf8');

    // Rule metadata contract checks
    if (!content.includes('sourceId')) {
      issues.push(`File quy chuẩn ${path.relative(rootDir, ruleFilePath)} thiếu khai báo sourceId.`);
    }
    if (!content.includes('applicablePeriod') && !content.includes('effectiveFrom')) {
      issues.push(`File quy chuẩn ${path.relative(rootDir, ruleFilePath)} thiếu thông tin applicablePeriod/effectiveFrom.`);
    }
    if (!content.includes('lastVerifiedAt') && !content.includes('verifiedDate')) {
      issues.push(`File quy chuẩn ${path.relative(rootDir, ruleFilePath)} thiếu mốc thời gian kiểm chứng lastVerifiedAt.`);
    }

    // 5. Dummy / Placeholder constant detection
    const forbiddenPatterns = [
      { regex: /TODO\s+rate/i, label: 'TODO rate' },
      { regex: /example\s+rate/i, label: 'example rate' },
      { regex: /dummy[_\s]*rate/i, label: 'dummy rate' },
      { regex: /placeholder[_\s]*rate/i, label: 'placeholder rate' },
      { regex: /average\s+assumed/i, label: 'average assumed' },
      { regex: /sample\s+rate/i, label: 'sample rate' },
      { regex: /temporary\s+rate/i, label: 'temporary rate' },
      { regex: /hardcoded\s+approximate/i, label: 'hardcoded approximate' },
    ];

    for (const pat of forbiddenPatterns) {
      if (pat.regex.test(content)) {
        issues.push(`Phát hiện placeholder/dummy hằng số pháp lý không hợp lệ: "${pat.label}" trong ${path.relative(rootDir, ruleFilePath)}`);
      }
    }
  }

  // 6. Golden Tests existence check
  if (goldenTestPath && !fs.existsSync(goldenTestPath)) {
    issues.push(`Thiếu bộ kiểm thử vàng (Golden Legal Tests) tại ${path.relative(rootDir, goldenTestPath)}`);
  }

  return {
    name: 'Gate R: Regulatory Gate V1',
    passed: issues.length === 0,
    notApplicable: false,
    issues,
    warnings,
  };
}

// Main Runner
async function main() {
  const args = process.argv.slice(2);
  const isAll = args.includes('--all') || args.length === 0;
  const targetId = !isAll ? args[0] : null;

  const t0 = performance.now();
  const graph = buildGraph(rootDir);
  const tGraph = (performance.now() - t0).toFixed(1);

  console.log(`\n${colors.bold}${colors.cyan}=== 🛡️ MINIAPP ARCHITECTURE & INTEGRATION AUDIT (MAIS) ===${colors.reset}`);
  console.log(`${colors.gray}Tiêu chuẩn kiểm duyệt 5 cổng (Gate 0, 1, 2, 3, Regulatory Gate R) — Đồ thị khởi tạo trong ${tGraph}ms${colors.reset}\n`);

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
    const { files } = getToolSourceFiles(tool.id, graph);
    const g0 = auditGate0(tool, graph, files);
    const g1 = auditGate1(tool, registry);
    const g2 = auditGate2(tool, files);
    const g3 = auditGate3(tool, files);
    const gR = auditGateRegulatory(tool, files);

    const isToolActive = tool.readiness !== 'in-development';
    const toolPassed = g0.passed && g1.passed && g2.passed && g3.passed && gR.passed;
    if (!toolPassed && isToolActive) totalFailed++;

    const toolWarningsCount = g0.warnings.length + g1.warnings.length + g2.warnings.length + g3.warnings.length + gR.warnings.length;
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
      filesCount: files.length,
      g0: g0.passed ? '✔' : '✖',
      g1: g1.passed ? '✔' : '✖',
      g2: g2.passed ? '✔' : '✖',
      g3: g3.passed ? '✔' : '✖',
      gR: gR.notApplicable ? '-' : (gR.passed ? '✔' : '✖'),
      status: statusBadge,
      issues: [...g0.issues, ...g1.issues, ...g2.issues, ...g3.issues, ...gR.issues],
      warnings: [...g0.warnings, ...g1.warnings, ...g2.warnings, ...g3.warnings, ...gR.warnings],
    });
  }

  // Print Summary Table (with G0 & GR columns)
  console.log('┌───────────────────────┬──────────────┬────────┬────┬────┬────┬────┬────┬──────────────┐');
  console.log('│ Miniapp ID            │ Trạng thái   │ Files  │ G0 │ G1 │ G2 │ G3 │ GR │ Kết quả      │');
  console.log('├───────────────────────┼──────────────┼────────┼────┼────┼────┼────┼────┼──────────────┤');

  for (const row of summaryRows) {
    const idCol = row.id.padEnd(21).slice(0, 21);
    const readinessCol = row.readiness.padEnd(12).slice(0, 12);
    const filesCol = String(row.filesCount).padStart(6);
    const g0Col = row.g0 === '✔' ? `${colors.green}PASS${colors.reset}` : `${colors.red}FAIL${colors.reset}`;
    const g1Col = row.g1 === '✔' ? `${colors.green}PASS${colors.reset}` : `${colors.red}FAIL${colors.reset}`;
    const g2Col = row.g2 === '✔' ? `${colors.green}PASS${colors.reset}` : `${colors.red}FAIL${colors.reset}`;
    const g3Col = row.g3 === '✔' ? `${colors.green}PASS${colors.reset}` : `${colors.red}FAIL${colors.reset}`;
    const gRCol = row.gR === '-' ? `${colors.gray} -  ${colors.reset}` : (row.gR === '✔' ? `${colors.green}PASS${colors.reset}` : `${colors.red}FAIL${colors.reset}`);

    console.log(`│ ${idCol} │ ${readinessCol} │ ${filesCol} │ ${g0Col} │ ${g1Col} │ ${g2Col} │ ${g3Col} │ ${gRCol} │ ${row.status.padEnd(21)}│`);
  }
  console.log('└───────────────────────┴──────────────┴────────┴────┴────┴────┴────┴────┴──────────────┘');

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
