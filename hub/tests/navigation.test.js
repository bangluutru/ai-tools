import assert from 'node:assert/strict';
import test from 'node:test';
import { tools, activeTools } from '../src/config/toolsRegistry.js';
import { resolveHubRoute } from '../src/utils/hubRoute.js';
import { routeKey, hashToPath, toolPath, buildDomainPath } from '../src/utils/navigation.js';
import { getRouteMeta } from '../src/utils/routeMeta.js';

const loc = (pathname, search = '', hash = '') => ({ pathname, search, hash });

test('routeKey maps real paths to the hash-shaped key the resolvers expect', () => {
  assert.equal(routeKey(loc('/')), '#/');
  assert.equal(routeKey(loc('/tools/pdf-toolkit')), '#/tools/pdf-toolkit');
  assert.equal(routeKey(loc('/tools/pdf-toolkit/')), '#/tools/pdf-toolkit');
  assert.equal(routeKey(loc('/tools/pdf-toolkit', '?tab=merge')), '#/tools/pdf-toolkit?tab=merge');
  assert.equal(routeKey(loc('/japan-life', '?domain=tax')), '#/japan-life?domain=tax');
});

test('routeKey prefers a legacy hash route over the pathname', () => {
  assert.equal(routeKey(loc('/', '', '#/tools/barcode-qr')), '#/tools/barcode-qr');
  assert.equal(routeKey(loc('/tools/pdf-toolkit', '', '#')), '#/tools/pdf-toolkit');
});

test('path routes resolve exactly like the old hash routes', () => {
  assert.deepEqual(resolveHubRoute(routeKey(loc('/tools/residence-renewal-guide-jp')), tools), {
    type: 'tool',
    toolId: 'residence-renewal-guide-jp',
  });
  assert.deepEqual(resolveHubRoute(routeKey(loc('/tools', '?category=pdf')), tools), {
    type: 'domain',
    domain: 'common',
    filter: 'pdf',
  });
  assert.equal(resolveHubRoute(routeKey(loc('/vietnam-life')), tools).domain, 'vietnam-life');
  assert.deepEqual(resolveHubRoute(routeKey(loc('/tools/does-not-exist')), tools), { type: 'home' });
  // Legacy merged id still redirects.
  assert.equal(resolveHubRoute(routeKey(loc('/tools/pdf-merge')), tools).toolId, 'pdf-toolkit');
});

test('hashToPath upgrades hub hash links, including chottoday deep links with ref params', () => {
  assert.equal(hashToPath('#/tools/pdf-toolkit'), '/tools/pdf-toolkit');
  assert.equal(
    hashToPath('#/tools/japan-tax-simulator?ref=chottoday&source=article'),
    '/tools/japan-tax-simulator?ref=chottoday&source=article',
  );
  assert.equal(hashToPath('#/'), '/');
  assert.equal(hashToPath('#/japan-life?domain=tax'), '/japan-life?domain=tax');
  assert.equal(hashToPath('#section-2'), null, 'in-page anchors are left alone');
  assert.equal(hashToPath('#/assets/x.js'), null);
});

test('path builders mirror the old hash builders', () => {
  assert.equal(toolPath('barcode-qr'), '/tools/barcode-qr');
  assert.equal(buildDomainPath('home'), '/');
  assert.equal(buildDomainPath('common', 'all'), '/tools');
  assert.equal(buildDomainPath('common', 'pdf'), '/tools?category=pdf');
  assert.equal(buildDomainPath('japan-life', 'tax'), '/japan-life?domain=tax');
});

test('every active tool has route meta with a canonical /tools/<id> URL', () => {
  for (const tool of activeTools) {
    const meta = getRouteMeta({ type: 'tool', toolId: tool.id }, tools);
    assert.equal(meta.url, `https://toolio.chottoday.com/tools/${tool.id}`);
    assert.ok(meta.title.startsWith(tool.name_vn), tool.id);
    assert.ok(meta.description.length > 20 && meta.description.length <= 160, `${tool.id} description length`);
  }
  assert.equal(getRouteMeta({ type: 'home' }, tools).url, 'https://toolio.chottoday.com/');
  assert.equal(getRouteMeta({ type: 'domain', domain: 'common' }, tools).url, 'https://toolio.chottoday.com/tools');
});
