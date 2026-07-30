import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AgentConsole } from "../components/agent-console";
import Page from "../app/page";

describe("AgentKit demo page", () => {
  it("renders shadcn Demo, Guide, and Code surfaces with simulator disclosure", () => {
    const html = renderToStaticMarkup(<Page />);

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
    expect(html).toContain("never executes a real action");
  });

  it("keeps the human-approved action in simulator mode", () => {
    const html = renderToStaticMarkup(<AgentConsole mode="live" />);

    expect(html).toContain("Human-approved action is available only in Simulator mode.");
    expect(html).not.toContain("Propose simulated action");
  });
});
