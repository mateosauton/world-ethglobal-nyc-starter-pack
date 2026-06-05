import { createAgentkitClient, type AgentkitFetchEvent } from "@worldcoin/agentkit";
import { privateKeyToAccount } from "viem/accounts";

const baseUrl =
  process.env.AGENTKIT_RESOURCE_URL ??
  "http://localhost:3001/api/protected-resource";
const privateKey =
  (process.env.AGENT_DEMO_PRIVATE_KEY as `0x${string}` | undefined) ??
  "0x59c6995e998f97a5a0044966f094538f6263707c05c09d5ab2a329c41f1b2c0d";
const unregisteredPrivateKey =
  (process.env.AGENT_DEMO_UNREGISTERED_PRIVATE_KEY as `0x${string}` | undefined) ??
  "0x5de4111afa1a4b5d31a6c7c8a4e1e5f4b7f47364cba46f3e04b6d71fd33d1f9a";

async function main() {
  await request("missing-agent");
  await agentkitRequest("signed-unregistered-agent", unregisteredPrivateKey);
  await agentkitRequest("signed-registered-agent", privateKey);
}

async function agentkitRequest(label: string, key: `0x${string}`) {
  const account = privateKeyToAccount(key);
  const events: AgentkitFetchEvent[] = [];
  const client = createAgentkitClient({
    onEvent: (event) => events.push(event),
    signer: {
      address: account.address,
      chainId: process.env.AGENTKIT_NETWORK ?? "eip155:480",
      signMessage(message) {
        return account.signMessage({ message });
      },
      type: "eip191"
    }
  });

  const response = await client.fetch(baseUrl);
  console.log(`\n${label}: ${response.status}`);
  console.log(JSON.stringify({ events, body: await safeJson(response) }, null, 2));
}

async function request(label: string) {
  const response = await fetch(baseUrl);
  console.log(`\n${label}: ${response.status}`);
  console.log(JSON.stringify(await safeJson(response), null, 2));
}

async function safeJson(response: Response) {
  const text = await response.text();
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
