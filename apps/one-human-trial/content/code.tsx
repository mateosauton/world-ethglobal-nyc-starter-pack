import { CodePanel } from "@world-lisbon/demo-ui";

const verificationTemplate = `// 1. Validate the IDKit result against server constants.
assert(payload.protocol_version === "4.0")
assert(payload.action === TRIAL_ACTION)
assert(payload.user_presence_completed === true)
assert(proofOfHuman.signal_hash === hashSignal(TRIAL_SIGNAL))

// 2. Forward the same payload object to hosted v4 verification.
const verified = await verifyHostedProof({
  rpId: process.env.WORLD_RP_ID!,
  payload,
})

// 3. Use only the verified response's nullifier.
const granted = await proofUses.consume({
  action: TRIAL_ACTION,
  nullifier: toDecimal(verified.results[0].nullifier),
})

if (!granted) return Response.json(
  { code: "trial_already_used", granted: false },
  { status: 409 },
)

return Response.json({ mode: "live", granted: true })`;

const widgetTemplate = `<IDKitRequestWidget
  open={open}
  onOpenChange={setOpen}
  app_id={request.app_id}
  action={request.action}
  rp_context={request.rp_context}
  preset={proofOfHuman({ signal: request.signal })}
  allow_legacy_proofs={false}
  require_user_presence
  handleVerify={(result) => fetch("/api/idkit/verify", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(result), // unchanged
  }).then(assertOk)}
  onSuccess={() => setOpen(false)}
/>`;

export function TrialCode() {
  return (
    <div className="space-y-5 pt-6">
      <CodePanel title="Hosted verification route" code={verificationTemplate} />
      <CodePanel title="Controlled IDKit 4 widget" code={widgetTemplate} language="tsx" />
    </div>
  );
}
