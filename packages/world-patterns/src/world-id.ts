export type IDKitResponse = {
  protocol_version?: string;
  nonce?: string;
  action?: string;
  signal?: string;
  merkle_root?: string;
  nullifier_hash?: string;
  proof?: string;
  verification_level?: string;
  responses?: unknown[];
};

export type WorldIdVerifyInput = {
  rpId: string;
  action: string;
  idkitResponse: IDKitResponse;
  fetcher?: typeof fetch;
};

export type WorldIdVerifyResult = {
  success: boolean;
  nullifier: string;
  raw: unknown;
};

export async function verifyWorldIdProof({
  rpId,
  action,
  idkitResponse,
  fetcher = fetch
}: WorldIdVerifyInput): Promise<WorldIdVerifyResult> {
  const response = await fetcher(
    `https://developer.world.org/api/v4/verify/${rpId}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...idkitResponse,
        action
      })
    }
  );

  const raw = (await response.json()) as {
    success?: boolean;
    nullifier?: string;
    nullifier_hash?: string;
    results?: Array<{ success?: boolean; nullifier?: string }>;
    error?: string;
  };

  if (!response.ok || raw.success === false) {
    throw new Error(raw.error ?? "World ID proof verification failed");
  }

  const firstResult = raw.results?.[0];
  const nullifier =
    raw.nullifier ?? raw.nullifier_hash ?? firstResult?.nullifier ?? "";

  if (!nullifier) {
    throw new Error("World ID verification response did not include a nullifier");
  }

  return {
    success: raw.success ?? firstResult?.success ?? true,
    nullifier,
    raw
  };
}

