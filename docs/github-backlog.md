# GitHub Backlog

Repo: https://github.com/mateosauton/world-ethglobal-nyc-starter-pack

Use this as the source list for GitHub Issues or a GitHub Project board. Keep issue titles short and copy acceptance criteria into each issue body.

## Project 1: Repository Foundation

### Issue: Scaffold pnpm monorepo
Labels: `foundation`, `developer-experience`

Outcome: A cloneable workspace for apps, shared packages, contracts, and docs.

Acceptance criteria:
- Root `package.json`, `pnpm-workspace.yaml`, shared `tsconfig`, `.gitignore`, and `.env.example` exist.
- `pnpm install`, `pnpm test`, and `pnpm typecheck` are documented.
- Secrets are excluded from tracked files.

### Issue: Add contributor quickstart
Labels: `docs`, `developer-experience`

Outcome: Hackers can run the starter pack without hidden setup.

Acceptance criteria:
- `README.md` explains prerequisites, install, env setup, and local run commands.
- The World Developer Portal values are explained without exposing real secrets.
- The quickstart separates browser dev mode from World App testing.

### Issue: Add release checklist
Labels: `release`, `docs`

Outcome: Maintainers can verify the pack before publishing to hackers.

Acceptance criteria:
- Checklist covers install, tests, app smoke tests, contract tests, and docs links.
- Checklist includes secret scan and Developer Portal allowlist checks.
- Checklist includes final ETHGlobal rules review.

## Project 2: Track A - World ID Mini App

### Issue: Build human-gated claim Mini App
Labels: `track-a`, `mini-app`, `world-id`

Outcome: A working Mini App where one verified human can perform one claim.

Acceptance criteria:
- App uses MiniKit provider and detects World App vs browser mode.
- UI explains the claim state without relying on instructional filler text.
- Browser mode has a safe mock path for local demos.

### Issue: Add IDKit verification API
Labels: `track-a`, `world-id`, `backend`

Outcome: Proof validation occurs server-side as required by the hackathon plan.

Acceptance criteria:
- API forwards IDKit result payloads to Developer Portal v4 verify endpoint.
- API rejects reused nullifiers for the same action.
- Tests cover success, verification failure, and duplicate nullifier behavior.

### Issue: Add wallet auth flow
Labels: `track-a`, `minikit`, `backend`

Outcome: Hackers have a current MiniKit wallet-auth reference.

Acceptance criteria:
- Client requests a nonce from the backend.
- Client calls `MiniKit.walletAuth()`.
- Backend verifies the SIWE payload and nonce.
- Tests cover nonce mismatch and valid payload paths.

## Project 3: World Chain Contracts

### Issue: Add Foundry contract project
Labels: `contracts`, `world-chain`

Outcome: A full dapp stack for World Chain activity.

Acceptance criteria:
- Foundry project builds with `forge build`.
- Contract prevents duplicate claims per nullifier hash.
- Contract emits an event for successful claims.

### Issue: Add contract tests
Labels: `contracts`, `testing`

Outcome: Contract behavior is pinned before frontend integration.

Acceptance criteria:
- Tests cover first claim success.
- Tests cover duplicate nullifier rejection.
- Tests cover invalid recipient or invalid nullifier rejection.

### Issue: Add World Chain deployment script
Labels: `contracts`, `deployment`

Outcome: Hackers can deploy to World Chain Sepolia.

Acceptance criteria:
- Deploy script reads RPC URL and private key from env vars.
- Docs include World Chain Sepolia chain ID, RPC, explorer, and faucet links.
- Docs explain Developer Portal contract allowlisting for MiniKit transactions.

## Project 4: Track B - AgentKit

### Issue: Build protected AgentKit resource
Labels: `track-b`, `agentkit`, `backend`

Outcome: A protected endpoint demonstrates human-backed agent access.

Acceptance criteria:
- Endpoint returns an AgentKit challenge when no valid agent header is present.
- Endpoint validates signed AgentKit headers.
- Endpoint checks AgentBook registration before granting access.

### Issue: Add AgentKit client demo
Labels: `track-b`, `agentkit`, `developer-experience`

Outcome: Hackers can run a local agent request against the protected resource.

Acceptance criteria:
- Demo signs with a local agent wallet.
- Demo shows how to register the wallet with `npx @worldcoin/agentkit-cli`.
- Demo prints success, unregistered-agent, and payment-fallback states.

### Issue: Add Human-in-the-Loop approval demo
Labels: `track-b`, `human-in-the-loop`, `ai`

Outcome: The starter pack covers agent workflows that pause for World ID approval.

Acceptance criteria:
- UI renders a pending agent action.
- Approval is bound to a World ID action string.
- Docs explain when to use Human-in-the-Loop versus AgentBook.

## Project 5: Track C - Existing Project Upgrade Path

### Issue: Add integration decision tree
Labels: `track-c`, `docs`

Outcome: Existing teams can choose the right World integration quickly.

Acceptance criteria:
- Decision tree covers World ID, MiniKit, AgentKit, and World Chain.
- Each path links to the relevant example in the repo.
- Each path includes what judges should see in the demo.

### Issue: Add upgrade recipes
Labels: `track-c`, `docs`, `developer-experience`

Outcome: Teams can copy focused recipes into existing products.

Acceptance criteria:
- Recipes include IDKit verification, wallet auth, MiniKit transaction, AgentKit protected endpoint, and Human-in-the-Loop approval.
- Each recipe lists required env vars and expected failure modes.
- Recipes call out proof validation in backend or smart contract.

### Issue: Add ETHGlobal submission template
Labels: `track-c`, `docs`, `hackathon`

Outcome: Submissions clearly show meaningful World usage and post-event intent.

Acceptance criteria:
- Template asks what breaks without World ID.
- Template asks how MiniKit commands or AgentKit are used.
- Template asks for contract addresses, AgentBook registration, demo URL, and post-event plan.

## Project 6: Docs and Workshop

### Issue: Write docs-ready starter pack page
Labels: `docs`, `release`

Outcome: Content can be copied into World docs or linked from the sponsor page.

Acceptance criteria:
- Page includes track overview, quickstart, examples, and support links.
- Page reflects current MiniKit v2 and IDKit guidance.
- Page includes anti-gambling/chance-based Mini App note.

### Issue: Write 20-minute workshop script
Labels: `docs`, `workshop`

Outcome: Sponsors can record “How to ship on World, fast.”

Acceptance criteria:
- Script fits 20 minutes.
- Script includes live demo flow and fallback if World App testing is unavailable.
- Script ends with submission and judging checklist.

### Issue: Add judge/support triage guide
Labels: `docs`, `hackathon`

Outcome: On-site support can quickly improve weak integrations.

Acceptance criteria:
- Guide includes common weak World ID uses and stronger reframes.
- Guide includes AgentKit fit checks.
- Guide includes launchability and post-event follow-up prompts.

