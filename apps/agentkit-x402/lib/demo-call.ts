import { redactProtocolEvent, type ProtocolEvent } from "./agent-client";

export const HUMAN_BACKED_AGENT_ADDRESS = "0xbEBB5B46fFDA7E7494595E826FC4D4a61ce5f6A6" as const;
export const NON_HUMAN_BACKED_AGENT_ADDRESS = "0xDBf913F12d403540A83f091D46bDC34bf04c4Fe1" as const;

export type DemoFlow = "agentkit-access" | "human-approval";
export type DemoAgentAddress =
  | typeof HUMAN_BACKED_AGENT_ADDRESS
  | typeof NON_HUMAN_BACKED_AGENT_ADDRESS;

/** @deprecated The console will migrate to flow and agentAddress inputs. */
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
    | "approval-pending"
    | "approval-granted"
    | "action-held";
  events: ProtocolEvent[];
  resource?: { signal: string; confidence: number };
  action?: {
    status: "awaiting-human-approval" | "simulated-executed" | "held";
    label: "Publish supplier payout";
  };
};

type DemoFlowInput = {
  mode: "simulator";
  flow: DemoFlow;
  agentAddress: DemoAgentAddress;
  call?: number;
  approval?: boolean;
};

type LegacyFixtureInput = {
  mode: "simulator";
  fixture: SimulatorFixture;
  call?: number;
};

export async function runDemoCall(input: DemoFlowInput | LegacyFixtureInput): Promise<DemoCallResult> {
  const flow = "flow" in input ? input.flow : "agentkit-access";
  const agentAddress =
    "agentAddress" in input
      ? input.agentAddress
      : input.fixture === "unregistered-agent"
        ? NON_HUMAN_BACKED_AGENT_ADDRESS
        : HUMAN_BACKED_AGENT_ADDRESS;
  const humanBacked = agentAddress === HUMAN_BACKED_AGENT_ADDRESS;
  const identity: ProtocolEvent = {
    stage: "agent_identity",
    status: humanBacked ? "success" : "failed",
    detail: humanBacked
      ? "Human-backed AgentKit eligibility confirmed"
      : "AgentKit human-backing requirement was not met",
  };

  if (flow === "human-approval") {
    const proposed: ProtocolEvent = {
      stage: "action_proposed",
      status: "pending",
      detail: "Proposed simulated supplier payout publication",
    };

    if (!humanBacked) {
      return {
        mode: "simulator",
        outcome: "action-held",
        events: [identity, proposed].map(redactProtocolEvent),
        action: { status: "held", label: "Publish supplier payout" },
      };
    }

    const approved = "approval" in input && input.approval === true;
    const approval: ProtocolEvent = {
      stage: "human_approval",
      status: approved ? "success" : "pending",
      detail: approved
        ? "Simulated human approval received"
        : "Awaiting separate simulated human approval",
    };
    const events: ProtocolEvent[] = [identity, proposed, approval];
    if (approved) {
      events.push({
        stage: "action_execution",
        status: "success",
        detail: "Simulated action execution completed",
      });
    }

    return {
      mode: "simulator",
      outcome: approved ? "approval-granted" : "approval-pending",
      events: events.map(redactProtocolEvent),
      action: {
        status: approved ? "simulated-executed" : "awaiting-human-approval",
        label: "Publish supplier payout",
      },
    };
  }

  const challenge: ProtocolEvent = {
    stage: "resource_challenge",
    status: "success",
    detail: "Received x402 v2 challenge with AgentKit extension",
  };

  if (!humanBacked) {
    return {
      mode: "simulator",
      outcome: "payment-required",
      events: ([
        challenge,
        identity,
        {
          stage: "payment_fallback",
          status: "pending",
          detail: "A real client would now authorize x402 payment",
        },
      ] satisfies ProtocolEvent[]).map(redactProtocolEvent),
    };
  }

  const call = input.call ?? 1;
  const trial = call <= 3;
  const events: ProtocolEvent[] = [
    challenge,
    identity,
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
