import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { test } from "node:test"

const demos = [
  ["one-human-trial", "@world-lisbon/one-human-trial", "3000"],
  ["selfie-onboarding", "@world-lisbon/selfie-onboarding", "3001"],
  ["agentkit-x402", "@world-lisbon/agentkit-x402", "3002"],
  ["credential-policy-lab", "@world-lisbon/credential-policy-lab", "3003"],
]

test("the Lisbon workspace exposes exactly four public demos", async () => {
  const workspace = await readFile(new URL("../pnpm-workspace.yaml", import.meta.url), "utf8")

  assert.match(workspace, /apps\/\*/)
  assert.match(workspace, /packages\/\*/)

  const manifests = await Promise.all(
    demos.map(async ([directory]) =>
      JSON.parse(
        await readFile(
          new URL(`../apps/${directory}/package.json`, import.meta.url),
          "utf8",
        ),
      ),
    ),
  )

  assert.deepEqual(
    manifests.map(({ name }) => name),
    demos.map(([, name]) => name),
  )

  manifests.forEach((manifest, index) => {
    assert.match(manifest.scripts.dev, new RegExp(`--port ${demos[index][2]}(?:$|\\s)`))
    assert.equal(manifest.private, true)
  })
})
