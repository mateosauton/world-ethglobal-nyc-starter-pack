import { NextRequest, NextResponse } from "next/server";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { worldchainSepolia } from "viem/chains";

const registeredPrivateKey =
  "0x59c6995e998f97a5a0044966f094538f6263707c05c09d5ab2a329c41f1b2c0d" as const;
const unregisteredPrivateKey =
  "0x5de4111afa1a4b5d31a6c7c8a4e1e5f4b7f47364cba46f3e04b6d71fd33d1f9a" as const;

export async function POST(request: NextRequest) {
  const { mode } = (await request.json()) as {
    mode: "missing-agent" | "unregistered-agent" | "allowed";
  };

  if (mode === "missing-agent") {
    const response = await fetch(new URL("/api/protected-resource", request.url));
    return NextResponse.json({
      status: response.status,
      mode,
      body: await response.json()
    });
  }

  const account = privateKeyToAccount(
    mode === "allowed" ? registeredPrivateKey : unregisteredPrivateKey
  );
  const client = createWalletClient({
    account,
    chain: worldchainSepolia,
    transport: http()
  });
  const message = `agent-demo:${Date.now()}`;
  const signature = await client.signMessage({ message });
  const agentAddress = account.address;

  const response = await fetch(new URL("/api/protected-resource", request.url), {
    headers: {
      "x-world-agent-address": agentAddress,
      "x-world-agent-message": message,
      "x-world-agent-signature": signature
    }
  });

  return NextResponse.json({
    status: response.status,
    mode,
    body: await response.json()
  });
}
