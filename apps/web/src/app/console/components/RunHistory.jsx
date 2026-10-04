'use client';

import { Button } from '@/components/ui/Button.jsx';
import { StatusDot } from '@/components/ui/Badge.jsx';
import { EmptyState } from '@/components/ui/Modal.jsx';

/**
 * 260px Left rail with "New task" button, past runs list, and selected run indicator.
 */
export function RunHistory({
  runs = [],
  activeRunId,
  onSelectRun,
  onNewTask,
  isOpen = true,
  onCloseMobile,
}) {
  const formatDuration = (ms) => {
    if (!ms) return '';
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return '';
    const diffSec = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    return `${diffHr}h ago`;
  };

  return (
    <aside
      className={`w-[260px] shrink-0 border-r border-[#242424] bg-[#0A0A0A] flex flex-col h-full z-10 transition-transform md:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}
    >
      {/* Top Action */}
      <div className="p-3 border-b border-[#242424] flex items-center justify-between gap-2">
        <Button
          variant="primary"
          size="sm"
          className="w-full justify-center"
          onClick={onNewTask}
        >
          + New task
        </Button>
        {onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="md:hidden text-[#8C8C8C] p-1.5 hover:text-[#EDEDED]"
          >
            ✕
          </button>
        )}
      </div>

      {/* Runs List Header */}
      <div className="px-3 py-2 text-[11px] font-medium text-[#8C8C8C] uppercase tracking-wider border-b border-[#242424] select-none flex items-center justify-between">
        <span>Run History</span>
        <span className="font-mono text-[10px] text-[#5E5E5E]">{runs.length}</span>
      </div>

      {/* Runs Scroll Container */}
      <div className="flex-1 overflow-y-auto">
        {runs.length === 0 ? (
          <EmptyState
            title="No past runs"
            description="Start a task to see live traces and historical reports."
          />
        ) : (
          <div className="divide-y divide-[#242424]">
            {runs.map((run) => {
              const isSelected = run.runId === activeRunId;
              return (
                <button
                  key={run.runId}
                  id={`run-history-${run.runId}`}
                  data-testid={`run-item-${run.runId}`}
                  type="button"
                  onClick={() => onSelectRun(run.runId)}
                  className={`w-full text-left p-3 transition-colors cursor-pointer block ${
                    isSelected
                      ? 'bg-[#1C1C1C] border-l-2 border-[#FF6A1A]'
                      : 'hover:bg-[#161616] border-l-2 border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <div className="flex items-center gap-1.5">
                      <StatusDot status={run.status} />
                      <span className="text-[11px] font-mono text-[#8C8C8C] truncate max-w-[120px]">
                        {run.runId.slice(-8)}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-[#5E5E5E]">
                      {formatRelativeTime(run.timestamp)}
                    </span>
                  </div>

                  <p className="text-[12px] text-[#EDEDED] line-clamp-2 leading-snug mb-1">
                    {run.goal}
                  </p>

                  <div className="flex items-center justify-between text-[10px] font-mono text-[#8C8C8C] mb-1.5">
                    <span className="capitalize font-medium">{run.status}</span>
                    {run.durationMs && <span>{formatDuration(run.durationMs)}</span>}
                  </div>

                  {/* Settings Badges */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Approval Badge */}
                    {run.settings?.requireApprovalForWrites !== undefined ? (
                      <span
                        title="Require approval for write actions"
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded-[3px] border ${
                          run.settings.requireApprovalForWrites
                            ? 'bg-[#FF6A1A]/10 text-[#FF6A1A] border-[#FF6A1A]/20'
                            : 'bg-[#161616] text-[#8C8C8C] border-[#242424]'
                        }`}
                      >
                        {run.settings.requireApprovalForWrites ? 'Approval on' : 'Approval off'}
                      </span>
                    ) : run.autoApprove !== undefined ? (
                      <span
                        title="Require approval for write actions"
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded-[3px] border ${
                          !run.autoApprove
                            ? 'bg-[#FF6A1A]/10 text-[#FF6A1A] border-[#FF6A1A]/20'
                            : 'bg-[#161616] text-[#8C8C8C] border-[#242424]'
                        }`}
                      >
                        {!run.autoApprove ? 'Approval on' : 'Approval off'}
                      </span>
                    ) : (
                      <span
                        title="Approval setting unknown"
                        className="text-[10px] font-mono px-1.5 py-0.5 rounded-[3px] border bg-[#161616] text-[#5E5E5E] border-[#242424]"
                      >
                        Approval unknown
                      </span>
                    )}

                    {/* Chaos Badge */}
                    {run.settings?.chaosMode !== undefined ? (
                      <span
                        title="Chaos network/server 500 fault injection mode"
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded-[3px] border ${
                          run.settings.chaosMode
                            ? 'bg-[#FF6A1A]/10 text-[#FF6A1A] border-[#FF6A1A]/20'
                            : 'bg-[#161616] text-[#8C8C8C] border-[#242424]'
                        }`}
                      >
                        {run.settings.chaosMode ? 'Chaos on' : 'Chaos off'}
                      </span>
                    ) : (
                      <span
                        title="Chaos setting unknown"
                        className="text-[10px] font-mono px-1.5 py-0.5 rounded-[3px] border bg-[#161616] text-[#5E5E5E] border-[#242424]"
                      >
                        Chaos unknown
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
