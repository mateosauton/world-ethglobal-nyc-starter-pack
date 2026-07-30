import { describe, expect, it, vi } from "vitest";

import { createDemoCallHandler } from "../app/api/demo-call/route";
import {
  HUMAN_BACKED_AGENT_ADDRESS,
  NON_HUMAN_BACKED_AGENT_ADDRESS,
} from "../lib/demo-call";

const handler = createDemoCallHandler({});

function post(body: unknown) {
  return new Request("http://localhost/api/demo-call", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("demo call route", () => {
  it("releases an AgentKit trial resource for the human-backed simulator address", async () => {
    const response = await handler(
      post({
        mode: "simulator",
        flow: "agentkit-access",
        agentAddress: HUMAN_BACKED_AGENT_ADDRESS,
        call: 1,
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      outcome: "human-trial",
      resource: expect.any(Object),
    });
  });

  it("holds a non-human-backed simulator action without execution", async () => {
    const response = await handler(
      post({
        mode: "simulator",
        flow: "human-approval",
        agentAddress: NON_HUMAN_BACKED_AGENT_ADDRESS,
        approval: true,
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      outcome: "action-held",
      events: expect.not.arrayContaining([expect.objectContaining({ stage: "action_execution" })]),
    });
  });

  it("rejects live approval flow requests", async () => {
    const response = await handler(post({ mode: "live", flow: "human-approval" }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ error: "live_flow_unsupported" });
  });

  it("rejects unrecognized simulator agent addresses", async () => {
    const response = await handler(
      post({
        mode: "simulator",
        flow: "agentkit-access",
        agentAddress: "0x1111111111111111111111111111111111111111",
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "invalid_demo_request" });
  });

  it.each([0, -1, 1.5])(
    "rejects invalid simulator call value %s without producing a trial event",
    async (call) => {
      const response = await handler(
        post({
          mode: "simulator",
          flow: "agentkit-access",
          agentAddress: HUMAN_BACKED_AGENT_ADDRESS,
          call,
        }),
      );
      const responseText = await response.text();

      expect(response.status).toBe(400);
      expect(JSON.parse(responseText)).toEqual({ error: "invalid_demo_request" });
      expect(responseText).not.toContain(`free use ${call} of 3`);
    },
  );

  it("keeps sensitive live failure diagnostics out of the public response", async () => {
    const sensitiveError =
      "request to https://secret.example/resource failed for wallet 0xabc123 with signature-sensitive-material";
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const liveHandler = createDemoCallHandler({
      environment: {
        NODE_ENV: "test",
        AGENTKIT_RESOURCE_URL: "https://secret.example/resource",
        AGENTKIT_AGENT_PRIVATE_KEY: `0x${"01".repeat(32)}`,
        X402_PAYMENT_PRIVATE_KEY: `0x${"02".repeat(32)}`,
      },
      liveFetch: async () => {
        throw new Error(sensitiveError);
      },
    });

    try {
      const response = await liveHandler(post({ mode: "live", flow: "agentkit-access" }));
      const responseText = await response.text();
      const responseBody = JSON.parse(responseText);

      expect(response.status).toBe(502);
      expect(responseBody).toMatchObject({
        mode: "live",
        outcome: "settlement-failed",
        message: "Live AgentKit/x402 request failed.",
        events: expect.arrayContaining([
          expect.objectContaining({
            stage: "payment_fallback",
            status: "failed",
            detail: "No settlement confirmation; protected resource denied",
          }),
        ]),
      });
      expect(responseText).not.toContain("secret.example");
      expect(responseText).not.toContain("0xabc123");
      expect(responseText).not.toContain("signature-sensitive-material");
      expect(consoleError).toHaveBeenCalledWith(
        "Live AgentKit/x402 request failed",
        expect.objectContaining({ message: sensitiveError }),
      );
    } finally {
      consoleError.mockRestore();
    }
  });
});
