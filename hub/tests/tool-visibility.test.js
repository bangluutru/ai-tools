import assert from 'node:assert/strict';
import test from 'node:test';

import {
  TOOL_VISIBILITY_STORAGE_KEY,
  defaultHiddenToolIds,
  loadHiddenToolIds,
  normalizeHiddenToolIds,
  saveHiddenToolIds,
} from '../src/utils/toolVisibility.js';

const registry = [
  { id: 'visible' },
  { id: 'paused', defaultVisible: false },
];

test('uses registry defaults when no valid preference exists', () => {
  assert.deepEqual(defaultHiddenToolIds(registry), ['paused']);
  assert.deepEqual(loadHiddenToolIds({ getItem: () => null }, registry), ['paused']);
  assert.deepEqual(loadHiddenToolIds({ getItem: () => '{broken' }, registry), ['paused']);
});

test('keeps only unique miniapp ids that still exist', () => {
  assert.deepEqual(
    normalizeHiddenToolIds(['visible', 'missing', 'visible'], registry),
    ['visible'],
  );
});

test('persists the hidden miniapp list under a versioned key', () => {
  const writes = [];
  saveHiddenToolIds({ setItem: (...args) => writes.push(args) }, ['visible']);
  assert.deepEqual(writes, [[TOOL_VISIBILITY_STORAGE_KEY, '["visible"]']]);
});
