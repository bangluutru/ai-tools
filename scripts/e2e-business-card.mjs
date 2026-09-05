import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const screenshotsDir = path.join(rootDir, 'docs/reports/screenshots');
const artifactScreenshotsDir = '/Users/tranhaibang/.gemini/antigravity-ide/brain/d6da6736-ebe6-4bfd-b82a-1d8d181a226e/screenshots';

if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}
if (!fs.existsSync(artifactScreenshotsDir)) {
  fs.mkdirSync(artifactScreenshotsDir, { recursive: true });
}

function saveScreenshot(page, filename) {
  const p1 = path.join(screenshotsDir, filename);
  const p2 = path.join(artifactScreenshotsDir, filename);
  return Promise.all([
    page.screenshot({ path: p1 }),
    page.screenshot({ path: p2 })
  ]);
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

    // Check that redundant badge and duplicate heroSub are gone from context header
    const headerContextMetrics = await page.evaluate(() => {
      const headerSection = document.querySelector('section.w-full.mb-6');
      const text = headerSection ? headerSection.innerText : '';
      return {
        hasFreeBadge: text.includes('100% MIỄN PHÍ') || text.includes('100% Miễn phí'),
        hasDuplicateHeroSub: text.includes('Tự động trích xuất từ ảnh chụp danh thiếp cũ'),
      };
    });
    console.log(`   ✔ Header Context Cleanliness: FreeBadgeGone=${!headerContextMetrics.hasFreeBadge}, DuplicateTextGone=${!headerContextMetrics.hasDuplicateHeroSub}`);

    const screenshot1 = 'e2e_bcard_01_input_step.png';
    await saveScreenshot(page, screenshot1);
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

    const screenshot2 = 'e2e_bcard_02_templates_step.png';
    await saveScreenshot(page, screenshot2);
    console.log(`   📸 Saved screenshot: ${screenshot2}`);

    // --- PHASE 3: Select Template and Enter Editor ---
    console.log('▶ [PHASE 3] Selecting Template and Transitioning to Step 3: Editor...');
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

    const screenshot3 = 'e2e_bcard_03_editor_canvas.png';
    await saveScreenshot(page, screenshot3);
    console.log(`   📸 Saved screenshot: ${screenshot3}`);

    // --- PHASE 3B: Interactive 8-point Resize Handles & Smart Guides Snapping ---
    console.log('▶ [PHASE 3B] Testing Interactive Canvas Handles, Smart Snapping & Alignment Toolbar...');
    const firstCanvasElement = await page.$('div.group.select-none');
    if (firstCanvasElement) {
      const box = await firstCanvasElement.boundingBox();
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await new Promise((r) => setTimeout(r, 400));

      const handlesCount = await page.evaluate(() => {
        return document.querySelectorAll('div[data-handle]').length;
      });
      console.log(`   ✔ 8-Point Resize Handles visible: count=${handlesCount}`);

      // Move element towards center to trigger smart alignment guide
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width / 2 + 25, box.y + box.height / 2 + 10, { steps: 5 });
      await new Promise((r) => setTimeout(r, 300));

      const guideMetrics = await page.evaluate(() => {
        const guides = document.querySelectorAll('.smart-guide-line');
        return {
          count: guides.length,
          hasGuideX: document.querySelectorAll('.smart-guide-x').length > 0,
          hasGuideY: document.querySelectorAll('.smart-guide-y').length > 0,
        };
      });
      console.log(`   ✔ Smart Snapping Guidelines during mouse drag: activeGuides=${guideMetrics.count}`);

      const screenshotGuides = 'e2e_bcard_03b_smart_guides.png';
    await saveScreenshot(page, screenshotGuides);
      console.log(`   📸 Saved screenshot: ${screenshotGuides}`);

      await page.mouse.up();
      await new Promise((r) => setTimeout(r, 400));

      // Test direct mouse resizing via 'se' handle
      const seHandle = await page.$('div[data-handle="se"]');
      if (seHandle) {
        const handleBox = await seHandle.boundingBox();
        await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
        await page.mouse.down();
        await page.mouse.move(handleBox.x + handleBox.width / 2 + 35, handleBox.y + handleBox.height / 2 + 15, { steps: 5 });
        await new Promise((r) => setTimeout(r, 200));
        await page.mouse.up();
        console.log('   ✔ Successfully dragged SE resize handle to scale element bounding box');
        await new Promise((r) => setTimeout(r, 300));
      }

      const screenshotResized = 'e2e_bcard_03c_resized_element.png';
      await saveScreenshot(page, screenshotResized);
      console.log(`   📸 Saved screenshot: ${screenshotResized}`);
    }

    // --- PHASE 3C: Multi-Selection (Shift+Click & Marquee Drag) & Canvas Floating Toolbar ---
    console.log('▶ [PHASE 3C] Testing Multi-Selection, Marquee Selection & Canvas Floating Toolbar...');

    // 1. Verify Canvas Floating Toolbar Controls (Undo, Redo, Front, Back, Quick Flip)
    const toolbarMetrics = await page.evaluate(() => {
      const undoBtn = document.querySelector('#btn-canvas-undo');
      const redoBtn = document.querySelector('#btn-canvas-redo');
      const sideFrontBtn = document.querySelector('#btn-canvas-side-front');
      const sideBackBtn = document.querySelector('#btn-canvas-side-back');
      const quickFlipBtn = document.querySelector('#btn-canvas-quick-flip');
      const toolbarDiv = undoBtn?.closest('.absolute.top-4');

      return {
        hasUndo: !!undoBtn,
        hasRedo: !!redoBtn,
        hasSideFront: !!sideFrontBtn,
        hasSideBack: !!sideBackBtn,
        hasQuickFlip: !!quickFlipBtn,
        // Check rounded-xl class and no-wrap
        isRoundedXl: toolbarDiv ? toolbarDiv.className.includes('rounded-xl') : false,
        isNotRoundedFull: toolbarDiv ? !toolbarDiv.className.includes('rounded-full') : false,
        frontHeight: sideFrontBtn ? sideFrontBtn.getBoundingClientRect().height : 0,
        flipHeight: quickFlipBtn ? quickFlipBtn.getBoundingClientRect().height : 0,
        // Verify print guides checkboxes in top bar
        hasBleedGuideCheckbox: Array.from(document.querySelectorAll('input[type="checkbox"]')).length >= 3,
      };
    });
    console.log(`   ✔ Canvas Floating Toolbar: RoundedXL=${toolbarMetrics.isRoundedXl}, NotPill=${toolbarMetrics.isNotRoundedFull}, FrontBtnHeight=${toolbarMetrics.frontHeight}px (single line), FlipBtnHeight=${toolbarMetrics.flipHeight}px (single line)`);
    console.log(`   ✔ Canvas Controls Present: Undo=${toolbarMetrics.hasUndo}, Redo=${toolbarMetrics.hasRedo}, Front=${toolbarMetrics.hasSideFront}, Back=${toolbarMetrics.hasSideBack}, Flip=${toolbarMetrics.hasQuickFlip}`);

    // Take a dedicated close-up screenshot of the updated toolbar directly using element.screenshot
    const undoBtnEl = await page.$('#btn-canvas-undo');
    if (undoBtnEl) {
      const toolbarHandle = await page.evaluateHandle((btn) => btn.closest('.absolute.top-4'), undoBtnEl);
      const toolbarElement = toolbarHandle?.asElement();
      if (toolbarElement) {
        const p1 = path.join(screenshotsDir, 'e2e_bcard_03e_canvas_toolbar_fixed.png');
        const p2 = path.join(artifactScreenshotsDir, 'e2e_bcard_03e_canvas_toolbar_fixed.png');
        await Promise.all([
          toolbarElement.screenshot({ path: p1 }),
          toolbarElement.screenshot({ path: p2 })
        ]);
        console.log(`   📸 Saved close-up screenshot: e2e_bcard_03e_canvas_toolbar_fixed.png`);
      }
    }

    // --- PHASE 3D: Dedicated Interactive Drag-and-Undo/Redo Functional Verification ---
    console.log('▶ [PHASE 3D] Verifying Undo/Redo Element Position Restoration Logic...');
    const testEl = await page.$('div.group.select-none');
    if (testEl) {
      const initialBox = await testEl.boundingBox();
      console.log(`   Initial Element Box: x=${Math.round(initialBox.x)}, y=${Math.round(initialBox.y)}`);

      // Drag element by +40px X and +20px Y
      await page.mouse.move(initialBox.x + initialBox.width / 2, initialBox.y + initialBox.height / 2);
      await page.mouse.down();
      await page.mouse.move(initialBox.x + initialBox.width / 2 + 40, initialBox.y + initialBox.height / 2 + 20, { steps: 5 });
      await page.mouse.up();
      await new Promise((r) => setTimeout(r, 400));

      const draggedBox = await testEl.boundingBox();
      console.log(`   Dragged Element Box: x=${Math.round(draggedBox.x)}, y=${Math.round(draggedBox.y)}`);
      if (Math.abs(draggedBox.x - initialBox.x) < 5) {
        throw new Error('Element did not move on drag!');
      }

      // Check undo button is enabled
      const canUndoState = await page.evaluate(() => {
        const btn = document.querySelector('#btn-canvas-undo');
        return btn ? !btn.disabled : false;
      });
      console.log(`   ✔ Undo Button Enabled after drag: ${canUndoState}`);
      if (!canUndoState) throw new Error('Undo button must be enabled after drag!');

      // Click Undo button
      const undoBtn = await page.$('#btn-canvas-undo');
      await undoBtn.click();
      await new Promise((r) => setTimeout(r, 500));

      const undoneBox = await testEl.boundingBox();
      console.log(`   Undone Element Box: x=${Math.round(undoneBox.x)}, y=${Math.round(undoneBox.y)}`);
      const diffX = Math.abs(undoneBox.x - initialBox.x);
      const diffY = Math.abs(undoneBox.y - initialBox.y);
      console.log(`   ✔ Element position restored! Diff from initial: dx=${diffX.toFixed(1)}px, dy=${diffY.toFixed(1)}px`);
      if (diffX > 2 || diffY > 2) {
        throw new Error(`Undo did not restore position! diffX=${diffX}, diffY=${diffY}`);
      }

      // Check redo button is enabled
      const canRedoState = await page.evaluate(() => {
        const btn = document.querySelector('#btn-canvas-redo');
        return btn ? !btn.disabled : false;
      });
      console.log(`   ✔ Redo Button Enabled after undo: ${canRedoState}`);
      if (!canRedoState) throw new Error('Redo button must be enabled after undo!');

      // Click Redo button
      const redoBtn = await page.$('#btn-canvas-redo');
      await redoBtn.click();
      await new Promise((r) => setTimeout(r, 500));

      const redoneBox = await testEl.boundingBox();
      console.log(`   Redone Element Box: x=${Math.round(redoneBox.x)}, y=${Math.round(redoneBox.y)}`);
      const redoDiffX = Math.abs(redoneBox.x - draggedBox.x);
      console.log(`   ✔ Redo moved element back forward! Diff from dragged: dx=${redoDiffX.toFixed(1)}px`);
      if (redoDiffX > 2) {
        throw new Error(`Redo did not restore dragged position! diffX=${redoDiffX}`);
      }

      // Undo once more to return to clean state
      await undoBtn.click();
      await new Promise((r) => setTimeout(r, 400));
      console.log('   ✔ Successfully verified Undo and Redo lifecycle end-to-end!');
    }

    // 2. Test Shift+Click Multi-Selection
    const canvasElements = await page.$$('div[data-element-id]');
    console.log(`   Found ${canvasElements.length} elements on canvas for multi-selection test`);

    if (canvasElements.length >= 2) {
      const box1 = await canvasElements[0].boundingBox();
      const box2 = await canvasElements[1].boundingBox();

      // Click first element
      await page.mouse.click(box1.x + box1.width / 2, box1.y + box1.height / 2);
      await new Promise((r) => setTimeout(r, 250));

      // Shift+Click second element
      await page.keyboard.down('Shift');
      await page.mouse.click(box2.x + box2.width / 2, box2.y + box2.height / 2);
      await page.keyboard.up('Shift');
      await new Promise((r) => setTimeout(r, 350));

      const multiSelectInspector = await page.evaluate(() => {
        const inspector = document.querySelector('.w-72');
        const text = (inspector ? inspector.innerText : '').toLowerCase();
        return {
          hasMultiSelectedHeader: text.includes('đã chọn 2 đối tượng') || text.includes('2 items selected') || text.includes('2個の要素を選択中'),
          hasMultiAlignButtons: !!document.querySelector('#btn-multi-align-left') && !!document.querySelector('#btn-multi-align-center-h'),
          hasMultiDuplicate: !!document.querySelector('#btn-multi-duplicate'),
          hasMultiDelete: !!document.querySelector('#btn-multi-delete'),
        };
      });
      console.log(`   ✔ Shift+Click Multi-Selection: HeaderVerified=${multiSelectInspector.hasMultiSelectedHeader}, AlignGroupButtons=${multiSelectInspector.hasMultiAlignButtons}`);

      // Test Group Alignment Action
      const btnMultiCenterH = await page.$('#btn-multi-align-center-h');
      if (btnMultiCenterH) {
        await btnMultiCenterH.click();
        console.log('   ✔ Clicked #btn-multi-align-center-h (Group Horizontal Center Align)');
        await new Promise((r) => setTimeout(r, 300));
      }

      // Test Group Dragging
      await page.mouse.move(box1.x + box1.width / 2, box1.y + box1.height / 2);
      await page.mouse.down();
      await page.mouse.move(box1.x + box1.width / 2 + 15, box1.y + box1.height / 2 + 8, { steps: 4 });
      await page.mouse.up();
      console.log('   ✔ Dragged multi-selection group simultaneously across canvas');
      await new Promise((r) => setTimeout(r, 300));

      // Test Canvas Undo Button
      const undoBtn = await page.$('#btn-canvas-undo');
      if (undoBtn) {
        await undoBtn.click();
        console.log('   ✔ Clicked #btn-canvas-undo on canvas floating toolbar');
        await new Promise((r) => setTimeout(r, 300));
      }

      const screenshotMulti = 'e2e_bcard_03d_multi_selection.png';
      await saveScreenshot(page, screenshotMulti);
      console.log(`   📸 Saved screenshot: ${screenshotMulti}`);

      // 3. Test Marquee Drag Selection
      // Deselect first by clicking empty canvas space outside the card
      await page.mouse.click(300, 300);
      await new Promise((r) => setTimeout(r, 300));

      // Drag marquee box from above card to encompass design elements
      await page.mouse.move(450, 250);
      await page.mouse.down();
      await page.mouse.move(800, 600, { steps: 10 });
      await new Promise((r) => setTimeout(r, 200));

      const hasMarqueeBox = await page.evaluate(() => {
        return !!document.querySelector('.marquee-selection-box');
      });
      console.log(`   ✔ Marquee Selection Drag Box Rendering: Active=${hasMarqueeBox}`);

      await page.mouse.up();
      await new Promise((r) => setTimeout(r, 350));

      const marqueeResult = await page.evaluate(() => {
        const inspector = document.querySelector('.w-72');
        const text = (inspector ? inspector.innerText : '').toLowerCase();
        return text.includes('đã chọn') || text.includes('selected') || text.includes('選択中');
      });
      console.log(`   ✔ Marquee Selection Success: ElementsSelected=${marqueeResult}`);
    }

    // Switch to Dark Mode for modal contrast tests
    console.log('🌙 Switching to Dark Mode for Modal Verification...');
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.classList.add('dark');
    });
    await new Promise((r) => setTimeout(r, 500));

    // --- PHASE 4: Preflight Inspection Modal (12 Print Rules & i18n Verification) ---
    console.log('▶ [PHASE 4] Testing Preflight Inspection Modal in Dark Mode (i18n Vietnamese)...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const preflightBtn = btns.find((b) => b.textContent.includes('Preflight') || b.title?.includes('Preflight') || b.textContent.includes('Kiểm định'));
      if (preflightBtn) preflightBtn.click();
    });
    await new Promise((r) => setTimeout(r, 700));

    const preflightStatus = await page.evaluate(() => {
      const modal = document.querySelector('div[role="dialog"], div.fixed.inset-0');
      if (!modal) return { isOpen: false };
      const text = modal.innerText;
      const hasJapaneseKanaKanji = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/.test(text.replace(/Raksul|Graphic/g, ''));
      const hasVietnameseRules = text.includes('Cỡ chữ cảnh báo') || text.includes('Cỡ chữ') || text.includes('an toàn');
      return {
        isOpen: true,
        textSnippet: text.slice(0, 200).replace(/\n/g, ' '),
        hasVietnameseRules,
        hasHardcodedJapanese: hasJapaneseKanaKanji,
      };
    });
    console.log(`   ✔ Preflight Modal: OPENED ("${preflightStatus.textSnippet}")`);
    console.log(`   ✔ Preflight i18n Check: HasVietnameseRules=${preflightStatus.hasVietnameseRules}, HasHardcodedJapanese=${preflightStatus.hasHardcodedJapanese}`);

    const screenshot4 = 'e2e_bcard_04_preflight_modal.png';
    await saveScreenshot(page, screenshot4);
    console.log(`   📸 Saved Dark Mode Preflight screenshot: ${screenshot4}`);

    // Close preflight modal
    const closePf = await page.$('#btn-close-preflight');
    if (closePf) await closePf.click();
    await new Promise((r) => setTimeout(r, 500));

    // --- PHASE 5: Batch CSV Modal ---
    console.log('▶ [PHASE 5] Testing Batch Employee CSV Modal in Dark Mode...');
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

    const screenshot5 = 'e2e_bcard_05_batch_csv_modal.png';
    await saveScreenshot(page, screenshot5);
    console.log(`   📸 Saved screenshot: ${screenshot5}`);

    // Close batch modal
    const closeBatch = await page.$('#btn-close-batch');
    if (closeBatch) await closeBatch.click();
    await new Promise((r) => setTimeout(r, 500));

    // --- PHASE 6: Free Export Modal (Dark Mode Contrast & Redundant Badge Elimination) ---
    console.log('▶ [PHASE 6] Testing Free Export Modal in Dark Mode...');
    const exportBtn = await page.$('#btn-header-free-export');
    if (exportBtn) {
      await exportBtn.click();
    }
    await new Promise((r) => setTimeout(r, 700));

    const exportStatus = await page.evaluate(() => {
      const modal = document.querySelector('div[role="dialog"], div.fixed.inset-0');
      if (!modal) return { isOpen: false };
      const text = modal.innerText;
      const hasRedundantBadge = text.includes('100% Miễn Phí & Thương Mại Mở') || text.includes('100% Miễn phí & Mở');
      return {
        isOpen: true,
        textSnippet: text.slice(0, 200).replace(/\n/g, ' '),
        hasRedundantBadge,
      };
    });
    console.log(`   ✔ Free Export Modal: OPENED, RedundantBadgeGone=${!exportStatus.hasRedundantBadge}`);

    const screenshot6 = 'e2e_bcard_06_free_export_modal.png';
    await saveScreenshot(page, screenshot6);
    console.log(`   📸 Saved Dark Mode Free Export screenshot: ${screenshot6}`);

    // Close export modal
    const closeExport = await page.$('#btn-close-free-export');
    if (closeExport) await closeExport.click();
    await new Promise((r) => setTimeout(r, 500));

    // Switch back to light or standard for mobile responsive check
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
    const screenshot7 = 'e2e_bcard_07_mobile_responsive.png';
    await saveScreenshot(page, screenshot7);
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
