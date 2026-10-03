'use client';

/**
 * Horizontal pipeline indicator showing agent state machine progression:
 * Understand > Plan > Execute > Observe > Verify > Complete
 */
export function PipelineBar({ activeNode = null, runStatus = 'idle' }) {
  const steps = [
    { id: 'understand', label: 'Understand' },
    { id: 'plan', label: 'Plan' },
    { id: 'execute', label: 'Execute' },
    { id: 'observe', label: 'Observe' },
    { id: 'verify', label: 'Verify' },
    { id: 'complete', label: 'Complete' },
  ];

  // Map active node name to pipeline step id
  const getNodeStepIndex = (node) => {
    if (!node) return 0;
    const n = node.toLowerCase();
    if (n.includes('understand')) return 0;
    if (n.includes('plan')) return 1;
    if (n.includes('decide') || n.includes('policy') || n.includes('execute')) return 2;
    if (n.includes('observe') || n.includes('reflect')) return 3;
    if (n.includes('verify')) return 4;
    if (n.includes('finalize')) return 5;
    return 2;
  };

  const activeIndex = getNodeStepIndex(activeNode);

  return (
    <div className="px-4 py-2 bg-[#111111] border-b border-[#242424] flex items-center justify-between select-none overflow-x-auto text-[12px]">
      <div className="flex items-center gap-2 sm:gap-4 w-full justify-between max-w-2xl mx-auto">
        {steps.map((step, idx) => {
          let isDone = false;
          let isActive = false;
          let isFailed = false;

          if (runStatus === 'completed') {
            isDone = true;
          } else if (runStatus === 'failed' || runStatus === 'aborted') {
            if (idx < activeIndex) {
              isDone = true;
            } else if (idx === activeIndex) {
              isFailed = true;
            }
            // idx > activeIndex remains pending/unreached
          } else if (runStatus === 'running' || runStatus === 'awaiting_human') {
            if (idx < activeIndex) {
              isDone = true;
            } else if (idx === activeIndex) {
              isActive = true;
            }
          }

          return (
            <div key={step.id} className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                {isDone ? (
                  <span className="text-[#3FB950] font-mono text-[11px] font-bold">✓</span>
                ) : isActive ? (
                  <span className="inline-block w-2 h-2 rounded-full bg-[#FF6A1A] animate-dot-pulse" />
                ) : isFailed ? (
                  <span className="text-[#F85149] font-mono text-[11px] font-bold">✕</span>
                ) : (
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#333333]" />
                )}

                <span
                  className={`font-medium transition-colors ${
                    isActive
                      ? 'text-[#FF6A1A]'
                      : isDone
                      ? 'text-[#EDEDED]'
                      : isFailed
                      ? 'text-[#F85149]'
                      : 'text-[#5E5E5E]'
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {idx < steps.length - 1 && (
                <span className="text-[#333333] hidden sm:inline select-none">›</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
