import { describe, expect, it } from "vitest";

import { InMemoryProofUseRepository } from "./proof-uses";

describe("proof use repository", () => {
  it("accepts an action and nullifier pair only once", async () => {
    const repository = new InMemoryProofUseRepository();

    await expect(
      repository.consume({ action: "lisbon-free-trial", nullifier: "42" }),
    ).resolves.toBe(true);
    await expect(
      repository.consume({ action: "lisbon-free-trial", nullifier: "42" }),
    ).resolves.toBe(false);
    await expect(
      repository.consume({ action: "another-action", nullifier: "42" }),
    ).resolves.toBe(true);
  });

  it("normalizes decimal nullifiers before checking uniqueness", async () => {
    const repository = new InMemoryProofUseRepository();

    await expect(
      repository.consume({ action: "trial", nullifier: "00042" }),
    ).resolves.toBe(true);
    await expect(
      repository.consume({ action: "trial", nullifier: "42" }),
    ).resolves.toBe(false);
  });

  it("rejects non-decimal and out-of-range nullifiers", async () => {
    const repository = new InMemoryProofUseRepository();

    await expect(
      repository.consume({ action: "trial", nullifier: "0x2a" }),
    ).rejects.toThrow("decimal");
    await expect(
      repository.consume({ action: "trial", nullifier: "1".repeat(79) }),
    ).rejects.toThrow("78 digits");
  });
});
