#!/usr/bin/env node
import readline from 'node:readline';
import { startAgentRun, resumeAgentRun, getRun } from './graph/runner.js';
import { EVENT_TYPES } from '@centralign/shared';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

function askQuestionInteractive(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans.trim());
    });
  });
}

async function main() {
  const args = process.argv.slice(2);
  let goal = '';
  let autoApprove = false;

  for (const arg of args) {
    if (arg === '--auto-approve') {
      autoApprove = true;
    } else if (arg === '--headed') {
      process.env.HEADLESS = 'false';
    } else if (arg === '--headless') {
      process.env.HEADLESS = 'true';
    } else if (!arg.startsWith('--') && !goal) {
      goal = arg;
    }
  }

  if (!goal) {
    goal = 'Find the latest invoice from Northwind Traders, extract the amount and due date, enter it into AcmeBooks, and tell me once it is done.';
  }

  console.log('\n======================================================');
  console.log('🤖 CENTRALIGN AUTONOMOUS TASK WORKER');
  console.log('======================================================');
  console.log(`Goal: "${goal}"`);
  console.log(`Auto-Approve: ${autoApprove}`);
  console.log(`Headless: ${process.env.HEADLESS !== 'false'}`);
  console.log('------------------------------------------------------\n');

  const { runId, traceLogger, runPromise } = await startAgentRun({
    goal,
    autoApprove,
  });

  // Subscribe to live trace events for CLI logging
  traceLogger.subscribe((event) => {
    const time = new Date(event.timestamp).toLocaleTimeString();
    switch (event.type) {
      case EVENT_TYPES.NODE_ENTERED:
        console.log(`\x1b[36m[${time}] ↳ Node: ${event.data.node}\x1b[0m`);
        break;
      case EVENT_TYPES.UNDERSTANDING_PRODUCED:
        console.log(`\x1b[32m[${time}] ✓ Objective:\x1b[0m ${event.data.objective}`);
        console.log(`       Criteria: ${event.data.successCriteria?.length} defined`);
        break;
      case EVENT_TYPES.PLAN_CREATED:
        console.log(`\x1b[35m[${time}] 📋 Plan Created:\x1b[0m ${event.data.steps?.length} steps`);
        for (const s of event.data.steps || []) {
          console.log(`         [ ] ${s.id}: ${s.description}`);
        }
        break;
      case EVENT_TYPES.ACTION_PROPOSED:
        console.log(`\x1b[33m[${time}] ⚡ Tool Proposed:\x1b[0m ${event.data.tool}`);
        console.log(`       Rationale: ${event.data.rationale}`);
        break;
      case EVENT_TYPES.TOOL_FINISHED:
        const icon = event.data.ok ? '✓' : '✗';
        const color = event.data.ok ? '\x1b[32m' : '\x1b[31m';
        console.log(`${color}[${time}] ${icon} Tool ${event.data.tool} (${event.data.durationMs}ms)\x1b[0m`);
        if (!event.data.ok) {
          console.log(`       Error: ${event.data.error}`);
        }
        break;
      case EVENT_TYPES.APPROVAL_REQUESTED:
        console.log(`\n\x1b[41m\x1b[37m[HUMAN APPROVAL REQUIRED]\x1b[0m`);
        console.log(`Action: ${event.data.payload?.action}`);
        console.log(`Values:`, event.data.payload?.values);
        console.log(`Rationale: ${event.data.payload?.rationale}\n`);
        break;
      case EVENT_TYPES.QUESTION_REQUESTED:
        console.log(`\n\x1b[44m\x1b[37m[QUESTION FOR HUMAN]\x1b[0m ${event.data.question}\n`);
        break;
      case EVENT_TYPES.VERIFICATION_STARTED:
        console.log(`\n\x1b[34m[${time}] 🔍 Independent Verification Auditor Started...\x1b[0m`);
        break;
      case EVENT_TYPES.VERIFICATION_CHECK:
        const chkIcon = event.data.passed ? '✓ PASS' : '✗ FAIL';
        const chkColor = event.data.passed ? '\x1b[32m' : '\x1b[31m';
        console.log(`   ${chkColor}${chkIcon}:\x1b[0m ${event.data.criterion}`);
        if (event.data.evidence) {
          console.log(`          Evidence: ${event.data.evidence}`);
        }
        break;
      case EVENT_TYPES.VERIFICATION_COMPLETED:
        console.log(`\x1b[1m\x1b[36m[${time}] ⚖️ Verification Conclusion: ${event.data.summary}\x1b[0m\n`);
        break;
      case EVENT_TYPES.RUN_COMPLETED:
        console.log(`\n\x1b[42m\x1b[30m[TASK COMPLETE]\x1b[0m ${event.data.summary}\n`);
        break;
      case EVENT_TYPES.RUN_FAILED:
        console.log(`\n\x1b[41m\x1b[37m[TASK FAILED]\x1b[0m ${event.data.error || 'Task failed verification.'}\n`);
        break;
    }
  });

  // Await run promise or handle interrupts interactively
  let result = await runPromise;

  while (result && result.status === 'awaiting_human') {
    const runState = getRun(runId);
    const lastEvent = runState.events[runState.events.length - 1];

    if (lastEvent?.type === EVENT_TYPES.APPROVAL_REQUESTED) {
      const answer = await askQuestionInteractive('Approve this action? (y/n): ');
      const approved = answer.toLowerCase().startsWith('y');
      result = await resumeAgentRun(runId, {
        type: 'approval',
        payload: { approved },
      });
    } else if (lastEvent?.type === EVENT_TYPES.QUESTION_REQUESTED) {
      const answer = await askQuestionInteractive('Enter your answer: ');
      result = await resumeAgentRun(runId, {
        type: 'answer',
        payload: { answer },
      });
    } else {
      break;
    }
  }

  // Final summary
  const finalRun = getRun(runId);
  console.log('======================================================');
  console.log(`Run ID: ${runId}`);
  console.log(`Final Status: ${finalRun?.finalReport?.status || result?.status || 'completed'}`);
  console.log(`Summary: ${finalRun?.finalReport?.summary || ''}`);
  if (finalRun?.finalReport?.extractedData) {
    console.log(`Extracted Data:`, finalRun.finalReport.extractedData);
  }
  console.log('======================================================\n');

  const isSuccess = (finalRun?.finalReport?.status === 'completed') || (result?.status === 'completed');
  process.exit(isSuccess ? 0 : 1);
}

main().catch((err) => {
  console.error('\n❌ Fatal CLI Execution Error:', err);
  process.exit(1);
});
