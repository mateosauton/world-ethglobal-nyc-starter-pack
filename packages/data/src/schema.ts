import {
  boolean,
  check,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const proofUses = pgTable(
  "proof_uses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    action: text("action").notNull(),
    nullifier: numeric("nullifier", { precision: 78, scale: 0 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("proof_uses_action_nullifier_unique").on(
      table.action,
      table.nullifier,
    ),
  ],
);

export const agentkitUsage = pgTable(
  "agentkit_usage",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    endpoint: text("endpoint").notNull(),
    humanId: text("human_id").notNull(),
    usageCount: integer("usage_count").default(1).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("agentkit_usage_endpoint_human_unique").on(
      table.endpoint,
      table.humanId,
    ),
    check("agentkit_usage_nonnegative", sql`${table.usageCount} >= 0`),
  ],
);

export const agentkitNonces = pgTable("agentkit_nonces", {
  nonce: text("nonce").primaryKey(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  claimedAt: timestamp("claimed_at", { withTimezone: true }).defaultNow().notNull(),
});

export const selfieFeedback = pgTable(
  "selfie_feedback",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    path: text("path").notNull(),
    device: text("device").notNull(),
    osBrowser: text("os_browser").notNull(),
    worldAppState: text("world_app_state").notNull(),
    completed: boolean("completed").notNull(),
    durationBucket: text("duration_bucket").notNull(),
    errorCode: text("error_code"),
    retryCount: integer("retry_count").notNull(),
    clarityRating: integer("clarity_rating").notNull(),
    frictionRating: integer("friction_rating").notNull(),
    privacyComprehension: text("privacy_comprehension").notNull(),
    comments: text("comments"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check("selfie_feedback_path", sql`${table.path} in ('hot', 'warm', 'cold', 'error')`),
    check("selfie_feedback_clarity", sql`${table.clarityRating} between 1 and 5`),
    check("selfie_feedback_friction", sql`${table.frictionRating} between 1 and 5`),
    check("selfie_feedback_retries", sql`${table.retryCount} between 0 and 20`),
  ],
);
