import { DemoShell } from "@world-lisbon/demo-ui";

import { AgentConsole } from "../components/agent-console";
import { CodeContent } from "../content/code";
import { GuideContent } from "../content/guide";

export default function Page() {
  const live = process.env.AGENTKIT_DEMO_MODE === "live";

  return (
    <DemoShell
      title="AgentKit policy-distinct flows"
      description="Compare AgentKit protected-resource access with a separately human-approved simulated action."
      mode={live ? "live" : "simulator"}
      demo={<AgentConsole mode={live ? "live" : "simulator"} />}
      guide={<GuideContent />}
      code={<CodeContent />}
    />
  );
}
