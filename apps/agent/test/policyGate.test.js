import { describe, it, expect } from 'vitest';
import { evaluatePolicyGate } from '../src/policy/policyGate.js';

describe('Deterministic Policy Gate', () => {
  const policy = {
    requireApprovalForWrites: true,
    askOnAmbiguity: true,
    allowedDomains: ['localhost', '127.0.0.1'],
    maxToolCalls: 25,
    maxRetriesPerStep: 3,
  };

  it('permits navigation to allowlisted domains', async () => {
    const decision = await evaluatePolicyGate(
      { name: 'browser_goto', args: { url: 'http://localhost:3000/portal/login' } },
      { policy }
    );
    expect(decision.allowed).toBe(true);
    expect(decision.requiresApproval).toBe(false);
  });

  it('blocks navigation to non-allowlisted external domains', async () => {
    const decision = await evaluatePolicyGate(
      { name: 'browser_goto', args: { url: 'https://malicious-external-site.com' } },
      { policy }
    );
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toContain('blocked by security policy');
  });

  it('requires human approval when clicking submit button on a form', async () => {
    const mockSnapshot = {
      interactiveElements: [
        { ref: 'e1', role: 'textbox', name: 'Invoice Number', value: 'INV-1042' },
        { ref: 'e2', role: 'button', name: 'Submit Bill' },
      ],
      screenshotPath: '/tmp/screenshot.png',
    };

    const decision = await evaluatePolicyGate(
      { name: 'browser_click', args: { ref: 'e2' }, rationale: 'Submitting entered bill' },
      { policy, snapshot: mockSnapshot, autoApprove: false }
    );

    expect(decision.allowed).toBe(true);
    expect(decision.requiresApproval).toBe(true);
    expect(decision.payload.action).toBe('Submit Bill');
    expect(decision.payload.currentFormValues['Invoice Number']).toBe('INV-1042');
  });

  it('allows submit button when autoApprove is true', async () => {
    const mockSnapshot = {
      interactiveElements: [
        { ref: 'e2', role: 'button', name: 'Submit Bill' },
      ],
    };

    const decision = await evaluatePolicyGate(
      { name: 'browser_click', args: { ref: 'e2' } },
      { policy, snapshot: mockSnapshot, autoApprove: true }
    );

    expect(decision.allowed).toBe(true);
    expect(decision.requiresApproval).toBe(false);
  });

  it('permits read-only actions without approval', async () => {
    const decision = await evaluatePolicyGate(
      { name: 'browser_snapshot', args: {} },
      { policy }
    );
    expect(decision.allowed).toBe(true);
    expect(decision.requiresApproval).toBe(false);
  });
});
