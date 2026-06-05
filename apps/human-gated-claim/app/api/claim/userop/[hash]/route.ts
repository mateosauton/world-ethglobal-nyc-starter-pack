import { NextRequest, NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{
    hash: string;
  }>;
};

const userOperationHashPattern = /^0x[0-9a-fA-F]{64}$/;

export async function GET(_request: NextRequest, context: RouteContext) {
  const { hash } = await context.params;
  if (!userOperationHashPattern.test(hash)) {
    return NextResponse.json({ error: "invalid user operation hash" }, { status: 400 });
  }

  const apiKey = process.env.WORLD_DEVELOPER_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "WORLD_DEVELOPER_API_KEY is required to poll user operations" },
      { status: 428 }
    );
  }

  const response = await fetch(
    `https://developer.world.org/api/v2/minikit/userop/${hash}`,
    {
      headers: {
        authorization: `Bearer ${apiKey}`
      },
      cache: "no-store"
    }
  );
  const body = await readJsonBody(response);

  return NextResponse.json(body, { status: response.status });
}

async function readJsonBody(response: Response) {
  const text = await response.text();
  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { error: "developer portal returned a non-json response" };
  }
}
