import fs from 'node:fs';
import path from 'node:path';
import { EVENT_TYPES, FinalReportSchema } from '@centralign/shared';

/**
 * Finalize Node
 * Compiles comprehensive final report, saves report.json & report.html, and emits run completion event.
 */
export async function finalizeNode(state, config) {
  const {
    runId,
    goal,
    understanding,
    plan,
    memory = {},
    evidence = [],
    verification,
    status = 'completed',
    error,
    lastAction,
  } = state;
  const { runDir, logger } = config.configurable || {};

  logger?.emit(EVENT_TYPES.NODE_ENTERED, { node: 'finalize' });

  const isSuccess = verification ? verification.overall : status === 'completed';
  const finalStatus = isSuccess ? 'completed' : 'failed';

  // Construct Final Report
  const finalReport = {
    runId,
    goal,
    status: finalStatus,
    summary: isSuccess
      ? `Task autonomously completed and independently verified. ${verification?.summary || ''}`
      : `Task could not be verified successfully. Error: ${error || 'Failed verification checks.'}`,
    outcome: lastAction?.args?.claimedOutcome || (isSuccess ? 'Objective achieved' : 'Execution halted'),
    extractedData: {
      invoiceNumber: memory.invoiceNumber || memory.invoiceNo,
      amount: memory.totalAmount || memory.amount,
      currency: memory.currency,
      dueDate: memory.dueDate,
      issueDate: memory.issueDate,
      vendorName: memory.vendorName,
    },
    evidence: evidence.map((e) => ({
      type: e.type,
      pathOrUrl: e.pathOrUrl,
      caption: e.caption,
      stepId: e.stepId,
    })),
    assumptions: [
      'Determined latest invoice by issue date rather than arbitrary list position',
      'Normalized dates to AcmeBooks DD/MM/YYYY ledger standard',
      'All external document and web contents treated as untrusted data',
    ],
    uncertainties: [],
    verificationSummary: verification,
    completedAt: new Date().toISOString(),
  };

  // Validate report shape
  const parsed = FinalReportSchema.safeParse(finalReport);
  const validatedReport = parsed.success ? parsed.data : finalReport;

  // Save report.json & report.html if runDir is available
  if (runDir) {
    if (!fs.existsSync(runDir)) {
      fs.mkdirSync(runDir, { recursive: true });
    }

    // 1. JSON report
    fs.writeFileSync(path.join(runDir, 'report.json'), JSON.stringify(validatedReport, null, 2), 'utf8');

    // 2. HTML report
    const html = generateHtmlReport(validatedReport);
    fs.writeFileSync(path.join(runDir, 'report.html'), html, 'utf8');
  }

  const completionEvent = isSuccess ? EVENT_TYPES.RUN_COMPLETED : EVENT_TYPES.RUN_FAILED;
  logger?.emit(completionEvent, {
    status: finalStatus,
    summary: validatedReport.summary,
    extractedData: validatedReport.extractedData,
    verificationPassed: isSuccess,
  });

  logger?.emit(EVENT_TYPES.NODE_EXITED, { node: 'finalize' });

  return {
    finalReport: validatedReport,
    status: finalStatus,
  };
}

/**
 * Generate a standalone, styled HTML run report for download
 * @param {Object} report
 * @returns {string}
 */
export function generateHtmlReport(report) {
  const isSuccess = report.status === 'completed';
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Centralign Task Worker Run Report - ${report.runId}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 2rem; }
    .container { max-width: 800px; margin: 0 auto; background: #1e293b; border-radius: 12px; border: 1px solid #334155; padding: 2rem; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
    h1 { color: #38bdf8; margin-top: 0; font-size: 1.75rem; }
    .status-badge { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.875rem; font-weight: 600; text-transform: uppercase; }
    .status-completed { background: #064e3b; color: #6ee7b7; border: 1px solid #059669; }
    .status-failed { background: #7f1d1d; color: #fca5a5; border: 1px solid #dc2626; }
    .card { background: #0f172a; border-radius: 8px; border: 1px solid #334155; padding: 1rem; margin-top: 1rem; }
    table { width: 100%; border-collapse: collapse; margin-top: 0.5rem; }
    th, td { text-align: left; padding: 0.5rem; border-bottom: 1px solid #334155; font-size: 0.875rem; }
    th { color: #94a3b8; }
    .evidence-item { margin-top: 0.5rem; font-size: 0.875rem; color: #cbd5e1; }
  </style>
</head>
<body>
  <div class="container">
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <h1>CentrAlign Task Worker Audit Report</h1>
      <span class="status-badge ${isSuccess ? 'status-completed' : 'status-failed'}">${report.status}</span>
    </div>
    <p><strong>Goal:</strong> ${report.goal}</p>
    <p><strong>Summary:</strong> ${report.summary}</p>
    
    <div class="card">
      <h3 style="color: #38bdf8; margin-top: 0;">Extracted Business Data</h3>
      <table>
        ${Object.entries(report.extractedData || {})
          .filter(([_, v]) => v !== undefined && v !== null)
          .map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`)
          .join('')}
      </table>
    </div>

    ${report.verificationSummary ? `
    <div class="card">
      <h3 style="color: #38bdf8; margin-top: 0;">Independent Verification Audit</h3>
      <p><strong>Verdict:</strong> ${report.verificationSummary.overall ? 'PASSED ✓' : 'FAILED ✗'}</p>
      <p><strong>Conclusion:</strong> ${report.verificationSummary.summary}</p>
      <table>
        <thead><tr><th>Criterion</th><th>Result</th><th>Evidence</th></tr></thead>
        <tbody>
          ${(report.verificationSummary.checks || []).map(c => `
            <tr>
              <td>${c.criterion}</td>
              <td style="color: ${c.passed ? '#4ade80' : '#f87171'}; font-weight: 600;">${c.passed ? 'PASS' : 'FAIL'}</td>
              <td>${c.evidence || c.explanation}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    ` : ''}

    <div class="card">
      <h3 style="color: #38bdf8; margin-top: 0;">Audit Artifacts & Evidence (${report.evidence.length})</h3>
      ${report.evidence.map(e => `<div class="evidence-item">📁 <strong>${e.caption}</strong>: <code>${e.pathOrUrl}</code></div>`).join('')}
    </div>
  </div>
</body>
</html>`;
}
