import { describe, expect, it, vi } from "vitest";

import { createRequestHandler } from "../app/api/idkit/request/route";
import { TRIAL_ACTION, TRIAL_SIGNAL } from "../lib/trial-config";

describe("IDKit RP request route", () => {
  it("creates a signed request without exposing the signing key", async () => {
    const createContext = vi.fn(() => ({
      rp_id: "rp_lisbon",
      nonce: "nonce-1",
      created_at: 1,
      expires_at: 2,
      signature: "signed"
    }));
    const post = createRequestHandler({
      environment: {
        WORLD_APP_ID: "app_lisbon",
        WORLD_RP_ID: "rp_lisbon",
        WORLD_RP_SIGNING_KEY: "super-secret"
      },
      createContext
    });

    const response = await post();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(createContext).toHaveBeenCalledWith({
      rpId: "rp_lisbon",
      action: TRIAL_ACTION,
      signingKey: "super-secret"
    });
    expect(body).toEqual({
      app_id: "app_lisbon",
      action: TRIAL_ACTION,
      signal: TRIAL_SIGNAL,
      rp_context: expect.objectContaining({ signature: "signed" })
    });
    expect(JSON.stringify(body)).not.toContain("super-secret");
  });

  it("fails closed when live configuration is missing", async () => {
    const post = createRequestHandler({ environment: {} });

    const response = await post();

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "Live IDKit is not configured",
      code: "missing_configuration"
    });
  });
});
