import { describe, expect, it } from "vitest";
import {
  buildAgentKitChallenge,
  evaluateAgentAccess,
  type AgentRegistry
} from "./agentkit";

describe("AgentKit helpers", () => {
  it("returns a protected-resource challenge when no agent proof is present", async () => {
    const registry: AgentRegistry = {
      async isRegistered() {
        return false;
      }
    };

    const decision = await evaluateAgentAccess({
      agentAddress: null,
      registry
    });

    expect(decision.allowed).toBe(false);
    if (decision.allowed) {
      throw new Error("Expected missing agent to be denied");
    }
    expect(decision.reason).toBe("missing-agent");
    expect(decision.challenge.status).toBe(402);
  });

  it("allows registered human-backed agents", async () => {
    const registry: AgentRegistry = {
      async isRegistered(agentAddress) {
        return agentAddress === "0x2222222222222222222222222222222222222222";
      }
    };

    const decision = await evaluateAgentAccess({
      agentAddress: "0x2222222222222222222222222222222222222222",
      registry
    });

    expect(decision.allowed).toBe(true);
  });

  it("builds a challenge with a free trial fallback", () => {
    const challenge = buildAgentKitChallenge({
      resourceUrl: "http://localhost:3001/api/protected-resource",
      trialUses: 3
    });

    expect(challenge.status).toBe(402);
    expect(challenge.headers["x-world-agentkit-resource"]).toContain(
      "/api/protected-resource"
    );
    expect(challenge.headers["x-world-agentkit-trial-uses"]).toBe("3");
  });
});
