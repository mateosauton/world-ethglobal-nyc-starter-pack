import { describe, expect, it } from "vitest";

import { runDemoCall } from "../lib/demo-call";

describe("demo call orchestration", () => {
  it("labels unregistered AgentKit fallback before payment", async () => {
    const result = await runDemoCall({
      mode: "simulator",
      fixture: "unregistered-agent",
    });

    expect(result.mode).toBe("simulator");
    expect(result.outcome).toBe("payment-required");
    expect(result.events.map((event) => event.stage)).toEqual([
      "resource_challenge",
      "agentkit_retry",
      "payment_fallback",
    ]);
  });

  it("keeps failed settlement explicit and denies the resource", async () => {
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

  it("shows three free uses and payment on the fourth simulator call", async () => {
    const outcomes = await Promise.all(
      [1, 2, 3, 4].map((call) =>
        runDemoCall({ mode: "simulator", fixture: "trial-sequence", call }),
      ),
    );

    expect(outcomes.slice(0, 3).every((item) => item.outcome === "human-trial")).toBe(true);
    expect(outcomes[3]?.outcome).toBe("payment-settled");
  });
});
