import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ALL_CATEGORY,
  partitionTools,
  toolsForCategory,
  visibleCategoryIds,
} from '../src/utils/toolFilter.js';
import { tools } from '../src/config/toolsRegistry.js';

const registry = [
  { id: 'pdf-a', category: 'pdf', readiness: 'beta' },
  { id: 'pdf-b', category: 'pdf', readiness: 'experimental' },
  { id: 'office-a', category: 'office', readiness: 'beta' },
];

const ids = (list) => list.map((tool) => tool.id).sort();


test('ordinary categories return only matching visible miniapps', () => {
  assert.deepEqual(ids(toolsForCategory(registry, 'pdf')), ['pdf-a', 'pdf-b']);
  assert.deepEqual(ids(toolsForCategory(registry, 'ai')), []);
  assert.deepEqual(ids(toolsForCategory(registry, 'office')), ['office-a']);
});


test('all category returns every visible miniapp', () => {
  const all = ids(toolsForCategory(registry, ALL_CATEGORY));

  assert.deepEqual(all, ['office-a', 'pdf-a', 'pdf-b']);
});


test('a category tab only shows when it still holds something', () => {
  const shown = visibleCategoryIds(registry);
  assert.equal(shown.has(ALL_CATEGORY), true);
  assert.equal(shown.has('pdf'), true);
  assert.equal(shown.has('office'), true);
  assert.equal(shown.has('ai'), false);
});


test('partitionTools applies locally hidden tool IDs', () => {
  const { active } = partitionTools(registry, ['pdf-b']);
  assert.deepEqual(ids(active), ['office-a', 'pdf-a']);
});


test('the real registry has no archived AI miniapp', () => {
  assert.deepEqual(toolsForCategory(tools, 'ai'), []);
  assert.equal(visibleCategoryIds(tools).has('ai'), false);
  assert.equal(toolsForCategory(tools, ALL_CATEGORY).length, tools.length);
});
