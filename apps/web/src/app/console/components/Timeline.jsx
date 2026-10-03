'use client';

import { useRef, useEffect, useState, useMemo } from 'react';
import { StepCard } from './StepCard.jsx';
import { EVENT_TYPES } from '@centralign/shared';
import { EmptyState } from '@/components/ui/Modal.jsx';

/**
 * Timeline component rendering the vertical sequence of agent steps with auto-scroll and jump-to-bottom.
 */
export function Timeline({ events = [], isRunning = false, onOpenScreenshot }) {
  const containerRef = useRef(null);
  const bottomRef = useRef(null);
  const [userHasScrolledUp, setUserHasScrolledUp] = useState(false);

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

  // Auto-scroll to bottom if user is not actively scrolling up
  useEffect(() => {
    if (!userHasScrolledUp && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [steps.length, userHasScrolledUp]);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    setUserHasScrolledUp(false);
  };

  return (
    <div className="relative flex-1 flex flex-col min-h-0 bg-[#0A0A0A]">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 flex flex-col gap-3"
      >
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

        <div ref={bottomRef} className="h-2 shrink-0" />
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
