import { describe, it, expect } from 'vitest';
import { chromium } from 'playwright';
import { getPageSnapshot } from '../src/observation/snapshot.js';

describe('Accessibility Snapshot Flattening & Proof of Usability', () => {
  it('correctly snapshots and flattens the ERP new bill form', async () => {
    let serverAvailable = false;
    try {
      const res = await fetch('http://localhost:3000/erp/login', { signal: AbortSignal.timeout(1500) });
      if (res.status < 500) serverAvailable = true;
    } catch {
      serverAvailable = false;
    }

    if (!serverAvailable) {
      console.log('Sandbox server not running on localhost:3000; skipping live browser snapshot integration test.');
      return;
    }

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      // 1. Log in to ERP
      await page.goto('http://localhost:3000/erp/login', { waitUntil: 'load', timeout: 10000 });
      await page.fill('#erp-username', 'finance@acme.test');
      await page.fill('#erp-password', 'books123');
      await page.click('#erp-login-submit');
      await page.waitForURL('**/erp/bills');

      // 2. Navigate to New Bill Form
      await page.goto('http://localhost:3000/erp/bills/new');
      await page.waitForSelector('#new-bill-form');

      // 3. Capture snapshot
      const snapshot = await getPageSnapshot(page);

      // Verify core snapshot properties
      expect(snapshot.url).toContain('/erp/bills/new');
      expect(snapshot.title).toBe('CentrAlign Task Worker Sandbox & Console');
      expect(snapshot.headings).toContain('New Bill Entry');
      expect(snapshot.interactiveElements.length).toBeGreaterThan(5);

      // Verify refs are assigned and interactive elements found
      const vendorSelect = snapshot.interactiveElements.find((e) => e.role === 'select' && e.name.includes('Vendor'));
      const invoiceInput = snapshot.interactiveElements.find((e) => e.role === 'textbox' && e.name.includes('Invoice Number'));
      const submitBtn = snapshot.interactiveElements.find((e) => e.role === 'button' && e.name.includes('Submit Bill'));

      expect(vendorSelect).toBeDefined();
      expect(vendorSelect.ref).toMatch(/^e\d+$/);
      expect(invoiceInput).toBeDefined();
      expect(invoiceInput.ref).toMatch(/^e\d+$/);
      expect(submitBtn).toBeDefined();
      expect(submitBtn.ref).toMatch(/^e\d+$/);

      console.log('\n========================================================================');
      console.log('PROVING SNAPSHOT USABILITY: FLATTENED SNAPSHOT OF ERP FORM PAGE:');
      console.log('========================================================================\n');
      console.log(snapshot.flattenedText);
      console.log('\n========================================================================\n');
    } finally {
      await browser.close();
    }
  }, 30000);
});
