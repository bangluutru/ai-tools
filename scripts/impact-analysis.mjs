#!/usr/bin/env node
/**
 * @file scripts/impact-analysis.mjs
 * ============================================================================
 * AI-Tools Native Code Intelligence & Blast Radius Impact CLI
 *
 * Usage:
 *   node scripts/impact-analysis.mjs --impact <filePath>
 *   node scripts/impact-analysis.mjs --diff
 *   node scripts/impact-analysis.mjs --audit
 *   node scripts/impact-analysis.mjs --map [--tool=<toolId>]
 * ============================================================================
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildGraph } from './lib/ai-tools-graph/index.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// ANSI Colors
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

function printBanner(title) {
  console.log(`\n${colors.bold}${colors.cyan}=== 🌐 AI-TOOLS GRAPH: ${title} ===${colors.reset}`);
  console.log(`${colors.gray}Hệ thống bản đồ quan hệ file & đánh giá tác động lan toả Native${colors.reset}\n`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printBanner('HƯỚNG DẪN SỬ DỤNG');
    console.log(`Lệnh khả dụng:
  ${colors.bold}npm run graph:impact -- <path>${colors.reset}    Đánh giá tác động (Blast Radius) khi sửa một file
  ${colors.bold}npm run graph:diff${colors.reset}                Phân tích tác động của các thay đổi Git chưa commit
  ${colors.bold}npm run graph:audit${colors.reset}               Rà soát toàn bộ đồ thị (chu trình, import chéo, file hỏng)
  ${colors.bold}npm run graph:map [--tool=<id>]${colors.reset}   Xuất sơ đồ liên kết Mermaid trực quan
`);
    process.exit(0);
  }

  const t0 = performance.now();
  const graph = buildGraph(rootDir);
  const tBuild = (performance.now() - t0).toFixed(1);

  // 1. Mode: Impact Analysis for a specific file
  if (args.includes('--impact')) {
    const targetIdx = args.indexOf('--impact') + 1;
    const targetArg = args[targetIdx];

    if (!targetArg) {
      console.error(`${colors.red}✖ Lỗi: Vui lòng cung cấp đường dẫn file cần kiểm tra tác động.${colors.reset}`);
      console.log(`Ví dụ: node scripts/impact-analysis.mjs --impact packages/core/src/utils/documentFiles.js`);
      process.exit(1);
    }

    printBanner('PHÂN TÍCH VÙNG ẢNH HƯỞNG (BLAST RADIUS)');
    const blast = graph.getBlastRadius(targetArg);

    const riskColors = {
      R0: colors.green,
      R1: colors.blue,
      R2: colors.yellow,
      R3: colors.red,
    };
    const riskBadge = `${riskColors[blast.risk.tier] || colors.yellow}${colors.bold}[${blast.risk.tier}] ${blast.risk.label}${colors.reset}`;

    console.log(`${colors.bold}File kiểm tra:${colors.reset}     ${colors.cyan}${blast.target.relPath}${colors.reset}`);
    console.log(`${colors.bold}Phân vùng kiến trúc:${colors.reset} ${blast.target.zone} ${blast.target.toolId ? `(Thuộc miniapp: ${blast.target.toolId})` : ''}`);
    console.log(`${colors.bold}Mức độ rủi ro:${colors.reset}     ${riskBadge}`);
    console.log(`${colors.gray}Mô tả:${colors.reset}             ${blast.risk.description}\n`);

    console.log(`┌────────────────────────────────────────────────────────────────────────┐`);
    console.log(`│ THỐNG KÊ ẢNH HƯỞNG LAN TOẢ (BLAST RADIUS METRICS)                     │`);
    console.log(`├───────────────────────────────────┬────────────────────────────────────┤`);
    console.log(`│ Consumers trực tiếp (Depth 1)     │ ${String(blast.directCount).padStart(34)} │`);
    console.log(`│ Consumers gián tiếp (Depth 2+)    │ ${String(blast.transitiveCount).padStart(34)} │`);
    console.log(`│ Tổng số file bị ảnh hưởng         │ ${String(blast.totalConsumersCount).padStart(34)} │`);
    console.log(`│ Tổng số Miniapp bị ảnh hưởng      │ ${String(blast.affectedTools.length).padStart(34)} │`);
    console.log(`│ Số Verified Miniapp bị ảnh hưởng  │ ${String(blast.affectedVerifiedTools.length).padStart(34)} │`);
    console.log(`└───────────────────────────────────┴────────────────────────────────────┘`);

    if (blast.affectedVerifiedTools.length > 0) {
      console.log(`\n${colors.bold}${colors.yellow}⚠ CẢNH BÁO: File này ảnh hưởng trực tiếp/gián tiếp đến các Verified Miniapp sau:${colors.reset}`);
      for (const t of blast.affectedVerifiedTools) {
        console.log(`  ${colors.red}• [VERIFIED] ${t}${colors.reset}`);
      }
      console.log(`${colors.gray}Ghi chú: Mọi thay đổi trong file này phải bảo toàn 100% tương thích ngược (Signature & Contract).${colors.reset}`);
    }

    if (blast.directConsumers.length > 0) {
      console.log(`\n${colors.bold}Danh sách Consumers trực tiếp (${blast.directCount} files):${colors.reset}`);
      for (const c of blast.directConsumers.slice(0, 15)) {
        const badge = c.meta && c.meta.isVerified ? ` ${colors.red}[Verified]${colors.reset}` : '';
        console.log(`  ${colors.cyan}➜${colors.reset} ${c.relPath}${badge}`);
      }
      if (blast.directConsumers.length > 15) {
        console.log(`  ${colors.gray}... và ${blast.directConsumers.length - 15} files khác${colors.reset}`);
      }
    }

    if (blast.transitiveConsumers.length > 0) {
      console.log(`\n${colors.bold}Danh sách Consumers gián tiếp (${blast.transitiveCount} files):${colors.reset}`);
      for (const c of blast.transitiveConsumers.slice(0, 10)) {
        console.log(`  ${colors.gray}↳ ${c.relPath}${colors.reset}`);
      }
      if (blast.transitiveConsumers.length > 10) {
        console.log(`  ${colors.gray}... và ${blast.transitiveConsumers.length - 10} files khác${colors.reset}`);
      }
    }

    console.log(`\n${colors.gray}Thời gian xây dựng đồ thị: ${tBuild}ms${colors.reset}\n`);
    process.exit(0);
  }

  // 2. Mode: Git Diff Impact
  if (args.includes('--diff')) {
    printBanner('ĐÁNH GIÁ TÁC ĐỘNG CÁC THAY ĐỔI GIT (GIT-DIFF IMPACT)');
    const diffRes = graph.detectGitDiff();

    if (!diffRes.hasChanges) {
      console.log(`${colors.green}✔ Không phát hiện file JS/JSX nào có thay đổi trong Git working tree.${colors.reset}\n`);
      process.exit(0);
    }

    console.log(`${colors.bold}Số file JS/JSX đang sửa đổi:${colors.reset} ${diffRes.changedFilesCount}`);
    console.log(`${colors.bold}Rủi ro tổng thể:${colors.reset}             ${colors.bold}${diffRes.overallSummary.highestRiskTier}${colors.reset}`);
    console.log(`${colors.bold}Các Miniapp bị ảnh hưởng:${colors.reset}     ${diffRes.overallSummary.affectedTools.join(', ') || 'None (Cục bộ)'}`);
    console.log(`${colors.bold}Verified Miniapps bị chạm:${colors.reset}    ${diffRes.overallSummary.affectedVerifiedTools.join(', ') || 'None (An toàn)'}\n`);

    console.log('┌───────────────────────────────────────────────────┬──────┬─────────┬──────────────────────────────┐');
    console.log('│ File Thay Đổi                                     │ Risk │ Direct  │ Miniapp Chịu Tác Động        │');
    console.log('├───────────────────────────────────────────────────┼──────┼─────────┼──────────────────────────────┤');

    for (const item of diffRes.results) {
      const relCol = item.target.relPath.padEnd(49).slice(0, 49);
      const riskCol = item.risk.tier.padEnd(4);
      const directCol = String(item.directCount).padStart(7);
      const toolsCol = item.affectedTools.join(', ').padEnd(28).slice(0, 28);
      console.log(`│ ${relCol} │ ${riskCol} │ ${directCol} │ ${toolsCol} │`);
    }
    console.log('└───────────────────────────────────────────────────┴──────┴─────────┴──────────────────────────────┘\n');
    process.exit(0);
  }

  // 3. Mode: Architectural Audit
  if (args.includes('--audit')) {
    printBanner('RÀ SOÁT KIẾN TRÚC & RANH GIỚI TÊN MIỀN (GRAPH AUDIT)');
    const auditRes = graph.audit();

    console.log(`${colors.bold}Thống kê cơ bản:${colors.reset}`);
    console.log(`- Tổng số files trong đồ thị:      ${auditRes.stats.totalFiles}`);
    console.log(`- Tổng số quan hệ dependencies:    ${auditRes.stats.totalEdges}`);
    console.log(`- Tổng số Verified Miniapps:       ${auditRes.stats.totalVerifiedTools}\n`);

    let failed = false;

    // Check Boundary Violations
    if (auditRes.boundaryViolations.length > 0) {
      failed = true;
      console.log(`${colors.red}${colors.bold}✖ PHÁT HIỆN ${auditRes.boundaryViolations.length} VI PHẠM RANH GIỚI TÊN MIỀN (CROSS-DOMAIN):${colors.reset}`);
      for (const v of auditRes.boundaryViolations) {
        console.log(`  ${colors.red}• [Line ${v.line}] ${v.message}${colors.reset}`);
      }
      console.log('');
    } else {
      console.log(`${colors.green}✔ Ranh giới tên miền: 100% SẠCH (Không có cross-domain import nào)${colors.reset}`);
    }

    // Check Circular Dependencies
    if (auditRes.cycles.length > 0) {
      failed = true;
      console.log(`${colors.red}${colors.bold}✖ PHÁT HIỆN ${auditRes.cycles.length} CHU TRÌNH PHỤ THUỘC (CIRCULAR DEPENDENCIES):${colors.reset}`);
      for (const cycle of auditRes.cycles) {
        console.log(`  ${colors.yellow}• Vòng lặp: ${cycle.join(' ➔ ')}${colors.reset}`);
      }
      console.log('');
    } else {
      console.log(`${colors.green}✔ Chu trình phụ thuộc: 100% SẠCH (0 circular dependencies)${colors.reset}`);
    }

    // Check Missing Imports
    if (auditRes.missingImports.length > 0) {
      failed = true;
      console.log(`${colors.red}${colors.bold}✖ PHÁT HIỆN ${auditRes.missingImports.length} IMPORTS HỎNG / KHÔNG TÌM THẤY TỆP:${colors.reset}`);
      for (const m of auditRes.missingImports) {
        console.log(`  ${colors.red}• [${m.relFrom}:${m.line}] import "${m.source}" -> ${m.error}${colors.reset}`);
      }
      console.log('');
    } else {
      console.log(`${colors.green}✔ Toàn vẹn import: 100% SẠCH (Tất cả import nội bộ đều trỏ tới tệp tồn tại)${colors.reset}`);
    }

    console.log(`\n${colors.gray}Thời gian phân tích đồ thị: ${tBuild}ms${colors.reset}\n`);

    if (failed) {
      console.error(`${colors.red}✖ KIỂM DUYỆT ĐỒ THỊ THẤT BẠI: Cần khắc phục các vi phạm kiến trúc trên.${colors.reset}\n`);
      process.exit(1);
    } else {
      console.log(`${colors.green}✔ TOÀN BỘ ĐỒ THỊ KIẾN TRÚC ĐẠT CHUẨN MAIS GATE 0!${colors.reset}\n`);
      process.exit(0);
    }
  }

  // 4. Mode: Mermaid Map Export
  if (args.includes('--map')) {
    const toolArg = args.find((a) => a.startsWith('--tool='));
    const toolId = toolArg ? toolArg.split('=')[1] : null;

    printBanner(toolId ? `BẢN ĐỒ PHỤ THUỘC CHO MINIAPP [${toolId}]` : 'BẢN ĐỒ PHỤ THUỘC TOÀN MONOREPO');
    const mermaid = graph.toMermaid({ toolId });
    console.log(mermaid);
    console.log(`\n${colors.gray}Bạn có thể copy khối mermaid trên dán vào viewer hoặc markdown document.${colors.reset}\n`);
    process.exit(0);
  }

  console.error(`${colors.red}Lệnh không hợp lệ. Dùng --help để xem danh sách lệnh.${colors.reset}`);
  process.exit(1);
}

main().catch((err) => {
  console.error(`${colors.red}Lỗi thực thi impact CLI:${colors.reset}`, err);
  process.exit(1);
});
