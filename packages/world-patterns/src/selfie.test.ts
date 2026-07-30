import { selfieCheckLegacy } from "@worldcoin/idkit";
import { describe, expect, it } from "vitest";
import { createSelfiePolicy, isSelfieCheckAvailable } from "./selfie";

describe("Selfie Check beta policy", () => {
  it("is explicitly marked as an eligibility-gated legacy beta", () => {
    expect(createSelfiePolicy("user-123")).toEqual({
      kind: "selfie-check",
      lifecycle: "legacy-beta",
      protocolVersion: "3.0",
      requiresEligibility: true,
      allowLegacyProofs: true,
      requireUserPresence: true,
      preset: selfieCheckLegacy({ signal: "user-123" })
    });
  });

  it("requires an explicit server-side eligibility flag", () => {
    expect(isSelfieCheckAvailable(undefined)).toBe(false);
    expect(isSelfieCheckAvailable("false")).toBe(false);
    expect(isSelfieCheckAvailable("true")).toBe(true);
  });
});
