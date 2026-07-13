import { CodePanel } from "@world-lisbon/demo-ui";

const clientCode = `const agentkit = createAgentkitClient({ signer })
const paymentClient = new x402Client()
registerExactEvmScheme(paymentClient, { signer: paymentAccount })

// AgentKit receives the first 402 and retries before payment handles a remaining 402.
const humanFirstFetch = wrapFetchWithPayment(agentkit.fetch, paymentClient)
const response = await humanFirstFetch(resourceUrl)`;

const serverCode = `const server = new x402ResourceServer(facilitator)
  .register("eip155:84532", new ExactEvmScheme())
  .registerExtension(agentkitResourceServerExtension)

const hooks = createAgentkitHooks({
  agentBook,
  mode: { type: "free-trial", uses: 3 },
  storage: durableStorage,
})

const httpServer = new x402HTTPResourceServer(server, routes)
httpServer.onProtectedRequest(hooks.requestHook)`;

export function CodeContent() {
  return (
    <div className="space-y-5 py-6">
      <CodePanel title="Human-first client" code={clientCode} />
      <CodePanel title="Protected Hono resource" code={serverCode} />
    </div>
  );
}
