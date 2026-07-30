import { CodePanel } from "@world-lisbon/demo-ui";

const serverBoundary = `// Sign every request on the server and bind its action.
const rpContext = createRpRequest({
  rpId: process.env.WORLD_RP_ID!,
  action: TRUST_ACTION,
  signingKey: process.env.WORLD_RP_SIGNING_KEY!,
})

// Forward the complete result unchanged to hosted v4 verification.
const verified = await verifyHostedProof({ rpId, payload })

// A verified one-time nullifier protects one unique action.
await proofUses.consume({ action: TRUST_ACTION, nullifier: verified.nullifier })`;

const commandBoundary = `// Native World App command
await MiniKit.pay(payment)

// Credential verification — inside or outside World App
<IDKitRequestWidget
  {...request}
  preset={proofOfHuman({ signal })}
  allow_legacy_proofs={false}
/>`;

export function PolicyCode() {
  return (
    <div className="space-y-5 pt-6">
      <CodePanel title="Server trust boundary" code={serverBoundary} />
      <CodePanel title="MiniKit and IDKit boundary" code={commandBoundary} language="tsx" />
    </div>
  );
}
