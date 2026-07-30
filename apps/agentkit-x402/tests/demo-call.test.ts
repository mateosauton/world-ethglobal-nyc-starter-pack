import { describe, expect, it } from "vitest";

import {
  HUMAN_BACKED_AGENT_ADDRESS,
  NON_HUMAN_BACKED_AGENT_ADDRESS,
  runDemoCall,
} from "../lib/demo-call";

describe("demo call orchestration", () => {
  it("grants the human-backed agent an AgentKit trial before x402 fallback", async () => {
    expect(HUMAN_BACKED_AGENT_ADDRESS).toBe("0xbEBB5B46fFDA7E7494595E826FC4D4a61ce5f6A6");
    expect(NON_HUMAN_BACKED_AGENT_ADDRESS).toBe("0xDBf913F12d403540A83f091D46bDC34bf04c4Fe1");

    const [first, fourth] = await Promise.all(
      [1, 4].map((call) =>
        runDemoCall({
          mode: "simulator",
          flow: "agentkit-access",
          agentAddress: HUMAN_BACKED_AGENT_ADDRESS,
          call,
        }),
      ),
    );

    expect(first.outcome).toBe("human-trial");
    expect(fourth.outcome).toBe("payment-settled");
    expect(fourth.events.map((event) => event.stage)).toContain("payment_fallback");
  });

  it("does not release the AgentKit resource to the non-human-backed agent", async () => {
    const result = await runDemoCall({
      mode: "simulator",
      flow: "agentkit-access",
      agentAddress: NON_HUMAN_BACKED_AGENT_ADDRESS,
    });

    expect(result.outcome).toBe("payment-required");
    expect(result.resource).toBeUndefined();
    expect(result.events).toContainEqual({
      stage: "agent_identity",
      status: "failed",
      detail: expect.any(String),
    });
    expect(result.events.at(-1)).toMatchObject({
      stage: "payment_fallback",
      status: "pending",
    });
  });

  it("keeps the legacy failed-settlement fixture denied", async () => {
    const result = await runDemoCall({
      mode: "simulator",
      fixture: "failed-settlement",
    });

    expect(result.outcome).toBe("settlement-failed");
    expect(result.resource).toBeUndefined();
    expect(result.events.at(-1)).toMatchObject({
      stage: "payment_fallback",
      status: "failed",
    });
  });

  it("requires a distinct human approval before the human-backed agent action executes", async () => {
    const pending = await runDemoCall({
      mode: "simulator",
      flow: "human-approval",
      agentAddress: HUMAN_BACKED_AGENT_ADDRESS,
      approval: false,
    });
    const approved = await runDemoCall({
      mode: "simulator",
      flow: "human-approval",
      agentAddress: HUMAN_BACKED_AGENT_ADDRESS,
      approval: true,
    });

    expect(pending.outcome).toBe("approval-pending");
    expect(pending.action?.status).toBe("awaiting-human-approval");
    expect(pending.events.some((event) => event.stage === "action_execution")).toBe(false);
    expect(approved.outcome).toBe("approval-granted");
    expect(approved.action).toEqual({
      status: "simulated-executed",
      label: "Publish supplier payout",
    });
    expect(approved.events).toContainEqual({
      stage: "action_execution",
      status: "success",
      detail: expect.any(String),
    });
    expect(approved.events.map((event) => event.stage)).toContain("human_approval");
  });

  it("holds the non-human-backed agent action even when approval is supplied", async () => {
    const result = await runDemoCall({
      mode: "simulator",
      flow: "human-approval",
      agentAddress: NON_HUMAN_BACKED_AGENT_ADDRESS,
      approval: true,
    });

    expect(result.outcome).toBe("action-held");
    expect(result.action).toEqual({
      status: "held",
      label: "Publish supplier payout",
    });
    expect(result.events.some((event) => event.stage === "action_execution")).toBe(false);
  });
});
