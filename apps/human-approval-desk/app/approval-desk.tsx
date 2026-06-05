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

type ApiResult<T> = {
  data: T;
  error?: string;
  ok: boolean;
  status: number;
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
  const [pendingAction, setPendingAction] = useState<string | null>(null);

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
    setPendingAction("request-approval");
    setMessage("Requesting human approval context.");
    try {
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
        setMessage(`Approval request failed: ${requestErrorLabel(response)}.`);
        return;
      }

      setApproval(response.data.approval);
      setDiagnostics(response.data.diagnostics);
      setMessage(
        response.data.diagnostics.configured
          ? "Signed proof request is ready."
          : "Live World ID approval needs portal credentials."
      );
    } finally {
      setPendingAction(null);
    }
  }

  async function approveLocally() {
    if (!approval) {
      return;
    }

    setPendingAction("local-approve");
    setMessage("Recording local diagnostic approval.");
    try {
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
          : response.data.error ?? requestErrorLabel(response)
      );
    } finally {
      setPendingAction(null);
    }
  }

  async function handleWorldProof(result: IDKitResult) {
    if (!approvalState.webhookUrl) {
      const message = "Human approval webhook is not ready.";
      pushLog("POST HITL verification webhook", {
        request: { body: result, method: "POST", url: "not-ready" },
        response: { error: message },
        status: 0
      });
      setMessage(message);
      throw new Error(message);
    }

    setPendingAction("world-proof");
    setMessage("Verifying World ID proof.");
    try {
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
        const message = response.data.error ?? requestErrorLabel(response);
        setMessage(`World ID proof failed: ${message}.`);
        throw new Error(message);
      }

      setMessage("World ID proof accepted. Agent can resume.");
    } finally {
      setPendingAction(null);
    }
  }

  async function resumeAgent() {
    if (!approval) {
      return;
    }

    setPendingAction("resume");
    setMessage("Resuming agent action.");
    try {
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
          : response.data.error ?? requestErrorLabel(response)
      );
    } finally {
      setPendingAction(null);
    }
  }

  async function requestJson<T>(
    label: string,
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<ApiResult<T>> {
    const request = {
      body: parseJsonBody(init?.body),
      method: init?.method ?? "GET",
      url: typeof input === "string" ? input : input.toString()
    };

    try {
      const response = await fetch(input, init);
      const text = await response.text();
      const data = parseResponseBody<T>(text);
      pushLog(label, {
        request,
        response: data,
        status: response.status
      });
      return { data, ok: response.ok, status: response.status };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Request failed.";
      const data = { error: message } as T;
      pushLog(label, {
        request,
        response: data,
        status: 0
      });
      return { data, error: message, ok: false, status: 0 };
    }
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
    setPendingAction(null);
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
            <button
              disabled={Boolean(pendingAction)}
              onClick={requestApproval}
              type="button"
            >
              Request human approval
            </button>
            <button
              className="primary"
              disabled={Boolean(pendingAction) || !liveWorldIdReady}
              onClick={() => setOpen(true)}
              type="button"
            >
              Verify with World ID
            </button>
            <button
              disabled={Boolean(pendingAction) || !approval || approval.status !== "pending"}
              onClick={approveLocally}
              type="button"
            >
              Use local diagnostic approval
            </button>
            <button
              disabled={Boolean(pendingAction) || !approval || approval.status !== "verified"}
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
          onError={(errorCode) => {
            pushLog("IDKit error", {
              response: { error: errorCode },
              status: 0
            });
            setMessage(`World ID error: ${errorCode}`);
          }}
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

function parseResponseBody<T>(text: string) {
  if (!text) {
    return {} as T;
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    return {
      body: text.slice(0, 2000),
      error: "Server returned a non-JSON response."
    } as T;
  }
}

function requestErrorLabel<T>(response: ApiResult<T>) {
  if (response.error) {
    return response.error;
  }
  if (isRecord(response.data) && typeof response.data.error === "string") {
    return response.data.error;
  }
  if (isRecord(response.data) && typeof response.data.message === "string") {
    return response.data.message;
  }
  return response.status ? `HTTP ${response.status}` : "network error";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function formatUsd(amount: number) {
  return amount > 0 ? `$${amount.toLocaleString("en-US")}` : "No funds";
}
