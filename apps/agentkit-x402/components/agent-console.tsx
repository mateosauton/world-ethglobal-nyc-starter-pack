"use client";

import { useState } from "react";
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

import type { DemoCallResult, SimulatorFixture } from "../lib/demo-call";

const fixtureLabels: Record<SimulatorFixture, string> = {
  "trial-sequence": "Three free uses, then payment",
  "unregistered-agent": "Unregistered agent",
  "failed-settlement": "Failed settlement",
};

export function AgentConsole({ mode }: { mode: "live" | "simulator" }) {
  const [fixture, setFixture] = useState<SimulatorFixture>("trial-sequence");
  const [call, setCall] = useState(0);
  const [result, setResult] = useState<DemoCallResult>();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    setError(undefined);
    const nextCall = call + 1;
    try {
      const response = await fetch("/api/demo-call", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mode, fixture, call: nextCall }),
      });
      const body = (await response.json()) as DemoCallResult & { message?: string };
      if (!response.ok) throw new Error(body.message ?? "Request failed");
      setResult(body);
      setCall(nextCall);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Request failed");
    } finally {
      setLoading(false);
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

  return (
    <div className="space-y-6 py-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline">GET /forecast</Badge>
            <Badge variant="secondary">$0.01 fallback</Badge>
          </div>
          <h2 className="text-xl font-semibold">Human-first request console</h2>
          <p className="max-w-xl text-sm leading-6 text-muted-foreground">
            One anonymous human shares three free calls across every agent they register.
          </p>
        </div>
        <div className="font-mono text-xs text-muted-foreground">call {call}/4</div>
      </div>

      {mode === "simulator" && (
        <div className="grid gap-2">
          <Label htmlFor="fixture">Simulator fixture</Label>
          <Select
            value={fixture}
            onValueChange={(value) => {
              setFixture(value as SimulatorFixture);
              setCall(0);
              setResult(undefined);
            }}
          >
            <SelectTrigger id="fixture" className="max-w-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(fixtureLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Fixtures never sign, pay, persist quota, or unlock the live resource.
          </p>
        </div>
      )}

      <Button onClick={run} disabled={loading}>
        {loading ? "Requesting…" : "Run human-first request"}
      </Button>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Resource denied</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Separator />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Protocol events</CardTitle>
            <CardDescription>Secrets and human identifiers are redacted.</CardDescription>
          </CardHeader>
          <CardContent>
            {events ? (
              <EventTimeline events={events} />
            ) : (
              <p className="text-sm text-muted-foreground">Run a request to inspect the retry order.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Protected response</CardTitle>
            <CardDescription>Returned only after trial access or successful settlement.</CardDescription>
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
      </div>
    </div>
  );
}
