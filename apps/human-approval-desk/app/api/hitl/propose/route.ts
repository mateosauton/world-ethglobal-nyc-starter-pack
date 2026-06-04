import { NextRequest, NextResponse } from "next/server";
import {
  buildApprovalAction,
  createPendingApproval,
  type ProposalRisk
} from "@/lib/approval-workflow";
import { createApprovalContext } from "@/lib/world-config";

export const runtime = "nodejs";

const risks = new Set<ProposalRisk>(["low", "medium", "high"]);

export async function POST(request: NextRequest) {
  const body = await safeJson(request);
  const proposalId = text(body.proposalId) ?? `proposal-${Date.now().toString(36)}`;
  const rawRisk = text(body.risk);
  const risk: ProposalRisk =
    rawRisk && risks.has(rawRisk as ProposalRisk) ? (rawRisk as ProposalRisk) : "medium";
  const amountUsd = number(body.amountUsd);
  const summary = text(body.summary) ?? "Agent requested a protected action.";
  const recipient = text(body.recipient) ?? "not-selected";
  const rationale =
    text(body.rationale) ?? "Agent cannot continue until a verified human approves.";
  const action = buildApprovalAction({ amountUsd, proposalId, risk });
  const { diagnostics, rpContext } = createApprovalContext(action);
  const approval = createPendingApproval({
    action,
    amountUsd,
    proposalId,
    rationale,
    recipient,
    risk,
    rpContext,
    summary
  });

  return NextResponse.json({
    approval,
    diagnostics,
    integration: {
      hook: "@worldcoin/human-in-the-loop-react/useHumanApproval",
      messagePartTypes: ["tool-approveAction", "data-approval-context"]
    }
  });
}

async function safeJson(request: NextRequest): Promise<Record<string, unknown>> {
  try {
    const body = await request.json();
    return body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function text(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function number(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}
