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
        <h3 className="text-lg font-semibold">Request order</h3>
        <ol className="list-decimal space-y-2 pl-5">
          <li>The scoped resource returns an x402 v2 challenge with an AgentKit extension.</li>
          <li><code>agentkit.fetch</code> signs the CAIP-122/SIWE challenge and retries first.</li>
          <li>AgentBook resolves the wallet to an anonymous human identifier.</li>
          <li>Neon atomically grants at most three uses per endpoint and human.</li>
          <li>Only a remaining 402 reaches <code>wrapFetchWithPayment</code>.</li>
        </ol>
      </section>

      <Separator />

      <section className="space-y-3">
        <h3 className="text-lg font-semibold">Environment</h3>
        <pre><code>{`AGENTKIT_DEMO_MODE=live
DATABASE_URL=postgresql://...
AGENTKIT_RESOURCE_URL=https://your-demo.example/api/resource/forecast
AGENTKIT_AGENT_PRIVATE_KEY=0x...
X402_PAYMENT_PRIVATE_KEY=0x...
X402_PAY_TO_ADDRESS=0x...
X402_FACILITATOR_URL=https://...
X402_NETWORK=eip155:84532`}</code></pre>
        <p>
          CAIP-2 identifiers are mandatory in v2. Base Sepolia is <code>eip155:84532</code>;
          choose a facilitator that explicitly supports that network and exact EVM settlement.
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
