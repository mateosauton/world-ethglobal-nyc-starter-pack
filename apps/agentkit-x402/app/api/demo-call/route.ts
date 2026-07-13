import { privateKeyToAccount } from "viem/accounts";

import { createLiveHumanFirstFetch, redactProtocolEvent, type ProtocolEvent } from "../../../lib/agent-client";
import { runDemoCall, type SimulatorFixture } from "../../../lib/demo-call";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function privateKey(value: string | undefined): `0x${string}` | null {
  return value?.startsWith("0x") && value.length === 66
    ? (value as `0x${string}`)
    : null;
}

export async function POST(request: Request) {
  const input = (await request.json()) as {
    mode?: "live" | "simulator";
    fixture?: SimulatorFixture;
    call?: number;
  };

  if (input.mode !== "live") {
    const result = await runDemoCall({
      mode: "simulator",
      fixture: input.fixture ?? "trial-sequence",
      call: input.call,
    });
    return Response.json(result);
  }

  const resourceUrl = process.env.AGENTKIT_RESOURCE_URL;
  const agentKey = privateKey(process.env.AGENTKIT_AGENT_PRIVATE_KEY);
  const paymentKey = privateKey(process.env.X402_PAYMENT_PRIVATE_KEY);
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
      chainId: process.env.X402_NETWORK ?? "eip155:84532",
      type: "eip191",
      signMessage: (message) => agentAccount.signMessage({ message }),
    },
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
    return Response.json({
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
    });
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
}
