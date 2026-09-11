/**
 * @file packages/core/src/vietnam/engines/vietnamElectricityEngine.js
 * @description Engine tính tiền điện sinh hoạt bậc thang 6 bậc theo Quyết định 1279/QĐ-BCT tại Việt Nam.
 */

import { getElectricityTariff } from '../rules/electricityTariffRules.js';
import { getElectricityVATRule } from '../rules/vatRules.js';
import { getSource } from '../../regulatory/sourceRegistry.js';

/**
 * @typedef {Object} ElectricityTierResult
 * @property {number} tier - Số thứ tự bậc (1-6)
 * @property {string} label_vn - Tên bậc tiếng Việt
 * @property {string} label_en - Tên bậc tiếng Anh
 * @property {string} label_ja - Tên bậc tiếng Nhật
 * @property {number} unitPrice - Đơn giá VND/kWh
 * @property {number} consumedKwh - Số kWh tiêu thụ trong bậc này
 * @property {number} amount - Thành tiền trước VAT (VND)
 * @property {string} formula - Chuỗi công thức tính
 */

/**
 * Tính tiền điện sinh hoạt bậc thang.
 * @param {Object} params
 * @param {number} [params.kwh] - Số kWh tiêu thụ trực tiếp
 * @param {number} [params.oldReading] - Chỉ số công tơ cũ
 * @param {number} [params.newReading] - Chỉ số công tơ mới
 * @param {number} [params.vatRate] - Thuế suất VAT tùy chọn (mặc định 0.08 = 8%)
 * @param {string|Date} [params.date='2026-09-01'] - Thời điểm áp dụng biểu giá
 */
export function calculateVietnamElectricity({
  kwh = null,
  oldReading = null,
  newReading = null,
  vatRate = null,
  date = '2026-09-01',
}) {
  let resolvedKwh = 0;
  let validationError = null;

  if (oldReading !== null && newReading !== null && oldReading !== undefined && newReading !== undefined) {
    const oldVal = Number(oldReading) || 0;
    const newVal = Number(newReading) || 0;
    if (newVal < oldVal) {
      validationError = 'Chỉ số mới không được nhỏ hơn chỉ số cũ.';
      resolvedKwh = 0;
    } else {
      resolvedKwh = newVal - oldVal;
    }
  } else if (kwh !== null && kwh !== undefined) {
    resolvedKwh = Math.max(0, Number(kwh) || 0);
  }

  const tariffRule = getElectricityTariff(date);
  const vatRule = getElectricityVATRule(date);
  const effectiveVatRate = vatRate !== null && vatRate !== undefined ? Number(vatRate) : vatRule.defaultRate;

  let remainingKwh = resolvedKwh;
  let subtotalBeforeVat = 0;
  const tiersBreakdown = [];

  for (const t of tariffRule.tiers) {
    if (remainingKwh <= 0) {
      tiersBreakdown.push({
        tier: t.tier,
        label_vn: t.label_vn,
        label_en: t.label_en,
        label_ja: t.label_ja,
        unitPrice: t.unitPrice,
        consumedKwh: 0,
        amount: 0,
        formula: '0 kWh',
      });
      continue;
    }

    const consumedInTier = Math.min(remainingKwh, t.bandwidth);
    const amountInTier = Math.round(consumedInTier * t.unitPrice);
    subtotalBeforeVat += amountInTier;
    remainingKwh -= consumedInTier;

    tiersBreakdown.push({
      tier: t.tier,
      label_vn: t.label_vn,
      label_en: t.label_en,
      label_ja: t.label_ja,
      unitPrice: t.unitPrice,
      consumedKwh: consumedInTier,
      amount: amountInTier,
      formula: `${consumedInTier.toLocaleString('vi-VN')} kWh × ${t.unitPrice.toLocaleString('vi-VN')} = ${amountInTier.toLocaleString('vi-VN')} VND`,
    });
  }

  const vatAmount = Math.round(subtotalBeforeVat * effectiveVatRate);
  const totalAmount = subtotalBeforeVat + vatAmount;

  const source = getSource(tariffRule.metadata.sourceId);

  return {
    kwh: resolvedKwh,
    oldReading,
    newReading,
    validationError,
    subtotalBeforeVat,
    vatRate: effectiveVatRate,
    vatAmount,
    totalAmount,
    tiersBreakdown,
    tariffMetadata: tariffRule.metadata,
    vatMetadata: vatRule.metadata,
    source,
    formula: {
      subtotal: tiersBreakdown
        .filter((t) => t.consumedKwh > 0)
        .map((t) => t.formula)
        .join(' + ') || '0 VND',
      vat: `${subtotalBeforeVat.toLocaleString('vi-VN')} × ${(effectiveVatRate * 100)}% = ${vatAmount.toLocaleString('vi-VN')} VND`,
      total: `${subtotalBeforeVat.toLocaleString('vi-VN')} + ${vatAmount.toLocaleString('vi-VN')} = ${totalAmount.toLocaleString('vi-VN')} VND`,
    }
  };
}
