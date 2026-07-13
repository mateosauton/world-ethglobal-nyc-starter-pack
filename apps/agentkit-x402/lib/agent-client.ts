import {
  createAgentkitClient,
  type AgentkitFetchEvent,
  type AgentkitSigner,
} from "@worldcoin/agentkit";
import { x402Client } from "@x402/core/client";
import { decodePaymentRequiredHeader } from "@x402/core/http";
import { registerExactEvmScheme } from "@x402/evm/exact/client";
import { wrapFetchWithPayment } from "@x402/fetch";
import type { LocalAccount } from "viem";

export type ProtocolEvent = {
  stage: "resource_challenge" | "agentkit_retry" | "payment_fallback" | "resource";
  status: "pending" | "success" | "failed";
  detail: string;
  secret?: string;
  humanId?: string;
};

export function redactProtocolEvent(event: ProtocolEvent): ProtocolEvent {
  const detail = event.detail
    .replace(/0x[a-fA-F0-9]{3,}/g, "[redacted]")
    .replace(/\b(signature|payment)[-_: ]?[a-zA-Z0-9]+\b/gi, "[redacted]");

  return {
    stage: event.stage,
    status: event.status,
    detail,
    ...(event.secret ? { secret: "[redacted]" } : {}),
    ...(event.humanId ? { humanId: "[redacted]" } : {}),
  };
}

type PaymentWrapper = (fetchFn: typeof fetch) => typeof fetch;

export function composeHumanFirstFetch(
  agentkitFetch: typeof fetch,
  wrapPayment: PaymentWrapper,
): typeof fetch {
  // Deliberate ordering: x402 observes the response only after AgentKit has
  // inspected the first 402 and completed its signed retry.
  return wrapPayment(agentkitFetch);
}

export function createAgentkitHeaderAwareFetch(input: {
  signer: AgentkitSigner;
  fetch?: typeof fetch;
  onAgentkitEvent?: (event: AgentkitFetchEvent) => void;
}): typeof fetch {
  const baseFetch = input.fetch ?? globalThis.fetch;
  const normalizeV2Challenge: typeof fetch = async (requestInput, init) => {
    const response = await baseFetch(requestInput, init);
    const header = response.headers.get("payment-required");
    if (response.status !== 402 || !header) return response;

    // AgentKit 0.2 reads the v2 challenge from JSON, while current x402 emits
    // the canonical Payment-Required header. Bridge that wire-format boundary
    // without altering the header or fabricating a settlement response.
    const challenge = decodePaymentRequiredHeader(header);
    return new Response(JSON.stringify(challenge), {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  };

  return createAgentkitClient({
    signer: input.signer,
    fetch: normalizeV2Challenge,
    onEvent: input.onAgentkitEvent,
  }).fetch;
}

export function createLiveHumanFirstFetch(input: {
  agentkitSigner: AgentkitSigner;
  paymentAccount: LocalAccount;
  fetch?: typeof fetch;
  onAgentkitEvent?: (event: AgentkitFetchEvent) => void;
}): typeof fetch {
  const baseFetch = input.fetch ?? globalThis.fetch;
  const agentkitFetch = createAgentkitHeaderAwareFetch({
    signer: input.agentkitSigner,
    fetch: baseFetch,
    onAgentkitEvent: input.onAgentkitEvent,
  });
  const paymentClient = new x402Client();
  registerExactEvmScheme(paymentClient, {
    signer: input.paymentAccount,
    networks: ["eip155:84532"],
  });

  return composeHumanFirstFetch(agentkitFetch, (humanFirstFetch) =>
    wrapFetchWithPayment(humanFirstFetch, paymentClient),
  );
}
