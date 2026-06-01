import { createWalletNonce } from "@world-starter/world-patterns";
import { NextResponse } from "next/server";

export async function GET() {
  const nonce = createWalletNonce();
  const response = NextResponse.json({ nonce });
  response.cookies.set("world_starter_wallet_nonce", nonce, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 5,
    path: "/"
  });
  return response;
}
