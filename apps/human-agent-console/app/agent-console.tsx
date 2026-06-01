"use client";

import Image from "next/image";
import { useState } from "react";

type DemoResult = {
  status: number;
  mode: "missing-agent" | "unregistered-agent" | "allowed";
  body: unknown;
};

type Approval = {
  id: string;
  action: string;
  status: "pending" | "approved";
};

export function AgentConsole() {
  const [agentResult, setAgentResult] = useState<DemoResult | null>(null);
  const [approval, setApproval] = useState<Approval | null>(null);
  const [message, setMessage] = useState("Protected resource is waiting.");

  async function runMissingAgent() {
    const response = await fetch("/api/agent-demo", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ mode: "missing-agent" })
    });
    const data = (await response.json()) as DemoResult;
    setAgentResult(data);
    setMessage("Missing agent received a World AgentKit challenge.");
  }

  async function runRegisteredAgent() {
    const response = await fetch("/api/agent-demo", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ mode: "allowed" })
    });
    const data = (await response.json()) as DemoResult;
    setAgentResult(data);
    setMessage("Registered human-backed agent accessed the resource.");
  }

  async function createApproval() {
    const response = await fetch("/api/hitl/request", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: "agentkit-human-approval",
        summary: "Agent wants to claim protected support credits."
      })
    });
    const data = (await response.json()) as Approval;
    setApproval(data);
    setMessage("Human approval request is pending.");
  }

  async function approve() {
    if (!approval) {
      return;
    }
    const response = await fetch("/api/hitl/approve", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: approval.id })
    });
    const data = (await response.json()) as Approval;
    setApproval(data);
    setMessage("Human-in-the-Loop approval completed.");
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
            <button onClick={runMissingAgent}>Challenge missing agent</button>
            <button onClick={runRegisteredAgent} className="primary">
              Run registered agent
            </button>
          </div>
          <pre>{JSON.stringify(agentResult, null, 2) || "No agent request yet."}</pre>
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
    </main>
  );
}

