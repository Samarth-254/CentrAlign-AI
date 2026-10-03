# CentrAlign Autonomous AI Task Worker: Demo Walkthrough Script

**Target Duration:** 3 to 4 Minutes  
**Audience:** Hiring Committee & Technical Reviewers  
**Theme:** Real Autonomy, Ground-Truth Verification, and Generalization Without Hardcoding.

---

## Act 1: Introduction & Architecture Overview (0:00 – 0:35)

**Visual:** Open browser at `http://localhost:3000/console`. Show the dark console UI with live timeline, side panels for Understanding, Living Plan, Memory, and Verification.

> **Voiceover:**  
> *"Hi everyone. Today I'm demonstrating the CentrAlign Autonomous AI Task Worker prototype.  
> The goal is an AI employee that takes a natural language directive and completes it end-to-end across multiple computer interfaces—logging into third-party portals, downloading and parsing real PDF invoices, entering validated records into internal enterprise software, and independently auditing its own work.  
>  
> Rather than a fragile script or linear chain, this worker runs on a 10-node LangGraph state machine. It uses accessibility-tree DOM ref snapshots (`[e1]`, `[e2]`) instead of brittle pixel coordinates, enforces deterministic safety policy gates, and decouples execution from an independent ground-truth verification auditor."*

---

## Act 2: Hero Task (T1) with Human-in-the-Loop Sign-Off (0:35 – 1:35)

**Visual:**
1. Leave "Auto-approve mutations" **unchecked** in the console.
2. Select the **T1 Chip**: *"Find the latest invoice from Northwind Traders, extract the amount and due date, enter it into AcmeBooks, and tell me once it is done."*
3. Click **"Start Task Worker"**.

> **Voiceover:**  
> *"Let's start with our hero task. Notice that auto-approval is unchecked so we can observe our policy gate in action.  
>  
> The worker begins in the `understand` node, formulating checkable success criteria and determining that 'latest' requires inspecting issue dates, not table column order.  
> Next, it produces a living plan and dispatches browser actions: navigating to the Vendor Portal, logging in with masked credentials, locating Northwind Traders, and paging through the invoices table to find invoice `INV-1042`.  
>  
> It downloads the raw PDF into its sandboxed workspace and calls our PDF parser to extract the ground truth: $12,450.00, due 15/12/2026.  
> It navigates to AcmeBooks ERP, logs in, checks for duplicate records, and fills the bill creation form.  
>  
> Now notice the execution pauses! Our deterministic policy gate intercepted the form submission. The console displays a Human Approval Modal showing the exact action, proposed values, and rationale. The operator can inspect or edit values before signing off.  
> I'll click **Approve & Execute**."*

**Visual:** Click "Approve & Execute". Watch the form submit, redirect to the new bill page with the green banner, and transition to `verify`.

> **Voiceover:**  
> *"Once approved, the bill is created. But the agent isn't allowed to simply claim victory. The workflow transitions to an independent verification auditor node.  
> The auditor re-opens AcmeBooks, re-extracts the source PDF, and inspects the database ledger directly. All 5 success criteria pass with direct evidence, and the run completes with a downloadable report."*

---

## Act 3: Transient 500 Chaos Recovery (T7) (1:35 – 2:20)

**Visual:**
1. In the top navbar, click **"⚡ Chaos: OFF"** to toggle it to **"⚡ Chaos: ON (500s)"**.
2. Check "Auto-approve write mutations".
3. Click the **T7 Chaos Chip** and hit **"Start Task Worker"**.

> **Voiceover:**  
> *"Now let's test reliability under unexpected failures. I'll enable Chaos Mode, which forces the AcmeBooks server to return a transient 500 error on the first submit attempt.  
>  
> The agent downloads the invoice, navigates to the bill form, and clicks submit. The server responds with a 500 Internal Server Error page.  
>  
> Rather than crashing or stalling in an infinite loop, our `reflect` node inspects the observation, diagnoses the transient HTTP 500, backs off, navigates back, and resubmits.  
> The second attempt succeeds, and the bill is recorded without human intervention."*

---

## Act 4: Ambiguity Resolution (T4) (2:20 – 3:00)

**Visual:**
1. Click the **T4 Ambiguity Chip**: *"Enter the latest Initech Software invoice into AcmeBooks."*
2. Hit **"Start Task Worker"**.

> **Voiceover:**  
> *"In enterprise environments, real data is often ambiguous. For Initech Software, there is an Issued invoice dated October 25th, but also a newer Draft invoice dated November 20th.  
>  
> Notice that the worker immediately flags this ambiguity at understand time! It halts execution and presents an interactive Clarification Dialog:  
> 'Initech Software has a Draft invoice dated newer than the latest Issued invoice. Should I enter the Issued invoice or the Draft invoice?'  
>  
> I will select **'Enter latest Issued invoice (INT-225)'**.  
> The worker resumes, downloads `INT-225`, and registers the approved invoice without corrupting company records."*

---

## Act 5: Generalization & Eval Benchmark (3:00 – 3:45)

**Visual:**
1. Click the **T2 Chip**: *"Mark the bill for Globex Logistics invoice GLX-890 as paid in AcmeBooks."*
2. Hit **"Start Task Worker"**.

> **Voiceover:**  
> *"Finally, let's talk about generalization. A common pitfall in AI agents is hardcoding task-specific logic into control loops.  
> In our codebase, there is zero invoice-specific code in the graph nodes. To prove this, here is a completely different workflow: 'Mark the bill for Globex Logistics invoice GLX-890 as paid in AcmeBooks.'  
>  
> The exact same 10-node state machine navigates directly to the ledger, views bill details, clicks 'Mark as Paid', updates the ledger, and the verifier confirms the 'Paid' status.  
>  
> Let's look at our aggregate evaluation benchmark. Running `pnpm eval` across all 7 scenarios—including read-only aggregations, duplicate detection, and prompt injection defense—the system achieves a 100% pass rate with 100% verification agreement against our programmatic database oracles."*

**Visual:** Show the terminal running `pnpm eval` with the clean summary table.

> **Voiceover:**  
> *"CentrAlign's Autonomous Task Worker demonstrates that with structured state machines, deterministic safety gates, and independent verification, AI workers can be trusted to run real computer tasks in enterprise environments. Thank you!"*
