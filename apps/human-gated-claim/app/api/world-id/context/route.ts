import { createWalletNonce } from "@world-starter/world-patterns";
import { signRequest } from "@worldcoin/idkit/signing";
import { NextResponse } from "next/server";

export async function GET() {
  const action = process.env.WORLD_ID_ACTION ?? "one-human-one-claim";
  const rpId = process.env.WORLD_RP_ID ?? "rp_local_dev";
  const signingKey = process.env.WORLD_RP_SIGNING_KEY;

  if (signingKey) {
    const signature = signRequest({
      signingKeyHex: signingKey,
      action,
      ttl: 60 * 10
    });

    return NextResponse.json({
      diagnostics: {
        action,
        configured: true,
        hasSigningKey: true,
        mode: "signed",
        rp_id: rpId
      },
      rp_context: {
        rp_id: rpId,
        nonce: signature.nonce,
        created_at: signature.createdAt,
        expires_at: signature.expiresAt,
        signature: signature.sig
      }
    });
  }

  const createdAt = Math.floor(Date.now() / 1000);
  return NextResponse.json({
    diagnostics: {
      action,
      configured: false,
      hasSigningKey: false,
      mode: "missing-signing-key",
      rp_id: rpId,
      warning:
        "WORLD_RP_SIGNING_KEY is missing, so live IDKit verification is disabled."
    },
    rp_context: {
      rp_id: rpId,
      nonce: createWalletNonce(24),
      created_at: createdAt,
      expires_at: createdAt + 600,
      signature:
        "0x0000000000000000000000000000000000000000000000000000000000000000"
    }
  });
}
