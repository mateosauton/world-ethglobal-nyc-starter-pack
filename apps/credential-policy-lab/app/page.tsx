import { DemoShell } from "@world-lisbon/demo-ui";

import { PolicyLab } from "../components/policy-lab";
import { PolicyCode } from "../content/code";
import { PolicyGuide } from "../content/guide";

export default function Page() {
  return (
    <DemoShell
      title="World ID 4 credential policy lab"
      description="Turn a useful product trust event into the minimum sufficient World ID 4 policy—with explicit gates for preview and legacy beta credentials."
      mode="simulator"
      demo={<PolicyLab />}
      guide={<PolicyGuide />}
      code={<PolicyCode />}
    />
  );
}
