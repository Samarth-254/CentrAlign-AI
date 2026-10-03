import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BASE_URL = process.env.WEB_BASE_URL || 'http://localhost:3000';

async function verifySandbox() {
  console.log('--- STARTING PHASE 2 SANDBOX VERIFICATION ---');
  console.log(`Target URL: ${BASE_URL}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ acceptDownloads: true });
  const page = await context.newPage();

  try {
    // 1. Reset Database to clean state
    console.log('[1/7] Testing Reset API...');
    const resetRes = await context.request.post(`${BASE_URL}/api/reset`);
    if (!resetRes.ok()) throw new Error(`Reset API failed: ${resetRes.status()}`);
    console.log('✓ Reset API succeeded.');

    // 2. Portal Auth & Navigation
    console.log('[2/7] Testing Vendor Portal authentication...');
    await page.goto(`${BASE_URL}/portal/vendors`);
    if (!page.url().includes('/portal/login')) {
      throw new Error(`Expected redirect to /portal/login, but was at ${page.url()}`);
    }

    await page.fill('#portal-username', 'ops@acme.test');
    await page.fill('#portal-password', 'demo123');
    await page.click('#portal-login-submit');
    await page.waitForURL('**/portal/vendors');
    console.log('✓ Portal login succeeded.');

    // 3. Vendor Invoice Table & Pagination
    console.log('[3/7] Testing Vendor Invoices & Pagination...');
    await Promise.all([
      page.waitForURL('**/portal/vendors/*/invoices*'),
      page.click('#view-vendor-northwind'),
    ]);
    await page.waitForSelector('#invoices-table');

    // Page 1 should not have INV-1042 because it is sorted by invoice_no (INV-1001..INV-1038)
    const hasNext = await page.$('#pagination-next');
    if (!hasNext) throw new Error('Pagination Next button missing');

    await Promise.all([
      page.waitForURL((url) => url.searchParams.get('page') === '2'),
      page.click('#pagination-next'),
    ]);
    console.log('✓ Pagination navigation succeeded to Page 2.');

    // Download PDF for INV-1042
    console.log('[4/7] Testing PDF Download for INV-1042...');
    const downloadPromise = page.waitForEvent('download');
    await page.click('#download-inv-1042');
    const download = await downloadPromise;
    const downloadPath = path.resolve(__dirname, '../data/test-download-inv-1042.pdf');
    await download.saveAs(downloadPath);

    const stats = fs.statSync(downloadPath);
    if (stats.size < 500) throw new Error(`Downloaded PDF is too small: ${stats.size} bytes`);
    console.log(`✓ PDF downloaded successfully (${stats.size} bytes).`);
    fs.unlinkSync(downloadPath); // clean up

    // 4. AcmeBooks ERP Auth
    console.log('[5/7] Testing AcmeBooks ERP authentication...');
    await page.goto(`${BASE_URL}/erp/bills`);
    if (!page.url().includes('/erp/login')) {
      throw new Error(`Expected redirect to /erp/login, but was at ${page.url()}`);
    }

    await page.fill('#erp-username', 'finance@acme.test');
    await page.fill('#erp-password', 'books123');
    await page.click('#erp-login-submit');
    await page.waitForURL('**/erp/bills');
    console.log('✓ AcmeBooks login succeeded.');

    // Pre-seeded duplicate bill check
    const existingBillRow = await page.textContent('#erp-bills-table');
    if (!existingBillRow.includes('GLX-890')) {
      throw new Error('Pre-seeded bill for GLX-890 missing in AcmeBooks table');
    }
    console.log('✓ Pre-seeded GLX-890 bill found.');

    // 5. Create New Bill (Hero T1 flow)
    console.log('[6/7] Testing Bill Creation with Validation...');
    await page.click('#create-new-bill-button');
    await page.waitForURL('**/erp/bills/new');

    await page.selectOption('#bill-vendor', 'Northwind Traders');
    await page.fill('#bill-invoice-no', 'INV-1042');
    await page.fill('#bill-invoice-date', '15/11/2026');
    await page.fill('#bill-due-date', '15/12/2026');
    await page.fill('#bill-amount', '12450.00');
    await page.selectOption('#bill-currency', 'USD');
    await page.fill('#bill-notes', 'Automated verification test bill');

    await page.click('#submit-bill-button');
    await page.waitForURL('**/erp/bills/bill_*');

    const createdBanner = await page.$('#bill-created-banner');
    if (!createdBanner) throw new Error('Green "Bill created" banner missing after submit');
    const billStatus = await page.textContent('#bill-status-badge');
    if (!billStatus.includes('Pending Approval')) {
      throw new Error(`Expected status Pending Approval, got ${billStatus}`);
    }
    console.log('✓ Bill created successfully with Pending Approval status and green banner.');

    // Test Duplicate Detection
    console.log('Testing duplicate bill prevention...');
    await page.goto(`${BASE_URL}/erp/bills/new`);
    await page.selectOption('#bill-vendor', 'Northwind Traders');
    await page.fill('#bill-invoice-no', 'INV-1042');
    await page.fill('#bill-invoice-date', '15/11/2026');
    await page.fill('#bill-due-date', '15/12/2026');
    await page.fill('#bill-amount', '12450.00');
    await page.click('#submit-bill-button');

    await page.waitForSelector('#error-banner-duplicate');
    const dupText = await page.textContent('#error-banner-duplicate');
    if (!dupText.includes('Duplicate')) throw new Error('Duplicate banner text mismatch');
    console.log('✓ Duplicate bill correctly rejected with error banner.');

    // 6. Test Chaos Mode (Transient 500 Simulation)
    console.log('[7/7] Testing Chaos Mode (500 error on 1st attempt, success on 2nd)...');
    await context.request.post(`${BASE_URL}/api/chaos`, { data: { enabled: true } });

    await page.goto(`${BASE_URL}/erp/bills/new`);
    await page.selectOption('#bill-vendor', 'Initech Software');
    await page.fill('#bill-invoice-no', 'INT-999');
    await page.fill('#bill-invoice-date', '01/10/2026');
    await page.fill('#bill-due-date', '01/11/2026');
    await page.fill('#bill-amount', '9999.00');

    // Attempt 1: Expect HTTP 500
    const [response1] = await Promise.all([
      page.waitForResponse((res) => res.url().includes('/erp/api/bills')),
      page.click('#submit-bill-button'),
    ]);
    if (response1.status() !== 500) {
      throw new Error(`Expected 500 during Chaos attempt 1, got ${response1.status()}`);
    }
    console.log('✓ Chaos Mode: 1st submit correctly returned transient HTTP 500.');

    // Attempt 2: Go back and retry -> Must succeed!
    await page.goBack();
    const [response2] = await Promise.all([
      page.waitForNavigation(),
      page.click('#submit-bill-button'),
    ]);
    if (!page.url().includes('/erp/bills/bill_')) {
      throw new Error(`Expected retry to succeed and redirect to bill detail, got ${page.url()}`);
    }
    console.log('✓ Chaos Mode: 2nd submit retry succeeded!');

    // Disable Chaos Mode
    await context.request.post(`${BASE_URL}/api/chaos`, { data: { enabled: false } });

    console.log('\n======================================================');
    console.log('🎉 ALL PHASE 2 SANDBOX VERIFICATION CHECKS PASSED!');
    console.log('======================================================\n');
  } finally {
    await browser.close();
  }
}

verifySandbox().catch((err) => {
  console.error('\n❌ Sandbox Verification Failed:', err);
  process.exit(1);
});
