export type SelfieEnvironment = Record<string, string | undefined>

export type SelfieEligibility = {
  mode: "live" | "simulator"
  liveAvailable: boolean
  beta: true
  label: "Selfie Check legacy beta"
  reason: string
}

const requiredLiveSettings = [
  "WORLD_APP_ID",
  "WORLD_RP_ID",
  "WORLD_RP_SIGNING_KEY",
  "WORLD_SELFIE_ACTION",
  "WORLD_ENVIRONMENT",
] as const

export function resolveSelfieEligibility(env: SelfieEnvironment): SelfieEligibility {
  const configured =
    env.SELFIE_CHECK_BETA_ENABLED === "true" &&
    requiredLiveSettings.every((key) => Boolean(env[key])) &&
    (env.WORLD_ENVIRONMENT === "staging" || env.WORLD_ENVIRONMENT === "production")

  return {
    mode: configured ? "live" : "simulator",
    liveAvailable: configured,
    beta: true,
    label: "Selfie Check legacy beta",
    reason: configured
      ? "This server is explicitly enrolled and configured for the beta."
      : "Live beta access is not configured on this server.",
  }
}

export async function GET() {
  return Response.json(resolveSelfieEligibility(process.env))
}
