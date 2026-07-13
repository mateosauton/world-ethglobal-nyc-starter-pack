CREATE TABLE "proof_uses" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "action" text NOT NULL,
  "nullifier" numeric(78, 0) NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "proof_uses_action_nullifier_unique"
  ON "proof_uses" USING btree ("action", "nullifier");
--> statement-breakpoint
CREATE TABLE "agentkit_usage" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "endpoint" text NOT NULL,
  "human_id" text NOT NULL,
  "usage_count" integer DEFAULT 1 NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "agentkit_usage_nonnegative" CHECK ("agentkit_usage"."usage_count" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "agentkit_usage_endpoint_human_unique"
  ON "agentkit_usage" USING btree ("endpoint", "human_id");
--> statement-breakpoint
CREATE TABLE "agentkit_nonces" (
  "nonce" text PRIMARY KEY NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "claimed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "selfie_feedback" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "path" text NOT NULL,
  "device" text NOT NULL,
  "os_browser" text NOT NULL,
  "world_app_state" text NOT NULL,
  "completed" boolean NOT NULL,
  "duration_bucket" text NOT NULL,
  "error_code" text,
  "retry_count" integer NOT NULL,
  "clarity_rating" integer NOT NULL,
  "friction_rating" integer NOT NULL,
  "privacy_comprehension" text NOT NULL,
  "comments" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "selfie_feedback_path" CHECK ("selfie_feedback"."path" in ('hot', 'warm', 'cold', 'error')),
  CONSTRAINT "selfie_feedback_clarity" CHECK ("selfie_feedback"."clarity_rating" between 1 and 5),
  CONSTRAINT "selfie_feedback_friction" CHECK ("selfie_feedback"."friction_rating" between 1 and 5),
  CONSTRAINT "selfie_feedback_retries" CHECK ("selfie_feedback"."retry_count" between 0 and 20)
);
