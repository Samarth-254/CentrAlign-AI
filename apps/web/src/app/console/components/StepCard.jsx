'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/Badge.jsx';

/**
 * StepCard representing a single execution step or milestone in the timeline.
 */
export function StepCard({ step, onOpenScreenshot }) {
  const [detailsOpen, setDetailsOpen] = useState(false);

  const {
    id,
    type,
    tool,
    rationale,
    args,
    result,
    error,
    durationMs,
    retryCount,
    screenshot,
    url,
    timestamp,
    status = 'completed',
  } = step;

  const isFailed = status === 'failed' || !!error;
  const isPending = status === 'running';

  const formatDuration = (ms) => {
    if (!ms && ms !== 0) return '';
    return `${ms}ms`;
  };

  // Mask secrets in args string representation
  const formatArgs = (argsObj) => {
    if (!argsObj) return '';
    try {
      const cloned = JSON.parse(JSON.stringify(argsObj));
      const str = JSON.stringify(cloned, null, 2);
      return str.replace(/\{\{secret:([A-Za-z0-9_]+)\}\}/g, '••••••••');
    } catch {
      return String(argsObj);
    }
  };

  const getStatusIcon = () => {
    if (isPending) {
      return (
        <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#FF6A1A] animate-dot-pulse shrink-0" />
      );
    }
    if (isFailed) {
      return (
        <span className="text-[#F85149] font-mono text-[13px] font-bold shrink-0">✕</span>
      );
    }
    return (
      <span className="text-[#3FB950] font-mono text-[12px] font-bold shrink-0">✓</span>
    );
  };

  return (
    <div
      className={`border rounded-[6px] bg-[#111111] transition-colors ${
        isFailed
          ? 'border-[#F85149]/40 border-l-2 border-l-[#F85149]'
          : isPending
          ? 'border-[#FF6A1A]/40 border-l-2 border-l-[#FF6A1A]'
          : 'border-[#242424] hover:border-[#333333]'
      }`}
    >
      <div className="p-3">
        {/* Header Row: Status icon, Tool name in mono, Retry badge, Tabular duration */}
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2 min-w-0">
            {getStatusIcon()}
            <span className="font-mono text-[12px] font-medium text-[#EDEDED] truncate">
              {tool || type}
            </span>
            {retryCount > 0 && (
              <Badge variant="warning" size="sm">
                retry #{retryCount}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {durationMs !== undefined && (
              <span className="font-mono text-[11px] text-[#8C8C8C] tabular-nums">
                {formatDuration(durationMs)}
              </span>
            )}
          </div>
        </div>

        {/* Model Rationale / Reasoning */}
        {rationale && (
          <div className="bg-[#161616] border-l-2 border-[#333333] px-2.5 py-1.5 rounded-r-[4px] my-1.5 text-[12px] text-[#8C8C8C]">
            <span className="text-[#5E5E5E] font-medium mr-1.5">Reasoning:</span>
            {rationale}
          </div>
        )}

        {/* Result summary or error message */}
        {error ? (
          <div className="text-[12px] text-[#F85149] font-mono bg-[#F85149]/10 border border-[#F85149]/20 p-2 rounded-[4px] my-1.5 break-all">
            {error}
          </div>
        ) : result?.summary ? (
          <p className="text-[12px] text-[#EDEDED] my-1 line-clamp-2">
            {result.summary}
          </p>
        ) : null}

        {/* URL chip if navigated */}
        {url && (
          <div className="text-[11px] font-mono text-[#5E5E5E] truncate mt-1">
            📍 {url}
          </div>
        )}

        {/* Screenshot thumbnail + Details toggle */}
        <div className="flex items-center justify-between gap-3 mt-2.5 pt-2 border-t border-[#1C1C1C]">
          <button
            type="button"
            onClick={() => setDetailsOpen(!detailsOpen)}
            className="text-[11px] font-mono text-[#8C8C8C] hover:text-[#EDEDED] flex items-center gap-1 cursor-pointer"
          >
            <span>{detailsOpen ? '▾ Hide details' : '▸ View details'}</span>
          </button>

          {screenshot && (
            <button
              type="button"
              onClick={() => onOpenScreenshot && onOpenScreenshot(screenshot)}
              className="relative group border border-[#242424] hover:border-[#FF6A1A] rounded-[4px] overflow-hidden shrink-0 cursor-pointer"
              title="Click to enlarge screenshot"
            >
              <img
                src={screenshot}
                alt="Step observation"
                className="w-[72px] h-[45px] object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] text-white font-mono transition-opacity">
                🔍
              </div>
            </button>
          )}
        </div>

        {/* Collapsible Details */}
        {detailsOpen && (
          <div className="mt-2.5 pt-2 border-t border-[#1C1C1C] flex flex-col gap-2 font-mono text-[11px]">
            {args && (
              <div>
                <span className="text-[#5E5E5E] block mb-1">Tool Arguments:</span>
                <pre className="bg-[#161616] border border-[#242424] p-2 rounded-[4px] text-[#8C8C8C] overflow-x-auto whitespace-pre-wrap">
                  {formatArgs(args)}
                </pre>
              </div>
            )}

            {result && !result.summary && (
              <div>
                <span className="text-[#5E5E5E] block mb-1">Execution Output:</span>
                <pre className="bg-[#161616] border border-[#242424] p-2 rounded-[4px] text-[#8C8C8C] overflow-x-auto whitespace-pre-wrap">
                  {typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
