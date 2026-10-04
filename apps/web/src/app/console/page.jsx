'use client';

import { useState, useEffect } from 'react';
import { TopBar } from './components/TopBar.jsx';
import { RunHistory } from './components/RunHistory.jsx';
import { Composer, PRESET_TASKS } from './components/Composer.jsx';
import { PipelineBar } from './components/PipelineBar.jsx';
import { Timeline } from './components/Timeline.jsx';
import { Inspector } from './components/Inspector.jsx';
import { ApprovalModal } from './components/ApprovalModal.jsx';
import { ClarifyModal } from './components/ClarifyModal.jsx';
import { ScreenshotLightbox } from './components/ScreenshotLightbox.jsx';
import { Toast } from '@/components/ui/Toast.jsx';
import { useRuns } from './hooks/useRuns.js';
import { useRunStream } from './hooks/useRunStream.js';

export default function AgentConsolePage() {
  const [goal, setGoal] = useState(PRESET_TASKS[0].goal);
  const [liveAutoApprove, setLiveAutoApprove] = useState(false);
  const [enlargedScreenshot, setEnlargedScreenshot] = useState(null);
  const [mobileRailOpen, setMobileRailOpen] = useState(false);

  const {
    pastRuns,
    loadPastRuns,
    isChaosEnabled,
    toggleChaos,
    isResetting,
    resetDemoData,
    toast,
    setToast,
    showToast,
  } = useRuns();

  const {
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
    activeRunSettings,
    activeRunAutoApprove,
  } = useRunStream(loadPastRuns);

  // Restore live approval preference from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('centralign_approval_pref');
        if (saved !== null) {
          // 'true' means require approval is on, so liveAutoApprove is false
          setLiveAutoApprove(saved === 'false');
        }
      } catch {}
    }
  }, []);

  const handleLiveAutoApproveToggle = (newRequireApproval) => {
    const nextAutoApprove = !newRequireApproval;
    setLiveAutoApprove(nextAutoApprove);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('centralign_approval_pref', newRequireApproval ? 'true' : 'false');
      } catch {}
    }
  };

  const handleSelectRun = async (runId) => {
    try {
      const details = await loadPastRunDetails(runId);
      if (details?.goal) {
        setGoal(details.goal);
      }
      if (typeof window !== 'undefined') {
        window.history.replaceState(null, '', `?runId=${runId}`);
      }
      setMobileRailOpen(false);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Support page reload keeping the selected run
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlRunId = params.get('runId');
      if (urlRunId) {
        handleSelectRun(urlRunId);
      }
    }
  }, []);

  const handleNewTask = () => {
    resetActiveRun();
    setGoal('');
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', window.location.pathname);
    }
  };

  const isLockedToRun = !!activeRunId;
  const isPastRun = isLockedToRun && (runStatus === 'completed' || runStatus === 'failed' || runStatus === 'aborted');
  const isRunning = runStatus === 'running' || runStatus === 'awaiting_human';

  // Determine displayed settings
  let displayedApproval = null; // null means unknown
  if (activeRunSettings?.requireApprovalForWrites !== undefined) {
    displayedApproval = !!activeRunSettings.requireApprovalForWrites;
  } else if (activeRunAutoApprove !== undefined && activeRunAutoApprove !== null) {
    displayedApproval = !activeRunAutoApprove;
  }

  let displayedChaos = null; // null means unknown
  if (activeRunSettings?.chaosMode !== undefined) {
    displayedChaos = !!activeRunSettings.chaosMode;
  }

  const effectiveRequireApproval = isLockedToRun
    ? (displayedApproval !== null ? displayedApproval : false)
    : !liveAutoApprove;

  const effectiveChaos = isLockedToRun
    ? (displayedChaos !== null ? displayedChaos : false)
    : isChaosEnabled;

  const approvalLabel = isLockedToRun
    ? (displayedApproval === null ? 'Approval (Unknown)' : 'Require approval for writes')
    : 'Require approval for writes';

  const chaosLabel = isLockedToRun
    ? (displayedChaos === null ? 'Chaos mode (Unknown)' : 'Chaos mode')
    : 'Chaos mode';

  const settingsSubtitle = isLockedToRun ? 'Settings used for this run' : null;

  const handleStartRun = async () => {
    try {
      await startRun(goal, liveAutoApprove);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleRunAgain = async () => {
    const recordedGoal = goal;
    const recordedApproval = displayedApproval;
    const recordedChaos = displayedChaos;

    resetActiveRun();
    setGoal(recordedGoal);

    if (recordedApproval !== null) {
      handleLiveAutoApproveToggle(recordedApproval);
    }

    if (recordedChaos !== null && recordedChaos !== isChaosEnabled) {
      await toggleChaos();
    }

    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', window.location.pathname);
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-[#0A0A0A] text-[#EDEDED] font-sans select-none">
      {/* 48px Top Navigation Bar */}
      <TopBar
        runStatus={runStatus}
        elapsedSeconds={elapsedSeconds}
        toolCallCount={toolCallCount}
        maxToolCalls={25}
        isChaosEnabled={effectiveChaos}
        chaosDisabled={isLockedToRun}
        chaosLabel={chaosLabel}
        chaosSubtitle={settingsSubtitle}
        onToggleChaos={toggleChaos}
        isResetting={isResetting}
        onResetDemoData={resetDemoData}
      />

      {/* Main 3-Pane Shell */}
      <div className="flex-1 flex min-h-0 relative">
        {/* Left Rail (260px) */}
        <RunHistory
          runs={pastRuns}
          activeRunId={activeRunId}
          onSelectRun={handleSelectRun}
          onNewTask={handleNewTask}
          isOpen={mobileRailOpen}
          onCloseMobile={() => setMobileRailOpen(false)}
        />

        {/* Center Main Stage (Flex) */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#0A0A0A] overflow-hidden">
          {/* Task Composer */}
          <Composer
            goal={goal}
            setGoal={setGoal}
            autoApprove={!effectiveRequireApproval}
            setAutoApprove={(newAutoApprove) => handleLiveAutoApproveToggle(!newAutoApprove)}
            approvalDisabled={isLockedToRun}
            approvalLabel={approvalLabel}
            approvalSubtitle={settingsSubtitle}
            onRun={handleStartRun}
            isRunning={isRunning}
            isPastRun={isPastRun}
            onRunAgain={handleRunAgain}
            onNewTask={handleNewTask}
            onAbort={abortRun}
          />

          {/* Pipeline State Indicator */}
          <PipelineBar
            activeNode={activeNode}
            runStatus={runStatus}
          />

          {/* Execution Timeline with integrated scrollable Report Card */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <Timeline
              events={events}
              isRunning={runStatus === 'running' || runStatus === 'awaiting_human'}
              onOpenScreenshot={setEnlargedScreenshot}
              finalReport={finalReport}
              verification={verification}
              memory={memory}
              toolCallCount={toolCallCount}
              elapsedSeconds={elapsedSeconds}
            />
          </div>
        </main>

        {/* Right Inspector (340px) */}
        <Inspector
          understanding={understanding}
          plan={plan}
          memory={memory}
          verification={verification}
          currentUrl={currentUrl}
          currentScreenshot={currentScreenshot}
          onEnlargeScreenshot={setEnlargedScreenshot}
        />
      </div>

      {/* Human Approval Modal (Policy Gate) */}
      <ApprovalModal
        isOpen={runStatus === 'awaiting_human' && !!pendingApproval}
        payload={pendingApproval}
        onApprove={(editedValues) => respondToApproval(true, editedValues)}
        onReject={() => respondToApproval(false)}
        onOpenScreenshot={setEnlargedScreenshot}
      />

      {/* Ambiguity Clarification Modal (ask_human) */}
      <ClarifyModal
        isOpen={runStatus === 'awaiting_human' && !!pendingQuestion}
        questionData={pendingQuestion}
        onAnswer={respondToQuestion}
      />

      {/* Screenshot Lightbox */}
      <ScreenshotLightbox
        screenshot={enlargedScreenshot}
        onClose={() => setEnlargedScreenshot(null)}
      />

      {/* Floating Toast Notification */}
      <Toast
        message={toast?.message}
        type={toast?.type}
        onClose={() => setToast(null)}
      />
    </div>
  );
}
