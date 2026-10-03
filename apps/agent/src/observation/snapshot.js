import path from 'node:path';
import fs from 'node:fs';

/**
 * Capture a structured, flattened accessibility snapshot of the current Playwright page.
 * Assigns persistent data-agent-ref (e1, e2...) to all interactive elements.
 *
 * @param {import('playwright').Page} page
 * @param {Object} [options]
 * @param {string} [options.screenshotsDir] - Directory to save screenshot evidence
 * @param {number|string} [options.stepIndex] - Step index for screenshot naming
 * @param {string} [options.caption] - Screenshot caption
 * @returns {Promise<import('@centralign/shared').PageSnapshot>}
 */
export async function getPageSnapshot(page, options = {}) {
  const { screenshotsDir, stepIndex = 0, caption = 'Page state snapshot' } = options;

  const url = page.url();
  const title = await page.title();

  // Inject or update data-agent-ref on all interactive elements in DOM
  const elements = await page.evaluate(() => {
    // Helper to find accessible name or label
    function getAccessibleName(el) {
      if (el.getAttribute('aria-label')) return el.getAttribute('aria-label').trim();
      if (el.getAttribute('aria-labelledby')) {
        const labelled = document.getElementById(el.getAttribute('aria-labelledby'));
        if (labelled) return labelled.textContent.trim();
      }
      if (el.id) {
        const label = document.querySelector(`label[for="${el.id}"]`);
        if (label) return label.textContent.trim();
      }
      const parentLabel = el.closest('label');
      if (parentLabel) {
        return parentLabel.textContent.trim();
      }
      if (el.placeholder) return `placeholder: "${el.placeholder}"`;
      if (el.innerText && el.innerText.trim()) return el.innerText.trim();
      if (el.value && typeof el.value === 'string' && el.value.trim()) return el.value.trim();
      if (el.title) return el.title.trim();
      if (el.alt) return el.alt.trim();
      return '';
    }

    const interactiveSelectors = [
      'button:not([disabled])',
      'a[href]',
      'input:not([type="hidden"]):not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[role="button"]',
      '[role="link"]',
      '[role="checkbox"]',
      '[role="tab"]',
      '[contenteditable="true"]',
    ].join(',');

    const foundElements = Array.from(document.querySelectorAll(interactiveSelectors));
    const results = [];
    let counter = 1;

    for (const el of foundElements) {
      // Skip invisible elements
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      if (
        rect.width === 0 ||
        rect.height === 0 ||
        style.display === 'none' ||
        style.visibility === 'hidden' ||
        style.opacity === '0'
      ) {
        continue;
      }

      const ref = `e${counter++}`;
      el.setAttribute('data-agent-ref', ref);

      let role = el.getAttribute('role') || el.tagName.toLowerCase();
      if (el.tagName.toLowerCase() === 'input') {
        const type = el.getAttribute('type') || 'text';
        role = type === 'number' ? 'spinbutton' : type === 'checkbox' ? 'checkbox' : 'textbox';
      } else if (el.tagName.toLowerCase() === 'select') {
        role = 'select';
      } else if (el.tagName.toLowerCase() === 'textarea') {
        role = 'textbox';
      } else if (el.tagName.toLowerCase() === 'a') {
        role = 'link';
      }

      let optionsList = [];
      let selectedText = '';
      if (el.tagName.toLowerCase() === 'select') {
        const opts = Array.from(el.querySelectorAll('option'));
        optionsList = opts.map((o) => o.textContent.trim());
        const selectedOption = el.options[el.selectedIndex];
        selectedText = selectedOption ? selectedOption.textContent.trim() : '';
      }

      results.push({
        ref,
        role,
        name: getAccessibleName(el),
        value: el.value !== undefined ? String(el.value) : '',
        placeholder: el.placeholder || '',
        disabled: !!el.disabled,
        checked: !!el.checked,
        options: optionsList,
        selected: selectedText,
        href: el.getAttribute('href') || '',
      });
    }

    // Collect visible alert banners
    const alertElements = Array.from(
      document.querySelectorAll('[role="alert"], [role="status"], .text-red-400')
    );
    const alerts = alertElements
      .map((el) => el.innerText.trim())
      .filter((text) => text.length > 0 && text !== '*' && text.length < 300);

    // Collect headings
    const headingElements = Array.from(document.querySelectorAll('h1, h2, h3'));
    const headings = headingElements
      .map((el) => el.innerText.trim())
      .filter((text) => text.length > 0);

    // Inspect visible tables
    const tables = Array.from(document.querySelectorAll('table')).map((table) => {
      const headers = Array.from(table.querySelectorAll('th')).map((th) => th.innerText.trim());
      const rows = Array.from(table.querySelectorAll('tbody tr')).map((tr) => {
        const cells = Array.from(tr.querySelectorAll('td')).map((td) => {
          // Include any refs in this cell
          const refEl = td.querySelector('[data-agent-ref]');
          const refTag = refEl ? ` [${refEl.getAttribute('data-agent-ref')}]` : '';
          return `${td.innerText.trim()}${refTag}`;
        });
        return cells.join(' | ');
      });
      return { headers: headers.join(' | '), rows };
    });

    return { results, alerts, headings, tables };
  });

  // Save screenshot evidence if directory is provided
  let screenshotPath = null;
  if (screenshotsDir) {
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }
    screenshotPath = path.join(screenshotsDir, `step_${stepIndex}.png`);
    try {
      await page.screenshot({ path: screenshotPath, fullPage: false });
    } catch {
      screenshotPath = null;
    }
  }

  // Format compact text representation for LLM
  const lines = [];
  lines.push(`URL: ${url}`);
  lines.push(`Page Title: ${title}`);

  if (elements.alerts && elements.alerts.length > 0) {
    lines.push('\n[ACTIVE ALERTS & ERROR NOTICES]');
    elements.alerts.forEach((alert) => lines.push(`⚠️ ${alert}`));
  }

  if (elements.headings && elements.headings.length > 0) {
    lines.push('\n[PAGE HEADINGS]');
    elements.headings.forEach((h) => lines.push(`- ${h}`));
  }

  if (elements.tables && elements.tables.length > 0) {
    lines.push('\n[DATA TABLES]');
    elements.tables.forEach((table, idx) => {
      lines.push(`Table ${idx + 1}: ${table.headers}`);
      table.rows.slice(0, 10).forEach((r) => lines.push(`  ${r}`));
      if (table.rows.length > 10) {
        lines.push(`  ... and ${table.rows.length - 10} more rows (pagination controls below)`);
      }
    });
  }

  lines.push('\n[INTERACTIVE ELEMENTS]');
  for (const el of elements.results) {
    let desc = `[${el.ref}] ${el.role} "${el.name}"`;
    if (el.role === 'textbox' || el.role === 'spinbutton') {
      if (el.value) desc += ` value="${el.value}"`;
      if (el.placeholder && !el.name.includes(el.placeholder)) desc += ` placeholder="${el.placeholder}"`;
    } else if (el.role === 'select') {
      if (el.selected) desc += ` selected="${el.selected}"`;
      if (el.options.length > 0) {
        const preview = el.options.slice(0, 4).join(', ');
        desc += ` options: [${preview}${el.options.length > 4 ? ', ...' : ''}]`;
      }
    } else if (el.role === 'checkbox') {
      desc += el.checked ? ' (checked)' : ' (unchecked)';
    }
    lines.push(desc);
  }

  return {
    url,
    title,
    flattenedText: lines.join('\n'),
    interactiveElements: elements.results,
    headings: elements.headings,
    alerts: elements.alerts,
    screenshotPath,
  };
}
