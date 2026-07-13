import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import Page from "../app/page";

describe("AgentKit demo page", () => {
  it("renders shadcn Demo, Guide, and Code surfaces with simulator disclosure", () => {
    const html = renderToStaticMarkup(<Page />);

    expect(html).toContain("AgentKit human-backed API access");
    expect(html).toContain("Demo");
    expect(html).toContain("Guide");
    expect(html).toContain("Code");
    expect(html).toContain("Simulator");
    expect(html).toContain("Run human-first request");
  });
});
