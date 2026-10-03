/**
 * Human interaction tools
 */
export const humanTools = {
  /**
   * Ask human a clarifying question
   */
  async ask_human({ question, options = [] }, ctx) {
    return {
      type: 'question',
      question,
      options,
      status: 'awaiting_human_answer',
    };
  },

  /**
   * Request human approval for a proposed write action
   */
  async request_approval({ action, description, payload = {} }, ctx) {
    return {
      type: 'approval',
      action,
      description,
      payload,
      status: 'awaiting_human_approval',
    };
  },
};
