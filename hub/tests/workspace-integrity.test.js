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
