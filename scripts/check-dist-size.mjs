#!/usr/bin/env node
/**
 * Chặn build có tệp quá lớn trước khi tới Cloudflare Pages.
 *
 * Pages từ chối mọi tệp trên 25 MiB, và lỗi đó chỉ hiện lúc deploy. Ngưỡng ở đây
 * thấp hơn (mặc định 20 MiB) để một lần nâng cấp thư viện làm phình asset (từng có
 * file wasm onnxruntime 23,9 MB nằm trong dist) bị bắt ngay ở CI.
 *
 *   node scripts/check-dist-size.mjs [thư_mục_dist] [--max-mib=20]
 */
import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const args = process.argv.slice(2);
const distDir = args.find((a) => !a.startsWith('--')) || 'hub/dist';
const maxMib = Number((args.find((a) => a.startsWith('--max-mib=')) || '--max-mib=20').split('=')[1]);
const maxBytes = maxMib * 1024 * 1024;

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [{ path: full, size: statSync(full).size }];
  });
}

let files;
try {
  files = walk(distDir);
} catch {
  console.error(`✗ Không tìm thấy ${distDir} — hãy build trước.`);
  process.exit(1);
}

const mib = (bytes) => (bytes / 1024 / 1024).toFixed(2);
const tooBig = files.filter((f) => f.size > maxBytes);
const largest = [...files].sort((a, b) => b.size - a.size).slice(0, 5);
const total = files.reduce((sum, f) => sum + f.size, 0);

console.log(`dist: ${files.length} tệp, tổng ${mib(total)} MiB. Lớn nhất:`);
for (const f of largest) console.log(`  ${mib(f.size).padStart(7)} MiB  ${relative(distDir, f.path)}`);

if (tooBig.length) {
  console.error(`\n✗ ${tooBig.length} tệp vượt ${maxMib} MiB (Cloudflare Pages giới hạn 25 MiB/tệp):`);
  for (const f of tooBig) console.error(`  ${mib(f.size)} MiB  ${relative(distDir, f.path)}`);
  process.exit(1);
}
console.log(`✓ Không có tệp nào vượt ${maxMib} MiB.`);
