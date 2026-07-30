import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import Page from "../app/page";
import { PolicyGuide } from "../content/guide";
import { SubmissionTemplate } from "../content/submission";

describe("credential policy lab", () => {
  it("opens on a desktop-first Demo policy configurator", () => {
    const html = renderToStaticMarkup(createElement(Page));

    expect(html).toMatch(/data-state="active"[^>]*>Demo/);
    expect(html).toContain("Choose the trust event");
    expect(html).toContain("Proof of Human");
    expect(html).toContain("Copy TypeScript");
    expect(html).toContain("World ID 4.0");
  });

  it("includes current platform boundaries and strong versus weak guidance", () => {
    const html = renderToStaticMarkup(createElement(PolicyGuide));

    expect(html).toContain("MiniKit for commands, IDKit for verification");
    expect(html).toContain("Strong integration");
    expect(html).toContain("Weak integration");
    expect(html).toContain("April 1, 2027");
    expect(html).toContain("one-time nullifier");
    expect(html).toContain("session_id");
  });

  it("renders the useful trust-event question verbatim", () => {
    const html = renderToStaticMarkup(createElement(SubmissionTemplate));

    expect(html).toContain(
      "What specific event in your product requires trust, what abuse becomes possible without it, and why is this World credential the minimum sufficient assurance?"
    );
  });
});
