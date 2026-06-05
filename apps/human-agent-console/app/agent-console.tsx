"use client";

import Image from "next/image";
import { useState } from "react";

type DemoResult = {
  account?: string;
  clientEvents?: unknown[];
  status: number;
  mode: "missing-agent" | "signed-unregistered" | "signed-allowed";
  body: unknown;
};

type Approval = {
  id: string;
  action: string;
  status: "pending" | "approved";
};

type ConsoleLog = {
  id: number;
  label: string;
  request?: unknown;
  response?: unknown;
  status?: number;
  time: string;
};

type ApiResult<T> = {
  data: T;
  error?: string;
  ok: boolean;
  status: number;
};

export function AgentConsole() {
  const [agentResult, setAgentResult] = useState<DemoResult | null>(null);
  const [approval, setApproval] = useState<Approval | null>(null);
  const [message, setMessage] = useState("Protected resource is waiting.");
  const [logs, setLogs] = useState<ConsoleLog[]>([]);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  async function runAgentMode(mode: DemoResult["mode"]) {
    setPendingAction(mode);
    setMessage("Running AgentKit request.");
    try {
      const response = await requestJson<DemoResult>(
        "POST /api/agent-demo",
        "/api/agent-demo",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ mode })
        }
      );

      setAgentResult(response.data);
      if (!response.ok) {
        setMessage(`Agent request failed: ${requestErrorLabel(response)}.`);
        return;
      }

      if (mode === "missing-agent") {
        setMessage("Resource returned a real AgentKit challenge.");
      } else if (mode === "signed-unregistered") {
        setMessage("AgentKit signed the retry, but AgentBook rejected the agent.");
      } else {
        setMessage("AgentKit signed the retry and the resource granted access.");
      }
    } finally {
      setPendingAction(null);
    }
  }

  async function createApproval() {
    setPendingAction("request-approval");
    setMessage("Requesting human approval.");
    try {
      const response = await requestJson<Approval>(
        "POST /api/hitl/request",
        "/api/hitl/request",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            action: "agentkit-human-approval",
            summary: "Agent wants to claim protected support credits."
          })
        }
      );
      if (!response.ok) {
        setMessage(`Approval request failed: ${requestErrorLabel(response)}.`);
        return;
      }
      setApproval(response.data);
      setMessage("Human approval request is pending.");
    } finally {
      setPendingAction(null);
    }
  }

  async function approve() {
    if (!approval) {
      return;
    }
    setPendingAction("approve");
    setMessage("Approving locally.");
    try {
      const response = await requestJson<Approval>(
        "POST /api/hitl/approve",
        "/api/hitl/approve",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ id: approval.id })
        }
      );
      if (!response.ok) {
        setMessage(`Local approval failed: ${requestErrorLabel(response)}.`);
        return;
      }
      setApproval(response.data);
      setMessage("Human-in-the-Loop approval completed.");
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

  function pushLog(label: string, entry: Omit<ConsoleLog, "id" | "label" | "time">) {
    setLogs((current) =>
      [
        {
          id: Date.now() + Math.floor(Math.random() * 1000),
          label,
          time: new Date().toISOString(),
          ...entry
        },
        ...current
      ].slice(0, 12)
    );
  }

  return (
    <main>
      <section className="hero">
        <Image
          src="/visuals/agentkit-console-hero.png"
          alt=""
          fill
          priority
          className="heroImage"
          sizes="100vw"
        />
        <div className="heroShade" />
        <div className="heroText">
          <p className="eyebrow">Track B starter path</p>
          <h1>Human Agent Console</h1>
          <p>
            A protected-resource pattern for agents that need a verified human
            backing before they act.
          </p>
        </div>
      </section>

      <section className="consoleGrid">
        <div className="panel resourcePanel">
          <p className="eyebrow">AgentKit resource</p>
          <h2>{message}</h2>
          <div className="buttonRow">
            <button
              disabled={Boolean(pendingAction)}
              onClick={() => runAgentMode("missing-agent")}
            >
              Fetch without AgentKit
            </button>
            <button
              disabled={Boolean(pendingAction)}
              onClick={() => runAgentMode("signed-unregistered")}
            >
              Run signed unregistered
            </button>
            <button
              className="primary"
              disabled={Boolean(pendingAction)}
              onClick={() => runAgentMode("signed-allowed")}
            >
              Run signed registered
            </button>
          </div>
          <pre>
            {agentResult
              ? JSON.stringify(agentResult, null, 2)
              : "No agent request yet."}
          </pre>
        </div>

        <div className="panel approvalPanel">
          <Image
            src="/visuals/hitl-approval-card.png"
            alt=""
            width={480}
            height={480}
            className="approvalImage"
          />
          <div>
            <p className="eyebrow">Human-in-the-Loop</p>
            <h2>{approval ? approval.status : "No approval requested"}</h2>
            <div className="buttonRow">
              <button disabled={Boolean(pendingAction)} onClick={createApproval}>
                Request approval
              </button>
              <button
                onClick={approve}
                disabled={Boolean(pendingAction) || !approval || approval.status === "approved"}
                className="primary"
              >
                Approve locally
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="panel serverPanel" aria-label="Server console">
        <p className="eyebrow">Server console</p>
        <h2>Logs and responses</h2>
        <pre>{logs.length ? JSON.stringify(logs, null, 2) : "No requests yet."}</pre>
      </section>
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
