# ETHGlobal Lisbon Demo Suite Design

## Goal

Replace the existing NYC starter kit with four focused, independently runnable web demos for ETHGlobal Lisbon. Each demo must show a genuine World integration, provide a clearly labeled simulator fallback, and teach builders through embedded Guide and Code views.

## Product boundary

The public deliverable is exactly four desktop-first shadcn/ui applications:

1. One-per-human free trial
2. Selfie Check low-friction onboarding
3. AgentKit human-backed API access with x402 fallback
4. World ID 4.0 credential policy lab

There is no central hub, separate documentation site, UI test bench, or fifth application. Shared packages exist only as internal monorepo infrastructure. The old NYC applications and Track A/B/C presentation are removed after useful implementation patterns and tests have been migrated.

## Shared interaction model

Each app opens directly on its working demo. A compact header identifies the pattern and links to the repository. The primary navigation uses three shadcn Tabs:

- Demo: the runnable integration and an explicit event timeline.
- Guide: a short conceptual quickstart, environment checklist, strong/weak pattern notes, and failure guidance.
- Code: copyable implementation excerpts with direct source-file links.

The apps use a desktop-first layout. They remain responsively safe at narrow widths, but there is no separately designed mobile experience. The visual system uses shadcn/ui with Radix primitives, Tailwind tokens, Geist Sans and Mono, a neutral base, one restrained accent, consistent radii, and designed loading, empty, success, and error states. Generated raster art is not required because these are developer tools and the interface itself carries the explanation.

## Architecture

The pnpm monorepo contains four Next.js applications and three shared packages:

```text
apps/
  one-human-trial/
  selfie-onboarding/
  agentkit-x402/
  credential-policy-lab/
packages/
  demo-ui/
  world-patterns/
  data/
```

`demo-ui` owns shadcn component source, tokens, and the shared demo shell. `world-patterns` owns typed server/client boundaries for RP request signing, hosted proof verification, credential policies, MiniKit command separation, AgentKit, and explicit simulator fixtures. `data` owns Neon migrations and repository interfaces for proof use, AgentKit quota/nonces, and feedback.

No browser bundle receives signing keys, agent private keys, database credentials, facilitator credentials, or proof-verification secrets. Simulator results use a separate discriminated type and can never enter the live persistence or benefit-granting path.

## Demo 1: one-per-human free trial

The server creates a v4 RP context with `signRequest`. The browser opens `IDKitRequestWidget` with `proofOfHuman`, the configured signal, and an explicit legacy-proof policy. The backend forwards the returned payload unchanged to the v4 hosted verification endpoint. On success it transactionally inserts `(action, nullifier)` into Neon and grants the trial only when that insert succeeds. A uniqueness conflict returns an already-used outcome without leaking a stable identity.

The Guide contains the short IDKit 4.0 quickstart, a verification route template, action/signal binding rules, nullifier storage guidance, and a strong-versus-weak comparison. MiniKit is described as the native-command layer and IDKit as the verification layer.

## Demo 2: Selfie Check onboarding

Selfie Check remains a beta, legacy proof flow. The default experience is a World Simulator walkthrough. A server-side eligibility/configuration gate enables the genuine `selfieCheckLegacy` path only when the required app configuration is present. The interface labels simulator and live modes continuously.

The demo covers hot, warm, and cold World App paths plus cancellation, camera denial, low light, timeout, network loss, duplicate submission, deep-link return, and backend failure. Its embedded testing guide explains the beta’s lower assurance and instructs teams not to equate it with Orb proof of human.

The feedback form stores device category, OS/browser, World App state, flow path, completion, duration bucket, error code, retries, clarity/friction ratings, privacy comprehension, and free text. It rejects proof payloads, wallet addresses, images, and biometric data. A server-only admin token protects CSV export.

## Demo 3: AgentKit human-backed API access

The protected Hono resource advertises the AgentKit x402 extension. The agent client receives the 402, signs the CAIP-122/SIWE challenge, and retries. The server verifies the agent, resolves its anonymous human in AgentBook, and atomically grants three free calls per human per endpoint across all of that human’s agents. Once exhausted—or when AgentKit is unavailable or invalid—the standard x402 client performs payment and retries.

The event console shows challenge, signature, AgentBook resolution, remaining free uses, and payment fallback without logging secrets or raw signed payloads. Persistent nonce and usage repositories prevent replay and concurrent quota overspend. Local mode uses explicit fixtures; live mode uses the canonical SDK and facilitator configuration.

## Demo 4: credential policy lab

The user starts with a trust event, not a credential name. Examples include preventing repeated promotional use, requiring passport possession, requiring fresh user presence, and enforcing an age policy when Identity Check preview access is available. The app produces a recommended policy, runnable code, assurance notes, and a comparison against a weak integration.

The default runnable policies use current v4 helpers such as `proofOfHuman` and `passport`. Fresh liveness uses `require_user_presence`. Selfie Check and Identity Check are clearly labeled Beta/Preview and gated. Legacy presets appear only in migration or beta examples.

The Guide includes the submission template and the useful trust-event question: **“What specific event in your product requires trust, what abuse becomes possible without it, and why is this World credential the minimum sufficient assurance?”**

## Error handling

All integrations use typed outcomes rather than generic thrown errors at the UI boundary. The shared error model distinguishes configuration missing, simulator-only, user cancelled, proof rejected, proof replayed, duplicate human benefit, beta unavailable, AgentBook unavailable, quota exhausted, payment required, settlement failed, database unavailable, and unexpected failure.

Every asynchronous surface has a bounded loading state and retry path. A failed AgentKit verification never grants access; it falls back to payment. A failed or simulated IDKit result never grants a real benefit. Database failure fails closed for uniqueness, nonce, and quota enforcement.

## Testing and release gates

- Unit tests for RP context creation, payload forwarding, policy generation, error mapping, and simulator/live type separation.
- Database tests for unique nullifiers, atomic quota increments, nonce replay prevention, feedback validation, and CSV authorization.
- Route tests for successful, rejected, duplicated, misconfigured, and unavailable integrations.
- Browser tests for the primary flow, simulator labeling, Guide/Code navigation, copy actions, loading/error states, and absence of secret material.
- Live smoke scripts for IDKit request creation, World verification configuration, AgentKit challenge advertisement, x402 fallback configuration, Neon migrations, and public deployment health.
- `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` must pass before release.

## Delivery sequence

1. Replace workspace structure and establish shared shadcn UI.
2. Implement Neon data contracts and migrations.
3. Deliver the one-human trial vertical slice and live verification template.
4. Deliver Selfie Check simulator, gated beta integration, testing guide, and feedback form.
5. Deliver the AgentKit+x402 end-to-end path.
6. Deliver the credential policy lab and submission guidance.
7. Remove obsolete NYC surfaces, run release gates, and deploy the four apps.

## Success criteria

- A builder can clone once and run any single demo without understanding the other three.
- Each app communicates when it is using live infrastructure versus a simulator.
- Live World proof verification and human-backed API accounting happen on the server with durable replay/uniqueness controls.
- The four apps use the same restrained shadcn design language without feeling like a fifth shared product.
- The embedded material covers every requested Lisbon starter-pack topic.
