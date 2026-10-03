import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SCREENSHOT_DIR = path.resolve(__dirname, '../docs/screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const VIEWPORTS = [
  { name: '1440x900', width: 1440, height: 900 },
  { name: '1024x768', width: 1024, height: 768 },
  { name: '390x844', width: 390, height: 844, isMobile: true },
];

async function capture() {
  console.log('Capturing production screenshots in black & orange design system...');
  const browser = await chromium.launch({ headless: true });

  for (const vp of VIEWPORTS) {
    console.log(`\n--- Viewport: ${vp.name} ---`);
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      isMobile: !!vp.isMobile,
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();

    // 1. Portal Login
    console.log('1. /portal/login');
    await page.goto('http://localhost:3000/portal/login');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, `portal-login-${vp.name}.png`) });

    // Login to portal
    await page.fill('#portal-username', 'ops@acme.test');
    await page.fill('#portal-password', 'demo123');
    await page.click('#portal-login-submit');
    await page.waitForURL('**/portal/vendors');

    // 2. Portal Vendor Invoices
    console.log('2. /portal/vendors/vnd_northwind/invoices');
    await page.goto('http://localhost:3000/portal/vendors/vnd_northwind/invoices');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, `portal-invoices-${vp.name}.png`) });

    // 3. ERP Login
    console.log('3. ERP Login');
    await page.goto('http://localhost:3000/erp/login');
    await page.fill('#erp-username', 'finance@acme.test');
    await page.fill('#erp-password', 'books123');
    await page.click('#erp-login-submit');
    await page.waitForURL('**/erp/bills');

    // 4. ERP Bills list
    console.log('4. /erp/bills');
    await page.goto('http://localhost:3000/erp/bills');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, `erp-bills-${vp.name}.png`) });

    // 5. ERP Bills New with Validation Error
    console.log('5. /erp/bills/new with error');
    await page.goto('http://localhost:3000/erp/bills/new');
    await page.fill('#bill-amount', '-50');
    await page.click('#submit-bill-button');
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, `erp-bills-new-error-${vp.name}.png`) });

    // 6. ERP Bill Detail
    console.log('6. /erp/bills/[id]');
    const firstBillLink = await page.$('a[id^="view-bill-"]');
    if (firstBillLink) {
      await firstBillLink.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `erp-bill-detail-${vp.name}.png`) });
    }

    // 7. Console Idle
    console.log('7. /console (idle)');
    await page.goto('http://localhost:3000/console');
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, `console-idle-${vp.name}.png`) });

    // 8. Console Mid-run / Past Run Loaded
    console.log('8. /console (populated past run)');
    const pastRunItem = await page.$('aside button:has-text("run_")');
    if (pastRunItem) {
      await pastRunItem.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `console-completed-report-${vp.name}.png`) });
    }

    await context.close();
  }

  await browser.close();
  console.log('\n✓ All screenshots captured and saved to docs/screenshots/');
}

capture().catch((err) => {
  console.error(err);
  process.exit(1);
});
