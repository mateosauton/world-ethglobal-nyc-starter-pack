# Demo Readiness Design

Date: 2026-06-05

## Goal

Help hackathon builders produce clearer, more reliable demos and stronger ETHGlobal submissions. The starter pack should make it obvious whether a team can show a working success path, a meaningful failure path, and credible proof validation evidence before judging.

The primary focus is demo reliability and judge-facing clarity. General repository hygiene remains important, but only where it affects demo confidence.

## Context

The starter pack currently includes:

- `apps/human-gated-claim` for Track A World ID, MiniKit, and World Chain flows.
- `apps/human-agent-console` for Track B AgentKit and Human-in-the-Loop flows.
- `apps/ui-test-bench` for local desktop and mobile UI review.
- `packages/world-patterns` for shared World ID, AgentKit, wallet auth, transaction, env, and nullifier helpers.
- `contracts` for the one-human-one-claim Foundry contract and tests.
- Docs for starter usage, Track C upgrade recipes, support triage, release checks, workshop flow, and submission structure.

The docs explain what builders should do, and the UI smoke script verifies important local flows. The missing layer is a judging-prep surface that turns those checks into a concise readiness status and a judge-friendly demo view.

## Recommended Approach

Add both:

1. A `pnpm demo:doctor` command that runs demo readiness checks and writes a normalized report.
2. A Judge Mode view inside `apps/ui-test-bench` that gives builders a clean local presentation and prep surface.

The command is the source of truth for readiness. Judge Mode displays the latest report when available and falls back to a clear empty state when the report has not been generated.

This approach is stronger than docs alone because it gives builders objective feedback. It is stronger than a CLI alone because it gives teams a polished surface for judging prep and mentor review.

## Architecture

The demo readiness layer should sit beside the existing examples, not inside their core flows.

- Add a root script named `demo:doctor`.
- Add a script under `scripts/` that performs the checks and writes output.
- Write the doctor report to `output/demo-doctor/summary.json`.
- Extend `apps/ui-test-bench` with Judge Mode.
- Add `docs/demo-readiness.md` with short usage guidance.

The existing Track A and Track B apps should remain focused examples. The UI bench becomes the review surface for comparing apps, inspecting readiness, and preparing a judge narrative.

Any future app or example included in the pnpm workspace must satisfy a minimum runnable and typecheckable contract. Partial examples should either live outside the workspace until complete or include enough implementation for recursive checks to pass.

## Components

### Demo Doctor

`pnpm demo:doctor` should check five areas:

1. Workspace health: `pnpm test`, `pnpm typecheck`, and `pnpm contracts:test`.
2. App availability: claim app, agent console, and UI bench respond on their expected ports or configured URLs.
3. Demo flows: reuse the existing UI smoke coverage for local proof, prepared claim transaction, AgentKit challenge, signed registered agent, and local Human-in-the-Loop approval.
4. Configuration readiness: parse `.env.local` and `.env.example`, then classify required values as live-ready, local-only, or blocked.
5. Submission evidence: report contract address shape, AgentBook mode and configured agent addresses, proof validation endpoint presence, duplicate nullifier test coverage, screenshots, and output artifact paths.

The doctor should print a concise terminal summary and write the full JSON report to disk.

### Judge Mode

Judge Mode should be added to `apps/ui-test-bench` and should show:

- Track cards for Track A, Track B, and Track C.
- A "what judges should see" checklist per track.
- The latest doctor result, including blockers and warnings.
- A concise demo script covering setup, success path, failure path, proof validation explanation, and post-event plan.
- Artifact links for UI screenshots, doctor output, contract test evidence, and the submission template.

The UI should use the same status language as the doctor: ready, warning, and blocked.

### Docs

Add `docs/demo-readiness.md` with:

- When to run `pnpm demo:doctor`.
- How to read ready, warning, and blocked statuses.
- How to open Judge Mode.
- What builders should show during judging.
- How browser diagnostics differ from live World App execution.

## Data Flow

The doctor should create a normalized report:

```ts
type DemoDoctorReport = {
  generatedAt: string;
  overall: "ready" | "warning" | "blocked";
  checks: Array<{
    id: string;
    label: string;
    status: "pass" | "warn" | "fail";
    area: "workspace" | "apps" | "flows" | "config" | "submission";
    blocking: boolean;
    detail: string;
    fix?: string;
    evidence?: string;
  }>;
};
```

Status aggregation should be deterministic:

- Any failed check with `blocking: true` makes the report `blocked`.
- Any warning with no blocking failures makes the report `warning`.
- Any non-blocking failure with no blocking failures makes the report `warning`.
- All checks passing makes the report `ready`.

The doctor should avoid creating a second browser automation stack. For local flow checks, it should call or reuse `scripts/ui-ux-smoke.mjs` after confirming the expected apps are reachable.

Judge Mode should load `output/demo-doctor/summary.json` if present. If it is absent, the page should show an empty state that tells builders to run `pnpm demo:doctor`.

## Error Handling And UX

The doctor should finish with a clear status and actionable fixes. It should not fail silently or require builders to read raw logs to understand the next step.

Use these status meanings:

- `ready`: judging prep checks passed.
- `warning`: the local demo can run, but live World, AgentBook, or contract evidence is incomplete.
- `blocked`: core checks fail, apps are unreachable, or the demo flow is broken.

Each failed or warning check should include one concrete fix, such as:

- Start apps with `pnpm dev:all`.
- Replace placeholder World Developer Portal values in `.env.local`.
- Add a deployed World Chain Sepolia contract address.
- Register the agent wallet or switch the AgentBook mode deliberately.
- Complete or remove a partial workspace package so recursive checks pass.

Judge Mode should not overclaim live readiness. Browser-only diagnostics must remain clearly separate from World App execution.

## Testing

Add focused tests for:

- Environment parsing and placeholder detection.
- Status classification for live-ready, local-only, warning, and blocked states.
- Report aggregation.
- A doctor dry-run path that can run without local app servers.
- Judge Mode rendering with a fixture report.

Keep the existing UI smoke script as the full local flow test. The doctor can use it as evidence instead of duplicating Playwright steps.

## Acceptance Criteria

- `pnpm demo:doctor` exists at the root.
- The doctor writes `output/demo-doctor/summary.json`.
- The doctor reports workspace, app, flow, config, and submission evidence checks.
- The doctor gives concise fixes for warnings and failures.
- Judge Mode exists in `apps/ui-test-bench`.
- Judge Mode displays the latest doctor result or an empty state.
- Judge Mode includes track-specific judge checklists and demo scripts.
- `docs/demo-readiness.md` explains the workflow.
- Tests cover env parsing, report aggregation, and Judge Mode fixture rendering.
- The implementation does not weaken the existing Track A or Track B examples.

## Non-Goals

- Do not replace the existing starter apps.
- Do not add a new sponsor track.
- Do not require live World credentials for local readiness.
- Do not claim browser diagnostics are equivalent to World App execution.
- Do not make Judge Mode a marketing landing page.
