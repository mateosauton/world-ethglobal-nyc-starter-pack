import { DemoShell } from "@world-lisbon/demo-ui"

import { SelfieDemo } from "../components/selfie-demo"
import { SelfieCode } from "../content/code"
import { SelfieTestingGuide } from "../content/guide"
import { resolveSelfieEligibility } from "./api/selfie/eligibility/route"

export default function Page() {
  const eligibility = resolveSelfieEligibility(process.env)
  return (
    <DemoShell
      title="Selfie Check legacy beta"
      description="A simulator-first onboarding reference with a server-gated live beta path and privacy-safe feedback collection."
      mode={eligibility.mode}
      demo={<SelfieDemo liveAvailable={eligibility.liveAvailable} />}
      guide={<SelfieTestingGuide />}
      code={<SelfieCode />}
    />
  )
}
