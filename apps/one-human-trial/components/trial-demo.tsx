"use client";

import { useMemo, useState } from "react";
import {
  IDKitRequestWidget,
  proofOfHuman,
  type IDKitResult,
  type RpContext
} from "@worldcoin/idkit";
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
  Separator,
  type TimelineEvent
} from "@world-lisbon/demo-ui";

type Mode = "live" | "simulator";

type RequestContext = {
  app_id: `app_${string}`;
  action: string;
  signal: string;
  environment: "production" | "staging";
  rp_context: RpContext;
};

type VerificationResponse = {
  ok: boolean;
  granted: boolean;
  message: string;
};

const initialEvents: TimelineEvent[] = [
  {
    id: "request",
    title: "Request signed proof",
    description: "The server creates a short-lived RP context.",
    status: "pending"
  },
  {
    id: "verify",
    title: "Verify proof server-side",
    description: "The unchanged IDKit result goes to hosted v4 verification.",
    status: "pending"
  },
  {
    id: "consume",
    title: "Consume unique nullifier",
    description: "A database uniqueness constraint makes the grant atomic.",
    status: "pending"
  },
  {
    id: "grant",
    title: "Unlock one free session",
    description: "Only a live, newly consumed proof can unlock the benefit.",
    status: "pending"
  }
];

function updateEvent(
  events: TimelineEvent[],
  id: string,
  status: TimelineEvent["status"],
  metadata?: string
) {
  return events.map((event) =>
    event.id === id ? { ...event, status, metadata } : event
  );
}

export function TrialDemo({ mode }: { mode: Mode }) {
  const [events, setEvents] = useState(initialEvents);
  const [requestContext, setRequestContext] = useState<RequestContext | null>(null);
  const [widgetOpen, setWidgetOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [granted, setGranted] = useState(false);
  const [message, setMessage] = useState(
    mode === "simulator"
      ? "Run the fixture to inspect the flow. It cannot unlock a trial."
      : "Verify once to unlock your free builder session."
  );
  const [error, setError] = useState<string | null>(null);

  const preset = useMemo(
    () =>
      requestContext
        ? proofOfHuman({ signal: requestContext.signal })
        : null,
    [requestContext]
  );

  async function start() {
    setBusy(true);
    setError(null);
    setEvents(updateEvent(initialEvents, "request", "active"));

    try {
      if (mode === "simulator") {
        const response = await fetch(
          "/api/idkit/verify?mode=simulator",
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ fixture: "proof-of-human-success" })
          }
        );
        const result = (await response.json()) as VerificationResponse;
        setEvents([
          { ...initialEvents[0], status: "success", metadata: "fixture" },
          { ...initialEvents[1], status: "success", metadata: "skipped" },
          { ...initialEvents[2], status: "success", metadata: "not persisted" },
          { ...initialEvents[3], status: "pending", metadata: "locked" }
        ]);
        setGranted(false);
        setMessage(result.message);
        return;
      }

      const response = await fetch("/api/idkit/request", { method: "POST" });
      const body = (await response.json()) as RequestContext & { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Could not create IDKit request");

      setRequestContext(body);
      setEvents(updateEvent(initialEvents, "request", "success", "server signed"));
      setWidgetOpen(true);
    } catch (cause) {
      const description =
        cause instanceof Error ? cause.message : "Could not start verification";
      setError(description);
      setEvents(updateEvent(initialEvents, "request", "error"));
    } finally {
      setBusy(false);
    }
  }

  async function verify(result: IDKitResult) {
    setEvents((current) => updateEvent(current, "verify", "active"));
    const response = await fetch("/api/idkit/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      // Forward the exact widget result. Do not reconstruct the proof.
      body: JSON.stringify(result)
    });
    const body = (await response.json()) as VerificationResponse & {
      code?: string;
    };

    if (!response.ok || !body.granted) {
      setEvents((current) => updateEvent(current, "verify", "error"));
      throw new Error(body.message ?? body.code ?? "Verification failed");
    }

    setGranted(true);
    setMessage(body.message);
    setEvents([
      { ...initialEvents[0], status: "success", metadata: "server signed" },
      { ...initialEvents[1], status: "success", metadata: "World v4" },
      { ...initialEvents[2], status: "success", metadata: "new" },
      { ...initialEvents[3], status: "success", metadata: "granted" }
    ]);
  }

  return (
    <div className="grid gap-6 py-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <Badge variant={granted ? "default" : "secondary"}>
              {granted ? "Unlocked" : "Ready"}
            </Badge>
            <span className="font-mono text-xs text-muted-foreground">
              one human · one session
            </span>
          </div>
          <CardTitle className="pt-4 text-2xl">Your first session is free</CardTitle>
          <CardDescription className="text-base leading-6">
            A successful proof of human unlocks this device-independent benefit
            exactly once.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <Separator />
          {error ? (
            <Alert variant="destructive">
              <AlertTitle>Verification stopped</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <AlertTitle>{granted ? "Trial unlocked" : "No benefit granted yet"}</AlertTitle>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
          <Button className="w-full" size="lg" disabled={busy || granted} onClick={start}>
            {busy
              ? "Preparing…"
              : granted
                ? "Trial unlocked"
                : mode === "simulator"
                  ? "Run safe simulation"
                  : "Verify & unlock"}
          </Button>
          {mode === "simulator" ? (
            <p className="text-center text-xs text-muted-foreground">
              Simulator outcomes never call World, write a nullifier, or grant a benefit.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Trust event timeline</CardTitle>
          <CardDescription>Follow the boundary from request to benefit.</CardDescription>
        </CardHeader>
        <CardContent>
          <EventTimeline events={events} />
        </CardContent>
      </Card>

      {requestContext && preset ? (
        <IDKitRequestWidget
          open={widgetOpen}
          onOpenChange={setWidgetOpen}
          app_id={requestContext.app_id}
          action={requestContext.action}
          action_description="Unlock one free builder session"
          rp_context={requestContext.rp_context}
          allow_legacy_proofs
          require_user_presence
          preset={preset}
          environment={requestContext.environment}
          handleVerify={verify}
          onSuccess={() => setWidgetOpen(false)}
          onError={(code) => {
            setError(`IDKit stopped with ${code}`);
            setEvents((current) => updateEvent(current, "verify", "error"));
          }}
        />
      ) : null}
    </div>
  );
}
