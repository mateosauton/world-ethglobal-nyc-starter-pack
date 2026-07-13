import {
  createDataClient,
  DrizzleProofUseRepository,
  type ProofUseRepository
} from "@world-lisbon/data";
import { hashSignal } from "@worldcoin/idkit/hashing";
import { verifyHostedProof } from "@world-lisbon/world-patterns";

import {
  TRIAL_ACTION,
  TRIAL_SIGNAL,
  type TrialEnvironment
} from "../../../../lib/trial-config";

type HostedResult = {
  success?: boolean;
  results?: Array<{ nullifier?: string }>;
  responses?: Array<{ nullifier?: string }>;
  nullifier?: string;
};

type VerifyDependencies = {
  environment?: TrialEnvironment;
  repository?: ProofUseRepository;
  verify?: typeof verifyHostedProof<HostedResult>;
  hashSignal?: (signal: string) => string;
};

type ProofPayload = {
  protocol_version?: unknown;
  action?: unknown;
  user_presence_completed?: unknown;
  responses?: unknown;
};

function errorResponse(code: string, message: string, status: number) {
  return Response.json(
    { ok: false, code, message, granted: false },
    { status }
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isServerBoundProof(
  payload: ProofPayload,
  expectedSignalHash: string
): boolean {
  if (
    payload.protocol_version !== "4.0" ||
    payload.action !== TRIAL_ACTION ||
    payload.user_presence_completed !== true ||
    !Array.isArray(payload.responses)
  ) {
    return false;
  }

  return payload.responses.some(
    (item) =>
      isRecord(item) &&
      item.identifier === "proof_of_human" &&
      typeof item.signal_hash === "string" &&
      item.signal_hash.toLowerCase() === expectedSignalHash.toLowerCase()
  );
}

function verifiedNullifier(result: HostedResult): string | null {
  return (
    result.nullifier ??
    result.results?.find((item) => item.nullifier)?.nullifier ??
    result.responses?.find((item) => item.nullifier)?.nullifier ??
    null
  );
}

function decimalNullifier(value: string): string {
  if (/^0x[0-9a-f]+$/i.test(value)) return BigInt(value).toString(10);
  if (/^\d+$/.test(value)) return BigInt(value).toString(10);
  throw new Error("Verified response returned an invalid nullifier");
}

export function createVerifyHandler({
  environment = process.env,
  repository,
  verify = verifyHostedProof<HostedResult>,
  hashSignal: hash = hashSignal
}: VerifyDependencies = {}) {
  return async function post(request: Request) {
    const url = new URL(request.url);

    if (url.searchParams.get("mode") === "simulator") {
      const fixtureBody = (await request.json().catch(() => ({}))) as {
        fixture?: unknown;
      };
      const fixture =
        typeof fixtureBody.fixture === "string"
          ? fixtureBody.fixture
          : "proof-of-human-success";

      return Response.json({
        ok: true,
        mode: "simulator",
        fixture,
        granted: false,
        message: "Simulation complete. No trial was granted."
      });
    }

    if (!environment.WORLD_RP_ID || (!repository && !environment.DATABASE_URL)) {
      return errorResponse(
        "missing_configuration",
        "Live verification and durable storage are not configured",
        503
      );
    }

    const payload = (await request.json().catch(() => null)) as ProofPayload | null;
    if (!payload || !isServerBoundProof(payload, hash(TRIAL_SIGNAL))) {
      return errorResponse(
        "invalid_request",
        "Proof must match the server action, signal, v4 policy, and user-presence requirement",
        400
      );
    }

    try {
      // The IDKit result is forwarded unchanged. The server validates its binding,
      // but never reconstructs, spreads, or mutates the proof payload.
      const verified = await verify({
        rpId: environment.WORLD_RP_ID,
        payload
      });
      if (verified.success !== true) {
        return errorResponse("verification_failed", "World verification failed", 401);
      }

      const nullifier = verifiedNullifier(verified);
      if (!nullifier) {
        return errorResponse(
          "verification_failed",
          "World verification did not return a nullifier",
          502
        );
      }

      const durableRepository =
        repository ??
        new DrizzleProofUseRepository(
          createDataClient(environment.DATABASE_URL as string)
        );
      const consumed = await durableRepository.consume({
        action: TRIAL_ACTION,
        nullifier: decimalNullifier(nullifier)
      });

      if (!consumed) {
        return errorResponse(
          "trial_already_used",
          "This human has already used the trial",
          409
        );
      }

      return Response.json({
        ok: true,
        mode: "live",
        granted: true,
        message: "Your one-per-human trial is unlocked."
      });
    } catch (error) {
      return errorResponse(
        "verification_failed",
        error instanceof Error ? error.message : "World verification failed",
        502
      );
    }
  };
}

export const POST = createVerifyHandler();
