import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import Page from "../app/page"
import { FeedbackForm } from "../components/feedback-form"
import { SelfieTestingGuide } from "../content/guide"

describe("Selfie Check builder surface", () => {
  it("keeps the legacy beta assurance visible on the main page", () => {
    const html = renderToStaticMarkup(<Page />)

    expect(html).toContain("Selfie Check legacy beta")
    expect(html).toContain("Simulator")
    expect(html).toContain("does not perform or claim liveness")
    expect(html).toContain("Demo")
    expect(html).toContain("Guide")
    expect(html).toContain("Code")
  })

  it("documents every test path and beta constraint", () => {
    const html = renderToStaticMarkup(<SelfieTestingGuide />)

    for (const path of ["Hot path", "Warm path", "Cold path", "Error path"]) {
      expect(html).toContain(path)
    }
    expect(html).toContain("invite code")
    expect(html).toContain("iOS")
    expect(html).toContain("staging")
    expect(html).toContain("production")
    expect(html).toContain("Never collect")
    expect(html).toContain("beta")
    expect(html).toContain("https://docs.world.org/world-id/idkit/verification-flows")
    expect(html).toContain("https://docs.world.org/world-id/idkit/react")
  })

  it("collects the complete privacy-safe beta feedback matrix", () => {
    const html = renderToStaticMarkup(<FeedbackForm />)

    for (const label of [
      "Test path",
      "Device",
      "OS / browser",
      "World App state",
      "Duration",
      "Retry count",
      "Clarity",
      "Friction",
      "Privacy explanation",
    ]) {
      expect(html).toContain(label)
    }
  })
})
