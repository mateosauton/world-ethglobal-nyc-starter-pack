import { describe, expect, it } from "vitest";

import { InMemoryAgentKitStorage } from "@world-lisbon/data";
import { decodePaymentRequiredHeader } from "@x402/core/http";
import type { FacilitatorClient } from "@x402/core/server";

import {
  createAgentkitStorageAdapter,
  createProtectedResourceApp,
  type AgentBookLookup,
} from "../lib/resource-server";

const registeredAgentBook: AgentBookLookup = {
  async lookupHuman() {
    return "human-lisbon-1";
  },
};

const testFacilitator: FacilitatorClient = {
  async getSupported() {
    return {
      kinds: [{ x402Version: 2, scheme: "exact", network: "eip155:84532" }],
      extensions: [],
      signers: {},
    };
  },
  async verify() {
    throw new Error("verify should not run for an initial challenge");
  },
  async settle() {
    throw new Error("settle should not run for an initial challenge");
  },
};

describe("protected resource", () => {
  it("advertises the AgentKit extension on the initial 402", async () => {
    const app = createProtectedResourceApp({
      agentBook: registeredAgentBook,
      storage: createAgentkitStorageAdapter(new InMemoryAgentKitStorage()),
      resourceUrl: "https://builder.example/api/resource/forecast",
      payTo: "0x1111111111111111111111111111111111111111",
      facilitator: testFacilitator,
    });

    const response = await app.request("/forecast");
    const paymentRequired = decodePaymentRequiredHeader(
      response.headers.get("payment-required")!,
    );

    expect(response.status).toBe(402);
    expect(response.headers.get("payment-required")).toBeTruthy();
    expect(paymentRequired.extensions?.agentkit).toMatchObject({
      mode: { type: "free-trial", uses: 3 },
    });
    expect(
      (paymentRequired.extensions?.agentkit as { supportedChains: unknown[] })
        .supportedChains,
    ).toContainEqual({
      chainId: "eip155:84532",
      type: "eip191",
    });
  });

  it("claims a nonce once through durable storage", async () => {
    const adapter = createAgentkitStorageAdapter(new InMemoryAgentKitStorage());

    expect(await adapter.hasUsedNonce?.("one-time-nonce")).toBe(false);
    expect(await adapter.hasUsedNonce?.("one-time-nonce")).toBe(true);
  });

  it("shares the three-use quota by anonymous human id", async () => {
    const adapter = createAgentkitStorageAdapter(new InMemoryAgentKitStorage());

    expect(await adapter.tryIncrementUsage("/forecast", "same-human", 3)).toBe(true);
    expect(await adapter.tryIncrementUsage("/forecast", "same-human", 3)).toBe(true);
    expect(await adapter.tryIncrementUsage("/forecast", "same-human", 3)).toBe(true);
    expect(await adapter.tryIncrementUsage("/forecast", "same-human", 3)).toBe(false);
  });
});
