import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ALL_CATEGORY,
  IN_DEVELOPMENT_CATEGORY,
  partitionTools,
  toolsForCategory,
  visibleCategoryIds,
} from '../src/utils/toolFilter.js';
import { tools } from '../src/config/toolsRegistry.js';

const registry = [
  { id: 'pdf-a', category: 'pdf', readiness: 'beta' },
  { id: 'pdf-b', category: 'pdf', readiness: 'experimental' },
  { id: 'office-a', category: 'office', readiness: 'beta' },
  { id: 'ai-paused', category: 'ai', readiness: 'in-development' },
  { id: 'pdf-paused', category: 'pdf', readiness: 'in-development' },
];

const ids = (list) => list.map((tool) => tool.id).sort();


test('paused miniapps are kept out of every ordinary category', () => {
  assert.deepEqual(ids(toolsForCategory(registry, 'pdf')), ['pdf-a', 'pdf-b']);
  assert.deepEqual(ids(toolsForCategory(registry, 'ai')), []);
  assert.deepEqual(ids(toolsForCategory(registry, 'office')), ['office-a']);
});


test('paused miniapps are kept out of "Tất cả công cụ" as well', () => {
  const all = ids(toolsForCategory(registry, ALL_CATEGORY));

  assert.deepEqual(all, ['office-a', 'pdf-a', 'pdf-b']);
  assert.equal(all.includes('ai-paused'), false);
  assert.equal(all.includes('pdf-paused'), false);
});


test('the in-development group lists exactly the paused miniapps', () => {
  assert.deepEqual(ids(toolsForCategory(registry, IN_DEVELOPMENT_CATEGORY)), ['ai-paused', 'pdf-paused']);
});


// Nhóm này là lời nhắc, nên tùy chọn ẩn của người dùng không được làm nó biến mất.
test('hiding tools never removes a paused miniapp from its own group', () => {
  const hidden = ['pdf-a', 'ai-paused', 'pdf-paused'];

  assert.deepEqual(ids(toolsForCategory(registry, IN_DEVELOPMENT_CATEGORY, hidden)), ['ai-paused', 'pdf-paused']);
  assert.deepEqual(ids(toolsForCategory(registry, ALL_CATEGORY, hidden)), ['office-a', 'pdf-b']);
});


test('a category tab only shows when it still holds something', () => {
  const shown = visibleCategoryIds(registry);
  assert.equal(shown.has(ALL_CATEGORY), true);
  assert.equal(shown.has('pdf'), true);
  assert.equal(shown.has('office'), true);
  assert.equal(shown.has(IN_DEVELOPMENT_CATEGORY), true);
  // Nhóm ai chỉ còn miniapp tạm dừng nên không còn tab riêng.
  assert.equal(shown.has('ai'), false);

  const noPaused = visibleCategoryIds(registry.filter((tool) => tool.readiness !== 'in-development'));
  assert.equal(noPaused.has(IN_DEVELOPMENT_CATEGORY), false);
});


test('partitionTools splits the registry into two disjoint sets', () => {
  const { active, inDevelopment } = partitionTools(registry);
  const overlap = active.filter((tool) => inDevelopment.some((paused) => paused.id === tool.id));

  assert.deepEqual(overlap, []);
  assert.equal(active.length + inDevelopment.length, registry.length);
});


test('against the real registry, the AI category is now empty of openable tools', () => {
  // Cả bốn miniapp dịch thuật/pháp lý đều đang tạm dừng.
  assert.deepEqual(toolsForCategory(tools, 'ai'), []);
  assert.equal(visibleCategoryIds(tools).has('ai'), false);

  const paused = toolsForCategory(tools, IN_DEVELOPMENT_CATEGORY).map((tool) => tool.id).sort();
  assert.deepEqual(paused, [
    'certificate-studio',
    'contract-auditor',
    'legal-studio',
    'long-translator',
    'pdf-overlay',
    'policy-assistant',
  ]);

  for (const tool of toolsForCategory(tools, ALL_CATEGORY)) {
    assert.notEqual(tool.readiness, 'in-development', `${tool.id} lọt vào nhóm Tất cả công cụ`);
  }
});
