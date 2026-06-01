import { approveRecord } from "@/lib/hitl-store";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { id } = (await request.json()) as { id?: string };
  const record = id ? approveRecord(id) : null;

  if (!record) {
    return NextResponse.json({ error: "approval not found" }, { status: 404 });
  }
  return NextResponse.json(record);
}
