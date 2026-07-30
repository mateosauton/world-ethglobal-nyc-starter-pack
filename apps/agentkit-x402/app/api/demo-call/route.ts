import { privateKeyToAccount } from "viem/accounts";

import { createLiveHumanFirstFetch, redactProtocolEvent, type ProtocolEvent } from "../../../lib/agent-client";
import {
  HUMAN_BACKED_AGENT_ADDRESS,
  NON_HUMAN_BACKED_AGENT_ADDRESS,
  runDemoCall,
  type DemoAgentAddress,
  type DemoFlow,
} from "../../../lib/demo-call";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function privateKey(value: string | undefined): `0x${string}` | null {
  return value?.startsWith("0x") && value.length === 66
    ? (value as `0x${string}`)
    : null;
}

function isDemoFlow(value: unknown): value is DemoFlow {
  return value === "agentkit-access" || value === "human-approval";
}

function isDemoAgentAddress(value: unknown): value is DemoAgentAddress {
  return value === HUMAN_BACKED_AGENT_ADDRESS || value === NON_HUMAN_BACKED_AGENT_ADDRESS;
}

function invalidDemoRequest() {
  return Response.json({ error: "invalid_demo_request" }, { status: 400 });
}

type DemoCallRequest = {
  mode?: unknown;
  flow?: unknown;
  agentAddress?: unknown;
  call?: unknown;
  approval?: unknown;
};

export function createDemoCallHandler(input: {
  environment?: NodeJS.ProcessEnv;
  liveFetch?: typeof fetch;
}): (request: Request) => Promise<Response> {
  const environment = input.environment ?? process.env;

  return async (request) => {
    let body: DemoCallRequest;
    try {
      const parsed: unknown = await request.json();
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return invalidDemoRequest();
      body = parsed as DemoCallRequest;
    } catch {
      return invalidDemoRequest();
    }

    if (body.mode === "simulator") {
      if (
        !isDemoFlow(body.flow) ||
        !isDemoAgentAddress(body.agentAddress) ||
        (body.call !== undefined && (typeof body.call !== "number" || !Number.isFinite(body.call))) ||
        (body.approval !== undefined && typeof body.approval !== "boolean")
      ) {
        return invalidDemoRequest();
      }

      const result = await runDemoCall({
        mode: "simulator",
        flow: body.flow,
        agentAddress: body.agentAddress,
        call: body.call,
        approval: body.approval,
      });
      return Response.json(result);
    }

    if (body.mode !== "live" || (body.flow !== undefined && !isDemoFlow(body.flow)) || body.agentAddress !== undefined) {
      return invalidDemoRequest();
    }
    if (body.flow === "human-approval") {
      return Response.json(
        {
          error: "live_flow_unsupported",
          message: "The approval flow is simulator-only and never executes a real action.",
        },
        { status: 400 },
      );
    }

    const resourceUrl = environment.AGENTKIT_RESOURCE_URL;
    const agentKey = privateKey(environment.AGENTKIT_AGENT_PRIVATE_KEY);
    const paymentKey = privateKey(environment.X402_PAYMENT_PRIVATE_KEY);
    if (!resourceUrl || !agentKey || !paymentKey) {
      return Response.json(
        {
          error: "live_configuration_required",
          message: "Configure the live resource URL and both server-only test wallet keys.",
        },
        { status: 503 },
      );
    }

    const agentAccount = privateKeyToAccount(agentKey);
    const paymentAccount = privateKeyToAccount(paymentKey);
    const events: ProtocolEvent[] = [
      {
        stage: "resource_challenge",
        status: "pending",
        detail: "Requesting the scoped resource",
      },
    ];
    const fetchResource = createLiveHumanFirstFetch({
      paymentAccount,
      agentkitSigner: {
        address: agentAccount.address,
        chainId: environment.X402_NETWORK ?? "eip155:84532",
        type: "eip191",
        signMessage: (message) => agentAccount.signMessage({ message }),
      },
      fetch: input.liveFetch,
      onAgentkitEvent(event) {
        events.push({
          stage: "agentkit_retry",
          status: event.type === "agentkit_skipped" ? "failed" : "success",
          detail: event.type.replaceAll("_", " "),
        });
      },
    });

    try {
      const response = await fetchResource(resourceUrl, {
        headers: { accept: "application/json" },
        cache: "no-store",
      });
      const body = (await response.json()) as Record<string, unknown>;
      if (!response.ok) {
        return Response.json(
          {
            mode: "live",
            outcome: response.status === 402 ? "payment-required" : "settlement-failed",
            events: events
              .concat({
                stage: "payment_fallback",
                status: "failed",
                detail: `Resource denied with HTTP ${response.status}`,
              })
              .map(redactProtocolEvent),
          },
          { status: response.status },
        );
      }

      const settled = response.headers.has("payment-response");
      return Response.json(
        {
          mode: "live",
          outcome: settled ? "payment-settled" : "human-trial",
          events: events
            .concat({
              stage: settled ? "payment_fallback" : "resource",
              status: "success",
              detail: settled ? "Facilitator settlement confirmed" : "Human trial granted access",
            })
            .map(redactProtocolEvent),
          resource: body,
        },
      );
    } catch (cause) {
      return Response.json(
        {
          mode: "live",
          outcome: "settlement-failed",
          message: cause instanceof Error ? cause.message : "Live request failed",
          events: events
            .concat({
              stage: "payment_fallback",
              status: "failed",
              detail: "No settlement confirmation; protected resource denied",
            })
            .map(redactProtocolEvent),
        },
        { status: 502 },
      );
    }
  };
}

export const POST = createDemoCallHandler({ environment: process.env });
