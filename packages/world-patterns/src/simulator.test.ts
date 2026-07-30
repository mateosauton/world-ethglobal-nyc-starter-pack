import { describe, expect, it } from "vitest";
import { createSimulatorResult } from "./simulator";

describe("simulator fixtures", () => {
  it("always carries a visible fixture identity and simulator mode", () => {
    expect(
      createSimulatorResult("proof-of-human-success", { nullifier: "fixture" })
    ).toEqual({
      ok: true,
      mode: "simulator",
      fixture: "proof-of-human-success",
      value: { nullifier: "fixture" }
    });
  });
});
