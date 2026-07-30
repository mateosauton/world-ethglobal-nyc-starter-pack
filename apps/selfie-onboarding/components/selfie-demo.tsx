"use client"

import { useState } from "react"
import { Alert, AlertDescription, Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Separator } from "@world-lisbon/demo-ui"

import { FeedbackForm } from "./feedback-form"
import { LiveSelfieWidget } from "./live-selfie-widget"

type SelfieDemoProps = { liveAvailable: boolean }

export function SelfieDemo({ liveAvailable }: SelfieDemoProps) {
  const [simulated, setSimulated] = useState(false)

  return (
    <div className="space-y-8 pt-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Badge variant="outline">Legacy beta</Badge>
          <h2 className="text-2xl font-semibold tracking-tight">Low-friction onboarding checkpoint</h2>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">Test the UX before requesting beta access. The simulator demonstrates states only; it does not perform or claim liveness.</p>
        </div>
        <Badge variant={liveAvailable ? "default" : "secondary"}>{liveAvailable ? "Live eligible" : "Simulator default"}</Badge>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <Card><CardHeader><CardTitle className="text-base">1. Explain</CardTitle><CardDescription>Say why a camera step is needed and call it beta.</CardDescription></CardHeader></Card>
        <Card><CardHeader><CardTitle className="text-base">2. Check</CardTitle><CardDescription>Use the legacy preset only after server eligibility succeeds.</CardDescription></CardHeader></Card>
        <Card><CardHeader><CardTitle className="text-base">3. Continue</CardTitle><CardDescription>Verify on the backend, then collect privacy-safe UX feedback.</CardDescription></CardHeader></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>{liveAvailable ? "Live beta path" : "Simulator path"}</CardTitle><CardDescription>{liveAvailable ? "This deployment has the explicit beta gate and World configuration." : "Safe for workshops; no proof is created and no liveness result is implied."}</CardDescription></CardHeader>
        <CardContent className="space-y-5">
          {liveAvailable ? <LiveSelfieWidget /> : <Button onClick={() => setSimulated(true)}>{simulated ? "Run simulator again" : "Simulate successful handoff"}</Button>}
          {simulated && <Alert><AlertDescription>Simulated completion: the UI may continue, but this outcome must never unlock a real benefit.</AlertDescription></Alert>}
        </CardContent>
      </Card>

      <Separator />
      <section className="space-y-4"><div><h3 className="text-lg font-semibold">Beta feedback</h3><p className="text-sm text-muted-foreground">Record the path and friction—never identity or camera data.</p></div><FeedbackForm /></section>
    </div>
  )
}
