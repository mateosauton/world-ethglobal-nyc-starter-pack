import { verifyHostedProof } from "@world-lisbon/world-patterns"

import { resolveSelfieEligibility, type SelfieEnvironment } from "../eligibility/route"

export function createSelfieVerifyHandler(env: SelfieEnvironment, fetcher: typeof fetch = fetch) {
  return async function handleSelfieVerification(request: Request): Promise<Response> {
    if (!resolveSelfieEligibility(env).liveAvailable) {
      return Response.json({ code: "beta_not_configured" }, { status: 503 })
    }

    let payload: Record<string, unknown>
    try {
      payload = (await request.json()) as Record<string, unknown>
      if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new Error("invalid")
    } catch {
      return Response.json({ code: "invalid_proof_payload" }, { status: 400 })
    }

    try {
      const verification = await verifyHostedProof<{ success?: boolean }>({
        rpId: env.WORLD_RP_ID!,
        payload,
        fetcher,
      })
      if (verification.success !== true) {
        return Response.json(
          { code: "verification_failed", verified: false },
          { status: 422 },
        )
      }
      return Response.json({ mode: "live", beta: true, verified: true })
    } catch (error) {
      return Response.json(
        { code: "verification_failed", message: error instanceof Error ? error.message : "Verification failed" },
        { status: 422 },
      )
    }
  }
}

export const POST = createSelfieVerifyHandler(process.env)
