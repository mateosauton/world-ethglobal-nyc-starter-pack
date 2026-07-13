import { createAgentBookVerifier } from "@worldcoin/agentkit";
import { handle } from "hono/vercel";
import { isAddress } from "viem";

import {
  createDataClient,
  DrizzleAgentKitStorage,
} from "@world-lisbon/data";

import {
  createAgentkitStorageAdapter,
  createProtectedResourceApp,
} from "../../../../lib/resource-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function configuredHandler() {
  const databaseUrl = process.env.DATABASE_URL;
  const resourceUrl = process.env.AGENTKIT_RESOURCE_URL;
  const facilitatorUrl = process.env.X402_FACILITATOR_URL;
  const payTo = process.env.X402_PAY_TO_ADDRESS;
  const network = process.env.X402_NETWORK ?? "eip155:84532";

  if (
    process.env.AGENTKIT_DEMO_MODE !== "live" ||
    !databaseUrl ||
    !resourceUrl ||
    !facilitatorUrl ||
    !payTo ||
    !isAddress(payTo) ||
    !network.startsWith("eip155:")
  ) {
    return null;
  }

  const storage = new DrizzleAgentKitStorage(createDataClient(databaseUrl));
  const agentBook = createAgentBookVerifier({
    rpcUrl: process.env.WORLD_CHAIN_RPC_URL,
  });
  const app = createProtectedResourceApp({
    agentBook,
    storage: createAgentkitStorageAdapter(storage),
    resourceUrl,
    facilitatorUrl,
    payTo,
    network: network as `eip155:${string}`,
  });
  return handle(app);
}

const liveHandler = configuredHandler();

export async function GET(request: Request) {
  if (!liveHandler) {
    return Response.json(
      {
        error: "live_configuration_required",
        message: "The simulator cannot unlock the protected resource.",
      },
      { status: 503 },
    );
  }
  return liveHandler(request);
}
