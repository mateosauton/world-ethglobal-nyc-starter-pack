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

export function TrialGuide() {
  return (
    <div className="space-y-8 py-6">
      <section className="space-y-3">
        <Badge variant="outline">Builder starter pack</Badge>
        <h2 className="text-2xl font-semibold tracking-tight">IDKit 4 quickstart</h2>
        <ol className="list-decimal space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
          <li>Create an app, RP ID, action, and signing key in the World Developer Portal.</li>
          <li>Keep the signing key server-only and create a short-lived RP context per request.</li>
          <li>Request <code>proofOfHuman</code> with a server-known signal and no legacy fallback.</li>
          <li>Send the complete IDKit result unchanged to hosted v4 verification.</li>
          <li>Only after success, atomically consume the verified nullifier and grant the benefit.</li>
        </ol>
      </section>

      <Alert>
        <AlertTitle>Nullifier safety rule</AlertTitle>
        <AlertDescription>
          Never trust or store a client-submitted nullifier. Read it from the successful
          hosted verification response, normalize it, and protect the action/nullifier pair
          with a database uniqueness constraint.
        </AlertDescription>
      </Alert>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Verification template</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          Validate protocol version, action, user presence, credential identifier, and signal
          hash before forwarding. Forward the original payload—not a reconstructed copy. Fail
          closed on missing configuration or any verifier error.
        </p>
      </section>

      <Separator />

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">MiniKit for commands, IDKit for verification</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          Use MiniKit for native World App commands such as wallet auth, payments, and
          transactions. Use IDKit when your product needs a credential proof or a uniqueness
          event. A MiniKit command success is not proof of human.
        </p>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Strong integration</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-6 text-muted-foreground">
            The product names the trust event, binds action and signal on the server, verifies
            the proof server-side, grants a useful benefit once, and explains retries and
            failure states without collecting identity data.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Weak integration</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-6 text-muted-foreground">
            The product adds a verify button with no meaningful consequence, trusts a client
            boolean or nullifier, uses wallet possession as humanity, or stores raw proof and
            identity data “just in case.”
          </CardContent>
        </Card>
      </div>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Submission prompt</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          What useful trust event does World enable in your product, and what becomes possible
          immediately after that event that was unsafe or impossible before?
        </p>
      </section>
    </div>
  );
}
