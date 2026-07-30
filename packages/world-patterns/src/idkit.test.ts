import { describe, expect, it, vi } from "vitest";
import { createRpRequest, verifyHostedProof } from "./idkit";

describe("IDKit 4 server adapters", () => {
  it("creates an RP context without returning the signing key", () => {
    const context = createRpRequest({
      rpId: "rp_lisbon",
      action: "claim-trial",
      signingKey: "0x59c6995e998f97a5a0044976f7d1f63f4c2f70d9f8f0b69b590f55f7726f6f35"
    });

    expect(context.rp_id).toBe("rp_lisbon");
    expect(context.signature).toMatch(/^0x/);
    expect(context).not.toHaveProperty("signingKey");
    expect(context).not.toHaveProperty("signing_key");
  });

  it("forwards the complete IDKit payload unchanged to hosted verification", async () => {
    const payload = {
      protocol_version: "4.0",
      nonce: "0xabc",
      action: "claim-trial",
      responses: [{ identifier: "proof_of_human", nullifier: "0x01" }],
      user_presence_completed: true,
      environment: "staging"
    } as const;
    const fetcher = vi.fn(async () =>
      Response.json({ success: true, nullifier: "0x01" })
    );

    await verifyHostedProof({ rpId: "rp_lisbon", payload, fetcher });

    expect(fetcher).toHaveBeenCalledWith(
      "https://developer.world.org/api/v4/verify/rp_lisbon",
      expect.objectContaining({ body: JSON.stringify(payload) })
    );
  });
});
