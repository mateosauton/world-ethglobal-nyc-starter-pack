"use client"

import { useMemo, useState } from "react"
import { IDKitInviteCodeRequestWidget, selfieCheckLegacy, type IDKitResult, type RpContext } from "@worldcoin/idkit"
import { Alert, AlertDescription, Button } from "@world-lisbon/demo-ui"

type LiveConfig = {
  app_id: string
  action: string
  environment: "staging" | "production"
  rp_context: RpContext
  allow_legacy_proofs: true
}

export function LiveSelfieWidget() {
  const signal = useMemo(() => crypto.randomUUID(), [])
  const [config, setConfig] = useState<LiveConfig>()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string>()
  const [verified, setVerified] = useState(false)

  async function begin() {
    setError(undefined)
    const response = await fetch("/api/selfie/request", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ signal }),
    })
    if (!response.ok) {
      setError("Live beta access is not available on this deployment.")
      return
    }
    setConfig(await response.json() as LiveConfig)
    setOpen(true)
  }

  async function verify(result: IDKitResult) {
    const response = await fetch("/api/selfie/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(result),
    })
    if (!response.ok) throw new Error("Host verification rejected the proof")
  }

  return (
    <div className="space-y-4">
      <Button onClick={begin}>Start live beta check</Button>
      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
      {verified && <Alert><AlertDescription>Selfie Check proof verified by the host backend.</AlertDescription></Alert>}
      {config && (
        <IDKitInviteCodeRequestWidget
          open={open}
          onOpenChange={setOpen}
          app_id={config.app_id as `app_${string}`}
          action={config.action}
          environment={config.environment}
          rp_context={config.rp_context}
          allow_legacy_proofs={true}
          preset={selfieCheckLegacy({ signal })}
          handleVerify={verify}
          onSuccess={() => setVerified(true)}
          onError={(code) => setError(`IDKit stopped with ${code}.`)}
        />
      )}
    </div>
  )
}
