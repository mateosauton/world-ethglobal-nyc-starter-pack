import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const url =
  process.env.MINIKIT_COMMAND_URL ??
  process.env.CLAIM_URL ??
  "http://localhost:3000";
const outputDir = path.resolve("output/minikit-commands");
const failures = [];
const walletAddress = "0x3333333333333333333333333333333333333333";
const userOpHash =
  "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const txHash = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

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

await page.addInitScript(
  ({ walletAddress, userOpHash }) => {
    const commands = [
      ["attestation", 1],
      ["pay", 1],
      ["wallet-auth", 2],
      ["send-transaction", 2],
      ["sign-message", 1],
      ["sign-typed-data", 1],
      ["share-contacts", 1],
      ["request-permission", 1],
      ["get-permissions", 1],
      ["send-haptic-feedback", 1],
      ["share", 1],
      ["chat", 1],
      ["close-miniapp", 1]
    ];

    window.WorldApp = {
      device_os: "ios",
      is_optional_analytics: false,
      location: "deep-link",
      pending_notifications: 0,
      preferred_currency: "USD",
      safe_area_insets: { top: 0, right: 0, bottom: 0, left: 0 },
      supported_commands: commands.map(([name, version]) => ({
        name,
        supported_versions: [version]
      })),
      verification_status: {
        is_document_verified: false,
        is_orb_verified: true,
        is_secure_document_verified: false
      },
      wallet_address: walletAddress,
      world_app_version: 2090000
    };

    window.__miniKitMessages = [];
    window.webkit = {
      messageHandlers: {
        minikit: {
          postMessage(payload) {
            window.__miniKitMessages.push(payload);

            if (payload.command === "wallet-auth") {
              window.setTimeout(() => {
                const siweMessage = String(payload.payload?.siweMessage ?? "").replace(
                  "{address}",
                  walletAddress
                );
                window.MiniKit?.trigger("miniapp-wallet-auth", {
                  address: walletAddress,
                  message: siweMessage,
                  signature: `0x${"11".repeat(65)}`,
                  status: "success",
                  version: payload.version
                });
              }, 50);
            }

            if (payload.command === "send-transaction") {
              window.setTimeout(() => {
                window.MiniKit?.trigger("miniapp-send-transaction", {
                  from: walletAddress,
                  network: "worldchain",
                  status: "success",
                  timestamp: new Date().toISOString(),
                  userOpHash,
                  version: payload.version
                });
              }, 50);
            }
          }
        }
      }
    };
  },
  { walletAddress, userOpHash }
);

await page.route("**/api/claim/userop/**", async (route) => {
  await route.fulfill({
    contentType: "application/json",
    body: JSON.stringify({
      status: "success",
      transaction_hash: txHash,
      userOpHash
    })
  });
});

try {
  await page.goto(url, { waitUntil: "networkidle", timeout: 15_000 });
  await expectText(page, "Human-Gated Claim", "claim app rendered");
  await expectStatusValue(page, "MiniKit", "Ready", "MiniKit command state");

  await page.getByRole("button", { name: "Wallet auth" }).click();
  await expectText(page, "Wallet authenticated. Proof is next.", "wallet auth success");
  await expectStatusValue(page, "Wallet", "0x3333...3333", "wallet stat");
  await expectConsoleLabel(page, "Wallet auth", "wallet console");

  await page.getByRole("button", { name: "Use local proof" }).click();
  await expectText(page, "Local proof accepted for diagnostics only.", "local proof");

  await page.getByRole("button", { name: "Send claim tx" }).click();
  await expectText(
    page,
    "Claim submitted. Transaction hash captured.",
    "send transaction success"
  );
  await expectBodyIncludes(page, txHash, "full transaction hash evidence");
  await expectConsoleLabel(page, "Send claim tx", "send transaction console");

  const messages = await page.evaluate(() => window.__miniKitMessages ?? []);
  const commandNames = messages.map((message) => message.command);
  if (!commandNames.includes("wallet-auth")) {
    failures.push("MiniKit wallet-auth command was not sent");
  }
  if (!commandNames.includes("send-transaction")) {
    failures.push("MiniKit send-transaction command was not sent");
  }

  await page.screenshot({
    path: path.join(outputDir, "minikit-command-smoke.png"),
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
  failures
};

await writeFile(
  path.join(outputDir, "summary.json"),
  `${JSON.stringify(summary, null, 2)}\n`
);

if (!summary.ok) {
  console.error(JSON.stringify(summary, null, 2));
  process.exit(1);
}

console.log(`MiniKit command smoke passed: ${url}`);

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

async function expectBodyIncludes(page, text, label) {
  try {
    await page.waitForFunction(
      (expectedText) => document.body.innerText.includes(expectedText),
      text,
      { timeout: 5_000 }
    );
  } catch {
    throw new Error(`${label}: missing "${text}"`);
  }
}

async function expectStatusValue(page, label, expected, context) {
  const value = await page
    .locator("dl div")
    .filter({ has: page.locator("dt", { hasText: label }) })
    .locator("dd")
    .innerText({ timeout: 5_000 });

  if (value.trim() !== expected) {
    throw new Error(`${context}: expected "${expected}", got "${value.trim()}"`);
  }
}

async function expectConsoleLabel(page, label, context) {
  const text = await page.locator("section[aria-label='Server console'] pre").innerText({
    timeout: 5_000
  });
  const parsed = JSON.parse(text);

  if (parsed.label !== label) {
    throw new Error(`${context}: expected console label "${label}", got "${parsed.label}"`);
  }
}
