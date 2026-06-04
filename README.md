# World ETHGlobal NYC Starter Pack

Starter pack for World-sponsored ETHGlobal NYC hackers building with World ID 4.0, MiniKit 2.0, AgentKit, Human-in-the-Loop, and World Chain.

## What is inside

- `apps/human-gated-claim` — Track A Mini App showing World App wallet auth, IDKit proof verification, duplicate-nullifier protection, MiniKit transaction preparation/execution, and an in-app request console.
- `apps/human-agent-console` — Track B console showing a real AgentKit SDK challenge/sign/retry flow, AgentBook verification mode, and a Human-in-the-Loop approval path.
- `apps/human-approval-desk` — Focused Human-in-the-Loop app using the official message context shape, IDKit proof request, verification webhook, local diagnostics, and agent resume gate.
- `apps/ui-test-bench` — Local UI/UX test bench for comparing the starter apps across desktop and mobile frames.
- `packages/world-patterns` — Shared TypeScript helpers for env parsing, World ID verification, wallet auth, nullifier tracking, AgentKit decisions, and transaction encoding.
- `contracts` — Foundry contract, tests, and deployment script for one-human-one-claim on World Chain.
- `docs` — Docs-ready starter page, Track C upgrade recipes, submission template, workshop script, triage guide, and release checklist.

## Prerequisites

- Node.js 20+
- pnpm 9+
- Foundry 1.5+
- A World Developer Portal app with World ID 4.0 enabled
- World Chain Sepolia RPC access for deployment

## Quickstart

```bash
pnpm install
cp .env.example .env.local
pnpm test
pnpm typecheck
pnpm contracts:test
```

Run the Mini App:

```bash
pnpm dev:claim
```

Run the AgentKit console:

```bash
pnpm dev:agent
```

Run the Human-in-the-Loop approval desk:

```bash
pnpm dev:hitl
```

Run the UI/UX bench:

```bash
pnpm dev:bench
```

Run all local apps:

```bash
pnpm dev:all
```

Run the automated UI/UX smoke bench after the apps are listening on ports 3000, 3001, 3002, and 3003:

```bash
pnpm test:ui
```

## Environment

Do not commit real secrets. Put local values in `.env.local` or your deployment provider.

Required for live World ID 4.0:

```bash
NEXT_PUBLIC_WORLD_APP_ID=app_...
WORLD_RP_ID=rp_...
WORLD_RP_SIGNING_KEY=0x...
WORLD_SIGNING_KEY=0x...
WORLD_ID_ACTION=one-human-one-claim
NEXT_PUBLIC_WORLD_ID_ACTION=one-human-one-claim
```

Required for World Chain transaction flow:

```bash
NEXT_PUBLIC_WORLD_CHAIN_ID=4801
NEXT_PUBLIC_CLAIM_CONTRACT_ADDRESS=0x...
WORLD_CHAIN_RPC_URL=https://...
PRIVATE_KEY=0x...
```

Required for the AgentKit demo:

```bash
AGENTKIT_RESOURCE_URL=http://localhost:3001/api/protected-resource
AGENTKIT_NETWORK=eip155:4801
AGENTKIT_MODE=free
AGENTBOOK_VERIFIER=local-allowlist
AGENTBOOK_REGISTERED_AGENTS=0xd19a272317222597d9f9CeA28dEF53327c30A059
```

## World App vs browser mode

The examples are explicit about which paths are live and which paths are local diagnostics:

- Live IDKit requires `NEXT_PUBLIC_WORLD_APP_ID`, `WORLD_RP_ID`, and a signing key. The claim app reads `WORLD_RP_SIGNING_KEY`; the official Human-in-the-Loop package reads `WORLD_SIGNING_KEY`, and the HITL desk accepts either.
- MiniKit wallet auth and transaction execution are World App paths. Browser mode can prepare payloads and run local diagnostics, but it does not claim that a MiniKit command executed.
- AgentKit uses `createAgentkitClient` and `createAgentkitHooks`. The default AgentBook verifier is a local allowlist for repeatable testing; set `AGENTBOOK_VERIFIER=live` to use the live AgentBook lookup.
- The HITL desk returns the same AI SDK message parts consumed by `useHumanApproval`: `tool-approveAction` and `data-approval-context`.
- `apps/human-approval-desk/lib/official-hitl-tool.ts` shows the official `requestHumanAuthorization` executor that agent runtimes can wrap as a tool.

Production proof validation must happen in a backend or smart contract. The local proof path is only for diagnostics and is labeled as such in the UI.

## Useful docs

- https://docs.world.org/mini-apps
- https://docs.world.org/mini-apps/quick-start/commands
- https://docs.world.org/world-id/reference/idkit
- https://docs.world.org/agents/agent-kit/integrate
- https://docs.world.org/agents/human-in-the-loop/integrate
- https://docs.world.org/world-chain
