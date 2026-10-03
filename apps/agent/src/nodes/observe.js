import { getPageSnapshot } from '../observation/snapshot.js';
import { EVENT_TYPES } from '@centralign/shared';

/**
 * Observe Node
 * Captures world state: accessibility snapshot, URL, alerts, and evidence screenshots.
 */
export async function observeNode(state, config) {
  const { toolCallsCount = 0, lastAction, lastToolResult } = state;
  const { page, screenshotsDir, logger } = config.configurable || {};

  logger?.emit(EVENT_TYPES.NODE_ENTERED, { node: 'observe' });

  let observationText = '';
  let snapshot = null;
  const newEvidence = [];

  // If browser page is active
  if (page) {
    try {
      snapshot = await getPageSnapshot(page, {
        screenshotsDir,
        stepIndex: toolCallsCount,
      });

      observationText = snapshot.flattenedText;

      if (snapshot.screenshotPath) {
        newEvidence.push({
          type: 'screenshot',
          pathOrUrl: snapshot.screenshotPath,
          caption: `Screenshot at step ${toolCallsCount} (${snapshot.title || snapshot.url})`,
          stepId: `step_${toolCallsCount}`,
        });
      }
    } catch (err) {
      observationText = `Page snapshot capture failed: ${err.message}`;
    }
  } else {
    // Non-browser observation
    observationText = `Tool Result: ${JSON.stringify(lastToolResult?.result || lastToolResult?.error || {})}`;
  }

  // If tool produced a file
  if (lastToolResult?.result?.savedPath) {
    newEvidence.push({
      type: 'file',
      pathOrUrl: lastToolResult.result.savedPath,
      caption: `Downloaded file: ${lastToolResult.result.filename || 'invoice.pdf'}`,
      stepId: `step_${toolCallsCount}`,
    });
  }

  logger?.emit(EVENT_TYPES.OBSERVATION_CAPTURED, {
    url: snapshot?.url,
    title: snapshot?.title,
    elementsCount: snapshot?.interactiveElements?.length || 0,
    alerts: snapshot?.alerts || [],
    screenshotPath: snapshot?.screenshotPath,
  });

  logger?.emit(EVENT_TYPES.NODE_EXITED, { node: 'observe' });

  return {
    lastObservation: observationText,
    snapshot,
    evidence: newEvidence,
  };
}
