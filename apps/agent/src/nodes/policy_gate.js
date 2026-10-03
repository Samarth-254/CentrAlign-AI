import { interrupt } from '@langchain/langgraph';
import { evaluatePolicyGate } from '../policy/policyGate.js';
import { EVENT_TYPES } from '@centralign/shared';

/**
 * Policy Gate Node
 * Deterministic code checking actions against policy and triggering LangGraph interrupts.
 */
export async function policyGateNode(state, config) {
  const { lastAction, policy = {}, autoApprove = false } = state;
  const { logger, page } = config.configurable || {};

  logger?.emit(EVENT_TYPES.NODE_ENTERED, { node: 'policy_gate', action: lastAction?.name });

  // Evaluate deterministic policy check
  const decision = await evaluatePolicyGate(lastAction, {
    policy,
    snapshot: state.snapshot,
    autoApprove,
    page,
  });

  logger?.emit(EVENT_TYPES.POLICY_CHECKED, {
    tool: lastAction?.name,
    allowed: decision.allowed,
    requiresApproval: decision.requiresApproval,
    reason: decision.reason,
  });

  // If action is blocked outright (e.g. non-whitelisted domain)
  if (!decision.allowed) {
    logger?.emit(EVENT_TYPES.POLICY_BLOCKED, {
      tool: lastAction?.name,
      reason: decision.reason,
    });
    return {
      policyDecision: { allowed: false, reason: decision.reason },
      error: decision.reason,
    };
  }

  // If action requires human approval
  if (decision.requiresApproval && !autoApprove) {
    logger?.emit(EVENT_TYPES.APPROVAL_REQUESTED, {
      tool: lastAction?.name,
      payload: decision.payload,
    });

    // Call LangGraph interrupt to checkpoint state and await human response
    const humanResponse = interrupt({
      type: 'approval',
      action: decision.payload?.action || lastAction?.name,
      description: decision.payload?.description || 'Proposed mutation requires human sign-off.',
      values: decision.payload?.currentFormValues || decision.payload?.values || {},
      rationale: lastAction?.rationale,
      screenshotPath: decision.payload?.screenshotPath,
    });

    logger?.emit(EVENT_TYPES.APPROVAL_RESOLVED, {
      approved: humanResponse?.approved,
      editedValues: humanResponse?.editedValues,
    });

    if (humanResponse && humanResponse.approved === false) {
      return {
        policyDecision: { allowed: false, reason: 'Action was rejected by human operator.' },
        error: 'Human operator rejected proposed mutation.',
      };
    }

    // If human modified any values, apply them
    if (humanResponse && humanResponse.editedValues) {
      lastAction.args = { ...lastAction.args, ...humanResponse.editedValues };
    }
  }

  logger?.emit(EVENT_TYPES.NODE_EXITED, { node: 'policy_gate' });

  return {
    policyDecision: { allowed: true },
    lastAction,
  };
}
