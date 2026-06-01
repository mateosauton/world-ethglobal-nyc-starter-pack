import { randomUUID } from "node:crypto";

export type ApprovalRecord = {
  id: string;
  action: string;
  summary: string;
  status: "pending" | "approved";
};

const globalForApprovals = globalThis as typeof globalThis & {
  worldStarterApprovals?: Map<string, ApprovalRecord>;
};

export const approvals =
  globalForApprovals.worldStarterApprovals ?? new Map<string, ApprovalRecord>();
globalForApprovals.worldStarterApprovals = approvals;

export function createApproval(input: {
  action?: string;
  summary?: string;
}): ApprovalRecord {
  const record: ApprovalRecord = {
    id: randomUUID(),
    action: input.action ?? "agentkit-human-approval",
    summary: input.summary ?? "Agent requested a protected action.",
    status: "pending"
  };
  approvals.set(record.id, record);
  return record;
}

export function approveRecord(id: string): ApprovalRecord | null {
  const record = approvals.get(id);
  if (!record) {
    return null;
  }

  const approved: ApprovalRecord = { ...record, status: "approved" };
  approvals.set(record.id, approved);
  return approved;
}

