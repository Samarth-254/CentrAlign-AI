/**
 * Standard Agent Event Type Constants
 * Emitted across LangGraph nodes, tool executions, SSE streams, trace logger, and UI timeline.
 */
export const EVENT_TYPES = {
  // Lifecycle events
  RUN_STARTED: 'run.started',
  RUN_COMPLETED: 'run.completed',
  RUN_FAILED: 'run.failed',
  RUN_ABORTED: 'run.aborted',

  // Graph Node events
  NODE_ENTERED: 'node.entered',
  NODE_EXITED: 'node.exited',

  // Understanding & Planning
  UNDERSTANDING_PRODUCED: 'understanding.produced',
  PLAN_CREATED: 'plan.created',
  PLAN_UPDATED: 'plan.updated',

  // Decision & Policy
  ACTION_PROPOSED: 'action.proposed',
  POLICY_CHECKED: 'policy.checked',
  POLICY_BLOCKED: 'policy.blocked',

  // Human in the Loop (Interrupts)
  APPROVAL_REQUESTED: 'approval.requested',
  APPROVAL_RESOLVED: 'approval.resolved',
  QUESTION_REQUESTED: 'question.requested',
  QUESTION_RESOLVED: 'question.resolved',

  // Tool Execution
  TOOL_STARTED: 'tool.started',
  TOOL_FINISHED: 'tool.finished',

  // Observation & Reflection
  OBSERVATION_CAPTURED: 'observation.captured',
  REFLECTION_COMPLETED: 'reflection.completed',
  LOOP_DETECTED: 'loop.detected',
  REPLAN_TRIGGERED: 'replan.triggered',

  // Verification
  VERIFICATION_STARTED: 'verification.started',
  VERIFICATION_CHECK: 'verification.check',
  VERIFICATION_COMPLETED: 'verification.completed',
  VERIFICATION_RETRY: 'verification.retry',

  // Error & Status
  STATUS_UPDATED: 'status.updated',
  ERROR_OCCURRED: 'error.occurred',
};
