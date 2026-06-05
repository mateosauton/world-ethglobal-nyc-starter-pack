"use client";

import { IDKitRequestWidget, orbLegacy, type IDKitResult } from "@worldcoin/idkit";
import { MiniKit } from "@worldcoin/minikit-js";
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

type SendTransactionResult = {
  executedWith: string;
  data?: {
    userOpHash?: string;
    status?: string;
    version?: number;
    from?: string;
    timestamp?: string;
  };
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

export function ClaimExperience() {
  const { isInstalled } = useMiniKit();
  const [open, setOpen] = useState(false);
  const [rpContext, setRpContext] = useState<RpContext | null>(null);
  const [contextDiagnostics, setContextDiagnostics] =
    useState<ContextDiagnostics | null>(null);
  const [step, setStep] = useState<StepState>("idle");
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [nullifier, setNullifier] = useState<string | null>(null);
  const [userOpHash, setUserOpHash] = useState<string | null>(null);
  const [message, setMessage] = useState("Ready for one verified human.");
  const [logs, setLogs] = useState<ApiLog[]>([]);

  const worldAppId = process.env.NEXT_PUBLIC_WORLD_APP_ID as `app_${string}`;
  const action = process.env.NEXT_PUBLIC_WORLD_ID_ACTION ?? "one-human-one-claim";
  const claimContract = process.env
    .NEXT_PUBLIC_CLAIM_CONTRACT_ADDRESS as `0x${string}`;
  const chainId = Number(process.env.NEXT_PUBLIC_WORLD_CHAIN_ID ?? 480);
  const worldAppLink =
    worldAppId && worldAppId.startsWith("app_")
      ? `https://world.org/mini-app?app_id=${worldAppId}&path=%2F`
      : null;
  const isWorldApp = Boolean(isInstalled) || MiniKit.isInWorldApp();
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
    pushLog("MiniKit environment", {
      response: {
        isInstalled: Boolean(isInstalled),
        isInWorldApp: MiniKit.isInWorldApp(),
        worldAppIdConfigured: Boolean(worldAppId && worldAppId.startsWith("app_"))
      }
    });
  }, [isInstalled, worldAppId]);

  const stages = useMemo(
    () => [
      { label: "Wallet", active: step !== "idle" },
      { label: "Proof", active: ["verified", "prepared", "submitted"].includes(step) },
      { label: "Claim", active: ["prepared", "submitted"].includes(step) }
    ],
    [step]
  );

  async function authenticateWallet() {
    if (!isWorldApp) {
      setMessage("MiniKit wallet auth is only available inside World App.");
      pushLog("MiniKit.walletAuth skipped", {
        response: {
          reason: "not_in_world_app",
          next: "Open this URL as a World Mini App or use the local wallet diagnostic."
        }
      });
      return;
    }

    setStep("wallet");
    const nonceResponse = await requestJson<WalletAuthResponse>(
      "GET /api/wallet-auth/nonce",
      "/api/wallet-auth/nonce"
    );
    if (!nonceResponse.ok) {
      setMessage("Wallet nonce request failed.");
      return;
    }

    const result = await MiniKit.walletAuth({
      nonce: nonceResponse.data.nonce,
      statement: "Authenticate for one-human-one-claim."
    });
    pushLog("MiniKit.walletAuth result", { response: result });

    const verifyResponse = await requestJson("POST /api/wallet-auth/verify", "/api/wallet-auth/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(result.data)
    });
    if (!verifyResponse.ok) {
      setMessage("Wallet auth verification failed.");
      return;
    }

    setWalletAddress(result.data.address);
    setMessage("Wallet authenticated. Proof is next.");
  }

  function useLocalWallet() {
    setStep("wallet");
    setWalletAddress(localAddress);
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

    setNullifier(response.data.nullifier);
    setStep("verified");
    setMessage("Human proof accepted. Claim can be prepared.");
  }

  async function useLocalProof() {
    const response = await requestJson<VerifyResponse>("POST /api/world-id/verify local", "/api/world-id/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ localDevProof: true, action })
    });
    if (!response.ok) {
      setNullifier(null);
      setMessage("Local proof was rejected.");
      return;
    }
    setNullifier(response.data.nullifier);
    setStep("verified");
    setMessage("Local proof accepted for diagnostics only.");
  }

  async function sendClaim() {
    if (!nullifier) {
      setMessage("Verify first, then claim.");
      return;
    }

    const response = await requestJson<PreparedClaimPayload>(
      "POST /api/claim/prepare",
      "/api/claim/prepare",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          recipient: walletAddress ?? localAddress,
          nullifierHash: nullifier
        })
      }
    );
    if (!response.ok) {
      setMessage("Claim transaction preparation failed.");
      return;
    }
    const payload = response.data;
    setStep("prepared");

    if (!isWorldApp) {
      setMessage("Prepared MiniKit transaction payload. Open in World App to execute.");
      return;
    }

    try {
      const result = (await MiniKit.sendTransaction({
        ...payload
      })) as SendTransactionResult;
      pushLog("MiniKit.sendTransaction result", { response: result });

      const capturedHash = result.data?.userOpHash ?? null;
      setUserOpHash(capturedHash);
      setStep("submitted");
      setMessage(
        capturedHash
          ? "Claim submitted. UserOp hash captured."
          : `Claim submitted with ${result.executedWith}.`
      );
    } catch (error) {
      pushLog("MiniKit.sendTransaction error", {
        response: serializeError(error)
      });
      setMessage("MiniKit sendTransaction failed.");
    }
  }

  async function copyUserOpHash() {
    if (!userOpHash) {
      return;
    }
    await navigator.clipboard.writeText(userOpHash);
    pushLog("UserOp hash copied", { response: { userOpHash } });
  }

  async function requestJson<T>(
    label: string,
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<{ data: T; ok: boolean; status: number }> {
    const requestBody = parseJsonBody(init?.body);
    const response = await fetch(input, init);
    const text = await response.text();
    const data = text ? (JSON.parse(text) as T) : ({} as T);
    pushLog(label, {
      request: {
        body: requestBody,
        method: init?.method ?? "GET",
        url: typeof input === "string" ? input : input.toString()
      },
      response: data,
      status: response.status
    });
    return { data, ok: response.ok, status: response.status };
  }

  function pushLog(label: string, entry: Omit<ApiLog, "id" | "label" | "time">) {
    setLogs((current) =>
      [
        {
          id: Date.now() + Math.floor(Math.random() * 1000),
          label,
          time: new Date().toISOString(),
          ...entry
        },
        ...current
      ].slice(0, 12)
    );
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
              <dd>{isWorldApp ? "World App" : "Not in World App"}</dd>
            </div>
            <div>
              <dt>IDKit</dt>
              <dd>{liveWorldIdReady ? "Signed context" : "Needs portal config"}</dd>
            </div>
            <div>
              <dt>Wallet</dt>
              <dd>{walletAddress ? shortAddress(walletAddress) : "Not connected"}</dd>
            </div>
            <div>
              <dt>Nullifier</dt>
              <dd>{nullifier ? shortAddress(nullifier) : "Not verified"}</dd>
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
              <dt>UserOp</dt>
              <dd>{userOpHash ? shortAddress(userOpHash) : "Not submitted"}</dd>
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
            <button onClick={sendClaim} disabled={!nullifier}>
              {isWorldApp ? "Send claim tx" : "Prepare claim tx"}
            </button>
            {worldAppLink ? (
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
        {userOpHash ? (
          <div className="evidenceBar">
            <code>{userOpHash}</code>
            <button onClick={copyUserOpHash}>Copy hash</button>
          </div>
        ) : null}
        <pre>{logs.length ? JSON.stringify(logs, null, 2) : "No requests yet."}</pre>
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
          preset={orbLegacy({ signal: walletAddress ?? localAddress })}
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
    return {
      message: error.message,
      name: error.name,
      stack: error.stack
    };
  }

  return error;
}
