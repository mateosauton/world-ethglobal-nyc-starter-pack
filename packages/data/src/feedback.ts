import { createHash, timingSafeEqual } from "node:crypto";
import { z } from "zod";

import type { DataClient } from "./client";
import { selfieFeedback } from "./schema";

export const selfieFeedbackSchema = z
  .object({
    path: z.enum(["hot", "warm", "cold", "error"]),
    device: z.enum(["desktop", "phone", "tablet"]),
    osBrowser: z.string().trim().min(1).max(120),
    worldAppState: z.enum(["installed", "new-install", "not-installed"]),
    completed: z.boolean(),
    durationBucket: z.enum(["under-30s", "30-60s", "1-2m", "over-2m"]),
    errorCode: z.string().trim().max(120).nullable(),
    retryCount: z.number().int().min(0).max(20),
    clarityRating: z.number().int().min(1).max(5),
    frictionRating: z.number().int().min(1).max(5),
    privacyComprehension: z.enum(["clear", "unclear", "not-shown"]),
    comments: z.string().trim().max(2_000).optional(),
  })
  .strict();

export type SelfieFeedbackInput = z.infer<typeof selfieFeedbackSchema>;
export type SavedSelfieFeedback = SelfieFeedbackInput & {
  id: string;
  createdAt: Date;
};

export interface FeedbackRepository {
  create(input: SelfieFeedbackInput): Promise<SavedSelfieFeedback>;
  list(): Promise<SavedSelfieFeedback[]>;
}

export function parseSelfieFeedback(input: unknown): SelfieFeedbackInput {
  return selfieFeedbackSchema.parse(input);
}

export function authorizeAdminToken(
  providedToken: string | undefined,
  expectedToken: string | undefined,
): boolean {
  if (!providedToken || !expectedToken) return false;

  // Hashing first produces fixed-size inputs even when the supplied token has a
  // different length, allowing timingSafeEqual to cover every comparison.
  const providedDigest = createHash("sha256").update(providedToken).digest();
  const expectedDigest = createHash("sha256").update(expectedToken).digest();
  return timingSafeEqual(providedDigest, expectedDigest);
}

export class DrizzleFeedbackRepository implements FeedbackRepository {
  constructor(private readonly db: DataClient) {}

  async create(rawInput: SelfieFeedbackInput): Promise<SavedSelfieFeedback> {
    const input = parseSelfieFeedback(rawInput);
    const inserted = await this.db
      .insert(selfieFeedback)
      .values(input)
      .returning();
    const saved = inserted[0];
    if (!saved) throw new Error("Feedback insert did not return a row");
    return saved as SavedSelfieFeedback;
  }

  async list(): Promise<SavedSelfieFeedback[]> {
    const rows = await this.db.select().from(selfieFeedback);
    return rows as SavedSelfieFeedback[];
  }
}

export class InMemoryFeedbackRepository implements FeedbackRepository {
  private readonly feedback: SavedSelfieFeedback[] = [];
  private sequence = 0;

  async create(rawInput: SelfieFeedbackInput): Promise<SavedSelfieFeedback> {
    const input = parseSelfieFeedback(rawInput);
    const saved = {
      ...input,
      id: `feedback-${++this.sequence}`,
      createdAt: new Date(),
    };
    this.feedback.push(saved);
    return saved;
  }

  async list(): Promise<SavedSelfieFeedback[]> {
    return this.feedback.map((entry) => ({ ...entry }));
  }
}
