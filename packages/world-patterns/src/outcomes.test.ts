import { describe, expect, it } from "vitest";
import {
  isVerifiedWorldResult,
  type SimulatorResult,
  type VerifiedWorldResult
} from "./outcomes";

describe("World outcomes", () => {
  it("rejects simulator fixtures at the live verification boundary", () => {
    const simulated: SimulatorResult<{ nullifier: string }> = {
      ok: true,
      mode: "simulator",
      value: { nullifier: "fixture-nullifier" },
      fixture: "proof-of-human-success"
    };

    expect(isVerifiedWorldResult(simulated)).toBe(false);

    // @ts-expect-error simulator outcomes must not satisfy the live-only type
    const live: VerifiedWorldResult<{ nullifier: string }> = simulated;
    expect(live.mode).toBe("simulator");
  });
});
