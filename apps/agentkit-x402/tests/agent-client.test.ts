import { describe, expect, it } from "vitest";
import { encodePaymentRequiredHeader } from "@x402/core/http";

import {
  composeHumanFirstFetch,
  createAgentkitHeaderAwareFetch,
  redactProtocolEvent,
  type ProtocolEvent,
} from "../lib/agent-client";

describe("human-first client", () => {
  it("turns the x402 v2 header challenge into an AgentKit signed retry", async () => {
    const requests: Request[] = [];
    const challenge = {
      x402Version: 2,
      error: "payment required",
      resource: { url: "https://builder.example/api/resource/forecast" },
      accepts: [],
      extensions: {
        agentkit: {
          info: {
            domain: "builder.example",
            uri: "https://builder.example/api/resource/forecast",
            version: "1",
            nonce: "nonce123456",
            issuedAt: "2026-07-13T12:00:00.000Z",
            resources: ["https://builder.example/api/resource/forecast"],
          },
          supportedChains: [{ chainId: "eip155:84532", type: "eip191" }],
          schema: {},
        },
      },
    };
    const baseFetch: typeof fetch = async (input, init) => {
      const request = new Request(input, init);
      requests.push(request);
      if (requests.length === 1) {
        return new Response("{}", {
          status: 402,
          headers: {
            "payment-required": encodePaymentRequiredHeader(challenge),
            "content-type": "application/json",
          },
        });
      }
      return Response.json({ resource: "released" });
    };
    const fetchResource = createAgentkitHeaderAwareFetch({
      fetch: baseFetch,
      signer: {
        address: "0x1111111111111111111111111111111111111111",
        chainId: "eip155:84532",
        type: "eip191",
        async signMessage() {
          return "0xsigned";
        },
      },
    });

    const response = await fetchResource(challenge.resource.url);

    expect(response.status).toBe(200);
    expect(requests).toHaveLength(2);
    expect(requests[1]?.headers.get("agentkit")).toBeTruthy();
  });

  it("lets AgentKit retry before x402 payment fallback", async () => {
    const order: string[] = [];
    const agentkitFetch: typeof fetch = async () => {
      order.push("agentkit:initial");
      order.push("agentkit:signed-retry");
      return new Response("payment required", { status: 402 });
    };
    const wrapPayment = (humanFirstFetch: typeof fetch): typeof fetch =>
      async (input, init) => {
        order.push("payment:observe");
        const response = await humanFirstFetch(input, init);
        if (response.status === 402) order.push("payment:sign");
        return new Response("paid", { status: 200 });
      };

    const fetchResource = composeHumanFirstFetch(agentkitFetch, wrapPayment);
    const response = await fetchResource("https://builder.example/api/resource/forecast");

    expect(response.status).toBe(200);
    expect(order).toEqual([
      "payment:observe",
      "agentkit:initial",
      "agentkit:signed-retry",
      "payment:sign",
    ]);
  });

  it("does not invoke payment when the human trial succeeds", async () => {
    let paid = false;
    const fetchResource = composeHumanFirstFetch(
      async () => new Response("free", { status: 200 }),
      (humanFirstFetch) => async (input, init) => {
        const response = await humanFirstFetch(input, init);
        if (response.status === 402) paid = true;
        return response;
      },
    );

    expect((await fetchResource("https://builder.example/resource")).status).toBe(200);
    expect(paid).toBe(false);
  });
});

describe("event logging", () => {
  it("redacts signatures, payment headers, wallet addresses, and human ids", () => {
    const event: ProtocolEvent = {
      stage: "agentkit_retry",
      status: "failed",
      detail: "signature 0xabc for wallet 0x2222222222222222222222222222222222222222",
      secret: "payment-signature",
      humanId: "private-human-id",
    };

    const serialized = JSON.stringify(redactProtocolEvent(event));

    expect(serialized).not.toContain("0xabc");
    expect(serialized).not.toContain("0x2222222222222222222222222222222222222222");
    expect(serialized).not.toContain("payment-signature");
    expect(serialized).not.toContain("private-human-id");
    expect(serialized).toContain("[redacted]");
  });
});
