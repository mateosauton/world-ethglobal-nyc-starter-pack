"use client";

import { useRef, useState } from "react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EventTimeline,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
} from "@world-lisbon/demo-ui";

import {
  HUMAN_BACKED_AGENT_ADDRESS,
  NON_HUMAN_BACKED_AGENT_ADDRESS,
  type DemoAgentAddress,
  type DemoCallResult,
  type DemoFlow,
} from "../lib/demo-call";

const flowLabels: Record<DemoFlow, string> = {
  "agentkit-access": "AgentKit protected resource",
  "human-approval": "Human-approved action",
};

const agentLabels: Record<DemoAgentAddress, string> = {
  [HUMAN_BACKED_AGENT_ADDRESS]: "Human-backed test agent",
  [NON_HUMAN_BACKED_AGENT_ADDRESS]: "Non-human-backed test agent",
};

export function AgentConsole({ mode }: { mode: "live" | "simulator" }) {
  const [flow, setFlow] = useState<DemoFlow>("agentkit-access");
  const [agentAddress, setAgentAddress] = useState<DemoAgentAddress>(HUMAN_BACKED_AGENT_ADDRESS);
  const [call, setCall] = useState(0);
  const [result, setResult] = useState<DemoCallResult>();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const requestGeneration = useRef(0);
  const availableFlows = mode === "simulator"
    ? Object.entries(flowLabels)
    : [["agentkit-access", flowLabels["agentkit-access"]]];

  function resetResult() {
    requestGeneration.current += 1;
    setCall(0);
    setResult(undefined);
    setError(undefined);
    setLoading(false);
  }

  async function run(approval = false) {
    if (mode === "live" && flow === "human-approval") {
      setError("Human-approved action is available only in Simulator mode.");
      return;
    }

    const generation = requestGeneration.current + 1;
    requestGeneration.current = generation;
    setLoading(true);
    setError(undefined);
    const nextCall = call + 1;
    const body =
      mode === "simulator"
        ? { mode, flow, agentAddress, call: nextCall, approval }
        : { mode, flow, call: nextCall, approval };

    try {
      const response = await fetch("/api/demo-call", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const responseBody = (await response.json()) as DemoCallResult & { message?: string };
      if (!response.ok) throw new Error(responseBody.message ?? "Request failed");
      if (generation !== requestGeneration.current) return;
      setResult(responseBody);
      setCall(nextCall);
    } catch (cause) {
      if (generation !== requestGeneration.current) return;
      setError(cause instanceof Error ? cause.message : "Request failed");
    } finally {
      if (generation === requestGeneration.current) setLoading(false);
    }
  }

  const events = result?.events.map((event, index) => ({
    id: `${event.stage}-${index}`,
    title: event.stage.replaceAll("_", " "),
    description: event.detail,
    status:
      event.status === "failed"
        ? ("error" as const)
        : event.status === "pending"
          ? ("pending" as const)
          : ("success" as const),
  }));
  const canApprove =
    mode === "simulator" &&
    flow === "human-approval" &&
    agentAddress === HUMAN_BACKED_AGENT_ADDRESS &&
    result?.action?.status === "awaiting-human-approval";

  return (
    <div className="space-y-6 py-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{flow === "agentkit-access" ? "GET /forecast" : "Simulated action"}</Badge>
            <Badge variant="secondary">{flow === "agentkit-access" ? "$0.01 fallback" : "Human decision required"}</Badge>
          </div>
          <h2 className="text-xl font-semibold">Two-flow policy console</h2>
          <p className="max-w-xl text-sm leading-6 text-muted-foreground">
            Compare AgentKit eligibility for a protected resource with a separately human-approved simulated action.
          </p>
        </div>
        <div className="font-mono text-xs text-muted-foreground">call {call}/4</div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="flow">Policy flow</Label>
          <p className="text-xs text-muted-foreground">
            {mode === "simulator"
              ? "Choose AgentKit protected resource or Human-approved action."
              : "Human-approved action is available only in Simulator mode."}
          </p>
          <Select
            value={flow}
            onValueChange={(value) => {
              setFlow(value as DemoFlow);
              resetResult();
            }}
          >
            <SelectTrigger id="flow">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableFlows.map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {mode === "simulator" && (
          <div className="grid gap-2">
            <Label htmlFor="agent-address">Simulator agent</Label>
            <p className="text-xs text-muted-foreground">
              Choose Human-backed test agent or Non-human-backed test agent.
            </p>
            <Select
              value={agentAddress}
              onValueChange={(value) => {
                setAgentAddress(value as DemoAgentAddress);
                resetResult();
              }}
            >
              <SelectTrigger id="agent-address">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(agentLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {mode === "simulator" && (
        <div className="space-y-1 text-xs text-muted-foreground">
          <p>Simulator outcomes never execute a real action.</p>
          <p>The simulator never executes a real action.</p>
          <p>Approve and execute simulated action is available only after a human-backed proposal awaits human approval.</p>
        </div>
      )}

      {flow === "agentkit-access" ? (
        <Button onClick={() => run()} disabled={loading}>
          {loading ? "Requesting…" : "Run AgentKit access"}
        </Button>
      ) : (
        <div className="space-y-3">
          <Button onClick={() => run()} disabled={loading}>
            {loading ? "Proposing…" : "Propose simulated action"}
          </Button>
          <p className="text-xs text-muted-foreground">
            Approve and execute simulated action appears only after a human-backed proposal is awaiting human approval.
          </p>
          {canApprove && (
            <Button onClick={() => run(true)} disabled={loading}>
              {loading ? "Approving…" : "Approve and execute simulated action"}
            </Button>
          )}
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Request denied</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Separator />

      <div className="grid gap-5 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Protocol events</CardTitle>
            <CardDescription>Secrets and human identifiers are redacted.</CardDescription>
          </CardHeader>
          <CardContent>
            {events ? (
              <EventTimeline events={events} />
            ) : (
              <p className="text-sm text-muted-foreground">Run a request to inspect the policy path.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Protected response</CardTitle>
            <CardDescription>Released only after the resource policy succeeds.</CardDescription>
          </CardHeader>
          <CardContent>
            {result?.resource ? (
              <pre className="overflow-x-auto rounded-md bg-muted p-4 font-mono text-xs">
                {JSON.stringify(result.resource, null, 2)}
              </pre>
            ) : (
              <p className="text-sm text-muted-foreground">No protected payload released.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Simulated action</CardTitle>
            <CardDescription>Distinct from protected-resource access.</CardDescription>
          </CardHeader>
          <CardContent>
            {result?.action ? (
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Action</dt><dd>{result.action.label}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Status</dt><dd>{result.action.status}</dd></div>
              </dl>
            ) : (
              <p className="text-sm text-muted-foreground">No action proposed.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
