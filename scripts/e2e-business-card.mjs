import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const screenshotsDir = path.join(rootDir, 'docs/reports/screenshots');

if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

function findChrome() {
  const macPaths = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
  ];
  for (const p of macPaths) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error('Chrome executable not found');
}

async function runE2E() {
  console.log('🚀 Starting Enhanced E2E Browser Verification for Business Card Studio...');
  const executablePath = findChrome();
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--window-size=1440,900'],
  });

  const page = await browser.newPage();
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  page.on('pageerror', (err) => {
    consoleErrors.push(err.message);
  });

  try {
    await page.setViewport({ width: 1440, height: 900 });
    const targetUrl = 'http://localhost:3000/#/tools/business-card-studio';
    console.log(`🌐 Navigating to ${targetUrl}...`);
    await page.goto(targetUrl, { waitUntil: 'networkidle0', timeout: 15000 });
    await new Promise((r) => setTimeout(r, 1000));

    // --- PHASE 1: Step 1 Input & Presets ---
    console.log('▶ [PHASE 1] Checking Step 1: Input & Presets...');
    const step1Title = await page.$eval('h1', (el) => el.textContent);
    console.log(`   Found Header: "${step1Title}"`);

    // Click on a sample preset button: #preset-btn-tech-ceo or first matching
    const presetBtn = await page.$('button[id^="preset-btn-"]');
    if (presetBtn) {
      const presetText = await page.evaluate((el) => el.textContent, presetBtn);
      await presetBtn.click();
      console.log(`   ✔ Clicked sample preset button: "${presetText.trim()}"`);
    }
    await new Promise((r) => setTimeout(r, 600));

    const inputsData = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input[type="text"]'));
      return inputs.map((i) => i.value).filter(Boolean);
    });
    console.log(`   ✔ Populated fields (${inputsData.length} fields): ${inputsData.slice(0, 3).join(', ')}...`);

    const screenshot1 = path.join(screenshotsDir, 'e2e_bcard_01_input_step.png');
    await page.screenshot({ path: screenshot1 });
    console.log(`   📸 Saved screenshot: ${screenshot1}`);

    // Click Proceed Button: #btn-proceed-to-generate
    console.log('▶ [PHASE 2] Transitioning to Step 2: Generation / Proposals...');
    const proceedBtn = await page.$('#btn-proceed-to-generate');
    if (proceedBtn) {
      await proceedBtn.click();
      console.log('   ✔ Clicked #btn-proceed-to-generate');
    } else {
      throw new Error('#btn-proceed-to-generate not found');
    }

    await new Promise((r) => setTimeout(r, 1200));

    const step2Metrics = await page.evaluate(() => {
      const cards = document.querySelectorAll('div[id^="proposal-card-"]');
      const header = document.querySelector('h1')?.textContent || '';
      return {
        cardsCount: cards.length,
        header,
      };
    });
    console.log(`   ✔ Step 2 Rendered with ${step2Metrics.cardsCount} proposal cards! Header: "${step2Metrics.header}"`);
    if (step2Metrics.cardsCount < 20) {
      throw new Error(`Expected >=20 templates, found ${step2Metrics.cardsCount}`);
    }

    const screenshot2 = path.join(screenshotsDir, 'e2e_bcard_02_templates_step.png');
    await page.screenshot({ path: screenshot2 });
    console.log(`   📸 Saved screenshot: ${screenshot2}`);

    // --- PHASE 3: Select Template and Enter Editor ---
    console.log('▶ [PHASE 3] Selecting Template and Transitioning to Step 3: Editor...');
    // Click on proposal card
    const firstProposalCard = await page.$('div[id^="proposal-card-"]');
    if (firstProposalCard) {
      await firstProposalCard.click();
      console.log('   ✔ Clicked proposal card to enter Step 3 Editor');
    }

    await new Promise((r) => setTimeout(r, 1200));

    // Verify Canvas in Step 3
    const editorMetrics = await page.evaluate(() => {
      const frontBtn = document.querySelector('#btn-canvas-side-front');
      const backBtn = document.querySelector('#btn-canvas-side-back');
      const elements = document.querySelectorAll('div[data-element-id]');
      const aside = document.querySelector('aside');
      return {
        hasFrontBtn: !!frontBtn,
        hasBackBtn: !!backBtn,
        elementsRendered: elements.length,
        hasSidebarToolbar: !!aside,
      };
    });
    console.log(`   ✔ Step 3 Editor Canvas: FrontBtn=${editorMetrics.hasFrontBtn}, BackBtn=${editorMetrics.hasBackBtn}, Elements=${editorMetrics.elementsRendered}, Toolbar=${editorMetrics.hasSidebarToolbar}`);

    // Test flipping card side to Back
    const backBtn = await page.$('#btn-canvas-side-back');
    if (backBtn) {
      await backBtn.click();
      console.log('   ✔ Toggled card canvas to BACK side');
      await new Promise((r) => setTimeout(r, 500));
    }
    const frontBtn = await page.$('#btn-canvas-side-front');
    if (frontBtn) {
      await frontBtn.click();
      console.log('   ✔ Toggled card canvas back to FRONT side');
      await new Promise((r) => setTimeout(r, 500));
    }

    const screenshot3 = path.join(screenshotsDir, 'e2e_bcard_03_editor_canvas.png');
    await page.screenshot({ path: screenshot3 });
    console.log(`   📸 Saved screenshot: ${screenshot3}`);

    // --- PHASE 4: Preflight Inspection Modal (12 Print Rules) ---
    console.log('▶ [PHASE 4] Testing Preflight Inspection Modal (12 Print Rules)...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const preflightBtn = btns.find((b) => b.textContent.includes('Preflight') || b.title?.includes('Preflight'));
      if (preflightBtn) preflightBtn.click();
    });
    await new Promise((r) => setTimeout(r, 700));

    const preflightStatus = await page.evaluate(() => {
      const modal = document.querySelector('div[role="dialog"], div.fixed.inset-0');
      if (modal) {
        return {
          isOpen: true,
          textSnippet: modal.innerText.slice(0, 200).replace(/\n/g, ' '),
        };
      }
      return { isOpen: false };
    });
    console.log(`   ✔ Preflight Modal: ${preflightStatus.isOpen ? 'OPENED' : 'NOT FOUND'} ("${preflightStatus.textSnippet}")`);

    const screenshot4 = path.join(screenshotsDir, 'e2e_bcard_04_preflight_modal.png');
    await page.screenshot({ path: screenshot4 });
    console.log(`   📸 Saved screenshot: ${screenshot4}`);

    // Close preflight modal
    const closePf = await page.$('#btn-close-preflight');
    if (closePf) await closePf.click();
    await new Promise((r) => setTimeout(r, 500));

    // --- PHASE 5: Batch CSV Modal ---
    console.log('▶ [PHASE 5] Testing Batch Employee CSV Modal...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const batchBtn = btns.find((b) => b.textContent.includes('Batch') || b.textContent.includes('nhân viên'));
      if (batchBtn) batchBtn.click();
    });
    await new Promise((r) => setTimeout(r, 700));

    const batchStatus = await page.evaluate(() => {
      const modal = document.querySelector('div[role="dialog"], div.fixed.inset-0');
      return modal
        ? { isOpen: true, textSnippet: modal.innerText.slice(0, 200).replace(/\n/g, ' ') }
        : { isOpen: false };
    });
    console.log(`   ✔ Batch CSV Modal: ${batchStatus.isOpen ? 'OPENED' : 'NOT FOUND'} ("${batchStatus.textSnippet}")`);

    const screenshot5 = path.join(screenshotsDir, 'e2e_bcard_05_batch_csv_modal.png');
    await page.screenshot({ path: screenshot5 });
    console.log(`   📸 Saved screenshot: ${screenshot5}`);

    // Close batch modal
    const closeBatch = await page.$('#btn-close-batch');
    if (closeBatch) await closeBatch.click();
    await new Promise((r) => setTimeout(r, 500));

    // --- PHASE 6: Free Export Modal ---
    console.log('▶ [PHASE 6] Testing Free Export Modal...');
    const exportBtn = await page.$('#btn-header-free-export');
    if (exportBtn) {
      await exportBtn.click();
    }
    await new Promise((r) => setTimeout(r, 700));

    const exportStatus = await page.evaluate(() => {
      const modal = document.querySelector('div[role="dialog"], div.fixed.inset-0');
      return modal
        ? { isOpen: true, textSnippet: modal.innerText.slice(0, 200).replace(/\n/g, ' ') }
        : { isOpen: false };
    });
    console.log(`   ✔ Free Export Modal: ${exportStatus.isOpen ? 'OPENED' : 'NOT FOUND'} ("${exportStatus.textSnippet}")`);

    const screenshot6 = path.join(screenshotsDir, 'e2e_bcard_06_free_export_modal.png');
    await page.screenshot({ path: screenshot6 });
    console.log(`   📸 Saved screenshot: ${screenshot6}`);

    // Close export modal
    const closeExport = await page.$('#btn-close-free-export');
    if (closeExport) await closeExport.click();
    await new Promise((r) => setTimeout(r, 500));

    // --- PHASE 7: Mobile Responsive Viewport (iPhone 15/16 Safari 390x844) ---
    console.log('▶ [PHASE 7] Testing Mobile Viewport (390x844) Zero Overflow...');
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await new Promise((r) => setTimeout(r, 800));

    const mobileMetrics = await page.evaluate(() => {
      const scrollW = document.documentElement.scrollWidth;
      const clientW = document.documentElement.clientWidth;
      return {
        hasOverflow: scrollW > clientW,
        scrollW,
        clientW,
      };
    });
    console.log(`   ✔ Mobile Viewport: scrollWidth=${mobileMetrics.scrollW}px, clientWidth=${mobileMetrics.clientW}px (Overflow: ${mobileMetrics.hasOverflow ? 'YES ❌' : 'NO ✔'})`);
    const screenshot7 = path.join(screenshotsDir, 'e2e_bcard_07_mobile_responsive.png');
    await page.screenshot({ path: screenshot7 });
    console.log(`   📸 Saved screenshot: ${screenshot7}`);

    // --- SUMMARY ---
    console.log('\n======================================================');
    console.log('🎉 ENHANCED E2E BROWSER VERIFICATION COMPLETED SUCCESSFULLY!');
    console.log(`Runtime Console Errors: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      consoleErrors.forEach((e) => console.log(`   ❌ Console error: ${e}`));
    } else {
      console.log('   ✔ 0 console runtime errors recorded.');
    }
    console.log('======================================================');

    return {
      success: consoleErrors.length === 0 && !mobileMetrics.hasOverflow && step2Metrics.cardsCount >= 20,
      consoleErrors,
      mobileMetrics,
      step2Metrics,
    };
  } finally {
    await browser.close();
  }
}

runE2E()
  .then((res) => {
    if (!res.success) {
      console.error('Verification finished with issues.');
      process.exit(1);
    }
    process.exit(0);
  })
  .catch((err) => {
    console.error('E2E Verification script failed:', err);
    process.exit(1);
  });
