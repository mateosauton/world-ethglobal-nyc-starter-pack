import { describe, expect, it } from "vitest";
import { claimAbi, createClaimTransaction } from "./transactions";

describe("createClaimTransaction", () => {
  it("encodes the claim function for MiniKit sendTransaction", () => {
    const tx = createClaimTransaction({
      contractAddress: "0x1111111111111111111111111111111111111111",
      recipient: "0x2222222222222222222222222222222222222222",
      nullifierHash: "0x03"
    });

    expect(tx.to).toBe("0x1111111111111111111111111111111111111111");
    expect(tx.data).toMatch(/^0x/);
    expect(claimAbi[0].name).toBe("claim");
  });
});

