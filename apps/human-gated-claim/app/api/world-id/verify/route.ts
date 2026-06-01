import {
  MemoryNullifierStore,
  verifyWorldIdProof
} from "@world-starter/world-patterns";
import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";

const nullifiers = new MemoryNullifierStore();

export async function POST(request: NextRequest) {
  const body = await request.json();
  const action = process.env.WORLD_ID_ACTION ?? body.action ?? "one-human-one-claim";

  if (
    body.localDevProof === true &&
    (process.env.NODE_ENV !== "production" || isLocalRequest(request))
  ) {
    const nullifier = `0x${randomBytes(32).toString("hex")}`;
    if (!nullifiers.tryRecord(nullifier, action)) {
      return NextResponse.json({ error: "duplicate nullifier" }, { status: 409 });
    }
    return NextResponse.json({ success: true, nullifier });
  }

  const rpId = process.env.WORLD_RP_ID;
  if (!rpId) {
    return NextResponse.json(
      { error: "WORLD_RP_ID is required for live proof verification" },
      { status: 500 }
    );
  }

  const result = await verifyWorldIdProof({
    rpId,
    action,
    idkitResponse: body
  });

  if (!nullifiers.tryRecord(result.nullifier, action)) {
    return NextResponse.json({ error: "duplicate nullifier" }, { status: 409 });
  }

  return NextResponse.json(result);
}

function isLocalRequest(request: NextRequest) {
  const hosts = [
    request.nextUrl.hostname,
    request.headers.get("host")?.split(":")[0],
    request.headers.get("x-forwarded-host")?.split(":")[0]
  ];

  return hosts.some(
    (hostname) =>
      hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1"
  );
}
