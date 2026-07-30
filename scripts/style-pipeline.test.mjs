import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";

const apps = [
  "one-human-trial",
  "selfie-onboarding",
  "agentkit-x402",
  "credential-policy-lab"
];

test("production CSS contains compiled Tailwind utilities", async () => {
  for (const app of apps) {
    const chunks = join("apps", app, ".next", "static", "chunks");
    const cssFiles = (await readdir(chunks)).filter((file) => file.endsWith(".css"));
    const css = (
      await Promise.all(cssFiles.map((file) => readFile(join(chunks, file), "utf8")))
    ).join("\n");

    assert.match(css, /\.min-h-screen\b/, `${app} is missing Tailwind utilities`);
    assert.doesNotMatch(css, /@(apply|source|theme)\b/, `${app} contains raw Tailwind directives`);
  }
});
