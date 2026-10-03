import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SCREENSHOT_DIR = path.resolve(__dirname, '../docs/screenshots');

async function capture() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  // Login
  await page.goto('http://localhost:3000/erp/login');
  await page.fill('#erp-username', 'finance@acme.test');
  await page.fill('#erp-password', 'books123');
  await page.click('#erp-login-submit');
  await page.waitForURL('**/erp/bills');

  // Server-side validation error page
  const errParams = encodeURIComponent(
    JSON.stringify({
      due_date: 'Due Date must be after Invoice Date',
      amount: 'Amount must be a positive number greater than 0',
      duplicate: 'Duplicate Bill: An invoice record with number INV-1042 already exists for Northwind Traders',
    })
  );
  await page.goto(`http://localhost:3000/erp/bills/new?errors=${errParams}&vendor_name=Northwind+Traders&invoice_no=INV-1042&amount=-50`);
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'erp-bills-new-error-1440x900.png') });
  console.log('✓ Captured erp-bills-new-error-1440x900.png with server-side error banners');

  await browser.close();
}

capture().catch(console.error);
