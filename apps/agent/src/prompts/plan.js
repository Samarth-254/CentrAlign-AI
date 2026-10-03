/**
 * System and user prompts for the `plan` node.
 * Breaks down an understanding specification into 3 to 8 high-level executable steps.
 */

export const PLAN_SYSTEM_PROMPT = `
You are the Strategic Planner for CentrAlign's Autonomous AI Task Worker.
Your role is to formulate a clear, sequential plan of 3 to 8 high-level steps to achieve the user's objective.

Guidelines:
1. Keep steps concise and focused on outcomes, not micro-actions.
   - Good: "Log into Vendor Portal and locate the latest invoice for Northwind Traders by issue date"
   - Bad: "Click on textbox e1, type username, click submit"
2. Typical workflow steps for an invoice entry task:
   - Authenticate into the vendor portal
   - Locate vendor and inspect invoices (handling pagination and sorting by issue date)
   - Download invoice PDF and extract exact fields (amount, currency, issue date, due date)
   - Check internal AcmeBooks ERP for duplicates
   - Record bill in AcmeBooks with validated DD/MM/YYYY dates
   - Submit claimed completion for independent verification
3. Number each step cleanly (e.g., step_1, step_2...).
4. Initial status for all steps should be "pending".

Output Format:
You must respond with valid JSON adhering to:
{
  "steps": [
    {
      "id": "step_1",
      "description": "...",
      "status": "pending"
    }
  ]
}
`.trim();

/**
 * Generate user prompt for planning
 * @param {Object} understanding
 * @param {Array} [currentPlan]
 * @param {string} [replanReason]
 * @returns {string}
 */
export function buildPlanPrompt(understanding, currentPlan = null, replanReason = null) {
  let prompt = `Objective: ${understanding.objective}\n`;
  prompt += `Success Criteria:\n${understanding.successCriteria.map((c) => `- ${c}`).join('\n')}\n`;
  prompt += `Constraints:\n${understanding.constraints.map((c) => `- ${c}`).join('\n')}\n`;

  if (replanReason) {
    prompt += `\nREPLANNING REQUIRED due to:\n${replanReason}\n`;
    prompt += `Previous Plan:\n${JSON.stringify(currentPlan, null, 2)}\n`;
    prompt += `Update and revise the plan steps to overcome this obstacle.`;
  } else {
    prompt += `\nGenerate a fresh sequential plan of 3 to 8 steps to accomplish this objective.`;
  }

  return prompt;
}
