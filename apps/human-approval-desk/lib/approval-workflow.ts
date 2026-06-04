import { randomUUID } from "node:crypto";

export type ProposalRisk = "low" | "medium" | "high";

export type RpContext = {
  rp_id: string;
  nonce: string;
  created_at: number;
  expires_at: number;
  signature: string;
};

export type ApprovalStatus = "pending" | "verified" | "failed";

export type ApprovalResult = {
  mode: "live-world-id" | "local-diagnostic";
  nullifier?: string;
  raw?: unknown;
};

export type ApprovalToolPart = {
  type: "tool-approveAction";
  toolCallId: string;
  state: "input-available";
  input: {
    amountUsd: number;
    proposalId: string;
    rationale: string;
    recipient: string;
    risk: ProposalRisk;
    summary: string;
  };
};

export type ApprovalContextPart = {
  type: "data-approval-context";
  id: string;
  data: {
    action: string;
    rpContext: RpContext;
    webhookUrl: string;
  };
};

export type ApprovalMessage = {
  id: string;
  role: "assistant";
  parts: [ApprovalToolPart, ApprovalContextPart];
};

export type ApprovalRun = {
  id: string;
  action: string;
  amountUsd: number;
  completedAt?: string;
  createdAt: string;
  error?: string;
  message: ApprovalMessage;
  proposalId: string;
  rationale: string;
  recipient: string;
  result?: ApprovalResult;
  risk: ProposalRisk;
  status: ApprovalStatus;
  summary: string;
  toolPart: ApprovalToolPart;
  updatedAt: string;
};

export type CreateApprovalInput = {
  action: string;
  amountUsd?: number;
  id?: string;
  proposalId: string;
  rationale?: string;
  recipient?: string;
  risk?: ProposalRisk;
  rpContext: RpContext;
  summary: string;
  webhookUrl?: string;
};

const globalForApprovals = globalThis as typeof globalThis & {
  worldStarterHitlApprovals?: Map<string, ApprovalRun>;
};

const approvals =
  globalForApprovals.worldStarterHitlApprovals ?? new Map<string, ApprovalRun>();
globalForApprovals.worldStarterHitlApprovals = approvals;

export function buildApprovalAction(input: {
  amountUsd?: number;
  proposalId: string;
  risk?: ProposalRisk;
}) {
  const proposalId = input.proposalId.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
  const risk = input.risk ?? "medium";
  const amountUsd = Math.max(0, Math.round(input.amountUsd ?? 0));

  return `hitl:${proposalId}:${risk}:${amountUsd}`;
}

export function createPendingApproval(input: CreateApprovalInput): ApprovalRun {
  const id = input.id ?? randomUUID();
  const amountUsd = Math.max(0, Math.round(input.amountUsd ?? 0));
  const risk = input.risk ?? "medium";
  const recipient = input.recipient ?? "not-selected";
  const rationale =
    input.rationale ?? "Agent requires a verified human approval before it can continue.";
  const webhookUrl = input.webhookUrl ?? `/api/hitl/verify/${id}`;
  const createdAt = new Date().toISOString();

  const toolPart: ApprovalToolPart = {
    type: "tool-approveAction",
    toolCallId: id,
    state: "input-available",
    input: {
      amountUsd,
      proposalId: input.proposalId,
      rationale,
      recipient,
      risk,
      summary: input.summary
    }
  };

  const contextPart: ApprovalContextPart = {
    type: "data-approval-context",
    id,
    data: {
      action: input.action,
      rpContext: input.rpContext,
      webhookUrl
    }
  };

  const approval: ApprovalRun = {
    id,
    action: input.action,
    amountUsd,
    createdAt,
    message: {
      id: `assistant-${id}`,
      role: "assistant",
      parts: [toolPart, contextPart]
    },
    proposalId: input.proposalId,
    rationale,
    recipient,
    risk,
    status: "pending",
    summary: input.summary,
    toolPart,
    updatedAt: createdAt
  };

  approvals.set(id, approval);
  return approval;
}

export function markApprovalVerified(
  approval: ApprovalRun,
  result: ApprovalResult
): ApprovalRun {
  const completedAt = new Date().toISOString();

  return {
    ...approval,
    completedAt,
    error: undefined,
    result,
    status: "verified",
    updatedAt: completedAt
  };
}

export function completeApproval(id: string, result: ApprovalResult): ApprovalRun | null {
  const approval = approvals.get(id);
  if (!approval) {
    return null;
  }

  const verified = markApprovalVerified(approval, result);
  approvals.set(id, verified);
  return verified;
}

export function failApproval(id: string, error: string): ApprovalRun | null {
  const approval = approvals.get(id);
  if (!approval) {
    return null;
  }

  const failed = {
    ...approval,
    error,
    status: "failed" as const,
    updatedAt: new Date().toISOString()
  };
  approvals.set(id, failed);
  return failed;
}

export function getApproval(id: string) {
  return approvals.get(id) ?? null;
}

export function listApprovals() {
  return [...approvals.values()].sort((left, right) =>
    right.createdAt.localeCompare(left.createdAt)
  );
}

export function resetApprovals() {
  approvals.clear();
}
