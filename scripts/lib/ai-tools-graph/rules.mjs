/**
 * @file scripts/lib/ai-tools-graph/rules.mjs
 * Architecture rules, domain boundaries, cycle detection, and risk scoring for ai-tools monorepo.
 */

import path from 'node:path';

// 11 Miniapps with 'verified: true' status
export const VERIFIED_MINIAPPS = new Set([
  'image-convert',
  'screen-capture',
  'barcode-qr',
  'pdf-toolkit',
  'omniconvert',
  'invoice-studio',
  'accounting-reconcile',
  'tax-calculator',
  'watermark-studio',
  'id-photo-studio',
  'business-card-studio',
]);

// Map known Core Views to their Tool IDs
const CORE_VIEW_TO_TOOL_MAP = {
  'AccountingReconcileView.jsx': 'accounting-reconcile',
  'AutoBiView.jsx': 'auto-bi',
  'BarcodeQrStudioView.jsx': 'barcode-qr',
  'BusinessCardStudioView.jsx': 'business-card-studio',
  'CertificateStudioView.jsx': 'certificate-studio',
  'DocStudioApp.jsx': 'editor-studio',
  'ExcelMappingView.jsx': 'excel-mapping',
  'IdPhotoStudioView.jsx': 'id-photo-studio',
  'LegalDocumentView.jsx': 'legal-studio',
  'LongDocTranslatorView.jsx': 'long-translator',
  'OmniConvertView.jsx': 'omniconvert',
  'ScreenCaptureView.jsx': 'screen-capture',
  'TaxCalculatorView.jsx': 'tax-calculator',
  'WatermarkStudioView.jsx': 'watermark-studio',
};

// Map domain subdirectories in packages/core/src/utils to owner Tool ID
const CORE_UTIL_DOMAIN_MAP = {
  'accounting': 'accounting-reconcile',
  'business-card': 'business-card-studio',
  'invoice': 'invoice-studio',
  'tax': 'tax-calculator',
  'image': 'image-convert', // primary owner, also used by image tools
};

/**
 * Classify a file into an architectural zone and owner miniapp
 * @param {string} filePath - Absolute file path
 * @param {string} rootDir - Monorepo root directory
 * @returns {{ zone: string, toolId: string|null, isVerified: boolean, isShared: boolean }}
 */
export function classifyFile(filePath, rootDir) {
  const rel = path.relative(rootDir, filePath).replace(/\\/g, '/');

  // Hub Shell
  if (
    rel.startsWith('hub/src/components/') ||
    rel === 'hub/src/App.jsx' ||
    rel === 'hub/src/main.jsx' ||
    rel.startsWith('hub/src/config/')
  ) {
    return { zone: 'HUB_SHELL', toolId: null, isVerified: false, isShared: true };
  }

  // Active Tool in Hub
  const activeToolMatch = rel.match(/^hub\/src\/tools\/([^/]+)\//);
  if (activeToolMatch) {
    const toolId = activeToolMatch[1];
    return {
      zone: 'HUB_TOOL',
      toolId,
      isVerified: VERIFIED_MINIAPPS.has(toolId),
      isShared: false,
    };
  }

  // In-Development Tool in Hub
  const inDevToolMatch = rel.match(/^hub\/src\/tools-in-development\/([^/]+)\//);
  if (inDevToolMatch) {
    const toolId = inDevToolMatch[1];
    return {
      zone: 'HUB_TOOL_IN_DEV',
      toolId,
      isVerified: false,
      isShared: false,
    };
  }

  // Core Components: Dedicated views vs Shared components
  if (rel.startsWith('packages/core/src/components/')) {
    const baseName = path.basename(rel);
    if (CORE_VIEW_TO_TOOL_MAP[baseName]) {
      const toolId = CORE_VIEW_TO_TOOL_MAP[baseName];
      return {
        zone: 'CORE_VIEW',
        toolId,
        isVerified: VERIFIED_MINIAPPS.has(toolId),
        isShared: false,
      };
    }
    // components/shared/ or reusable layout cards
    return { zone: 'CORE_SHARED_COMPONENT', toolId: null, isVerified: false, isShared: true };
  }

  // Core Utils: Domain specific vs Shared
  if (rel.startsWith('packages/core/src/utils/')) {
    const subPath = rel.replace('packages/core/src/utils/', '');
    const parts = subPath.split('/');
    if (parts.length > 1 && CORE_UTIL_DOMAIN_MAP[parts[0]]) {
      const toolId = CORE_UTIL_DOMAIN_MAP[parts[0]];
      return {
        zone: 'CORE_DOMAIN_UTIL',
        toolId,
        isVerified: VERIFIED_MINIAPPS.has(toolId),
        isShared: false,
      };
    }
    // General utils at root (numbers.js, documentFiles.js, etc.)
    return { zone: 'CORE_SHARED_UTIL', toolId: null, isVerified: false, isShared: true };
  }

  // Core Services, Hooks, Theme, Index
  if (
    rel.startsWith('packages/core/src/hooks/') ||
    rel.startsWith('packages/core/src/services/') ||
    rel.startsWith('packages/core/src/theme/') ||
    rel === 'packages/core/src/index.js'
  ) {
    return { zone: 'CORE_SHARED_INFRA', toolId: null, isVerified: false, isShared: true };
  }

  return { zone: 'OTHER', toolId: null, isVerified: false, isShared: false };
}

/**
 * Check for domain boundary isolation violations.
 * Rule: A miniapp must not import internal files/utils of another miniapp.
 * @param {string} fromFile - Absolute path of importer
 * @param {string} toFile - Absolute path of imported module
 * @param {string} rootDir - Monorepo root
 * @returns {{ isViolation: boolean, message?: string }}
 */
export function checkDomainBoundaryViolation(fromFile, toFile, rootDir) {
  const fromInfo = classifyFile(fromFile, rootDir);
  const toInfo = classifyFile(toFile, rootDir);

  // If imported target is shared or shell, it's allowed
  if (toInfo.isShared) {
    return { isViolation: false };
  }

  // Allow domain families (e.g. invoice-studio and invoice-xml-fetcher share utils/invoice)
  const isSameFamily =
    (fromInfo.toolId === 'invoice-xml-fetcher' && toInfo.toolId === 'invoice-studio') ||
    (fromInfo.toolId === 'invoice-studio' && toInfo.toolId === 'invoice-xml-fetcher');

  // If importer has a toolId and target has a toolId, they must match (unless same family)
  if (fromInfo.toolId && toInfo.toolId && fromInfo.toolId !== toInfo.toolId && !isSameFamily) {
    const relFrom = path.relative(rootDir, fromFile).replace(/\\/g, '/');
    const relTo = path.relative(rootDir, toFile).replace(/\\/g, '/');
    return {
      isViolation: true,
      message: `Vi phạm cách ly tên miền (Cross-Domain Violation): Miniapp "${fromInfo.toolId}" (${relFrom}) import trực tiếp tài nguyên nội bộ của miniapp "${toInfo.toolId}" (${relTo}).`,
    };
  }

  return { isViolation: false };
}

/**
 * Detect cycles in directed graph using DFS.
 * @param {Map<string, Set<string>>} adjacencyList - Map of file -> Set of imported files
 * @returns {Array<string[]>} List of circular dependency cycles
 */
export function findCircularDependencies(adjacencyList) {
  const visited = new Set();
  const recStack = new Set();
  const cycles = [];
  const pathStack = [];

  function dfs(node) {
    visited.add(node);
    recStack.add(node);
    pathStack.push(node);

    const neighbors = adjacencyList.get(node) || new Set();
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        dfs(neighbor);
      } else if (recStack.has(neighbor)) {
        const cycleStartIndex = pathStack.indexOf(neighbor);
        if (cycleStartIndex !== -1) {
          const cycle = pathStack.slice(cycleStartIndex).concat(neighbor);
          cycles.push(cycle);
        }
      }
    }

    pathStack.pop();
    recStack.delete(node);
  }

  for (const node of adjacencyList.keys()) {
    if (!visited.has(node)) {
      dfs(node);
    }
  }

  return cycles;
}

/**
 * Determine Risk Tier based on blast radius statistics.
 * @param {{ directCount: number, transitiveCount: number, affectedTools: string[], affectedVerifiedTools: string[], isShellAffected: boolean }} blastSummary
 * @returns {{ tier: 'R0'|'R1'|'R2'|'R3', label: string, description: string }}
 */
export function calculateRiskTier(blastSummary) {
  const { affectedTools, affectedVerifiedTools, isShellAffected } = blastSummary;

  // R3: Critical Monorepo Infrastructure
  if (
    isShellAffected ||
    affectedTools.length >= 5 ||
    affectedVerifiedTools.length >= 3
  ) {
    return {
      tier: 'R3',
      label: 'NGUY CƠ CAO (R3 - Critical Core Infrastructure)',
      description:
        'Tác động trực tiếp đến Hub Shell, thanh điều hướng, hoặc ảnh hưởng từ 5 miniapp / 3 miniapp đã xác minh trở lên. Bắt buộc kích hoạt Escalation Protocol L3!',
    };
  }

  // R2: Shared Core Utility
  if (affectedTools.length >= 2 || affectedVerifiedTools.length >= 1) {
    return {
      tier: 'R2',
      label: 'NGUY CƠ TRUNG BÌNH (R2 - Shared Core Utility)',
      description:
        'Tác động đến tài nguyên dùng chung ảnh hưởng 2-4 miniapp hoặc có chứa Verified Miniapp. Bắt buộc kiểm tra tương thích ngược và chạy toàn bộ unit tests!',
    };
  }

  // R1: Single Miniapp Local
  if (affectedTools.length === 1) {
    return {
      tier: 'R1',
      label: 'NGUY CƠ THẤP (R1 - Single Miniapp Local)',
      description: 'Chỉ ảnh hưởng trong phạm vi 1 miniapp duy nhất. Kiểm thử cục bộ miniapp trước khi commit.',
    };
  }

  // R0: Isolated
  return {
    tier: 'R0',
    label: 'AN TOÀN / CÔ LẬP (R0 - Isolated)',
    description: 'File nội bộ hoặc đang phát triển, không có consumer nào bên ngoài phụ thuộc.',
  };
}
