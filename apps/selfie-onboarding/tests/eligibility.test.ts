import { describe, expect, it, vi } from "vitest"

import { resolveSelfieEligibility } from "../app/api/selfie/eligibility/route"
import { createSelfieRequestHandler } from "../app/api/selfie/request/route"
import { createSelfieVerifyHandler } from "../app/api/selfie/verify/route"

const liveEnv = {
  SELFIE_CHECK_BETA_ENABLED: "true",
  WORLD_APP_ID: "app_lisbon",
  WORLD_RP_ID: "rp_lisbon",
  WORLD_RP_SIGNING_KEY: "0x59c6995e998f97a5a0044976f7d1f63f4c2f70d9f8f0b69b590f55f7726f6f35",
  WORLD_SELFIE_ACTION: "lisbon-selfie-onboarding",
  WORLD_ENVIRONMENT: "staging",
}

describe("Selfie Check eligibility gate", () => {
  it("defaults to a simulator that makes no liveness claim", () => {
    expect(resolveSelfieEligibility({})).toEqual({
      mode: "simulator",
      liveAvailable: false,
      beta: true,
      label: "Selfie Check legacy beta",
      reason: "Live beta access is not configured on this server.",
    })
  })

  it("requires the explicit flag and every server-only World setting", () => {
    expect(resolveSelfieEligibility(liveEnv)).toMatchObject({ mode: "live", liveAvailable: true })
    expect(resolveSelfieEligibility({ ...liveEnv, WORLD_RP_SIGNING_KEY: undefined })).toMatchObject({
      mode: "simulator",
      liveAvailable: false,
    })
  })
})

describe("gated live routes", () => {
  it("refuses to sign requests unless beta access is fully configured", async () => {
    const response = await createSelfieRequestHandler({})(
      new Request("http://demo/api/selfie/request", {
        method: "POST",
        body: JSON.stringify({ signal: "tester-1" }),
      }),
    )

    expect(response.status).toBe(503)
    expect(await response.json()).toMatchObject({ mode: "simulator", code: "beta_not_configured" })
  })

  it("creates a legacy-only RP request without exposing the signing key", async () => {
    const response = await createSelfieRequestHandler(liveEnv)(
      new Request("http://demo/api/selfie/request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ signal: "tester-1" }),
      }),
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toMatchObject({
      mode: "live",
      beta: true,
      app_id: "app_lisbon",
      action: "lisbon-selfie-onboarding",
      environment: "staging",
      allow_legacy_proofs: true,
      preset: { lifecycle: "legacy-beta" },
    })
    expect(JSON.stringify(body)).not.toContain(liveEnv.WORLD_RP_SIGNING_KEY)
  })

  it("forwards the complete proof unchanged only when the live gate is open", async () => {
    const payload = { protocol_version: "3.0", nonce: "0xabc", responses: [{ identifier: "face" }] }
    const fetcher = vi.fn(async () => Response.json({ success: true })) as typeof fetch
    const response = await createSelfieVerifyHandler(liveEnv, fetcher)(
      new Request("http://demo/api/selfie/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      }),
    )

    expect(response.status).toBe(200)
    expect(fetcher).toHaveBeenCalledWith(
      "https://developer.world.org/api/v4/verify/rp_lisbon",
      expect.objectContaining({ body: JSON.stringify(payload) }),
    )
  })

  it("fails closed when the hosted verifier returns an unsuccessful result", async () => {
    const fetcher = vi.fn(async () =>
      Response.json({ success: false, results: [] }),
    ) as typeof fetch
    const response = await createSelfieVerifyHandler(liveEnv, fetcher)(
      new Request("http://demo/api/selfie/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ protocol_version: "3.0", responses: [] }),
      }),
    )

    expect(response.status).toBe(422)
    expect(await response.json()).toMatchObject({
      code: "verification_failed",
      verified: false,
    })
  })
})
