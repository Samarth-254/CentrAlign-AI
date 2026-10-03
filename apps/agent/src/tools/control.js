/**
 * Control tools
 */
export const controlTools = {
  /**
   * Propose task completion with claimed outcome and summary
   * Note: The agent can only CLAIM completion; the independent verifier determines if it truly succeeded.
   */
  async finish({ claimedOutcome, summary = '' }, _ctx) {
    return {
      status: 'claim_submitted',
      claimedOutcome,
      summary,
      message: 'Agent completed execution and submitted claimed outcome to independent verification.',
    };
  },
};
