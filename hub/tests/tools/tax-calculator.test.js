import assert from 'node:assert/strict';
import test from 'node:test';
import { tools, activeTools } from '../../src/config/toolsRegistry.js';
import {
  calculateGrossToNet,
  calculateNetToGross,
  calculateFreelancerTax,
  calculateBhxhLumpSum,
  calculateBhtn,
  calculateAssetTax,
  TAX_CONSTANTS_2026
} from '../../../packages/core/src/utils/tax/taxEngine.js';

test('tax-calculator is correctly registered in toolsRegistry', () => {
  const tool = tools.find((t) => t.id === 'tax-calculator');
  assert.ok(tool, 'Tool tax-calculator must be defined in tools');
  assert.equal(tool.category, 'office');
  assert.equal(tool.readiness, 'beta');
  assert.equal(tool.processing, 'browser');
  assert.equal(tool.outputPurpose, 'utility');
  assert.ok(tool.name_vn && tool.name_en && tool.name_ja, 'Must have trilingual names');
  assert.ok(tool.desc_vn && tool.desc_en && tool.desc_ja, 'Must have trilingual descriptions');

  const isActive = activeTools.some((t) => t.id === 'tax-calculator');
  assert.equal(isActive, true, 'Tool must be in activeTools');
});

test('Case 1: Lương gross 25 triệu, 1 người phụ thuộc (2026)', () => {
  const result = calculateGrossToNet(25_000_000, { region: 1, dependents: 1 });
  
  // BHBB = 25tr x 10.5% = 2.625.000
  assert.equal(result.totalInsurance, 2_625_000);
  assert.equal(result.insuranceDetails.bhxh, 2_000_000);
  assert.equal(result.insuranceDetails.bhyt, 375_000);
  assert.equal(result.insuranceDetails.bhtn, 250_000);

  // Giảm trừ bản thân (15.5tr) + NPT (6.2tr) = 21.700.000
  assert.equal(result.totalDeductions, 21_700_000);

  // Thu nhập tính thuế = 25tr - 2.625.000 - 21.700.000 = 675.000
  assert.equal(result.taxableIncome, 675_000);

  // Thuế Bậc 1 (5%) = 675.000 x 5% = 33.750 VNĐ
  assert.equal(result.pitTax, 33_750);

  // Net = 25.000.000 - 2.625.000 - 33.750 = 22.341.250 VNĐ
  assert.equal(result.net, 22_341_250);
});

test('Case 2: Lương gross 50 triệu, Vùng I, không NPT (2026)', () => {
  const result = calculateGrossToNet(50_000_000, { region: 1, dependents: 0 });

  // BHBB = 50tr x 10.5% = 5.250.000 (Lương thực tế < trần BHXH 50.6tr)
  assert.equal(result.totalInsurance, 5_250_000);
  assert.equal(result.insuranceDetails.bhxh, 4_000_000);
  assert.equal(result.insuranceDetails.bhyt, 750_000);
  assert.equal(result.insuranceDetails.bhtn, 500_000);

  // Thu nhập tính thuế = 50tr - 5.250.000 - 15.500.000 = 29.250.000
  assert.equal(result.taxableIncome, 29_250_000);

  // Thuế: Bậc 1 (10tr x 5% = 500k) + Bậc 2 (19.25tr x 10% = 1.925k) = 2.425.000 VNĐ
  assert.equal(result.pitTax, 2_425_000);

  // Net = 50.000.000 - 5.250.000 - 2.425.000 = 42.325.000 VNĐ
  assert.equal(result.net, 42_325_000);
});

test('Case 3: Chuyển đổi ngược Net sang Gross khớp 100%', () => {
  // Chuyển ngược từ Net 22.341.250 -> Gross 25.000.000
  const grossFromNet1 = calculateNetToGross(22_341_250, { region: 1, dependents: 1 });
  assert.equal(grossFromNet1.gross, 25_000_000);

  // Chuyển ngược từ Net 42.325.000 -> Gross 50.000.000
  const grossFromNet2 = calculateNetToGross(42_325_000, { region: 1, dependents: 0 });
  assert.equal(grossFromNet2.gross, 50_000_000);
});

test('Case 4: Trần đóng BHXH/BHYT 50,6 triệu (lương cơ sở 2,53tr từ 01/07/2026)', () => {
  const result = calculateGrossToNet(100_000_000, { region: 1, dependents: 0 });
  
  // BHXH 8% trên trần 50.600.000 = 4.048.000
  assert.equal(result.insuranceDetails.bhxh, 4_048_000);
  // BHYT 1.5% trên trần 50.600.000 = 759.000
  assert.equal(result.insuranceDetails.bhyt, 759_000);
  // BHTN 1% trên 100.000.000 (chưa vượt trần Vùng I 106.2tr) = 1.000.000
  assert.equal(result.insuranceDetails.bhtn, 1_000_000);
  assert.equal(result.insuranceDetails.isBhxhCapped, true);
});

test('Case 5: Freelancer bán hàng Shopee doanh thu 800 triệu/năm (miễn thuế <= 1 tỷ)', () => {
  const flResult = calculateFreelancerTax({
    annualRevenue: 800_000_000,
    businessType: 'goods'
  });

  assert.equal(flResult.isExempt, true);
  assert.equal(flResult.officialTaxLiability, 0);
});

test('Case 6: Khấu trừ vãng lai 10% từ 5 triệu trở lên và hoàn thuế cuối năm', () => {
  const flResult = calculateFreelancerTax({
    annualRevenue: 172_500_000, // < 1 tỷ -> miễn thuế
    singleTransactions: [
      { amount: 12_000_000 }, // Khấu trừ 1.2tr
      { amount: 4_500_000 },  // < 5tr -> Không khấu trừ
      { amount: 6_000_000 }   // Khấu trừ 600k
    ],
    businessType: 'service'
  });

  assert.equal(flResult.totalWithheld, 1_800_000);
  assert.equal(flResult.isExempt, true);
  assert.equal(flResult.refundableTax, 1_800_000);
});

test('Case 7: BHXH rút 1 lần (2 năm trước 2014, 6 năm từ 2014, lương bình quân 15tr)', () => {
  const result = calculateBhxhLumpSum({
    yearsBefore2014: 2,
    yearsFrom2014: 6,
    averageSalary: 15_000_000
  });

  // 2 x 1.5 x 15tr = 45tr
  assert.equal(result.amountBefore2014, 45_000_000);
  // 6 x 2.0 x 15tr = 180tr
  assert.equal(result.amountFrom2014, 180_000_000);
  assert.equal(result.totalAmount, 225_000_000);
});

test('Case 8: Trợ cấp thất nghiệp BHTN (Bình quân 18tr, 48 tháng đóng, Vùng I)', () => {
  const result = calculateBhtn({
    averageSalary6Months: 18_000_000,
    region: 1,
    totalContributionMonths: 48
  });

  // Mức hưởng: 60% x 18tr = 10.800.000 (dưới trần Vùng I: 5 x 5.31tr = 26.55tr)
  assert.equal(result.actualMonthlyBenefit, 10_800_000);
  // 36 tháng đầu = 3 tháng; 12 tháng tiếp theo = thêm 1 tháng -> tổng 4 tháng hưởng
  assert.equal(result.benefitDurationMonths, 4);
  assert.equal(result.totalBenefit, 43_200_000);
});

test('Case 9: Thuế chuyển nhượng BĐS và chứng khoán phái sinh 0,1%', () => {
  // BĐS 3 tỷ thông thường -> 2% = 60.000.000 VNĐ
  const normalRe = calculateAssetTax({ realEstatePrice: 3_000_000_000 });
  assert.equal(normalRe.realEstate.tax, 60_000_000);

  // BĐS 3 tỷ là nhà đất duy nhất 183 ngày -> Miễn thuế = 0
  const soleRe = calculateAssetTax({
    realEstatePrice: 3_000_000_000,
    isSolePropertyOver183Days: true
  });
  assert.equal(soleRe.realEstate.tax, 0);

  // Phái sinh 500 triệu x 0.1% = 500.000 VNĐ
  const deriv = calculateAssetTax({ derivativeContractValue: 500_000_000 });
  assert.equal(deriv.derivative.tax, 500_000);
});
