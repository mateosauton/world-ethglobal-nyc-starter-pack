# World ETHGlobal NYC Starter Pack

Starter pack for World-sponsored ETHGlobal NYC hackers building with World ID 4.0, MiniKit 2.0, AgentKit, Human-in-the-Loop, and World Chain.

## What is inside

- `apps/human-gated-claim` — Track A Mini App showing wallet auth, IDKit proof verification, duplicate-nullifier protection, and MiniKit `sendTransaction`.
- `apps/human-agent-console` — Track B console showing protected AgentKit-style resources and a Human-in-the-Loop approval path.
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

## Environment

Do not commit real secrets. Put local values in `.env.local` or your deployment provider.

Required for live World ID 4.0:

```bash
NEXT_PUBLIC_WORLD_APP_ID=app_...
WORLD_RP_ID=rp_...
WORLD_RP_SIGNING_KEY=0x...
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
AGENTBOOK_REGISTERED_AGENTS=0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
```

## World App vs browser mode

The examples are built to run in two modes:

- World App mode uses MiniKit and IDKit directly.
- Browser mode uses local fallback buttons and mock paths so hackers can demo flows before portal credentials, app review, or device testing are ready.

Production proof validation must happen in a backend or smart contract. The local mock proof path is only for development.

## Useful docs

- https://docs.world.org/mini-apps
- https://docs.world.org/mini-apps/quick-start/commands
- https://docs.world.org/world-id/reference/idkit
- https://docs.world.org/agents/agent-kit/integrate
- https://docs.world.org/agents/human-in-the-loop/integrate
- https://docs.world.org/world-chain

