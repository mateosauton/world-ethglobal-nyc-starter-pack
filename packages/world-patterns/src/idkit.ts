import type { IDKitResult, RpContext } from "@worldcoin/idkit";
import { signRequest } from "@worldcoin/idkit-core/signing";

export type CreateRpRequestInput = {
  rpId: string;
  action: string;
  signingKey: string;
  ttl?: number;
};

export function createRpRequest({
  rpId,
  action,
  signingKey,
  ttl
}: CreateRpRequestInput): RpContext {
  const signed = signRequest({
    signingKeyHex: signingKey,
    action,
    ttl
  });

  return {
    rp_id: rpId,
    nonce: signed.nonce,
    created_at: signed.createdAt,
    expires_at: signed.expiresAt,
    signature: signed.sig
  };
}

export type HostedVerificationPayload = IDKitResult | Record<string, unknown>;

export async function verifyHostedProof<TResponse = unknown>({
  rpId,
  payload,
  fetcher = fetch
}: {
  rpId: string;
  payload: HostedVerificationPayload;
  fetcher?: typeof fetch;
}): Promise<TResponse> {
  const response = await fetcher(
    `https://developer.world.org/api/v4/verify/${encodeURIComponent(rpId)}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    }
  );
  const body = (await response.json()) as TResponse & {
    error?: string;
    message?: string;
  };

  if (!response.ok) {
    throw new Error(
      body.error ?? body.message ?? "World hosted verification failed"
    );
  }

  return body;
}
