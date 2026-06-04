import { verifyWorldIdProof } from "@world-starter/world-patterns";
import { NextRequest, NextResponse } from "next/server";
import { completeApproval, failApproval, getApproval } from "@/lib/approval-workflow";
import { getLiveVerificationConfig } from "@/lib/world-config";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const approval = getApproval(id);
  if (!approval) {
    return NextResponse.json({ error: "approval not found" }, { status: 404 });
  }

  const body = await request.json();
  const { diagnostics, rpId } = getLiveVerificationConfig();
  if (!diagnostics.configured || !rpId) {
    return NextResponse.json(
      {
        approval,
        diagnostics,
        error: "Live World ID verification is not configured."
      },
      { status: 428 }
    );
  }

  try {
    const result = await verifyWorldIdProof({
      action: approval.action,
      idkitResponse: body,
      rpId
    });
    const verified = completeApproval(id, {
      mode: "live-world-id",
      nullifier: result.nullifier,
      raw: result.raw
    });

    return NextResponse.json({
      approval: verified,
      diagnostics,
      verification: result
    });
  } catch (error) {
    const failed = failApproval(id, error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      {
        approval: failed,
        diagnostics,
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 502 }
    );
  }
}
