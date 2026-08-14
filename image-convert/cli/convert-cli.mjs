#!/usr/bin/env node

/**
 * WebP Master CLI Tool
 * Usage: node cli/convert-cli.mjs <input_path> [output_path] [quality]
 * Example: node cli/convert-cli.mjs ./my-images ./output 80
 */

import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

async function convertFile(inputFilePath, outputFilePath, quality = 80) {
  try {
    const ext = path.extname(inputFilePath).toLowerCase();
    if (!['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp', '.svg', '.avif'].includes(ext)) {
      return false;
    }

    const inputStat = fs.statSync(inputFilePath);

    await sharp(inputFilePath)
      .webp({ quality: parseInt(quality, 10) })
      .toFile(outputFilePath);

    const outputStat = fs.statSync(outputFilePath);
    const saved = Math.max(0, inputStat.size - outputStat.size);
    const percent = Math.round((saved / inputStat.size) * 100);

    console.log(`✅ [OK] ${path.basename(inputFilePath)} -> ${path.basename(outputFilePath)}`);
    console.log(`   Gốc: ${(inputStat.size / 1024).toFixed(1)} KB | WebP: ${(outputStat.size / 1024).toFixed(1)} KB | Tiết kiệm: ${percent}%\n`);
    return true;
  } catch (err) {
    console.error(`❌ [ERROR] Không thể chuyển đổi ${inputFilePath}:`, err.message);
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
🖼️  WEBP MASTER CLI CONVERTER TOOL
====================================
Cú pháp sử dụng:
  node cli/convert-cli.mjs <input_path> [output_path] [quality]

Ví dụ:
  # Chuyển đổi 1 file:
  node cli/convert-cli.mjs ./input.png ./output.webp 80

  # Chuyển đổi toàn bộ thư mục:
  node cli/convert-cli.mjs ./images_dir ./webp_output 85
    `);
    process.exit(0);
  }

  const inputPath = path.resolve(args[0]);
  let outputPath = args[1] ? path.resolve(args[1]) : path.join(path.dirname(inputPath), 'webp_output');
  const quality = args[2] ? parseInt(args[2], 10) : 80;

  if (!fs.existsSync(inputPath)) {
    console.error(`❌ Path không tồn tại: ${inputPath}`);
    process.exit(1);
  }

  const stat = fs.statSync(inputPath);

  if (stat.isFile()) {
    if (!outputPath.endsWith('.webp')) {
      const dir = fs.statSync(outputPath).isDirectory() ? outputPath : path.dirname(outputPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const name = path.basename(inputPath, path.extname(inputPath)) + '.webp';
      outputPath = path.join(dir, name);
    }
    console.log(`🚀 Đang chuyển đổi 1 file...`);
    await convertFile(inputPath, outputPath, quality);
  } else if (stat.isDirectory()) {
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, { recursive: true });
    }

    const files = fs.readdirSync(inputPath);
    console.log(`🚀 Tìm thấy ${files.length} tập tin trong ${inputPath}. Đang xử lý...\n`);

    let count = 0;
    for (const file of files) {
      const fullInput = path.join(inputPath, file);
      if (fs.statSync(fullInput).isFile()) {
        const outName = path.basename(file, path.extname(file)) + '.webp';
        const fullOutput = path.join(outputPath, outName);
        const success = await convertFile(fullInput, fullOutput, quality);
        if (success) count++;
      }
    }
    console.log(`🎉 Hoàn tất! Đã chuyển đổi ${count} ảnh sang WebP tại: ${outputPath}`);
  }
}

main().catch(err => {
  console.error('Fatal CLI Error:', err);
  process.exit(1);
});
