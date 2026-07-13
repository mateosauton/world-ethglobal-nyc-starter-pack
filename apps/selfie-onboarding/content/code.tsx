import { CodePanel } from "@world-lisbon/demo-ui"

const requestCode = `// Server: issue RP context only after the explicit beta gate.
const policy = createSelfiePolicy(signal) // selfieCheckLegacy
return {
  app_id: env.WORLD_APP_ID,
  action: env.WORLD_SELFIE_ACTION,
  rp_context: createRpRequest({ rpId, action, signingKey }),
  allow_legacy_proofs: true,
  environment: env.WORLD_ENVIRONMENT,
}`

const widgetCode = `<IDKitInviteCodeRequestWidget
  app_id={config.app_id}
  action={config.action}
  rp_context={config.rp_context}
  allow_legacy_proofs={true}
  preset={selfieCheckLegacy({ signal })}
  handleVerify={(result) => fetch("/api/selfie/verify", {
    method: "POST",
    body: JSON.stringify(result), // unchanged
  })}
/>`

export function SelfieCode() {
  return <div className="space-y-5"><CodePanel title="Server eligibility gate" code={requestCode} /><CodePanel title="IDKit invite-code widget" code={widgetCode} language="tsx" /></div>
}
