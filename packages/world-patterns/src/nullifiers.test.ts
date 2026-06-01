import { describe, expect, it } from "vitest";
import { MemoryNullifierStore } from "./nullifiers";

describe("MemoryNullifierStore", () => {
  it("allows a nullifier once per action", () => {
    const store = new MemoryNullifierStore();

    expect(store.tryRecord("0x01", "one-human-one-claim")).toBe(true);
    expect(store.tryRecord("0x01", "one-human-one-claim")).toBe(false);
    expect(store.tryRecord("0x01", "another-action")).toBe(true);
  });
});

