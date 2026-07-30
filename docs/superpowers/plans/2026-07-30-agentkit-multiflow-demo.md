# AgentKit Multi-Flow Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the existing AgentKit + x402 demo with a wallet-aware AgentKit access scenario and a separate human-in-the-loop approval scenario.

**Architecture:** Keep the real AgentKit/x402 resource path unchanged and add a simulator-only domain model that receives an explicit flow, test-wallet address, call count, and approval intent. The API route delegates simulator requests to that pure model; the client makes the two flows selectable and renders their redacted event timeline. The approval flow is deliberately non-authoritative: it records only a simulated execution state and has no real-world side effect.

**Tech Stack:** Next.js 16, React 19, TypeScript, Vitest, @worldcoin/agentkit 0.2, x402 v2, shadcn demo-ui.

---

## File structure

| File | Responsibility |
| --- | --- |
| `apps/agentkit-x402/lib/demo-call.ts` | Simulator constants, wallet/flow types, deterministic policy decisions, redacted events, and result types. |
| `apps/agentkit-x402/lib/agent-client.ts` | Extends the timeline stage union while retaining live AgentKit-first payment composition. |
| `apps/agentkit-x402/app/api/demo-call/route.ts` | Validates simulator inputs and dispatches the selected simulator flow; rejects unsupported live approval simulation. |
| `apps/agentkit-x402/components/agent-console.tsx` | Flow and test-wallet controls, separate request/proposal/approval actions, and non-authoritative UI disclosure. |
| `apps/agentkit-x402/content/{guide,code}.tsx` | Builder documentation for both flow boundaries and live signing limits. |
| `apps/agentkit-x402/tests/{demo-call,demo-call-route,ui}.test.tsx` | Exact wallet fixtures, flow policy, API, and rendered surface coverage. |

### Task 1: Define simulator flows and wallet policy

**Files:**
- Modify: `apps/agentkit-x402/lib/agent-client.ts`
- Modify: `apps/agentkit-x402/lib/demo-call.ts`
- Modify: `apps/agentkit-x402/tests/demo-call.test.ts`

- [ ] **Step 1: Write the failing policy tests**

  Replace the generic `unregistered-agent` fixture assertions with the following address-bound cases:

  ```ts
  import {
    HUMAN_BACKED_AGENT_ADDRESS,
    NON_HUMAN_BACKED_AGENT_ADDRESS,
    runDemoCall,
  } from "../lib/demo-call";

  expect(HUMAN_BACKED_AGENT_ADDRESS).toBe("0xbEBB5B46fFDA7E7494595E826FC4D4a61ce5f6A6");
  expect(NON_HUMAN_BACKED_AGENT_ADDRESS).toBe("0xDBf913F12d403540A83f091D46bDC34bf04c4Fe1");
  ```

  Add four named tests:

  - `grants the human-backed agent an AgentKit trial before x402 fallback`: calls the `agentkit-access` flow with the human-backed address at calls 1 and 4; assert `human-trial` then `payment-settled`, and that the fourth event sequence includes `payment_fallback`.
  - `does not release the AgentKit resource to the non-human-backed agent`: calls the same flow with the non-human address; assert `payment-required`, `resource === undefined`, and an `agent_identity` failure before a pending payment fallback.
  - `requires a distinct human approval before the human-backed agent action executes`: call `human-approval` once with `approval: false` and assert `approval-pending` plus no action execution; call again with `approval: true` and assert `approval-granted`, `action.status === "simulated-executed"`, and a successful `action_execution` event after `human_approval`.
  - `holds the non-human-backed agent action even when approval is supplied`: call `human-approval` for the non-human address with `approval: true`; assert `action-held`, `action.status === "held"`, and no `action_execution` event.

- [ ] **Step 2: Run the focused tests to establish the red state**

  Run: `pnpm --filter @world-lisbon/agentkit-x402 test -- tests/demo-call.test.ts`

  Expected: FAIL because the explicit wallet constants, `agentkit-access`/`human-approval` inputs, and action result do not exist yet.

- [ ] **Step 3: Implement a pure deterministic simulator model**

  In `lib/demo-call.ts`, define the exact constants and public inputs:

  ```ts
  export const HUMAN_BACKED_AGENT_ADDRESS = "0xbEBB5B46fFDA7E7494595E826FC4D4a61ce5f6A6" as const;
  export const NON_HUMAN_BACKED_AGENT_ADDRESS = "0xDBf913F12d403540A83f091D46bDC34bf04c4Fe1" as const;
  export type DemoFlow = "agentkit-access" | "human-approval";
  export type DemoAgentAddress = typeof HUMAN_BACKED_AGENT_ADDRESS | typeof NON_HUMAN_BACKED_AGENT_ADDRESS;
  ```

  Change `runDemoCall` to accept `{ mode: "simulator"; flow: DemoFlow; agentAddress: DemoAgentAddress; call?: number; approval?: boolean }`. It must return an identity event for every flow and never return a protected `resource` for the non-human address.

  For `agentkit-access`, retain three free uses only for `HUMAN_BACKED_AGENT_ADDRESS`; the fourth result is `payment-settled`. The non-human address returns `payment-required` with a failed `agent_identity` event followed by a pending `payment_fallback` event. For `human-approval`, add `action: { status: "awaiting-human-approval" | "simulated-executed" | "held"; label: "Publish supplier payout" }`; human-backed agents remain pending until `approval === true`, while non-human agents are held even when `approval` is true. Never add a wallet address, signature, human ID, or approval token to an event detail.

  Extend `ProtocolEvent["stage"]` in `lib/agent-client.ts` with `agent_identity`, `action_proposed`, `human_approval`, and `action_execution`; keep the existing redaction function and real fetch composition unchanged.

- [ ] **Step 4: Run the focused tests and typecheck**

  Run: `pnpm --filter @world-lisbon/agentkit-x402 test -- tests/demo-call.test.ts && pnpm --filter @world-lisbon/agentkit-x402 typecheck`

  Expected: Vitest reports all `demo-call` tests passing and TypeScript exits 0.

- [ ] **Step 5: Commit the policy layer**

  ```bash
  git add apps/agentkit-x402/lib/agent-client.ts apps/agentkit-x402/lib/demo-call.ts apps/agentkit-x402/tests/demo-call.test.ts
  git commit -m "add agent demo flow policy"
  ```

### Task 2: Expose the flows through the demo endpoint

**Files:**
- Modify: `apps/agentkit-x402/app/api/demo-call/route.ts`
- Create: `apps/agentkit-x402/tests/demo-call-route.test.ts`

- [ ] **Step 1: Write failing API tests for both wallet cases**

  Extract/export a route factory so tests can run without secrets:

  ```ts
  export function createDemoCallHandler(input: {
    environment?: NodeJS.ProcessEnv;
    liveFetch?: typeof fetch;
  }): (request: Request) => Promise<Response>;
  ```

  Test a simulator POST body containing the exact human-backed address, `flow: "agentkit-access"`, and `call: 1`; assert HTTP 200, `outcome === "human-trial"`, and a resource. Test the non-human address with `flow: "human-approval"`, `approval: true`; assert HTTP 200, `outcome === "action-held"`, and no event with stage `action_execution`. Test that `mode: "live", flow: "human-approval"` receives HTTP 400 and `{ error: "live_flow_unsupported" }`.

- [ ] **Step 2: Run the route test to establish the red state**

  Run: `pnpm --filter @world-lisbon/agentkit-x402 test -- tests/demo-call-route.test.ts`

  Expected: FAIL because the factory and multi-flow request validation are absent.

- [ ] **Step 3: Validate inputs before selecting the simulator**

  Implement `createDemoCallHandler` in the route module and make `POST` call it with `process.env`. Parse only the two exported `DemoFlow` values and two exported `DemoAgentAddress` values. Invalid simulator inputs return HTTP 400 with `{ error: "invalid_demo_request" }`; do not coerce arbitrary addresses into a simulator identity.

  Route simulator requests directly to `runDemoCall`. Preserve the existing live AgentKit request logic only for `flow === "agentkit-access"`; reject `human-approval` in live mode with `{ error: "live_flow_unsupported", message: "The approval flow is simulator-only and never executes a real action." }`. Live mode must continue to require server-only signing keys and never accept client-provided keys or an address selector.

- [ ] **Step 4: Run focused endpoint verification**

  Run: `pnpm --filter @world-lisbon/agentkit-x402 test -- tests/demo-call-route.test.ts tests/demo-call.test.ts && pnpm --filter @world-lisbon/agentkit-x402 typecheck`

  Expected: both test files pass and TypeScript exits 0.

- [ ] **Step 5: Commit the endpoint**

  ```bash
  git add apps/agentkit-x402/app/api/demo-call/route.ts apps/agentkit-x402/tests/demo-call-route.test.ts
  git commit -m "add demo flow endpoint"
  ```

### Task 3: Build a two-flow interactive console

**Files:**
- Modify: `apps/agentkit-x402/components/agent-console.tsx`
- Modify: `apps/agentkit-x402/app/page.tsx`
- Modify: `apps/agentkit-x402/tests/ui.test.tsx`

- [ ] **Step 1: Write failing rendered-surface assertions**

  Update `ui.test.tsx` to assert the static page includes these user-facing labels:

  ```ts
  expect(html).toContain("AgentKit protected resource");
  expect(html).toContain("Human-approved action");
  expect(html).toContain("Human-backed test agent");
  expect(html).toContain("Non-human-backed test agent");
  expect(html).toContain("Approve and execute simulated action");
  expect(html).toContain("never executes a real action");
  ```

- [ ] **Step 2: Run the UI test to establish the red state**

  Run: `pnpm --filter @world-lisbon/agentkit-x402 test -- tests/ui.test.tsx`

  Expected: FAIL because the console currently has only the generic request fixture selector.

- [ ] **Step 3: Replace generic fixtures with explicit flows and policy controls**

  In `AgentConsole`, replace `SimulatorFixture` state with `flow`, `agentAddress`, `call`, and `result` state. Present a flow selector with labels `AgentKit protected resource` and `Human-approved action`; in simulator mode present address selectors labeled `Human-backed test agent` and `Non-human-backed test agent` using the two exported constants. Reset call/result when either selection changes.

  POST `{ mode, flow, agentAddress, call: nextCall, approval }` to `/api/demo-call`. The AgentKit flow button reads `Run AgentKit access`. The approval flow first reads `Propose simulated action`; show `Approve and execute simulated action` only after the human-backed result has `action.status === "awaiting-human-approval"`. On approval it sends `approval: true`. For held and pending outcomes, preserve the no-payload state. Render `result.action` separately from the protected response and include the literal disclosure `Simulator outcomes never execute a real action.`

  Update the page title/description to say the demo contains two policy-distinct flows, while retaining the shared DemoShell Guide and Code tabs.

- [ ] **Step 4: Run UI and domain regression tests**

  Run: `pnpm --filter @world-lisbon/agentkit-x402 test -- tests/ui.test.tsx tests/demo-call.test.ts tests/demo-call-route.test.ts && pnpm --filter @world-lisbon/agentkit-x402 typecheck`

  Expected: all selected tests pass and the typecheck exits 0.

- [ ] **Step 5: Commit the console**

  ```bash
  git add apps/agentkit-x402/components/agent-console.tsx apps/agentkit-x402/app/page.tsx apps/agentkit-x402/tests/ui.test.tsx
  git commit -m "add multi-flow agent console"
  ```

### Task 4: Document protocol and human-approval boundaries

**Files:**
- Modify: `apps/agentkit-x402/content/guide.tsx`
- Modify: `apps/agentkit-x402/content/code.tsx`
- Modify: `apps/agentkit-x402/tests/ui.test.tsx`

- [ ] **Step 1: Write failing documentation assertions**

  Add assertions that the rendered page includes `Human-backed status is not human approval`, `Public addresses alone cannot complete a live signed challenge`, and `HUMAN_BACKED_AGENT_ADDRESS`.

- [ ] **Step 2: Run the UI test to establish the red state**

  Run: `pnpm --filter @world-lisbon/agentkit-x402 test -- tests/ui.test.tsx`

  Expected: FAIL until the guide and code content document both policy boundaries.

- [ ] **Step 3: Add concise builder guidance and copyable code**

  In `GuideContent`, document the two flows separately: AgentKit identity plus quota before x402, then explicit reviewer approval after an action proposal. State exactly: `Human-backed status is not human approval.` Explain that the supplied public addresses are simulator fixtures; a live signed AgentKit challenge needs the matching server-only private key, so `Public addresses alone cannot complete a live signed challenge.`

  In `CodeContent`, add an approval-policy panel that expresses `if (!agentIsHumanBacked) return hold()` and `if (!reviewerApproved) return awaitApproval()` before a simulator-only `recordSimulatedExecution()`. The snippet must not imply that a browser control settles payment, signs for a wallet, or triggers a real payout. Retain the existing AgentKit-first x402 example.

- [ ] **Step 4: Run focused documentation and full-app checks**

  Run: `pnpm --filter @world-lisbon/agentkit-x402 test && pnpm --filter @world-lisbon/agentkit-x402 typecheck && pnpm --filter @world-lisbon/agentkit-x402 build`

  Expected: all AgentKit Vitest tests pass, TypeScript exits 0, and Next.js production build exits 0.

- [ ] **Step 5: Commit the documentation**

  ```bash
  git add apps/agentkit-x402/content/guide.tsx apps/agentkit-x402/content/code.tsx apps/agentkit-x402/tests/ui.test.tsx
  git commit -m "document agent flow boundaries"
  ```

### Task 5: Validate the full workspace contract

**Files:**
- Modify: none

- [ ] **Step 1: Run the workspace checks**

  Run: `node --test scripts/workspace-shape.test.mjs scripts/lisbon-release-check.test.mjs && node scripts/lisbon-release-check.mjs && pnpm test && pnpm typecheck && pnpm build`

  Expected: every command exits 0. If an existing unrelated failure appears, record the exact command and error; do not change unrelated demos.

- [ ] **Step 2: Inspect the final requirement evidence**

  Run: `git diff --check && git status --short && pnpm --filter @world-lisbon/agentkit-x402 test -- tests/demo-call.test.ts tests/demo-call-route.test.ts tests/ui.test.tsx`

  Expected: no whitespace errors; the focused suite proves both exact address fixtures, AgentKit/x402 access policy, explicit approval before simulated execution, and non-human hold behavior.

- [ ] **Step 3: Do not create a verification-only commit**

  The preceding task commits are the complete implementation history. Leave unrelated changes unmodified.
