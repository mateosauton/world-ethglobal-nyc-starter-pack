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

## Choose a World Chain Target

The starter defaults to World Chain Sepolia for hackathon demos:

- Sepolia chain ID: `4801`
- Sepolia RPC: `https://worldchain-sepolia.g.alchemy.com/public`
- Sepolia explorer: `https://sepolia.worldscan.org`
- Faucet: `https://faucets.alchemy.com/faucets/world-chain-sepolia`

For a real World App mainnet run, switch the env to:

- Mainnet chain ID: `480`
- Mainnet RPC: `https://worldchain-mainnet.g.alchemy.com/public`
- Mainnet explorer: `https://worldscan.org`

Do not switch the starter to mainnet casually: deploying and testing there spends real ETH.

## Deploy the Claim Contract

Set:

```bash
NEXT_PUBLIC_WORLD_CHAIN_ID=4801
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
3. Set `CONTRACT_EXPLORER_URL` to the contract URL on the selected explorer.
4. Run `pnpm release:external` and confirm the target-chain checks pass.
5. Run `pnpm dev:claim`.
6. For live World App command testing, expose the local claim app with a public HTTPS tunnel:

```bash
tmole 3000
```

7. Put that tunnel URL in Developer Portal as the Mini App integration URL and associated domain. Vercel previews are useful for browser QA, but a local tunnel is the safer handoff for live World App command testing because it loads the exact running dev app.
8. Open the Mini App directly in World App with `worldapp://mini-app?app_id=<app_id>&path=%2F`.
   If a device cannot open custom schemes from the scanner, use the universal fallback `https://world.org/mini-app?app_id=<app_id>&path=%2F`.
9. Verify, prepare claim, and call MiniKit `sendTransaction` from World App.
10. Copy the displayed `userOpHash` and record it:

```bash
pnpm release:record-userop 0x...
pnpm release:external
```

The sample contract stores one claimant per nullifier hash. If you need proof checks enforced on-chain instead of in a backend, extend the contract with World ID on-chain verification before calling `claim`.
