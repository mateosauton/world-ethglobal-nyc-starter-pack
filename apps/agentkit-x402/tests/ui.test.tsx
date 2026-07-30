import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AgentConsole } from "../components/agent-console";
import Page from "../app/page";
import { GuideContent } from "../content/guide";

describe("AgentKit demo page", () => {
  it("renders shadcn Demo, Guide, and Code surfaces with simulator disclosure", () => {
    const html = renderToStaticMarkup(<Page />);
    const guideHtml = renderToStaticMarkup(<GuideContent />);

    expect(html).toContain("AgentKit policy-distinct flows");
    expect(html).toContain("Demo");
    expect(html).toContain("Guide");
    expect(html).toContain("Code");
    expect(html).toContain("Simulator");
    expect(html).toContain("AgentKit protected resource");
    expect(html).toContain("Human-approved action");
    expect(html).toContain("Human-backed test agent");
    expect(html).toContain("Non-human-backed test agent");
    expect(html).toContain("Approve and execute simulated action");
    expect(html).toContain("Simulator outcomes never execute a real action.");
    expect(guideHtml).toContain("Human-backed status is not human approval");
    expect(guideHtml).toContain("Public addresses alone cannot complete a live signed challenge");
    expect(guideHtml).toContain("HUMAN_BACKED_AGENT_ADDRESS");
    expect(guideHtml).toContain("does not depend on running Flow 1 first");
  });

  it("keeps the human-approved action in simulator mode", () => {
    const html = renderToStaticMarkup(<AgentConsole mode="live" />);

    expect(html).toContain("Human-approved action is available only in Simulator mode.");
    expect(html).not.toContain("Propose simulated action");
  });

  it("states the simulator and approval constraints once", () => {
    const html = renderToStaticMarkup(<AgentConsole mode="simulator" />);

    expect(html.match(/never executes? a real action\./gi)).toHaveLength(1);
    expect(
      html.match(
        /Approve and execute simulated action is available only after a human-backed proposal awaits human approval\./g,
      ),
    ).toHaveLength(1);
  });
});
