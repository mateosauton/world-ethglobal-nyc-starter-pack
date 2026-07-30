# ETHGlobal Lisbon Demo Suite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the NYC starter kit with four independent, production-shaped World demos for ETHGlobal Lisbon.

**Architecture:** Four Next.js applications consume shared shadcn UI, World integration, and Neon data packages. Live integrations are server-only and fail closed; simulator fixtures are typed and visibly labeled so they cannot grant real benefits.

**Tech Stack:** pnpm workspaces, Next.js 16, React 19, TypeScript 6, Tailwind CSS 4, shadcn/ui with Radix, IDKit 4, MiniKit 2, World AgentKit, x402 v2, Hono, Neon/PostgreSQL, Drizzle ORM, Zod, Vitest, Playwright.

---

## File map

```text
apps/
  one-human-trial/          # IDKit 4 proof and one-use benefit
  selfie-onboarding/        # simulator-first Selfie Check beta flow and feedback
  agentkit-x402/            # human-backed protected API and payment fallback
  credential-policy-lab/    # trust-event policy configurator
packages/
  demo-ui/                  # shared shadcn source, shell, code blocks, event timeline
  world-patterns/           # IDKit, MiniKit, AgentKit and policy contracts
  data/                     # Drizzle schema, repositories and migrations
docs/lisbon/                # source-linked copies of embedded builder material
scripts/                    # release configuration and public flow checks
```

### Task 1: Rebuild the workspace skeleton

**Files:**
- Modify: `package.json`
- Modify: `pnpm-workspace.yaml`
- Create: `apps/one-human-trial/package.json`
- Create: `apps/selfie-onboarding/package.json`
- Create: `apps/agentkit-x402/package.json`
- Create: `apps/credential-policy-lab/package.json`
- Create: `packages/demo-ui/package.json`
- Create: `packages/data/package.json`
- Modify: `packages/world-patterns/package.json`
- Delete: obsolete `apps/human-*` and `apps/ui-test-bench` source after replacements compile

- [ ] **Step 1: Write a workspace smoke test**

Create `scripts/workspace-shape.test.mjs` that reads `pnpm-workspace.yaml` and the four app manifests and asserts exactly the intended public app names are present.

- [ ] **Step 2: Run the smoke test and verify it fails**

Run: `node --test scripts/workspace-shape.test.mjs`

Expected: FAIL because the Lisbon manifests do not exist.

- [ ] **Step 3: Add the new manifests and root scripts**

Use these public package names and ports:

```json
{
  "@world-lisbon/one-human-trial": 3000,
  "@world-lisbon/selfie-onboarding": 3001,
  "@world-lisbon/agentkit-x402": 3002,
  "@world-lisbon/credential-policy-lab": 3003
}
```

Root scripts must expose `dev:<demo>`, `build`, `typecheck`, `lint`, `test`, `test:browser`, and `release:check` without referencing NYC app names.

- [ ] **Step 4: Install and verify the workspace**

Run: `pnpm install && node --test scripts/workspace-shape.test.mjs`

Expected: install succeeds and the workspace test passes.

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml pnpm-workspace.yaml apps packages scripts/workspace-shape.test.mjs
git commit -m "rebuild Lisbon workspace"
```

### Task 2: Create the shared shadcn design system

**Files:**
- Create: `packages/demo-ui/components.json`
- Create: `packages/demo-ui/src/styles.css`
- Create: `packages/demo-ui/src/lib/utils.ts`
- Create: `packages/demo-ui/src/components/ui/{alert,badge,button,card,dialog,input,label,select,separator,skeleton,table,tabs,textarea,tooltip}.tsx`
- Create: `packages/demo-ui/src/components/demo-shell.tsx`
- Create: `packages/demo-ui/src/components/code-panel.tsx`
- Create: `packages/demo-ui/src/components/event-timeline.tsx`
- Create: `packages/demo-ui/src/index.ts`
- Create: `packages/demo-ui/src/demo-shell.test.tsx`

- [ ] **Step 1: Write failing component tests**

The tests render `DemoShell` and assert that Demo, Guide, and Code tabs exist; the demo tab is selected by default; simulator mode renders a visible `Simulator` badge; and an error outcome renders an accessible alert.

- [ ] **Step 2: Run the tests and verify they fail**

Run: `pnpm --filter @world-lisbon/demo-ui test`

Expected: FAIL because the components do not exist.

- [ ] **Step 3: Initialize shadcn non-interactively and add primitives**

Run from `packages/demo-ui`: `npx shadcn@latest init -d --base radix`, then add the listed components with `npx shadcn@latest add ...`.

Keep the generated source in the package. Use literal Geist font names in Tailwind `@theme inline`; do not introduce the circular `--font-sans: var(--font-sans)` declaration.

- [ ] **Step 4: Implement the shared shell**

`DemoShell` accepts:

```ts
type DemoShellProps = {
  title: string
  description: string
  mode: "live" | "simulator"
  demo: React.ReactNode
  guide: React.ReactNode
  code: React.ReactNode
  repositoryUrl?: string
}
```

Compose it from shadcn `Tabs`, `Card`, `Badge`, and `Alert`; use a two-column desktop content area and collapse safely at narrow widths without a separate mobile design.

- [ ] **Step 5: Run tests and typecheck**

Run: `pnpm --filter @world-lisbon/demo-ui test && pnpm --filter @world-lisbon/demo-ui typecheck`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/demo-ui
git commit -m "add shared demo UI"
```

### Task 3: Implement World contracts and simulator separation

**Files:**
- Create: `packages/world-patterns/src/outcomes.ts`
- Create: `packages/world-patterns/src/idkit.ts`
- Create: `packages/world-patterns/src/policies.ts`
- Create: `packages/world-patterns/src/selfie.ts`
- Create: `packages/world-patterns/src/agentkit.ts`
- Create: `packages/world-patterns/src/simulator.ts`
- Modify: `packages/world-patterns/src/index.ts`
- Create: matching `*.test.ts` files

- [ ] **Step 1: Write failing contract tests**

Assert that `createProofOfHumanPolicy(signal)` uses the v4 helper, `createSelfiePolicy(signal)` is marked legacy beta, `createRpRequest` never returns a signing key, hosted verification forwards the IDKit payload unchanged, and `SimulatorResult` cannot satisfy `VerifiedWorldResult` at runtime or in TypeScript.

- [ ] **Step 2: Run tests and verify failure**

Run: `pnpm --filter @world-lisbon/world-patterns test`

Expected: FAIL on missing modules.

- [ ] **Step 3: Implement typed outcomes**

Use this top-level boundary:

```ts
export type WorldOutcome<T> =
  | { ok: true; mode: "live"; value: T }
  | { ok: true; mode: "simulator"; value: T; fixture: string }
  | { ok: false; code: WorldErrorCode; message: string; retryable: boolean }
```

Only functions accepting `{ ok: true; mode: "live" }` may persist proof use or grant a benefit.

- [ ] **Step 4: Implement current SDK adapters**

Use `@worldcoin/idkit` 4.2.x and `@worldcoin/idkit-core/signing`; use `proofOfHuman`, `passport`, `selfieCheckLegacy`, and `require_user_presence` according to current docs. Keep MiniKit command helpers separate from verification helpers.

- [ ] **Step 5: Run tests and typecheck**

Run: `pnpm --filter @world-lisbon/world-patterns test && pnpm --filter @world-lisbon/world-patterns typecheck`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/world-patterns
git commit -m "add World integration contracts"
```

### Task 4: Add Neon persistence

**Files:**
- Create: `packages/data/drizzle.config.ts`
- Create: `packages/data/src/schema.ts`
- Create: `packages/data/src/client.ts`
- Create: `packages/data/src/proof-uses.ts`
- Create: `packages/data/src/agentkit-storage.ts`
- Create: `packages/data/src/feedback.ts`
- Create: `packages/data/src/index.ts`
- Create: `packages/data/src/*.test.ts`
- Create: `packages/data/drizzle/0000_lisbon.sql`

- [ ] **Step 1: Write repository tests**

Cover duplicate `(action, nullifier)`, atomic `tryIncrementUsage(endpoint, humanId, limit)`, nonce replay, feedback field validation, forbidden proof/wallet/image fields, and constant-time admin token authorization.

- [ ] **Step 2: Run tests and verify failure**

Run: `pnpm --filter @world-lisbon/data test`

Expected: FAIL because repositories do not exist.

- [ ] **Step 3: Define schema and migrations**

Create `proof_uses`, `agentkit_usage`, `agentkit_nonces`, and `selfie_feedback`. Use PostgreSQL `NUMERIC(78,0)` for normalized nullifiers and a unique constraint on `(action, nullifier)`. Store no proof payload, biometric, image, or wallet address in feedback.

- [ ] **Step 4: Implement production and memory adapters**

Production uses Neon/Drizzle transactions. Memory adapters exist only for tests and explicit simulator mode; their exported names include `InMemory`.

- [ ] **Step 5: Run tests and typecheck**

Run: `pnpm --filter @world-lisbon/data test && pnpm --filter @world-lisbon/data typecheck`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/data
git commit -m "add durable demo storage"
```

### Task 5: Build one-per-human free trial

**Files:**
- Create: `apps/one-human-trial/app/api/idkit/request/route.ts`
- Create: `apps/one-human-trial/app/api/idkit/verify/route.ts`
- Create: `apps/one-human-trial/app/{layout,page}.tsx`
- Create: `apps/one-human-trial/components/trial-demo.tsx`
- Create: `apps/one-human-trial/content/{guide,code}.tsx`
- Create: `apps/one-human-trial/tests/*.test.ts`

- [ ] **Step 1: Write failing route and UI tests**

Cover signed request creation, payload-forwarding verification, successful unique grant, duplicate rejection, simulator non-grant, missing configuration, selected Demo tab, and event timeline.

- [ ] **Step 2: Run tests and verify failure**

Run: `pnpm --filter @world-lisbon/one-human-trial test`

Expected: FAIL.

- [ ] **Step 3: Implement live vertical slice**

Use controlled `IDKitRequestWidget`, server-created RP context, `proofOfHuman`, hosted v4 verification, and transactional proof-use insertion. Bind and enforce the same action/signal server-side.

- [ ] **Step 4: Add embedded guide and code**

Include the IDKit 4 quickstart, verification template, nullifier warning, MiniKit-versus-IDKit guidance, and strong/weak implementation comparison.

- [ ] **Step 5: Verify**

Run: `pnpm --filter @world-lisbon/one-human-trial test && pnpm --filter @world-lisbon/one-human-trial typecheck && pnpm --filter @world-lisbon/one-human-trial build`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/one-human-trial
git commit -m "build one-human trial demo"
```

### Task 6: Build Selfie Check onboarding and feedback

**Files:**
- Create: `apps/selfie-onboarding/app/api/selfie/{request,verify,eligibility}/route.ts`
- Create: `apps/selfie-onboarding/app/api/feedback/{route,export/route}.ts`
- Create: `apps/selfie-onboarding/app/{layout,page}.tsx`
- Create: `apps/selfie-onboarding/components/{selfie-demo,feedback-form}.tsx`
- Create: `apps/selfie-onboarding/content/{guide,code}.tsx`
- Create: `apps/selfie-onboarding/tests/*.test.ts`

- [ ] **Step 1: Write failing eligibility, feedback, and UI tests**

Assert simulator is default, live beta requires explicit server configuration, the beta badge is persistent, feedback rejects forbidden fields, CSV export requires the admin token, and all hot/warm/cold/error paths are documented.

- [ ] **Step 2: Run tests and verify failure**

Run: `pnpm --filter @world-lisbon/selfie-onboarding test`

Expected: FAIL.

- [ ] **Step 3: Implement simulator and gated live flow**

Use `selfieCheckLegacy` only behind `SELFIE_CHECK_BETA_ENABLED=true` plus required World configuration. Use `allow_legacy_proofs: true` only for this beta flow. Never claim the simulator performed liveness.

- [ ] **Step 4: Implement feedback and embedded testing guide**

Persist only the approved fields, provide CSV export, and include beta assurance, QA matrix, invite-code limitation, staging/production matching, and privacy rules.

- [ ] **Step 5: Verify**

Run: `pnpm --filter @world-lisbon/selfie-onboarding test && pnpm --filter @world-lisbon/selfie-onboarding typecheck && pnpm --filter @world-lisbon/selfie-onboarding build`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/selfie-onboarding
git commit -m "build Selfie Check demo"
```

### Task 7: Build AgentKit and x402 demo

**Files:**
- Create: `apps/agentkit-x402/app/api/resource/[[...path]]/route.ts`
- Create: `apps/agentkit-x402/app/api/demo-call/route.ts`
- Create: `apps/agentkit-x402/app/{layout,page}.tsx`
- Create: `apps/agentkit-x402/components/agent-console.tsx`
- Create: `apps/agentkit-x402/lib/{resource-server,agent-client}.ts`
- Create: `apps/agentkit-x402/content/{guide,code}.tsx`
- Create: `apps/agentkit-x402/tests/*.test.ts`

- [ ] **Step 1: Write failing protocol and UI tests**

Cover the AgentKit extension in the initial 402, signature retry, human-based shared quota, nonce replay, unregistered fallback, three free uses, fourth-call x402 fallback, failed settlement, and redacted event log.

- [ ] **Step 2: Run tests and verify failure**

Run: `pnpm --filter @world-lisbon/agentkit-x402 test`

Expected: FAIL.

- [ ] **Step 3: Implement the protected Hono resource**

Register `ExactEvmScheme`, `agentkitResourceServerExtension`, `declareAgentkitExtension`, AgentBook verification, persistent storage, facilitator client, and x402 middleware using scoped v2 `@x402/*` packages.

- [ ] **Step 4: Implement human-first client composition**

Compose `wrapFetchWithPayment(agentkit.fetch, paymentClient)` so AgentKit sees and responds to the first 402 before standard payment handles a remaining 402.

- [ ] **Step 5: Add guide, registration steps, and security notes**

Document `npx @worldcoin/agentkit-cli --llms`, registration/status, CAIP-2 networks, server-only secrets, test facilitator limitations, atomic usage, and payment fallback behavior.

- [ ] **Step 6: Verify**

Run: `pnpm --filter @world-lisbon/agentkit-x402 test && pnpm --filter @world-lisbon/agentkit-x402 typecheck && pnpm --filter @world-lisbon/agentkit-x402 build`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add apps/agentkit-x402
git commit -m "build AgentKit x402 demo"
```

### Task 8: Build credential policy lab

**Files:**
- Create: `apps/credential-policy-lab/app/{layout,page}.tsx`
- Create: `apps/credential-policy-lab/components/policy-lab.tsx`
- Create: `apps/credential-policy-lab/lib/policy-catalog.ts`
- Create: `apps/credential-policy-lab/content/{guide,code,submission}.tsx`
- Create: `apps/credential-policy-lab/tests/*.test.ts`

- [ ] **Step 1: Write failing policy tests**

Cover proof-of-human promotion, passport possession, proof plus fresh presence, gated Identity Check age example, gated Selfie Check beta, legacy warnings, strong/weak comparison, and the exact trust-event submission question.

- [ ] **Step 2: Run tests and verify failure**

Run: `pnpm --filter @world-lisbon/credential-policy-lab test`

Expected: FAIL.

- [ ] **Step 3: Implement the trust-event configurator**

Use shadcn `Select`, `Card`, `Badge`, `Tabs`, and code panels. Start from the product event and generate the minimum sufficient current policy plus copyable TypeScript.

- [ ] **Step 4: Add strong/weak examples and submission template**

Include: “What specific event in your product requires trust, what abuse becomes possible without it, and why is this World credential the minimum sufficient assurance?”

- [ ] **Step 5: Verify**

Run: `pnpm --filter @world-lisbon/credential-policy-lab test && pnpm --filter @world-lisbon/credential-policy-lab typecheck && pnpm --filter @world-lisbon/credential-policy-lab build`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/credential-policy-lab
git commit -m "build credential policy lab"
```

### Task 9: Remove NYC surfaces and align release configuration

**Files:**
- Delete: `apps/human-agent-console/`
- Delete: `apps/human-approval-desk/`
- Delete: `apps/human-gated-claim/`
- Delete: `apps/ui-test-bench/`
- Rewrite: `README.md`
- Rewrite: `docs/starter-pack.md`
- Rewrite: `docs/submission-template.md`
- Modify: `.env.example` without discarding the user’s pre-existing edit
- Create: `scripts/lisbon-release-check.mjs`
- Update: Vercel project configuration files for the four apps

- [ ] **Step 1: Write a release-shape test**

Assert no public copy references NYC, old Track A/B/C labels, MiniKit verification, or `orbLegacy` outside the explicitly gated beta/migration material.

- [ ] **Step 2: Run and verify failure**

Run: `node --test scripts/workspace-shape.test.mjs && node scripts/lisbon-release-check.mjs`

Expected: FAIL on stale files and copy.

- [ ] **Step 3: Remove obsolete apps and rewrite entry docs**

The root README lists exactly four demos, individual quickstarts, environment groups, live/simulator behavior, database migration, and verification commands.

- [ ] **Step 4: Merge environment examples carefully**

Add `DATABASE_URL`, `FEEDBACK_EXPORT_TOKEN`, Selfie beta gate, x402 facilitator/payment values, and per-app URLs while preserving the existing uncommitted `.env.example` content.

- [ ] **Step 5: Verify release shape**

Run: `node --test scripts/workspace-shape.test.mjs && node scripts/lisbon-release-check.mjs`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add README.md docs .env.example scripts apps package.json pnpm-lock.yaml vercel*.json
git commit -m "finish Lisbon starter suite"
```

### Task 10: Full verification and deployment readiness

**Files:**
- Modify only files implicated by failing checks
- Create: `output/lisbon-release-check.json` when the release script runs

- [ ] **Step 1: Run static and unit checks**

Run: `pnpm lint && pnpm typecheck && pnpm test`

Expected: all workspaces pass.

- [ ] **Step 2: Build every app**

Run: `pnpm build`

Expected: all four Next.js production builds pass.

- [ ] **Step 3: Run browser smoke tests**

Start all four apps, then run `pnpm test:browser`. Verify Demo/Guide/Code navigation, simulator labels, copy actions, primary flows, loading/error states, and no browser-console errors.

- [ ] **Step 4: Run release checks**

Run: `pnpm release:check`

Expected: public configuration gaps are reported as actionable `blocked` items; code/configuration regressions fail the command.

- [ ] **Step 5: Inspect the diff and secrets**

Run: `git diff --check && git status --short` and search tracked changes for private-key, database URL, signing-key, and API-secret values. Commit no generated `.next`, logs, or real secrets.

- [ ] **Step 6: Commit fixes**

```bash
git add <only verified source and documentation files>
git commit -m "verify Lisbon demos"
```
