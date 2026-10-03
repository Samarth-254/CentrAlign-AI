import { PlanSchema, EVENT_TYPES } from '@centralign/shared';
import { PLAN_SYSTEM_PROMPT, buildPlanPrompt } from '../prompts/plan.js';

/**
 * Plan Node
 * Formulates or revises a high-level living plan.
 */
export async function planNode(state, config) {
  const { understanding, plan, replanReason } = state;
  const { llmClient, logger } = config.configurable || {};

  logger?.emit(EVENT_TYPES.NODE_ENTERED, { node: 'plan', replan: !!replanReason });

  let newPlan;

  if (llmClient && llmClient.isConfigured()) {
    try {
      const prompt = buildPlanPrompt(understanding, plan, replanReason);
      newPlan = await llmClient.generateStructured({
        systemInstruction: PLAN_SYSTEM_PROMPT,
        prompt,
        schema: PlanSchema,
      });
    } catch (err) {
      console.warn('LLM plan generation failed (e.g. rate limit), falling back to heuristic:', err.message);
      newPlan = buildHeuristicPlan(understanding, replanReason);
    }
  } else {
    newPlan = buildHeuristicPlan(understanding, replanReason);
  }

  // Set the first step to in_progress if all pending
  if (newPlan.steps.length > 0 && newPlan.steps[0].status === 'pending') {
    newPlan.steps[0].status = 'in_progress';
  }

  const eventType = replanReason ? EVENT_TYPES.PLAN_UPDATED : EVENT_TYPES.PLAN_CREATED;
  logger?.emit(eventType, {
    steps: newPlan.steps,
    reason: replanReason || 'Initial plan created',
  });

  logger?.emit(EVENT_TYPES.NODE_EXITED, { node: 'plan' });

  return {
    plan: newPlan,
    replanReason: null,
  };
}

/**
 * Heuristic plan generator for offline evaluations
 * @param {import('@centralign/shared').Understanding} understanding
 * @param {string} [replanReason]
 * @returns {import('@centralign/shared').Plan}
 */
export function buildHeuristicPlan(understanding, _replanReason = null) {
  const obj = understanding.objective.toLowerCase();

  if (obj.includes('mark') && obj.includes('paid')) {
    return {
      steps: [
        { id: 'step_1', description: 'Log in to AcmeBooks ERP (/erp/login)', status: 'pending' },
        { id: 'step_2', description: 'Navigate to bills ledger (/erp/bills) and locate target bill', status: 'pending' },
        { id: 'step_3', description: 'Open bill details and click "Mark as Paid"', status: 'pending' },
        { id: 'step_4', description: 'Verify bill status is updated to Paid and submit claim', status: 'pending' },
      ],
    };
  }

  if (obj.includes('report') || obj.includes('earlier than')) {
    return {
      steps: [
        { id: 'step_1', description: 'Log into Vendor Portal (/portal/login)', status: 'pending' },
        { id: 'step_2', description: 'Inspect invoices across all 5 vendors and filter by due date < 2026-12-01', status: 'pending' },
        { id: 'step_3', description: 'Aggregate totals per vendor and store report in memory', status: 'pending' },
        { id: 'step_4', description: 'Submit completion report with vendor totals', status: 'pending' },
      ],
    };
  }

  // Standard invoice retrieval and entry flow
  return {
    steps: [
      { id: 'step_1', description: 'Log in to Vendor Portal (/portal/login)', status: 'pending' },
      { id: 'step_2', description: 'Locate vendor and find the latest invoice by issue date', status: 'pending' },
      { id: 'step_3', description: 'Download invoice PDF and extract exact fields (amount, dates)', status: 'pending' },
      { id: 'step_4', description: 'Log into AcmeBooks ERP and check for duplicate bills', status: 'pending' },
      { id: 'step_5', description: 'Record new bill in AcmeBooks with DD/MM/YYYY date formatting', status: 'pending' },
      { id: 'step_6', description: 'Submit claimed completion for independent verification audit', status: 'pending' },
    ],
  };
}
