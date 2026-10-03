import { chromium } from 'playwright';

async function capture() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:3000/console', { waitUntil: 'networkidle' });
  const firstCompletedRun = page.locator('button:has-text("Completed")').first();
  if (await firstCompletedRun.count() > 0) {
    await firstCompletedRun.click();
    await page.waitForTimeout(500);
  }
  await page.screenshot({ path: 'docs/screenshots/console-completed-report-1440x900.png' });
  await browser.close();
  console.log('Updated console-completed-report-1440x900.png');
}

capture();
