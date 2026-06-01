import {
  agentAddressFromHeaders,
  evaluateAgentAccess,
  type AgentRegistry
} from "@world-starter/world-patterns";
import { NextRequest, NextResponse } from "next/server";
import { verifyMessage, type Hex } from "viem";

const demoRegisteredAgent =
  "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC" as const;

const registry: AgentRegistry = {
  async isRegistered(agentAddress) {
    const configured = new Set(
      (process.env.AGENTBOOK_REGISTERED_AGENTS ?? demoRegisteredAgent)
        .split(",")
        .map((entry) => entry.trim().toLowerCase())
    );
    return configured.has(agentAddress.toLowerCase());
  }
};

export async function GET(request: NextRequest) {
  const agentAddress = agentAddressFromHeaders(request.headers);
  const challengeUrl =
    process.env.AGENTKIT_RESOURCE_URL ??
    "http://localhost:3001/api/protected-resource";

  const decision = await evaluateAgentAccess({
    agentAddress,
    registry,
    resourceUrl: challengeUrl,
    trialUses: Number(process.env.AGENTKIT_TRIAL_USES ?? 3)
  });

  if (!decision.allowed) {
    return NextResponse.json(decision.challenge.body, {
      status: decision.challenge.status,
      headers: decision.challenge.headers
    });
  }

  const message = request.headers.get("x-world-agent-message");
  const signature = request.headers.get("x-world-agent-signature") as Hex | null;

  if (!message || !signature) {
    return NextResponse.json(
      { error: "signed agent headers required" },
      { status: 401 }
    );
  }

  const signatureValid = await verifyMessage({
    address: decision.agentAddress,
    message,
    signature
  });

  if (!signatureValid) {
    return NextResponse.json({ error: "invalid agent signature" }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    resource: "protected-support-credit",
    agentAddress: decision.agentAddress,
    checked: ["signed-agent-header", "agentbook-registration"]
  });
}
