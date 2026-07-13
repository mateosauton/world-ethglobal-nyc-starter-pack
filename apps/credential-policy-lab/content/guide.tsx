import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Separator
} from "@world-lisbon/demo-ui";

import { compareIntegrations } from "../lib/policy-catalog";
import { SubmissionTemplate } from "./submission";

export function PolicyGuide() {
  return (
    <div className="space-y-8 py-6">
      <section className="space-y-3">
        <Badge variant="outline">World ID 4 policy guide</Badge>
        <h2 className="text-2xl font-semibold tracking-tight">
          Start from the useful trust event
        </h2>
        <p className="text-sm leading-6 text-muted-foreground">
          Describe the exact moment your product needs assurance, the abuse it prevents,
          and what changes after verification. Then request the least intrusive credential
          that is sufficient for that moment.
        </p>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Strong integration</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-6 text-muted-foreground">
            {compareIntegrations.strong} A successful event immediately unlocks a useful,
            narrowly scoped product capability.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Weak integration</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-6 text-muted-foreground">
            {compareIntegrations.weak} That is verification theatre, not a trust boundary.
          </CardContent>
        </Card>
      </div>

      <Separator />

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">MiniKit for commands, IDKit for verification</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          MiniKit handles native commands such as wallet auth, payments, transactions,
          sharing, and permissions. World ID verification is no longer a MiniKit command.
          Use IDKit in both Mini Apps and regular web apps, then verify the result on your
          backend. Wallet control is not proof of human.
        </p>
      </section>

      <Alert>
        <AlertTitle>World ID 4 transition</AlertTitle>
        <AlertDescription>
          The official transition window runs through March 31, 2027; World App stops
          generating v3 proofs from April 1, 2027. Prefer v4-only policies for new events.
          Use legacy proofs only when a named credential still requires them, and expose an
          explicit fallback for world_id_4_not_available or world_id_3_not_available.
        </AlertDescription>
      </Alert>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Uniqueness is not continuity</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          In World ID 4, store a verified one-time nullifier to prevent replay for a unique
          action. For returning-user continuity, use the v4 session flow and store the
          session_id; do not turn a one-time nullifier into an account identifier.
        </p>
      </section>

      <Alert>
        <AlertTitle>Preview and beta credentials</AlertTitle>
        <AlertDescription>
          Identity Check is preview-only and must be enabled for your RP. Selfie Check is a
          gated beta; its current selfieCheckLegacy preset still uses a legacy v3 proof and
          requires allow_legacy_proofs: true. Keep both behind explicit eligibility flags.
        </AlertDescription>
      </Alert>

      <SubmissionTemplate />
    </div>
  );
}
