import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  getAllOfficialForms,
  getOfficialFormById,
} from '../src/documents/forms/officialFormsRegistry.js';
import {
  getFormAssistance,
  isFormVersionEffective,
} from '../src/documents/forms/formHelperEngine.js';

describe('Phase 8 - M5: Official Form Helper Engine', () => {
  it('returns all verified official government forms', () => {
    const list = getAllOfficialForms();
    assert.ok(list.length >= 3);
    assert.ok(list.some((f) => f.id === 'form.isa.extension-of-stay'));
    assert.ok(list.some((f) => f.id === 'form.muni.child-allowance-claim'));
    assert.ok(list.some((f) => f.id === 'form.muni.change-of-address'));
  });

  it('retrieves detailed field assistance for ISA Residence Extension form', () => {
    const pkg = getFormAssistance('form.isa.extension-of-stay');
    assert.ok(pkg);
    assert.equal(pkg.form.formNameJa, '在留期間更新許可申請書');
    assert.ok(pkg.totalFieldsCount >= 6);
    assert.ok(pkg.sensitiveFieldsCount >= 3);

    // Verify key fields
    const cardNumField = pkg.allFields.find((f) => f.id === 'residence_card_number');
    assert.ok(cardNumField);
    assert.strictEqual(cardNumField.isSensitive, true);
    assert.ok(cardNumField.meaningI18n.vi.includes('Số thẻ cư trú'));
  });

  it('verifies form version effectiveness periods accurately', () => {
    const form = getOfficialFormById('form.isa.extension-of-stay');
    assert.strictEqual(isFormVersionEffective(form, new Date('2026-09-15')), true);

    // Prior to validFrom date
    assert.strictEqual(isFormVersionEffective(form, new Date('2020-01-01')), false);

    // Expired form test
    const expiredMock = {
      effectivePeriod: {
        validFrom: '2020-01-01',
        validTo: '2022-12-31',
      },
    };
    assert.strictEqual(isFormVersionEffective(expiredMock, new Date('2026-09-15')), false);
  });
});
