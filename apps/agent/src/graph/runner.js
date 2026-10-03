import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { Command } from '@langchain/langgraph';
import { createAgentWorkflow } from './workflow.js';
import { LlmClient } from '../llm/client.js';
import { TraceLogger } from '../trace/logger.js';
import { EVENT_TYPES } from '@centralign/shared';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const RUNS_ROOT = path.resolve(__dirname, '../../runs');

/**
 * Active in-memory run contexts
 * @type {Map<string, Object>}
 */
const activeRuns = new Map();

/**
 * Start a new task execution run
 * @param {Object} params
 * @param {string} params.goal - Natural language user goal
 * @param {Object} [params.policyOverrides] - Custom policy configuration
 * @param {boolean} [params.autoApprove=false] - Auto-approve write operations (e.g. in CLI/evals)
 * @param {string} [params.runId] - Optional predefined run ID
 * @returns {Promise<{runId: string, traceLogger: TraceLogger, runPromise: Promise<Object>}>}
 */
export async function startAgentRun(params) {
  const { goal, policyOverrides = {}, autoApprove = false } = params;
  const runId = params.runId || `run_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const runDir = path.join(RUNS_ROOT, runId);
  const workspaceDir = path.join(runDir, 'workspace');
  const screenshotsDir = path.join(runDir, 'screenshots');

  fs.mkdirSync(workspaceDir, { recursive: true });
  fs.mkdirSync(screenshotsDir, { recursive: true });

  const traceLogger = new TraceLogger(runId, runDir);
  traceLogger.emit(EVENT_TYPES.RUN_STARTED, { goal, autoApprove });

  // Initialize Playwright browser
  const isHeadless = process.env.HEADLESS !== 'false';
  const browser = await chromium.launch({
    headless: isHeadless,
    args: ['--disable-dev-shm-usage', '--no-sandbox'],
  });

  const context = await browser.newContext({
    acceptDownloads: true,
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();

  // Initialize LLM Client
  const llmClient = new LlmClient();

  // Create compiled LangGraph workflow
  const workflow = createAgentWorkflow();

  const runContext = {
    runId,
    goal,
    runDir,
    workspaceDir,
    screenshotsDir,
    browser,
    context,
    page,
    llmClient,
    logger: traceLogger,
    workflow,
    autoApprove,
    policy: {
      requireApprovalForWrites: true,
      askOnAmbiguity: true,
      allowedDomains: ['localhost', '127.0.0.1'],
      maxToolCalls: 25,
      maxRetriesPerStep: 3,
      ...policyOverrides,
    },
    threadConfig: {
      recursionLimit: 150,
      configurable: {
        thread_id: runId,
        page,
        workspaceDir,
        screenshotsDir,
        logger: traceLogger,
        llmClient,
        runDir,
      },
    },
    status: 'running',
    latestState: null,
  };

  activeRuns.set(runId, runContext);

  // Execute graph execution loop
  const runPromise = (async () => {
    try {
      const initialState = {
        runId,
        goal,
        autoApprove,
        policy: runContext.policy,
      };

      // Run workflow
      const resultState = await workflow.invoke(initialState, runContext.threadConfig);
      runContext.latestState = resultState;

      // Check if paused on interrupt
      const stateSnapshot = await workflow.getState(runContext.threadConfig);
      if (stateSnapshot.tasks && stateSnapshot.tasks.some((t) => t.interrupts && t.interrupts.length > 0)) {
        runContext.status = 'awaiting_human';
        traceLogger.emit(EVENT_TYPES.STATUS_UPDATED, { status: 'awaiting_human' });
        return { runId, status: 'awaiting_human', state: stateSnapshot.values };
      }

      // Run completed
      runContext.status = resultState.status || 'completed';
      await cleanupRun(runId);
      return resultState;
    } catch (err) {
      traceLogger.emit(EVENT_TYPES.RUN_FAILED, { error: err.message });
      runContext.status = 'failed';
      await cleanupRun(runId);
      throw err;
    }
  })();

  runContext.runPromise = runPromise;

  return {
    runId,
    traceLogger,
    runPromise,
  };
}

/**
 * Resume a paused run after human input (approval or question)
 * @param {string} runId
 * @param {Object} input
 * @param {'approval'|'answer'} input.type
 * @param {Object} input.payload
 * @returns {Promise<Object>}
 */
export async function resumeAgentRun(runId, input) {
  const runContext = activeRuns.get(runId);
  if (!runContext) {
    throw new Error(`Active run "${runId}" not found or already terminated.`);
  }

  const { workflow, threadConfig, logger } = runContext;
  runContext.status = 'running';
  logger.emit(EVENT_TYPES.STATUS_UPDATED, { status: 'running', resumedWith: input });

  try {
    const resumePayload = input.type === 'approval'
      ? { approved: input.payload?.approved !== false, editedValues: input.payload?.editedValues }
      : { answer: input.payload?.answer || '' };

    // Resume via LangGraph Command
    const resultState = await workflow.invoke(
      new Command({ resume: resumePayload }),
      threadConfig
    );

    runContext.latestState = resultState;

    // Check if interrupted again
    const stateSnapshot = await workflow.getState(threadConfig);
    if (stateSnapshot.tasks && stateSnapshot.tasks.some((t) => t.interrupts && t.interrupts.length > 0)) {
      runContext.status = 'awaiting_human';
      logger.emit(EVENT_TYPES.STATUS_UPDATED, { status: 'awaiting_human' });
      return { runId, status: 'awaiting_human', state: stateSnapshot.values };
    }

    runContext.status = resultState.status || 'completed';
    await cleanupRun(runId);
    return resultState;
  } catch (err) {
    logger.emit(EVENT_TYPES.RUN_FAILED, { error: err.message });
    runContext.status = 'failed';
    await cleanupRun(runId);
    throw err;
  }
}

/**
 * Abort a running execution
 * @param {string} runId
 */
export async function abortAgentRun(runId) {
  const runContext = activeRuns.get(runId);
  if (runContext) {
    runContext.status = 'aborted';
    runContext.logger.emit(EVENT_TYPES.RUN_ABORTED, { message: 'Run aborted by user request.' });
    await cleanupRun(runId);
  }
}

/**
 * Get active run's trace logger
 * @param {string} runId
 * @returns {import('../trace/logger.js').TraceLogger|null}
 */
export function getActiveRunLogger(runId) {
  return activeRuns.get(runId)?.logger || null;
}

/**
 * Get active run context or inspect saved run
 * @param {string} runId
 * @returns {Object|null}
 */
export function getRun(runId) {
  const active = activeRuns.get(runId);
  if (active) {
    return {
      runId,
      status: active.status,
      events: active.logger.getEvents(),
      active: true,
    };
  }

  // Check saved run on disk
  const runDir = path.join(RUNS_ROOT, runId);
  const tracePath = path.join(runDir, 'trace.jsonl');
  const reportPath = path.join(runDir, 'report.json');

  if (fs.existsSync(runDir)) {
    let report = null;
    if (fs.existsSync(reportPath)) {
      try {
        report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
      } catch {
        // ignore
      }
    }

    const events = [];
    if (fs.existsSync(tracePath)) {
      const lines = fs.readFileSync(tracePath, 'utf8').split('\n').filter(Boolean);
      for (const line of lines) {
        try {
          events.push(JSON.parse(line));
        } catch {
          // ignore
        }
      }
    }

    return {
      runId,
      status: report?.status || 'completed',
      events,
      finalReport: report,
      active: false,
    };
  }

  return null;
}

/**
 * List all runs (both active and persisted on disk)
 * @returns {Array<Object>}
 */
export function listAllRuns() {
  const results = [];
  if (!fs.existsSync(RUNS_ROOT)) return results;

  const entries = fs.readdirSync(RUNS_ROOT, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory() && entry.name.startsWith('run_')) {
      const run = getRun(entry.name);
      if (run) {
        results.push({
          runId: run.runId,
          status: run.status,
          eventsCount: run.events?.length || 0,
          summary: run.finalReport?.summary || '',
        });
      }
    }
  }

  return results.sort((a, b) => b.runId.localeCompare(a.runId));
}

/**
 * Clean up browser and memory for a run
 * @param {string} runId
 */
async function cleanupRun(runId) {
  const runContext = activeRuns.get(runId);
  if (runContext) {
    try {
      await runContext.page.close().catch(() => {});
      await runContext.context.close().catch(() => {});
      await runContext.browser.close().catch(() => {});
    } catch {
      // ignore
    }
    // Do not delete immediately so subscribers can finish reading
  }
}
