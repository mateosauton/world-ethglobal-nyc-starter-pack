"use client";

import { IDKitRequestWidget, orbLegacy, type IDKitResult } from "@worldcoin/idkit";
import { MiniKit } from "@worldcoin/minikit-js";
import {
  Command,
  isCommandAvailable,
  type SendTransactionResult as MiniKitSendTransactionResult
} from "@worldcoin/minikit-js/commands";
import { useMiniKit } from "@worldcoin/minikit-js/provider";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

type StepState = "idle" | "wallet" | "verified" | "prepared" | "submitted";

type RpContext = {
  rp_id: string;
  nonce: string;
  created_at: number;
  expires_at: number;
  signature: string;
};

type ContextDiagnostics = {
  action: string;
  configured: boolean;
  hasSigningKey: boolean;
  mode: "signed" | "missing-signing-key";
  rp_id: string;
  warning?: string;
};

type ContextResponse = {
  diagnostics: ContextDiagnostics;
  rp_context: RpContext;
};

type VerifyResponse = {
  mode?: string;
  nullifier: string;
  verificationLevel?: string;
};

type WalletAuthResponse = {
  nonce: string;
};

type PreparedClaimPayload = {
  chainId: number;
  transactions: Array<{
    data: `0x${string}`;
    to: `0x${string}`;
    value: "0x0";
  }>;
};

type MiniKitCommandDiagnostics = {
  appId: string | null;
  inWorldApp: boolean;
  providerInstalled: boolean | null;
  runtimeInstalled: boolean;
  walletAuthAvailable: boolean;
  sendTransactionAvailable: boolean;
  walletAuthReady: boolean;
  sendTransactionReady: boolean;
  userWallet: string | null;
  worldAppVersion: number | null;
  deviceOS: string | null;
  location: string | null;
};

type UserOperationResponse = {
  nonce?: string | null;
  sender?: string | null;
  status: "pending" | "success" | "failed";
  transaction_hash?: string | null;
  userOpHash: string;
};

type ApiLog = {
  id: number;
  label: string;
  request?: unknown;
  response?: unknown;
  status?: number;
  time: string;
};

const localAddress = "0x2222222222222222222222222222222222222222";

const receiptPollAttempts = 8;
const receiptPollDelayMs = 2_000;

export function ClaimExperience() {
  const { isInstalled } = useMiniKit();
  const [open, setOpen] = useState(false);
  const [rpContext, setRpContext] = useState<RpContext | null>(null);
  const [contextDiagnostics, setContextDiagnostics] =
    useState<ContextDiagnostics | null>(null);
  const [step, setStep] = useState<StepState>("idle");
  const [signedWalletAddress, setSignedWalletAddress] = useState<string | null>(null);
  const [diagnosticWalletAddress, setDiagnosticWalletAddress] = useState<string | null>(null);
  const [liveProof, setLiveProof] = useState<{
    nullifier: string;
    verificationLevel: string;
  } | null>(null);
  const [diagnosticNullifier, setDiagnosticNullifier] = useState<string | null>(null);
  const [claimEvidence, setClaimEvidence] = useState<{
    status?: string;
    txHash?: string | null;
    userOpHash?: string | null;
  }>({});
  const [message, setMessage] = useState("Ready for one verified human.");
  const [log, setLog] = useState<ApiLog | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const worldAppId = process.env.NEXT_PUBLIC_WORLD_APP_ID as `app_${string}`;
  const action = process.env.NEXT_PUBLIC_WORLD_ID_ACTION ?? "one-human-one-claim";
  const claimContract = process.env
    .NEXT_PUBLIC_CLAIM_CONTRACT_ADDRESS as `0x${string}`;
  const chainId = Number(process.env.NEXT_PUBLIC_WORLD_CHAIN_ID ?? 480);
  const worldAppLink =
    worldAppId && worldAppId.startsWith("app_")
      ? MiniKit.getMiniAppUrl(worldAppId, "/")
      : null;
  const miniKitDiagnostics = isMounted
    ? getMiniKitDiagnostics(isInstalled)
    : getInitialMiniKitDiagnostics(isInstalled, worldAppId);
  const isWorldApp = miniKitDiagnostics.inWorldApp;
  const miniKitStatus = miniKitDiagnostics.sendTransactionReady
    ? "Ready"
    : miniKitDiagnostics.inWorldApp
      ? "Commands unavailable"
      : "Browser";
  const claimNullifier = liveProof?.nullifier ?? diagnosticNullifier;
  const claimRecipient = signedWalletAddress ?? diagnosticWalletAddress ?? localAddress;
  const liveWorldIdReady = Boolean(
    rpContext &&
      contextDiagnostics?.configured &&
      worldAppId &&
      worldAppId.startsWith("app_")
  );

  useEffect(() => {
    void requestJson<ContextResponse>("GET /api/world-id/context", "/api/world-id/context")
      .then(({ ok, data }) => {
        if (!ok) {
          setMessage("World ID context is unavailable.");
          return;
        }
        setRpContext(data.rp_context);
        setContextDiagnostics(data.diagnostics);
        if (!data.diagnostics.configured) {
          setMessage("Live World ID needs Developer Portal signing config.");
        }
      })
      .catch(() => setMessage("World ID context is unavailable."));
  }, []);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const stages = useMemo(
    () => [
      { label: "Wallet", active: step !== "idle" },
      { label: "Proof", active: ["verified", "prepared", "submitted"].includes(step) },
      { label: "Claim", active: ["prepared", "submitted"].includes(step) }
    ],
    [step]
  );

  async function authenticateWallet() {
    const diagnostics = refreshMiniKitDiagnostics(isInstalled, worldAppId);
    const statement = "Authenticate for one-human-one-claim.";

    if (!diagnostics.walletAuthReady) {
      setMessage(
        diagnostics.inWorldApp
          ? "MiniKit wallet auth is unavailable in this World App session."
          : "MiniKit wallet auth is only available inside World App."
      );
      pushLog("Wallet auth", {
        response: {
          reason: diagnostics.inWorldApp
            ? "wallet_auth_unavailable"
            : "not_in_world_app",
          diagnostics,
          next: diagnostics.inWorldApp
            ? "Reopen the mini app in the latest World App build and tap Wallet auth again."
            : "Open this URL as a World Mini App or use the local wallet diagnostic."
        }
      });
      return;
    }

    setStep("wallet");
    try {
      const nonceResponse = await requestJson<WalletAuthResponse>(
        "GET /api/wallet-auth/nonce",
        "/api/wallet-auth/nonce"
      );
      if (!nonceResponse.ok) {
        setMessage("Wallet nonce request failed.");
        pushLog("Wallet auth", {
          request: { diagnostics },
          response: nonceResponse.data,
          status: nonceResponse.status
        });
        return;
      }

      const result = await MiniKit.walletAuth({
        nonce: nonceResponse.data.nonce,
        statement
      });

      const verifyResponse = await requestJson<Record<string, unknown>>(
        "POST /api/wallet-auth/verify",
        "/api/wallet-auth/verify",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(result.data)
        }
      );
      pushLog("Wallet auth", {
        request: {
          nonce: nonceResponse.data.nonce,
          statement,
          diagnostics
        },
        response: {
          command: result,
          verification: verifyResponse.data
        },
        status: verifyResponse.status
      });
      if (!verifyResponse.ok) {
        setMessage("Wallet auth verification failed.");
        return;
      }

      const signedAddress =
        extractAddress(result.data) ??
        extractAddress(verifyResponse.data) ??
        diagnostics.userWallet;
      setSignedWalletAddress(signedAddress);
      setDiagnosticWalletAddress(null);
      setMessage("Wallet authenticated. Proof is next.");
    } catch (error) {
      setMessage("Wallet auth verification failed.");
      pushLog("Wallet auth", {
        request: { statement, diagnostics },
        response: {
          error: serializeError(error)
        }
      });
    }
  }

  function useLocalWallet() {
    setStep("wallet");
    setSignedWalletAddress(null);
    setDiagnosticWalletAddress(localAddress);
    setMessage("Local wallet selected for browser diagnostics.");
    pushLog("Local wallet diagnostic", {
      response: {
        address: localAddress,
        mode: "local-only",
        note: "This does not prove World App wallet auth."
      }
    });
  }

  async function handleVerify(result: IDKitResult) {
    const response = await requestJson<VerifyResponse>("POST /api/world-id/verify", "/api/world-id/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(result)
    });

    if (!response.ok) {
      throw new Error("Proof verification failed");
    }

    setLiveProof({
      nullifier: response.data.nullifier,
      verificationLevel:
        response.data.verificationLevel ?? extractVerificationLevel(result) ?? "unknown"
    });
    setDiagnosticNullifier(null);
    setStep("verified");
    setMessage("Human proof accepted. Claim can be prepared.");
    pushLog("Verify with World ID", {
      request: {
        action,
        verificationLevel: extractVerificationLevel(result)
      },
      response: response.data,
      status: response.status
    });
  }

  async function useLocalProof() {
    const response = await requestJson<VerifyResponse>("POST /api/world-id/verify local", "/api/world-id/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ localDevProof: true, action })
    });
    if (!response.ok) {
      setDiagnosticNullifier(null);
      setMessage("Local proof was rejected.");
      pushLog("Local proof diagnostic", {
        response: response.data,
        status: response.status
      });
      return;
    }
    setLiveProof(null);
    setDiagnosticNullifier(response.data.nullifier);
    setStep("verified");
    setMessage("Local proof accepted for diagnostics only.");
    pushLog("Local proof diagnostic", {
      request: { action, localDevProof: true },
      response: response.data,
      status: response.status
    });
  }

  async function sendClaim() {
    const diagnostics = refreshMiniKitDiagnostics(isInstalled, worldAppId);
    const logLabel = diagnostics.inWorldApp ? "Send claim tx" : "Prepare claim tx";

    if (!claimNullifier) {
      setMessage("Verify first, then claim.");
      pushLog(logLabel, {
        response: { error: "missing_nullifier" }
      });
      return;
    }

    const response = await requestJson<PreparedClaimPayload>(
      "POST /api/claim/prepare",
      "/api/claim/prepare",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          recipient: claimRecipient,
          nullifierHash: claimNullifier
        })
      }
    );
    if (!response.ok) {
      setMessage("Claim transaction preparation failed.");
      pushLog(logLabel, {
        request: {
          nullifierHash: claimNullifier,
          recipient: claimRecipient,
          diagnostics
        },
        response: response.data,
        status: response.status
      });
      return;
    }
    const payload = response.data;
    setStep("prepared");

    if (!diagnostics.sendTransactionReady) {
      setMessage(
        diagnostics.inWorldApp
          ? "MiniKit sendTransaction is unavailable in this World App session."
          : "Prepared MiniKit transaction payload. Open in World App to execute."
      );
      pushLog(logLabel, {
        request: {
          nullifierHash: claimNullifier,
          recipient: claimRecipient,
          diagnostics
        },
        response: {
          reason: diagnostics.inWorldApp
            ? "send_transaction_unavailable"
            : "not_in_world_app",
          payload,
          diagnostics
        },
        status: response.status
      });
      return;
    }

    try {
      const result = (await MiniKit.sendTransaction({
        ...payload
      })) as { executedWith: string; data: MiniKitSendTransactionResult };

      const capturedHash = extractUserOpHash(result.data);
      const immediateTxHash =
        extractTransactionHash(result.data) ??
        (capturedHash && result.executedWith === "wagmi" ? capturedHash : null);
      let receipt: UserOperationResponse | null = null;

      if (capturedHash && !immediateTxHash) {
        receipt = await pollUserOperation(capturedHash);
      }

      const receiptTxHash = receipt?.transaction_hash ?? null;
      const txHash = immediateTxHash ?? receiptTxHash;
      setClaimEvidence({
        status: receipt?.status ?? result.data.status,
        txHash,
        userOpHash: capturedHash
      });
      setStep("submitted");
      setMessage(
        txHash
          ? "Claim submitted. Transaction hash captured."
        : capturedHash
            ? receipt?.status === "failed"
              ? "Claim user operation failed."
              : "Claim submitted. Transaction hash is still pending."
            : `Claim submitted with ${result.executedWith}.`
      );
      pushLog("Send claim tx", {
        request: {
          payload,
          diagnostics
        },
        response: {
          command: result,
          receipt
        }
      });
    } catch (error) {
      pushLog("Send claim tx", {
        request: {
          payload,
          diagnostics
        },
        response: {
          error: serializeError(error)
        }
      });
      setMessage("MiniKit sendTransaction failed.");
    }
  }

  async function pollUserOperation(userOpHash: string) {
    let latest: UserOperationResponse | null = null;

    for (let attempt = 0; attempt < receiptPollAttempts; attempt += 1) {
      if (attempt > 0) {
        await delay(receiptPollDelayMs);
      }
      const response = await requestJson<UserOperationResponse>(
        "GET /api/claim/userop",
        `/api/claim/userop/${userOpHash}`
      );
      if (response.ok) {
        latest = response.data;
        if (response.data.transaction_hash || response.data.status === "failed") {
          break;
        }
      }
    }

    return latest;
  }

  async function copyClaimHash() {
    const hash = claimEvidence.txHash ?? claimEvidence.userOpHash;
    if (!hash) {
      return;
    }
    await navigator.clipboard.writeText(hash);
    pushLog("Copy claim hash", { response: { hash } });
  }

  async function requestJson<T>(
    label: string,
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<{ data: T; ok: boolean; status: number }> {
    void label;
    const requestBody = parseJsonBody(init?.body);
    const response = await fetch(input, init);
    const text = await response.text();
    const data = text ? (JSON.parse(text) as T) : ({} as T);
    void requestBody;
    return { data, ok: response.ok, status: response.status };
  }

  function pushLog(label: string, entry: Omit<ApiLog, "id" | "label" | "time">) {
    setLog({
      id: Date.now() + Math.floor(Math.random() * 1000),
      label,
      time: new Date().toISOString(),
      ...entry
    });
  }

  return (
    <main>
      <section className="hero">
        <Image
          src="/visuals/world-id-claim-hero.png"
          alt=""
          fill
          className="heroImage"
          priority
          sizes="100vw"
        />
        <div className="heroShade" />
        <div className="heroContent">
          <p className="eyebrow">Track A starter path</p>
          <h1>Human-Gated Claim</h1>
          <p className="subhead">
            A Mini App pattern for eligibility, uniqueness, fairness, and World Chain actions.
          </p>
        </div>
      </section>

      <section className="workspace">
        <div className="statusPanel">
          <div className="stageRow">
            {stages.map((stage) => (
              <span className={stage.active ? "stage active" : "stage"} key={stage.label}>
                {stage.label}
              </span>
            ))}
          </div>
          <h2>{message}</h2>
          <dl>
            <div>
              <dt>MiniKit</dt>
              <dd>{miniKitStatus}</dd>
            </div>
            <div>
              <dt>IDKit</dt>
              <dd>{liveWorldIdReady ? "Signed context" : "Needs portal config"}</dd>
            </div>
            <div>
              <dt>Wallet</dt>
              <dd>{signedWalletAddress ? shortAddress(signedWalletAddress) : ""}</dd>
            </div>
            <div>
              <dt>Nullifier</dt>
              <dd>
                {liveProof ? (
                  <span className="evidenceStack">
                    <span>{shortAddress(liveProof.nullifier)}</span>
                    <span>{formatVerificationLevel(liveProof.verificationLevel)}</span>
                  </span>
                ) : (
                  ""
                )}
              </dd>
            </div>
            <div>
              <dt>Chain</dt>
              <dd>{Number.isFinite(chainId) ? chainId : "Unset"}</dd>
            </div>
            <div>
              <dt>Contract</dt>
              <dd>{claimContract ? shortAddress(claimContract) : "Unset"}</dd>
            </div>
            <div>
              <dt>Tx Hash</dt>
              <dd>{claimEvidence.txHash ? shortAddress(claimEvidence.txHash) : ""}</dd>
            </div>
          </dl>
        </div>

        <div className="claimPanel">
          <Image
            src="/visuals/fair-claim-card.png"
            alt=""
            width={420}
            height={420}
            className="claimImage"
          />
          <div className="actions">
            <button onClick={authenticateWallet}>Wallet auth</button>
            <button onClick={useLocalWallet}>Use local wallet</button>
            <button
              onClick={() => setOpen(true)}
              disabled={!liveWorldIdReady}
              className="primary"
            >
              Verify with World ID
            </button>
            <button onClick={useLocalProof}>Use local proof</button>
            <button onClick={sendClaim} disabled={!claimNullifier}>
              {isWorldApp ? "Send claim tx" : "Prepare claim tx"}
            </button>
            {worldAppLink && !miniKitDiagnostics.inWorldApp ? (
              <a className="actionLink" href={worldAppLink}>
                Open World App
              </a>
            ) : null}
          </div>
        </div>
      </section>

      <section className="consolePanel" aria-label="Server console">
        <div>
          <p className="eyebrow">Server console</p>
          <h2>Logs and responses</h2>
        </div>
        {claimEvidence.userOpHash || claimEvidence.txHash ? (
          <div className="evidenceBar">
            <div>
              {claimEvidence.txHash ? (
                <p>
                  <span>Tx hash</span>
                  <code>{claimEvidence.txHash}</code>
                </p>
              ) : null}
              {claimEvidence.userOpHash ? (
                <p>
                  <span>UserOp</span>
                  <code>{claimEvidence.userOpHash}</code>
                </p>
              ) : null}
            </div>
            <button onClick={copyClaimHash}>Copy hash</button>
          </div>
        ) : null}
        <pre>{log ? JSON.stringify(log, null, 2) : "No button requests yet."}</pre>
      </section>

      {rpContext ? (
        <IDKitRequestWidget
          open={open}
          onOpenChange={setOpen}
          app_id={worldAppId}
          action={action}
          rp_context={rpContext}
          allow_legacy_proofs={false}
          environment="staging"
          preset={orbLegacy({ signal: signedWalletAddress ?? localAddress })}
          handleVerify={handleVerify}
          onSuccess={() => setOpen(false)}
          onError={(errorCode) => setMessage(`World ID error: ${errorCode}`)}
        />
      ) : null}
    </main>
  );
}

function shortAddress(value: string) {
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function formatVerificationLevel(value: string) {
  return value.replace(/[_-]/g, " ");
}

function extractAddress(value: unknown) {
  if (!isRecord(value)) {
    return null;
  }
  const candidates = [value.address, value.walletAddress, value.from];
  const match = candidates.find(
    (candidate): candidate is string =>
      typeof candidate === "string" && /^0x[0-9a-fA-F]{40}$/.test(candidate)
  );
  return match ?? null;
}

function extractVerificationLevel(value: unknown): string | null {
  if (!isRecord(value)) {
    return null;
  }

  if (typeof value.verification_level === "string") {
    return value.verification_level;
  }
  if (typeof value.verificationLevel === "string") {
    return value.verificationLevel;
  }
  if (Array.isArray(value.responses)) {
    const response = value.responses.find(isRecord);
    if (response) {
      if (typeof response.identifier === "string") {
        return response.identifier;
      }
      if (typeof response.verification_level === "string") {
        return response.verification_level;
      }
    }
  }

  return null;
}

function extractTransactionHash(value: unknown) {
  if (!isRecord(value)) {
    return null;
  }
  const candidates = [
    value.transaction_hash,
    value.transactionHash,
    value.txHash,
    value.hash
  ];
  const match = candidates.find(
    (candidate): candidate is string =>
      typeof candidate === "string" && /^0x[0-9a-fA-F]{64}$/.test(candidate)
  );
  return match ?? null;
}

function extractUserOpHash(value: unknown) {
  if (!isRecord(value)) {
    return null;
  }
  const candidate = value.userOpHash;
  return typeof candidate === "string" && /^0x[0-9a-fA-F]{64}$/.test(candidate)
    ? candidate
    : null;
}

function refreshMiniKitDiagnostics(
  providerInstalled: boolean | undefined,
  appId: string | undefined
) {
  if (MiniKit.isInWorldApp() && !MiniKit.isInstalled()) {
    MiniKit.install(appId);
  }

  return getMiniKitDiagnostics(providerInstalled);
}

function getInitialMiniKitDiagnostics(
  providerInstalled: boolean | undefined,
  appId: string | undefined
): MiniKitCommandDiagnostics {
  return {
    appId: appId ?? null,
    inWorldApp: false,
    providerInstalled:
      typeof providerInstalled === "boolean" ? providerInstalled : null,
    runtimeInstalled: false,
    walletAuthAvailable: false,
    sendTransactionAvailable: false,
    walletAuthReady: false,
    sendTransactionReady: false,
    userWallet: null,
    worldAppVersion: null,
    deviceOS: null,
    location: null
  };
}

function getMiniKitDiagnostics(
  providerInstalled: boolean | undefined
): MiniKitCommandDiagnostics {
  const inWorldApp = MiniKit.isInWorldApp();
  const runtimeInstalled = inWorldApp ? MiniKit.isInstalled() : false;
  const walletAuthAvailable = isCommandAvailable(Command.WalletAuth);
  const sendTransactionAvailable = isCommandAvailable(Command.SendTransaction);

  return {
    appId: MiniKit.appId,
    inWorldApp,
    providerInstalled:
      typeof providerInstalled === "boolean" ? providerInstalled : null,
    runtimeInstalled,
    walletAuthAvailable,
    sendTransactionAvailable,
    walletAuthReady: inWorldApp && runtimeInstalled && walletAuthAvailable,
    sendTransactionReady:
      inWorldApp && runtimeInstalled && sendTransactionAvailable,
    userWallet: MiniKit.user.walletAddress ?? null,
    worldAppVersion: MiniKit.deviceProperties.worldAppVersion ?? null,
    deviceOS: MiniKit.deviceProperties.deviceOS ?? null,
    location: MiniKit.location ?? null
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function delay(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function parseJsonBody(body: BodyInit | null | undefined) {
  if (typeof body !== "string") {
    return undefined;
  }
  try {
    return JSON.parse(body);
  } catch {
    return body;
  }
}

function serializeError(error: unknown) {
  if (error instanceof Error) {
    const miniKitError = error as Error & {
      code?: unknown;
      details?: unknown;
      error_code?: unknown;
      reason?: unknown;
    };

    return {
      code: miniKitError.code ?? miniKitError.error_code,
      details: miniKitError.details,
      message: error.message,
      name: error.name,
      reason: miniKitError.reason
    };
  }

  return error;
}
