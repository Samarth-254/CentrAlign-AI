# Known Limitations and Failure Modes

## 1. Known Architectural Limitations

An honest engineering assessment of the CentrAlign Autonomous Task Worker reveals several specific limitations:

### 1. Web Browser Scope (No Native Desktop OS Control)
- Current State: The agent interacts strictly with browser-based applications (Chromium via Playwright) and local workspace files.
- Limitation: It cannot automate native desktop applications (for example legacy Windows desktop ERPs, Excel desktop, SAP GUI) that require OS-level mouse coordinates, window management, or virtual display drivers.
- Fix: Integrate an OS-level computer-use controller using native accessibility APIs or virtual display mouse and keyboard emulation.

### 2. Single Browser Context per Run
- Current State: Each run creates a dedicated, isolated Chromium context with cookies preserved throughout the session.
- Limitation: The worker does not share cookies or authenticated sessions across concurrent tasks, requiring login on the first task of each run.
- Fix: Implement a session pool with persistent storage of authenticated session cookies and credentials.

### 3. Dependence on Foundation Model Capability
- Current State: The agent relies on Gemini 3.5 Flash Lite for planning and step-by-step tool selection.
- Limitation: Complex multi-page tables can sometimes induce pagination exploration loops if the model forgets which pages it has already checked.
- Fix: Inject structured navigation history into the observation prompt and maintain a visited URLs set in agent state.

### 4. Latency and Token Costs
- Current State: Each ReAct loop step performs an LLM call. A 10-step task requires 10 to 12 LLM inferences.
- Limitation: On free-tier API quotas (15 requests per minute), rapid multi-step runs can hit rate limits requiring exponential backoff.
- Fix: Implement client-side caching of static pages, batch repetitive observations, and transition to tier-1 enterprise API keys.

### 5. In-Memory Checkpointing
- Current State: LangGraph state checkpoints and active runs are held in memory using MemorySaver.
- Limitation: If the agent server process restarts during an active run, in-flight execution state is interrupted.
- Fix: Back the LangGraph checkpointer with a durable database such as PostgreSQL or SQLite.

### 6. Vision Fallback Scope
- Current State: The primary perception modality is DOM accessibility snapshot ref flattening ([e1], [e2]).
- Limitation: Elements rendered entirely inside HTML5 canvas or WebGL without semantic ARIA tags cannot be addressed via ref tags.
- Fix: Add coordinate-based click fallback driven by multi-modal bounding-box detection.

### 7. Multi-Tenant Isolation
- Current State: The sandbox environment uses a local SQLite database (apps/web/data/app.db).
- Limitation: It does not support concurrent multi-tenant isolation, row-level tenant security, or tenant-partitioned data storage.
- Fix: Migrate to a relational multi-tenant architecture with tenant IDs and role-based access control.

---

## 2. Failure Modes Observed During Evals and Their Fixes

| Failure Mode | Root Cause | How We Handled It | What Would Permanently Fix It |
| :--- | :--- | :--- | :--- |
| **Pagination Oscillation** | Model repeatedly clicked Next and Previous across pages 1 and 2 in vendor invoices. | Added 2-cycle alternating oscillation detection in `loopDetection.js` and clear prompt instructions. | Add explicit visited-pages state tracking in LangGraph state. |
| **Rate Limit 429** | Free-tier Gemini quota (15 RPM) exceeded during consecutive multi-step runs. | Added automatic 3-attempt exponential backoff with 5s, 10s, 15s delays in `llm/client.js`. | Use an enterprise tier API key or local fine-tuned model for tool calling. |
| **Approval Modal Lag** | Resuming an interrupted run waited synchronously for workflow completion before responding. | Made `/runs/:id/resume` respond immediately (HTTP 200) and continue in background. | Persistent job queues (BullMQ or Temporal) with SSE event streams. |
| **Stale Elements** | Page reloads or asynchronous DOM mutations invalidated ref tags ([e1], [e2]). | Automatically re-snapshot the DOM before every decision step. | MutationObserver event stream pushing live DOM deltas to the agent. |
