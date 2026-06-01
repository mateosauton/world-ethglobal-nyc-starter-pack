import { verifyWalletAuthPayload } from "@world-starter/world-patterns";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const expectedNonce = request.cookies.get("world_starter_wallet_nonce")?.value;
  if (!expectedNonce) {
    return NextResponse.json({ error: "wallet auth nonce missing" }, { status: 400 });
  }

  const payload = await request.json();
  const result = await verifyWalletAuthPayload({
    expectedNonce,
    payload,
    verifySignature: process.env.NODE_ENV === "production"
  });

  return NextResponse.json(result);
}
