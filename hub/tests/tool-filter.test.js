import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ALL_CATEGORY,
  IN_DEVELOPMENT_CATEGORY,
  ALL_GROUPS,
  partitionTools,
  toolsForCategory,
  visibleCategoryIds,
  toolsForGroup,
  visibleGroupIds,
  filterTools,
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


test('toolsForGroup and visibleGroupIds accurately filter tools by product group', () => {
  const visibleGroups = visibleGroupIds(tools);
  assert.equal(visibleGroups.has('all'), true);
  assert.equal(visibleGroups.has('common'), true);
  assert.equal(visibleGroups.has('japan-life'), true);
  // vietnam-life has no tools yet, so it must not be in visibleGroupIds
  assert.equal(visibleGroups.has('vietnam-life'), false, 'Empty groups must not pollute visibleGroupIds');

  const japanTools = toolsForGroup(tools, 'japan-life');
  assert.deepEqual(
    japanTools.map((t) => t.id).sort(),
    ['japan-tax-simulator', 'social-insurance-jp', 'social-insurance-eligibility-jp', 'national-pension-jp', 'dependent-insurance-jp', 'overtime-calculator-jp', 'paid-leave-checker-jp', 'unemployment-eligibility-jp', 'unemployment-benefit-jp', 'leaving-job-wizard-jp', 'maternity-allowance-jp', 'childcare-leave-eligibility-jp', 'childcare-benefit-jp', 'child-allowance-jp', 'birth-wizard-jp', 'moving-cost-jp', 'moving-admin-checker-jp'].sort()
  );

  const commonTools = toolsForGroup(tools, 'common');
  assert.equal(commonTools.length, 18);
  assert.equal(commonTools.every((t) => t.group === 'common'), true);

  const allTools = toolsForGroup(tools, ALL_GROUPS);
  assert.equal(allTools.length, 35);

  // filterTools combined
  const officeJapan = filterTools(tools, { category: 'office', group: 'japan-life' });
  assert.deepEqual(
    officeJapan.map((t) => t.id).sort(),
    ['japan-tax-simulator', 'social-insurance-jp', 'social-insurance-eligibility-jp', 'national-pension-jp', 'dependent-insurance-jp', 'overtime-calculator-jp', 'paid-leave-checker-jp', 'unemployment-eligibility-jp', 'unemployment-benefit-jp', 'leaving-job-wizard-jp', 'maternity-allowance-jp', 'childcare-leave-eligibility-jp', 'childcare-benefit-jp', 'child-allowance-jp', 'birth-wizard-jp', 'moving-cost-jp', 'moving-admin-checker-jp'].sort()
  );

  const officeCommon = filterTools(tools, { category: 'office', group: 'common' });
  assert.equal(officeCommon.some((t) => t.id === 'japan-tax-simulator'), false);
  assert.equal(officeCommon.some((t) => t.id === 'tax-calculator'), true);
});

test('search finds Japan Insurance and Employment miniapps across ja, en, and vi keywords', () => {
  function search(query) {
    const q = query.toLowerCase().trim();
    return tools.filter((t) => {
      const text = [
        t.name_vn, t.name_en, t.name_ja,
        t.desc_vn, t.desc_en, t.desc_ja,
        t.id, t.category, t.group,
        ...(Array.isArray(t.tags) ? t.tags : []),
      ].filter(Boolean).join(' ').toLowerCase();
      return text.includes(q);
    });
  }

  // 有給
  const yukyu = search('有給');
  assert.ok(yukyu.some((t) => t.id === 'paid-leave-checker-jp'));

  // paid leave
  const pl = search('paid leave');
  assert.ok(pl.some((t) => t.id === 'paid-leave-checker-jp'));

  // phép năm
  const pn = search('phép năm');
  assert.ok(pn.some((t) => t.id === 'paid-leave-checker-jp'));

  // 残業
  const zangyou = search('残業');
  assert.ok(zangyou.some((t) => t.id === 'overtime-calculator-jp'));

  // overtime
  const ot = search('overtime');
  assert.ok(ot.some((t) => t.id === 'overtime-calculator-jp'));

  // tăng ca
  const tc = search('tăng ca');
  assert.ok(tc.some((t) => t.id === 'overtime-calculator-jp'));

  // 社会保険
  const shakaiHoken = search('社会保険');
  assert.ok(shakaiHoken.some((t) => t.id === 'social-insurance-jp'));
  assert.ok(shakaiHoken.some((t) => t.id === 'social-insurance-eligibility-jp'));
  assert.ok(shakaiHoken.some((t) => t.id === 'dependent-insurance-jp'));

  // 年金
  const nenkin = search('年金');
  assert.ok(nenkin.some((t) => t.id === 'national-pension-jp'));
  assert.ok(nenkin.some((t) => t.id === 'social-insurance-jp'));

  // 扶養
  const fuyou = search('扶養');
  assert.ok(fuyou.some((t) => t.id === 'dependent-insurance-jp'));

  // insurance
  const ins = search('insurance');
  assert.ok(ins.some((t) => t.id === 'social-insurance-jp'));
  assert.ok(ins.some((t) => t.id === 'social-insurance-eligibility-jp'));
  assert.ok(ins.some((t) => t.id === 'dependent-insurance-jp'));

  // pension
  const pen = search('pension');
  assert.ok(pen.some((t) => t.id === 'national-pension-jp'));
  assert.ok(pen.some((t) => t.id === 'social-insurance-jp'));

  // bảo hiểm
  const bh = search('bảo hiểm');
  assert.ok(bh.some((t) => t.id === 'social-insurance-jp'));
  assert.ok(bh.some((t) => t.id === 'social-insurance-eligibility-jp'));
  assert.ok(bh.some((t) => t.id === 'national-pension-jp'));
  assert.ok(bh.some((t) => t.id === 'dependent-insurance-jp'));

  // lương hưu
  const lh = search('lương hưu');
  assert.ok(lh.some((t) => t.id === 'national-pension-jp'));
  assert.ok(lh.some((t) => t.id === 'social-insurance-jp'));

  // 失業
  const shitsugyou = search('失業');
  assert.ok(shitsugyou.some((t) => t.id === 'unemployment-eligibility-jp'));
  assert.ok(shitsugyou.some((t) => t.id === 'unemployment-benefit-jp'));

  // thất nghiệp
  const thatNghiep = search('thất nghiệp');
  assert.ok(thatNghiep.some((t) => t.id === 'unemployment-eligibility-jp'));
  assert.ok(thatNghiep.some((t) => t.id === 'unemployment-benefit-jp'));

  // unemployment
  const unemp = search('unemployment');
  assert.ok(unemp.some((t) => t.id === 'unemployment-eligibility-jp'));
  assert.ok(unemp.some((t) => t.id === 'unemployment-benefit-jp'));

  // 退職
  const taishoku = search('退職');
  assert.ok(taishoku.some((t) => t.id === 'leaving-job-wizard-jp'));

  // resignation
  const resig = search('resignation');
  assert.ok(resig.some((t) => t.id === 'leaving-job-wizard-jp'));

  // nghỉ việc
  const nghiViec = search('nghỉ việc');
  assert.ok(nghiViec.some((t) => t.id === 'leaving-job-wizard-jp'));

  // 出産育児一時金
  const birthGrant = search('出産育児一時金');
  assert.ok(birthGrant.some((t) => t.id === 'birth-wizard-jp'));

  // mang thai
  const mangThai = search('mang thai');
  assert.ok(mangThai.some((t) => t.id === 'birth-wizard-jp'));

  // birth wizard
  const birthWiz = search('birth wizard');
  assert.ok(birthWiz.some((t) => t.id === 'birth-wizard-jp'));
});


