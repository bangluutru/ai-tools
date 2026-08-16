import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  IN_DEVELOPMENT,
  activeTools,
  inDevelopmentTools,
  tools,
} from '../src/config/toolsRegistry.js';

const PAUSED_TOOL_IDS = [
  'certificate-studio',
  'contract-auditor',
  'legal-studio',
  'long-translator',
  'pdf-overlay',
  'policy-assistant',
];


test('every miniapp declares readiness, processing mode and output purpose', () => {
  assert.equal(tools.length, 17);
  for (const tool of tools) {
    assert.match(tool.readiness, /^(beta|experimental|in-development)$/);
    // Trạng thái quyết định miniapp nằm nhóm nào, nên không dùng cờ ẩn riêng nữa.
    assert.equal(tool.defaultVisible, undefined, `${tool.id} không cần defaultVisible`);
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
    'omniconvert',
    'invoice-webapp',
    'image-convert',
  ]);
});


test('paused miniapps stay in the in-development area with a stated reason', () => {
  assert.deepEqual(inDevelopmentTools.map((tool) => tool.id).sort(), PAUSED_TOOL_IDS);

  for (const tool of inDevelopmentTools) {
    assert.equal(tool.readiness, IN_DEVELOPMENT, `${tool.id} must be in-development`);
    assert.equal(
      typeof tool.unavailableReason === 'string' && tool.unavailableReason.length > 0,
      true,
      `${tool.id} must explain why it is paused`,
    );
  }
});


// Mở lại một miniapp trong registry mà quên wire component sẽ khiến deep-link và
// thẻ công cụ rơi im lặng về hub. Kiểm tra hai danh sách luôn khớp nhau.
test('every active miniapp is wired to a lazy-loaded component in App.jsx', () => {
  const appSource = readFileSync(
    fileURLToPath(new URL('../src/App.jsx', import.meta.url)),
    'utf8',
  );
  const mapBlock = /const toolComponentMap = \{([\s\S]*?)\n\};/.exec(appSource);
  assert.notEqual(mapBlock, null, 'toolComponentMap literal not found in App.jsx');

  const wiredIds = [...mapBlock[1].matchAll(/'([a-z0-9-]+)':/g)].map((match) => match[1]);

  assert.deepEqual(
    wiredIds.slice().sort(),
    activeTools.map((tool) => tool.id).sort(),
    'toolComponentMap must contain exactly the active miniapps',
  );
  for (const toolId of PAUSED_TOOL_IDS) {
    assert.equal(wiredIds.includes(toolId), false, `${toolId} must stay out of the bundle`);
  }
});
