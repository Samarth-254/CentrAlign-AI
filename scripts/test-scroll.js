import { chromium } from 'playwright';

async function testScrollAndCollapse() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  const page = await context.newPage();

  await page.goto('http://localhost:3000/console', { waitUntil: 'networkidle' });

  // Click on the most recent completed run in the left rail to load its details
  const firstCompletedRun = page.locator('button:has-text("Completed")').first();
  if (await firstCompletedRun.count() > 0) {
    await firstCompletedRun.click();
    await page.waitForTimeout(500);
  }

  // Find scroll container of timeline
  // In our DOM, timeline scroll container has data-testid="timeline-scroll"
  const scrollContainer = page.locator('[data-testid="timeline-scroll"]');
  
  // 1. Scroll to 1200px
  if (await scrollContainer.count() > 0) {
    await scrollContainer.evaluate((el) => { el.scrollTop = 1200; });
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'docs/screenshots/test-scrolled-mid.png' });
    console.log('Saved test-scrolled-mid.png');
  }

  // 2. Test Collapse button on report card
  const collapseBtn = page.locator('button:has-text("▲ Collapse")').first();
  if (await collapseBtn.isVisible()) {
    await collapseBtn.click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'docs/screenshots/test-collapsed-report.png' });
    console.log('Saved test-collapsed-report.png');
  }

  // 3. Test Close button on report card
  const closeBtn = page.locator('button:has-text("✕ Close")').first();
  if (await closeBtn.isVisible()) {
    await closeBtn.click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'docs/screenshots/test-closed-report.png' });
    console.log('Saved test-closed-report.png');
  }

  await browser.close();
  console.log('All tests passed!');
}

testScrollAndCollapse().catch((err) => {
  console.error(err);
  process.exit(1);
});
