import { interrupt } from '@langchain/langgraph';
import { EVENT_TYPES } from '@centralign/shared';

/**
 * Ask Human Node
 * Checkpoints execution via LangGraph interrupt and awaits user free-text clarification.
 */
export async function askHumanNode(state, config) {
  const { pendingQuestion, memory = {} } = state;
  const { logger } = config.configurable || {};

  logger?.emit(EVENT_TYPES.NODE_ENTERED, { node: 'ask_human' });
  logger?.emit(EVENT_TYPES.QUESTION_REQUESTED, {
    question: pendingQuestion?.question,
    options: pendingQuestion?.options,
  });

  // Call LangGraph interrupt to pause execution and await user answer
  const response = interrupt({
    type: 'question',
    question: pendingQuestion?.question || 'Please provide clarification for this task.',
    options: pendingQuestion?.options || [],
  });

  logger?.emit(EVENT_TYPES.QUESTION_RESOLVED, {
    answer: response?.answer || response,
  });

  logger?.emit(EVENT_TYPES.NODE_EXITED, { node: 'ask_human' });

  const answerText = typeof response === 'string' ? response : (response?.answer || '');

  // Record human answer into memory
  const updatedMemory = {
    ...memory,
    humanClarification: {
      question: pendingQuestion?.question,
      answer: answerText,
      timestamp: new Date().toISOString(),
    },
  };

  return {
    pendingQuestion: null,
    memory: updatedMemory,
    status: 'running',
  };
}
