import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const url = process.env.WORLD_APP_SURFACE_URL ?? process.env.CLAIM_URL;
if (!url) {
  console.error("Set WORLD_APP_SURFACE_URL to the public Mini App integration URL.");
  process.exit(1);
}

const outputDir = path.resolve("output/world-app");
const failures = [];
const events = [];

await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  userAgent:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148"
});

page.on("pageerror", (error) => {
  failures.push(`page error: ${error.message}`);
});
page.on("console", (message) => {
  if (message.type() === "error") {
    failures.push(`console error: ${message.text()}`);
  }
});
page.on("response", (response) => {
  const responseUrl = response.url();
  const record = {
    status: response.status(),
    url: responseUrl
  };
  if (responseUrl.includes("/_next/webpack-hmr")) {
    events.push(record);
    if (response.status() >= 400) {
      failures.push(`forbidden dev HMR endpoint: ${response.status()} ${responseUrl}`);
    }
  }
});

try {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15_000 });
  await page.waitForLoadState("load", { timeout: 15_000 });
  await page.waitForTimeout(2_000);

  await expectText(page, "Human-Gated Claim", "claim app rendered");

  const localWallet = page.getByRole("button", { name: "Use local wallet" });
  await localWallet.click();
  await expectText(
    page,
    "Local wallet selected for browser diagnostics.",
    "local wallet click hydrated"
  );

  const openWorldApp = page.getByRole("link", { name: "Open World App" });
  const href = await openWorldApp.getAttribute("href");
  if (!href?.startsWith("worldapp://mini-app?")) {
    failures.push(`Open World App link is not a Mini App deep link: ${href}`);
  }

  await page.screenshot({
    path: path.join(outputDir, "world-app-surface.png"),
    fullPage: true
  });
} catch (error) {
  failures.push(error.message);
} finally {
  await browser.close();
}

const summary = {
  ok: failures.length === 0,
  url,
  events,
  failures
};
await writeFile(
  path.join(outputDir, "world-app-surface-check.json"),
  `${JSON.stringify(summary, null, 2)}\n`
);

if (!summary.ok) {
  console.error(JSON.stringify(summary, null, 2));
  process.exit(1);
}

console.log(`World App surface check passed: ${url}`);

async function expectText(page, text, label) {
  try {
    await page.getByText(text, { exact: false }).waitFor({
      state: "visible",
      timeout: 5_000
    });
  } catch {
    throw new Error(`${label}: missing "${text}"`);
  }
}
