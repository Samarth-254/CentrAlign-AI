'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { EVENT_TYPES } from '@centralign/shared';

const AGENT_SERVER_URL = process.env.NEXT_PUBLIC_AGENT_SERVER_URL || 'http://localhost:4000';

export function useRunStream(onStreamEnded) {
  const [activeRunId, setActiveRunId] = useState(null);
  const [runStatus, setRunStatus] = useState('idle'); // idle | running | awaiting_human | completed | failed | aborted
  const [events, setEvents] = useState([]);
  const [understanding, setUnderstanding] = useState(null);
  const [plan, setPlan] = useState([]);
  const [memory, setMemory] = useState({});
  const [verification, setVerification] = useState(null);
  const [finalReport, setFinalReport] = useState(null);
  const [pendingApproval, setPendingApproval] = useState(null);
  const [pendingQuestion, setPendingQuestion] = useState(null);
  const [activeNode, setActiveNode] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const eventSourceRef = useRef(null);
  const timerRef = useRef(null);

  // Run timer
  useEffect(() => {
    if (runStatus === 'running' || runStatus === 'awaiting_human') {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [runStatus]);

  const processLiveEvent = useCallback((event) => {
    const { type, data } = event;

    switch (type) {
      case EVENT_TYPES.NODE_ENTERED:
        setActiveNode(data.node);
        break;

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
        break;

      case EVENT_TYPES.QUESTION_REQUESTED:
        setRunStatus('awaiting_human');
        setPendingQuestion(data);
        break;

      case EVENT_TYPES.VERIFICATION_STARTED:
        setVerification({ checks: [], overall: null, summary: 'Auditing in progress...' });
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
        setActiveNode('complete');
        setFinalReport(data.report || { status: 'completed', summary: data.summary });
        setPendingApproval(null);
        setPendingQuestion(null);
        break;

      case EVENT_TYPES.RUN_FAILED:
        setRunStatus('failed');
        setActiveNode('complete');
        setFinalReport({ status: 'failed', summary: data.error });
        setPendingApproval(null);
        setPendingQuestion(null);
        break;

      case EVENT_TYPES.RUN_ABORTED:
        setRunStatus('aborted');
        setActiveNode('complete');
        setPendingApproval(null);
        setPendingQuestion(null);
        break;

      default:
        break;
    }
  }, []);

  const connectSse = useCallback(
    (runId) => {
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
            if (onStreamEnded) onStreamEnded(runId);
            return;
          }
          setEvents((prev) => [...prev, event]);
          processLiveEvent(event);
        } catch (err) {
          console.error('Failed to parse SSE event:', err);
        }
      };

      sse.onerror = () => {
        sse.close();
      };
    },
    [onStreamEnded, processLiveEvent]
  );

  const startRun = useCallback(
    async (goal, autoApprove) => {
      setEvents([]);
      setUnderstanding(null);
      setPlan([]);
      setMemory({});
      setVerification(null);
      setFinalReport(null);
      setPendingApproval(null);
      setPendingQuestion(null);
      setRunStatus('running');
      setActiveNode('understand');
      setElapsedSeconds(0);

      const res = await fetch(`${AGENT_SERVER_URL}/runs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal, autoApprove }),
      });

      if (!res.ok) {
        const err = await res.json();
        setRunStatus('failed');
        throw new Error(err.error || 'Failed to start run');
      }

      const data = await res.json();
      setActiveRunId(data.runId);
      connectSse(data.runId);
      return data.runId;
    },
    [connectSse]
  );

  const respondToApproval = useCallback(
    async (approved, editedValues) => {
      if (!activeRunId) return;
      await fetch(`${AGENT_SERVER_URL}/runs/${activeRunId}/resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'approval',
          payload: { approved, editedValues: approved ? editedValues : undefined },
        }),
      });
      setPendingApproval(null);
      setRunStatus('running');
    },
    [activeRunId]
  );

  const respondToQuestion = useCallback(
    async (answer) => {
      if (!activeRunId) return;
      await fetch(`${AGENT_SERVER_URL}/runs/${activeRunId}/resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'answer',
          payload: { answer },
        }),
      });
      setPendingQuestion(null);
      setRunStatus('running');
    },
    [activeRunId]
  );

  const abortRun = useCallback(async () => {
    if (!activeRunId) return;
    await fetch(`${AGENT_SERVER_URL}/runs/${activeRunId}/abort`, { method: 'POST' });
    setRunStatus('aborted');
  }, [activeRunId]);

  const loadPastRunDetails = useCallback(async (runId) => {
    const res = await fetch(`${AGENT_SERVER_URL}/runs/${runId}`);
    if (!res.ok) throw new Error('Failed to load past run details');
    const data = await res.json();

    setActiveRunId(runId);
    setRunStatus(data.status);
    setEvents(data.events || []);

    let loadedUnderstanding = null;
    let loadedPlan = [];
    const loadedMemory = {};
    let loadedVerification = null;

    for (const evt of data.events || []) {
      if (evt.type === EVENT_TYPES.UNDERSTANDING_PRODUCED) loadedUnderstanding = evt.data;
      if (evt.type === EVENT_TYPES.PLAN_CREATED) loadedPlan = evt.data.steps || [];
      if (evt.type === EVENT_TYPES.MEMORY_UPDATED) {
        loadedMemory[evt.data.key] = { value: evt.data.value, provenance: evt.data.provenance };
      }
      if (evt.type === EVENT_TYPES.VERIFICATION_COMPLETED) {
        loadedVerification = {
          overall: evt.data.overall,
          summary: evt.data.summary,
          checks: (data.events || [])
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
  }, []);

  const resetActiveRun = useCallback(() => {
    if (eventSourceRef.current) eventSourceRef.current.close();
    setActiveRunId(null);
    setRunStatus('idle');
    setEvents([]);
    setUnderstanding(null);
    setPlan([]);
    setMemory({});
    setVerification(null);
    setFinalReport(null);
    setPendingApproval(null);
    setPendingQuestion(null);
    setActiveNode(null);
    setElapsedSeconds(0);
  }, []);

  // Compute tool calls count
  const toolCallCount = events.filter((e) => e.type === EVENT_TYPES.TOOL_STARTED).length;

  // Latest observation URL and screenshot
  const latestObservation = [...events]
    .reverse()
    .find((e) => e.type === EVENT_TYPES.OBSERVATION_CAPTURED);
  const currentUrl = latestObservation?.data?.url || 'about:blank';
  const currentScreenshot = latestObservation?.data?.screenshot || null;

  return {
    activeRunId,
    runStatus,
    events,
    understanding,
    plan,
    memory,
    verification,
    finalReport,
    pendingApproval,
    pendingQuestion,
    activeNode,
    elapsedSeconds,
    toolCallCount,
    currentUrl,
    currentScreenshot,
    startRun,
    respondToApproval,
    respondToQuestion,
    abortRun,
    loadPastRunDetails,
    resetActiveRun,
  };
}
