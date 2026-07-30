import { Alert, AlertDescription, AlertTitle, Badge, Card, CardContent, CardHeader, CardTitle, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@world-lisbon/demo-ui"

const paths = [
  ["Hot path", "World App installed; user already eligible", "Deep link → consent → proof → server verify"],
  ["Warm path", "World App installed; credential enrollment needed", "Enrollment → consent → proof → server verify"],
  ["Cold path", "World App not installed", "Install → onboard → resume with invite code on iOS"],
  ["Error path", "Reject, timeout, expiry, or environment mismatch", "Explain state → preserve input → offer safe retry"],
] as const

export function SelfieTestingGuide() {
  return (
    <article className="space-y-8 py-6">
      <div className="space-y-3"><Badge variant="outline">Selfie Check legacy beta</Badge><h2>Builder testing guide</h2><p>Selfie Check is a lower-friction beta credential, not proof of uniqueness. Keep the assurance claim narrow and the simulator visibly separate.</p></div>
      <Alert><AlertTitle>Beta assurance boundary</AlertTitle><AlertDescription>Access may require enrollment. Never treat a simulator result as liveness, identity, uniqueness, age, or an entitlement.</AlertDescription></Alert>
      <section><h3>QA matrix</h3><Table><TableHeader><TableRow><TableHead>Path</TableHead><TableHead>Starting state</TableHead><TableHead>Expected flow</TableHead></TableRow></TableHeader><TableBody>{paths.map(([path, state, expected]) => <TableRow key={path}><TableCell className="font-medium">{path}</TableCell><TableCell>{state}</TableCell><TableCell>{expected}</TableCell></TableRow>)}</TableBody></Table></section>
      <div className="grid gap-5 md:grid-cols-2">
        <Card><CardHeader><CardTitle>Invite-code limitation</CardTitle></CardHeader><CardContent className="space-y-3"><p>Invite-code recovery currently applies to iOS; Android preserves deferred deep-link context through the Play Store.</p><p>Codes are one-shot, expire quickly, and should never be copied into feedback.</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Environment parity</CardTitle></CardHeader><CardContent className="space-y-3"><p>Match IDKit, the Developer Portal app, RP registration, and backend verification in staging or production.</p><p>Run the full matrix again in production; a staging success does not prove production registration.</p></CardContent></Card>
      </div>
      <section><h3>Privacy rules</h3><p><strong>Never collect</strong> selfie images, video, proof payloads, wallet addresses, biometric information, invite codes, or free-form identity details. Ask only about path, completion, rating, friction, and suggested UX improvements.</p></section>
      <section><h3>Release checklist</h3><ol><li>Confirm beta eligibility and RP registration server-side.</li><li>Keep <code>allow_legacy_proofs: true</code> scoped to <code>selfieCheckLegacy</code>.</li><li>Forward the complete completion payload unchanged to hosted verification.</li><li>Exercise cancellation, timeout, expired invite code, credential unavailable, malformed request, and staging/production mismatch.</li><li>Verify simulator outcomes cannot grant a benefit.</li></ol></section>
      <section><h3>Official references</h3><ul><li><a href="https://docs.world.org/world-id/idkit/verification-flows">Verification flows and invite-code behavior</a></li><li><a href="https://docs.world.org/world-id/idkit/react">IDKit React widgets and callbacks</a></li></ul></section>
    </article>
  )
}
