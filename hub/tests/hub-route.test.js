import test from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveHubRoute,
  buildDomainHash,
  parseHashQueryParam,
  saveLastBrowseContext,
  getLastBrowseContext,
} from '../src/utils/hubRoute.js';

const mockRegistry = [
  { id: 'image-convert', readiness: 'production', group: 'common', category: 'image' },
  { id: 'pdf-toolkit', readiness: 'production', group: 'common', category: 'pdf' },
  { id: 'japan-life-navigator', readiness: 'production', group: 'japan-life', domain: 'navigator' },
  { id: 'japan-tax-simulator', readiness: 'production', group: 'japan-life', domain: 'tax' },
  { id: 'in-dev-tool', readiness: 'in-development', group: 'common' },
];

test('hubRoute: resolves home routes correctly', () => {
  assert.deepEqual(resolveHubRoute('', mockRegistry), { type: 'home' });
  assert.deepEqual(resolveHubRoute('#', mockRegistry), { type: 'home' });
  assert.deepEqual(resolveHubRoute('#/', mockRegistry), { type: 'home' });
  assert.deepEqual(resolveHubRoute('#/unknown-page', mockRegistry), { type: 'home' });
});

test('hubRoute: resolves top-level domain routes and canonicalizes tools to common', () => {
  assert.deepEqual(resolveHubRoute('#/tools', mockRegistry), {
    type: 'domain',
    domain: 'common',
    filter: 'all',
  });
  assert.deepEqual(resolveHubRoute('#/common', mockRegistry), {
    type: 'domain',
    domain: 'common',
    filter: 'all',
  });
  assert.deepEqual(resolveHubRoute('#/japan-life', mockRegistry), {
    type: 'domain',
    domain: 'japan-life',
    filter: 'all',
  });
  assert.deepEqual(resolveHubRoute('#/vietnam-life', mockRegistry), {
    type: 'domain',
    domain: 'vietnam-life',
    filter: 'all',
  });
});

test('hubRoute: resolves domain routes with query filters', () => {
  assert.deepEqual(resolveHubRoute('#/tools?category=pdf', mockRegistry), {
    type: 'domain',
    domain: 'common',
    filter: 'pdf',
  });
  assert.deepEqual(resolveHubRoute('#/japan-life?domain=tax', mockRegistry), {
    type: 'domain',
    domain: 'japan-life',
    filter: 'tax',
  });
  assert.deepEqual(resolveHubRoute('#/japan-life?domain=employment', mockRegistry), {
    type: 'domain',
    domain: 'japan-life',
    filter: 'employment',
  });
});

test('hubRoute: delegates miniapp routes to toolRoute without regression', () => {
  assert.deepEqual(resolveHubRoute('#/tools/pdf-toolkit', mockRegistry), {
    type: 'tool',
    toolId: 'pdf-toolkit',
  });
  assert.deepEqual(resolveHubRoute('#/tools/japan-tax-simulator', mockRegistry), {
    type: 'tool',
    toolId: 'japan-tax-simulator',
  });
  // In-development tools are not resolved as active tools
  assert.deepEqual(resolveHubRoute('#/tools/in-dev-tool', mockRegistry), {
    type: 'home',
  });
});

test('hubRoute: buildDomainHash constructs clean, static-host compatible hashes', () => {
  assert.equal(buildDomainHash('home'), '#/');
  assert.equal(buildDomainHash('common'), '#/tools');
  assert.equal(buildDomainHash('common', 'all'), '#/tools');
  assert.equal(buildDomainHash('common', 'pdf'), '#/tools?category=pdf');
  assert.equal(buildDomainHash('japan-life'), '#/japan-life');
  assert.equal(buildDomainHash('japan-life', 'all'), '#/japan-life');
  assert.equal(buildDomainHash('japan-life', 'tax'), '#/japan-life?domain=tax');
  assert.equal(buildDomainHash('vietnam-life'), '#/vietnam-life');
});

test('hubRoute: parseHashQueryParam handles query strings properly', () => {
  assert.equal(parseHashQueryParam('#/tools?category=office', 'category'), 'office');
  assert.equal(parseHashQueryParam('#/japan-life?domain=housing', 'domain'), 'housing');
  assert.equal(parseHashQueryParam('#/japan-life', 'domain'), null);
  assert.equal(parseHashQueryParam('', 'domain'), null);
});
