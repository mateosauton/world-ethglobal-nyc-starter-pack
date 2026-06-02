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

export function AgentConsole() {
  const [agentResult, setAgentResult] = useState<DemoResult | null>(null);
  const [approval, setApproval] = useState<Approval | null>(null);
  const [message, setMessage] = useState("Protected resource is waiting.");
  const [logs, setLogs] = useState<ConsoleLog[]>([]);

  async function runAgentMode(mode: DemoResult["mode"]) {
    const response = await requestJson<DemoResult>("POST /api/agent-demo", "/api/agent-demo", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ mode })
    });

    setAgentResult(response.data);
    if (mode === "missing-agent") {
      setMessage("Resource returned a real AgentKit challenge.");
    } else if (mode === "signed-unregistered") {
      setMessage("AgentKit signed the retry, but AgentBook rejected the agent.");
    } else {
      setMessage("AgentKit signed the retry and the resource granted access.");
    }
  }

  async function createApproval() {
    const response = await requestJson<Approval>("POST /api/hitl/request", "/api/hitl/request", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: "agentkit-human-approval",
        summary: "Agent wants to claim protected support credits."
      })
    });
    setApproval(response.data);
    setMessage("Human approval request is pending.");
  }

  async function approve() {
    if (!approval) {
      return;
    }
    const response = await requestJson<Approval>("POST /api/hitl/approve", "/api/hitl/approve", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: approval.id })
    });
    setApproval(response.data);
    setMessage("Human-in-the-Loop approval completed.");
  }

  async function requestJson<T>(
    label: string,
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<{ data: T; ok: boolean; status: number }> {
    const response = await fetch(input, init);
    const text = await response.text();
    const data = text ? (JSON.parse(text) as T) : ({} as T);
    pushLog(label, {
      request: {
        body: parseJsonBody(init?.body),
        method: init?.method ?? "GET",
        url: typeof input === "string" ? input : input.toString()
      },
      response: data,
      status: response.status
    });
    return { data, ok: response.ok, status: response.status };
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
            <button onClick={() => runAgentMode("missing-agent")}>
              Fetch without AgentKit
            </button>
            <button onClick={() => runAgentMode("signed-unregistered")}>
              Run signed unregistered
            </button>
            <button onClick={() => runAgentMode("signed-allowed")} className="primary">
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
              <button onClick={createApproval}>Request approval</button>
              <button
                onClick={approve}
                disabled={!approval || approval.status === "approved"}
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
