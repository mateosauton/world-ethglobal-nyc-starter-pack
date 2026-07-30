import { describe, expect, it } from "vitest";

import {
  InMemoryFeedbackRepository,
  authorizeAdminToken,
  parseSelfieFeedback,
} from "./feedback";

const validFeedback = {
  path: "warm" as const,
  device: "desktop" as const,
  osBrowser: "macOS / Chrome",
  worldAppState: "installed" as const,
  completed: true,
  durationBucket: "30-60s" as const,
  errorCode: null,
  retryCount: 1,
  clarityRating: 4,
  frictionRating: 2,
  privacyComprehension: "clear" as const,
  comments: "A retry hint would help.",
};

describe("Selfie Check feedback", () => {
  it("validates and stores allowlisted fields", async () => {
    const repository = new InMemoryFeedbackRepository();
    const feedback = parseSelfieFeedback(validFeedback);

    const saved = await repository.create(feedback);

    expect(saved.id).toMatch(/^feedback-/);
    expect(saved).toMatchObject(validFeedback);
    expect(saved.createdAt).toBeInstanceOf(Date);
  });

  it.each(["proof", "wallet", "walletAddress", "image", "selfie", "biometric"])(
    "rejects forbidden identity field %s",
    (field) => {
      expect(() =>
        parseSelfieFeedback({ ...validFeedback, [field]: "sensitive" }),
      ).toThrow();
    },
  );

  it("rejects malformed ratings and unbounded text", () => {
    expect(() =>
      parseSelfieFeedback({ ...validFeedback, clarityRating: 0 }),
    ).toThrow();
    expect(() =>
      parseSelfieFeedback({ ...validFeedback, comments: "x".repeat(2_001) }),
    ).toThrow();
  });

  it("authorizes only an exact admin token", () => {
    expect(authorizeAdminToken("correct-token", "correct-token")).toBe(true);
    expect(authorizeAdminToken("correct-token", "wrong-token")).toBe(false);
    expect(authorizeAdminToken("short", "much-longer-token")).toBe(false);
    expect(authorizeAdminToken(undefined, "correct-token")).toBe(false);
    expect(authorizeAdminToken("correct-token", undefined)).toBe(false);
  });
});
