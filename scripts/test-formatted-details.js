import { chromium } from 'playwright';

async function testFormattedDetails() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });

  await page.goto('http://localhost:3000/console', { waitUntil: 'networkidle' });

  // Click on the most recent completed run in left rail
  const firstCompletedRun = page.locator('button:has-text("Completed")').first();
  if (await firstCompletedRun.count() > 0) {
    await firstCompletedRun.click();
    await page.waitForTimeout(500);
  }

  // Find step with "Submit Bill" or the last browser_click step
  const clickCards = page.locator('.border:has-text("browser_click")');
  const lastClickCard = clickCards.last();
  const viewDetailsBtn = lastClickCard.locator('button:has-text("▸ View details")');
  
  if (await viewDetailsBtn.isVisible()) {
    await viewDetailsBtn.scrollIntoViewIfNeeded();
    await viewDetailsBtn.click();
    await page.waitForTimeout(500);
    await lastClickCard.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
  }

  await page.screenshot({ path: 'docs/screenshots/test-step-formatted-output.png' });
  console.log('Saved test-step-formatted-output.png');

  await browser.close();
}

testFormattedDetails().catch((err) => {
  console.error(err);
  process.exit(1);
});
