/**
 * @file packages/core/src/utils/tax/engines/personalDeductionEngine.js
 * @description Tính các khoản khấu trừ nhân thân (人的控除) cho 所得税 và 住民税:
 * 配偶者控除・配偶者特別控除 (theo 合計所得 của người nộp thuế và của vợ/chồng),
 * 扶養控除 (一般・特定・老人・同居老親等).
 * Nguồn: 国税庁 No.1191 / No.1195 / No.1180, 地方税法 第314条の2.
 * Chưa mô phỏng: 特定親族特別控除 (令和7年分〜), 障害者控除, 寡婦・ひとり親控除, 勤労学生控除.
 */

import { taxpayerBandIndex } from '../rules/shared/deductionTables.js';

function toCount(value) {
  return Math.max(0, Math.floor(Number(value) || 0));
}

/**
 * @param {object} params
 * @param {object} params.deductionRules - rules.incomeTax.deductions
 * @param {number} params.taxpayerTotalIncome - 合計所得金額 của người nộp thuế
 * @param {boolean} [params.hasSpouse=false]
 * @param {number} [params.spouseIncome=0] - 合計所得金額 của vợ/chồng (không phải thu nhập gộp)
 * @param {boolean} [params.spouseIsElderly=false] - 老人控除対象配偶者 (70歳以上)
 * @param {number} [params.dependentsCount=0] - 一般の控除対象扶養親族 (16〜18歳, 23〜69歳)
 * @param {number} [params.specificDependentsCount=0] - 特定扶養親族 (19〜22歳)
 * @param {number} [params.elderlyDependentsCount=0] - 老人扶養親族 (70歳以上, 同居老親等以外)
 * @param {number} [params.cohabitingElderlyParentsCount=0] - 同居老親等
 * @param {'income'|'resident'} [params.taxType='income']
 */
export function calculatePersonalDeductions({
  deductionRules,
  taxpayerTotalIncome = 0,
  hasSpouse = false,
  spouseIncome = 0,
  spouseIsElderly = false,
  dependentsCount = 0,
  specificDependentsCount = 0,
  elderlyDependentsCount = 0,
  cohabitingElderlyParentsCount = 0,
  taxType = 'income',
}) {
  const d = deductionRules;
  const isResident = taxType === 'resident';
  const table = isResident ? d.resident : d;
  const band = taxpayerBandIndex(Math.max(0, Number(taxpayerTotalIncome) || 0), d.taxpayerIncomeBands);
  const safeSpouseIncome = Math.max(0, Number(spouseIncome) || 0);

  let spouse = 0;
  let spouseType = 'none';
  if (hasSpouse) {
    if (band < 0) {
      spouseType = 'taxpayer_over_10m';
    } else if (safeSpouseIncome <= d.spouseIncomeLimit) {
      const amounts = spouseIsElderly ? table.spouseDeduction.elderly : table.spouseDeduction.general;
      spouse = amounts[band];
      spouseType = spouseIsElderly ? 'spouse_elderly' : 'spouse';
    } else if (safeSpouseIncome <= d.spouseSpecialMaxIncome) {
      const row = table.spouseSpecialRows.find((r) => safeSpouseIncome <= r.maxSpouseIncome);
      spouse = row ? row.amounts[band] : 0;
      spouseType = 'spouse_special';
    } else {
      spouseType = 'spouse_income_too_high';
    }
  }

  const counts = {
    general: toCount(dependentsCount),
    specific: toCount(specificDependentsCount),
    elderlyOther: toCount(elderlyDependentsCount),
    elderlyCohabitant: toCount(cohabitingElderlyParentsCount),
  };
  const dependents =
    counts.general * table.dependentGeneral +
    counts.specific * table.dependentSpecific +
    counts.elderlyOther * table.dependentElderlyOther +
    counts.elderlyCohabitant * table.dependentElderlyCohabitant;

  return {
    spouse,
    spouseType,
    dependents,
    dependentCounts: counts,
    dependentHeadcount: counts.general + counts.specific + counts.elderlyOther + counts.elderlyCohabitant,
  };
}
