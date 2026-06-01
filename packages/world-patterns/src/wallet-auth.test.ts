import { describe, expect, it } from "vitest";
import { createWalletNonce, verifyWalletAuthPayload } from "./wallet-auth";

describe("wallet auth helpers", () => {
  it("creates an alphanumeric nonce long enough for MiniKit walletAuth", () => {
    const nonce = createWalletNonce();

    expect(nonce).toMatch(/^[a-zA-Z0-9]+$/);
    expect(nonce.length).toBeGreaterThanOrEqual(16);
  });

  it("rejects wallet auth payloads whose SIWE nonce does not match", async () => {
    await expect(
      verifyWalletAuthPayload({
        expectedNonce: "expectedNonce123",
        payload: {
          address: "0x2222222222222222222222222222222222222222",
          message: [
            "localhost wants you to sign in with your Ethereum account:",
            "0x2222222222222222222222222222222222222222",
            "",
            "URI: http://localhost:3000",
            "Version: 1",
            "Chain ID: 4801",
            "Nonce: wrongNonce123",
            "Issued At: 2026-06-01T00:00:00.000Z"
          ].join("\n"),
          signature: "0xsignature"
        }
      })
    ).rejects.toThrow(/nonce/i);
  });
});

