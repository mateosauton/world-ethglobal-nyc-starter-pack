# World Starter Pack for ETHGlobal NYC

This starter pack helps teams build launchable World-native products during ETHGlobal NYC. It focuses on three sponsor tracks:

- Track A: World ID integrations where proof of human is a real product constraint.
- Track B: AgentKit integrations where agentic workflows are safer because humans are verified.
- Track C: Existing projects that are upgrading a real product with World tools.

## Start here

1. Clone the starter repo.
2. Run `pnpm install`.
3. Copy `.env.example` to `.env.local`.
4. Run `pnpm test`, `pnpm typecheck`, and `pnpm contracts:test`.
5. Pick the track path below.
6. Run `pnpm dev:bench` to compare both starter apps during UI review.

## Track A: World ID Mini App

Use `apps/human-gated-claim` when the app needs one-person-one-action semantics.

What it demonstrates:

- MiniKit 2.0 provider setup.
- MiniKit wallet auth with nonce verification.
- IDKit World ID 4.0 proof request and backend verification.
- Duplicate nullifier rejection.
- MiniKit `sendTransaction` payload generation for World Chain.
- Browser fallback for local demos.

Good project patterns:

- One-per-human access to tickets, grants, allowlists, credits, or claims.
- Sybil-resistant voting, allocation, matching, reputation, or rate limits.
- Human-only marketplaces or communities where spam resistance is essential.

## Track B: AgentKit and Human-in-the-Loop

Use `apps/human-agent-console` when agents should be allowed to act only if backed by a verified human.

What it demonstrates:

- Protected resource endpoint.
- Signed agent headers.
- AgentBook-style registration check.
- 402 challenge response for missing or unregistered agents.
- Local agent client demo.
- Human-in-the-Loop approval request and approval completion.

Good project patterns:

- Human-gated support, research, onboarding, moderation, and ops agents.
- Delegated actions that need user approval before execution.
- Incentive loops where agents help humans complete tasks without opening sybil abuse.

## Track C: Existing project upgrades

Use `docs/track-c-upgrade-recipes.md` when a team already has a product and wants a focused World upgrade.

Good upgrade goals:

- Add World ID to eligibility, uniqueness, reputation, or rate limits.
- Add MiniKit commands for wallet auth or World Chain transactions.
- Add AgentKit to a protected API that should accept human-backed agents.
- Add Human-in-the-Loop to pause risky AI actions for verified approval.

## Requirements checklist

- Working application: Mini App or non-Mini App.
- Proof validation in a backend or smart contract.
- World ID justification: explain what breaks without proof of human.
- MiniKit SDK command usage when building a Mini App.
- World Chain contracts for on-chain activity.
- Agent registered in AgentBook for AgentKit submissions.
- No gambling or chance-based Mini Apps.

## Submission assets

Use `docs/submission-template.md` before submitting. Judges should be able to see:

- Demo URL.
- Repo URL.
- Track selection.
- World tools used.
- Proof validation path.
- Contract addresses, if any.
- AgentBook registration, if any.
- Post-event plan.

## UI/UX test bench

Run the bench locally:

```bash
pnpm dev:all
```

Open `http://localhost:3002` to compare the Track A and Track B apps in desktop and mobile frames. Run `pnpm test:ui` to capture screenshots and check image loading, overflow, placeholder text, and the primary local flows.
