import { describe, expect, it } from "vitest";

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
});
