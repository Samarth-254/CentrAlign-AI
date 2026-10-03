import path from 'node:path';
import fs from 'node:fs';
import { getPageSnapshot } from '../observation/snapshot.js';
import { substituteSecrets, maskSecrets } from '../security/secrets.js';

/**
 * Check if a URL origin is allowed by policy
 * @param {string} urlStr
 * @param {string[]} allowedDomains
 * @returns {boolean}
 */
export function isAllowedDomain(urlStr, allowedDomains = ['localhost', '127.0.0.1']) {
  try {
    const parsed = new URL(urlStr);
    return allowedDomains.some((d) => parsed.hostname === d || parsed.hostname.endsWith(`.${d}`));
  } catch {
    return false;
  }
}

/**
 * Browser tools implementation
 */
export const browserTools = {
  /**
   * Navigate to a URL
   */
  async browser_goto({ url }, ctx) {
    const { page, policy = { allowedDomains: ['localhost', '127.0.0.1'] } } = ctx;
    if (!isAllowedDomain(url, policy.allowedDomains)) {
      throw new Error(`Security Policy Blocked: Domain for URL "${url}" is not in the allowed domain whitelist.`);
    }

    await page.goto(url, { waitUntil: 'load', timeout: 15000 });
    const snapshot = await getPageSnapshot(page, {
      screenshotsDir: ctx.screenshotsDir,
      stepIndex: ctx.stepIndex,
    });
    return {
      navigatedTo: page.url(),
      title: snapshot.title,
      snapshot: snapshot.flattenedText,
      screenshotPath: snapshot.screenshotPath,
    };
  },

  /**
   * Capture a fresh page snapshot
   */
  async browser_snapshot(_args, ctx) {
    const { page } = ctx;
    const snapshot = await getPageSnapshot(page, {
      screenshotsDir: ctx.screenshotsDir,
      stepIndex: ctx.stepIndex,
    });
    return {
      url: page.url(),
      title: snapshot.title,
      snapshot: snapshot.flattenedText,
      interactiveElementsCount: snapshot.interactiveElements.length,
      screenshotPath: snapshot.screenshotPath,
    };
  },

  /**
   * Click an interactive element by ref e.g. "e12"
   */
  async browser_click({ ref }, ctx) {
    const { page } = ctx;
    const selector = `[data-agent-ref="${ref}"]`;
    const el = await page.$(selector);
    if (!el) {
      throw new Error(`Element ref "${ref}" not found in current page DOM. Call browser_snapshot to inspect current refs.`);
    }

    // Attempt standard click; if navigation happens, wait for network idle/load
    await el.click({ timeout: 5000 });
    await page.waitForTimeout(500); // allow microtasks to settle

    const snapshot = await getPageSnapshot(page, {
      screenshotsDir: ctx.screenshotsDir,
      stepIndex: ctx.stepIndex,
    });
    return {
      clickedRef: ref,
      currentUrl: page.url(),
      snapshot: snapshot.flattenedText,
      screenshotPath: snapshot.screenshotPath,
    };
  },

  /**
   * Type text into an input field by ref e.g. "e12"
   */
  async browser_type({ ref, text, clear = true, pressEnter = false }, ctx) {
    const { page } = ctx;
    const selector = `[data-agent-ref="${ref}"]`;
    const el = await page.$(selector);
    if (!el) {
      throw new Error(`Element ref "${ref}" not found in current page DOM.`);
    }

    // Substitute secrets at execution time
    const resolvedText = substituteSecrets(text);

    if (clear) {
      await el.fill('');
    }

    await el.fill(resolvedText);

    if (pressEnter) {
      await el.press('Enter');
      await page.waitForTimeout(500);
    }

    const snapshot = await getPageSnapshot(page, {
      screenshotsDir: ctx.screenshotsDir,
      stepIndex: ctx.stepIndex,
    });
    return {
      typedInRef: ref,
      maskedText: maskSecrets(text),
      currentValue: maskSecrets(await el.inputValue().catch(() => '')),
      snapshot: snapshot.flattenedText,
      screenshotPath: snapshot.screenshotPath,
    };
  },

  /**
   * Select dropdown option by ref
   */
  async browser_select({ ref, value }, ctx) {
    const { page } = ctx;
    const selector = `[data-agent-ref="${ref}"]`;
    const el = await page.$(selector);
    if (!el) {
      throw new Error(`Element ref "${ref}" not found in current page DOM.`);
    }

    // Can match by value or label
    try {
      await el.selectOption({ label: value }, { timeout: 3000 });
    } catch {
      await el.selectOption({ value: value }, { timeout: 3000 });
    }

    const snapshot = await getPageSnapshot(page, {
      screenshotsDir: ctx.screenshotsDir,
      stepIndex: ctx.stepIndex,
    });
    return {
      selectedRef: ref,
      selectedValue: value,
      snapshot: snapshot.flattenedText,
      screenshotPath: snapshot.screenshotPath,
    };
  },

  /**
   * Press a keyboard key e.g. "Enter", "Tab", "Escape"
   */
  async browser_press_key({ key }, ctx) {
    const { page } = ctx;
    await page.keyboard.press(key);
    await page.waitForTimeout(300);

    const snapshot = await getPageSnapshot(page, {
      screenshotsDir: ctx.screenshotsDir,
      stepIndex: ctx.stepIndex,
    });
    return {
      pressedKey: key,
      currentUrl: page.url(),
      snapshot: snapshot.flattenedText,
    };
  },

  /**
   * Wait for text or selector to appear
   */
  async browser_wait_for({ textOrSelector, timeoutMs = 5000 }, ctx) {
    const { page } = ctx;
    try {
      if (textOrSelector.startsWith('/') || textOrSelector.startsWith('#') || textOrSelector.startsWith('.')) {
        await page.waitForSelector(textOrSelector, { timeout: timeoutMs });
      } else {
        await page.waitForFunction(
          (text) => document.body.innerText.includes(text),
          textOrSelector,
          { timeout: timeoutMs }
        );
      }
      return { ok: true, matched: textOrSelector };
    } catch (err) {
      throw new Error(`Timed out waiting for "${textOrSelector}" after ${timeoutMs}ms.`);
    }
  },

  /**
   * Download a file via link ref and save into the run workspace
   */
  async browser_download({ ref, filename }, ctx) {
    const { page, workspaceDir } = ctx;
    const selector = `[data-agent-ref="${ref}"]`;
    const el = await page.$(selector);
    if (!el) {
      throw new Error(`Element ref "${ref}" not found for download.`);
    }

    if (!fs.existsSync(workspaceDir)) {
      fs.mkdirSync(workspaceDir, { recursive: true });
    }

    // Set up download event listener
    const downloadPromise = page.waitForEvent('download', { timeout: 10000 });
    await el.click();
    const download = await downloadPromise;

    const suggestedName = filename || download.suggestedFilename() || `download_${Date.now()}.pdf`;
    const savePath = path.join(workspaceDir, suggestedName);
    await download.saveAs(savePath);

    const stats = fs.statSync(savePath);
    return {
      savedPath: savePath,
      filename: suggestedName,
      bytes: stats.size,
      message: `File downloaded successfully to workspace: ${suggestedName} (${stats.size} bytes)`,
    };
  },

  /**
   * Capture a standalone screenshot evidence
   */
  async browser_screenshot({ caption = 'Evidence' }, ctx) {
    const { page, screenshotsDir, stepIndex = 0 } = ctx;
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }
    const screenshotPath = path.join(screenshotsDir, `evidence_${stepIndex}_${Date.now()}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: false });
    return {
      screenshotPath,
      caption,
      url: page.url(),
    };
  },

  /**
   * Get text content of an element or entire page
   */
  async browser_get_text({ ref }, ctx) {
    const { page } = ctx;
    if (ref) {
      const selector = `[data-agent-ref="${ref}"]`;
      const el = await page.$(selector);
      if (!el) throw new Error(`Element ref "${ref}" not found.`);
      const text = await el.innerText();
      return { text: text.trim() };
    }
    const bodyText = await page.innerText('body');
    return { text: bodyText.trim().substring(0, 4000) };
  },

  /**
   * Navigate back in browser history
   */
  async browser_go_back(_args, ctx) {
    const { page } = ctx;
    await page.goBack({ timeout: 5000 });
    const snapshot = await getPageSnapshot(page, {
      screenshotsDir: ctx.screenshotsDir,
      stepIndex: ctx.stepIndex,
    });
    return {
      currentUrl: page.url(),
      snapshot: snapshot.flattenedText,
    };
  },
};
