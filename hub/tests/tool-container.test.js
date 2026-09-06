import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../..');

test('all 9 miniapps have standardized tri-lingual names in toolsRegistry', async () => {
  const registryModule = await import('../src/config/toolsRegistry.js');
  const tools = registryModule.tools;

  const expectedNames = {
    'business-card-studio': { vn: 'Tạo Danh Thiếp', en: 'Business Card Maker', ja: '名刺作成' },
    'id-photo-studio': { vn: 'Tạo Ảnh Thẻ & Hộ Chiếu', en: 'ID & Passport Photo', ja: '証明写真・パスポート写真' },
    'image-convert': { vn: 'Nén Ảnh Đa Năng', en: 'Multi-Purpose Image Compressor', ja: '画像圧縮・変換' },
    'screen-capture': { vn: 'Chụp Màn Hình', en: 'Screen Capture', ja: '画面キャプチャ' },
    'barcode-qr': { vn: 'Tạo Mã QR & Barcode', en: 'QR & Barcode Generator', ja: 'QRコード・バーコード生成' },
    'omniconvert': { vn: 'Chuyển Đổi Đa Năng', en: 'Universal File Converter', ja: '万能ファイル変換' },
    'invoice-studio': { vn: 'Tạo Đề Nghị Thanh Toán', en: 'Payment Request Maker', ja: '支払依頼書作成' },
    'watermark-studio': { vn: 'Đóng Dấu Tài Liệu', en: 'Document Watermark', ja: '文書透かし・押印' },
    'pdf-toolkit': { vn: 'Công Cụ PDF Đa Năng', en: 'PDF Multi-Tool', ja: '万能PDFツール' }
  };

  for (const [toolId, names] of Object.entries(expectedNames)) {
    const tool = tools.find((t) => t.id === toolId);
    assert.ok(tool, `Tool ${toolId} should exist in registry`);
    assert.equal(tool.name_vn, names.vn, `Tool ${toolId} vn name mismatch`);
    assert.equal(tool.name_en, names.en, `Tool ${toolId} en name mismatch`);
    assert.equal(tool.name_ja, names.ja, `Tool ${toolId} ja name mismatch`);
  }
});

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

test('ToolContainer header matches Navbar h-16 style with theme toggle and language selector', () => {
  const containerPath = path.join(repoRoot, 'hub/src/components/ToolContainer.jsx');
  const content = fs.readFileSync(containerPath, 'utf8');

  // Unified h-16 height
  assert.match(content, /h-16/);
  // Brand Logo AI-Tools HUB
  assert.match(content, /AI-Tools/);
  assert.match(content, /HUB/);
  // Back to Hub button
  assert.match(content, /onBackToHub/);
  assert.match(content, /Về Trung Tâm/);
  // Quick Tool Switcher with accessibility
  assert.match(content, /aria-haspopup=["']listbox["']/);
  assert.match(content, /aria-label=["']Chuyển nhanh công cụ["']/);
  // ThemeToggle component
  assert.match(content, /<ThemeToggle\s+displayLang=\{displayLang\}\s*\/>/);
  // Language selector dropdown
  assert.match(content, /Tiếng Việt/);
  assert.match(content, /English/);
  assert.match(content, /日本語/);
  // Unnecessary elements removed: breadcrumb, settings button, github, privacy note text
  assert.doesNotMatch(content, /onOpenSettings/);
  assert.doesNotMatch(content, /github\.com/i);
  assert.doesNotMatch(content, /Xử lý trực tiếp trên trình duyệt — tệp không được tải lên máy chủ/);
});
