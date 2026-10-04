import { isAllowedDomain } from '../tools/browser.js';
import { TOOL_DEFINITIONS } from '../tools/registry.js';
import { maskSecretsDeep } from '../security/secrets.js';

/**
 * Determine if a proposed tool call requires human approval before execution
 * @param {import('@centralign/shared').ToolCall} toolCall
 * @param {Object} options
 * @param {import('@centralign/shared').PolicyConfig} options.policy
 * @param {import('playwright').Page} [options.page]
 * @param {Object} [options.snapshot]
 * @returns {Promise<{allowed: boolean, requiresApproval: boolean, reason?: string, payload?: Object}>}
 */
export async function evaluatePolicyGate(toolCall, options = {}) {
  const { policy = {}, snapshot, autoApprove = false } = options;
  const { name, args = {}, rationale = '' } = toolCall;

  // 1. Check if tool exists
  const def = TOOL_DEFINITIONS[name];
  if (!def) {
    return {
      allowed: false,
      requiresApproval: false,
      reason: `Tool "${name}" is not registered in the system tool catalog.`,
    };
  }

  // 2. Allowed domain check for browser_goto
  if (name === 'browser_goto') {
    const url = args.url || '';
    const allowed = isAllowedDomain(url, policy.allowedDomains);
    if (!allowed) {
      return {
        allowed: false,
        requiresApproval: false,
        reason: `Domain for URL "${url}" is blocked by security policy. Only allowlisted internal domains are permitted.`,
      };
    }
  }

  // 3. Human requested approval directly via request_approval
  if (name === 'request_approval') {
    if (autoApprove) {
      return { allowed: true, requiresApproval: false };
    }
    return {
      allowed: true,
      requiresApproval: true,
      reason: 'Agent explicitly requested human approval before proceeding.',
      payload: {
        action: args.action || 'Proposed Mutation',
        description: args.description || 'The agent proposed an action requiring sign-off.',
        values: maskSecretsDeep(args.payload || {}),
        rationale,
      },
    };
  }

  // 4. Irreversible Write Operation Gate
  // When requireApprovalForWrites is true, detect mutating clicks like "Submit Bill" or "Mark as Paid"
  if (policy.requireApprovalForWrites && !autoApprove) {
    if (name === 'browser_click') {
      const ref = args.ref;
      const targetEl = (snapshot?.interactiveElements || []).find((el) => el.ref === ref);

      const isSubmitOrPay = targetEl && (
        targetEl.role === 'button' && (
          targetEl.name.toLowerCase().includes('submit') ||
          targetEl.name.toLowerCase().includes('mark as paid') ||
          targetEl.name.toLowerCase().includes('pay')
        )
      );

      if (isSubmitOrPay) {
        // Collect current form field values from snapshot for rich human payload
        const formFields = {};
        for (const el of snapshot.interactiveElements) {
          if (el.role === 'textbox' || el.role === 'spinbutton' || el.role === 'select') {
            formFields[el.name] = el.value || el.selected || '';
          }
        }

        return {
          allowed: true,
          requiresApproval: true,
          reason: `Action "${targetEl.name}" modifies company system of record and requires human approval.`,
          payload: {
            action: targetEl.name,
            ref,
            targetRole: targetEl.role,
            currentFormValues: maskSecretsDeep(formFields),
            rationale,
            screenshotPath: snapshot.screenshotPath,
          },
        };
      }
    }
  }

  // Action permitted
  return {
    allowed: true,
    requiresApproval: false,
  };
}
