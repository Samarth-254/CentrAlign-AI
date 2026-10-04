'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button.jsx';
import { Switch } from '@/components/ui/Badge.jsx';
import { StatusDot } from '@/components/ui/Badge.jsx';
import { Kbd } from '@/components/ui/Modal.jsx';

/**
 * 48px Top navigation bar with glyph, run status, live timer, tool budget meter, and controls.
 */
export function TopBar({
  runStatus = 'idle',
  elapsedSeconds = 0,
  toolCallCount = 0,
  maxToolCalls = 25,
  isChaosEnabled = false,
  chaosDisabled = false,
  chaosLabel = 'Chaos mode',
  chaosSubtitle = null,
  onToggleChaos,
  isResetting = false,
  onResetDemoData,
}) {
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const statusLabels = {
    idle: 'Idle',
    running: 'Running',
    awaiting_human: 'Awaiting approval',
    completed: 'Completed',
    failed: 'Failed',
    aborted: 'Aborted',
  };

  const budgetPct = Math.min(100, Math.round((toolCallCount / maxToolCalls) * 100));

  return (
    <header className="h-12 border-b border-[#242424] bg-[#0A0A0A] px-4 flex items-center justify-between select-none z-20 shrink-0">
      {/* Left: Product Mark & Status */}
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-3.5 h-3.5 bg-[#FF6A1A] rounded-[3px] shrink-0" />
          <span className="text-[14px] font-semibold text-[#EDEDED] tracking-tight group-hover:text-white">
            CentrAlign Worker
          </span>
        </Link>

        <div className="h-4 w-px bg-[#242424] mx-1" />

        {/* Status Pill */}
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] bg-[#161616] border border-[#242424] text-[12px]">
          <StatusDot
            status={runStatus}
            pulse={runStatus === 'running' || runStatus === 'awaiting_human'}
          />
          <span className="text-[#EDEDED] font-medium capitalize">
            {statusLabels[runStatus] || runStatus}
          </span>
        </div>

        {/* Live Timer */}
        {(runStatus === 'running' || elapsedSeconds > 0) && (
          <div className="text-[12px] font-mono text-[#8C8C8C] tabular-nums">
            {formatTime(elapsedSeconds)}
          </div>
        )}

        {/* Tool Call Budget Meter */}
        <div className="hidden sm:flex items-center gap-2 pl-2">
          <div className="w-20 h-1 bg-[#1C1C1C] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#FF6A1A] transition-all duration-300"
              style={{ width: `${budgetPct}%` }}
            />
          </div>
          <span className="text-[11px] font-mono text-[#8C8C8C] tabular-nums">
            {toolCallCount}/{maxToolCalls} calls
          </span>
        </div>
      </div>

      {/* Right: Chaos Mode, Reset, Links & Hints */}
      <div className="flex items-center gap-3">
        {/* Quick sandbox links */}
        <div className="hidden lg:flex items-center gap-2 text-[12px] text-[#8C8C8C]">
          <Link
            href="/portal/vendors"
            target="_blank"
            className="hover:text-[#EDEDED] hover:underline"
          >
            Portal ↗
          </Link>
          <span>•</span>
          <Link
            href="/erp/bills"
            target="_blank"
            className="hover:text-[#EDEDED] hover:underline"
          >
            ERP ↗
          </Link>
        </div>

        <div className="hidden sm:block h-4 w-px bg-[#242424]" />

        {/* Chaos Switch */}
        <div className="flex flex-col items-end justify-center">
          <Switch
            id="chaos-switch"
            checked={isChaosEnabled}
            onChange={onToggleChaos}
            disabled={chaosDisabled}
            label={chaosLabel}
          />
          {chaosSubtitle && (
            <span
              id="chaos-settings-label"
              className="text-[10px] text-[#FF6A1A] font-mono mt-0.5 tracking-tight"
            >
              {chaosSubtitle}
            </span>
          )}
        </div>

        {/* Reset Button */}
        <Button
          variant="secondary"
          size="sm"
          disabled={isResetting}
          loading={isResetting}
          onClick={onResetDemoData}
        >
          Reset data
        </Button>

        {/* Shortcut Hint */}
        <div className="hidden md:flex items-center gap-1 text-[11px] text-[#5E5E5E]">
          <Kbd>Ctrl</Kbd>+<Kbd>Enter</Kbd>
        </div>
      </div>
    </header>
  );
}
