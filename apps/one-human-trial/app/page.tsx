import { DemoShell } from "@world-lisbon/demo-ui";

import { TrialDemo } from "../components/trial-demo";
import { TrialCode } from "../content/code";
import { TrialGuide } from "../content/guide";
import { isLiveTrialConfigured } from "../lib/trial-config";

export default function Page() {
  const mode = isLiveTrialConfigured(process.env) ? "live" : "simulator";

  return (
    <DemoShell
      title="One-per-human free trial"
      description="Grant a valuable benefit once per verified human with IDKit 4 and an atomic nullifier boundary."
      mode={mode}
      demo={<TrialDemo mode={mode} />}
      guide={<TrialGuide />}
      code={<TrialCode />}
    />
  );
}
