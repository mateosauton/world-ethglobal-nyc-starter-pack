import { NextRequest, NextResponse } from "next/server";
import { getApproval } from "@/lib/approval-workflow";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as { id?: string };
  if (!body.id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const approval = getApproval(body.id);
  if (!approval) {
    return NextResponse.json({ error: "approval not found" }, { status: 404 });
  }

  if (approval.status !== "verified") {
    return NextResponse.json(
      {
        approval,
        error: "Agent action is still blocked by human approval."
      },
      { status: 409 }
    );
  }

  return NextResponse.json({
    approval,
    execution: {
      action: approval.action,
      effect: "dry-run",
      status: "resumed",
      summary: `${approval.summary} resumed with ${approval.result?.mode}.`
    }
  });
}
