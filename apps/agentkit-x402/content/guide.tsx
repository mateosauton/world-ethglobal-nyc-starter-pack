import { Badge, Separator } from "@world-lisbon/demo-ui";

export function GuideContent() {
  return (
    <div className="space-y-8 py-6">
      <section className="space-y-3">
        <Badge variant="outline">AgentKit 0.2 · x402 v2</Badge>
        <h2 className="text-2xl font-semibold">Register once, request human-first</h2>
        <p>
          Inspect the AgentKit CLI instructions, register the agent wallet, and confirm its
          AgentBook status before testing the protected API.
        </p>
        <pre><code>npx @worldcoin/agentkit-cli --llms{"\n"}npx @worldcoin/agentkit-cli register 0xYOUR_AGENT_ADDRESS{"\n"}npx @worldcoin/agentkit-cli status 0xYOUR_AGENT_ADDRESS</code></pre>
      </section>

      <Separator />

      <section className="space-y-3">
        <h3 className="text-lg font-semibold">Flow 1: AgentKit identity and quota before x402</h3>
        <ol className="list-decimal space-y-2 pl-5">
          <li>The scoped resource returns an x402 v2 challenge with an AgentKit extension.</li>
          <li><code>agentkit.fetch</code> signs the CAIP-122/SIWE challenge and retries first.</li>
          <li>AgentBook resolves the wallet to an anonymous human identifier.</li>
          <li>Neon atomically grants at most three uses per endpoint and human.</li>
          <li>Only a remaining 402 reaches <code>wrapFetchWithPayment</code>.</li>
        </ol>
        <p>
          Human-backed status is not human approval. It establishes AgentKit identity and applies
          quota policy for protected-resource access; it does not authorize a separate action.
        </p>
      </section>

      <Separator />

      <section className="space-y-3">
        <h3 className="text-lg font-semibold">Flow 2: reviewer approval after an action proposal</h3>
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            An agent proposes an action in a separate flow; it does not depend on running Flow 1 first.
          </li>
          <li>A separate reviewer evaluates that proposal and explicitly approves or rejects it.</li>
          <li>This demo records only a simulated execution after approval; it never settles payment or pays out.</li>
        </ol>
        <p>
          The reviewer decision is distinct from AgentKit human-backed identity and quota. Keep the
          proposal and reviewer approval on a server-controlled path in a production system.
        </p>
      </section>

      <Separator />

      <section className="space-y-3">
        <h3 className="text-lg font-semibold">Environment</h3>
        <pre><code>{`AGENTKIT_DEMO_MODE=live
DATABASE_URL=postgresql://...
AGENTKIT_RESOURCE_URL=https://your-demo.example/api/resource/forecast
AGENTKIT_AGENT_PRIVATE_KEY=0x...
HUMAN_BACKED_AGENT_ADDRESS=0x... # simulator fixture only
X402_PAYMENT_PRIVATE_KEY=0x...
X402_PAY_TO_ADDRESS=0x...
X402_FACILITATOR_URL=https://...
X402_NETWORK=eip155:84532`}</code></pre>
        <p>
          CAIP-2 identifiers are mandatory in v2. Base Sepolia is <code>eip155:84532</code>;
          choose a facilitator that explicitly supports that network and exact EVM settlement.
        </p>
        <p>
          The supplied public addresses are simulator fixtures. Public addresses alone cannot complete
          a live signed challenge. A live AgentKit challenge requires the matching private key, kept
          server-only and never sent to the browser.
        </p>
      </section>

      <Separator />

      <section className="space-y-3">
        <h3 className="text-lg font-semibold">Security and deployment</h3>
        <ul className="list-disc space-y-2 pl-5">
          <li>Keep agent and payment private keys server-only; never expose them through <code>NEXT_PUBLIC_*</code>.</li>
          <li>Use separate low-value test wallets. Public test facilitators have availability and policy limits.</li>
          <li>Persist anonymous human quota and nonces atomically. Never key the trial only by wallet.</li>
          <li>Do not release the protected body if verification or facilitator settlement fails.</li>
          <li>The simulator is UI education only; its settlement fixtures are not evidence of payment.</li>
        </ul>
      </section>
    </div>
  );
}
