import { and, eq, sql } from "drizzle-orm";

import type { DataClient } from "./client";
import { agentkitNonces, agentkitUsage } from "./schema";

export type UsageAttempt = {
  allowed: boolean;
  usage: number;
  limit: number;
};

export interface AgentKitStorage {
  tryIncrementUsage(
    endpoint: string,
    humanId: string,
    limit: number,
  ): Promise<UsageAttempt>;
  claimNonce(nonce: string, expiresAt: Date, now?: Date): Promise<boolean>;
}

function validateUsageInput(endpoint: string, humanId: string, limit: number) {
  if (!endpoint.trim() || !humanId.trim()) {
    throw new Error("Endpoint and humanId are required");
  }
  if (!Number.isSafeInteger(limit) || limit < 1) {
    throw new Error("Usage limit must be a positive integer");
  }
}

function isFreshNonce(nonce: string, expiresAt: Date, now: Date): boolean {
  return nonce.length > 0 && Number.isFinite(expiresAt.getTime()) && expiresAt > now;
}

export class DrizzleAgentKitStorage implements AgentKitStorage {
  constructor(private readonly db: DataClient) {}

  async tryIncrementUsage(
    endpoint: string,
    humanId: string,
    limit: number,
  ): Promise<UsageAttempt> {
    validateUsageInput(endpoint, humanId, limit);

    // The conditional upsert is one PostgreSQL statement, so concurrent callers
    // cannot observe and increment the same quota independently.
    const incremented = await this.db
      .insert(agentkitUsage)
      .values({ endpoint, humanId, usageCount: 1 })
      .onConflictDoUpdate({
        target: [agentkitUsage.endpoint, agentkitUsage.humanId],
        set: {
          usageCount: sql`${agentkitUsage.usageCount} + 1`,
          updatedAt: new Date(),
        },
        setWhere: sql`${agentkitUsage.usageCount} < ${limit}`,
      })
      .returning({ usage: agentkitUsage.usageCount });

    if (incremented[0]) {
      return { allowed: true, usage: incremented[0].usage, limit };
    }

    const existing = await this.db
      .select({ usage: agentkitUsage.usageCount })
      .from(agentkitUsage)
      .where(
        and(
          eq(agentkitUsage.endpoint, endpoint),
          eq(agentkitUsage.humanId, humanId),
        ),
      )
      .limit(1);

    return { allowed: false, usage: existing[0]?.usage ?? limit, limit };
  }

  async claimNonce(
    nonce: string,
    expiresAt: Date,
    now = new Date(),
  ): Promise<boolean> {
    if (!isFreshNonce(nonce, expiresAt, now)) return false;

    const inserted = await this.db
      .insert(agentkitNonces)
      .values({ nonce, expiresAt, claimedAt: now })
      .onConflictDoNothing({ target: agentkitNonces.nonce })
      .returning({ nonce: agentkitNonces.nonce });

    return inserted.length === 1;
  }
}

export class InMemoryAgentKitStorage implements AgentKitStorage {
  private readonly usage = new Map<string, number>();
  private readonly nonces = new Set<string>();

  async tryIncrementUsage(
    endpoint: string,
    humanId: string,
    limit: number,
  ): Promise<UsageAttempt> {
    validateUsageInput(endpoint, humanId, limit);
    const key = JSON.stringify([endpoint, humanId]);
    const current = this.usage.get(key) ?? 0;
    if (current >= limit) return { allowed: false, usage: current, limit };

    const usage = current + 1;
    this.usage.set(key, usage);
    return { allowed: true, usage, limit };
  }

  async claimNonce(
    nonce: string,
    expiresAt: Date,
    now = new Date(),
  ): Promise<boolean> {
    if (!isFreshNonce(nonce, expiresAt, now) || this.nonces.has(nonce)) return false;
    this.nonces.add(nonce);
    return true;
  }
}
