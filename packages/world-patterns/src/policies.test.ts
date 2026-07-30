import { CredentialRequest, passport, proofOfHuman } from "@worldcoin/idkit";
import { describe, expect, it } from "vitest";
import {
  createPassportPolicy,
  createProofOfHumanOrPassportPolicy,
  createProofOfHumanPolicy,
  createProofOfHumanWithPresencePolicy
} from "./policies";

describe("World ID 4 credential policies", () => {
  it("builds proof-of-human with the current v4 preset", () => {
    const policy = createProofOfHumanPolicy("user-123");

    expect(policy).toMatchObject({
      kind: "proof-of-human",
      protocolVersion: "4.0",
      allowLegacyProofs: false,
      requireUserPresence: false,
      preset: proofOfHuman({ signal: "user-123" })
    });
  });

  it("adds fresh user presence only when the trust event requires it", () => {
    expect(
      createProofOfHumanWithPresencePolicy("sensitive-action")
        .requireUserPresence
    ).toBe(true);
  });

  it("builds a passport credential policy", () => {
    expect(createPassportPolicy("user-123").preset).toEqual(
      passport({ signal: "user-123" })
    );
  });

  it("builds an either/or policy from SDK presets", () => {
    expect(createProofOfHumanOrPassportPolicy("user-123").constraints).toEqual({
      any: [
        CredentialRequest("proof_of_human", { signal: "user-123" }),
        CredentialRequest("passport", { signal: "user-123" })
      ]
    });
  });
});
