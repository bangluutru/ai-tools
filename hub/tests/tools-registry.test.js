import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  IN_DEVELOPMENT,
  activeTools,
  inDevelopmentTools,
  tools,
  TOOL_GROUPS,
  getToolGroup,
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
  assert.ok(tools.length >= 18, 'Cần có tối thiểu 18 miniapps');
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
  const prioritised = tools.filter((tool) => tool.priority);
  const priorities = prioritised
    .slice()
    .sort((left, right) => left.priority - right.priority)
    .map((tool) => tool.id);

  assert.deepEqual(priorities, [
    'accounting-reconcile',
    'invoice-studio',
    'image-convert',
  ]);

  // Test này từng bị nới lỏng để khớp với hai miniapp cùng mang priority 2,
  // nên kiểm tra tính duy nhất tách riêng để lần sau va chạm sẽ báo đỏ.
  const numbers = prioritised.map((tool) => tool.priority);
  assert.deepEqual(numbers.slice().sort(), [1, 2, 3]);
  assert.equal(new Set(numbers).size, numbers.length, 'mỗi mức ưu tiên chỉ thuộc về một miniapp');
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


test('TOOL_GROUPS defines standardized multilingual product and domain groups', () => {
  assert.ok(TOOL_GROUPS.common, 'Must define common group');
  assert.ok(TOOL_GROUPS['japan-life'], 'Must define japan-life group');
  assert.ok(TOOL_GROUPS['vietnam-life'], 'Must define vietnam-life group');

  for (const [groupId, group] of Object.entries(TOOL_GROUPS)) {
    assert.equal(group.id, groupId);
    assert.ok(group.name.vi, `${groupId} must have name.vi`);
    assert.ok(group.name.en, `${groupId} must have name.en`);
    assert.ok(group.name.ja, `${groupId} must have name.ja`);
  }

  assert.equal(TOOL_GROUPS['japan-life'].country, 'JP');
  assert.equal(TOOL_GROUPS['vietnam-life'].country, 'VN');
});


test('every miniapp has a valid product group defaulting safely to common', () => {
  const allowedGroups = Object.keys(TOOL_GROUPS);
  for (const tool of tools) {
    assert.ok(tool.group, `${tool.id} must have a group`);
    assert.ok(
      allowedGroups.includes(tool.group),
      `${tool.id} has invalid group: ${tool.group}`,
    );
    assert.equal(getToolGroup(tool), tool.group);

    // Group-country consistency
    if (tool.group === 'japan-life') {
      assert.equal(tool.country, 'JP', `${tool.id} in japan-life must have country JP`);
    } else if (tool.group === 'vietnam-life') {
      assert.equal(tool.country, 'VN', `${tool.id} in vietnam-life must have country VN`);
    }

    if (tool.regulatory !== undefined) {
      assert.equal(typeof tool.regulatory, 'boolean', `${tool.id} regulatory must be boolean`);
    }
  }

  // Japan Life tools
  const japanLifeTools = tools.filter((t) => t.group === 'japan-life');
  assert.deepEqual(
    japanLifeTools.map((t) => t.id).sort(),
    ['japan-tax-simulator', 'social-insurance-jp', 'social-insurance-eligibility-jp', 'national-pension-jp', 'dependent-insurance-jp', 'overtime-calculator-jp', 'paid-leave-checker-jp', 'unemployment-eligibility-jp', 'unemployment-benefit-jp', 'leaving-job-wizard-jp'].sort(),
    'japan-life group contains japan-tax-simulator, social-insurance-jp, social-insurance-eligibility-jp, national-pension-jp, dependent-insurance-jp, overtime-calculator-jp, paid-leave-checker-jp, unemployment-eligibility-jp, unemployment-benefit-jp, and leaving-job-wizard-jp',
  );

  const jTax = tools.find((t) => t.id === 'japan-tax-simulator');
  assert.equal(jTax.group, 'japan-life');
  assert.equal(jTax.country, 'JP');
  assert.equal(jTax.domain, 'tax');
  assert.equal(jTax.type, 'calculator');
  assert.equal(jTax.regulatory, true);

  const jIns = tools.find((t) => t.id === 'social-insurance-jp');
  assert.equal(jIns.group, 'japan-life');
  assert.equal(jIns.country, 'JP');
  assert.equal(jIns.domain, 'insurance');
  assert.equal(jIns.type, 'calculator');
  assert.equal(jIns.regulatory, true);

  const jElig = tools.find((t) => t.id === 'social-insurance-eligibility-jp');
  assert.equal(jElig.group, 'japan-life');
  assert.equal(jElig.country, 'JP');
  assert.equal(jElig.domain, 'insurance');
  assert.equal(jElig.type, 'checker');
  assert.equal(jElig.regulatory, true);

  const jPen = tools.find((t) => t.id === 'national-pension-jp');
  assert.equal(jPen.group, 'japan-life');
  assert.equal(jPen.country, 'JP');
  assert.equal(jPen.domain, 'insurance');
  assert.equal(jPen.type, 'calculator');
  assert.equal(jPen.regulatory, true);

  const jDep = tools.find((t) => t.id === 'dependent-insurance-jp');
  assert.equal(jDep.group, 'japan-life');
  assert.equal(jDep.country, 'JP');
  assert.equal(jDep.domain, 'insurance');
  assert.equal(jDep.type, 'checker');
  assert.equal(jDep.regulatory, true);

  const jOt = tools.find((t) => t.id === 'overtime-calculator-jp');
  assert.equal(jOt.group, 'japan-life');
  assert.equal(jOt.country, 'JP');
  assert.equal(jOt.domain, 'employment');
  assert.equal(jOt.type, 'calculator');
  assert.equal(jOt.regulatory, true);

  const jPl = tools.find((t) => t.id === 'paid-leave-checker-jp');
  assert.equal(jPl.group, 'japan-life');
  assert.equal(jPl.country, 'JP');
  assert.equal(jPl.domain, 'employment');
  assert.equal(jPl.type, 'checker');
  assert.equal(jPl.regulatory, true);

  // All other tools must be in common group
  const commonTools = tools.filter((t) => t.group === 'common');
  assert.equal(commonTools.length, tools.length - japanLifeTools.length, 'All other tools must default to common');
});

