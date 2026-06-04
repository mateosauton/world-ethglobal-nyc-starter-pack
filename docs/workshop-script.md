# Workshop Script: How to Ship on World, Fast

Target length: 20 minutes.

## 0:00 - 2:00 Opening

- ETHGlobal NYC goal: build products that can continue after the weekend.
- World prizes reward meaningful World usage, not SDK decoration.
- The central test: what breaks without proof of human?

## 2:00 - 5:00 Track map

- Track A: World ID integrations with anti-sybil product mechanics.
- Track B: AgentKit and Human-in-the-Loop workflows.
- Track C: existing projects upgrading a shipped product.

## 5:00 - 9:00 Track A demo

Run:

```bash
pnpm dev:claim
```

Show:

- Wallet auth.
- World ID proof or local proof fallback.
- Duplicate nullifier protection.
- Claim transaction preparation.
- World Chain contract test.

Fallback if World App testing is unavailable:

- Use the local proof button.
- Explain where live IDKit proof verification happens.
- Show `app/api/world-id/verify/route.ts`.

## 9:00 - 13:00 World Chain path

Run:

```bash
pnpm contracts:test
```

Show:

- First claim succeeds.
- Duplicate nullifier reverts.
- Invalid recipient and nullifier fail.
- Contract allowlisting is required before MiniKit transaction flows work in production.

## 13:00 - 17:00 Track B demo

Run:

```bash
pnpm dev:agent
```

Show:

- Protected endpoint challenge for missing agent.
- Registered agent success path.
- Human approval request.
- Approval completion.

CLI demo:

```bash
pnpm --filter @world-starter/human-agent-console agent:demo
```

Focused HITL demo:

```bash
pnpm dev:hitl
```

Show:

- Signed approval context when portal credentials are present.
- Disabled live World ID path when credentials are missing.
- Local diagnostic approval and resume path.

## 17:00 - 20:00 Submission checklist

- Use `docs/submission-template.md`.
- Include the proof validation path.
- Include AgentBook registration if using AgentKit.
- Include contract address if using World Chain.
- Include the post-event plan.
