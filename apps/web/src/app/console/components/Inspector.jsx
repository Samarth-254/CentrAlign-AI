'use client';

import { useState } from 'react';
import { Tabs } from '@/components/ui/Modal.jsx';
import { BrowserPanel } from './BrowserPanel.jsx';
import { Badge } from '@/components/ui/Badge.jsx';
import { EmptyState } from '@/components/ui/Modal.jsx';

/**
 * 340px Right inspector panel with tabs:
 * Overview | Plan | Memory | Browser
 */
export function Inspector({
  understanding = null,
  plan = [],
  memory = {},
  verification = null,
  currentUrl = 'about:blank',
  currentScreenshot = null,
  onEnlargeScreenshot,
}) {
  const [activeTab, setActiveTab] = useState('browser');

  const tabs = [
    { id: 'browser', label: 'Browser' },
    { id: 'overview', label: 'Overview' },
    { id: 'plan', label: 'Plan', badge: plan.length ? String(plan.length) : null },
    { id: 'memory', label: 'Memory', badge: Object.keys(memory).length ? String(Object.keys(memory).length) : null },
  ];

  return (
    <aside className="w-full lg:w-[340px] shrink-0 border-l border-[#242424] bg-[#111111] flex flex-col h-full overflow-hidden select-none">
      {/* Tabs Header */}
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* Tab Panels */}
      <div className="flex-1 overflow-y-auto">
        {/* BROWSER TAB */}
        {activeTab === 'browser' && (
          <BrowserPanel
            currentUrl={currentUrl}
            screenshot={currentScreenshot}
            onEnlarge={onEnlargeScreenshot}
          />
        )}

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="p-4 flex flex-col gap-4">
            {understanding ? (
              <>
                {/* Objective */}
                <div>
                  <h4 className="text-[11px] uppercase tracking-wider text-[#8C8C8C] font-semibold mb-1.5">
                    Objective
                  </h4>
                  <p className="text-[13px] text-[#EDEDED] leading-relaxed bg-[#161616] p-3 rounded-[6px] border border-[#242424]">
                    {understanding.objective}
                  </p>
                </div>

                {/* Success Criteria */}
                <div>
                  <h4 className="text-[11px] uppercase tracking-wider text-[#8C8C8C] font-semibold mb-1.5">
                    Success Criteria
                  </h4>
                  <div className="flex flex-col gap-2">
                    {understanding.successCriteria?.map((criterion, idx) => {
                      // Check if verification evaluated this criterion
                      const matchedCheck = verification?.checks?.find((c) =>
                        c.criterion?.toLowerCase().includes(criterion.toLowerCase().slice(0, 20))
                      );
                      const isPassed = matchedCheck?.passed;
                      const isEvaluated = matchedCheck !== undefined;

                      return (
                        <div
                          key={idx}
                          className="flex items-start gap-2 p-2.5 rounded-[6px] bg-[#161616] border border-[#242424] text-[12px]"
                        >
                          <span className="font-mono text-[11px] mt-0.5">
                            {isEvaluated ? (
                              isPassed ? (
                                <span className="text-[#3FB950] font-bold">✓</span>
                              ) : (
                                <span className="text-[#F85149] font-bold">✕</span>
                              )
                            ) : (
                              <span className="text-[#5E5E5E]">○</span>
                            )}
                          </span>
                          <span
                            className={
                              isEvaluated
                                ? isPassed
                                  ? 'text-[#EDEDED]'
                                  : 'text-[#F85149]'
                                : 'text-[#8C8C8C]'
                            }
                          >
                            {criterion}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Constraints */}
                {understanding.constraints?.length > 0 && (
                  <div>
                    <h4 className="text-[11px] uppercase tracking-wider text-[#8C8C8C] font-semibold mb-1.5">
                      Constraints
                    </h4>
                    <ul className="list-disc list-inside text-[12px] text-[#8C8C8C] flex flex-col gap-1">
                      {understanding.constraints.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <EmptyState
                title="No understanding yet"
                description="The goal will be parsed into structured objectives and success criteria once executed."
              />
            )}
          </div>
        )}

        {/* PLAN TAB */}
        {activeTab === 'plan' && (
          <div className="p-4 flex flex-col gap-3">
            {plan.length === 0 ? (
              <EmptyState
                title="Plan pending"
                description="A high-level execution checklist will be formulated after goal understanding."
              />
            ) : (
              <div className="flex flex-col gap-2">
                {plan.map((step, idx) => {
                  const isDone = step.status === 'done';
                  const isCurrent = step.status === 'in_progress';
                  const isFailed = step.status === 'failed';

                  return (
                    <div
                      key={step.id || idx}
                      className={`p-3 rounded-[6px] border text-[12px] transition-colors ${
                        isCurrent
                          ? 'bg-[#1C1C1C] border-[#FF6A1A]'
                          : isDone
                          ? 'bg-[#161616] border-[#242424] opacity-80'
                          : isFailed
                          ? 'bg-[#F85149]/10 border-[#F85149]/30'
                          : 'bg-[#111111] border-[#242424]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          {isDone ? (
                            <span className="text-[#3FB950] font-mono font-bold">✓</span>
                          ) : isCurrent ? (
                            <span className="inline-block w-2 h-2 rounded-full bg-[#FF6A1A] animate-dot-pulse" />
                          ) : isFailed ? (
                            <span className="text-[#F85149] font-mono font-bold">✕</span>
                          ) : (
                            <span className="text-[#5E5E5E] font-mono">○</span>
                          )}
                          <span className="font-mono text-[11px] text-[#8C8C8C]">
                            Step {idx + 1}
                          </span>
                        </div>
                        <Badge
                          variant={
                            isDone ? 'success' : isCurrent ? 'accent' : isFailed ? 'danger' : 'muted'
                          }
                          size="sm"
                        >
                          {step.status}
                        </Badge>
                      </div>
                      <p
                        className={`text-[12px] leading-snug ${
                          isDone ? 'text-[#8C8C8C] line-through' : 'text-[#EDEDED]'
                        }`}
                      >
                        {step.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* MEMORY TAB */}
        {activeTab === 'memory' && (
          <div className="p-4">
            {Object.keys(memory).length === 0 ? (
              <EmptyState
                title="Memory is empty"
                description="Discovered facts (invoices, dates, amounts) will be recorded here with provenance."
              />
            ) : (
              <div className="flex flex-col gap-2">
                {Object.entries(memory).map(([key, item]) => {
                  const val = typeof item === 'object' && item !== null ? item.value : item;
                  const prov = typeof item === 'object' && item !== null ? item.provenance : null;

                  return (
                    <div
                      key={key}
                      className="p-2.5 rounded-[6px] bg-[#161616] border border-[#242424] flex flex-col gap-1 font-mono text-[12px]"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[#FF6A1A] font-medium">{key}</span>
                        {prov && (
                          <span className="text-[10px] text-[#5E5E5E] bg-[#111111] px-1.5 py-0.5 rounded border border-[#242424]">
                            {prov}
                          </span>
                        )}
                      </div>
                      <div className="text-[#EDEDED] font-semibold break-all">
                        {String(val)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
