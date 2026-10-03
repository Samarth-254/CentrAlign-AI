'use client';

import { useState, useEffect, useCallback } from 'react';

const AGENT_SERVER_URL = process.env.NEXT_PUBLIC_AGENT_SERVER_URL || 'http://localhost:4000';

export function useRuns() {
  const [pastRuns, setPastRuns] = useState([]);
  const [isChaosEnabled, setIsChaosEnabled] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const loadPastRuns = useCallback(async () => {
    try {
      const res = await fetch(`${AGENT_SERVER_URL}/runs`);
      if (res.ok) {
        const data = await res.json();
        setPastRuns(data.runs || []);
      }
    } catch {
      // server may be offline
    }
  }, []);

  const fetchChaosStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/chaos');
      if (res.ok) {
        const data = await res.json();
        setIsChaosEnabled(!!data.chaosEnabled);
      }
    } catch {
      // ignore
    }
  }, []);

  const toggleChaos = useCallback(async () => {
    try {
      const res = await fetch('/api/chaos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !isChaosEnabled }),
      });
      if (res.ok) {
        const data = await res.json();
        setIsChaosEnabled(data.chaosEnabled);
        showToast(
          data.chaosEnabled ? 'Chaos mode enabled (transient 500s)' : 'Chaos mode disabled',
          data.chaosEnabled ? 'warning' : 'info'
        );
      }
    } catch {
      showToast('Failed to toggle chaos mode', 'error');
    }
  }, [isChaosEnabled, showToast]);

  const resetDemoData = useCallback(async () => {
    setIsResetting(true);
    try {
      const res = await fetch('/api/reset', { method: 'POST' });
      if (res.ok) {
        showToast('Sandbox database and seeded PDFs reset to clean state', 'success');
        loadPastRuns();
      }
    } catch {
      showToast('Failed to reset sandbox environment', 'error');
    } finally {
      setIsResetting(false);
    }
  }, [loadPastRuns, showToast]);

  useEffect(() => {
    fetchChaosStatus();
    loadPastRuns();
  }, [fetchChaosStatus, loadPastRuns]);

  return {
    pastRuns,
    loadPastRuns,
    isChaosEnabled,
    toggleChaos,
    isResetting,
    resetDemoData,
    toast,
    setToast,
    showToast,
  };
}
