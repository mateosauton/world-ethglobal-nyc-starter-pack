"use client";

import { useHumanApproval } from "@worldcoin/human-in-the-loop-react";
import { IDKitRequestWidget, orbLegacy, type IDKitResult } from "@worldcoin/idkit";
import type { UIMessage, UIMessagePart } from "ai";
import Image from "next/image";
import { useMemo, useState } from "react";
import type { ApprovalRun, ProposalRisk } from "@/lib/approval-workflow";
import type { HitlDiagnostics } from "@/lib/world-config";

type ProposalDraft = {
  amountUsd: number;
  label: string;
  proposalId: string;
  rationale: string;
  recipient: string;
  risk: ProposalRisk;
  summary: string;
};

type ApiLog = {
  id: number;
  label: string;
  request?: unknown;
  response?: unknown;
  status?: number;
  time: string;
};

type ProposeResponse = {
  approval: ApprovalRun;
  diagnostics: HitlDiagnostics;
};

type ApprovalResponse = {
  approval: ApprovalRun;
  diagnostics?: HitlDiagnostics;
  error?: string;
  execution?: unknown;
  note?: string;
};

const proposals: ProposalDraft[] = [
  {
    amountUsd: 2500,
    label: "Grant payout",
    proposalId: "grant-482",
    rationale: "Funds leave the sponsor wallet after the agent releases the milestone.",
    recipient: "0x7A18...E2c9",
    risk: "high",
    summary: "Release a milestone payout to a winning hacker team."
  },
  {
    amountUsd: 180,
    label: "Support refund",
    proposalId: "refund-119",
    rationale: "The agent found a duplicate charge and wants to refund the attendee.",
    recipient: "0x91B4...a8D1",
    risk: "medium",
    summary: "Refund a verified attendee for a duplicate checkout."
  },
  {
    amountUsd: 0,
    label: "Access change",
    proposalId: "access-037",
    rationale: "The agent wants to grant admin access to a venue operations lead.",
    recipient: "ops-lead@hackathon.local",
    risk: "high",
    summary: "Grant production console access during demo day."
  }
];

const emptyMessage = { id: "empty", role: "assistant", parts: [] } as unknown as UIMessage;
const emptyPart = { type: "text", text: "" } as unknown as UIMessagePart<any, any>;

export function ApprovalDesk() {
  const [draft, setDraft] = useState<ProposalDraft>(proposals[0]);
  const [approval, setApproval] = useState<ApprovalRun | null>(null);
  const [diagnostics, setDiagnostics] = useState<HitlDiagnostics | null>(null);
  const [message, setMessage] = useState("Agent action is waiting for review.");
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [open, setOpen] = useState(false);

  const activeMessage = (approval?.message ?? emptyMessage) as unknown as UIMessage;
  const activePart = (approval?.toolPart ?? emptyPart) as unknown as UIMessagePart<
    any,
    any
  >;
  const approvalState = useHumanApproval(activeMessage, activePart);
  const worldAppId = process.env.NEXT_PUBLIC_WORLD_APP_ID as `app_${string}` | undefined;
  const liveWorldIdReady = Boolean(
    approval &&
      approval.status === "pending" &&
      diagnostics?.configured &&
      approvalState.ready &&
      approvalState.action &&
      approvalState.rpContext &&
      worldAppId?.startsWith("app_")
  );

  const statusItems = useMemo(
    () => [
      {
        label: "Context",
        value: diagnostics?.mode === "signed-context" ? "Signed" : "Diagnostic"
      },
      {
        label: "World ID",
        value: liveWorldIdReady ? "Ready" : "Needs config"
      },
      {
        label: "Approval",
        value: approval?.status ?? "Not requested"
      }
    ],
    [approval?.status, diagnostics?.mode, liveWorldIdReady]
  );

  async function requestApproval() {
    setMessage("Requesting human approval context.");
    const response = await requestJson<ProposeResponse>(
      "POST /api/hitl/propose",
      "/api/hitl/propose",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(draft)
      }
    );

    if (!response.ok) {
      setMessage("Approval request failed.");
      return;
    }

    setApproval(response.data.approval);
    setDiagnostics(response.data.diagnostics);
    setMessage(
      response.data.diagnostics.configured
        ? "Signed proof request is ready."
        : "Live World ID approval needs portal credentials."
    );
  }

  async function approveLocally() {
    if (!approval) {
      return;
    }

    const response = await requestJson<ApprovalResponse>(
      "POST /api/hitl/local-approve",
      "/api/hitl/local-approve",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: approval.id })
      }
    );

    if (response.data.approval) {
      setApproval(response.data.approval);
    }
    setMessage(
      response.ok
        ? "Local diagnostic approval recorded."
        : response.data.error ?? "Local approval failed."
    );
  }

  async function handleWorldProof(result: IDKitResult) {
    if (!approvalState.webhookUrl) {
      throw new Error("Human approval webhook is not ready.");
    }

    const response = await requestJson<ApprovalResponse>(
      "POST HITL verification webhook",
      approvalState.webhookUrl,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(result)
      }
    );

    if (response.data.approval) {
      setApproval(response.data.approval);
    }
    if (response.data.diagnostics) {
      setDiagnostics(response.data.diagnostics);
    }
    if (!response.ok) {
      throw new Error(response.data.error ?? "World ID proof verification failed.");
    }

    setMessage("World ID proof accepted. Agent can resume.");
  }

  async function resumeAgent() {
    if (!approval) {
      return;
    }

    const response = await requestJson<ApprovalResponse>(
      "POST /api/hitl/resume",
      "/api/hitl/resume",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: approval.id })
      }
    );

    setMessage(
      response.ok
        ? "Agent action resumed after human approval."
        : response.data.error ?? "Agent action is blocked."
    );
  }

  async function requestJson<T>(
    label: string,
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<{ data: T; ok: boolean; status: number }> {
    const requestBody = parseJsonBody(init?.body);
    const response = await fetch(input, init);
    const text = await response.text();
    const data = text ? (JSON.parse(text) as T) : ({} as T);
    pushLog(label, {
      request: {
        body: requestBody,
        method: init?.method ?? "GET",
        url: typeof input === "string" ? input : input.toString()
      },
      response: data,
      status: response.status
    });
    return { data, ok: response.ok, status: response.status };
  }

  function pushLog(label: string, entry: Omit<ApiLog, "id" | "label" | "time">) {
    setLogs((current) =>
      [
        {
          id: Date.now() + Math.floor(Math.random() * 1000),
          label,
          time: new Date().toISOString(),
          ...entry
        },
        ...current
      ].slice(0, 14)
    );
  }

  function selectProposal(nextDraft: ProposalDraft) {
    setDraft(nextDraft);
    setApproval(null);
    setDiagnostics(null);
    setMessage("Agent action is waiting for review.");
  }

  return (
    <main className="deskShell">
      <section className="hero">
        <Image
          src="/visuals/hitl-approval-desk-hero.png"
          alt=""
          fill
          priority
          className="heroImage"
          sizes="100vw"
        />
        <div className="heroShade" />
        <div className="heroContent">
          <p className="eyebrow">HITL starter path</p>
          <h1>Verified Action Desk</h1>
          <p className="subhead">
            Agents pause on sensitive work until a real person approves with World ID.
          </p>
        </div>
      </section>

      <section className="workspaceBand">
        <div className="proposalRail">
          <p className="eyebrow">Agent proposals</p>
          <div className="proposalList">
            {proposals.map((proposal) => (
              <button
                className={
                  proposal.proposalId === draft.proposalId
                    ? "proposalOption active"
                    : "proposalOption"
                }
                key={proposal.proposalId}
                onClick={() => selectProposal(proposal)}
                type="button"
              >
                <span>{proposal.label}</span>
                <strong>{formatUsd(proposal.amountUsd)}</strong>
              </button>
            ))}
          </div>
        </div>

        <div className="approvalStage">
          <div className="stageHeader">
            <div>
              <p className="eyebrow">Approval request</p>
              <h2>{message}</h2>
            </div>
            <span className={`risk ${draft.risk}`}>{draft.risk}</span>
          </div>

          <div className="statusGrid">
            {statusItems.map((item) => (
              <div key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>

          <div className="editorGrid">
            <label>
              <span>Summary</span>
              <textarea
                value={draft.summary}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, summary: event.target.value }))
                }
              />
            </label>
            <label>
              <span>Recipient</span>
              <input
                value={draft.recipient}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, recipient: event.target.value }))
                }
              />
            </label>
            <label>
              <span>Amount USD</span>
              <input
                inputMode="numeric"
                value={draft.amountUsd}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    amountUsd: Number(event.target.value) || 0
                  }))
                }
              />
            </label>
            <label>
              <span>Risk</span>
              <select
                value={draft.risk}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    risk: event.target.value as ProposalRisk
                  }))
                }
              >
                <option value="low">low</option>
                <option value="medium">medium</option>
                <option value="high">high</option>
              </select>
            </label>
          </div>

          <div className="actionRow">
            <button onClick={requestApproval} type="button">
              Request human approval
            </button>
            <button
              className="primary"
              disabled={!liveWorldIdReady}
              onClick={() => setOpen(true)}
              type="button"
            >
              Verify with World ID
            </button>
            <button
              disabled={!approval || approval.status !== "pending"}
              onClick={approveLocally}
              type="button"
            >
              Use local diagnostic approval
            </button>
            <button
              disabled={!approval || approval.status !== "verified"}
              onClick={resumeAgent}
              type="button"
            >
              Resume action
            </button>
          </div>

          <dl className="approvalDetails">
            <div>
              <dt>Action</dt>
              <dd>{approval?.action ?? "Not requested"}</dd>
            </div>
            <div>
              <dt>Webhook</dt>
              <dd>{approvalState.webhookUrl ?? "Not streamed"}</dd>
            </div>
            <div>
              <dt>Missing config</dt>
              <dd>{diagnostics?.missing.length ? diagnostics.missing.join(", ") : "None"}</dd>
            </div>
            <div>
              <dt>Result</dt>
              <dd>{approval?.result?.mode ?? approval?.error ?? "Pending"}</dd>
            </div>
          </dl>
        </div>

        <section className="serverConsole" aria-label="Server console">
          <div className="consoleHeader">
            <div>
              <p className="eyebrow">Server console</p>
              <h2>Logs and responses</h2>
            </div>
            <button onClick={() => setLogs([])} type="button">
              Clear
            </button>
          </div>
          <pre>{logs.length ? JSON.stringify(logs, null, 2) : "No requests yet."}</pre>
        </section>
      </section>

      {approvalState.rpContext && approvalState.action && worldAppId?.startsWith("app_") ? (
        <IDKitRequestWidget
          open={open}
          onOpenChange={setOpen}
          app_id={worldAppId}
          action={approvalState.action}
          action_description={approval?.summary}
          rp_context={approvalState.rpContext}
          allow_legacy_proofs={false}
          environment="staging"
          preset={orbLegacy({ signal: approval?.proposalId ?? draft.proposalId })}
          handleVerify={handleWorldProof}
          onSuccess={() => setOpen(false)}
          onError={(errorCode) => setMessage(`World ID error: ${errorCode}`)}
        />
      ) : null}
    </main>
  );
}

function parseJsonBody(body: BodyInit | null | undefined) {
  if (typeof body !== "string") {
    return undefined;
  }
  try {
    return JSON.parse(body);
  } catch {
    return body;
  }
}

function formatUsd(amount: number) {
  return amount > 0 ? `$${amount.toLocaleString("en-US")}` : "No funds";
}
