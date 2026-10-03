/**
 * Detect repeated identical or oscillating actions in execution history.
 * Flags a loop if:
 * 1. The agent issues the exact same tool call with identical arguments 3 times consecutively.
 * 2. The agent alternates between two identical actions (period 2 oscillation, for example A -> B -> A -> B).
 *
 * @param {Array<{action: {name: string, args: Record<string, *>}}>} history
 * @param {number} [threshold=3]
 * @returns {{isLoop: boolean, count: number, toolName?: string}}
 */
export function detectActionLoop(history, threshold = 3) {
  if (!history || history.length < threshold) {
    return { isLoop: false, count: 0 };
  }

  // 1. Direct consecutive identical actions: A, A, A
  const recent = history.slice(-threshold);
  const target = recent[recent.length - 1]?.action;
  if (target && target.name) {
    const targetKey = `${target.name}::${JSON.stringify(target.args || {})}`;
    let matchCount = 0;
    for (const item of recent) {
      const action = item?.action;
      if (!action) continue;
      const key = `${action.name}::${JSON.stringify(action.args || {})}`;
      if (key === targetKey) {
        matchCount++;
      }
    }
    if (matchCount >= threshold) {
      return {
        isLoop: true,
        count: matchCount,
        toolName: target.name,
      };
    }
  }

  // 2. Alternating oscillation: A, B, A, B (period 2)
  if (history.length >= 4) {
    const a1 = history[history.length - 1]?.action;
    const b1 = history[history.length - 2]?.action;
    const a2 = history[history.length - 3]?.action;
    const b2 = history[history.length - 4]?.action;

    if (a1 && b1 && a2 && b2) {
      const keyA1 = `${a1.name}::${JSON.stringify(a1.args || {})}`;
      const keyA2 = `${a2.name}::${JSON.stringify(a2.args || {})}`;
      const keyB1 = `${b1.name}::${JSON.stringify(b1.args || {})}`;
      const keyB2 = `${b2.name}::${JSON.stringify(b2.args || {})}`;

      if (keyA1 === keyA2 && keyB1 === keyB2) {
        return {
          isLoop: true,
          count: 4,
          toolName: a1.name,
        };
      }
    }
  }

  return { isLoop: false, count: 0 };
}
