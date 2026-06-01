import { randomBytes } from "node:crypto";
import { getAddress, verifyMessage, type Address, type Hex } from "viem";

export type WalletAuthPayload = {
  address: Address;
  message: string;
  signature: Hex;
};

export type WalletAuthVerificationInput = {
  expectedNonce: string;
  payload: WalletAuthPayload;
  verifySignature?: boolean;
};

export type WalletAuthVerificationResult = {
  address: Address;
  nonce: string;
  signatureValid: boolean | null;
};

export function createWalletNonce(byteLength = 18): string {
  return randomBytes(byteLength).toString("base64url").replace(/[^a-zA-Z0-9]/g, "");
}

export async function verifyWalletAuthPayload({
  expectedNonce,
  payload,
  verifySignature = false
}: WalletAuthVerificationInput): Promise<WalletAuthVerificationResult> {
  const nonce = parseSiweField(payload.message, "Nonce");

  if (!nonce) {
    throw new Error("Wallet auth SIWE message is missing a nonce");
  }

  if (nonce !== expectedNonce) {
    throw new Error("Wallet auth nonce mismatch");
  }

  const messageAddress = parseSiweAddress(payload.message);
  const payloadAddress = getAddress(payload.address);

  if (messageAddress && getAddress(messageAddress) !== payloadAddress) {
    throw new Error("Wallet auth address mismatch");
  }

  const signatureValid = verifySignature
    ? await verifyMessage({
        address: payloadAddress,
        message: payload.message,
        signature: payload.signature
      })
    : null;

  if (signatureValid === false) {
    throw new Error("Wallet auth signature verification failed");
  }

  return {
    address: payloadAddress,
    nonce,
    signatureValid
  };
}

export function parseSiweField(message: string, field: string): string | null {
  const prefix = `${field}:`;
  const line = message.split(/\r?\n/).find((entry) => entry.startsWith(prefix));
  return line?.slice(prefix.length).trim() ?? null;
}

function parseSiweAddress(message: string): Address | null {
  const address = message
    .split(/\r?\n/)
    .find((line) => /^0x[a-fA-F0-9]{40}$/.test(line.trim()))
    ?.trim();

  return address ? (address as Address) : null;
}

