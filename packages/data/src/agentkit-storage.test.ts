import { describe, expect, it } from "vitest";

import { InMemoryAgentKitStorage } from "./agentkit-storage";

describe("AgentKit storage", () => {
  it("atomically limits concurrent usage per endpoint and human", async () => {
    const storage = new InMemoryAgentKitStorage();

    const attempts = await Promise.all(
      Array.from({ length: 20 }, () =>
        storage.tryIncrementUsage("weather", "human-7", 3),
      ),
    );

    expect(attempts.filter((attempt) => attempt.allowed)).toHaveLength(3);
    expect(attempts.filter((attempt) => !attempt.allowed)).toHaveLength(17);
    expect(Math.max(...attempts.map((attempt) => attempt.usage))).toBe(3);
  });

  it("keeps quotas separate by endpoint and human", async () => {
    const storage = new InMemoryAgentKitStorage();

    await storage.tryIncrementUsage("weather", "human-a", 1);

    await expect(
      storage.tryIncrementUsage("weather", "human-b", 1),
    ).resolves.toEqual({ allowed: true, usage: 1, limit: 1 });
    await expect(
      storage.tryIncrementUsage("stocks", "human-a", 1),
    ).resolves.toEqual({ allowed: true, usage: 1, limit: 1 });
  });

  it("claims a nonce only once before it expires", async () => {
    const storage = new InMemoryAgentKitStorage();
    const now = new Date("2026-07-13T12:00:00.000Z");
    const expiresAt = new Date("2026-07-13T12:05:00.000Z");

    await expect(storage.claimNonce("nonce-1", expiresAt, now)).resolves.toBe(true);
    await expect(storage.claimNonce("nonce-1", expiresAt, now)).resolves.toBe(false);
  });

  it("rejects a nonce that is already expired", async () => {
    const storage = new InMemoryAgentKitStorage();
    const now = new Date("2026-07-13T12:05:00.000Z");

    await expect(
      storage.claimNonce("nonce-1", new Date("2026-07-13T12:04:59.000Z"), now),
    ).resolves.toBe(false);
  });
});
