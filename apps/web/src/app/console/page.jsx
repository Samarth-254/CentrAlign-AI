'use client';

import { useState } from 'react';
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
  const [autoApprove, setAutoApprove] = useState(false);
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
  } = useRunStream(loadPastRuns);

  const handleStartRun = async () => {
    try {
      await startRun(goal, autoApprove);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleSelectRun = async (runId) => {
    try {
      await loadPastRunDetails(runId);
      setMobileRailOpen(false);
    } catch (err) {
      showToast(err.message, 'error');
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
        isChaosEnabled={isChaosEnabled}
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
          onNewTask={resetActiveRun}
          isOpen={mobileRailOpen}
          onCloseMobile={() => setMobileRailOpen(false)}
        />

        {/* Center Main Stage (Flex) */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#0A0A0A] overflow-hidden">
          {/* Task Composer */}
          <Composer
            goal={goal}
            setGoal={setGoal}
            autoApprove={autoApprove}
            setAutoApprove={setAutoApprove}
            onRun={handleStartRun}
            isRunning={runStatus === 'running' || runStatus === 'awaiting_human'}
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
