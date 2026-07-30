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
  CodePanel,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator
} from "@world-lisbon/demo-ui";

import {
  getPolicyRecommendation,
  trustEvents,
  type TrustEventId
} from "../lib/policy-catalog";

function availabilityLabel(availability: string) {
  if (availability === "legacy-beta") return "Legacy beta";
  if (availability === "preview") return "Preview";
  return "Ready";
}

export function PolicyLab() {
  const [event, setEvent] = useState<TrustEventId>("one-per-human-promotion");
  const [identityCheckEnabled, setIdentityCheckEnabled] = useState(false);
  const [selfieCheckEnabled, setSelfieCheckEnabled] = useState(false);
  const recommendation = getPolicyRecommendation(event, {
    identityCheckEnabled,
    selfieCheckEnabled
  });

  const isGated = recommendation.availability !== "ready";

  function enableCurrentGate() {
    if (recommendation.availability === "preview") setIdentityCheckEnabled(true);
    if (recommendation.availability === "legacy-beta") setSelfieCheckEnabled(true);
  }

  return (
    <div className="space-y-6 py-6">
      <div className="space-y-2">
        <Badge variant="outline">Policy configurator</Badge>
        <h2 className="text-2xl font-semibold tracking-tight">Choose the trust event</h2>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Start with what your product must trust. The lab recommends the minimum
          sufficient World credential and produces a current TypeScript policy.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="trust-event">Product event</Label>
        <Select value={event} onValueChange={(value) => setEvent(value as TrustEventId)}>
          <SelectTrigger id="trust-event" className="max-w-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {trustEvents.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(22rem,0.8fr)]">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{recommendation.credential}</Badge>
              <Badge variant="outline">{recommendation.protocol}</Badge>
              <Badge variant={isGated ? "secondary" : "outline"}>
                {availabilityLabel(recommendation.availability)}
              </Badge>
            </div>
            <CardTitle className="pt-2">{recommendation.event}</CardTitle>
            <CardDescription>{recommendation.minimumAssurance}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <p className="font-medium">Abuse prevented</p>
              <p className="mt-1 leading-6 text-muted-foreground">
                {recommendation.abusePrevented}
              </p>
            </div>
            <Separator />
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Configuration status</span>
              <Badge variant={recommendation.enabled ? "default" : "secondary"}>
                {recommendation.enabled ? "Available" : "Gated"}
              </Badge>
            </div>
            {isGated && !recommendation.enabled ? (
              <Button
                type="button"
                variant="outline"
                onClick={enableCurrentGate}
              >
                I have confirmed access — enable example
              </Button>
            ) : null}
          </CardContent>
        </Card>

        <div className="space-y-3">
          {recommendation.warnings.map((warning) => (
            <Alert key={warning}>
              <AlertTitle>Current platform boundary</AlertTitle>
              <AlertDescription>{warning}</AlertDescription>
            </Alert>
          ))}
        </div>
      </div>

      <CodePanel title="Copy TypeScript" code={recommendation.generatedCode} />
    </div>
  );
}
