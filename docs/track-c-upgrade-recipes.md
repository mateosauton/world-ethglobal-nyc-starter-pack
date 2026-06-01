# Track C Upgrade Recipes

Use these recipes when an existing project already works and needs a clear World integration upgrade.

## Decision tree

Choose World ID when:

- The product needs uniqueness, eligibility, fairness, reputation, anti-spam, or rate limits.
- The demo can answer: “what breaks without proof of human?”

Choose MiniKit when:

- The product should run as a Mini App in World App.
- The app needs wallet auth, World Chain transactions, payments, contacts, sharing, chat, permissions, haptics, or attestation.

Choose World Chain when:

- The app has on-chain claims, voting, mints, escrow, settlement, credentials, or attestations.
- The smart contract should hold the durable state.

Choose AgentKit when:

- An AI agent or bot calls a protected API.
- The service should admit agents that are backed by a real human while blocking anonymous automation.

Choose Human-in-the-Loop when:

- An AI workflow should pause before a sensitive action.
- The approval should be bound to World ID and the action being approved.

## Recipe: Add IDKit proof verification

1. Add an action in the World Developer Portal.
2. Generate RP context in a backend using the RP signing key.
3. Render IDKit on the client with `app_id`, `action`, and `rp_context`.
4. Send the IDKit result to a backend endpoint.
5. Forward the result to `POST https://developer.world.org/api/v4/verify/{rp_id}`.
6. Store the nullifier for the action and reject duplicates.

Expected failure modes:

- Missing `WORLD_RP_ID` or signing key.
- Expired RP context.
- Duplicate nullifier.
- Client-only verification attempt.

## Recipe: Add MiniKit wallet auth

1. Create a backend nonce endpoint.
2. Call `MiniKit.walletAuth({ nonce })`.
3. Send the signed SIWE message and signature to the backend.
4. Verify the nonce and signature.
5. Bind the wallet address to the session or proof flow.

Expected failure modes:

- Nonce mismatch.
- Expired nonce.
- Wallet address mismatch.
- Browser fallback without a Wagmi provider.

## Recipe: Add MiniKit World Chain transaction

1. Deploy a World Chain contract.
2. Allowlist the contract and function in the World Developer Portal.
3. Build calldata on the backend with the contract ABI.
4. Return `{ chainId, transactions }` to the client.
5. Call `MiniKit.sendTransaction(payload)`.
6. Track the returned user operation hash.

Expected failure modes:

- Contract not allowlisted.
- Wrong chain ID.
- Bad calldata.
- Duplicate nullifier already used.

## Recipe: Add AgentKit protected endpoint

1. Register the agent wallet in AgentBook.
2. Require signed agent request headers.
3. Verify the signature.
4. Resolve AgentBook registration.
5. Apply usage limits per human-backed agent.
6. Return a 402 challenge for missing or unregistered agents.

Expected failure modes:

- Unsigned request.
- Invalid signature.
- Unregistered agent.
- Payment fallback without AgentKit wrapping.

## Recipe: Add Human-in-the-Loop approval

1. Define the sensitive agent action.
2. Bind the World ID action string to that operation.
3. Pause the workflow and render the approval UI.
4. Verify the World ID proof before resuming.
5. Record approval ID, action, proof result, and outcome.

Expected failure modes:

- Approval action is too generic.
- Approval is not bound to the agent action.
- Workflow resumes before verification.

