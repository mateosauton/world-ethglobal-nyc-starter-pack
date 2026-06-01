import { describe, expect, it, vi } from "vitest";
import { verifyWorldIdProof } from "./world-id";

describe("verifyWorldIdProof", () => {
  it("forwards the IDKit result to the World Developer Portal v4 verify endpoint", async () => {
    const fetcher = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          success: true,
          results: [{ success: true, nullifier: "0xabc" }],
          action: "one-human-one-claim",
          nullifier: "0xabc"
        }),
        { status: 200 }
      );
    });

    const result = await verifyWorldIdProof({
      rpId: "rp_demo",
      action: "one-human-one-claim",
      idkitResponse: {
        protocol_version: "3.0",
        nonce: "0xabc",
        action: "one-human-one-claim",
        responses: []
      },
      fetcher
    });

    expect(fetcher).toHaveBeenCalledWith(
      "https://developer.world.org/api/v4/verify/rp_demo",
      expect.objectContaining({
        method: "POST",
        headers: { "content-type": "application/json" }
      })
    );
    expect(result.success).toBe(true);
    expect(result.nullifier).toBe("0xabc");
  });
});

