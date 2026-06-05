import { mkdir, writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import path from "node:path";
import { chromium } from "playwright";

const outputDir = path.resolve("output/ui-ux");
const targets = [
  {
    name: "claim",
    url: process.env.CLAIM_URL ?? "http://localhost:3000",
    title: "Human-Gated Claim",
    h1: "Human-Gated Claim"
  },
  {
    name: "agent",
    url: process.env.AGENT_URL ?? "http://localhost:3001",
    title: "Human Agent Console",
    h1: "Human Agent Console"
  },
  {
    name: "hitl",
    url: process.env.HITL_URL ?? "http://localhost:3003",
    title: "Verified Action Desk",
    h1: "Verified Action Desk"
  },
  {
    name: "bench",
    url: process.env.BENCH_URL ?? "http://localhost:3002",
    title: "World Starter UI Bench",
    h1: "World Starter UI Bench"
  }
];

const viewports = [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "mobile", width: 390, height: 844 }
];

const failures = [];
const results = [];

await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });

for (const target of targets) {
  for (const viewport of viewports) {
    const page = await browser.newPage({ viewport });
    const consoleErrors = [];
    page.on("pageerror", (error) => consoleErrors.push(error.message));
    page.on("console", (message) => {
      const text = message.text();
      if (message.type() === "error" && !text.includes("favicon")) {
        consoleErrors.push(text);
      }
    });

    try {
      await page.goto(target.url, { waitUntil: "networkidle", timeout: 15_000 });
      await expectEqual(await page.title(), target.title, `${target.name} title`);
      await expectVisibleText(page, target.h1, `${target.name} h1`);
      await assertNoHorizontalOverflow(page, `${target.name} ${viewport.name}`);
      await assertNoBadPlaceholders(page, `${target.name} ${viewport.name}`);
      await assertImagesLoaded(page, `${target.name} ${viewport.name}`);
      await page.screenshot({
        path: path.join(outputDir, `${target.name}-${viewport.name}.png`),
        fullPage: true
      });
      if (consoleErrors.length > 0) {
        fail(`${target.name} ${viewport.name} console errors`, consoleErrors.join("\n"));
      }
      results.push({ target: target.name, viewport: viewport.name, ok: true });
    } catch (error) {
      fail(`${target.name} ${viewport.name}`, error.message);
    } finally {
      await page.close();
    }
  }
}

await runClaimFlow(browser);
await runClaimDuplicateCheck();
await runAgentFlow(browser);
await runHitlFlow(browser);

await browser.close();

await writeFile(
  path.join(outputDir, "summary.json"),
  JSON.stringify({ results, failures }, null, 2)
);

if (failures.length > 0) {
  console.error(JSON.stringify({ failures }, null, 2));
  process.exit(1);
}

console.log(`UI/UX smoke passed. Artifacts: ${outputDir}`);

async function runClaimFlow(browser) {
  const page = await browser.newPage({ viewport: viewports[1] });
  try {
    await page.goto(targets[0].url, { waitUntil: "networkidle", timeout: 15_000 });
    await expectVisibleText(page, "No button requests yet.", "claim console idle");
    await expectStatusValue(page, "Wallet", "", "wallet starts empty");
    await expectStatusValue(page, "Nullifier", "", "nullifier starts empty");

    await page.getByRole("button", { name: "Use local wallet" }).click();
    await expectVisibleText(
      page,
      "Local wallet selected for browser diagnostics.",
      "claim local wallet"
    );
    await expectStatusValue(page, "Wallet", "", "local wallet stays out of live stats");
    await expectConsoleLabel(page, "Local wallet diagnostic", "local wallet console");

    await page.getByRole("button", { name: "Use local proof" }).click();
    await expectVisibleText(page, "Local proof accepted for diagnostics only.", "claim proof");
    await expectStatusValue(page, "Nullifier", "", "local proof stays out of live stats");
    await expectConsoleLabel(page, "Local proof diagnostic", "local proof console");
    await expectConsoleMissing(page, "Local wallet diagnostic", "console replaces previous action");

    const submitButton = page.getByRole("button", { name: "Prepare claim tx" });
    await submitButton.waitFor({ state: "visible", timeout: 5_000 });
    await page.waitForFunction(
      (buttonText) =>
        Array.from(document.querySelectorAll("button")).some(
          (button) => button.textContent?.trim() === buttonText && !button.disabled
        ),
      "Prepare claim tx",
      { timeout: 5_000 }
    );
    await submitButton.click();
    await expectVisibleText(
      page,
      "Prepared MiniKit transaction payload. Open in World App to execute.",
      "claim flow"
    );
    await expectVisibleText(
      page,
      "0x146Cb926cd55C97bFfe9C1cbD5C6e449d3DAf6fe",
      "claim contract target"
    );
    await expectConsoleLabel(page, "Prepare claim tx", "prepare console");
    await expectConsoleMissing(page, "Local proof diagnostic", "console replaces proof action");

    await page.screenshot({
      path: path.join(outputDir, "claim-flow-mobile.png"),
      fullPage: true
    });
    results.push({ target: "claim-flow", viewport: "mobile", ok: true });
  } catch (error) {
    fail("claim flow", error.message);
  } finally {
    await page.close();
  }
}

async function runClaimDuplicateCheck() {
  const nullifier = `0x${randomBytes(32).toString("hex")}`;
  const body = {
    action: "one-human-one-claim",
    localDevProof: true,
    nullifier_hash: nullifier
  };

  try {
    const first = await fetch(`${targets[0].url}/api/world-id/verify`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body)
    });
    if (!first.ok) {
      fail("claim duplicate setup", `${first.status}: ${await first.text()}`);
      return;
    }

    const second = await fetch(`${targets[0].url}/api/world-id/verify`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body)
    });
    if (second.status !== 409) {
      fail("claim duplicate nullifier", `${second.status}: ${await second.text()}`);
      return;
    }

    results.push({ target: "claim-duplicate-nullifier", viewport: "api", ok: true });
  } catch (error) {
    fail("claim duplicate nullifier", error.message);
  }
}

async function runAgentFlow(browser) {
  const page = await browser.newPage({ viewport: viewports[1] });
  try {
    await page.goto(targets[1].url, { waitUntil: "networkidle", timeout: 15_000 });
    await page.getByRole("button", { name: "Fetch without AgentKit" }).click();
    await expectVisibleText(page, "agentkit_required", "agent challenge");
    await page.getByRole("button", { name: "Run signed registered" }).click();
    await expectVisibleText(page, "AgentKit signed the retry and the resource granted access.", "agent allowed");
    await page.getByRole("button", { name: "Request approval" }).click();
    await page.getByRole("button", { name: "Approve locally" }).click();
    await expectVisibleText(page, "approved", "hitl approval");
    await page.screenshot({
      path: path.join(outputDir, "agent-flow-mobile.png"),
      fullPage: true
    });
    results.push({ target: "agent-flow", viewport: "mobile", ok: true });
  } catch (error) {
    fail("agent flow", error.message);
  } finally {
    await page.close();
  }
}

async function runHitlFlow(browser) {
  const target = targets.find((candidate) => candidate.name === "hitl");
  const page = await browser.newPage({ viewport: viewports[1] });
  try {
    await page.goto(target.url, { waitUntil: "networkidle", timeout: 15_000 });
    await page.getByRole("button", { name: "Request human approval" }).click();
    await expectVisibleText(page, "hitl:grant-482:high:2500", "hitl action");
    await page.getByRole("button", { name: "Use local diagnostic approval" }).click();
    await expectVisibleText(page, "Local diagnostic approval recorded.", "hitl approval");
    await page.getByRole("button", { name: "Resume action" }).click();
    await expectVisibleText(
      page,
      "Agent action resumed after human approval.",
      "hitl resume"
    );
    await page.screenshot({
      path: path.join(outputDir, "hitl-flow-mobile.png"),
      fullPage: true
    });
    results.push({ target: "hitl-flow", viewport: "mobile", ok: true });
  } catch (error) {
    fail("hitl flow", error.message);
  } finally {
    await page.close();
  }
}

async function assertImagesLoaded(page, label) {
  const images = await page.$$eval("img", (nodes) =>
    nodes.map((img) => ({
      src: img.currentSrc || img.src,
      complete: img.complete,
      width: img.naturalWidth,
      height: img.naturalHeight
    }))
  );

  for (const image of images) {
    if (!image.complete || image.width === 0 || image.height === 0) {
      fail(`${label} image failed`, JSON.stringify(image));
    }
  }
}

async function assertNoHorizontalOverflow(page, label) {
  const overflow = await page.evaluate(() => {
    const root = document.documentElement;
    return root.scrollWidth - root.clientWidth;
  });

  if (overflow > 2) {
    fail(`${label} horizontal overflow`, `${overflow}px`);
  }
}

async function assertNoBadPlaceholders(page, label) {
  const body = await page.locator("body").innerText();
  const badTokens = ["undefined", "NaN", "[object Object]"];

  for (const token of badTokens) {
    if (body.includes(token)) {
      fail(`${label} placeholder`, token);
    }
  }

  if (/^null$/m.test(body)) {
    fail(`${label} placeholder`, "standalone null");
  }
}

async function expectVisibleText(page, text, label) {
  const locator = page.getByText(text, { exact: false }).first();
  await locator.waitFor({ state: "visible", timeout: 5_000 }).catch((error) => {
    throw new Error(`${label}: ${error.message}`);
  });
}

async function expectStatusValue(page, label, expected, detail) {
  const actual = await page.evaluate((statusLabel) => {
    const rows = Array.from(document.querySelectorAll("dl div"));
    const row = rows.find((candidate) => candidate.querySelector("dt")?.textContent === statusLabel);
    return row?.querySelector("dd")?.textContent?.trim() ?? null;
  }, label);

  if (actual !== expected) {
    throw new Error(`${detail}: expected "${expected}", received "${actual}"`);
  }
}

async function expectConsoleLabel(page, expected, label) {
  const actual = await page.evaluate(() => {
    const text = document.querySelector("pre")?.textContent ?? "";
    try {
      return JSON.parse(text).label;
    } catch {
      return null;
    }
  });

  if (actual !== expected) {
    throw new Error(`${label}: expected console label "${expected}", received "${actual}"`);
  }
}

async function expectConsoleMissing(page, forbidden, label) {
  const text = await page.locator("pre").innerText();
  if (text.includes(forbidden)) {
    throw new Error(`${label}: console still contains "${forbidden}"`);
  }
}

async function expectEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${expected}, received ${actual}`);
  }
}

function fail(label, detail) {
  failures.push({ label, detail });
}
