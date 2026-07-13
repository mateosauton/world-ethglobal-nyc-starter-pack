import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import Page from "../app/page";
import { TrialGuide } from "../content/guide";

describe("one-human trial page", () => {
  it("selects Demo by default and presents the trust-event timeline", () => {
    const html = renderToStaticMarkup(createElement(Page));

    expect(html).toContain("Demo");
    expect(html).toMatch(/data-state="active"[^>]*>Demo/);
    expect(html).toContain("Trust events");
    expect(html).toContain("Request signed proof");
    expect(html).toContain("Consume unique nullifier");
    expect(html).toContain("Simulator");
  });

  it("embeds the IDKit quickstart and integration guidance", () => {
    const html = renderToStaticMarkup(createElement(TrialGuide));

    expect(html).toContain("IDKit 4 quickstart");
    expect(html).toContain("MiniKit for commands, IDKit for verification");
    expect(html).toContain("Strong integration");
    expect(html).toContain("Weak integration");
    expect(html).toContain("Never trust or store a client-submitted nullifier");
  });
});
