import { EVENT_TYPES } from '@centralign/shared';

/**
 * Advance living plan steps based on real-world execution state and milestones.
 */
export function advancePlanSteps(plan, state) {
  if (!plan?.steps || plan.steps.length === 0) return plan;
  const { snapshot, memory = {}, lastAction, lastObservation = '' } = state;
  const url = snapshot?.url || '';

  const steps = [...plan.steps];

  // Analyze milestones
  // Milestone 1: Visited portal & logged in
  const step1Done = url.includes('/portal/vendors') || !!memory.downloadedPdf || !!memory.invoiceNumber;
  // Milestone 2: Located vendor and target invoice
  const step2Done = (!!memory.downloadedPdf || !!memory.invoiceNumber) && (url.includes('/invoices') || url.includes('/erp'));
  // Milestone 3: Downloaded & extracted PDF
  const step3Done = (!!memory.totalAmount || !!memory.dueDate) && (!!memory.invoiceNumber || !!memory.downloadedPdf);
  // Milestone 4: Reached ERP
  const step4Done = url.includes('/erp/bills') || url.includes('/erp/bills/new');
  // Milestone 5: Recorded bill / changed status
  const step5Done = url.includes('/erp/bills/bill_') || lastObservation.includes('Bill created') || lastObservation.includes('Status: Paid');
  // Milestone 6: Submitted for verification
  const step6Done = lastAction?.name === 'finish';

  const milestones = [step1Done, step2Done, step3Done, step4Done, step5Done, step6Done];

  let nextActiveIndex = -1;
  for (let i = 0; i < steps.length; i++) {
    const isCompleted = milestones[i];
    if (isCompleted) {
      steps[i] = { ...steps[i], status: 'done' };
    } else if (nextActiveIndex === -1) {
      nextActiveIndex = i;
      steps[i] = { ...steps[i], status: 'in_progress' };
    } else {
      steps[i] = { ...steps[i], status: 'pending' };
    }
  }

  return { ...plan, steps };
}

/**
 * Reflect Node
 * Detects failure signals, updates step statuses, and determines recovery strategy.
 */
export async function reflectNode(state, config) {
  const { lastAction, lastToolResult, lastObservation, plan, failureCount = {}, toolCallsCount = 0 } = state;
  const { logger } = config.configurable || {};

  logger?.emit(EVENT_TYPES.NODE_ENTERED, { node: 'reflect' });

  const updatedFailureCount = { ...failureCount };
  let nextDecision = 'continue';
  let replanReason = null;

  // Update plan milestones dynamically based on current world state
  let updatedPlan = plan;
  if (plan?.steps && plan.steps.length > 0) {
    updatedPlan = advancePlanSteps(plan, state);
    const hasChanged = JSON.stringify(updatedPlan.steps) !== JSON.stringify(plan.steps);
    if (hasChanged) {
      logger?.emit(EVENT_TYPES.PLAN_UPDATED, {
        steps: updatedPlan.steps,
        reason: 'Plan progress milestones updated',
      });
    }
  }

  // 1. If lastAction was finish, directly proceed to independent verification!
  if (lastAction?.name === 'finish') {
    logger?.emit(EVENT_TYPES.REFLECTION_COMPLETED, {
      decision: 'verify',
      diagnosis: 'Agent claimed completion; routing to independent verification.',
    });
    return {
      plan: updatedPlan,
      nextDecision: 'verify',
      history: [
        {
          step: toolCallsCount,
          action: lastAction,
          result: lastToolResult,
        },
      ],
    };
  }

  // 2. Failure signal detection
  const obs = lastObservation || '';
  const isToolError = lastToolResult && !lastToolResult.ok;
  const is500Error =
    obs.includes('500 Internal') ||
    obs.includes('500 - Internal') ||
    obs.includes('500:') ||
    obs.includes('Service temporarily unavailable') ||
    (obs.includes('500') && obs.includes('Server Error'));
  const isValidationError = obs.includes('[ACTIVE ALERTS & ERROR NOTICES]') && (obs.includes('must be in') || obs.includes('after Invoice Date'));
  const isDuplicateError = obs.includes('Duplicate') || obs.includes('already exists');

  if (isToolError || is500Error || isValidationError) {
    const key = lastAction?.name || 'unknown_action';
    updatedFailureCount[key] = (updatedFailureCount[key] || 0) + 1;

    if (is500Error) {
      nextDecision = 'retry_same';
      logger?.emit(EVENT_TYPES.REFLECTION_COMPLETED, {
        decision: 'retry_same',
        diagnosis: 'Transient HTTP 500 detected. Backoff and retry.',
      });
    } else if (isDuplicateError) {
      nextDecision = 'continue';
      logger?.emit(EVENT_TYPES.REFLECTION_COMPLETED, {
        decision: 'continue',
        diagnosis: 'Duplicate record banner detected. Avoid recreating.',
      });
    } else if (updatedFailureCount[key] >= 3) {
      nextDecision = 'replan';
      replanReason = `Action "${key}" failed 3 times in a row. Error: ${lastToolResult?.error || 'Validation failure'}.`;
      logger?.emit(EVENT_TYPES.REPLAN_TRIGGERED, { reason: replanReason });
    } else {
      nextDecision = 'continue';
    }
  }

  // Record into history
  const historyEntry = {
    step: toolCallsCount,
    action: lastAction,
    resultSummary: isToolError ? lastToolResult.error : 'Success',
    timestamp: new Date().toISOString(),
  };

  logger?.emit(EVENT_TYPES.NODE_EXITED, { node: 'reflect', nextDecision });

  return {
    plan: updatedPlan,
    failureCount: updatedFailureCount,
    nextDecision,
    replanReason,
    history: [historyEntry],
  };
}
