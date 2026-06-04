import { createWalletNonce } from "@world-starter/world-patterns";
import { signRequest } from "@worldcoin/idkit/signing";
import type { RpContext } from "./approval-workflow";

export type HitlDiagnostics = {
  appId?: string;
  configured: boolean;
  hasAppId: boolean;
  hasRpId: boolean;
  hasSigningKey: boolean;
  missing: string[];
  mode: "signed-context" | "local-diagnostic-context";
  rpId: string;
  warning?: string;
};

export function createApprovalContext(action: string): {
  diagnostics: HitlDiagnostics;
  rpContext: RpContext;
} {
  const credentials = readHitlCredentials();
  const missing = getMissing(credentials);

  if (credentials.rpId && credentials.signingKey) {
    try {
      const signature = signRequest({
        action,
        signingKeyHex: credentials.signingKey,
        ttl: 60 * 10
      });

      return {
        diagnostics: {
          appId: credentials.appId,
          configured: missing.length === 0,
          hasAppId: Boolean(credentials.appId),
          hasRpId: true,
          hasSigningKey: true,
          missing,
          mode: "signed-context",
          rpId: credentials.rpId,
          warning:
            missing.length > 0
              ? `Live approval still needs ${missing.join(", ")}.`
              : undefined
        },
        rpContext: {
          rp_id: credentials.rpId,
          nonce: signature.nonce,
          created_at: signature.createdAt,
          expires_at: signature.expiresAt,
          signature: signature.sig
        }
      };
    } catch (error) {
      return createLocalContext(credentials, action, readableError(error));
    }
  }

  return createLocalContext(credentials, action);
}

export function getLiveVerificationConfig() {
  const credentials = readHitlCredentials();
  const missing = getMissing(credentials);

  return {
    diagnostics: {
      appId: credentials.appId,
      configured: missing.length === 0,
      hasAppId: Boolean(credentials.appId),
      hasRpId: Boolean(credentials.rpId),
      hasSigningKey: Boolean(credentials.signingKey),
      missing,
      mode: "signed-context" as const,
      rpId: credentials.rpId ?? "rp_local_dev",
      warning:
        missing.length > 0 ? `Live approval needs ${missing.join(", ")}.` : undefined
    },
    rpId: credentials.rpId
  };
}

function createLocalContext(
  credentials: ReturnType<typeof readHitlCredentials>,
  action: string,
  signError?: string
) {
  const createdAt = Math.floor(Date.now() / 1000);
  const missing = getMissing(credentials);
  const warning =
    signError ??
    `Live approval needs ${missing.length ? missing.join(", ") : "valid World credentials"}.`;

  return {
    diagnostics: {
      appId: credentials.appId,
      configured: false,
      hasAppId: Boolean(credentials.appId),
      hasRpId: Boolean(credentials.rpId),
      hasSigningKey: Boolean(credentials.signingKey),
      missing,
      mode: "local-diagnostic-context" as const,
      rpId: credentials.rpId ?? "rp_local_dev",
      warning
    },
    rpContext: {
      rp_id: credentials.rpId ?? "rp_local_dev",
      nonce: createWalletNonce(24),
      created_at: createdAt,
      expires_at: createdAt + 600,
      signature: "0x0000000000000000000000000000000000000000000000000000000000000000"
    }
  };
}

function readHitlCredentials() {
  const appId = normalize(process.env.NEXT_PUBLIC_WORLD_APP_ID, "app_");
  const rpId = normalize(process.env.WORLD_RP_ID);
  const signingKey = normalize(
    process.env.WORLD_SIGNING_KEY ?? process.env.WORLD_RP_SIGNING_KEY,
    "0x"
  );

  return { appId, rpId, signingKey };
}

function getMissing(credentials: ReturnType<typeof readHitlCredentials>) {
  const missing: string[] = [];
  if (!credentials.appId) {
    missing.push("NEXT_PUBLIC_WORLD_APP_ID");
  }
  if (!credentials.rpId) {
    missing.push("WORLD_RP_ID");
  }
  if (!credentials.signingKey) {
    missing.push("WORLD_SIGNING_KEY");
  }
  return missing;
}

function normalize(value: string | undefined, prefix?: string) {
  const trimmed = value?.trim();
  if (!trimmed || trimmed.includes("replace") || trimmed === "api_...") {
    return undefined;
  }
  if (prefix && !trimmed.startsWith(prefix)) {
    return undefined;
  }
  return trimmed;
}

function readableError(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
