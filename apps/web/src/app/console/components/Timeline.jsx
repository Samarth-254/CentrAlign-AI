'use client';

import { useRef, useEffect, useState, useMemo } from 'react';
import { StepCard } from './StepCard.jsx';
import { ReportCard } from './ReportCard.jsx';
import { EVENT_TYPES } from '@centralign/shared';
import { EmptyState } from '@/components/ui/Modal.jsx';

/**
 * Timeline component rendering the vertical sequence of agent steps with auto-scroll and jump-to-bottom.
 * Integrates ReportCard directly inside the scroll stream so mouse-wheel scrolling effortlessly
 * traverses through the summary, audit checks, and all underlying step cards.
 */
export function Timeline({
  events = [],
  isRunning = false,
  onOpenScreenshot,
  finalReport = null,
  verification = null,
  memory = null,
  toolCallCount = 0,
  elapsedSeconds = 0,
}) {
  const containerRef = useRef(null);
  const bottomRef = useRef(null);
  const [userHasScrolledUp, setUserHasScrolledUp] = useState(false);
  const [isReportCollapsed, setIsReportCollapsed] = useState(false);
  const [isReportDismissed, setIsReportDismissed] = useState(false);

  // Reset report state whenever a new report arrives
  useEffect(() => {
    if (finalReport) {
      setIsReportDismissed(false);
      setIsReportCollapsed(false);
    }
  }, [finalReport]);

  // Group low-level events into cohesive execution steps
  const steps = useMemo(() => {
    const list = [];
    let currentStep = null;

    for (const evt of events) {
      const { type, data } = evt;

      if (type === EVENT_TYPES.ACTION_PROPOSED) {
        if (currentStep) list.push(currentStep);
        currentStep = {
          id: `step_${list.length + 1}`,
          tool: data.tool,
          args: data.args,
          rationale: data.rationale,
          status: 'running',
          timestamp: evt.timestamp,
        };
      } else if (type === EVENT_TYPES.TOOL_STARTED) {
        if (!currentStep) {
          currentStep = {
            id: `step_${list.length + 1}`,
            tool: data.tool,
            args: data.args,
            status: 'running',
            timestamp: evt.timestamp,
          };
        } else {
          currentStep.tool = data.tool;
          currentStep.args = data.args;
        }
      } else if (type === EVENT_TYPES.TOOL_FINISHED) {
        if (currentStep) {
          currentStep.status = data.ok ? 'completed' : 'failed';
          currentStep.durationMs = data.durationMs;
          currentStep.result = data.result;
          currentStep.error = data.error;
        }
      } else if (type === EVENT_TYPES.OBSERVATION_CAPTURED) {
        if (currentStep) {
          currentStep.url = data.url;
          currentStep.screenshot = data.screenshot;
        }
      } else if (type === EVENT_TYPES.REFLECTION_COMPLETED) {
        if (currentStep) {
          if (data.retryCount > 0) {
            currentStep.retryCount = data.retryCount;
          }
          if (data.decision === 'retry') {
            currentStep.status = 'failed';
          }
        }
      } else if (type === EVENT_TYPES.POLICY_CHECKED && !data.approved) {
        if (currentStep) {
          currentStep.status = 'awaiting';
        }
      }
    }

    if (currentStep) list.push(currentStep);
    return list;
  }, [events]);

  // Handle user scroll detection
  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 60;
    setUserHasScrolledUp(!isAtBottom);
  };

  // Auto-scroll to bottom only while running if user hasn't scrolled up
  useEffect(() => {
    if (isRunning && !userHasScrolledUp && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [steps.length, isRunning, userHasScrolledUp]);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    setUserHasScrolledUp(false);
  };

  return (
    <div className="relative flex-1 flex flex-col min-h-0 bg-[#0A0A0A]">
      <div
        ref={containerRef}
        data-testid="timeline-scroll"
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 flex flex-col gap-3"
      >
        {/* Top Report Card integrated seamlessly into the scroll container */}
        {finalReport && !isReportDismissed && (
          <ReportCard
            report={finalReport}
            verification={verification}
            memory={memory}
            toolCallCount={toolCallCount}
            elapsedSeconds={elapsedSeconds}
            onOpenScreenshot={onOpenScreenshot}
            isCollapsed={isReportCollapsed}
            onToggleCollapse={() => setIsReportCollapsed((prev) => !prev)}
            onClose={() => setIsReportDismissed(true)}
          />
        )}

        {/* Minimized banner when Report Card has been dismissed by user */}
        {finalReport && isReportDismissed && (
          <div className="flex items-center justify-between px-3.5 py-2.5 rounded-[6px] bg-[#111111] border border-[#242424] shrink-0">
            <div className="flex items-center gap-2.5 text-[12px]">
              <span
                className={`font-semibold ${
                  finalReport.status === 'completed' ? 'text-[#3FB950]' : 'text-[#F85149]'
                }`}
              >
                {finalReport.status === 'completed' ? '✓ Run Verified' : '✕ Run Failed'}
              </span>
              <span className="text-[#8C8C8C] font-mono">
                {toolCallCount} calls • {elapsedSeconds}s
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsReportDismissed(false)}
              className="text-[12px] font-medium text-[#FF6A1A] hover:underline cursor-pointer"
            >
              Show Report Details ↗
            </button>
          </div>
        )}

        {/* Section Heading when steps exist */}
        {steps.length > 0 && (
          <div className="flex items-center justify-between pt-1 pb-0 text-[11px] font-semibold uppercase tracking-wider text-[#5E5E5E]">
            <span>Execution Timeline ({steps.length} Steps)</span>
            <span className="text-[10px] font-normal normal-case text-[#8C8C8C]">
              Scroll to view full step history
            </span>
          </div>
        )}

        {/* Step cards */}
        {steps.length === 0 ? (
          <EmptyState
            title={isRunning ? 'Starting agent run...' : 'No steps yet'}
            description={
              isRunning
                ? 'Understanding goal and formulating high-level execution plan...'
                : 'Click "Run task" to initiate the autonomous worker loop.'
            }
          />
        ) : (
          steps.map((step) => (
            <StepCard
              key={step.id}
              step={step}
              onOpenScreenshot={onOpenScreenshot}
            />
          ))
        )}

        <div ref={bottomRef} className="h-4 shrink-0" />
      </div>

      {/* Floating Jump to Latest Chip */}
      {userHasScrolledUp && steps.length > 0 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
          <button
            type="button"
            onClick={scrollToBottom}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1C1C1C] border border-[#FF6A1A] text-[#FF6A1A] text-[12px] font-medium shadow-none hover:bg-[#161616] cursor-pointer"
          >
            <span>↓ Jump to latest</span>
          </button>
        </div>
      )}
    </div>
  );
}
