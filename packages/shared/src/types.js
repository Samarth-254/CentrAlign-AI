/**
 * @fileoverview Shared JSDoc Type Definitions for Centralign Task Worker.
 * Plain JavaScript representation of all agent, tool, and system entities.
 */

/**
 * @typedef {Object} Understanding
 * @property {string} objective - Core goal interpreted from prompt
 * @property {string[]} successCriteria - Explicit checklist to verify against
 * @property {string[]} constraints - Operating constraints
 * @property {string[]} missingInfo - Ambiguities or missing inputs
 * @property {'low'|'medium'|'high'} riskLevel - Inferred risk level
 */

/**
 * @typedef {Object} PlanStep
 * @property {string} id - Unique step id (e.g. step_1)
 * @property {string} description - What this step achieves
 * @property {'pending'|'in_progress'|'done'|'failed'|'skipped'} status - Step status
 */

/**
 * @typedef {Object} Plan
 * @property {PlanStep[]} steps - Ordered list of planned steps
 */

/**
 * @typedef {Object} MemoryProvenance
 * @property {string} [stepId] - Step that recorded this fact
 * @property {string} [evidence] - Source evidence snippet or url
 * @property {string} [timestamp] - ISO timestamp
 */

/**
 * @typedef {Object} MemoryItem
 * @property {string} key - Unique key
 * @property {*} value - Stored value
 * @property {MemoryProvenance} [provenance] - Origin of the value
 */

/**
 * @typedef {Object} ElementRef
 * @property {string} ref - Assigned ref id e.g. "e12"
 * @property {string} role - ARIA role (button, textbox, link, etc.)
 * @property {string} name - Element accessible name / label
 * @property {string} [value] - Current form input value if applicable
 * @property {boolean} [disabled] - Whether the element is disabled
 * @property {string} [selector] - CSS selector path
 */

/**
 * @typedef {Object} PageSnapshot
 * @property {string} url - Current page URL
 * @property {string} title - Page title
 * @property {string} flattenedText - Readable flattened representation with ref tags
 * @property {ElementRef[]} interactiveElements - List of tagged elements with refs
 * @property {string[]} headings - Visible headings
 * @property {string[]} alerts - Active alerts or error banners
 * @property {string} [screenshotPath] - File path to saved screenshot
 */

/**
 * @typedef {Object} EvidenceItem
 * @property {'screenshot'|'file'|'text'|'url'} type - Kind of evidence
 * @property {string} pathOrUrl - Local path or URL
 * @property {string} caption - Description of evidence
 * @property {string} [stepId] - Originating step id
 */

/**
 * @typedef {Object} ToolCall
 * @property {string} name - Tool name
 * @property {Record<string, *>} args - Validated arguments
 * @property {string} rationale - Explanation of why this tool was chosen
 */

/**
 * @typedef {Object} ToolResult
 * @property {boolean} ok - Success status
 * @property {*} [result] - Tool output if ok is true
 * @property {string} [error] - Error message if ok is false
 * @property {number} durationMs - Duration in milliseconds
 */

/**
 * @typedef {Object} PolicyConfig
 * @property {boolean} requireApprovalForWrites - Require human confirmation before state-changing mutations
 * @property {boolean} askOnAmbiguity - Prompt human when requirements are ambiguous
 * @property {string[]} allowedDomains - Domain whitelist for browser navigation
 * @property {number} maxToolCalls - Hard cap on tool calls
 * @property {number} maxRetriesPerStep - Maximum retries before replan/escalation
 */

/**
 * @typedef {Object} VerificationCheck
 * @property {string} criterion - Success criterion tested
 * @property {boolean} passed - Whether criterion holds true
 * @property {string} evidence - Direct quote or evidence text
 * @property {string} explanation - Verification auditor reasoning
 * @property {string} [screenshotPath] - Supporting screenshot
 */

/**
 * @typedef {Object} VerificationResult
 * @property {VerificationCheck[]} checks - Individual checks
 * @property {boolean} overall - All checks passed
 * @property {string} summary - Audit conclusion
 */

/**
 * @typedef {Object} FinalReport
 * @property {string} summary - Executive summary
 * @property {'completed'|'failed'|'aborted'} status - Final status
 * @property {string} outcome - Description of outcome
 * @property {Record<string, *>} extractedData - Data items extracted
 * @property {EvidenceItem[]} evidence - Collected artifacts
 * @property {string[]} assumptions - Documented assumptions
 * @property {string[]} uncertainties - Any items uncertain
 */

/**
 * @typedef {Object} AgentRunState
 * @property {string} runId - Unique execution ID
 * @property {string} goal - User input goal
 * @property {Understanding} understanding - Parsed understanding
 * @property {Plan} plan - Current plan
 * @property {Record<string, MemoryItem>} memory - Key-value memory
 * @property {Array<{step: number, action: ToolCall, observation: string}>} history - Compact step history
 * @property {ToolCall|null} lastAction - Most recent tool call
 * @property {string|null} lastObservation - Most recent observation
 * @property {Record<string, number>} failureCount - Failure count per step or action
 * @property {number} toolCallsCount - Total tool calls executed
 * @property {number} retryBudget - Remaining retries allowed
 * @property {Object|null} pendingApproval - Pending human approval payload
 * @property {Object|null} pendingQuestion - Pending human question payload
 * @property {EvidenceItem[]} evidence - Cumulative evidence items
 * @property {VerificationResult|null} verification - Verification output
 * @property {'running'|'awaiting_human'|'completed'|'failed'|'aborted'} status - Run lifecycle status
 * @property {FinalReport|null} finalReport - Completed report
 */

export const _typesDocOnly = true;
