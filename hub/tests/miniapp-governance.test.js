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
  isVerified,
  verifiedTools,
} from '../src/config/toolsRegistry.js';
import { iconMap } from '../src/config/toolIcons.js';

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
    assert.ok(
      iconMap[tool.icon],
      `${tool.id} có icon "${tool.icon}" chưa được ánh xạ trong hub/src/config/toolIcons.js`
    );
    if (tool.readiness !== 'in-development') {
      assert.notEqual(
        tool.icon,
        'Sparkles',
        `${tool.id} không được dùng icon ngôi sao 4 cánh Sparkles làm icon đại diện`,
      );
    }
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

test('MAIS Gate 2: CSS color contrast & accessibility tokens adhere to WCAG 2.1 AA standards (>= 4.5:1)', () => {
  const cssPath = join(hubRoot, 'src/index.css');
  const cssContent = readFileSync(cssPath, 'utf8');

  // Helper: Calculate relative luminance per W3C WCAG 2.1
  function getLuminance(r, g, b) {
    const [rs, gs, bs] = [r, g, b].map((val) => {
      const s = val / 255;
      return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }

  // Helper: Calculate contrast ratio
  function getContrastRatio(rgb1, rgb2) {
    const l1 = getLuminance(...rgb1);
    const l2 = getLuminance(...rgb2);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  // Extract the declaration body of a token block by its exact selector line.
  // Neo selector vào đầu dòng để "[data-theme=\"light\"]" không khớp nhầm
  // phần đuôi của "[data-skin=\"chotto\"][data-theme=\"light\"]".
  function extractBlock(selector) {
    const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const opening = new RegExp(`^${escaped}\\s*\\{`, 'm').exec(cssContent);
    assert.notEqual(opening, null, `Không tìm thấy block ${selector} trong index.css`);
    const bodyStart = opening.index + opening[0].length;
    const closing = /^\}/m.exec(cssContent.slice(bodyStart));
    assert.notEqual(closing, null, `Block ${selector} không được đóng trong index.css`);
    return cssContent.slice(bodyStart, bodyStart + closing.index);
  }

  // Mỗi skin phải tự đạt chuẩn WCAG AA trên chính bảng màu Sáng của nó.
  const lightSelectorsBySkin = {
    toolio: '[data-theme="light"]',
    chotto: '[data-skin="chotto"][data-theme="light"]',
  };

  const whiteRgb = [255, 255, 255];

  // Pastel background helper (alpha blend over white)
  function blendOverWhite(rgb, alpha) {
    return [
      Math.round(rgb[0] * alpha + whiteRgb[0] * (1 - alpha)),
      Math.round(rgb[1] * alpha + whiteRgb[1] * (1 - alpha)),
      Math.round(rgb[2] * alpha + whiteRgb[2] * (1 - alpha)),
    ];
  }

  for (const [skin, selector] of Object.entries(lightSelectorsBySkin)) {
    const lightBlock = extractBlock(selector);

    function parseRgb(varName) {
      const regex = new RegExp(`${varName}:\\s*(\\d+)\\s+(\\d+)\\s+(\\d+)`);
      const match = lightBlock.match(regex);
      assert.equal(Boolean(match), true, `Không tìm thấy biến ${varName} trong ${selector}`);
      return [parseInt(match[1], 10), parseInt(match[2], 10), parseInt(match[3], 10)];
    }

    const secondaryRgb = parseRgb('--secondary-rgb');
    const primaryRgb = parseRgb('--primary-rgb');
    const outlineRgb = parseRgb('--outline-rgb');
    const primaryContainerRgb = parseRgb('--primary-container-rgb');
    // Mỗi skin có nền surface-subtle riêng, không hard-code theo Toolio.
    const surfaceSubtleRgb = parseRgb('--surface-subtle-rgb');

    // 1. Secondary text on pure white and on 15% pastel background
    const secOnWhite = getContrastRatio(secondaryRgb, whiteRgb);
    assert.equal(
      secOnWhite >= 4.5,
      true,
      `[${skin}] --secondary trên nền trắng vi phạm WCAG AA: ${secOnWhite.toFixed(2)}:1 (yêu cầu >= 4.5:1)`,
    );
    const secPastelBg = blendOverWhite(secondaryRgb, 0.15);
    const secOnPastel = getContrastRatio(secondaryRgb, secPastelBg);
    assert.equal(
      secOnPastel >= 4.5,
      true,
      `[${skin}] --secondary trên nền pastel bg-secondary/15 vi phạm WCAG AA: ${secOnPastel.toFixed(2)}:1 (yêu cầu >= 4.5:1)`,
    );

    // 2. Primary text on pure white and on 15% pastel container background
    const primOnWhite = getContrastRatio(primaryRgb, whiteRgb);
    assert.equal(
      primOnWhite >= 4.5,
      true,
      `[${skin}] --primary trên nền trắng vi phạm WCAG AA: ${primOnWhite.toFixed(2)}:1 (yêu cầu >= 4.5:1)`,
    );
    const primPastelBg = blendOverWhite(primaryContainerRgb, 0.15);
    const primOnPastel = getContrastRatio(primaryRgb, primPastelBg);
    assert.equal(
      primOnPastel >= 4.5,
      true,
      `[${skin}] --primary trên nền pastel bg-primary-container/15 vi phạm WCAG AA: ${primOnPastel.toFixed(2)}:1 (yêu cầu >= 4.5:1)`,
    );

    // 3. Outline text on the skin's own surface-subtle
    const outlineOnSubtle = getContrastRatio(outlineRgb, surfaceSubtleRgb);
    assert.equal(
      outlineOnSubtle >= 4.5,
      true,
      `[${skin}] --outline trên nền bg-surface-subtle vi phạm WCAG AA: ${outlineOnSubtle.toFixed(2)}:1 (yêu cầu >= 4.5:1)`,
    );

    // 4. White text on Primary Container button
    const whiteOnContainer = getContrastRatio(whiteRgb, primaryContainerRgb);
    assert.equal(
      whiteOnContainer >= 4.5,
      true,
      `[${skin}] Chữ trắng trên --primary-container vi phạm WCAG AA: ${whiteOnContainer.toFixed(2)}:1 (yêu cầu >= 4.5:1)`,
    );
  }
});

test('MAIS Gate 2: Skin Chotto giữ nguyên 100% tên biến của Toolio, chỉ đổi giá trị', () => {
  const cssPath = join(hubRoot, 'src/index.css');
  const cssContent = readFileSync(cssPath, 'utf8');

  // Neo selector vào đầu dòng để "[data-theme=\"light\"]" không khớp nhầm
  // phần đuôi của "[data-skin=\"chotto\"][data-theme=\"light\"]".
  function extractBlock(selector) {
    const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const opening = new RegExp(`^${escaped}\\s*\\{`, 'm').exec(cssContent);
    assert.notEqual(opening, null, `Không tìm thấy block ${selector} trong index.css`);
    const bodyStart = opening.index + opening[0].length;
    const closing = /^\}/m.exec(cssContent.slice(bodyStart));
    assert.notEqual(closing, null, `Block ${selector} không được đóng trong index.css`);
    return cssContent.slice(bodyStart, bodyStart + closing.index);
  }

  function parseTokens(selector) {
    const map = new Map();
    for (const m of extractBlock(selector).matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
      map.set(m[1], m[2].trim());
    }
    return map;
  }

  const pairs = [
    ['tối', ':root,\n[data-theme="dark"]', '[data-skin="chotto"]:not([data-theme="light"])'],
    ['sáng', '[data-theme="light"]', '[data-skin="chotto"][data-theme="light"]'],
  ];

  // Skin CHỈ đổi màu. Token hình học (--radius-*) là tài sản dùng chung, khai
  // báo một lần ở :root theo design.md Rule 5 — mọi tool chia sẻ cùng bo góc.
  const isGeometryToken = (name) => name.startsWith('--radius-');

  for (const [mode, toolioSelector, chottoSelector] of pairs) {
    const toolio = parseTokens(toolioSelector);
    const chotto = parseTokens(chottoSelector);

    assert.ok(toolio.size > 0, `Block Toolio ${mode} rỗng`);

    // 0. Chotto không được nhân bản token hình học.
    const geometry = [...chotto.keys()].filter(isGeometryToken);
    assert.deepEqual(
      geometry,
      [],
      `Skin Chotto (${mode}) không được khai báo lại token hình học (dùng chung ở :root): ${geometry.join(', ')}`,
    );

    for (const name of [...toolio.keys()].filter(isGeometryToken)) {
      toolio.delete(name);
    }

    // 1. Không thiếu biến nào: Chotto phải phủ hết tên biến của Toolio.
    const missing = [...toolio.keys()].filter((name) => !chotto.has(name));
    assert.deepEqual(
      missing,
      [],
      `Skin Chotto (${mode}) thiếu biến so với Toolio: ${missing.join(', ')}`,
    );

    // 2. Không phát sinh tên mới: Chotto chỉ được đổi giá trị, không thêm biến.
    const extra = [...chotto.keys()].filter((name) => !toolio.has(name));
    assert.deepEqual(
      extra,
      [],
      `Skin Chotto (${mode}) khai báo biến không tồn tại trong Toolio: ${extra.join(', ')}`,
    );

    // 3. Phải thực sự là bảng màu khác, không phải bản sao.
    const identical = [...toolio.keys()].filter((name) => toolio.get(name) === chotto.get(name));
    assert.equal(
      identical.length < toolio.size,
      true,
      `Skin Chotto (${mode}) trùng giá trị hoàn toàn với Toolio — không phải bảng màu thay thế`,
    );
  }
});

test('MAIS Gate 1: Tool names adhere to Naming Convention and do not contain forbidden marketing fluff', () => {
  const forbiddenFluff = [
    { regex: /\bPRO\b/i, word: 'PRO' },
    { regex: /\bMaster\b/i, word: 'Master' },
    { regex: /\bStudio\s+PRO\b/i, word: 'Studio PRO' },
    { regex: /\bCraft\b/i, word: 'Craft' },
    { regex: /\bUltimate\b/i, word: 'Ultimate' },
    { regex: /\bVip\b/i, word: 'Vip' },
  ];

  for (const tool of tools) {
    for (const key of ['name_vn', 'name_en', 'name_ja']) {
      const val = tool[key] || '';
      for (const { regex, word } of forbiddenFluff) {
        assert.equal(
          regex.test(val),
          false,
          `Tool "${tool.id}" field "${key}"="${val}" chứa từ cấm tiếp thị "${word}" (MAIS Gate 1 Naming Convention)`
        );
      }
    }
  }
});

test('MAIS Gate 2: Active miniapps adhere to Navbar Isolation and do not duplicate ThemeToggle', () => {
  for (const tool of activeTools) {
    const files = getToolFiles(tool.id);
    for (const file of files) {
      const content = readFileSync(file, 'utf8');
      const codeOnly = content.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
      assert.equal(
        codeOnly.includes('ThemeToggle'),
        false,
        `${file} vi phạm Navbar Isolation: Miniapp tự nhúng ThemeToggle. Thanh điều hướng và ThemeToggle do ToolContainer đảm nhiệm duy nhất.`
      );
    }
  }
});

test('MAIS Gate 2: Active miniapps adhere to Single Source of Truth (SOT) and do not duplicate Language Selectors', () => {
  const forbiddenSelectors = /\b(LanguageSwitcher|LanguageToggle|LangToggle|LocaleSelector)\b/;
  const localLangStatePattern = /\[\s*(?:lang|language|locale)\s*,\s*set(?:Lang|Language|Locale)\s*\]\s*=\s*useState\s*\(\s*['"](?:vi|en|ja)['"]\s*\)/;

  for (const tool of activeTools) {
    const files = getToolFiles(tool.id);
    for (const file of files) {
      const content = readFileSync(file, 'utf8');
      const codeOnly = content.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');

      assert.equal(
        forbiddenSelectors.test(codeOnly),
        false,
        `${file} vi phạm Single Source of Truth (SOT): Miniapp tự định nghĩa bộ chọn ngôn ngữ riêng thay vì nhận currentLang từ Shell/Navbar.`
      );

      assert.equal(
        localLangStatePattern.test(codeOnly),
        false,
        `${file} vi phạm Single Source of Truth (SOT): Miniapp khởi tạo state ngôn ngữ cục bộ riêng.`
      );
    }
  }
});

test('MAIS Gate 3: Active miniapps with file export functionality must wire real action handlers and not inert UI', () => {
  for (const tool of activeTools) {
    const files = getToolFiles(tool.id);
    for (const file of files) {
      const content = readFileSync(file, 'utf8');
      // Match buttons designed for exporting/downloading files (PDF, CSV, Excel, XLSX, DOCX)
      const exportButtonMatches = content.matchAll(/<button\b[^>]*>(?:(?!<\/button>)[\s\S])*?(?:Xuất|Export|Download|Tải)[^<]*?(?:PDF|CSV|Excel|XLSX|DOCX)[\s\S]*?<\/button>/gi);
      for (const m of exportButtonMatches) {
        const buttonHtml = m[0];
        // Ensure onClick exists on this button or it is explicitly disabled
        assert.ok(
          buttonHtml.includes('onClick=') || buttonHtml.includes('disabled'),
          `${file} vi phạm Real Export: Nút xuất file (${buttonHtml.slice(0, 80)}...) không có thuộc tính onClick.`
        );
      }
    }
  }
});


test('MAIS Gate 4: Verified miniapps must have stability beta, verified flag and ISO date', () => {
  const expectedVerifiedIds = [
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
    'japan-tax-simulator',
    'social-insurance-jp',
    'social-insurance-eligibility-jp',
    'national-pension-jp',
    'dependent-insurance-jp',
    'overtime-calculator-jp',
    'paid-leave-checker-jp',
    'unemployment-eligibility-jp',
    'unemployment-benefit-jp',
    'leaving-job-wizard-jp',
    'maternity-allowance-jp',
    'childcare-leave-eligibility-jp',
    'childcare-benefit-jp',
    'child-allowance-jp',
    'birth-wizard-jp',
    'moving-cost-jp',
    'moving-admin-checker-jp',
    'address-change-checklist-jp',
    'moving-wizard-jp',
    'work-scope-checker-jp',
    'residence-renewal-guide-jp',
    'affiliation-change-checker-jp',
    'status-change-guide-jp',
    'family-immigration-guide-jp',
    'pr-readiness-checker-jp',
    'arriving-in-japan-wizard-jp',
    'leaving-japan-wizard-jp',
    'document-finder-jp',
    'certificate-acquisition-guide-jp',
    'mynumber-procedure-guide-jp',
    'official-form-helper-jp',
    'procedure-requirement-checker-jp',
    'administrative-navigator-jp',
    'japan-life-navigator',
    'salary-calculator-vn',
    'loan-apr-calculator-vn',
    'social-insurance-calculator-vn',
    'electricity-calculator-vn',
    'vietnam-consular-jp'
  ];


  assert.equal(
    verifiedTools.length,
    expectedVerifiedIds.length,
    `Số lượng verified miniapp phải là ${expectedVerifiedIds.length}, hiện tại là ${verifiedTools.length}`
  );

  for (const tool of verifiedTools) {
    assert.equal(
      expectedVerifiedIds.includes(tool.id),
      true,
      `Miniapp "${tool.id}" không nằm trong danh sách được phê duyệt verified`
    );
    assert.equal(
      tool.readiness,
      'beta',
      `Verified miniapp "${tool.id}" phải có readiness: "beta", nhận được "${tool.readiness}"`
    );
    assert.equal(
      tool.verified,
      true,
      `Verified miniapp "${tool.id}" phải có verified: true`
    );
    assert.match(
      tool.verifiedAt || '',
      /^\d{4}-\d{2}-\d{2}$/,
      `Verified miniapp "${tool.id}" phải có ngày verifiedAt định dạng YYYY-MM-DD`
    );
    assert.equal(
      isVerified(tool),
      true,
      `isVerified("${tool.id}") phải trả về true`
    );
  }

  // Ensure experimental and in-development tools are NOT verified
  const unverifiedTools = tools.filter((t) => !expectedVerifiedIds.includes(t.id));
  for (const tool of unverifiedTools) {
    assert.equal(
      Boolean(tool.verified),
      false,
      `Miniapp "${tool.id}" (readiness: ${tool.readiness}) không được đánh dấu verified khi chưa hoàn thiện`
    );
    assert.equal(
      isVerified(tool),
      false,
      `isVerified("${tool.id}") phải trả về false`
    );
  }
});

