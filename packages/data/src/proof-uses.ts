import type { DataClient } from "./client";
import { proofUses } from "./schema";

export type ProofUse = {
  action: string;
  nullifier: string;
};

export interface ProofUseRepository {
  /** Returns true only when this proof use was consumed by this call. */
  consume(proofUse: ProofUse): Promise<boolean>;
}

export function normalizeNullifier(value: string): string {
  if (!/^\d+$/.test(value)) {
    throw new Error("Nullifier must be an unsigned decimal integer");
  }

  const normalized = BigInt(value).toString(10);
  if (normalized.length > 78) {
    throw new Error("Nullifier must contain at most 78 digits");
  }

  return normalized;
}

function validateProofUse(proofUse: ProofUse): ProofUse {
  const action = proofUse.action.trim();
  if (action.length === 0 || action.length > 255) {
    throw new Error("Action must contain between 1 and 255 characters");
  }

  return { action, nullifier: normalizeNullifier(proofUse.nullifier) };
}

export class DrizzleProofUseRepository implements ProofUseRepository {
  constructor(private readonly db: DataClient) {}

  async consume(input: ProofUse): Promise<boolean> {
    const proofUse = validateProofUse(input);
    const inserted = await this.db
      .insert(proofUses)
      .values(proofUse)
      .onConflictDoNothing({
        target: [proofUses.action, proofUses.nullifier],
      })
      .returning({ id: proofUses.id });

    return inserted.length === 1;
  }
}

export class InMemoryProofUseRepository implements ProofUseRepository {
  private readonly consumed = new Set<string>();

  async consume(input: ProofUse): Promise<boolean> {
    const proofUse = validateProofUse(input);
    const key = JSON.stringify([proofUse.action, proofUse.nullifier]);
    if (this.consumed.has(key)) return false;
    this.consumed.add(key);
    return true;
  }
}
