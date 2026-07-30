# World demos for ETHGlobal Lisbon

Four independent, desktop-first Next.js demos for building useful trust events with World. Each demo uses the shared shadcn/ui system and keeps its working flow, builder guide, and copyable code together.

## Demos

- `apps/one-human-trial` — IDKit 4 proof of human gates one free trial per person. Live verification and nullifier persistence fail closed; the simulator never grants a benefit.
- `apps/selfie-onboarding` — low-friction onboarding with a simulator-first Selfie Check beta flow, an explicit live eligibility gate, and privacy-safe feedback export.
- `apps/agentkit-x402` — a human-backed AgentKit API with a free-use quota and x402 payment fallback.
- `apps/credential-policy-lab` — runnable World ID 4 credential policies, assurance notes, and strong-versus-weak integration examples.

## Quickstart

```bash
pnpm install
cp .env.example .env.local
pnpm dev:one-human-trial       # http://localhost:3000
pnpm dev:selfie-onboarding     # http://localhost:3001
pnpm dev:agentkit-x402         # http://localhost:3002
pnpm dev:credential-policy-lab # http://localhost:3003
```

Run all four with `pnpm dev:all`.

## Configuration

Live IDKit flows require server-only World credentials and durable storage:

```bash
WORLD_APP_ID=app_...
WORLD_RP_ID=rp_...
WORLD_RP_SIGNING_KEY=0x...
WORLD_ENVIRONMENT=staging
DATABASE_URL=postgresql://...
```

Selfie Check remains in simulator mode unless beta access is confirmed and explicitly enabled:

```bash
SELFIE_CHECK_BETA_ENABLED=false
WORLD_SELFIE_ACTION=lisbon-selfie-onboarding
FEEDBACK_ADMIN_TOKEN=replace-me
```

The AgentKit + x402 live path additionally uses:

```bash
AGENTKIT_DEMO_MODE=simulator
AGENTKIT_RESOURCE_URL=http://localhost:3002/api/resource
AGENTKIT_AGENT_PRIVATE_KEY=0x...
X402_PAYMENT_PRIVATE_KEY=0x...
X402_PAY_TO_ADDRESS=0x...
X402_FACILITATOR_URL=https://...
X402_NETWORK=eip155:84532
WORLD_CHAIN_RPC_URL=https://...
```

Secrets stay server-side. Simulator outcomes are visibly labeled and cannot persist a proof use, unlock a protected resource, claim liveness, or represent payment settlement.

## Database

Create a Neon database, set `DATABASE_URL`, then apply the checked-in Drizzle migration:

```bash
pnpm --filter @world-lisbon/data exec drizzle-kit migrate --config drizzle.config.ts
```

The schema stores proof uses, AgentKit usage and nonces, and feedback without proof payloads, wallet addresses, images, or biometric data.

## Verify

```bash
node --test scripts/workspace-shape.test.mjs scripts/lisbon-release-check.test.mjs
node scripts/lisbon-release-check.mjs
pnpm test
pnpm typecheck
pnpm build
```

Builder material lives in each demo's **Guide** and **Code** tabs. The concise event submission prompt is also available in [`docs/submission-template.md`](docs/submission-template.md).
