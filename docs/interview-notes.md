# Technical Interview Notes and Discussion Guide

A technical Q and A reference based on the real implementation of the CentrAlign Autonomous Task Worker.

---

### Q1: Why this architecture (LangGraph state machine with ReAct and independent verification)?
Answer:
Simple linear chains (such as LangChain SequentialChain) cannot handle loops, dynamic error recovery, human-in-the-loop pauses, or replanning. Conversely, completely unconstrained autonomous agent loops often wander or suffer from confirmation bias, claiming victory even when forms fail to submit.

Our architecture solves both problems:
1. ReAct Loop in LangGraph: Discrete nodes (understand, plan, decide, policy_gate, execute, observe, reflect) allow deterministic control over policy, safety checks, and loop detection at every step.
2. Independent Verification: The agent cannot declare success on its own. A separate verify node re-opens the system of record using read-only tools and compares database rows against ground-truth source documents before completing the run.

---

### Q2: How is a decision traced from the trace file?
Answer:
Every run writes an append-only JSONL file to `apps/agent/runs/<runId>/trace.jsonl`.
Each line is a structured event containing:
- `timestamp`: ISO-8601 UTC timestamp.
- `type`: Standard event type (such as `action.proposed`, `policy.checked`, `tool.started`, `tool.finished`, `observation.captured`, `verification.check`).
- `data.tool` and `data.args`: The exact tool called and its input arguments.
- `data.rationale`: The explicit reasoning produced by the model explaining why it chose that action.
- `data.result` and `data.durationMs`: The tool return value and latency.
- `data.screenshotUrl`: Visual proof linked to that step.

To trace why the agent made a decision, inspect the preceding `observation.captured` event to see the DOM snapshot it received, followed by `action.proposed` for the rationale, and `policy.checked` for gate decisions.

---

### Q3: How do you add a new tool?
Answer:
Adding a tool requires three clean steps:
1. Define the handler in `apps/agent/src/tools/` (for example `apps/agent/src/tools/browser.js` or a new file). The handler receives `(args, ctx)` where `ctx` includes the active Playwright page, logger, and workspace directory.
2. Register the tool specification in `apps/agent/src/tools/registry.js` with its name, description, parameters schema (Zod), category, and risk level (`low`, `medium`, or `high`).
3. Export it in `TOOL_REGISTRY`. The tool is automatically converted to Gemini function declarations and made available to the `decide` and `verify` nodes without touching any graph edges.

---

### Q4: How do you add a new task with zero code changes?
Answer:
The graph control flow contains zero task-specific logic. To run a completely novel task:
1. Submit the plain-English goal through the web console or CLI:
   `node apps/agent/src/cli.js --task "Create a new bill for Stark Components for 10000 INR due date 9 days from now"`
2. The `understand` node parses the objective, decomposes checkable success criteria, and extracts constraints.
3. The `plan` node generates a custom living plan.
4. The `decide` node navigates the web pages and interacts with form elements using live DOM accessibility refs ([e1], [e2]).
5. The `verify` node audits the outcome against the success criteria it defined in step 1.

---

### Q5: How do you make this production grade?
Answer:
To transition from prototype to production:
1. Durable State Checkpointing: Replace in-memory `MemorySaver` with a persistent database store (such as PostgreSQL or Redis) so runs survive server restarts.
2. Distributed Task Queue: Put task submissions on a message broker (such as Temporal, BullMQ, or AWS SQS) with worker autoscaling.
3. Enterprise Secret Management: Store enterprise credentials in HashiCorp Vault or AWS Secrets Manager rather than local `.env`.
4. Browser Container Fleet: Run Playwright instances inside isolated ephemeral containers (such as Browserless.io or isolated Docker workers) with network sandboxing and resource limits.
5. Observability: Ship JSONL events to Datadog or OpenTelemetry collectors for latency and token tracking.

---

### Q6: How do you scale this to many tenants?
Answer:
1. Tenant Isolation: Partition databases by tenant ID with row-level security (RLS) or separate database instances.
2. Isolated Browser Profiles: Each tenant run gets a dedicated, isolated browser context with distinct cookies, storage, and sandboxed download paths.
3. Policy Customization: Allow tenant administrators to configure distinct `allowedDomains`, maximum spend thresholds, and mandatory human sign-off rules.
4. Rate Limiting and Budgets: Enforce per-tenant token and tool call quotas to prevent noisy neighbors from exhausting API capacity.

---

### Q7: How do you improve reliability against non-deterministic LLM behavior?
Answer:
1. Grounding via Accessibility Tree: Instead of sending raw screenshots and asking for pixel coordinates, we flatten the DOM into typed references ([e1], [e2]). The model only chooses from real, interactable elements.
2. Deterministic Loop Detection: Detect repeated tool calls (both 3 consecutive identical calls and 2-cycle alternating oscillations) and intervene before budget exhaustion.
3. Zod Schema Repair: Structured LLM outputs are validated against Zod schemas. If the JSON is malformed, a repair loop re-prompts the model with the exact Zod parsing error.
4. Exponential Backoff: Rate limits (HTTP 429) and transient server errors (HTTP 500) trigger automatic backoff and retry in the `reflect` node.
5. Adversarial Verification: Verification runs in an independent loop that queries the database directly, ensuring that even if the execution model is overconfident, a false claim is rejected.
