import test from 'node:test';
import assert from 'node:assert/strict';

import { resolveToolId, toolHash, toolUrl } from '../src/utils/toolRoute.js';

const registry = [
  { id: 'ready-tool', readiness: 'beta' },
  { id: 'locked-tool', readiness: 'disabled' }
];

test('resolves only known and available miniapp routes', () => {
  assert.equal(resolveToolId('#/tools/ready-tool', registry), 'ready-tool');
  assert.equal(resolveToolId('#/tools/locked-tool', registry), null);
  assert.equal(resolveToolId('#/tools/missing-tool', registry), null);
  assert.equal(resolveToolId('#/other/ready-tool', registry), null);
});

test('builds static-host-compatible hash URLs without dropping query parameters', () => {
  assert.equal(toolHash('ready-tool'), '#/tools/ready-tool');
  assert.equal(toolHash(null), '');
  assert.equal(
    toolUrl({ pathname: '/portal/', search: '?lang=vi' }, 'ready-tool'),
    '/portal/?lang=vi#/tools/ready-tool'
  );
});
