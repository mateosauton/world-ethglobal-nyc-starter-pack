# Release Checklist

Run this before publishing the starter pack.

Last audit: 2026-06-04.

Release status: not publish-ready until the unchecked external World App, World Chain, and Developer Portal gates are completed.

Continuation audit: local apps and World Chain Sepolia RPC are reachable, but no usable portal/deployer credentials are available in this runtime. The configured Developer Portal MCP key has a `0x` prefix; the official Developer Portal MCP docs state portal API keys start with `api_`, and a direct MCP `listTools` attempt returned `MCP error -32001: API key is required.`

External gate command: run `pnpm release:external` after filling `.env.local` with the real World app, RP, deployer, portal, allowlist, user operation, and explorer evidence. The command writes `output/release-external-checks.json` and exits non-zero until those release gates are satisfied.

## Repo

- [x] `pnpm install` succeeds from a clean clone.
  Evidence: `pnpm install` completed with lockfile up to date.
- [x] `pnpm test` passes.
  Evidence: `packages/world-patterns` 10 tests passed and `apps/human-approval-desk` 3 tests passed.
- [x] `pnpm typecheck` passes.
  Evidence: all workspace typecheck scripts completed.
- [x] `pnpm contracts:test` passes.
  Evidence: `HumanGatedClaimTest` ran 4 tests, all passed.
- [x] `pnpm contracts:build` passes.
  Evidence: `forge build -C contracts` completed.
- [x] `pnpm test:ui` passes with apps running on ports 3000, 3001, 3002, and 3003.
  Evidence: `output/ui-ux/summary.json` reports no failures across desktop, mobile, local flows, and duplicate-nullifier API check.
- [x] No real secrets are committed.
  Evidence: tracked env files are limited to `.env.example`; scan found no provided portal key or real app ID.
- [x] `.env.example` has placeholders only.
  Evidence: Developer Portal, private key, signing key, and AgentBook values are placeholders; the only concrete values are public defaults or dummy local values.

## Track A

- [x] `pnpm dev:claim` starts.
  Evidence: `http://localhost:3000` returned 200 from the detached `world-claim` screen session.
- [ ] Live World ID verify is tested with a signed RP context.
  Blocked: current local context returned `configured:false`, `mode:missing-signing-key`, `rp_id:rp_local_dev`, and `hasSigningKey:false`. Requires a real World app, RP ID, signing key, and a live IDKit proof. `pnpm release:external` currently fails `World app id configured`, `World RP id configured`, and `World RP signing key configured`.
- [x] Local proof is visibly labeled as diagnostics.
  Evidence: `pnpm test:ui` verified the claim flow text `Local proof accepted for diagnostics only.`
- [x] Wallet auth nonce endpoint works.
  Evidence: `GET /api/wallet-auth/nonce` returned a nonce.
- [x] World ID verify endpoint rejects duplicates.
  Evidence: deterministic local diagnostic nullifier returns first success and second `409 Conflict`; `pnpm test:ui` now includes `claim-duplicate-nullifier`.
- [x] Browser claim path prepares payload without claiming execution.
  Evidence: `pnpm test:ui` verified `Prepared MiniKit transaction payload. Open in World App to execute.`
- [ ] World App claim path executes MiniKit `sendTransaction`.
  Blocked: requires opening the Mini App inside World App with a live wallet and allowlisted contract. Browser evidence only proves payload preparation. World docs confirm MiniKit commands must be tested inside World App and contract interactions must be allowlisted in Developer Portal. `pnpm release:external` currently fails `World App sendTransaction user operation captured`.

## Contracts

- [ ] World Chain Sepolia deployment works.
  Blocked: `.env.local` is missing, so no deployer key or target deployment config is available. `forge build` and tests pass locally, and `pnpm release:external` confirms the public Sepolia RPC returns chain ID `4801` while failing deployer key and balance checks.
- [ ] Contract address is added to `.env.local`.
  Blocked: `.env.local` is missing; `pnpm release:external` currently fails `Claim contract address configured`.
- [ ] Contract function is allowlisted in the World Developer Portal.
  Blocked: no deployed contract address was available to allowlist. Developer Portal MCP is configured but the available key is not a usable `api_` portal key, so portal permissions could not be inspected or changed from this session. `pnpm release:external` currently fails `Developer Portal API key configured` and `Developer Portal contract allowlist confirmed`.
- [ ] Explorer link is captured for submissions.
  Blocked: no World Chain Sepolia deployment was performed in this audit; `pnpm release:external` currently fails `World Chain explorer link captured`.

## Track B

- [x] `pnpm dev:agent` starts.
  Evidence: `http://localhost:3001` returned 200 from the detached `world-agent` screen session.
- [x] Missing agent receives a 402 AgentKit extension challenge.
  Evidence: `GET /api/protected-resource` returned `402 Payment Required` with `agentkit_required`.
- [x] Signed unregistered agent is rejected.
  Evidence: `POST /api/agent-demo` with `signed-unregistered` returned status `401` and `agent_not_verified`.
- [x] Registered demo agent succeeds through `createAgentkitClient` and `createAgentkitHooks`.
  Evidence: `POST /api/agent-demo` with `signed-allowed` returned status `200`, `ok:true`, and hook events.
- [x] Human approval request and approval completion work.
  Evidence: `pnpm test:ui` verified request and local approval completion in the agent flow.
- [x] AgentBook registration instructions are visible.
  Evidence: `docs/submission-template.md` includes `npx @worldcoin/agentkit-cli status <agent-address>`.

## Human-in-the-Loop Desk

- [x] `pnpm dev:hitl` starts on port 3003.
  Evidence: `http://localhost:3003` returned 200 from the detached `world-hitl` screen session.
- [x] Approval proposal returns `tool-approveAction` and `data-approval-context` parts.
  Evidence: `POST /api/hitl/propose` returned both part types.
- [x] Live World ID approval is disabled when portal credentials are missing.
  Evidence: `POST /api/hitl/propose` returned `configured:false` and `local-diagnostic-context`.
- [x] Local diagnostic approval and resume flow work.
  Evidence: `pnpm test:ui` verified HITL request, local diagnostic approval, and resume.
- [x] Server console shows request and response payloads.
  Evidence: HITL UI includes `Server console`; `pnpm test:ui` exercised the flow and captured screenshots.

## Docs

- [x] Starter page reflects final ETHGlobal track copy.
  Evidence: `docs/starter-pack.md` covers Track A, Track B, Track C, and the focused HITL app with no stale Track D copy.
- [x] Submission template asks for World ID justification.
  Evidence: `docs/submission-template.md` includes `What breaks without World ID?`
- [x] Workshop script fits 20 minutes.
  Evidence: `docs/workshop-script.md` is explicitly structured from 0:00 to 20:00.
- [x] Triage guide matches sponsor judging priorities.
  Evidence: `docs/support-triage-guide.md` covers proof validation, proof-of-human strength, AgentBook, HITL, and launchability.
- [x] Anti-gambling/chance-based Mini App note is present.
  Evidence: `docs/starter-pack.md` includes `No gambling or chance-based Mini Apps.`

## UI/UX Bench

- [x] `pnpm dev:bench` starts on port 3002.
  Evidence: `http://localhost:3002` returned 200 from the detached `world-bench` screen session.
- [x] Bench iframes show the starter apps.
  Evidence: `pnpm test:ui` covered claim, agent, HITL, and bench pages.
- [x] Desktop and mobile frame toggles work.
  Evidence: `pnpm test:ui` captured desktop and mobile screenshots for each target.
- [x] `output/ui-ux/summary.json` reports no failures after `pnpm test:ui`.
  Evidence: `failures` is an empty array.
