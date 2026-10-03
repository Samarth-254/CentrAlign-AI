/**
 * Detect repeated identical actions in execution history.
 * If the agent issues the exact same tool call with the exact same arguments
 * 3 times consecutively, flags a loop so the agent is forced to replan or escalate.
 *
 * @param {Array<{action: {name: string, args: Record<string, *>}}>} history
 * @param {number} [threshold=3]
 * @returns {{isLoop: boolean, count: number, toolName?: string}}
 */
export function detectActionLoop(history, threshold = 3) {
  if (!history || history.length < threshold) {
    return { isLoop: false, count: 0 };
  }

  const recent = history.slice(-threshold);
  const target = recent[recent.length - 1]?.action;
  if (!target || !target.name) {
    return { isLoop: false, count: 0 };
  }

  const targetKey = `${target.name}::${JSON.stringify(target.args || {})}`;

  let matchCount = 0;
  for (const item of recent) {
    const action = item.action;
    if (!action) continue;
    const key = `${action.name}::${JSON.stringify(action.args || {})}`;
    if (key === targetKey) {
      matchCount++;
    }
  }

  return {
    isLoop: matchCount >= threshold,
    count: matchCount,
    toolName: target.name,
  };
}
