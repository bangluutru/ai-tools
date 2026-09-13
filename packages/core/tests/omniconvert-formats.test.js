import assert from 'node:assert/strict';
import test from 'node:test';

import { COMPATIBILITY_MATRIX, FORMAT_DETAILS, getSupportedTargets } from '../src/utils/omniconvert/formats.js';

test('OmniConvert does not advertise PPTX conversion without layout preservation', () => {
  assert.equal(FORMAT_DETAILS.pptx, undefined);
  assert.equal(COMPATIBILITY_MATRIX.pptx, undefined);
  assert.deepEqual(getSupportedTargets('pptx'), []);
});
