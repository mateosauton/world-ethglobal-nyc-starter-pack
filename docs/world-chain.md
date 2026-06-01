# World Chain Contract Notes

The Foundry project lives in `contracts`.

## Test

```bash
pnpm contracts:test
```

## Build

```bash
pnpm contracts:build
```

## Deploy to World Chain Sepolia

Set:

```bash
WORLD_CHAIN_RPC_URL=https://...
PRIVATE_KEY=0x...
```

Run:

```bash
forge script contracts/script/DeployHumanGatedClaim.s.sol \
  --rpc-url "$WORLD_CHAIN_RPC_URL" \
  --broadcast
```

After deployment:

1. Set `NEXT_PUBLIC_CLAIM_CONTRACT_ADDRESS` to the deployed address.
2. Add the contract and `claim(address,bytes32)` function to the World Developer Portal allowlist.
3. Run `pnpm dev:claim`.
4. Verify, prepare claim, and call MiniKit `sendTransaction`.

The sample contract stores one claimant per nullifier hash. If you need proof checks enforced on-chain instead of in a backend, extend the contract with World ID on-chain verification before calling `claim`.

