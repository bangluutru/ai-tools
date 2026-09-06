import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../..');

test('id-photo i18n Vietnamese title is "Tạo Ảnh Thẻ & Hộ Chiếu"', async () => {
  const viI18nPath = path.join(repoRoot, 'packages/core/src/utils/id-photo/i18n/vi.js');
  const content = fs.readFileSync(viI18nPath, 'utf8');
  assert.match(content, /appTitle:\s*["']Tạo Ảnh Thẻ & Hộ Chiếu["']/);
  assert.doesNotMatch(content, /Chứng Minh Ảnh PRO/);
});

test('pdf-toolkit modes has Merge note for Gộp PDF and proper mode labels', () => {
  const pdfToolkitPath = path.join(repoRoot, 'hub/src/tools/pdf-toolkit/PdfToolkitTool.jsx');
  const content = fs.readFileSync(pdfToolkitPath, 'utf8');
  assert.match(content, /id:\s*['"]merge['"],\s*label:\s*['"]Gộp PDF['"],\s*sub:\s*['"]Merge['"]/);
  assert.doesNotMatch(content, /sub:\s*['"]Phổ biến['"]/);
  // Ensure real blob.size is used instead of fake multiplier
  assert.match(content, /size:\s*blob\.size/);
  assert.doesNotMatch(content, /sizeReductionMultiplier/);
});

test('ToolContainer header does not have overflow-hidden to prevent clipping dropdowns', () => {
  const containerPath = path.join(repoRoot, 'hub/src/components/ToolContainer.jsx');
  const content = fs.readFileSync(containerPath, 'utf8');
  // Check header flex container has min-w-0 and no overflow-hidden
  assert.match(content, /className=["'][^"']*flex items-center gap-3 sm:gap-4 min-w-0[^"']*["']/);
  // Ensure aria accessibility attributes are present on quick tool switcher
  assert.match(content, /aria-haspopup=["']listbox["']/);
  assert.match(content, /aria-label=["']Chuyển nhanh công cụ["']/);
});
