import test from 'node:test';
import assert from 'node:assert/strict';
import {
  HUB_DOMAINS,
  getDomainName,
  getDomainConfig,
} from '../src/config/hubPresentation.js';

test('hubPresentation: all 3 Top-Level Domains are properly configured', () => {
  assert.ok(HUB_DOMAINS.common, 'common domain must exist');
  assert.ok(HUB_DOMAINS['japan-life'], 'japan-life domain must exist');
  assert.ok(HUB_DOMAINS['vietnam-life'], 'vietnam-life domain must exist');
});

test('hubPresentation: Trilingual Top-Level Domain names (VI, EN, JA) strictly match specifications', () => {
  // Common (Tools) domain
  assert.equal(getDomainName('common', 'vi'), 'Công cụ');
  assert.equal(getDomainName('common', 'en'), 'Tools');
  assert.equal(getDomainName('common', 'ja'), 'ツール');

  // Japan Life domain
  assert.equal(getDomainName('japan-life', 'vi'), 'Đời sống Nhật Bản');
  assert.equal(getDomainName('japan-life', 'en'), 'Japan Life');
  assert.equal(getDomainName('japan-life', 'ja'), '日本生活');

  // Vietnam Life domain
  assert.equal(getDomainName('vietnam-life', 'vi'), 'Đời sống Việt Nam');
  assert.equal(getDomainName('vietnam-life', 'en'), 'Vietnam Life');
  assert.equal(getDomainName('vietnam-life', 'ja'), 'ベトナム生活');
});

test('hubPresentation: domain subtitles and descriptions have complete trilingual coverage', () => {
  const domains = ['common', 'japan-life', 'vietnam-life'];
  const requiredLangs = ['vi', 'en', 'ja'];

  for (const domainId of domains) {
    const config = getDomainConfig(domainId);
    for (const lang of requiredLangs) {
      assert.ok(config.name[lang], `Domain ${domainId} missing name.${lang}`);
      assert.ok(config.subtitle[lang], `Domain ${domainId} missing subtitle.${lang}`);
      assert.ok(config.description[lang], `Domain ${domainId} missing description.${lang}`);
    }
  }
});

test('hubPresentation: filter chips are defined with complete trilingual labels', () => {
  const commonFilters = HUB_DOMAINS.common.filters;
  assert.ok(commonFilters.length >= 5, 'common must have content filter chips');
  assert.equal(commonFilters[0].id, 'all');
  assert.equal(commonFilters[0].label.vi, 'Tất cả');
  assert.equal(commonFilters[0].label.en, 'All');
  assert.equal(commonFilters[0].label.ja, 'すべて');

  const japanFilters = HUB_DOMAINS['japan-life'].filters;
  assert.ok(japanFilters.length >= 7, 'japan-life must have regulatory domain filter chips');
  const japanFilterIds = japanFilters.map((f) => f.id);
  assert.ok(japanFilterIds.includes('tax'));
  assert.ok(japanFilterIds.includes('insurance'));
  assert.ok(japanFilterIds.includes('employment'));
  assert.ok(japanFilterIds.includes('family'));
  assert.ok(japanFilterIds.includes('housing'));
  assert.ok(japanFilterIds.includes('immigration'));
  assert.ok(japanFilterIds.includes('procedures-documents'));

  for (const filter of japanFilters) {
    assert.ok(filter.label.vi, `Japan filter ${filter.id} missing VI label`);
    assert.ok(filter.label.en, `Japan filter ${filter.id} missing EN label`);
    assert.ok(filter.label.ja, `Japan filter ${filter.id} missing JA label`);
  }
});

test('hubPresentation: default fallback returns common domain on unknown key', () => {
  const fallbackName = getDomainName('non-existent-domain', 'vi');
  assert.equal(fallbackName, 'Công cụ');

  const fallbackConfig = getDomainConfig('non-existent-domain');
  assert.equal(fallbackConfig.id, 'common');
});
