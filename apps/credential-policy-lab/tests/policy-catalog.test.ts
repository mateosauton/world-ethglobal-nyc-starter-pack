import { describe, expect, it } from "vitest";

import {
  TRUST_EVENT_QUESTION,
  compareIntegrations,
  getPolicyRecommendation
} from "../lib/policy-catalog";

describe("credential policy catalog", () => {
  it("defaults a one-per-human promotion to a v4 proof-of-human policy", () => {
    const result = getPolicyRecommendation("one-per-human-promotion");

    expect(result.credential).toBe("Proof of Human");
    expect(result.protocol).toBe("World ID 4.0");
    expect(result.availability).toBe("ready");
    expect(result.generatedCode).toContain("createProofOfHumanPolicy");
    expect(result.generatedCode).toContain('signal: "promotion-claim"');
  });

  it("uses passport possession only when the event needs a document", () => {
    const result = getPolicyRecommendation("passport-holder-access");

    expect(result.credential).toBe("Passport");
    expect(result.minimumAssurance).toContain("document possession");
    expect(result.generatedCode).toContain("createPassportPolicy");
  });

  it("adds fresh presence to proof of human for a sensitive approval", () => {
    const result = getPolicyRecommendation("sensitive-human-approval");

    expect(result.credential).toBe("Proof of Human + fresh presence");
    expect(result.policy).toMatchObject({ requireUserPresence: true });
    expect(result.generatedCode).toContain("createProofOfHumanWithPresencePolicy");
  });

  it("keeps the Identity Check age example gated while it is in preview", () => {
    const gated = getPolicyRecommendation("age-eligibility");
    const enabled = getPolicyRecommendation("age-eligibility", {
      identityCheckEnabled: true
    });

    expect(gated.availability).toBe("preview");
    expect(gated.enabled).toBe(false);
    expect(enabled.enabled).toBe(true);
    expect(enabled.generatedCode).toContain('type: "minimum_age", value: 18');
    expect(enabled.warnings.join(" ")).toContain("preview");
  });

  it("keeps Selfie Check gated and labels its legacy v3 requirement", () => {
    const gated = getPolicyRecommendation("low-friction-liveness");
    const enabled = getPolicyRecommendation("low-friction-liveness", {
      selfieCheckEnabled: true
    });

    expect(gated.availability).toBe("legacy-beta");
    expect(gated.enabled).toBe(false);
    expect(enabled.enabled).toBe(true);
    expect(enabled.generatedCode).toContain("selfieCheckLegacy");
    expect(enabled.generatedCode).toContain("allow_legacy_proofs: true");
    expect(enabled.warnings.join(" ")).toMatch(/v3|legacy/i);
  });

  it("contrasts a useful trust event with verification theatre", () => {
    expect(compareIntegrations.strong).toContain("minimum sufficient");
    expect(compareIntegrations.strong).toContain("server");
    expect(compareIntegrations.weak).toContain("verify button");
  });

  it("exports the exact useful trust-event submission question", () => {
    expect(TRUST_EVENT_QUESTION).toBe(
      "What specific event in your product requires trust, what abuse becomes possible without it, and why is this World credential the minimum sufficient assurance?"
    );
  });
});
