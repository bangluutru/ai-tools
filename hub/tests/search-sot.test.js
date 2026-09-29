/**
 * Test canh: mọi ô tìm kiếm/lọc của Toolio là ô của gói dùng chung @chotto/search.
 *
 * Trước khi có gói, mỗi miniapp một ô, mỗi ô một kiểu lỗi: ô này không bỏ dấu, ô kia
 * không có phím ↑/↓, bảng lệnh ⌘K ghi "Nhấn ESC để đóng" mà không có handler Esc,
 * hub có hai handler ⌘K trùng nhau. Viết tay lại một <input> tìm kiếm là quay về chỗ đó.
 * Cần hành vi mới thì thêm vào gói (bangluutru/chotto-search) rồi nâng tag.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { NAVIGATE_EVENT } from '../src/utils/navigation.js';
import { TOOLIO_NAVIGATE_EVENT, searchLabels } from '@ai-tools/core/search/toolioSearch.js';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

// Ô được phép giữ lại, kèm lý do. Gói thiếu khả năng nào thì ghi
// `TODO(@chotto/search): …` ở đây và báo lại để thêm vào gói — đừng tự viết ô.
// Hiện chưa có ô nào cần ngoại lệ. Dạng: ['đường/dẫn/File.jsx', 'lý do'].
const ALLOWED = new Map([]);

const SOURCE_DIRS = ['hub/src', 'packages/core/src', 'standalone'];

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    if (name === 'node_modules' || name === 'dist' || name.startsWith('.')) return [];
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : /\.(jsx?|tsx?)$/.test(name) ? [p] : [];
  });
}

const files = SOURCE_DIRS.flatMap((d) => walk(join(repoRoot, d))).map((abs) => ({
  rel: relative(repoRoot, abs),
  code: readFileSync(abs, 'utf8'),
}));

test('không có ô tìm kiếm viết tay (type/role search, combobox)', () => {
  const offenders = files
    .filter(({ rel }) => !ALLOWED.has(rel))
    .filter(({ code }) => /type=["']search["']|role=["']search["']|role=["']combobox["']/.test(code))
    .map(({ rel }) => rel);
  assert.deepEqual(offenders, []);
});

test('không có <input> tìm/lọc viết tay (Toolio cũ dùng type="text" + placeholder "Tìm…")', () => {
  const INPUT = /<input\b[\s\S]*?\/>/g; // [^>] không được: onChange={(e) => …} có dấu >
  const SEARCHY = /search|query|tìm|lọc|filter|検索|絞り込み/i;
  // Ô tích, số, ngày… không phải ô tìm, dù tên state có chữ "filter".
  const NOT_TEXT = /type=["'](checkbox|radio|file|number|range|color|date|datetime-local|month|time|hidden|password|email|tel)["']/;
  const offenders = [];
  for (const { rel, code } of files) {
    if (ALLOWED.has(rel)) continue;
    for (const m of code.matchAll(INPUT)) {
      if (SEARCHY.test(m[0]) && !NOT_TEXT.test(m[0])) offenders.push(`${rel}:${code.slice(0, m.index).split('\n').length}`);
    }
  }
  assert.deepEqual(offenders, []);
});

test('@chotto/search cài từ repo dùng chung, ghim theo tag, cùng tag ở hub và core', () => {
  const spec = (p) => JSON.parse(readFileSync(join(repoRoot, p), 'utf8')).dependencies?.['@chotto/search'] || '';
  const hub = spec('hub/package.json');
  const core = spec('packages/core/package.json');
  assert.match(hub, /^github:bangluutru\/chotto-search#v\d+\.\d+\.\d+$/);
  assert.equal(core, hub);
});

test('hook nối đóng ô khi đổi trang: nghe đúng sự kiện điều hướng của hub', () => {
  assert.equal(TOOLIO_NAVIGATE_EVENT, NAVIGATE_EVENT);
});

test('nhãn của gói theo đủ ba ngôn ngữ Toolio', () => {
  for (const lang of ['vi', 'en', 'ja']) {
    const l = searchLabels(lang);
    assert.equal(typeof l.empty('x'), 'string');
    assert.equal(typeof l.seeAll('x'), 'string');
    assert.ok(l.clear);
  }
  assert.equal(searchLabels('vn'), searchLabels('vi'), 'DocStudio dùng mã vn');
  assert.notEqual(searchLabels('ja').clear, searchLabels('vi').clear);
});

test('hub chỉ có MỘT handler ⌘K, và không tìm ô bằng querySelector', () => {
  const app = readFileSync(join(repoRoot, 'hub/src/App.jsx'), 'utf8');
  const navbar = readFileSync(join(repoRoot, 'hub/src/components/Navbar.jsx'), 'utf8');
  assert.doesNotMatch(app, /querySelector\(['"][^'"]*input/);
  assert.doesNotMatch(navbar, /addEventListener\(['"]keydown/);
});
