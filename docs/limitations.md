# Known Limitations & Future Work

## 1. Known Limitations

While the prototype reliably executes complex tasks end-to-end and survives real failure modes, an honest engineering assessment reveals specific architectural limitations:

### 1. Web Browser Scope (No Native Desktop OS Control)
- **Current State:** The agent interacts strictly with browser-based software (Chromium via Playwright) and local workspace files.
- **Limitation:** It cannot automate native desktop applications (e.g. legacy Windows desktop ERPs, Excel desktop, SAP GUI) that require OS-level mouse coordinates and window management.

### 2. Single Browser Context per Run
- **Current State:** Each run creates a dedicated, isolated Chromium context with cookies preserved throughout the session.
- **Limitation:** The worker does not share cookies or sessions across concurrent tasks, requiring login on the first task of each run.

### 3. Vision Fallback Scope
- **Current State:** The primary modality is DOM accessibility snapshot ref flattening (`[e1]`, `[e2]`). If an element is missing, a screenshot is attached as evidence.
- **Limitation:** The fallback does not calculate pixel bounding boxes or visual coordinate offsets for canvas-rendered UIs.

### 4. Verification Overhead
- **Current State:** The independent verification auditor opens the system of record and re-extracts the source PDF on every completion claim.
- **Limitation:** This rigorous safety guarantee introduces approximately 2 to 3 seconds of additional execution latency per task.

### 5. Multi-Tenant Isolation
- **Current State:** The simulated environment uses a local SQLite database file (`apps/web/data/app.db`).
- **Limitation:** In a multi-tenant enterprise deployment, the database would require tenant-partitioned schemas, row-level security, and audit logs.

---

## 2. What I Would Build Next

If extending this system toward enterprise production, the roadmap would prioritize:

1. **Persistent Company Memory & Learned Procedure Library:**
   - Automatically compile past successful workflows into reusable procedural memory ("Standard Operating Procedures"), eliminating discovery steps on repeated tasks.
2. **OS-Level Computer-Use Controller:**
   - Integrate native screen capture and virtual mouse/keyboard control to operate across desktop applications alongside browser tabs.
3. **Task Queue & Durable Execution Engine:**
   - Back LangGraph checkpoints with a durable queue (e.g., Temporal or BullMQ + PostgreSQL) to support worker failover and long-running asynchronous jobs.
4. **Fine-Grained Role-Based Access Control (RBAC):**
   - Provide enterprise administrators with granular permission rules per user, vendor, or maximum transaction dollar value.
5. **Multi-Agent Specialist Swarm:**
   - Decompose complex workflows into specialized sub-agents: a Discovery Worker, a Document Parser, a Data Entry Worker, and a Verification Auditor operating concurrently.
