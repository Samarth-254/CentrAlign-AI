import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SCREENSHOT_DIR = path.resolve(__dirname, '../docs/screenshots');

async function capture() {
  console.log('Capturing real live Approval Modal & Mid-Run from Console UI...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  // Reset database first
  await context.request.post('http://localhost:3000/api/reset');

  // Go to console
  await page.goto('http://localhost:3000/console');
  await page.waitForTimeout(600);

  // Click Run task
  await page.click('button:has-text("Run task")');
  console.log('Task started, waiting for execution progression...');

  // Wait 4 seconds for mid-run navigation and capture mid-run screenshot
  await page.waitForTimeout(4000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'console-mid-run-1440x900.png') });
  console.log('✓ Captured console-mid-run-1440x900.png');

  // Wait for the Approval Required modal to appear (within 20s)
  console.log('Waiting for policy gate to trigger Approval Modal...');
  await page.waitForSelector('text=Approval required', { timeout: 25000 });
  await page.waitForTimeout(500);

  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'console-approval-modal-1440x900.png') });
  console.log('✓ Captured console-approval-modal-1440x900.png');

  // Approve the action to let it finish
  await page.click('button:has-text("Approve action")');
  console.log('Approved action, waiting for run to complete and verify...');

  await page.waitForSelector('text=Completed & Verified', { timeout: 25000 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'console-completed-report-1440x900.png') });
  console.log('✓ Captured live console-completed-report-1440x900.png');

  await browser.close();
}

capture().catch(console.error);
