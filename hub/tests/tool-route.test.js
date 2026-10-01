import test from 'node:test';
import assert from 'node:assert/strict';

import { resolveToolId, toolHash, toolUrl } from '../src/utils/toolRoute.js';

const registry = [
  { id: 'ready-tool', readiness: 'beta' },
  { id: 'paused-tool', readiness: 'in-development' },
  { id: 'pdf-toolkit', readiness: 'beta' },
  { id: 'invoice-studio', readiness: 'beta' },
];

test('resolves only known and available miniapp routes', () => {
  assert.equal(resolveToolId('#/tools/ready-tool', registry), 'ready-tool');
  assert.equal(resolveToolId('#/tools/paused-tool', registry), null);
  assert.equal(resolveToolId('#/tools/missing-tool', registry), null);
  assert.equal(resolveToolId('#/tools/pdf-toolkit', registry), 'pdf-toolkit');
  assert.equal(resolveToolId('#/tools/invoice-studio', registry), 'invoice-studio');
  assert.equal(resolveToolId('#/other/ready-tool', registry), null);
});

test('legacy tool URLs redirect to new merged/renamed tools', () => {
  assert.equal(resolveToolId('#/tools/pdf-split', registry), 'pdf-toolkit');
  assert.equal(resolveToolId('#/tools/pdf-merge', registry), 'pdf-toolkit');
  assert.equal(resolveToolId('#/tools/pdf-compress', registry), 'pdf-toolkit');
  assert.equal(resolveToolId('#/tools/invoice-webapp', registry), 'invoice-studio');
});

test('resolves routes with query parameters (tab hint)', () => {
  assert.equal(resolveToolId('#/tools/pdf-toolkit?tab=merge', registry), 'pdf-toolkit');
  assert.equal(resolveToolId('#/tools/ready-tool?foo=bar', registry), 'ready-tool');
});

test('builds static-host-compatible hash URLs without dropping query parameters', () => {
  assert.equal(toolHash('ready-tool'), '#/tools/ready-tool');
  assert.equal(toolHash(null), '');
  assert.equal(
    toolUrl({ pathname: '/portal/', search: '?lang=vi' }, 'ready-tool'),
    '/portal/?lang=vi#/tools/ready-tool'
  );
});
