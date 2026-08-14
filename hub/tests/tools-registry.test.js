import assert from 'node:assert/strict';
import test from 'node:test';

import { tools } from '../src/config/toolsRegistry.js';


test('every miniapp declares readiness, processing mode and output purpose', () => {
  assert.equal(tools.length, 14);
  for (const tool of tools) {
    assert.match(tool.readiness, /^(beta|experimental|disabled)$/);
    assert.match(tool.processing, /^(browser|hybrid|backend-antigravity|manual)$/);
    assert.match(tool.outputPurpose, /^(utility|reference)$/);
    assert.equal(Array.isArray(tool.tags), true);
  }
});


test('the three production priorities are explicit and unique', () => {
  const priorities = tools
    .filter((tool) => tool.priority)
    .sort((left, right) => left.priority - right.priority)
    .map((tool) => tool.id);

  assert.deepEqual(priorities, [
    'accounting-reconcile',
    'invoice-webapp',
    'image-convert',
  ]);
});


test('unsafe or misleading tools stay unavailable until their remediation is complete', () => {
  const disabled = new Set(
    tools.filter((tool) => tool.readiness === 'disabled').map((tool) => tool.id),
  );

  for (const toolId of [
    'pdf-overlay',
    'legal-studio',
    'long-translator',
    'certificate-studio',
    'contract-auditor',
    'policy-assistant',
  ]) {
    assert.equal(disabled.has(toolId), true, `${toolId} must remain disabled`);
  }
});
