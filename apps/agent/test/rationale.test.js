import { describe, it, expect } from 'vitest';
import { RationaleSchema, deriveHonestFallbackRationale } from '../src/nodes/decide.js';

describe('Rationale Validation and Honest Fallback', () => {
  it('rejects generic filler phrases', () => {
    const fillers = [
      'Proceeding with next strategic step.',
      'Continuing with the plan as planned.',
      'Taking the next step in our strategic workflow.',
      'Proceeding to open the browser window now.',
      'Continuing as planned to complete the goal.',
    ];

    for (const filler of fillers) {
      const result = RationaleSchema.safeParse(filler);
      expect(result.success).toBe(false);
    }
  });

  it('rejects empty or excessively short rationales', () => {
    const invalid = [
      '',
      '   ',
      'Opening page.',
      'Done.',
      'Clicking submit button now.',
    ];

    for (const text of invalid) {
      const result = RationaleSchema.safeParse(text);
      expect(result.success).toBe(false);
    }
  });

  it('accepts valid, concrete rationales citing specific criteria or actions', () => {
    const valids = [
      'Opening page 2 because the latest issued invoice may not be on page 1.',
      'Re-entering the due date as 16/10/2026 because the form rejected the previous format.',
      'Extracting invoice fields from PDF GLX-890.pdf to determine payable total and issue date.',
      'Navigating to vendor portal directory to inspect Northwind Traders issued invoices.',
    ];

    for (const text of valids) {
      const result = RationaleSchema.safeParse(text);
      expect(result.success).toBe(true);
    }
  });

  it('derives honest, deterministic fallback rationales meeting all criteria', () => {
    const fallbackGoto = deriveHonestFallbackRationale('browser_goto', { url: 'http://localhost:3000/portal/login' });
    expect(fallbackGoto).toBeTruthy();
    expect(fallbackGoto.split(/\s+/).length).toBeGreaterThanOrEqual(8);
    expect(RationaleSchema.safeParse(fallbackGoto).success).toBe(true);

    const fallbackExtract = deriveHonestFallbackRationale('pdf_extract_fields', { pdfPath: '/invoices/GLX-890.pdf' });
    expect(fallbackExtract).toBeTruthy();
    expect(RationaleSchema.safeParse(fallbackExtract).success).toBe(true);

    const fallbackApproval = deriveHonestFallbackRationale('request_approval', { action: 'Create AcmeBooks bill' });
    expect(fallbackApproval).toBeTruthy();
    expect(RationaleSchema.safeParse(fallbackApproval).success).toBe(true);
  });

  it('fails if any step in a sample trace has a generic or empty rationale', () => {
    const validTrace = [
      {
        step: 1,
        tool: 'browser_goto',
        rationale: 'Navigating to vendor portal directory to inspect Northwind Traders issued invoices.',
      },
      {
        step: 2,
        tool: 'pdf_extract_fields',
        rationale: 'Extracting invoice fields from PDF GLX-890.pdf to determine payable total and issue date.',
      },
    ];

    const validateTrace = (trace) => {
      for (const item of trace) {
        if (!item.rationale || !item.rationale.trim()) {
          throw new Error(`Step ${item.step} has an empty rationale.`);
        }
        const parseRes = RationaleSchema.safeParse(item.rationale);
        if (!parseRes.success) {
          throw new Error(`Step ${item.step} failed rationale schema: ${parseRes.error.message}`);
        }
      }
      return true;
    };

    expect(validateTrace(validTrace)).toBe(true);

    const invalidTrace = [
      {
        step: 1,
        tool: 'browser_goto',
        rationale: 'Proceeding with next strategic step.',
      },
    ];

    expect(() => validateTrace(invalidTrace)).toThrow();
  });
});
