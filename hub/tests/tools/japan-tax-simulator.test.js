import assert from 'node:assert/strict';
import test from 'node:test';
import { tools, activeTools } from '../../src/config/toolsRegistry.js';
import {
  simulateJapanTaxes,
  exportTaxSimulationCsv,
  DEFAULT_TAX_YEAR,
} from '../../../packages/core/src/utils/tax/index.js';

test('japan-tax-simulator is correctly registered in toolsRegistry', () => {
  const tool = tools.find((t) => t.id === 'japan-tax-simulator');
  assert.ok(tool, 'Tool japan-tax-simulator must be defined in tools');
  assert.equal(tool.category, 'office');
  assert.equal(tool.readiness, 'beta');
  assert.equal(tool.processing, 'browser');
  assert.equal(tool.outputPurpose, 'utility');
  assert.ok(tool.name_vn && tool.name_en && tool.name_ja, 'Must have trilingual names');
  assert.ok(tool.desc_vn && tool.desc_en && tool.desc_ja, 'Must have trilingual descriptions');

  const isActive = activeTools.some((t) => t.id === 'japan-tax-simulator');
  assert.equal(isActive, true, 'Tool must be in activeTools');
});

test('japan-tax-simulator end-to-end integration: salaried employee (5M JPY)', () => {
  const result = simulateJapanTaxes({
    year: 2025,
    profile: 'employee',
    salary: 5000000,
    prefecture: 'tokyo',
    age: 35,
  });

  assert.ok(result.incomeTax, 'Income tax result exists');
  assert.ok(result.residentTax, 'Resident tax result exists');
  assert.ok(result.socialInsurance, 'Social insurance result exists');
  assert.ok(result.summary, 'Summary KPI exists');

  // Verify KPIs
  assert.equal(result.summary.grossEarnings, 5000000);
  assert.ok(result.summary.totalTaxes > 0, 'Taxes should be greater than 0');
  assert.ok(result.summary.totalSocialInsurance > 0, 'Social insurance should be greater than 0');
  assert.ok(result.summary.netTakeHome > 3500000 && result.summary.netTakeHome < 4500000, 'Take home in realistic range');
  assert.ok(result.summary.effectiveBurdenRate > 0.15 && result.summary.effectiveBurdenRate < 0.35, 'Effective burden between 15% and 35%');

  // Verify filing diagnosis: standard employee with year-end adjustment does NOT need Kakutei Shinkoku
  assert.equal(result.filingNecessity.status, 'NOT_REQUIRED');
});

test('japan-tax-simulator end-to-end integration: employee with side business > 200k', () => {
  const result = simulateJapanTaxes({
    year: 2025,
    profile: 'employee_side',
    salary: 4500000,
    sideIncomeRevenue: 600000,
    sideIncomeExpenses: 150000, // profit = 450,000 > 200,000
    prefecture: 'tokyo',
    age: 28,
  });

  assert.equal(result.filingNecessity.status, 'REQUIRED');
  assert.ok(result.filingNecessity.reasons_ja.some((r) => r.includes('20万円')), 'Mentions 200k rule in Japanese');
  assert.ok(result.filingNecessity.reasons_vi.some((r) => r.includes('20 vạn')), 'Mentions 200k rule in Vietnamese');
});

test('japan-tax-simulator end-to-end integration: side business <= 200k resident tax warning', () => {
  const result = simulateJapanTaxes({
    year: 2025,
    profile: 'employee_side',
    salary: 4500000,
    sideIncomeRevenue: 200000,
    sideIncomeExpenses: 50000, // profit = 150,000 <= 200,000
    prefecture: 'tokyo',
    age: 28,
    hasYearEndAdjustment: true,
  });

  assert.equal(result.filingNecessity.status, 'NOT_REQUIRED');
  assert.ok(result.filingNecessity.residentTaxNote, 'Must include resident tax note');
  assert.ok(result.filingNecessity.residentTaxNote.title_vi.includes('thuế cư trú'));
  assert.ok(result.filingNecessity.residentTaxNote.title_ja.includes('住民税'));
});

test('japan-tax-simulator CSV export functionality', () => {
  const sim = simulateJapanTaxes({
    year: 2025,
    profile: 'sole_proprietor',
    businessRevenue: 8000000,
    businessExpenses: 2500000,
    blueReturnOption: 'etax_65',
    prefecture: 'osaka',
    age: 42,
  });

  // Verify mock CSV export execution without throwing
  let triggeredDownload = false;
  globalThis.Blob = class MockBlob {
    constructor(parts, options) {
      this.parts = parts;
      this.options = options;
      // Ensure UTF-8 BOM is present at the start of CSV content
      assert.ok(parts[0].startsWith('\uFEFF'), 'CSV must start with UTF-8 BOM');
    }
  };

  globalThis.URL = {
    createObjectURL: () => 'blob:mock-url',
    revokeObjectURL: () => {},
  };

  const mockLink = {
    setAttribute: () => {},
    click: () => { triggeredDownload = true; },
  };

  globalThis.document = {
    createElement: () => mockLink,
    body: {
      appendChild: () => {},
      removeChild: () => {},
    },
  };

  exportTaxSimulationCsv(sim, 'ja');
  assert.equal(triggeredDownload, true, 'Download link click must be triggered');

  exportTaxSimulationCsv(sim, 'vi');
  assert.equal(triggeredDownload, true);

  exportTaxSimulationCsv(sim, 'en');
  assert.equal(triggeredDownload, true);
});
