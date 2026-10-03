'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/Badge.jsx';
import { Button } from '@/components/ui/Button.jsx';

/**
 * ReportCard rendered at the top of the timeline once the run finishes or fails.
 * Fully scrollable, collapsible, and dismissible so the timeline is never blocked.
 */
export function ReportCard({
  report,
  verification,
  memory,
  toolCallCount = 0,
  elapsedSeconds = 0,
  onOpenScreenshot,
  isCollapsed = false,
  onToggleCollapse,
  onClose,
}) {
  const [copied, setCopied] = useState(false);

  if (!report) return null;

  const isSuccess = report.status === 'completed';

  const copySummary = () => {
    const text = `CentrAlign Run Report (${report.status}):\n${report.summary}`;
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadJson = () => {
    const payload = {
      report,
      verification,
      memory,
      stats: { toolCallCount, elapsedSeconds },
      timestamp: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `run-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadHtml = () => {
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>CentrAlign Task Report</title>
  <style>
    body { font-family: -apple-system, sans-serif; background: #0A0A0A; color: #EDEDED; padding: 40px; }
    .card { background: #111; border: 1px solid #242424; padding: 24px; border-radius: 8px; max-width: 800px; margin: 0 auto; }
    h1 { color: #FF6A1A; font-size: 20px; }
    .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-weight: bold; background: ${isSuccess ? '#3FB95022' : '#F8514922'}; color: ${isSuccess ? '#3FB950' : '#F85149'}; }
    .check { margin: 8px 0; padding: 8px; background: #161616; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="card">
    <span class="badge">${report.status.toUpperCase()}</span>
    <h1>Task Execution Report</h1>
    <p>${report.summary}</p>
    <h3>Verification Audit</h3>
    ${(verification?.checks || [])
      .map(
        (c) =>
          `<div class="check"><strong>${c.passed ? '✓ PASS' : '✕ FAIL'}:</strong> ${c.criterion}<br><small style="color:#8C8C8C">Evidence: ${c.evidence || 'N/A'}</small></div>`
      )
      .join('')}
  </div>
</body>
</html>`;
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `run-report-${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // If in collapsed view, render a compact 36px high single-row bar
  if (isCollapsed) {
    return (
      <div
        className={`border rounded-[6px] px-3 py-2 bg-[#111111] transition-colors flex items-center justify-between gap-3 shrink-0 ${
          isSuccess
            ? 'border-[#3FB950]/40 border-l-4 border-l-[#3FB950]'
            : 'border-[#F85149]/40 border-l-4 border-l-[#F85149]'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Badge variant={isSuccess ? 'success' : 'danger'} size="sm">
            {isSuccess ? '✓ Completed & Verified' : '✕ Execution Failed'}
          </Badge>
          <span className="text-[12px] font-mono text-[#8C8C8C] tabular-nums shrink-0">
            {toolCallCount} calls • {elapsedSeconds}s
          </span>
          <span className="text-[12px] text-[#EDEDED] truncate hidden sm:inline">
            {report.summary}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {onToggleCollapse && (
            <Button variant="ghost" size="sm" onClick={onToggleCollapse}>
              ▼ Expand Details
            </Button>
          )}
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} title="Close report">
              ✕ Close
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Expanded View
  return (
    <div
      className={`border rounded-[6px] p-4 bg-[#111111] transition-colors shrink-0 ${
        isSuccess
          ? 'border-[#3FB950]/40 border-l-4 border-l-[#3FB950]'
          : 'border-[#F85149]/40 border-l-4 border-l-[#F85149]'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Badge variant={isSuccess ? 'success' : 'danger'} size="md">
            {isSuccess ? '✓ Completed & Verified' : '✕ Execution Failed'}
          </Badge>
          <span className="text-[12px] font-mono text-[#8C8C8C] tabular-nums">
            {toolCallCount} calls • {elapsedSeconds}s
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="sm" onClick={copySummary}>
            {copied ? '✓ Copied' : 'Copy'}
          </Button>
          <Button variant="secondary" size="sm" onClick={downloadJson}>
            JSON
          </Button>
          <Button variant="secondary" size="sm" onClick={downloadHtml}>
            HTML
          </Button>
          {onToggleCollapse && (
            <Button variant="ghost" size="sm" onClick={onToggleCollapse} title="Collapse report card">
              ▲ Collapse
            </Button>
          )}
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-[#8C8C8C] hover:text-[#EDEDED]"
              title="Close report to view timeline details"
            >
              ✕ Close
            </Button>
          )}
        </div>
      </div>

      {/* Summary */}
      <p className="text-[13px] text-[#EDEDED] leading-relaxed mb-3">
        {report.summary}
      </p>

      {/* Extracted Data Grid */}
      {memory && Object.keys(memory).length > 0 && (
        <div className="my-3 p-3 bg-[#161616] border border-[#242424] rounded-[6px]">
          <h4 className="text-[11px] uppercase tracking-wider text-[#8C8C8C] font-semibold mb-2">
            Discovered & Extracted Data
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-[12px]">
            {Object.entries(memory).map(([k, item]) => {
              const val = typeof item === 'object' && item !== null ? item.value : item;
              return (
                <div key={k} className="p-2 rounded-[4px] bg-[#111111] border border-[#242424]">
                  <span className="text-[#8C8C8C] text-[10px] block truncate">{k}</span>
                  <span className="text-[#FF6A1A] font-semibold truncate block">{String(val)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Verification Audit Checklist with scroll limit */}
      {verification?.checks && verification.checks.length > 0 && (
        <div className="my-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-[11px] uppercase tracking-wider text-[#8C8C8C] font-semibold">
              Independent Verification Audit ({verification.checks.filter((c) => c.passed).length}/{verification.checks.length} Passed)
            </h4>
          </div>
          <div className="flex flex-col gap-1.5 max-h-[280px] overflow-y-auto pr-1">
            {verification.checks.map((check, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-[4px] bg-[#161616] border border-[#242424] text-[12px] flex items-start justify-between gap-3"
              >
                <div className="flex items-start gap-2">
                  <span className="font-mono mt-0.5">
                    {check.passed ? (
                      <span className="text-[#3FB950] font-bold">✓</span>
                    ) : (
                      <span className="text-[#F85149] font-bold">✕</span>
                    )}
                  </span>
                  <div>
                    <span className={check.passed ? 'text-[#EDEDED]' : 'text-[#F85149]'}>
                      {check.criterion}
                    </span>
                    {check.evidence && (
                      <p className="text-[11px] font-mono text-[#8C8C8C] mt-0.5 break-all">
                        Evidence: {check.evidence}
                      </p>
                    )}
                  </div>
                </div>

                {check.screenshot && (
                  <button
                    type="button"
                    onClick={() => onOpenScreenshot && onOpenScreenshot(check.screenshot)}
                    className="text-[11px] font-mono text-[#FF6A1A] hover:underline shrink-0 cursor-pointer"
                  >
                    View proof ↗
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
