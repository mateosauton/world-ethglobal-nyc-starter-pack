import { redactProtocolEvent, type ProtocolEvent } from "./agent-client";

export type SimulatorFixture =
  | "trial-sequence"
  | "unregistered-agent"
  | "failed-settlement";

export type DemoCallResult = {
  mode: "live" | "simulator";
  outcome:
    | "human-trial"
    | "payment-required"
    | "payment-settled"
    | "settlement-failed";
  events: ProtocolEvent[];
  resource?: { signal: string; confidence: number };
};

export async function runDemoCall(input: {
  mode: "simulator";
  fixture: SimulatorFixture;
  call?: number;
}): Promise<DemoCallResult> {
  const challenge: ProtocolEvent = {
    stage: "resource_challenge",
    status: "success",
    detail: "Received x402 v2 challenge with AgentKit extension",
  };

  if (input.fixture === "unregistered-agent") {
    const events: ProtocolEvent[] = [
      challenge,
      {
        stage: "agentkit_retry",
        status: "failed",
        detail: "AgentBook registration not found",
      },
      {
        stage: "payment_fallback",
        status: "pending",
        detail: "A real client would now authorize x402 payment",
      },
    ];
    return {
      mode: "simulator",
      outcome: "payment-required",
      events: events.map(redactProtocolEvent),
    };
  }

  if (input.fixture === "failed-settlement") {
    const events: ProtocolEvent[] = [
      challenge,
      {
        stage: "agentkit_retry",
        status: "failed",
        detail: "Human trial exhausted",
      },
      {
        stage: "payment_fallback",
        status: "failed",
        detail: "Facilitator rejected settlement; resource denied",
      },
    ];
    return {
      mode: "simulator",
      outcome: "settlement-failed",
      events: events.map(redactProtocolEvent),
    };
  }

  const call = input.call ?? 1;
  const trial = call <= 3;
  const events: ProtocolEvent[] = [
    challenge,
    {
      stage: "agentkit_retry",
      status: trial ? "success" : "failed",
      detail: trial
        ? `Human-backed free use ${call} of 3`
        : "Human-backed free trial exhausted",
    },
    ...(trial
      ? []
      : [
          {
            stage: "payment_fallback" as const,
            status: "success" as const,
            detail: "Simulator fixture marked settlement successful",
          },
        ]),
    {
      stage: "resource",
      status: "success",
      detail: "Scoped resource released",
    },
  ];
  return {
    mode: "simulator",
    outcome: trial ? "human-trial" : "payment-settled",
    events: events.map(redactProtocolEvent),
    resource: { signal: "lisbon-builder-signal", confidence: 0.92 },
  };
}
