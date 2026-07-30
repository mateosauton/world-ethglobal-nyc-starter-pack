import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: true,
  reporter: "line",
  use: {
    browserName: "chromium",
    viewport: { width: 1440, height: 1000 },
    trace: "retain-on-failure"
  },
  webServer: [
    {
      command: "pnpm dev:one-human-trial",
      url: "http://127.0.0.1:3000",
      reuseExistingServer: true
    },
    {
      command: "pnpm dev:selfie-onboarding",
      url: "http://127.0.0.1:3001",
      reuseExistingServer: true
    },
    {
      command: "pnpm dev:agentkit-x402",
      url: "http://127.0.0.1:3002",
      reuseExistingServer: true
    },
    {
      command: "pnpm dev:credential-policy-lab",
      url: "http://127.0.0.1:3003",
      reuseExistingServer: true
    }
  ]
});
