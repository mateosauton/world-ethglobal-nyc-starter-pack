"use client"

import { useState, type FormEvent } from "react"
import { Alert, AlertDescription, Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea } from "@world-lisbon/demo-ui"

type FeedbackFormProps = { defaultPath?: "hot" | "warm" | "cold" | "error" }

export function FeedbackForm({ defaultPath = "warm" }: FeedbackFormProps) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle")

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus("sending")
    const data = new FormData(event.currentTarget)
    const response = await fetch("/api/feedback", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        path: data.get("path"),
        device: data.get("device"),
        osBrowser: data.get("osBrowser"),
        worldAppState: data.get("worldAppState"),
        completed: data.get("completed") === "yes",
        durationBucket: data.get("durationBucket"),
        errorCode: data.get("errorCode") || null,
        retryCount: Number(data.get("retryCount")),
        clarityRating: Number(data.get("clarityRating")),
        frictionRating: Number(data.get("frictionRating")),
        privacyComprehension: data.get("privacyComprehension"),
        comments: data.get("comments") || undefined,
      }),
    })
    setStatus(response.ok ? "sent" : "error")
  }

  return (
    <form className="space-y-5" onSubmit={submit}>
      <div className="grid gap-5 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="path">Test path</Label>
          <Select name="path" defaultValue={defaultPath}>
            <SelectTrigger id="path"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="hot">Hot</SelectItem>
              <SelectItem value="warm">Warm</SelectItem>
              <SelectItem value="cold">Cold</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2"><Label htmlFor="device">Device</Label><Select name="device" defaultValue="desktop"><SelectTrigger id="device"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="desktop">Desktop</SelectItem><SelectItem value="phone">Phone</SelectItem><SelectItem value="tablet">Tablet</SelectItem></SelectContent></Select></div>
        <div className="space-y-2"><Label htmlFor="osBrowser">OS / browser</Label><Input id="osBrowser" name="osBrowser" maxLength={120} placeholder="macOS / Chrome" required /></div>
        <div className="space-y-2"><Label htmlFor="worldAppState">World App state</Label><Select name="worldAppState" defaultValue="installed"><SelectTrigger id="worldAppState"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="installed">Installed</SelectItem><SelectItem value="new-install">New install</SelectItem><SelectItem value="not-installed">Not installed</SelectItem></SelectContent></Select></div>
        <div className="space-y-2"><Label htmlFor="durationBucket">Duration</Label><Select name="durationBucket" defaultValue="30-60s"><SelectTrigger id="durationBucket"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="under-30s">Under 30 seconds</SelectItem><SelectItem value="30-60s">30–60 seconds</SelectItem><SelectItem value="1-2m">1–2 minutes</SelectItem><SelectItem value="over-2m">Over 2 minutes</SelectItem></SelectContent></Select></div>
        <div className="space-y-2"><Label htmlFor="retryCount">Retry count</Label><Input id="retryCount" name="retryCount" type="number" min={0} max={20} defaultValue={0} required /></div>
        <div className="space-y-2"><Label htmlFor="errorCode">Error code (optional)</Label><Input id="errorCode" name="errorCode" maxLength={120} placeholder="credential_unavailable" /></div>
        <div className="space-y-2">
          <Label htmlFor="clarityRating">Clarity</Label>
          <Select name="clarityRating" defaultValue="4">
            <SelectTrigger id="clarityRating"><SelectValue /></SelectTrigger>
            <SelectContent>{[1, 2, 3, 4, 5].map((rating) => <SelectItem key={rating} value={String(rating)}>{rating} / 5</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2"><Label htmlFor="frictionRating">Friction</Label><Select name="frictionRating" defaultValue="2"><SelectTrigger id="frictionRating"><SelectValue /></SelectTrigger><SelectContent>{[1, 2, 3, 4, 5].map((rating) => <SelectItem key={rating} value={String(rating)}>{rating} / 5</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-2"><Label htmlFor="privacyComprehension">Privacy explanation</Label><Select name="privacyComprehension" defaultValue="clear"><SelectTrigger id="privacyComprehension"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="clear">Clear</SelectItem><SelectItem value="unclear">Unclear</SelectItem><SelectItem value="not-shown">Not shown</SelectItem></SelectContent></Select></div>
        <div className="space-y-2">
          <Label htmlFor="completed">Completed?</Label>
          <Select name="completed" defaultValue="yes">
            <SelectTrigger id="completed"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2"><Label htmlFor="comments">What would improve the flow?</Label><Textarea id="comments" name="comments" maxLength={2000} /></div>
      <p className="text-xs leading-5 text-muted-foreground">Do not submit a selfie, proof, wallet address, biometric information, invite code, or other identifying data.</p>
      <Button disabled={status === "sending"} type="submit">{status === "sending" ? "Sending…" : "Send beta feedback"}</Button>
      {status === "sent" && <Alert><AlertDescription>Thanks. Only experience feedback was stored.</AlertDescription></Alert>}
      {status === "error" && <Alert variant="destructive"><AlertDescription>Feedback was not saved. Check the fields and try again.</AlertDescription></Alert>}
    </form>
  )
}
