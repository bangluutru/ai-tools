import assert from 'node:assert/strict';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  activeTools,
  inDevelopmentTools,
  tools,
  categories,
} from '../src/config/toolsRegistry.js';

const hubRoot = fileURLToPath(new URL('..', import.meta.url));
const repoRoot = fileURLToPath(new URL('../..', import.meta.url));
const coreSrc = join(repoRoot, 'packages/core/src/components');

/**
 * Helper to collect all source files for an active miniapp
 */
function getToolFiles(toolId) {
  const toolDir = join(hubRoot, 'src/tools', toolId);
  const files = [];
  if (existsSync(toolDir)) {
    const list = readdirSync(toolDir).filter((f) => f.endsWith('.jsx') || f.endsWith('.js'));
    for (const file of list) {
      files.push(join(toolDir, file));
    }
  }

  // Also check if tool delegates to @ai-tools/core/components/
  for (const filePath of [...files]) {
    try {
      const content = readFileSync(filePath, 'utf8');
      const matches = content.matchAll(/from\s+['"]@ai-tools\/core\/components\/([^'"]+)['"]/g);
      for (const m of matches) {
        let sub = m[1];
        if (!sub.endsWith('.jsx') && !sub.endsWith('.js')) {
          if (existsSync(join(coreSrc, `${sub}.jsx`))) sub = `${sub}.jsx`;
          else if (existsSync(join(coreSrc, `${sub}.js`))) sub = `${sub}.js`;
        }
        const coreFilePath = join(coreSrc, sub);
        if (existsSync(coreFilePath) && !files.includes(coreFilePath)) {
          files.push(coreFilePath);
        }
      }
    } catch {}
  }
  return files;
}

test('MAIS Gate 1: Every miniapp specifies full tri-lingual metadata (VN, EN, JA)', () => {
  for (const tool of tools) {
    assert.equal(typeof tool.name_vn === 'string' && tool.name_vn.length > 0, true, `${tool.id} thiếu name_vn`);
    assert.equal(typeof tool.name_en === 'string' && tool.name_en.length > 0, true, `${tool.id} thiếu name_en`);
    assert.equal(typeof tool.name_ja === 'string' && tool.name_ja.length > 0, true, `${tool.id} thiếu name_ja`);
    assert.equal(typeof tool.desc_vn === 'string' && tool.desc_vn.length > 0, true, `${tool.id} thiếu desc_vn`);
    assert.equal(typeof tool.desc_en === 'string' && tool.desc_en.length > 0, true, `${tool.id} thiếu desc_en`);
    assert.equal(typeof tool.desc_ja === 'string' && tool.desc_ja.length > 0, true, `${tool.id} thiếu desc_ja`);
  }
});

test('MAIS Gate 1: Every miniapp belongs to an authorized category with a valid icon', () => {
  const allowedCategories = categories.map((c) => c.id);
  for (const tool of tools) {
    assert.equal(
      allowedCategories.includes(tool.category),
      true,
      `${tool.id} có danh mục không hợp lệ: "${tool.category}"`,
    );
    assert.equal(typeof tool.icon === 'string' && tool.icon.length > 0, true, `${tool.id} thiếu icon`);
  }
});

test('MAIS Gate 1: In-development miniapps must state unavailableReason', () => {
  for (const tool of inDevelopmentTools) {
    assert.equal(
      typeof tool.unavailableReason === 'string' && tool.unavailableReason.trim().length > 0,
      true,
      `${tool.id} đang ở trạng thái in-development nhưng thiếu unavailableReason`,
    );
  }
});

test('MAIS Gate 2: Active miniapps do not abuse prohibited static light class (bg-white)', () => {
  // Max allowed threshold: less than 5 occurrences (used only for actual paper sheet or preview canvas)
  for (const tool of activeTools) {
    const files = getToolFiles(tool.id);
    for (const file of files) {
      const content = readFileSync(file, 'utf8');
      const codeOnly = content.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
      const matches = codeOnly.match(/\bbg-white\b/g) || [];
      assert.equal(
        matches.length <= 5,
        true,
        `${file} vi phạm MAIS Gate 2: Chứa ${matches.length} lần class "bg-white" (tối đa cho phép 5 lần cho preview canvas)`,
      );
    }
  }
});

test('MAIS Gate 2: Active miniapps do not use raw emojis inside button elements', () => {
  const emojiInButtonPattern = /<button[^>]*>([^<]*[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}][^<]*)<\/button>/gu;
  for (const tool of activeTools) {
    const files = getToolFiles(tool.id);
    for (const file of files) {
      const content = readFileSync(file, 'utf8');
      const codeOnly = content.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
      const matches = [...codeOnly.matchAll(emojiInButtonPattern)];
      assert.equal(
        matches.length,
        0,
        `${file} vi phạm MAIS Gate 2: Phát hiện raw emoji làm icon trong thẻ <button>. Bắt buộc dùng lucide-react.`,
      );
    }
  }
});
