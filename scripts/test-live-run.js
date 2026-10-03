import { chromium } from 'playwright';

async function testLiveRun() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });

  console.log('Navigating to http://localhost:3000/console ...');
  await page.goto('http://localhost:3000/console', { waitUntil: 'networkidle' });

  // Make sure auto-approve writes is checked so it doesn't pause
  const autoApproveToggle = page.locator('#auto-approve-toggle');
  if (await autoApproveToggle.isChecked()) {
    // Already checked, which means "Require approval" is checked. Let's uncheck "Require approval"
    await autoApproveToggle.click();
    console.log('Unchecked require approval for writes (enabled auto-approve)');
  }

  // Click "Run task →"
  const runBtn = page.locator('button:has-text("Run task →")');
  console.log('Clicking Run task...');
  await runBtn.click();

  // Wait for run to finish (status pill changes to Completed)
  console.log('Waiting for run to complete...');
  await page.waitForSelector('text=Completed & Verified', { timeout: 30000 });
  console.log('Run completed & verified!');

  await page.waitForTimeout(1000);

  // 1. Verify Browser Tab Screenshot
  const browserImg = page.locator('img[alt="Agent Live View"]');
  const imgVisible = await browserImg.isVisible();
  console.log('Browser tab live screenshot image visible:', imgVisible);
  if (imgVisible) {
    const src = await browserImg.getAttribute('src');
    console.log('Image src length:', src?.length, 'starts with data:image:', src?.startsWith('data:image'));
  }
  await page.screenshot({ path: 'docs/screenshots/verify-browser-screenshot.png' });
  console.log('Saved verify-browser-screenshot.png');

  // 2. Click on "Plan" tab in right inspector
  const planTabBtn = page.locator('button:has-text("Plan")').first();
  await planTabBtn.click();
  await page.waitForTimeout(500);

  // Check Plan tab step badges
  const inProgressBadges = await page.locator('text=in_progress').count();
  const doneBadges = await page.locator('text=done').count();
  console.log(`Plan steps status: in_progress count = ${inProgressBadges}, done count = ${doneBadges}`);

  await page.screenshot({ path: 'docs/screenshots/verify-plan-done.png' });
  console.log('Saved verify-plan-done.png');

  await browser.close();
  console.log('Test complete!');
}

testLiveRun().catch((err) => {
  console.error(err);
  process.exit(1);
});
