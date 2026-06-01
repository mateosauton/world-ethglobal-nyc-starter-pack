# Release Checklist

Run this before publishing the starter pack.

## Repo

- [ ] `pnpm install` succeeds from a clean clone.
- [ ] `pnpm test` passes.
- [ ] `pnpm typecheck` passes.
- [ ] `pnpm contracts:test` passes.
- [ ] `pnpm contracts:build` passes.
- [ ] No real secrets are committed.
- [ ] `.env.example` has placeholders only.

## Track A

- [ ] `pnpm dev:claim` starts.
- [ ] Browser fallback proof works.
- [ ] Wallet auth nonce endpoint works.
- [ ] World ID verify endpoint rejects duplicates.
- [ ] Claim transaction payload uses the deployed contract address.

## Contracts

- [ ] World Chain Sepolia deployment works.
- [ ] Contract address is added to `.env.local`.
- [ ] Contract function is allowlisted in the World Developer Portal.
- [ ] Explorer link is captured for submissions.

## Track B

- [ ] `pnpm dev:agent` starts.
- [ ] Missing agent receives a 402 challenge.
- [ ] Registered demo agent succeeds.
- [ ] Human approval request and approval completion work.
- [ ] AgentBook registration instructions are visible.

## Docs

- [ ] Starter page reflects final ETHGlobal track copy.
- [ ] Submission template asks for World ID justification.
- [ ] Workshop script fits 20 minutes.
- [ ] Triage guide matches sponsor judging priorities.
- [ ] Anti-gambling/chance-based Mini App note is present.

