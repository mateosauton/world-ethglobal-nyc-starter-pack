import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { completeApproval, getApproval } from "@/lib/approval-workflow";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as { id?: string };
  if (!body.id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const approval = getApproval(body.id);
  if (!approval) {
    return NextResponse.json({ error: "approval not found" }, { status: 404 });
  }

  if (process.env.NODE_ENV === "production" && !isLocalRequest(request)) {
    return NextResponse.json(
      { error: "local diagnostic approval is disabled in production" },
      { status: 403 }
    );
  }

  const verified = completeApproval(body.id, {
    mode: "local-diagnostic",
    nullifier: `local:${randomBytes(16).toString("hex")}`
  });

  return NextResponse.json({
    approval: verified,
    note: "Local diagnostic approval recorded. This is not a World ID proof."
  });
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
