import { describe, expect, it } from "vitest";
import {
  buildApprovalAction,
  createPendingApproval,
  markApprovalVerified
} from "./approval-workflow";

describe("approval workflow state", () => {
  it("binds approval actions to the exact agent proposal", () => {
    expect(
      buildApprovalAction({
        proposalId: "grant-482",
        risk: "high",
        amountUsd: 2500
      })
    ).toBe("hitl:grant-482:high:2500");
  });

  it("creates a pending approval with a tool part and approval context", () => {
    const approval = createPendingApproval({
      action: "hitl:grant-482:high:2500",
      proposalId: "grant-482",
      rpContext: {
        created_at: 100,
        expires_at: 700,
        nonce: "nonce",
        rp_id: "rp_test",
        signature: "0xsig"
      },
      summary: "Release grant milestone"
    });

    expect(approval.status).toBe("pending");
    expect(approval.message.parts.some((part) => part.type === "tool-approveAction")).toBe(
      true
    );
    expect(
      approval.message.parts.some(
        (part) => part.type === "data-approval-context" && part.id === approval.id
      )
    ).toBe(true);
  });

  it("marks an approval as verified without changing the bound action", () => {
    const approval = createPendingApproval({
      action: "hitl:grant-482:high:2500",
      proposalId: "grant-482",
      rpContext: {
        created_at: 100,
        expires_at: 700,
        nonce: "nonce",
        rp_id: "rp_test",
        signature: "0xsig"
      },
      summary: "Release grant milestone"
    });

    const verified = markApprovalVerified(approval, {
      mode: "live-world-id",
      nullifier: "0xabc"
    });

    expect(verified.status).toBe("verified");
    expect(verified.action).toBe("hitl:grant-482:high:2500");
    expect(verified.result).toEqual({ mode: "live-world-id", nullifier: "0xabc" });
  });
});
