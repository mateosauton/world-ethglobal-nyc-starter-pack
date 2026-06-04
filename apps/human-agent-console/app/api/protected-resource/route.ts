import {
  AGENTKIT,
  createAgentBookVerifier,
  createAgentkitHooks,
  declareAgentkitExtension,
  InMemoryAgentKitStorage,
  type AgentBookVerifier,
  type AgentkitHookEvent,
  type AgentkitMode
} from "@worldcoin/agentkit";
import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";

const demoRegisteredAgent =
  "0xd19a272317222597d9f9CeA28dEF53327c30A059" as const;
const storage = new InMemoryAgentKitStorage();

export async function GET(request: NextRequest) {
  const serverConsole: unknown[] = [];
  const hookEvents: AgentkitHookEvent[] = [];
  const resourceUrl = request.url;
  const resourcePath = request.nextUrl.pathname;
  const mode = getAgentkitMode();
  const network = process.env.AGENTKIT_NETWORK ?? "eip155:4801";
  const verifierMode = process.env.AGENTBOOK_VERIFIER === "live" ? "live" : "local-allowlist";

  serverConsole.push({
    mode,
    network,
    resourceUrl,
    step: "request_received",
    verifierMode
  });

  if (!request.headers.get("agentkit")) {
    const declaration = declareAgentkitExtension({
      domain: request.headers.get("host")?.split(":")[0] ?? "localhost",
      mode,
      network,
      resourceUri: resourceUrl,
      statement: "Access the World Starter protected support credit."
    });
    const baseExtension = declaration[AGENTKIT];
    const extensions = {
      [AGENTKIT]: {
        ...baseExtension,
        info: {
          ...baseExtension.info,
          issuedAt: new Date().toISOString(),
          nonce: randomBytes(16).toString("hex")
        }
      }
    };

    serverConsole.push({
      extensions,
      step: "agentkit_required"
    });

    return NextResponse.json(
      {
        error: "agentkit_required",
        extensions,
        serverConsole
      },
      { status: 402 }
    );
  }

  const hooks = createAgentkitHooks({
    agentBook: createVerifier(verifierMode, serverConsole),
    mode,
    onEvent: (event) => hookEvents.push(event),
    rpcUrl: process.env.AGENTKIT_SIGNATURE_RPC_URL ?? process.env.WORLD_CHAIN_RPC_URL,
    storage
  });

  const result = await hooks.requestHook({
    adapter: {
      getHeader(name) {
        return request.headers.get(name) ?? undefined;
      },
      getUrl() {
        return resourceUrl;
      }
    },
    path: resourcePath
  });

  serverConsole.push({
    hookEvents,
    result,
    step: "agentkit_hook_completed"
  });

  if (!result?.grantAccess) {
    return NextResponse.json(
      {
        error: "agent_not_verified",
        hookEvents,
        serverConsole
      },
      { status: 401 }
    );
  }

  return NextResponse.json({
    ok: true,
    checked: ["agentkit-header", "agentkit-signature", "agentbook-human-lookup"],
    hookEvents,
    resource: "protected-support-credit",
    serverConsole,
    verifierMode
  });
}

function getAgentkitMode(): AgentkitMode {
  if (process.env.AGENTKIT_MODE === "free-trial") {
    return {
      type: "free-trial",
      uses: Number(process.env.AGENTKIT_TRIAL_USES ?? 3)
    };
  }

  return { type: "free" };
}

function createVerifier(
  mode: "live" | "local-allowlist",
  serverConsole: unknown[]
): AgentBookVerifier {
  if (mode === "live") {
    serverConsole.push({ step: "agentbook_live_verifier" });
    return createAgentBookVerifier({
      rpcUrl: process.env.AGENTBOOK_RPC_URL ?? process.env.WORLD_CHAIN_RPC_URL
    });
  }

  const configuredAllowlist = process.env.AGENTBOOK_REGISTERED_AGENTS?.trim();
  const allowlistInput =
    configuredAllowlist && !configuredAllowlist.includes("replace")
      ? configuredAllowlist
      : demoRegisteredAgent;
  const allowlist = new Set(
    allowlistInput
      .split(",")
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean)
  );

  serverConsole.push({
    allowlist: Array.from(allowlist),
    step: "agentbook_local_allowlist"
  });

  return {
    async lookupHuman(address: string) {
      const normalized = address.toLowerCase();
      const humanId = allowlist.has(normalized)
        ? `local-human:${normalized.slice(2, 10)}`
        : null;
      serverConsole.push({
        address,
        humanId,
        step: "agentbook_lookup"
      });
      return humanId;
    }
  };
}
