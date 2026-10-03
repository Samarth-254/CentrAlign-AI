import { Annotation } from '@langchain/langgraph';

/**
 * LangGraph State Annotation for Centralign Task Worker
 */
export const AgentStateAnnotation = Annotation.Root({
  // Identifiers & goal
  runId: Annotation(),
  goal: Annotation(),

  // Structured understanding & success criteria
  understanding: Annotation(),

  // Living plan
  plan: Annotation(),

  // Key-value memory with provenance
  memory: Annotation({
    reducer: (current, update) => ({ ...(current || {}), ...(update || {}) }),
    default: () => ({}),
  }),

  // Compact history of steps
  history: Annotation({
    reducer: (current, update) => {
      if (!update) return current || [];
      const newItems = Array.isArray(update) ? update : [update];
      const merged = [...(current || []), ...newItems];
      // Keep token usage sane: summarize or slice if exceeds 15 steps
      if (merged.length > 20) {
        return merged.slice(-20);
      }
      return merged;
    },
    default: () => [],
  }),

  // Current execution tracking
  lastAction: Annotation(),
  lastToolResult: Annotation(),
  lastObservation: Annotation(),
  failureCount: Annotation({
    reducer: (current, update) => ({ ...(current || {}), ...(update || {}) }),
    default: () => ({}),
  }),
  toolCallsCount: Annotation({
    reducer: (current, update) => {
      if (typeof update === 'number') {
        return (current || 0) + update;
      }
      return current || 0;
    },
    default: () => 0,
  }),
  retryBudget: Annotation({
    default: () => 25,
  }),
  verificationAttempts: Annotation({
    reducer: (current, update) => (typeof update === 'number' ? (current || 0) + update : current || 0),
    default: () => 0,
  }),

  // Flow control & decisions
  nextDecision: Annotation(),
  policyDecision: Annotation(),
  replanReason: Annotation(),
  snapshot: Annotation(),
  policy: Annotation({
    default: () => ({}),
  }),
  autoApprove: Annotation({
    default: () => false,
  }),

  // Human in the Loop (Interrupts)
  pendingApproval: Annotation(),
  pendingQuestion: Annotation(),
  humanResponse: Annotation(),

  // Evidence collected
  evidence: Annotation({
    reducer: (current, update) => {
      if (!update) return current || [];
      const items = Array.isArray(update) ? update : [update];
      return [...(current || []), ...items];
    },
    default: () => [],
  }),

  // Verification & outcome
  verification: Annotation(),
  status: Annotation({
    default: () => 'running',
  }),
  finalReport: Annotation(),
  error: Annotation(),
});
