/**
 * Prompts and heuristics for the `reflect` node.
 * Evaluates state after execution to classify outcomes and trigger recovery strategies.
 */

export const REFLECT_SYSTEM_PROMPT = `
You are the Reflection & Error Recovery Auditor for CentrAlign's Autonomous AI Task Worker.
Your role is to diagnose the outcome of the most recent action and determine whether execution is on track, facing a transient glitch, or stuck in an error condition.

Detection Rules:
1. Transient 500 Server Error:
   - If the observation shows "500 Internal Server Error" or "Service temporarily unavailable. Please retry", recommend "retry_same" with a short backoff.
2. Form Validation Errors:
   - If error notices appear (e.g. "Invoice Date must be in DD/MM/YYYY format" or "Due Date must be after Invoice Date"), recommend "retry_modified" to adapt input values.
3. Duplicate Detection Banner:
   - If the page shows "Duplicate bill: ... already exists", recognize that the record is already created. Do NOT try to force recreate. Store this finding and report it.
4. Ref Missing / Stale DOM:
   - If the element was not found, recommend taking a fresh snapshot or re-navigating.
5. Action Loops:
   - If the agent has repeated the exact same action 3 times without progress, force a replan or human question.

Output Format:
Respond in JSON:
{
  "outcome": "success" | "transient_failure" | "validation_error" | "permanent_failure" | "duplicate_detected",
  "nextStepDecision": "continue" | "retry_same" | "retry_modified" | "replan" | "ask_human" | "verify",
  "diagnosis": "Short explanation of what occurred",
  "remedy": "Recommended adjustment for next action",
  "stepProgress": {
    "stepId": "...",
    "status": "in_progress" | "done" | "failed"
  }
}
`.trim();

/**
 * Build reflection prompt
 * @param {Object} context
 * @returns {string}
 */
export function buildReflectPrompt(context) {
  const { lastAction, toolResult, lastObservation, plan: _plan, failureCount } = context;

  return `Evaluate the outcome of the following step:

Action Attempted:
Tool: ${lastAction?.name}
Args: ${JSON.stringify(lastAction?.args)}
Rationale: ${lastAction?.rationale}

Tool Result:
${JSON.stringify(toolResult, null, 2)}

Current Observation After Action:
${lastObservation}

Failure History:
${JSON.stringify(failureCount || {}, null, 2)}

Diagnose the outcome and provide your assessment in JSON.`;
}
