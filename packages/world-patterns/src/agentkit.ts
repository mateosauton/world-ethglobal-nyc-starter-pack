import { isAddress, type Address } from "viem";

export type AgentRegistry = {
  isRegistered(agentAddress: Address): Promise<boolean>;
};

export type AgentKitChallenge = {
  status: 402;
  body: {
    error: "human_backed_agent_required";
    message: string;
  };
  headers: Record<string, string>;
};

export type AgentAccessDecision =
  | {
      allowed: true;
      agentAddress: Address;
    }
  | {
      allowed: false;
      reason: "missing-agent" | "unregistered-agent";
      challenge: AgentKitChallenge;
    };

export function buildAgentKitChallenge(input: {
  resourceUrl: string;
  trialUses?: number;
}): AgentKitChallenge {
  return {
    status: 402,
    body: {
      error: "human_backed_agent_required",
      message:
        "Register a human-backed agent with AgentBook or request human approval before accessing this resource."
    },
    headers: {
      "x-world-agentkit-resource": input.resourceUrl,
      "x-world-agentkit-trial-uses": String(input.trialUses ?? 0)
    }
  };
}

export async function evaluateAgentAccess(input: {
  agentAddress: Address | null;
  registry: AgentRegistry;
  resourceUrl?: string;
  trialUses?: number;
}): Promise<AgentAccessDecision> {
  const challenge = buildAgentKitChallenge({
    resourceUrl: input.resourceUrl ?? "http://localhost:3001/api/protected-resource",
    trialUses: input.trialUses
  });

  if (!input.agentAddress || !isAddress(input.agentAddress)) {
    return {
      allowed: false,
      reason: "missing-agent",
      challenge
    };
  }

  const registered = await input.registry.isRegistered(input.agentAddress);

  if (!registered) {
    return {
      allowed: false,
      reason: "unregistered-agent",
      challenge
    };
  }

  return {
    allowed: true,
    agentAddress: input.agentAddress
  };
}

export function agentAddressFromHeaders(headers: Headers): Address | null {
  const value =
    headers.get("x-world-agent-address") ??
    headers.get("x-agent-address") ??
    headers.get("x-human-backed-agent");

  return value && isAddress(value) ? (value as Address) : null;
}

