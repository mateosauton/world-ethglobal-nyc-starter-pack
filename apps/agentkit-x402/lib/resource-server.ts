import {
  agentkitResourceServerExtension,
  createAgentkitHooks,
  declareAgentkitExtension,
  type AgentKitStorage as WorldAgentKitStorage,
} from "@worldcoin/agentkit";
import {
  HTTPFacilitatorClient,
  x402ResourceServer,
  type FacilitatorClient,
} from "@x402/core/server";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import {
  paymentMiddlewareFromHTTPServer,
  x402HTTPResourceServer,
} from "@x402/hono";
import { Hono } from "hono";

import type { AgentKitStorage as DurableAgentKitStorage } from "@world-lisbon/data";

export const AGENTKIT_NETWORK = "eip155:84532" as const;
export const FREE_TRIAL_USES = 3;

export type AgentBookLookup = {
  lookupHuman(address: string): Promise<string | null>;
};

export function createAgentkitStorageAdapter(
  storage: DurableAgentKitStorage,
): WorldAgentKitStorage {
  return {
    async tryIncrementUsage(endpoint, humanId, limit) {
      const attempt = await storage.tryIncrementUsage(endpoint, humanId, limit);
      return attempt.allowed;
    },
    async hasUsedNonce(nonce) {
      // AgentKit's hook separates the nonce check from the record operation. Claim
      // it atomically here so two concurrent requests cannot both pass the check.
      const claimed = await storage.claimNonce(
        nonce,
        new Date(Date.now() + 5 * 60 * 1_000),
      );
      return !claimed;
    },
    async recordNonce() {
      // The nonce was atomically persisted by hasUsedNonce.
    },
  };
}

type ProtectedResourceOptions = {
  agentBook: AgentBookLookup;
  storage: WorldAgentKitStorage;
  resourceUrl: string;
  payTo: `0x${string}`;
  facilitatorUrl?: string;
  facilitator?: FacilitatorClient;
  syncFacilitatorOnStart?: boolean;
  network?: `eip155:${string}`;
};

export function createProtectedResourceApp(options: ProtectedResourceOptions) {
  const network = options.network ?? AGENTKIT_NETWORK;
  if (!options.facilitator && !options.facilitatorUrl) {
    throw new Error("A live facilitator is required");
  }
  const facilitator =
    options.facilitator ?? new HTTPFacilitatorClient({ url: options.facilitatorUrl });
  const resourceServer = new x402ResourceServer(facilitator)
    .register(network, new ExactEvmScheme())
    .registerExtension(agentkitResourceServerExtension);

  const hooks = createAgentkitHooks({
    agentBook: options.agentBook,
    mode: { type: "free-trial", uses: FREE_TRIAL_USES },
    storage: options.storage,
  });
  const routes = {
    "GET /*": {
      accepts: {
        scheme: "exact",
        price: "$0.01",
        network,
        payTo: options.payTo,
      },
      resource: options.resourceUrl,
      description: "A scoped Lisbon builder signal for human-backed agents",
      mimeType: "application/json",
      extensions: declareAgentkitExtension({
        resourceUri: options.resourceUrl,
        network,
        expirationSeconds: 300,
        statement: "Prove this agent is backed by a unique human",
        mode: { type: "free-trial", uses: FREE_TRIAL_USES },
      }),
      settlementFailedResponseBody: () => ({
        contentType: "application/json",
        body: {
          error: "settlement_failed",
          message: "The protected resource was not released.",
        },
      }),
    },
  };

  const httpServer = new x402HTTPResourceServer(resourceServer, routes);
  httpServer.onProtectedRequest(hooks.requestHook);

  const app = new Hono();
  app.use(
    "*",
    paymentMiddlewareFromHTTPServer(
      httpServer,
      undefined,
      undefined,
      options.syncFacilitatorOnStart ?? true,
    ),
  );
  app.get("*", (context) =>
    context.json({
      resource: "lisbon-builder-signal",
      confidence: 0.92,
      scope: context.req.path,
      grantedAt: new Date().toISOString(),
    }),
  );

  return app;
}
