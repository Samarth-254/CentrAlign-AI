import { EVENT_TYPES } from '@centralign/shared';
import { REFLECT_SYSTEM_PROMPT, buildReflectPrompt } from '../prompts/reflect.js';

/**
 * Reflect Node
 * Detects failure signals, updates step statuses, and determines recovery strategy.
 */
export async function reflectNode(state, config) {
  const { lastAction, lastToolResult, lastObservation, plan, failureCount = {}, toolCallsCount = 0 } = state;
  const { logger, llmClient } = config.configurable || {};

  logger?.emit(EVENT_TYPES.NODE_ENTERED, { node: 'reflect' });

  const updatedFailureCount = { ...failureCount };
  let nextDecision = 'continue';
  let replanReason = null;

  // 1. If lastAction was finish, directly proceed to independent verification!
  if (lastAction?.name === 'finish') {
    logger?.emit(EVENT_TYPES.REFLECTION_COMPLETED, {
      decision: 'verify',
      diagnosis: 'Agent claimed completion; routing to independent verification.',
    });
    return {
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
    failureCount: updatedFailureCount,
    nextDecision,
    replanReason,
    history: [historyEntry],
  };
}
