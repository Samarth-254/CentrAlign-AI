import { describe, it, expect } from 'vitest';
import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const RUNS_DIR = path.resolve(__dirname, '../runs');
const WEB_BASE_URL = process.env.WEB_BASE_URL || 'http://localhost:3000';
const AGENT_BASE_URL = process.env.AGENT_BASE_URL || 'http://localhost:4000';

describe('Console Run Settings UI and State Isolation', () => {
  it('displays recorded settings badges, disables toggles on past runs, and preserves live chaos state', async () => {
    let serversRunning = false;
    try {
      const [webRes, agentRes] = await Promise.all([
        fetch(`${WEB_BASE_URL}/api/chaos`, { signal: AbortSignal.timeout(1500) }),
        fetch(`${AGENT_BASE_URL}/health`, { signal: AbortSignal.timeout(1500) }),
      ]);
      serversRunning = webRes.ok && agentRes.ok;
    } catch {
      serversRunning = false;
    }

    if (!serversRunning) {
      console.log('Web and agent servers not both running; skipping live console Playwright UI test.');
      return;
    }

    // 1. Create two test runs with recorded settings directly in RUNS_DIR
    const run1Id = `run_test_settings_1_${Date.now()}`;
    const run2Id = `run_test_settings_2_${Date.now()}`;

    const run1Dir = path.join(RUNS_DIR, run1Id);
    const run2Dir = path.join(RUNS_DIR, run2Id);

    fs.mkdirSync(path.join(run1Dir, 'screenshots'), { recursive: true });
    fs.mkdirSync(path.join(run2Dir, 'screenshots'), { recursive: true });

    const run1Trace = [
      {
        type: 'run.started',
        runId: run1Id,
        timestamp: new Date(Date.now() - 60000).toISOString(),
        data: {
          runId: run1Id,
          goal: 'Run 1 Approval ON Chaos OFF',
          autoApprove: false,
          settings: {
            requireApprovalForWrites: true,
            chaosMode: false,
            askOnAmbiguity: true,
            headless: true,
            startedAt: new Date(Date.now() - 60000).toISOString(),
          },
        },
      },
      {
        type: 'run.completed',
        runId: run1Id,
        timestamp: new Date(Date.now() - 50000).toISOString(),
        data: {
          status: 'completed',
          summary: 'Run 1 completed successfully with approval required and chaos disabled.',
        },
      },
    ];

    const run2Trace = [
      {
        type: 'run.started',
        runId: run2Id,
        timestamp: new Date(Date.now() - 40000).toISOString(),
        data: {
          runId: run2Id,
          goal: 'Run 2 Approval OFF Chaos ON',
          autoApprove: true,
          settings: {
            requireApprovalForWrites: false,
            chaosMode: true,
            askOnAmbiguity: true,
            headless: true,
            startedAt: new Date(Date.now() - 40000).toISOString(),
          },
        },
      },
      {
        type: 'run.completed',
        runId: run2Id,
        timestamp: new Date(Date.now() - 30000).toISOString(),
        data: {
          status: 'completed',
          summary: 'Run 2 completed successfully with autonomous writes and chaos enabled.',
        },
      },
    ];

    fs.writeFileSync(path.join(run1Dir, 'trace.jsonl'), run1Trace.map((e) => JSON.stringify(e)).join('\n') + '\n');
    fs.writeFileSync(path.join(run2Dir, 'trace.jsonl'), run2Trace.map((e) => JSON.stringify(e)).join('\n') + '\n');

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', (err) => console.error('PAGE ERROR:', err.message));

    try {
      // Ensure initial live chaos state is false
      await fetch(`${WEB_BASE_URL}/api/chaos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: false }),
      });

      // 2. Open console
      await page.goto(`${WEB_BASE_URL}/console`, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForSelector(`[data-testid="run-item-${run1Id}"]`, { timeout: 10000 });
      await page.waitForSelector(`[data-testid="run-item-${run2Id}"]`, { timeout: 10000 });

      // 3. Verify history badges for both runs
      const run1Item = page.locator(`[data-testid="run-item-${run1Id}"]`);
      const run2Item = page.locator(`[data-testid="run-item-${run2Id}"]`);

      expect(await run1Item.locator('span:has-text("Approval on")').isVisible()).toBe(true);
      expect(await run1Item.locator('span:has-text("Chaos off")').isVisible()).toBe(true);

      expect(await run2Item.locator('span:has-text("Approval off")').isVisible()).toBe(true);
      expect(await run2Item.locator('span:has-text("Chaos on")').isVisible()).toBe(true);

      // 4. Click Run 1: Approval ON, Chaos OFF
      await run1Item.click();
      await page.waitForTimeout(500);

      // Verify toggles reflect Run 1 recorded values and show settings used label
      const approvalToggle1 = page.locator('#auto-approve-toggle');
      const chaosSwitch1 = page.locator('#chaos-switch');

      expect(await approvalToggle1.isDisabled()).toBe(true);
      expect(await page.locator('#approval-settings-label').textContent()).toContain('Settings used for this run');
      expect(await chaosSwitch1.isDisabled()).toBe(true);
      expect(await page.locator('#chaos-settings-label').textContent()).toContain('Settings used for this run');

      // Verify live sandbox chaos was NOT changed (remains false)
      const chaosCheck1 = await fetch(`${WEB_BASE_URL}/api/chaos`).then((r) => r.json());
      expect(chaosCheck1.enabled).toBe(false);

      // 5. Click Run 2: Approval OFF, Chaos ON
      await run2Item.click();
      await page.waitForTimeout(500);

      // Verify toggles reflect Run 2 recorded values
      const approvalToggle2 = page.locator('#auto-approve-toggle');
      const chaosSwitch2 = page.locator('#chaos-switch');

      expect(await approvalToggle2.isDisabled()).toBe(true);
      expect(await chaosSwitch2.isDisabled()).toBe(true);

      // Verify live sandbox chaos was NOT changed even though Run 2 had Chaos ON
      const chaosCheck2 = await fetch(`${WEB_BASE_URL}/api/chaos`).then((r) => r.json());
      expect(chaosCheck2.enabled).toBe(false);

      // 6. Click New task and verify toggles return to live editable state
      await page.click('button:has-text("+ New task")');
      await page.waitForTimeout(300);

      expect(await page.locator('#auto-approve-toggle').isEnabled()).toBe(true);
      expect(await page.locator('#chaos-switch').isEnabled()).toBe(true);
      expect(await page.locator('#approval-settings-label').isVisible()).toBe(false);
      expect(await page.locator('#chaos-settings-label').isVisible()).toBe(false);
    } finally {
      await context.close();
      await browser.close();

      // Clean up test runs
      try {
        fs.rmSync(run1Dir, { recursive: true, force: true });
        fs.rmSync(run2Dir, { recursive: true, force: true });
      } catch {}
    }
  }, 30000);
});
