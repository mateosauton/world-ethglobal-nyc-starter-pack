import { createAgentkitClient, type AgentkitFetchEvent } from "@worldcoin/agentkit";
import { NextRequest, NextResponse } from "next/server";
import { privateKeyToAccount } from "viem/accounts";

const registeredPrivateKey =
  "0x59c6995e998f97a5a0044966f094538f6263707c05c09d5ab2a329c41f1b2c0d" as const;
const unregisteredPrivateKey =
  "0x5de4111afa1a4b5d31a6c7c8a4e1e5f4b7f47364cba46f3e04b6d71fd33d1f9a" as const;

type DemoMode = "missing-agent" | "signed-unregistered" | "signed-allowed";

export async function POST(request: NextRequest) {
  const { mode } = (await request.json()) as { mode: DemoMode };
  const resourceUrl = new URL("/api/protected-resource", request.url).toString();

  if (mode === "missing-agent") {
    const response = await fetch(resourceUrl);
    return NextResponse.json({
      body: await safeJson(response),
      mode,
      status: response.status
    });
  }

  const account = privateKeyToAccount(
    mode === "signed-allowed" ? registeredPrivateKey : unregisteredPrivateKey
  );
  const clientEvents: AgentkitFetchEvent[] = [];
  const client = createAgentkitClient({
    onEvent: (event) => clientEvents.push(event),
    signer: {
      address: account.address,
      chainId: process.env.AGENTKIT_NETWORK ?? "eip155:480",
      signMessage(message) {
        return account.signMessage({ message });
      },
      type: "eip191"
    }
  });

  const response = await client.fetch(resourceUrl);

  return NextResponse.json({
    account: account.address,
    body: await safeJson(response),
    clientEvents,
    mode,
    status: response.status
  });
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
