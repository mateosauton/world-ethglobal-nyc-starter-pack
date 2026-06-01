import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { worldchainSepolia } from "viem/chains";

const baseUrl = process.env.AGENTKIT_RESOURCE_URL ?? "http://localhost:3001/api/protected-resource";
const privateKey =
  (process.env.AGENT_DEMO_PRIVATE_KEY as `0x${string}` | undefined) ??
  "0x59c6995e998f97a5a0044966f094538f6263707c05c09d5ab2a329c41f1b2c0d";
const unregisteredPrivateKey =
  (process.env.AGENT_DEMO_UNREGISTERED_PRIVATE_KEY as `0x${string}` | undefined) ??
  "0x5de4111afa1a4b5d31a6c7c8a4e1e5f4b7f47364cba46f3e04b6d71fd33d1f9a";
async function main() {
  await request("missing-agent", {});

  const unregistered = privateKeyToAccount(unregisteredPrivateKey);
  const unregisteredClient = createWalletClient({
    account: unregistered,
    chain: worldchainSepolia,
    transport: http()
  });
  const unregisteredMessage = `human-backed-agent:${Date.now()}`;
  const unregisteredSignature = await unregisteredClient.signMessage({
    message: unregisteredMessage
  });

  await request("signed-unregistered-agent", {
    "x-world-agent-address": unregistered.address,
    "x-world-agent-message": unregisteredMessage,
    "x-world-agent-signature": unregisteredSignature
  });

  const account = privateKeyToAccount(privateKey);
  const client = createWalletClient({
    account,
    chain: worldchainSepolia,
    transport: http()
  });
  const message = `human-backed-agent:${Date.now()}`;
  const signature = await client.signMessage({ message });

  await request("signed-registered-agent", {
    "x-world-agent-address": account.address,
    "x-world-agent-message": message,
    "x-world-agent-signature": signature
  });
}

async function request(label: string, headers: Record<string, string>) {
  const response = await fetch(baseUrl, { headers });
  console.log(`\n${label}: ${response.status}`);
  console.log(await response.text());
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
