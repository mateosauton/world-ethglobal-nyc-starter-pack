import assert from "node:assert/strict"
import { mkdir, mkdtemp, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { test } from "node:test"

import { scanLisbonRelease } from "./lisbon-release-check.mjs"

const demos = [
  "one-human-trial",
  "selfie-onboarding",
  "agentkit-x402",
  "credential-policy-lab",
]

const completeReadme = `# ETHGlobal Lisbon

## Demos

- apps/one-human-trial
- apps/selfie-onboarding
- apps/agentkit-x402
- apps/credential-policy-lab
`

async function makeReleaseFixture(readme = completeReadme) {
  const root = await mkdtemp(join(tmpdir(), "lisbon-release-"))
  await writeFile(join(root, "README.md"), readme)
  await mkdir(join(root, "docs", "superpowers", "specs"), { recursive: true })
  await writeFile(
    join(root, "docs", "superpowers", "specs", "history.md"),
    "Archived ETHGlobal NYC Track A design",
  )

  for (const demo of demos) {
    const directory = join(root, "apps", demo)
    await mkdir(directory, { recursive: true })
    await writeFile(join(directory, "package.json"), JSON.stringify({ name: demo }))
  }

  return root
}

test("accepts exactly the four Lisbon demos and ignores archived design history", async () => {
  const root = await makeReleaseFixture()

  const report = await scanLisbonRelease(root)

  assert.equal(report.ok, true)
  assert.deepEqual(report.demos, demos)
  assert.deepEqual(report.violations, [])
})

test("rejects obsolete app manifests", async () => {
  const root = await makeReleaseFixture()
  const obsolete = join(root, "apps", "human-gated-claim")
  await mkdir(obsolete, { recursive: true })
  await writeFile(join(obsolete, "package.json"), "{}")

  const report = await scanLisbonRelease(root)

  assert.equal(report.ok, false)
  assert.match(report.violations.join("\n"), /human-gated-claim/)
})

test("rejects leftover public files in an obsolete app", async () => {
  const root = await makeReleaseFixture()
  const obsoletePublic = join(root, "apps", "ui-test-bench", "public")
  await mkdir(obsoletePublic, { recursive: true })
  await writeFile(join(obsoletePublic, "legacy.png"), "legacy")

  const report = await scanLisbonRelease(root)

  assert.equal(report.ok, false)
  assert.match(report.violations.join("\n"), /apps\/ui-test-bench/)
})

test("rejects a README that omits a Lisbon demo", async () => {
  const root = await makeReleaseFixture(completeReadme.replace("- apps/agentkit-x402\n", ""))

  const report = await scanLisbonRelease(root)

  assert.equal(report.ok, false)
  assert.match(report.violations.join("\n"), /README.*agentkit-x402/)
})

test("rejects stale public copy and misleading MiniKit verification claims", async () => {
  const root = await makeReleaseFixture(
    "ETHGlobal NYC Track A uses MiniKit verification with orbLegacy.",
  )

  const report = await scanLisbonRelease(root)

  assert.equal(report.ok, false)
  assert.match(report.violations.join("\n"), /ETHGlobal NYC/)
  assert.match(report.violations.join("\n"), /Track A/)
  assert.match(report.violations.join("\n"), /MiniKit verification/)
  assert.match(report.violations.join("\n"), /orbLegacy/)
})
