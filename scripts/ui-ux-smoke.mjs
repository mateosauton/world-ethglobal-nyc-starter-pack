import { mkdir, writeFile } from "node:fs/promises";
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
await runAgentFlow(browser);

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
    await page.getByRole("button", { name: "Simulate proof" }).click();
    await expectVisibleText(page, "Local proof accepted for browser development.", "claim proof");
    const submitButton = page.getByRole("button", { name: "Send claim tx" });
    await submitButton.waitFor({ state: "visible", timeout: 5_000 });
    await page.waitForFunction(
      (buttonText) =>
        Array.from(document.querySelectorAll("button")).some(
          (button) => button.textContent?.trim() === buttonText && !button.disabled
        ),
      "Send claim tx",
      { timeout: 5_000 }
    );
    await submitButton.click();
    await expectVisibleText(page, "Claim submitted with browser fallback.", "claim flow");
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

async function runAgentFlow(browser) {
  const page = await browser.newPage({ viewport: viewports[1] });
  try {
    await page.goto(targets[1].url, { waitUntil: "networkidle", timeout: 15_000 });
    await page.getByRole("button", { name: "Challenge missing agent" }).click();
    await expectVisibleText(page, "human_backed_agent_required", "agent challenge");
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

async function expectEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${expected}, received ${actual}`);
  }
}

function fail(label, detail) {
  failures.push({ label, detail });
}
