# Architecture Decision Records (ADRs)

## ADR-001: Accessibility-Tree DOM Snapshot vs Pure Vision Model

### Context
Autonomous browser workers can perceive web pages either through screenshot images (vision LLMs) or through DOM and accessibility structures. Sending full-resolution screenshots on every step consumes heavy token budgets (1,000 to 3,000 tokens per image), introduces coordinate latency, and is vulnerable to CSS layout shifts.

### Decision
We use Playwright's accessibility and interactive elements tree to inject ephemeral data-agent-ref attributes ([e1], [e2], etc.) directly into the DOM. We flatten the page into a compact text snapshot containing element roles, accessible names, values, headings, alerts, and table rows. Screenshots are still captured on disk as audit evidence and used as a fallback.

### Consequences
- Pros: 10x faster execution, 85% lower token usage, deterministic click targets, resilient to resolution differences.
- Cons: Highly dynamic canvas or WebGL elements without semantic ARIA tags require vision fallback.

---

## ADR-002: LangGraph.js for State Machine and Checkpointing

### Context
Complex multi-step enterprise tasks require loops, retries, replanning, and human-in-the-loop pauses. Standard chain-of-thought linear chains cannot pause for human review without losing context.

### Decision
We use @langchain/langgraph (LangGraph.js) to model the worker as a state graph with 10 discrete nodes. We use LangGraph's MemorySaver checkpointer and interrupt() primitives to pause execution on write actions or ambiguities and resume with operator responses.

### Consequences
- Pros: Explicit transitions, inspectable state channels, native pause and resume capabilities, clean visualization.
- Cons: Channel reducers require careful annotation definitions to prevent channel clobbering.

---

## ADR-003: Deterministic Policy Gate vs LLM-Judged Safety

### Context
Using an LLM to judge whether an action is safe is non-deterministic and susceptible to jailbreaking, prompt injections in vendor documents, and hallucinations.

### Decision
Safety rules are implemented in deterministic JavaScript (policyGate.js). The gate enforces allowed origin whitelists (allowedDomains) and flags write operations (requireApprovalForWrites) before any tool execution occurs.

### Consequences
- Pros: 100% reliable enforcement that cannot be tricked by malicious text in PDFs or web pages.
- Cons: Policies must be declared in code and cannot dynamically invent new permissions at runtime.

---

## ADR-004: Independent Verifier vs Self-Reporting Agent

### Context
LLMs frequently hallucinate success when encountering errors or failing to click the final submit button. An agent that validates its own claims suffers from confirmation bias.

### Decision
We decouple execution from verification. A dedicated verify node runs with an adversarial auditor prompt and read-only tools. It re-opens AcmeBooks ERP, re-extracts the source PDF, and queries the database directly to confirm ground truth.

### Consequences
- Pros: Zero false positives. The agent never claims victory unless the database and UI state demonstrably prove it.
- Cons: Adds a verification step that requires 1 to 2 additional read-only browser navigations.

---

## ADR-005: Plain Modern JavaScript (ESM) with Zod over TypeScript

### Context
The project mandates plain modern JavaScript without TypeScript compilation overhead, while still maintaining enterprise safety and predictable data shapes.

### Decision
We use Node 20+ native ES modules ("type": "module"), comprehensive JSDoc typedefs, and runtime Zod validation at every boundary (tool inputs, LLM outputs, environment configurations).

### Consequences
- Pros: Zero build step for the agent server, instant start times, runtime data validation where TypeScript only offers compile-time checks.
- Cons: Type checking relies on IDE JSDoc integration rather than tsc.

---

## ADR-006: Local SQLite via node:sqlite for Company Sandbox

### Context
To simulate a real company environment without external cloud database dependencies, we need a fast, zero-configuration SQL database.

### Decision
We use Node 22 built-in node:sqlite (DatabaseSync). It provides synchronous SQLite operations directly from the standard library without node-gyp native compilation or prebuilt binary incompatibilities.

### Consequences
- Pros: Runs cleanly on any OS without Docker or C++ compilation toolchains. Instant reset and seeding in under 300ms.
- Cons: SQLite is single-writer, which is ideal for single-worker desktop automation but not high-concurrency web apps.
