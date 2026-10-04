import { executeTool } from '../tools/registry.js';
import { EVENT_TYPES } from '@centralign/shared';
import { maskSecretsDeep } from '../security/secrets.js';

/**
 * Execute Node
 * Executes the approved tool with timeout boundary and structured result handling.
 */
export async function executeNode(state, config) {
  const { lastAction, memory, policyDecision, toolCallsCount = 0 } = state;
  const { page, workspaceDir, screenshotsDir, logger, llmClient } = config.configurable || {};

  logger?.emit(EVENT_TYPES.NODE_ENTERED, { node: 'execute', tool: lastAction?.name });

  // If policy blocked this action
  if (policyDecision && !policyDecision.allowed) {
    const blockedResult = {
      ok: false,
      error: policyDecision.reason || 'Action blocked by policy.',
      durationMs: 0,
    };
    logger?.emit(EVENT_TYPES.TOOL_FINISHED, {
      tool: lastAction?.name,
      ok: false,
      error: blockedResult.error,
      durationMs: 0,
    });
    return {
      lastToolResult: blockedResult,
    };
  }

  logger?.emit(EVENT_TYPES.TOOL_STARTED, {
    tool: lastAction?.name,
    args: maskSecretsDeep(lastAction?.args || {}),
    rationale: lastAction?.rationale,
  });

  const ctx = {
    page,
    workspaceDir,
    screenshotsDir,
    memory,
    stepIndex: toolCallsCount + 1,
    llmClient,
  };

  const toolResult = await executeTool(lastAction.name, lastAction.args, ctx);

  logger?.emit(EVENT_TYPES.TOOL_FINISHED, {
    tool: lastAction.name,
    ok: toolResult.ok,
    result: maskSecretsDeep(toolResult.result),
    error: toolResult.error,
    durationMs: toolResult.durationMs,
    rationale: lastAction?.rationale,
  });

  logger?.emit(EVENT_TYPES.NODE_EXITED, { node: 'execute' });

  // Record special results directly into state memory
  const memoryUpdates = {};
  if (toolResult.ok && toolResult.result) {
    if (lastAction.name === 'browser_download' && toolResult.result.savedPath) {
      memoryUpdates.downloadedPdf = {
        value: toolResult.result.savedPath,
        provenance: { stepId: 'download', evidence: toolResult.result.filename || '' },
      };
      memoryUpdates.pdfFilename = {
        value: toolResult.result.filename,
        provenance: { stepId: 'download', evidence: toolResult.result.filename || '' },
      };
    }
    if (lastAction.name === 'pdf_extract_fields' && toolResult.result.fields) {
      for (const [k, v] of Object.entries(toolResult.result.fields)) {
        memoryUpdates[k] = {
          value: v.value,
          provenance: { stepId: 'pdf_extract_fields', evidence: v.snippet || '' },
        };
      }
    }
    if (lastAction.name === 'memory_set' && toolResult.result.savedKey) {
      memoryUpdates[toolResult.result.savedKey] = {
        value: toolResult.result.value,
        provenance: toolResult.result.provenance,
      };
    }
  }

  return {
    lastToolResult: toolResult,
    toolCallsCount: 1, // incremented via reducer
    memory: memoryUpdates,
  };
}
