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

type VerifyResponse = {
  nullifier: string;
};

type WalletAuthResponse = {
  nonce: string;
};

const localAddress = "0x2222222222222222222222222222222222222222";

export function ClaimExperience() {
  const { isInstalled } = useMiniKit();
  const [open, setOpen] = useState(false);
  const [rpContext, setRpContext] = useState<RpContext | null>(null);
  const [step, setStep] = useState<StepState>("idle");
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [nullifier, setNullifier] = useState<string | null>(null);
  const [message, setMessage] = useState("Ready for one verified human.");

  const worldAppId = process.env.NEXT_PUBLIC_WORLD_APP_ID as `app_${string}`;
  const action = process.env.NEXT_PUBLIC_WORLD_ID_ACTION ?? "one-human-one-claim";
  const isWorldApp = Boolean(isInstalled) || MiniKit.isInWorldApp();

  useEffect(() => {
    fetch("/api/world-id/context")
      .then((response) => response.json())
      .then((data) => setRpContext(data.rp_context))
      .catch(() => setMessage("World ID context is unavailable."));
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
    setStep("wallet");
    const nonceResponse = await fetch("/api/wallet-auth/nonce");
    const { nonce } = (await nonceResponse.json()) as WalletAuthResponse;

    const result = await MiniKit.walletAuth({
      nonce,
      statement: "Authenticate for one-human-one-claim.",
      fallback: () => ({
        address: localAddress,
        message: buildLocalSiweMessage(nonce),
        signature: "0x0000000000000000000000000000000000000000000000000000000000000000"
      })
    });

    await fetch("/api/wallet-auth/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(result.data)
    });

    setWalletAddress(result.data.address);
    setMessage("Wallet authenticated. Proof is next.");
  }

  async function handleVerify(result: IDKitResult) {
    const response = await fetch("/api/world-id/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(result)
    });

    if (!response.ok) {
      throw new Error("Proof verification failed");
    }

    const data = (await response.json()) as VerifyResponse;
    setNullifier(data.nullifier);
    setStep("verified");
    setMessage("Human proof accepted. Claim can be prepared.");
  }

  async function simulateWorldId() {
    const response = await fetch("/api/world-id/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ localDevProof: true, action })
    });
    const data = (await response.json()) as VerifyResponse;
    setNullifier(data.nullifier);
    setStep("verified");
    setMessage("Local proof accepted for browser development.");
  }

  async function sendClaim() {
    if (!nullifier) {
      setMessage("Verify first, then claim.");
      return;
    }

    const response = await fetch("/api/claim/prepare", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        recipient: walletAddress ?? localAddress,
        nullifierHash: nullifier
      })
    });
    const payload = await response.json();
    setStep("prepared");

    if (!isWorldApp) {
      setStep("submitted");
      setMessage("Claim submitted with browser fallback.");
      return;
    }

    const result = await MiniKit.sendTransaction({
      ...payload,
      fallback: () => ({
        userOpHash:
          "0x1111111111111111111111111111111111111111111111111111111111111111",
        status: "success" as const,
        version: 2,
        from: walletAddress ?? localAddress,
        timestamp: new Date().toISOString()
      })
    });

    setStep("submitted");
    setMessage(`Claim submitted with ${result.executedWith}.`);
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
              <dd>{isWorldApp ? "World App" : "Browser fallback"}</dd>
            </div>
            <div>
              <dt>Wallet</dt>
              <dd>{walletAddress ? shortAddress(walletAddress) : "Not connected"}</dd>
            </div>
            <div>
              <dt>Nullifier</dt>
              <dd>{nullifier ? shortAddress(nullifier) : "Not verified"}</dd>
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
            <button
              onClick={() => setOpen(true)}
              disabled={!rpContext}
              className="primary"
            >
              Verify with World ID
            </button>
            <button onClick={simulateWorldId}>Simulate proof</button>
            <button onClick={sendClaim} disabled={!nullifier}>
              Send claim tx
            </button>
          </div>
        </div>
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

function buildLocalSiweMessage(nonce: string) {
  return [
    "localhost wants you to sign in with your Ethereum account:",
    localAddress,
    "",
    "URI: http://localhost:3000",
    "Version: 1",
    "Chain ID: 4801",
    `Nonce: ${nonce}`,
    `Issued At: ${new Date().toISOString()}`
  ].join("\n");
}
