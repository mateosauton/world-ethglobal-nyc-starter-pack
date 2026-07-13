import { describe, expect, it, vi } from "vitest";

import { InMemoryProofUseRepository } from "@world-lisbon/data";

import { createVerifyHandler } from "../app/api/idkit/verify/route";
import { TRIAL_ACTION, TRIAL_SIGNAL } from "../lib/trial-config";

const signalHash = "0xsignal";

function proof(nullifier = "0x2a") {
  return {
    protocol_version: "4.0",
    nonce: "nonce-1",
    action: TRIAL_ACTION,
    responses: [
      {
        identifier: "proof_of_human",
        signal_hash: signalHash,
        nullifier,
        proof: ["0xproof"],
        issuer_schema_id: 1,
        expires_at_min: 2
      }
    ],
    user_presence_completed: true,
    environment: "staging"
  };
}

function request(payload: unknown, mode?: "simulator") {
  return new Request(
    `http://localhost/api/idkit/verify${mode ? `?mode=${mode}` : ""}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    }
  );
}

describe("IDKit verification route", () => {
  it("forwards the IDKit payload unchanged and grants a unique trial", async () => {
    const repository = new InMemoryProofUseRepository();
    const verify = vi.fn(async ({ payload }: { payload: unknown }) => {
      expect(payload).toEqual(proof());
      return { success: true, results: [{ nullifier: "0x2a" }] };
    });
    const post = createVerifyHandler({
      environment: { WORLD_RP_ID: "rp_lisbon" },
      repository,
      verify,
      hashSignal: () => signalHash
    });

    const response = await post(request(proof()));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      mode: "live",
      granted: true
    });
    expect(verify).toHaveBeenCalledWith({
      rpId: "rp_lisbon",
      payload: proof()
    });
  });

  it("rejects a duplicate proof without granting twice", async () => {
    const repository = new InMemoryProofUseRepository();
    const post = createVerifyHandler({
      environment: { WORLD_RP_ID: "rp_lisbon" },
      repository,
      verify: async () => ({ success: true, results: [{ nullifier: "0x2a" }] }),
      hashSignal: () => signalHash
    });

    expect((await post(request(proof()))).status).toBe(200);
    const duplicate = await post(request(proof()));

    expect(duplicate.status).toBe(409);
    await expect(duplicate.json()).resolves.toMatchObject({
      ok: false,
      code: "trial_already_used",
      granted: false
    });
  });

  it("keeps simulator fixtures unable to verify, persist, or grant", async () => {
    const repository = { consume: vi.fn(async () => true) };
    const verify = vi.fn();
    const post = createVerifyHandler({
      environment: {},
      repository,
      verify,
      hashSignal: () => signalHash
    });

    const response = await post(request({ fixture: "proof-of-human-success" }, "simulator"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      mode: "simulator",
      fixture: "proof-of-human-success",
      granted: false,
      message: "Simulation complete. No trial was granted."
    });
    expect(verify).not.toHaveBeenCalled();
    expect(repository.consume).not.toHaveBeenCalled();
  });

  it("fails closed when verification configuration is missing", async () => {
    const post = createVerifyHandler({
      environment: {},
      repository: new InMemoryProofUseRepository(),
      verify: vi.fn(),
      hashSignal: () => signalHash
    });

    const response = await post(request(proof()));

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      code: "missing_configuration",
      granted: false
    });
  });

  it("requires an explicit successful hosted verification result", async () => {
    const repository = new InMemoryProofUseRepository();
    const post = createVerifyHandler({
      environment: { WORLD_RP_ID: "rp_lisbon" },
      repository,
      verify: async () => ({ results: [{ nullifier: "0x2a" }] }),
      hashSignal: () => signalHash
    });

    const response = await post(request(proof()));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      code: "verification_failed",
      granted: false
    });
  });

  it("rejects a proof whose action or signal is not server-bound", async () => {
    const verify = vi.fn();
    const post = createVerifyHandler({
      environment: { WORLD_RP_ID: "rp_lisbon" },
      repository: new InMemoryProofUseRepository(),
      verify,
      hashSignal: () => signalHash
    });
    const wrong = { ...proof(), action: "attacker-action" };

    const response = await post(request(wrong));

    expect(response.status).toBe(400);
    expect(verify).not.toHaveBeenCalled();
  });
});
