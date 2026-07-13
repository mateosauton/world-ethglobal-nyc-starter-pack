import { createRpRequest, createSelfiePolicy } from "@world-lisbon/world-patterns"

import { resolveSelfieEligibility, type SelfieEnvironment } from "../eligibility/route"

export function createSelfieRequestHandler(env: SelfieEnvironment) {
  return async function handleSelfieRequest(request: Request): Promise<Response> {
    const eligibility = resolveSelfieEligibility(env)
    if (!eligibility.liveAvailable) {
      return Response.json(
        {
          mode: "simulator",
          code: "beta_not_configured",
          message: "Selfie Check live beta is unavailable; use the labeled simulator.",
        },
        { status: 503 },
      )
    }

    let signal: string
    try {
      const body = (await request.json()) as { signal?: unknown }
      if (typeof body.signal !== "string" || body.signal.length < 1 || body.signal.length > 128) {
        throw new Error("invalid signal")
      }
      signal = body.signal
    } catch {
      return Response.json({ code: "invalid_signal", message: "A short opaque signal is required." }, { status: 400 })
    }

    const rpContext = createRpRequest({
      rpId: env.WORLD_RP_ID!,
      action: env.WORLD_SELFIE_ACTION!,
      signingKey: env.WORLD_RP_SIGNING_KEY!,
    })
    const policy = createSelfiePolicy(signal)

    return Response.json({
      mode: "live",
      beta: true,
      app_id: env.WORLD_APP_ID,
      action: env.WORLD_SELFIE_ACTION,
      environment: env.WORLD_ENVIRONMENT,
      rp_context: rpContext,
      allow_legacy_proofs: true,
      preset: {
        kind: policy.kind,
        lifecycle: policy.lifecycle,
        protocol_version: policy.protocolVersion,
        signal,
      },
    })
  }
}

export const POST = createSelfieRequestHandler(process.env)
