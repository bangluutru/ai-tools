import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  CANONICAL_INTENTS,
  DISAMBIGUATION_SCENARIOS,
  checkQueryAmbiguity,
  resolveDisambiguatedOption,
  resolveIntentFromText,
  getAllIntents,
  getIntentById,
} from '../src/navigator/index.js';

describe('Phase 9 — Intent & Situation Routing (M2)', () => {
  describe('Canonical Intent Registry', () => {
    it('contains all canonical life intents', () => {
      const intents = getAllIntents();
      assert.ok(intents['intent.jp.life.start']);
      assert.ok(intents['intent.jp.job.change']);
      assert.ok(intents['intent.jp.job.leave']);
      assert.ok(intents['intent.jp.move']);
      assert.ok(intents['intent.jp.birth']);
      assert.ok(intents['intent.jp.family.invite']);
      assert.ok(intents['intent.jp.residence.renew']);
      assert.ok(intents['intent.jp.residence.pr']);
      assert.ok(intents['intent.jp.document.obtain']);
      assert.ok(intents['intent.jp.life.leave']);
    });

    it('maps canonical intents to standard life situations', () => {
      assert.equal(getIntentById('intent.jp.job.change').targetSituation, 'life.jp.changing-job');
      assert.equal(getIntentById('intent.jp.life.start').targetSituation, 'life.jp.starting-life');
      assert.equal(getIntentById('intent.jp.family.invite').targetSituation, 'life.jp.family-joining');
    });
  });

  describe('Multilingual Natural Language Resolution', () => {
    it('resolves Vietnamese free-text queries', () => {
      const res1 = resolveIntentFromText('Tôi vừa nghỉ việc');
      assert.equal(res1.intentId, 'intent.jp.job.leave');
      assert.equal(res1.targetSituation, 'life.jp.leaving-job');

      const res2 = resolveIntentFromText('vợ tôi sắp sang Nhật');
      assert.equal(res2.intentId, 'intent.jp.family.invite');
      assert.equal(res2.targetSituation, 'life.jp.family-joining');

      const res3 = resolveIntentFromText('visa của tôi sắp hết hạn');
      assert.equal(res3.intentId, 'intent.jp.residence.renew');

      const res4 = resolveIntentFromText('tôi chuyển sang fukuoka');
      assert.equal(res4.intentId, 'intent.jp.move');

      const res5 = resolveIntentFromText('tôi sắp sinh con');
      assert.equal(res5.intentId, 'intent.jp.birth');
      assert.equal(res5.targetSituation, 'life.jp.pregnancy-birth');

      const res6 = resolveIntentFromText('lấy juminhyo');
      assert.equal(res6.intentId, 'intent.jp.document.obtain');
    });

    it('resolves Japanese Kanji & Kana queries', () => {
      const res1 = resolveIntentFromText('転職');
      assert.equal(res1.intentId, 'intent.jp.job.change');

      const res2 = resolveIntentFromText('退職の手続きをしたい');
      assert.equal(res2.intentId, 'intent.jp.job.leave');

      const res3 = resolveIntentFromText('引っ越し');
      assert.equal(res3.intentId, 'intent.jp.move');

      const res4 = resolveIntentFromText('永住権の申請');
      assert.equal(res4.intentId, 'intent.jp.residence.pr');

      const res5 = resolveIntentFromText('住民票を取りたい');
      assert.equal(res5.intentId, 'intent.jp.document.obtain');
    });

    it('resolves Romaji queries', () => {
      const res1 = resolveIntentFromText('tenshoku');
      assert.equal(res1.intentId, 'intent.jp.job.change');

      const res2 = resolveIntentFromText('eijuu');
      assert.equal(res2.intentId, 'intent.jp.residence.pr');

      const res3 = resolveIntentFromText('hikkoshi');
      assert.equal(res3.intentId, 'intent.jp.move');

      const res4 = resolveIntentFromText('taishoku');
      assert.equal(res4.intentId, 'intent.jp.job.leave');
    });

    it('resolves English queries', () => {
      const res1 = resolveIntentFromText('change jobs');
      assert.equal(res1.intentId, 'intent.jp.job.change');

      const res2 = resolveIntentFromText('bring family to japan');
      assert.equal(res2.intentId, 'intent.jp.family.invite');

      const res3 = resolveIntentFromText('permanent residence');
      assert.equal(res3.intentId, 'intent.jp.residence.pr');

      const res4 = resolveIntentFromText('relocating to japan');
      assert.equal(res4.intentId, 'intent.jp.life.start');
    });

    it('returns confidence none for completely unrecognised query', () => {
      const res = resolveIntentFromText('nấu món phở bò thơm ngon');
      assert.equal(res.intentId, null);
      assert.equal(res.confidence, 'none');
      assert.equal(res.isAmbiguous, false);
    });
  });

  describe('Ambiguity Detection & Guided Disambiguation', () => {
    it('detects ambiguous visa change query and does not auto-route blindly', () => {
      const res = resolveIntentFromText('Tôi muốn đổi visa');
      assert.equal(res.isAmbiguous, true);
      assert.equal(res.intentId, null);
      assert.ok(res.disambiguation);
      assert.equal(res.disambiguation.id, 'ambiguity.visa.change');
      assert.ok(res.disambiguation.options.length >= 3);
    });

    it('resolves disambiguated choice to concrete canonical intent', () => {
      const resolved = resolveDisambiguatedOption('ambiguity.visa.change', 'opt.job.change');
      assert.equal(resolved, 'intent.jp.job.change');

      const resolvedFamily = resolveDisambiguatedOption('ambiguity.visa.change', 'opt.marriage');
      assert.equal(resolvedFamily, 'intent.jp.family.invite');
    });

    it('handles ambiguous tax document query', () => {
      const res = resolveIntentFromText('cần giấy thuế');
      assert.equal(res.isAmbiguous, true);
      assert.equal(res.disambiguation.id, 'ambiguity.tax.document');

      const chosen = resolveDisambiguatedOption('ambiguity.tax.document', 'opt.kazei');
      assert.equal(chosen, 'intent.jp.document.obtain');
    });
  });
});
