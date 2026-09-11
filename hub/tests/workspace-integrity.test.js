import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { tools } from '../src/config/toolsRegistry.js';

const repoRoot = fileURLToPath(new URL('../..', import.meta.url));
const hubRoot = fileURLToPath(new URL('..', import.meta.url));

const listDirs = (path) => readdirSync(path, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));


/**
 * OmniConvert từng bị xoá khỏi registry trong khi code vẫn nằm nguyên trong cây
 * nguồn, và bộ test cũ vẫn xanh vì nó chỉ so registry với App.jsx — hai thứ bị
 * xoá cùng lúc nên vẫn "khớp". Mỏ neo phải là thư mục trên đĩa.
 */
test('every miniapp folder has a registry entry and vice versa', () => {
  const activeFolders = listDirs(join(hubRoot, 'src/tools'));
  const pausedFolders = listDirs(join(hubRoot, 'src/tools-in-development'));

  const activeIds = tools.filter((tool) => tool.readiness !== 'in-development').map((tool) => tool.id).sort();
  const pausedIds = tools.filter((tool) => tool.readiness === 'in-development').map((tool) => tool.id).sort();

  assert.deepEqual(
    activeFolders,
    activeIds,
    'hub/src/tools và registry phải liệt kê đúng cùng một tập miniapp đang hoạt động',
  );
  assert.deepEqual(
    pausedFolders,
    pausedIds,
    'hub/src/tools-in-development và registry phải liệt kê đúng cùng một tập miniapp tạm dừng',
  );
});


test('no miniapp folder is left without a component file', () => {
  for (const root of ['src/tools', 'src/tools-in-development']) {
    for (const folder of listDirs(join(hubRoot, root))) {
      const files = readdirSync(join(hubRoot, root, folder)).filter((name) => name.endsWith('.jsx'));
      assert.notEqual(files.length, 0, `${root}/${folder} không có file component nào`);
    }
  }
});


/**
 * packages/core từng import jspdf, mammoth, pptxgenjs... mà không khai báo, chỉ
 * chạy được nhờ npm hoisting. Khi một commit khác gỡ chúng khỏi hub thì build
 * gãy. Package nào import thì package đó phải khai báo.
 */
test('packages/core declares every library it imports', () => {
  const coreSrc = join(repoRoot, 'packages/core/src');
  const manifest = readJson(join(repoRoot, 'packages/core/package.json'));
  // react/react-dom nằm ở peerDependencies là đúng với một thư viện dùng chung.
  const declared = new Set(Object.keys({
    ...manifest.dependencies,
    ...manifest.peerDependencies,
  }));

  const collect = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return collect(path);
    return /\.(js|jsx)$/.test(entry.name) ? [path] : [];
  });

  const missing = new Map();
  for (const file of collect(coreSrc)) {
    const source = readFileSync(file, 'utf8');
    for (const match of source.matchAll(/(?:from|import)\s*\(?\s*['"]([^'".][^'"]*)['"]/g)) {
      const specifier = match[1];
      if (specifier.startsWith('.') || specifier.startsWith('node:')) continue;
      // Gói scoped giữ hai đoạn đầu, gói thường giữ một đoạn.
      const parts = specifier.split('/');
      const name = specifier.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
      if (!declared.has(name)) {
        if (!missing.has(name)) missing.set(name, []);
        missing.get(name).push(file.replace(repoRoot, ''));
      }
    }
  }

  assert.deepEqual(
    [...missing.keys()],
    [],
    `packages/core import nhưng không khai báo: ${[...missing.entries()].map(([n, f]) => `${n} (${f[0]})`).join(', ')}`,
  );
});

/**
 * Zero Horizontal Shift Gate: Header, Main Content và Footer phải chia sẻ
 * chính xác cùng một hình học bounded container: max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8.
 * Thẻ outer shell không được áp padding ngang làm lệch trục gióng biên.
 */
test('Zero Horizontal Shift: Header, Main, and Footer share identical 1240px container geometry', () => {
  const appSrc = readFileSync(join(hubRoot, 'src/App.jsx'), 'utf8');
  const navbarSrc = readFileSync(join(hubRoot, 'src/components/Navbar.jsx'), 'utf8');
  const toolContainerSrc = readFileSync(join(hubRoot, 'src/components/ToolContainer.jsx'), 'utf8');

  // 1. Footer outer shell phải full-bleed (không có padding ngang px-4, px-6, px-8)
  const footerMatch = appSrc.match(/<footer[^>]*className=["']([^"']+)["']/);
  assert.ok(footerMatch, 'App.jsx phải có thẻ <footer>');
  const footerClasses = footerMatch[1].split(/\s+/);
  assert.equal(
    footerClasses.includes('px-4') || footerClasses.includes('px-6') || footerClasses.includes('px-8'),
    false,
    `Outer <footer> trong App.jsx không được áp padding ngang (${footerMatch[1]}), padding ngang phải nằm ở inner container`,
  );

  // 2. Footer inner container phải có max-w-[1240px] và px-4 sm:px-6 lg:px-8
  const footerInnerMatch = appSrc.match(/<footer[\s\S]*?<div[^>]*className=["']([^"']+)["']/);
  assert.ok(footerInnerMatch, 'Footer phải có thẻ inner <div>');
  assert.ok(footerInnerMatch[1].includes('max-w-[1240px]'), 'Footer inner div thiếu max-w-[1240px]');
  assert.ok(footerInnerMatch[1].includes('px-4 sm:px-6 lg:px-8'), 'Footer inner div thiếu px-4 sm:px-6 lg:px-8');

  // 3. Navbar inner container phải có max-w-[1240px] và px-4 sm:px-6 lg:px-8
  const navbarMatch = navbarSrc.match(/<header[\s\S]*?<div[^>]*className=["']([^"']+)["']/);
  assert.ok(navbarMatch, 'Navbar.jsx phải có header inner <div>');
  assert.ok(navbarMatch[1].includes('max-w-[1240px]'), 'Navbar inner div thiếu max-w-[1240px]');
  assert.ok(navbarMatch[1].includes('px-4 sm:px-6 lg:px-8'), 'Navbar inner div thiếu px-4 sm:px-6 lg:px-8');

  // 4. ToolContainer inner container phải có max-w-[1240px] và px-4 sm:px-6 lg:px-8
  const tcMatch = toolContainerSrc.match(/<header[\s\S]*?<div[^>]*className=["']([^"']+)["']/);
  assert.ok(tcMatch, 'ToolContainer.jsx phải có header inner <div>');
  assert.ok(tcMatch[1].includes('max-w-[1240px]'), 'ToolContainer inner div thiếu max-w-[1240px]');
  assert.ok(tcMatch[1].includes('px-4 sm:px-6 lg:px-8'), 'ToolContainer inner div thiếu px-4 sm:px-6 lg:px-8');
});

/**
 * Kiểm tra 12 Shortcut trang chủ:
 * - Chia đều cho 3 domain (mỗi domain đúng 4 shortcut)
 * - Tất cả 12 toolId đều phải tồn tại trong toolsRegistry.js
 * - Mỗi shortcut phải có đủ tên đa ngữ (VI, EN, JA) và icon
 */
test('Homepage Quick Shortcuts: 12 shortcuts across 3 domains are all valid and registered', async () => {
  const { DOMAIN_SHORTCUTS } = await import('../src/config/domainShortcuts.js');
  const { iconMap } = await import('../src/config/toolIcons.js');
  const validToolIds = new Set(tools.map((t) => t.id));

  const expectedDomains = ['common', 'japan-life', 'vietnam-life'];
  for (const domain of expectedDomains) {
    const list = DOMAIN_SHORTCUTS[domain];
    assert.ok(Array.isArray(list), `DOMAIN_SHORTCUTS.${domain} phải là một mảng`);
    assert.equal(list.length, 4, `Domain "${domain}" phải có đúng 4 shortcut`);

    for (const item of list) {
      assert.ok(validToolIds.has(item.id), `Shortcut ID "${item.id}" không tồn tại trong toolsRegistry.js`);
      const toolInRegistry = tools.find((t) => t.id === item.id);
      assert.ok(toolInRegistry, `Shortcut "${item.id}" không tìm thấy trong toolsRegistry.js`);
      assert.equal(
        item.icon,
        toolInRegistry.icon,
        `Shortcut "${item.id}" icon "${item.icon}" không khớp với icon miniapp "${toolInRegistry.icon}" trong toolsRegistry.js`
      );
      assert.ok(item.icon, `Shortcut "${item.id}" thiếu icon`);
      assert.ok(iconMap[item.icon], `Shortcut "${item.id}" có icon "${item.icon}" chưa có trong iconMap`);
      assert.ok(item.names?.vi, `Shortcut "${item.id}" thiếu tên tiếng Việt`);
      assert.ok(item.names?.en, `Shortcut "${item.id}" thiếu tên tiếng Anh`);
      assert.ok(item.names?.ja, `Shortcut "${item.id}" thiếu tên tiếng Nhật`);
    }
  }
});

