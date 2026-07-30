import type { ComponentProps } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { DemoShell } from "./components/demo-shell"

const renderShell = (overrides: Partial<ComponentProps<typeof DemoShell>> = {}) =>
  renderToStaticMarkup(
    <DemoShell
      title="One-per-human trial"
      description="Unlock one session after verification."
      mode="simulator"
      demo={<p>Demo content</p>}
      guide={<p>Guide content</p>}
      code={<pre>Code content</pre>}
      {...overrides}
    />,
  )

describe("DemoShell", () => {
  it("exposes Demo, Guide, and Code tabs with Demo selected by default", () => {
    const html = renderShell()

    expect(html).toContain('role="tablist"')
    expect(html).toContain(">Demo</button>")
    expect(html).toContain(">Guide</button>")
    expect(html).toContain(">Code</button>")
    expect(html).toMatch(/role="tab"[^>]*aria-selected="true"[^>]*>Demo/)
  })

  it("makes simulator mode impossible to miss", () => {
    expect(renderShell()).toMatch(/Simulator/)
  })

  it("renders an error outcome as an accessible alert", () => {
    const html = renderShell({ error: "Verification could not be completed." })

    expect(html).toContain('role="alert"')
    expect(html).toContain("Verification could not be completed.")
  })
})
