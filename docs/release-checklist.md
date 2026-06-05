# Release Checklist

Run this before publishing the starter pack.

Last audit: 2026-06-05.

Release status: not publish-ready until the unchecked live World App and World Chain gates are completed.

Continuation audit: local apps, Vercel preview deployments, Developer Portal app/RP/signing configuration, and World Chain Sepolia RPC are reachable. Signed RP context generation now works for the claim app and the HITL approval desk. `pnpm release:external` still fails the on-chain release gates: the configured deployer has `0` wei on World Chain Sepolia, the claim contract address is still the dummy value, no portal allowlist confirmation has been recorded, no MiniKit `sendTransaction` user operation hash has been captured, and no explorer link is available.

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
- [x] Vercel preview deployments build from the monorepo root.
  Evidence: previews are ready for claim (`https://human-gated-claim-1euasleym-mateo-sautons-projects.vercel.app`), agent (`https://human-agent-console-5e14d2ln6-mateo-sautons-projects.vercel.app`), HITL (`https://human-approval-desk-h3gbisupl-mateo-sautons-projects.vercel.app`), and bench (`https://ui-test-bench-e0yw7idd6-mateo-sautons-projects.vercel.app`).
- [x] No real secrets are committed.
  Evidence: tracked env files are limited to `.env.example`; scan found no provided portal key or real app ID.
- [x] `.env.example` has placeholders only.
  Evidence: Developer Portal, private key, signing key, and AgentBook values are placeholders; the only concrete values are public defaults or dummy local values.

## Track A

- [x] `pnpm dev:claim` starts.
  Evidence: `http://localhost:3000` returned 200 from the detached `world-claim` screen session.
- [ ] Live World ID verify is tested with a signed RP context.
  Blocked: signed context generation works (`GET /api/world-id/context` returns `configured:true`, `mode:signed`, and the expected RP ID), but a live IDKit proof has not been completed inside World App. `pnpm release:external` now passes the app ID, RP ID, and signing key gates.
- [x] Local proof is visibly labeled as diagnostics.
  Evidence: `pnpm test:ui` verified the claim flow text `Local proof accepted for diagnostics only.`
- [x] Wallet auth nonce endpoint works.
  Evidence: `GET /api/wallet-auth/nonce` returned a nonce.
- [x] World ID verify endpoint rejects duplicates.
  Evidence: deterministic local diagnostic nullifier returns first success and second `409 Conflict`; `pnpm test:ui` now includes `claim-duplicate-nullifier`.
- [x] Browser claim path prepares payload without claiming execution.
  Evidence: `pnpm test:ui` verified `Prepared MiniKit transaction payload. Open in World App to execute.`
- [ ] World App claim path executes MiniKit `sendTransaction`.
  Blocked: requires opening the deployed Mini App inside World App with a live wallet and an allowlisted claim contract. Browser evidence only proves payload preparation. `pnpm release:external` currently fails `World App sendTransaction user operation captured`.

## Contracts

- [ ] World Chain Sepolia deployment works.
  Blocked: deployer configuration is present and the Sepolia RPC returns chain ID `4801`, but `pnpm release:external` reports the configured deployer has `0` wei on World Chain Sepolia.
- [ ] Contract address is added to `.env.local`.
  Blocked: `.env.local` still contains the dummy `NEXT_PUBLIC_CLAIM_CONTRACT_ADDRESS`; `pnpm release:external` fails `Claim contract address configured` and deployed-code checks.
- [ ] Contract function is allowlisted in the World Developer Portal.
  Blocked: Developer Portal API access is configured, but no deployed contract address is available to allowlist. `pnpm release:external` currently fails `Developer Portal contract allowlist confirmed`.
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
- [x] Live World ID approval signs RP context when portal credentials are present.
  Evidence: `POST /api/hitl/propose` returned `configured:true`, `mode:signed-context`, the expected RP ID, and `tool-approveAction` plus `data-approval-context` parts.
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
