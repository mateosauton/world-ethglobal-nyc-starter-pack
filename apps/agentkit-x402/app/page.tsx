import { DemoShell } from "@world-lisbon/demo-ui";

import { AgentConsole } from "../components/agent-console";
import { CodeContent } from "../content/code";
import { GuideContent } from "../content/guide";

export default function Page() {
  const live = process.env.AGENTKIT_DEMO_MODE === "live";

  return (
    <DemoShell
      title="AgentKit human-backed API access"
      description="Try human-backed access first, then pay only when the shared three-use human trial is exhausted."
      mode={live ? "live" : "simulator"}
      demo={<AgentConsole mode={live ? "live" : "simulator"} />}
      guide={<GuideContent />}
      code={<CodeContent />}
    />
  );
}
