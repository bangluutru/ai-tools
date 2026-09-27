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
  calculateAnnual5TierTax,
  estimateCasualIncomeSettlement,
  getMaxBhxhSalary,
  getWithholdingThreshold,
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

// ---------------------------------------------------------------------------
// Review 09/2026: hộ kinh doanh, vãng lai, trần BHXH theo kỳ, BHXH 1 lần
// ---------------------------------------------------------------------------

test('HKD dịch vụ 1,5 tỷ: GTGT trên toàn bộ doanh thu, TNCN trên phần vượt 1 tỷ (NĐ 68/2026 sửa đổi bởi NĐ 141/2026)', () => {
  const r = calculateFreelancerTax({ annualRevenue: 1_500_000_000, businessType: 'service' });
  assert.equal(r.isExempt, false);
  assert.equal(r.revenueGroup, 2);
  assert.equal(r.vatAmount, 75_000_000); // 1,5 tỷ × 5%
  assert.equal(r.pitAmount, 10_000_000); // (1,5 tỷ − 1 tỷ) × 2%
  assert.equal(r.officialTaxLiability, 85_000_000); // trước đây công cụ tính sai 105tr
});

test('HKD đúng ngưỡng 1 tỷ: không chịu GTGT, không nộp TNCN', () => {
  const r = calculateFreelancerTax({ annualRevenue: 1_000_000_000, businessType: 'goods' });
  assert.equal(r.isExempt, true);
  assert.equal(r.officialTaxLiability, 0);
});

test('HKD nhóm 2 chọn phương pháp thu nhập 15%', () => {
  const r = calculateFreelancerTax({
    annualRevenue: 2_400_000_000,
    businessType: 'goods',
    pitMethod: 'profit',
    annualExpenses: 1_900_000_000
  });
  assert.equal(r.vatAmount, 24_000_000);
  assert.equal(r.pitMethodApplied, 'profit');
  assert.equal(r.pitAmount, 75_000_000); // (2,4 tỷ − 1,9 tỷ) × 15%
});

test('HKD trên 3 tỷ: bắt buộc phương pháp thu nhập 17%, trên 50 tỷ 20%', () => {
  const r = calculateFreelancerTax({ annualRevenue: 5_000_000_000, businessType: 'service', annualExpenses: 4_000_000_000 });
  assert.equal(r.revenueGroup, 3);
  assert.equal(r.pitMethodApplied, 'profit');
  assert.equal(r.profitMethodForced, true);
  assert.ok(r.warnings.includes('profit_method_mandatory_above_3b'));
  assert.equal(r.pitAmount, 170_000_000);
  assert.equal(r.vatAmount, 250_000_000);

  const big = calculateFreelancerTax({ annualRevenue: 60_000_000_000, businessType: 'goods', annualExpenses: 58_000_000_000 });
  assert.equal(big.revenueGroup, 4);
  assert.equal(big.pitAmount, 400_000_000); // 2 tỷ × 20%

  const noExp = calculateFreelancerTax({ annualRevenue: 4_000_000_000, businessType: 'goods' });
  assert.ok(noExp.warnings.includes('profit_method_missing_expenses'));
});

test('Cho thuê tài sản luôn tính (doanh thu − 1 tỷ) × 5%, kể cả trên 3 tỷ', () => {
  const r = calculateFreelancerTax({ annualRevenue: 4_000_000_000, businessType: 'rental', pitMethod: 'profit' });
  assert.equal(r.pitMethodApplied, 'revenue');
  assert.equal(r.pitAmount, 150_000_000);
  assert.equal(r.vatAmount, 200_000_000);
});

test('Giảm 20% tỷ lệ GTGT theo NĐ 174/2025 (tùy chọn, không áp dụng cho cho thuê BĐS)', () => {
  const r = calculateFreelancerTax({ annualRevenue: 1_500_000_000, businessType: 'service', applyVatReduction: true });
  assert.equal(r.vatAmount, 60_000_000); // 1,5 tỷ × 4%
  const rental = calculateFreelancerTax({ annualRevenue: 1_500_000_000, businessType: 'rental', applyVatReduction: true });
  assert.equal(rental.vatAmount, 75_000_000);
  assert.ok(rental.warnings.includes('vat_reduction_not_applicable'));
  const y2027 = calculateFreelancerTax({ annualRevenue: 1_500_000_000, businessType: 'service', applyVatReduction: true, taxYear: 2027 });
  assert.equal(y2027.vatAmount, 75_000_000);
});

test('Vãng lai: hoàn thuế phụ thuộc quyết toán lũy tiến năm, không mặc nhiên hoàn 100%', () => {
  // Chỉ có thu nhập vãng lai nhỏ → TNTT năm = 0 → hoàn toàn bộ số đã khấu trừ
  const small = estimateCasualIncomeSettlement({ singleTransactions: [{ amount: 12_000_000 }, { amount: 6_000_000 }] });
  assert.equal(small.totalWithheld, 1_800_000);
  assert.equal(small.annualTaxDue, 0);
  assert.equal(small.estimatedRefund, 1_800_000);

  // Có thêm lương 600tr/năm: TNTT = 618 − 60 − 186 = 372tr → thuế năm 32,4tr; đã nộp 1,8 + 30 = 31,8 → nộp thêm 0,6tr
  const big = estimateCasualIncomeSettlement({
    singleTransactions: [{ amount: 12_000_000 }, { amount: 6_000_000 }],
    otherAnnualWageIncome: 600_000_000,
    otherAnnualInsurance: 60_000_000,
    otherTaxWithheld: 30_000_000
  });
  assert.equal(big.annualTaxableIncome, 372_000_000);
  assert.equal(big.annualTaxDue, 32_400_000);
  assert.equal(big.estimatedRefund, 0);
  assert.equal(big.estimatedAdditionalDue, 600_000);

  // Trường hợp HKD > 1 tỷ: số hoàn vãng lai không còn bị trừ vào thuế HKD
  const fl = calculateFreelancerTax({
    annualRevenue: 1_500_000_000,
    businessType: 'service',
    singleTransactions: [{ amount: 12_000_000 }]
  });
  assert.equal(fl.officialTaxLiability, 85_000_000);
  assert.equal(fl.refundableTax, 1_200_000);
});

test('Ngưỡng khấu trừ vãng lai: 2tr trước 01/07/2026, 5tr từ 01/07/2026 (NĐ 253/2026)', () => {
  assert.equal(getWithholdingThreshold('2026-06-30'), 2_000_000);
  assert.equal(getWithholdingThreshold('2026-07-01'), 5_000_000);
  assert.equal(getWithholdingThreshold(), 5_000_000);
  const r = estimateCasualIncomeSettlement({
    singleTransactions: [{ amount: 3_000_000, date: '2026-03-15' }, { amount: 3_000_000, date: '2026-08-15' }]
  });
  assert.equal(r.totalWithheld, 300_000);
});

test('Biểu lũy tiến năm = ngưỡng tháng × 12', () => {
  assert.equal(calculateAnnual5TierTax(120_000_000).totalTax, 6_000_000);
  assert.equal(calculateAnnual5TierTax(1_200_000_000).totalTax, 12 * (500_000 + 2_000_000 + 6_000_000 + 12_000_000));
});

test('Trần BHXH/BHYT theo kỳ lương: 46,8tr (T1–T6/2026), 50,6tr (từ T7/2026)', () => {
  assert.equal(getMaxBhxhSalary('2026-06'), 46_800_000);
  assert.equal(getMaxBhxhSalary('2026-07'), 50_600_000);
  const march = calculateGrossToNet(100_000_000, { region: 1, period: '2026-03' });
  assert.equal(march.insuranceDetails.bhxh, 3_744_000); // 46,8tr × 8%
  assert.equal(march.insuranceDetails.bhyt, 702_000);
  assert.equal(march.insuranceDetails.maxBhxhSalary, 46_800_000);
  const sept = calculateGrossToNet(100_000_000, { region: 1, period: '2026-09' });
  assert.equal(sept.insuranceDetails.bhxh, 4_048_000);
});

test('Kết quả Gross→Net có dòng thu nhập miễn thuế để CSV đối chiếu được', () => {
  const r = calculateGrossToNet(30_000_000, { region: 1, mealAllowance: 1_500_000 });
  assert.equal(r.nonTaxableIncome, 1_200_000);
  assert.equal(r.assessableIncome, 28_800_000);
  assert.equal(r.taxableIncome, r.assessableIncome - r.totalInsurance - r.totalDeductions);
});

test('BHXH 1 lần: cảnh báo điều kiện theo Luật BHXH 2024', () => {
  const ok = calculateBhxhLumpSum({ yearsBefore2014: 2, yearsFrom2014: 6, averageSalary: 15_000_000 });
  assert.equal(ok.meetsCommonCondition, true);
  const late = calculateBhxhLumpSum({ yearsFrom2014: 1, averageSalary: 10_000_000, startedBeforeJuly2025: false });
  assert.equal(late.meetsCommonCondition, false);
  assert.ok(late.eligibilityIssues.includes('started_after_2025_07'));
  const long = calculateBhxhLumpSum({ yearsBefore2014: 10, yearsFrom2014: 10, averageSalary: 10_000_000 });
  assert.equal(long.meetsCommonCondition, false);
});
