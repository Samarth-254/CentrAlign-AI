import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import {
  startAgentRun,
  resumeAgentRun,
  abortAgentRun,
  getRun,
  listAllRuns,
  getActiveRunLogger,
} from './graph/runner.js';
import { EVENT_TYPES } from '@centralign/shared';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const app = express();
const PORT = process.env.AGENT_PORT || 4000;
const RUNS_ROOT = path.resolve(__dirname, '../runs');

app.use(cors());
app.use(express.json());

// Serve run screenshots
app.get('/runs/:id/screenshots/:filename', (req, res) => {
  const { id, filename } = req.params;
  const filePath = path.resolve(RUNS_ROOT, id, 'screenshots', filename);
  // Prevent traversal
  if (!filePath.startsWith(RUNS_ROOT) || !fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Screenshot not found.' });
  }
  res.sendFile(filePath);
});

// Serve run HTML report
app.get('/runs/:id/report.html', (req, res) => {
  const { id } = req.params;
  const reportPath = path.resolve(RUNS_ROOT, id, 'report.html');
  if (!reportPath.startsWith(RUNS_ROOT) || !fs.existsSync(reportPath)) {
    return res.status(404).json({ error: 'Report HTML not found.' });
  }
  res.sendFile(reportPath);
});

// List all runs
app.get('/runs', (req, res) => {
  const runs = listAllRuns();
  res.json({ runs });
});

// Start a new agent run
app.post('/runs', async (req, res) => {
  const { goal, policyOverrides = {}, autoApprove = false } = req.body;
  if (!goal || typeof goal !== 'string') {
    return res.status(400).json({ error: 'Field "goal" is required and must be a string.' });
  }

  try {
    const { runId } = await startAgentRun({
      goal,
      policyOverrides,
      autoApprove: !!autoApprove,
    });

    res.status(201).json({
      runId,
      status: 'running',
      eventsUrl: `/runs/${runId}/events`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get run details
app.get('/runs/:id', (req, res) => {
  const { id } = req.params;
  const run = getRun(id);
  if (!run) {
    return res.status(404).json({ error: `Run "${id}" not found.` });
  }
  res.json(run);
});

// SSE stream of run events
app.get('/runs/:id/events', (req, res) => {
  const { id } = req.params;
  const run = getRun(id);
  if (!run) {
    return res.status(404).json({ error: `Run "${id}" not found.` });
  }

  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });
  res.write('\n');

  // Send existing historical events
  for (const event of run.events || []) {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  }

  // If run is already completed or failed, close stream
  if (!run.active && (run.status === 'completed' || run.status === 'failed' || run.status === 'aborted')) {
    res.write(`data: ${JSON.stringify({ type: 'stream.ended', status: run.status })}\n\n`);
    return res.end();
  }

  // Listen for live new events if traceLogger is active in memory
  const sendEvent = (event) => {
    try {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    } catch {
      // client connection closed
    }
    if (
      event.type === EVENT_TYPES.RUN_COMPLETED ||
      event.type === EVENT_TYPES.RUN_FAILED ||
      event.type === EVENT_TYPES.RUN_ABORTED
    ) {
      setTimeout(() => {
        try {
          res.write(`data: ${JSON.stringify({ type: 'stream.ended', status: event.type })}\n\n`);
          res.end();
        } catch {
          // ignore
        }
      }, 500);
    }
  };

  // Find active run logger
  let unsubFn = null;
  const activeLogger = getRunLogger(id);
  if (activeLogger) {
    unsubFn = activeLogger.subscribe(sendEvent);
  }

  req.on('close', () => {
    if (typeof unsubFn === 'function') {
      unsubFn();
    } else if (activeLogger?.unsubscribe) {
      activeLogger.unsubscribe(sendEvent);
    }
  });
});

// Resume paused run (after approval or question answer)
app.post('/runs/:id/resume', async (req, res) => {
  const { id } = req.params;
  const { type, payload } = req.body;

  if (!type || !['approval', 'answer'].includes(type)) {
    return res.status(400).json({ error: 'Field "type" must be "approval" or "answer".' });
  }

  const run = getRun(id);
  if (!run) {
    return res.status(404).json({ error: `Run "${id}" not found.` });
  }

  // Acknowledge immediately so the client UI unblocks and closes modals without waiting for the full run to complete
  res.json({
    status: 'resuming',
    runId: id,
  });

  // Continue workflow execution asynchronously; events stream via SSE
  resumeAgentRun(id, { type, payload }).catch((err) => {
    console.error(`Agent run "${id}" resume error:`, err.message);
  });
});

// Abort run
app.post('/runs/:id/abort', async (req, res) => {
  const { id } = req.params;
  try {
    await abortAgentRun(id);
    res.json({ ok: true, message: `Run "${id}" aborted.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Export or start server
export { app };

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Promise Rejection caught at server level:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception caught at server level:', err);
});

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  app.listen(PORT, () => {
    console.log(`🚀 CentrAlign Agent Server running on http://localhost:${PORT}`);
  });
}

/**
 * Helper to fetch active run's trace logger
 * @param {string} runId
 * @returns {import('./trace/logger.js').TraceLogger|null}
 */
function getRunLogger(runId) {
  return getActiveRunLogger(runId);
}
