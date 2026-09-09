import assert from 'node:assert/strict';
import test from 'node:test';
import {
  SUPPORTED_LANGS,
  normalizeLang,
  getNinjaStrings,
  NINJA_I18N,
} from '../src/utils/ninja/ninjaI18n.js';
import {
  BIOMES,
  BIOMES_VI_EN,
  BIOMES_JA,
  getBiomesForLang,
  TOOLIO_PROBLEM_TYPES,
} from '../src/utils/ninja/ninjaEngine.js';

test('ninjaI18n: supported languages and normalization', () => {
  assert.deepEqual(SUPPORTED_LANGS, ['vi', 'en', 'ja']);

  assert.equal(normalizeLang('vi'), 'vi');
  assert.equal(normalizeLang('vi-VN'), 'vi');
  assert.equal(normalizeLang('en'), 'en');
  assert.equal(normalizeLang('en-US'), 'en');
  assert.equal(normalizeLang('ja'), 'ja');
  assert.equal(normalizeLang('ja-JP'), 'ja');
  assert.equal(normalizeLang('jp'), 'ja');

  // Fallback to 'vi' on unknown or falsy
  assert.equal(normalizeLang(''), 'vi');
  assert.equal(normalizeLang(null), 'vi');
  assert.equal(normalizeLang(undefined), 'vi');
  assert.equal(normalizeLang('fr'), 'vi');
});

test('ninjaI18n: 100% dictionary completeness across vi, en, ja', () => {
  const monsterTypes = [...TOOLIO_PROBLEM_TYPES.map((t) => t.type), 'spikes'];
  const biomeIds = BIOMES.map((b) => b.id);

  for (const lang of SUPPORTED_LANGS) {
    const dict = getNinjaStrings(lang);
    assert.ok(dict, `Dictionary should exist for lang ${lang}`);

    // Check Meta
    assert.ok(dict.meta.gameTitle, `Missing meta.gameTitle for ${lang}`);
    assert.ok(dict.meta.badge, `Missing meta.badge for ${lang}`);
    assert.ok(dict.meta.subtitle, `Missing meta.subtitle for ${lang}`);

    // Check Biomes
    for (const bId of biomeIds) {
      assert.ok(dict.biomes[bId], `Missing biome ${bId} in ${lang}`);
      assert.ok(dict.biomes[bId].name, `Missing biome ${bId}.name in ${lang}`);
      assert.ok(dict.biomes[bId].banner, `Missing biome ${bId}.banner in ${lang}`);
      assert.ok(dict.biomes[bId].countryName, `Missing biome ${bId}.countryName in ${lang}`);
    }

    // Check Monsters
    for (const mType of monsterTypes) {
      assert.ok(dict.monsters[mType], `Missing monster ${mType} in ${lang}`);
      assert.ok(dict.monsters[mType].name, `Missing monster ${mType}.name in ${lang}`);
      assert.ok(dict.monsters[mType].toast, `Missing monster ${mType}.toast in ${lang}`);
    }

    // Check HUD
    assert.ok(dict.hud.distanceUnit, `Missing hud.distanceUnit for ${lang}`);
    assert.ok(dict.hud.bugsResolved, `Missing hud.bugsResolved for ${lang}`);
    assert.ok(dict.hud.combo, `Missing hud.combo for ${lang}`);
    assert.ok(dict.hud.tutorialReadyTitle, `Missing hud.tutorialReadyTitle for ${lang}`);
    assert.ok(dict.hud.tutorialReadyKeys, `Missing hud.tutorialReadyKeys for ${lang}`);

    // Check Controls
    assert.ok(dict.controls.jump, `Missing controls.jump for ${lang}`);
    assert.ok(dict.controls.slash, `Missing controls.slash for ${lang}`);
    assert.ok(dict.controls.fullscreen, `Missing controls.fullscreen for ${lang}`);
    assert.ok(dict.controls.close, `Missing controls.close for ${lang}`);
    assert.ok(dict.controls.footerJumpKey, `Missing controls.footerJumpKey for ${lang}`);
    assert.ok(dict.controls.footerSlashKey, `Missing controls.footerSlashKey for ${lang}`);

    // Check Pet
    assert.ok(dict.pet.tooltip, `Missing pet.tooltip for ${lang}`);
    assert.ok(dict.pet.title, `Missing pet.title for ${lang}`);
    assert.ok(dict.pet.ariaLabel, `Missing pet.ariaLabel for ${lang}`);

    // Check GameOver
    assert.ok(dict.gameOver.title, `Missing gameOver.title for ${lang}`);
    assert.ok(dict.gameOver.praise, `Missing gameOver.praise for ${lang}`);
    assert.ok(dict.gameOver.unit, `Missing gameOver.unit for ${lang}`);
    assert.ok(dict.gameOver.playAgain, `Missing gameOver.playAgain for ${lang}`);
    assert.ok(dict.gameOver.exploreToolio, `Missing gameOver.exploreToolio for ${lang}`);
    assert.ok(dict.gameOver.badges.apprentice, `Missing gameOver.badges.apprentice for ${lang}`);
    assert.ok(dict.gameOver.badges.warrior, `Missing gameOver.badges.warrior for ${lang}`);
    assert.ok(dict.gameOver.badges.legend, `Missing gameOver.badges.legend for ${lang}`);
    assert.ok(dict.gameOver.badges.grandmaster, `Missing gameOver.badges.grandmaster for ${lang}`);
  }
});

test('ninjaI18n: real-time language switching returns distinct translations', () => {
  const vi = getNinjaStrings('vi');
  const en = getNinjaStrings('en');
  const ja = getNinjaStrings('ja');

  // Ensure translations are actually localized into distinct languages
  assert.notEqual(vi.controls.jump, en.controls.jump);
  assert.notEqual(vi.controls.jump, ja.controls.jump);
  assert.notEqual(en.controls.jump, ja.controls.jump);

  assert.equal(vi.controls.jump, 'NHẢY');
  assert.equal(en.controls.jump, 'JUMP');
  assert.equal(ja.controls.jump, 'ジャンプ');

  assert.equal(vi.controls.slash, 'CHÉM');
  assert.equal(en.controls.slash, 'SLASH');
  assert.equal(ja.controls.slash, '斬撃');
});

test('ninjaEngine: language-based biome ordering starts with VN for vi/en and JP for ja', () => {
  const viBiomes = getBiomesForLang('vi');
  const enBiomes = getBiomesForLang('en');
  const jaBiomes = getBiomesForLang('ja');

  // VI and EN must start with Vietnam landmark (Hà Nội)
  assert.equal(viBiomes[0].id, 'vietnam-hanoi');
  assert.equal(viBiomes[0].country, 'VN');
  assert.equal(enBiomes[0].id, 'vietnam-hanoi');
  assert.equal(enBiomes[0].country, 'VN');

  // JA must start with Japan landmark (Tokyo Skytree & Mount Fuji)
  assert.equal(jaBiomes[0].id, 'japan-tokyo-fuji');
  assert.equal(jaBiomes[0].country, 'JP');

  // Ensure all 7 biomes exist in both lists
  assert.equal(BIOMES_VI_EN.length, 7);
  assert.equal(BIOMES_JA.length, 7);

  // Ensure all biomes are translated in NINJA_I18N
  for (const b of BIOMES_VI_EN) {
    for (const lang of SUPPORTED_LANGS) {
      assert.ok(NINJA_I18N[lang].biomes[b.id], `Biome ${b.id} missing in NINJA_I18N[${lang}]`);
      assert.ok(NINJA_I18N[lang].biomes[b.id].name, `Biome ${b.id} name missing in ${lang}`);
      assert.ok(NINJA_I18N[lang].biomes[b.id].banner, `Biome ${b.id} banner missing in ${lang}`);
    }
  }
});


