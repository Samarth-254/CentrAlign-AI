'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { EVENT_TYPES } from '@centralign/shared';

const AGENT_SERVER_URL = process.env.NEXT_PUBLIC_AGENT_SERVER_URL || 'http://localhost:4000';

const EXAMPLE_TASKS = [
  {
    id: 't1',
    label: 'T1: Hero Task (Northwind Invoice)',
    goal: 'Find the latest invoice from Northwind Traders, extract the amount and due date, enter it into AcmeBooks, and tell me once it is done.',
  },
  {
    id: 't2',
    label: 'T2: Generalization (Mark as Paid)',
    goal: 'Mark the bill for Globex Logistics invoice GLX-890 as paid in AcmeBooks.',
  },
  {
    id: 't3',
    label: 'T3: Read-Only Reporting',
    goal: 'Which vendors have invoices in Issued status with a due date earlier than 2026-12-01? List them with totals.',
  },
  {
    id: 't4',
    label: 'T4: Ambiguity Resolution',
    goal: 'Enter the latest Initech Software invoice into AcmeBooks.',
  },
  {
    id: 't5',
    label: 'T5: Duplicate Detection',
    goal: 'Enter the latest Globex Logistics invoice into AcmeBooks.',
  },
  {
    id: 't7',
    label: 'T7: Chaos Recovery Test',
    goal: 'Find the latest invoice from Northwind Traders, extract the amount and due date, enter it into AcmeBooks, and tell me once it is done.',
  },
];

export default function AgentConsolePage() {
  // Input state
  const [goal, setGoal] = useState(EXAMPLE_TASKS[0].goal);
  const [autoApprove, setAutoApprove] = useState(false);
  const [isChaosEnabled, setIsChaosEnabled] = useState(false);

  // Execution state
  const [activeRunId, setActiveRunId] = useState(null);
  const [runStatus, setRunStatus] = useState('idle'); // idle | running | awaiting_human | completed | failed | aborted
  const [events, setEvents] = useState([]);
  const [activeTab, setActiveTab] = useState('timeline'); // timeline | plan | memory | verification | report
  const [selectedScreenshot, setSelectedScreenshot] = useState(null);

  // Structured side-panel state extracted from events
  const [understanding, setUnderstanding] = useState(null);
  const [plan, setPlan] = useState([]);
  const [memory, setMemory] = useState({});
  const [verification, setVerification] = useState(null);
  const [finalReport, setFinalReport] = useState(null);

  // Human-in-the-loop state
  const [pendingApproval, setPendingApproval] = useState(null);
  const [pendingQuestion, setPendingQuestion] = useState(null);
  const [answerInput, setAnswerInput] = useState('');
  const [editableValues, setEditableValues] = useState({});

  // History & Status
  const [pastRuns, setPastRuns] = useState([]);
  const [isResetting, setIsResetting] = useState(false);
  const [notification, setNotification] = useState(null);

  const eventSourceRef = useRef(null);
  const timelineEndRef = useRef(null);

  // Auto-scroll timeline to bottom on new event
  useEffect(() => {
    timelineEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events]);

  // Load chaos status and past runs on mount
  useEffect(() => {
    fetchChaosStatus();
    loadPastRuns();
  }, []);

  async function fetchChaosStatus() {
    try {
      const res = await fetch('/api/chaos');
      if (res.ok) {
        const data = await res.json();
        setIsChaosEnabled(!!data.chaosEnabled);
      }
    } catch {
      // ignore
    }
  }

  async function toggleChaos() {
    try {
      const res = await fetch('/api/chaos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !isChaosEnabled }),
      });
      if (res.ok) {
        const data = await res.json();
        setIsChaosEnabled(data.chaosEnabled);
        showNotice(`Chaos mode ${data.chaosEnabled ? 'ENABLED (transient 500s)' : 'DISABLED'}`);
      }
    } catch (err) {
      showNotice('Failed to toggle chaos mode', 'error');
    }
  }

  async function resetDemoData() {
    setIsResetting(true);
    try {
      const res = await fetch('/api/reset', { method: 'POST' });
      if (res.ok) {
        showNotice('Database and invoice PDFs reset to clean deterministic state.');
        loadPastRuns();
      }
    } catch {
      showNotice('Failed to reset sandbox environment', 'error');
    } finally {
      setIsResetting(false);
    }
  }

  async function loadPastRuns() {
    try {
      const res = await fetch(`${AGENT_SERVER_URL}/runs`);
      if (res.ok) {
        const data = await res.json();
        setPastRuns(data.runs || []);
      }
    } catch {
      // server may not be up yet
    }
  }

  function showNotice(msg, type = 'info') {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  }

  // Start new task execution
  async function handleStartRun() {
    if (!goal.trim()) return;

    // Reset local run state
    setEvents([]);
    setUnderstanding(null);
    setPlan([]);
    setMemory({});
    setVerification(null);
    setFinalReport(null);
    setPendingApproval(null);
    setPendingQuestion(null);
    setRunStatus('running');

    try {
      const res = await fetch(`${AGENT_SERVER_URL}/runs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal,
          autoApprove,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to start run');
      }

      const data = await res.json();
      setActiveRunId(data.runId);
      connectSseStream(data.runId);
    } catch (err) {
      setRunStatus('failed');
      showNotice(err.message, 'error');
    }
  }

  // Connect to SSE event stream
  function connectSseStream(runId) {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const sse = new EventSource(`${AGENT_SERVER_URL}/runs/${runId}/events`);
    eventSourceRef.current = sse;

    sse.onmessage = (message) => {
      try {
        const event = JSON.parse(message.data);
        if (event.type === 'stream.ended') {
          sse.close();
          loadPastRuns();
          return;
        }

        setEvents((prev) => [...prev, event]);
        processLiveEvent(event);
      } catch (err) {
        console.error('Failed to parse SSE event:', err);
      }
    };

    sse.onerror = () => {
      // SSE connection closed or server error
      sse.close();
    };
  }

  // Process event to update side panels and modals
  function processLiveEvent(event) {
    const { type, data } = event;

    switch (type) {
      case EVENT_TYPES.UNDERSTANDING_PRODUCED:
        setUnderstanding(data);
        break;

      case EVENT_TYPES.PLAN_CREATED:
        setPlan(data.steps || []);
        break;

      case EVENT_TYPES.PLAN_STEP_UPDATED:
        setPlan((prev) =>
          prev.map((step) =>
            step.id === data.stepId ? { ...step, status: data.status } : step
          )
        );
        break;

      case EVENT_TYPES.MEMORY_UPDATED:
        setMemory((prev) => ({
          ...prev,
          [data.key]: { value: data.value, provenance: data.provenance },
        }));
        break;

      case EVENT_TYPES.TOOL_FINISHED:
        if (data.tool === 'pdf_extract_fields' && data.result?.fields) {
          setMemory((prev) => {
            const next = { ...prev };
            for (const [k, v] of Object.entries(data.result.fields)) {
              next[k] = { value: v.value, provenance: 'PDF Extraction' };
            }
            return next;
          });
        }
        break;

      case EVENT_TYPES.APPROVAL_REQUESTED:
        setRunStatus('awaiting_human');
        setPendingApproval(data.payload);
        setEditableValues(data.payload?.values || {});
        break;

      case EVENT_TYPES.QUESTION_REQUESTED:
        setRunStatus('awaiting_human');
        setPendingQuestion(data);
        break;

      case EVENT_TYPES.VERIFICATION_STARTED:
        setVerification({ checks: [], overall: null, summary: 'Audit in progress...' });
        break;

      case EVENT_TYPES.VERIFICATION_CHECK:
        setVerification((prev) => ({
          ...prev,
          checks: [...(prev?.checks || []), data],
        }));
        break;

      case EVENT_TYPES.VERIFICATION_COMPLETED:
        setVerification((prev) => ({
          ...prev,
          overall: data.overall,
          summary: data.summary,
        }));
        break;

      case EVENT_TYPES.RUN_COMPLETED:
        setRunStatus('completed');
        setFinalReport(data.report || { status: 'completed', summary: data.summary });
        setPendingApproval(null);
        setPendingQuestion(null);
        break;

      case EVENT_TYPES.RUN_FAILED:
        setRunStatus('failed');
        setFinalReport({ status: 'failed', summary: data.error });
        setPendingApproval(null);
        setPendingQuestion(null);
        break;

      case EVENT_TYPES.RUN_ABORTED:
        setRunStatus('aborted');
        break;

      default:
        break;
    }
  }

  // Resume paused run with operator approval
  async function handleApprovalResponse(approved) {
    if (!activeRunId) return;
    try {
      await fetch(`${AGENT_SERVER_URL}/runs/${activeRunId}/resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'approval',
          payload: {
            approved,
            editedValues: approved ? editableValues : undefined,
          },
        }),
      });
      setPendingApproval(null);
      setRunStatus('running');
    } catch (err) {
      showNotice(err.message, 'error');
    }
  }

  // Resume paused run with operator answer
  async function handleQuestionResponse() {
    if (!activeRunId || !answerInput.trim()) return;
    try {
      await fetch(`${AGENT_SERVER_URL}/runs/${activeRunId}/resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'answer',
          payload: { answer: answerInput.trim() },
        }),
      });
      setPendingQuestion(null);
      setAnswerInput('');
      setRunStatus('running');
    } catch (err) {
      showNotice(err.message, 'error');
    }
  }

  // Abort execution
  async function handleAbort() {
    if (!activeRunId) return;
    try {
      await fetch(`${AGENT_SERVER_URL}/runs/${activeRunId}/abort`, { method: 'POST' });
      setRunStatus('aborted');
      showNotice('Task worker aborted.');
    } catch (err) {
      showNotice(err.message, 'error');
    }
  }

  // Inspect past run
  async function inspectPastRun(runId) {
    try {
      const res = await fetch(`${AGENT_SERVER_URL}/runs/${runId}`);
      if (res.ok) {
        const data = await res.json();
        setActiveRunId(runId);
        setRunStatus(data.status);
        setEvents(data.events || []);

        // Rehydrate side panels from historical events
        let loadedUnderstanding = null;
        let loadedPlan = [];
        const loadedMemory = {};
        let loadedVerification = null;

        for (const evt of data.events || []) {
          if (evt.type === EVENT_TYPES.UNDERSTANDING_PRODUCED) loadedUnderstanding = evt.data;
          if (evt.type === EVENT_TYPES.PLAN_CREATED) loadedPlan = evt.data.steps || [];
          if (evt.type === EVENT_TYPES.VERIFICATION_COMPLETED) {
            loadedVerification = {
              overall: evt.data.overall,
              summary: evt.data.summary,
              checks: data.events
                .filter((e) => e.type === EVENT_TYPES.VERIFICATION_CHECK)
                .map((e) => e.data),
            };
          }
        }

        setUnderstanding(loadedUnderstanding);
        setPlan(loadedPlan);
        setMemory(loadedMemory);
        setVerification(loadedVerification);
        setFinalReport(data.finalReport);
      }
    } catch {
      showNotice('Failed to load past run details', 'error');
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/90 px-6 py-3.5 flex items-center justify-between sticky top-0 z-20 backdrop-blur">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-white shadow-md shadow-emerald-900/30">
            CA
          </div>
          <div>
            <h1 className="font-semibold text-base text-white flex items-center space-x-2">
              <span>CentrAlign Task Worker Console</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-400">
                v1.0 Autonomous
              </span>
            </h1>
            <p className="text-xs text-slate-400">Autonomous Enterprise Computer-Use Agent</p>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex items-center space-x-4">
          {/* Quick links to simulated company app */}
          <div className="hidden md:flex items-center space-x-2 border-r border-slate-800 pr-4">
            <Link
              href="/portal/vendors"
              target="_blank"
              className="text-xs text-slate-300 hover:text-white px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              Vendor Portal ↗
            </Link>
            <Link
              href="/erp/bills"
              target="_blank"
              className="text-xs text-slate-300 hover:text-white px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              AcmeBooks ERP ↗
            </Link>
          </div>

          {/* Chaos Toggle */}
          <button
            onClick={toggleChaos}
            className={`text-xs px-3 py-1.5 rounded-lg border font-medium flex items-center space-x-1.5 transition-all ${
              isChaosEnabled
                ? 'bg-amber-950/80 border-amber-600 text-amber-200 shadow-md shadow-amber-950'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
            }`}
            title="Toggle transient 500 error on bill submission"
          >
            <span>⚡ Chaos: {isChaosEnabled ? 'ON (500s)' : 'OFF'}</span>
          </button>

          {/* Reset Demo Data Button */}
          <button
            onClick={resetDemoData}
            disabled={isResetting || runStatus === 'running'}
            className="text-xs px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors disabled:opacity-50 flex items-center space-x-1.5"
          >
            <span>🔄 {isResetting ? 'Resetting...' : 'Reset Demo Data'}</span>
          </button>
        </div>
      </header>

      {/* Global Notification Banner */}
      {notification && (
        <div
          className={`px-6 py-2 text-xs font-medium flex items-center justify-between transition-all ${
            notification.type === 'error'
              ? 'bg-rose-950 border-b border-rose-800 text-rose-200'
              : 'bg-sky-950 border-b border-sky-800 text-sky-200'
          }`}
        >
          <span>{notification.msg}</span>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-white">
            &times;
          </button>
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Side: Task Config & Execution Timeline */}
        <div className="flex-1 flex flex-col border-r border-slate-800 overflow-hidden">
          {/* Task Input Section */}
          <div className="p-6 border-b border-slate-800 bg-slate-900/40">
            <label htmlFor="task-goal-input" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Natural Language Task Goal
            </label>
            <div className="flex space-x-3">
              <input
                id="task-goal-input"
                type="text"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                disabled={runStatus === 'running'}
                placeholder="Instruct the AI worker e.g. 'Find latest invoice from Northwind Traders and record in AcmeBooks'..."
                className="flex-1 px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-950 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm shadow-inner"
              />

              {runStatus === 'running' ? (
                <button
                  onClick={handleAbort}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-medium rounded-lg text-sm transition-colors shadow-md shadow-rose-900/30 flex items-center space-x-1.5"
                >
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  <span>Abort</span>
                </button>
              ) : (
                <button
                  onClick={handleStartRun}
                  disabled={!goal.trim()}
                  id="start-worker-button"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg text-sm transition-all shadow-md shadow-emerald-900/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <span>Start Task Worker</span>
                  <span>&rarr;</span>
                </button>
              )}
            </div>

            {/* Example Task Chips & Auto-Approve Checkbox */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">Examples:</span>
                {EXAMPLE_TASKS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setGoal(t.goal)}
                    disabled={runStatus === 'running'}
                    className={`text-xs px-2.5 py-1 rounded-md border transition-all ${
                      goal === t.goal
                        ? 'bg-slate-800 border-emerald-500/80 text-emerald-300 font-medium'
                        : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoApprove}
                  onChange={(e) => setAutoApprove(e.target.checked)}
                  disabled={runStatus === 'running'}
                  className="rounded border-slate-700 bg-slate-900 text-emerald-600 focus:ring-emerald-500"
                />
                <span>Auto-approve write mutations</span>
              </label>
            </div>
          </div>

          {/* Timeline View Header */}
          <div className="px-6 py-3 border-b border-slate-800/80 bg-slate-950/60 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Live Execution Timeline
              </h2>
              {activeRunId && (
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {activeRunId}
                </span>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <span className={`w-2 h-2 rounded-full ${
                runStatus === 'running' ? 'bg-amber-400 animate-ping' :
                runStatus === 'completed' ? 'bg-emerald-400' :
                runStatus === 'failed' ? 'bg-rose-400' :
                runStatus === 'awaiting_human' ? 'bg-blue-400 animate-bounce' : 'bg-slate-500'
              }`} />
              <span className="text-xs font-medium uppercase tracking-wider capitalize text-slate-300">
                {runStatus.replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* Timeline Scroll Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {events.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500">
                <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-xl mb-3">
                  ⚡
                </div>
                <h3 className="font-semibold text-slate-300 mb-1">Worker Standby</h3>
                <p className="text-xs max-w-sm text-slate-400">
                  Select an example task above or enter your instructions to watch the autonomous AI worker execute computer actions in real time.
                </p>
              </div>
            ) : (
              events.map((evt, idx) => (
                <TimelineStepCard
                  key={idx}
                  event={evt}
                  onSelectScreenshot={setSelectedScreenshot}
                />
              ))
            )}
            <div ref={timelineEndRef} />
          </div>
        </div>

        {/* Right Side: State Inspector Panels */}
        <div className="w-full lg:w-96 xl:w-[440px] bg-slate-900/30 flex flex-col overflow-hidden">
          {/* Panel Tab Navigation */}
          <div className="flex border-b border-slate-800 bg-slate-900/60 p-1">
            {[
              { id: 'timeline', label: 'Plan & Goals' },
              { id: 'memory', label: 'Memory' },
              { id: 'verification', label: 'Audit' },
              { id: 'report', label: 'Report' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-2 text-xs font-medium rounded-md transition-colors ${
                  activeTab === tab.id
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content Panels */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {activeTab === 'timeline' && (
              <>
                {/* Understanding Panel */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
                    <span>Understanding & Objective</span>
                    {understanding?.riskLevel && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 font-mono text-amber-400">
                        Risk: {understanding.riskLevel}
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-200 font-medium leading-relaxed">
                    {understanding?.objective || 'Formulating objective...'}
                  </p>

                  {/* Success Criteria */}
                  <div className="mt-3 pt-3 border-t border-slate-800">
                    <span className="text-[11px] font-semibold text-slate-400 block mb-2">
                      Success Criteria:
                    </span>
                    <ul className="space-y-1.5">
                      {(understanding?.successCriteria || []).map((sc, i) => (
                        <li key={i} className="text-xs text-slate-300 flex items-start space-x-2">
                          <span className="text-emerald-400 font-bold">&bull;</span>
                          <span>{sc}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Living Plan Panel */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                    Living Plan ({plan.length} Steps)
                  </h3>
                  <div className="space-y-2">
                    {plan.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">No plan formulated yet.</p>
                    ) : (
                      plan.map((s) => (
                        <div
                          key={s.id}
                          className={`p-2.5 rounded-lg border text-xs flex items-center justify-between transition-all ${
                            s.status === 'done'
                              ? 'bg-emerald-950/30 border-emerald-800/60 text-slate-200'
                              : s.status === 'in_progress'
                              ? 'bg-amber-950/30 border-amber-800/80 text-white font-medium shadow-sm'
                              : s.status === 'failed'
                              ? 'bg-rose-950/40 border-rose-800 text-rose-200'
                              : 'bg-slate-950 border-slate-800 text-slate-400'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5">
                            <span className={`w-2 h-2 rounded-full ${
                              s.status === 'done' ? 'bg-emerald-400' :
                              s.status === 'in_progress' ? 'bg-amber-400 animate-pulse' :
                              s.status === 'failed' ? 'bg-rose-400' : 'bg-slate-600'
                            }`} />
                            <span>{s.description}</span>
                          </div>
                          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-400">
                            {s.status}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}

            {activeTab === 'memory' && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                  Working Key-Value Memory
                </h3>
                {Object.keys(memory).length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No structured memory extracted yet.</p>
                ) : (
                  <div className="space-y-2.5">
                    {Object.entries(memory).map(([k, item]) => {
                      const val = item?.value !== undefined ? item.value : item;
                      const prov = item?.provenance || 'Agent Execution';
                      return (
                        <div key={k} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-mono text-sky-400">{k}</span>
                            <span className="text-[10px] text-slate-500 font-mono">{prov}</span>
                          </div>
                          <div className="text-xs text-slate-200 font-medium break-all">
                            {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'verification' && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
                  <span>Independent Auditor Audit</span>
                  {verification?.overall !== null && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase font-mono ${
                      verification?.overall ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'
                    }`}>
                      {verification?.overall ? '✓ Passed' : '✗ Failed'}
                    </span>
                  )}
                </h3>

                {verification ? (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-300 font-medium leading-relaxed bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                      {verification.summary}
                    </p>

                    <div className="space-y-2 mt-3">
                      {(verification.checks || []).map((chk, i) => (
                        <div
                          key={i}
                          className={`p-3 rounded-lg border text-xs ${
                            chk.passed
                              ? 'bg-emerald-950/20 border-emerald-900/50 text-slate-200'
                              : 'bg-rose-950/30 border-rose-900/60 text-rose-200'
                          }`}
                        >
                          <div className="flex items-center space-x-2 font-medium">
                            <span>{chk.passed ? '✓' : '✗'}</span>
                            <span>{chk.criterion}</span>
                          </div>
                          {chk.evidence && (
                            <p className="mt-1 text-[11px] text-slate-400 pl-4 border-l-2 border-slate-700 ml-1">
                              Evidence: {chk.evidence}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">Independent verification begins after task completion claim.</p>
                )}
              </div>
            )}

            {activeTab === 'report' && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                  Final Task Report
                </h3>
                {finalReport ? (
                  <div className="space-y-4 text-xs">
                    <div className={`p-3 rounded-lg border font-medium ${
                      finalReport.status === 'completed'
                        ? 'bg-emerald-950/50 border-emerald-700 text-emerald-200'
                        : 'bg-rose-950/50 border-rose-700 text-rose-200'
                    }`}>
                      Status: {finalReport.status?.toUpperCase()}
                    </div>

                    <div>
                      <h4 className="font-semibold text-slate-400 mb-1">Executive Summary:</h4>
                      <p className="text-slate-200 leading-relaxed bg-slate-950 p-3 rounded-lg border border-slate-800">
                        {finalReport.summary}
                      </p>
                    </div>

                    {activeRunId && (
                      <div className="pt-3 border-t border-slate-800 flex space-x-2">
                        <a
                          href={`${AGENT_SERVER_URL}/runs/${activeRunId}/report.html`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 py-2 px-3 text-center rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors"
                        >
                          Download HTML Report
                        </a>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">Report generated upon task completion.</p>
                )}
              </div>
            )}

            {/* Run History List */}
            <div className="pt-6 border-t border-slate-800">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                Saved Run History
              </h4>
              <div className="space-y-1.5">
                {pastRuns.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No past runs stored.</p>
                ) : (
                  pastRuns.slice(0, 8).map((r) => (
                    <button
                      key={r.runId}
                      onClick={() => inspectPastRun(r.runId)}
                      className={`w-full text-left p-2 rounded-lg text-xs flex items-center justify-between border transition-all ${
                        activeRunId === r.runId
                          ? 'bg-slate-800 border-slate-600 text-white font-medium'
                          : 'bg-slate-950 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <span className="truncate max-w-[200px]">{r.runId}</span>
                      <span className={`text-[10px] uppercase font-mono px-1.5 py-0.5 rounded ${
                        r.status === 'completed' ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
                      }`}>
                        {r.status}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Human Approval Interrupt Modal */}
      {pendingApproval && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-600/80 rounded-2xl max-w-lg w-full p-6 shadow-2xl shadow-amber-950/50">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold text-lg">
                ⚠️
              </div>
              <div>
                <h3 className="font-semibold text-lg text-white">Human Approval Required</h3>
                <p className="text-xs text-slate-400">Irreversible write operation proposed by task worker.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 mb-4 text-xs space-y-2">
              <div>
                <span className="text-slate-400 font-semibold">Action: </span>
                <span className="text-white font-mono">{pendingApproval.action}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold">Rationale: </span>
                <span className="text-slate-200">{pendingApproval.rationale || 'Mutating company records in internal ERP.'}</span>
              </div>
            </div>

            {/* Editable Form Values */}
            <div className="mb-6 space-y-3">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Proposed Mutation Values (Review or Edit):
              </label>
              {Object.entries(editableValues).map(([key, val]) => (
                <div key={key} className="flex items-center space-x-3 text-xs">
                  <span className="w-28 text-slate-400 font-mono truncate">{key}:</span>
                  <input
                    type="text"
                    value={val}
                    onChange={(e) =>
                      setEditableValues((prev) => ({ ...prev, [key]: e.target.value }))
                    }
                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-950 text-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              ))}
            </div>

            {/* Modal Action Buttons */}
            <div className="flex space-x-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => handleApprovalResponse(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 font-medium text-sm transition-colors"
              >
                Reject Action
              </button>
              <button
                onClick={() => handleApprovalResponse(true)}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-colors shadow-md shadow-emerald-950"
              >
                Approve & Execute
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Human Clarification Dialog Modal */}
      {pendingQuestion && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-sky-600/80 rounded-2xl max-w-lg w-full p-6 shadow-2xl shadow-sky-950/50">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400 font-bold text-lg">
                💬
              </div>
              <div>
                <h3 className="font-semibold text-lg text-white">Clarification Requested</h3>
                <p className="text-xs text-slate-400">The agent needs operator input to resolve ambiguity.</p>
              </div>
            </div>

            <p className="text-sm text-slate-100 p-4 rounded-xl bg-slate-950 border border-slate-800 mb-4 font-medium leading-relaxed">
              {pendingQuestion.question}
            </p>

            {pendingQuestion.options && (
              <div className="mb-4 flex flex-wrap gap-2">
                {pendingQuestion.options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => setAnswerInput(opt)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}

            <div className="mb-6">
              <input
                type="text"
                value={answerInput}
                onChange={(e) => setAnswerInput(e.target.value)}
                placeholder="Type your response for the agent..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={handleQuestionResponse}
                disabled={!answerInput.trim()}
                className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-medium text-sm transition-colors shadow-md disabled:opacity-50"
              >
                Send Answer & Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Screenshot Lightbox Modal */}
      {selectedScreenshot && (
        <div
          onClick={() => setSelectedScreenshot(null)}
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6 cursor-zoom-out"
        >
          <div className="max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-3 border-b border-slate-800 flex justify-between items-center text-xs text-slate-400">
              <span className="font-mono">Screenshot Evidence</span>
              <span>Click anywhere to close</span>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedScreenshot}
              alt="Step Evidence"
              className="max-h-[80vh] w-auto object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Individual Timeline Step Card
 */
function TimelineStepCard({ event, onSelectScreenshot }) {
  const { type, data, timestamp } = event;
  const time = new Date(timestamp).toLocaleTimeString();

  if (type === EVENT_TYPES.ACTION_PROPOSED) {
    return (
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm transition-all hover:border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-bold font-mono">
              ⚡
            </span>
            <span className="text-xs font-mono font-semibold text-white">{data.tool}</span>
          </div>
          <span className="text-[11px] font-mono text-slate-500">{time}</span>
        </div>

        {data.rationale && (
          <p className="text-xs text-slate-300 mb-2.5 leading-relaxed bg-slate-950/80 p-2.5 rounded-lg border border-slate-800/80">
            <span className="text-slate-400 font-semibold">Model Rationale: </span>
            {data.rationale}
          </p>
        )}

        {data.args && Object.keys(data.args).length > 0 && (
          <div className="text-[11px] font-mono text-slate-400 bg-slate-950 p-2 rounded border border-slate-800 break-all">
            {JSON.stringify(data.args)}
          </div>
        )}
      </div>
    );
  }

  if (type === EVENT_TYPES.TOOL_FINISHED) {
    const screenshotUrl = data.result?.screenshotPath
      ? `${AGENT_SERVER_URL}/runs/${event.runId}/screenshots/${data.result.screenshotPath.split(/[\\/]/).pop()}`
      : null;

    return (
      <div className={`p-3.5 rounded-xl border text-xs ${
        data.ok
          ? 'bg-emerald-950/15 border-emerald-900/40 text-slate-300'
          : 'bg-rose-950/20 border-rose-900/60 text-rose-200'
      }`}>
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center space-x-2">
            <span className={data.ok ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
              {data.ok ? '✓' : '✗'}
            </span>
            <span className="font-semibold text-white font-mono">{data.tool} Finished</span>
          </div>
          <span className="text-[11px] font-mono text-slate-500">{data.durationMs}ms</span>
        </div>

        {data.error && (
          <p className="text-xs text-rose-300 mt-1 font-mono">{data.error}</p>
        )}

        {screenshotUrl && (
          <div className="mt-2.5">
            <button
              onClick={() => onSelectScreenshot(screenshotUrl)}
              className="group relative inline-block rounded-lg overflow-hidden border border-slate-700 hover:border-emerald-500 transition-colors"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={screenshotUrl}
                alt="Page state thumbnail"
                className="w-36 h-20 object-cover object-top opacity-80 group-hover:opacity-100 transition-opacity"
              />
              <span className="absolute bottom-1 right-1 text-[9px] bg-slate-900/90 text-slate-300 px-1.5 py-0.5 rounded">
                Click to expand 🔍
              </span>
            </button>
          </div>
        )}
      </div>
    );
  }

  if (type === EVENT_TYPES.APPROVAL_REQUESTED) {
    return (
      <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-700/80 shadow-md flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-lg">🛑</span>
          <div>
            <span className="text-xs font-semibold text-amber-200 block">Operator Approval Required</span>
            <span className="text-xs text-slate-300">Action: {data.payload?.action}</span>
          </div>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-md bg-amber-500 text-slate-950 font-bold animate-pulse">
          Paused on Interrupt
        </span>
      </div>
    );
  }

  if (type === EVENT_TYPES.VERIFICATION_CHECK) {
    return (
      <div className="p-3 rounded-lg bg-blue-950/20 border border-blue-900/40 text-xs flex items-start space-x-2.5">
        <span className={data.passed ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
          {data.passed ? '✓' : '✗'}
        </span>
        <div>
          <span className="font-medium text-slate-200 block">{data.criterion}</span>
          {data.evidence && (
            <span className="text-[11px] text-slate-400 block mt-0.5">{data.evidence}</span>
          )}
        </div>
      </div>
    );
  }

  return null;
}
