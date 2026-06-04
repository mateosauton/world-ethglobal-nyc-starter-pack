import { NextResponse } from "next/server";
import { getApproval } from "@/lib/approval-workflow";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const approval = getApproval(id);
  if (!approval) {
    return NextResponse.json({ error: "approval not found" }, { status: 404 });
  }

  return NextResponse.json({ approval });
}
