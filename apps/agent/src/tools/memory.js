/**
 * Memory tools implementation
 * Stores key facts discovered with provenance (stepId, evidence quote, timestamp).
 */
export const memoryTools = {
  /**
   * Set a key-value fact in memory
   */
  async memory_set({ key, value, evidence = '' }, ctx) {
    if (!ctx.memory) ctx.memory = {};

    const entry = {
      key,
      value,
      provenance: {
        stepId: ctx.stepId || `step_${ctx.stepIndex || 0}`,
        evidence,
        timestamp: new Date().toISOString(),
      },
    };

    ctx.memory[key] = entry;

    return {
      savedKey: key,
      value,
      provenance: entry.provenance,
      totalKeysCount: Object.keys(ctx.memory).length,
    };
  },

  /**
   * Get a key-value fact from memory
   */
  async memory_get({ key }, ctx) {
    const memory = ctx.memory || {};
    const item = memory[key];
    if (!item) {
      return { found: false, key, message: `Key "${key}" not found in agent memory.` };
    }
    return {
      found: true,
      key,
      value: item.value,
      provenance: item.provenance,
    };
  },

  /**
   * List all stored memories
   */
  async memory_list(_args, ctx) {
    const memory = ctx.memory || {};
    const entries = Object.entries(memory).map(([key, item]) => ({
      key,
      value: item.value,
      stepId: item.provenance?.stepId,
      evidenceSnippet: (item.provenance?.evidence || '').substring(0, 100),
    }));

    return {
      count: entries.length,
      memories: entries,
    };
  },
};
