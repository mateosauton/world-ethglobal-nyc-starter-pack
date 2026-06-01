import { NextRequest, NextResponse } from "next/server";
import { createApproval } from "@/lib/hitl-store";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    action?: string;
    summary?: string;
  };

  return NextResponse.json(createApproval(body));
}
