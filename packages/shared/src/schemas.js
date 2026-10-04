import { z } from 'zod';

/**
 * Understanding Schema
 */
export const UnderstandingSchema = z.object({
  objective: z.string().min(1, 'Objective is required'),
  successCriteria: z.array(z.string()).min(1, 'At least one success criterion is required'),
  constraints: z.array(z.string()).default([]),
  missingInfo: z.array(z.string()).default([]),
  riskLevel: z.enum(['low', 'medium', 'high']).default('medium'),
});

/**
 * Plan Step Schema
 */
export const PlanStepSchema = z.object({
  id: z.string().min(1),
  description: z.string().min(1),
  status: z.enum(['pending', 'in_progress', 'done', 'failed', 'skipped']).default('pending'),
});

/**
 * Plan Schema
 */
export const PlanSchema = z.object({
  steps: z.array(PlanStepSchema).min(1, 'At least one plan step is required'),
});

/**
 * Tool Call Schema (produced by decide node)
 */
export const ToolCallSchema = z.object({
  name: z.string().min(1),
  args: z.record(z.any()).default({}),
  rationale: z.string().default(''),
});

/**
 * Tool Execution Result
 */
export const ToolResultSchema = z.object({
  ok: z.boolean(),
  result: z.any().optional(),
  error: z.string().optional(),
  durationMs: z.number().nonnegative(),
});

/**
 * Policy Configuration Schema
 */
export const PolicyConfigSchema = z.object({
  requireApprovalForWrites: z.boolean().default(true),
  askOnAmbiguity: z.boolean().default(true),
  allowedDomains: z.array(z.string()).default(['localhost', '127.0.0.1']),
  maxToolCalls: z.number().int().positive().default(25),
  maxRetriesPerStep: z.number().int().positive().default(3),
});

/**
 * Memory Entry Schema
 */
export const MemoryEntrySchema = z.object({
  key: z.string().min(1),
  value: z.any(),
  provenance: z.object({
    stepId: z.string().optional(),
    evidence: z.string().optional(),
    timestamp: z.string().datetime().optional(),
  }).optional(),
});

/**
 * Verification Check Schema
 */
export const VerificationCheckSchema = z.object({
  criterion: z.string().min(1),
  passed: z.boolean(),
  evidence: z.string().default(''),
  explanation: z.string().default(''),
  screenshotPath: z.string().optional(),
});

export const VerificationResultSchema = z.object({
  checks: z.array(VerificationCheckSchema),
  overall: z.boolean(),
  summary: z.string().default(''),
});

/**
 * Final Report Schema
 */
export const FinalReportSchema = z.object({
  runId: z.string().optional(),
  goal: z.string().optional(),
  settings: z.object({
    requireApprovalForWrites: z.boolean().optional(),
    chaosMode: z.boolean().optional(),
    askOnAmbiguity: z.boolean().optional(),
    headless: z.boolean().optional(),
    startedAt: z.string().optional(),
  }).optional(),
  summary: z.string().min(1),
  status: z.enum(['completed', 'failed', 'aborted']),
  outcome: z.string().default(''),
  extractedData: z.record(z.any()).default({}),
  evidence: z.array(z.object({
    type: z.enum(['screenshot', 'file', 'text', 'url']),
    pathOrUrl: z.string(),
    caption: z.string(),
    stepId: z.string().optional(),
  })).default([]),
  assumptions: z.array(z.string()).default([]),
  uncertainties: z.array(z.string()).default([]),
});

/**
 * Tool Specific Argument Schemas
 */
export const ToolArgSchemas = {
  // Browser tools
  browser_goto: z.object({
    url: z.string().url('Must be a valid URL'),
  }),
  browser_snapshot: z.object({}),
  browser_click: z.object({
    ref: z.string().min(1, 'Element ref (e.g. e12) is required'),
  }),
  browser_type: z.object({
    ref: z.string().min(1, 'Element ref is required'),
    text: z.string(),
    clear: z.boolean().default(true),
    pressEnter: z.boolean().default(false),
  }),
  browser_select: z.object({
    ref: z.string().min(1, 'Element ref is required'),
    value: z.string().min(1, 'Option value or label is required'),
  }),
  browser_press_key: z.object({
    key: z.string().min(1, 'Key name (e.g. Enter, Escape, Tab) is required'),
  }),
  browser_wait_for: z.object({
    textOrSelector: z.string().min(1),
    timeoutMs: z.number().int().positive().default(5000),
  }),
  browser_download: z.object({
    ref: z.string().min(1, 'Download link ref is required'),
    filename: z.string().optional(),
  }),
  browser_screenshot: z.object({
    caption: z.string().default('Screenshot evidence'),
  }),
  browser_get_text: z.object({
    ref: z.string().optional(),
  }),
  browser_go_back: z.object({}),

  // File tools
  file_list: z.object({
    subpath: z.string().default(''),
  }),
  file_read_text: z.object({
    path: z.union([z.string().min(1, 'File path is required'), z.object({ value: z.string() }).passthrough().transform(o => o.value)]),
  }),
  pdf_extract_text: z.object({
    path: z.union([z.string().min(1, 'PDF path is required'), z.object({ value: z.string() }).passthrough().transform(o => o.value)]),
  }),
  pdf_extract_fields: z.object({
    path: z.union([z.string().min(1, 'PDF path is required'), z.object({ value: z.string() }).passthrough().transform(o => o.value)]),
    fieldsWanted: z.array(z.string()).min(1, 'At least one field name is required'),
  }),

  // Memory tools
  memory_set: z.object({
    key: z.string().min(1),
    value: z.any(),
    evidence: z.string().optional(),
  }),
  memory_get: z.object({
    key: z.string().min(1),
  }),
  memory_list: z.object({}),

  // Human interaction
  ask_human: z.object({
    question: z.string().min(1, 'Question text is required'),
    options: z.array(z.string()).optional(),
  }),
  request_approval: z.object({
    action: z.string().min(1),
    description: z.string().min(1),
    payload: z.record(z.any()).default({}),
  }),

  // Control
  finish: z.object({
    claimedOutcome: z.string().min(1, 'Claimed outcome is required'),
    summary: z.string().default(''),
  }),
};

/**
 * Server API Payloads
 */
export const StartRunRequestSchema = z.object({
  goal: z.string().min(1, 'Goal is required'),
  policyOverrides: PolicyConfigSchema.partial().optional(),
  autoApprove: z.boolean().default(false),
});

export const ResumeRunRequestSchema = z.object({
  type: z.enum(['approval', 'answer']),
  payload: z.object({
    approved: z.boolean().optional(),
    editedValues: z.record(z.any()).optional(),
    answer: z.string().optional(),
  }),
});

export const ChaosRequestSchema = z.object({
  enabled: z.boolean(),
});
