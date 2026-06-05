import {
  createClaimTransaction,
  createMiniKitSendTransactionPayload
} from "@world-starter/world-patterns";
import { NextRequest, NextResponse } from "next/server";
import { type Address, type Hex } from "viem";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    recipient: Address;
    nullifierHash: Hex;
  };

  const transaction = createClaimTransaction({
    contractAddress:
      (process.env.NEXT_PUBLIC_CLAIM_CONTRACT_ADDRESS as Address | undefined) ??
      "0x1111111111111111111111111111111111111111",
    recipient: body.recipient,
    nullifierHash: body.nullifierHash
  });

  return NextResponse.json(
    createMiniKitSendTransactionPayload({
      chainId: Number(process.env.NEXT_PUBLIC_WORLD_CHAIN_ID ?? 480),
      transaction
    })
  );
}
