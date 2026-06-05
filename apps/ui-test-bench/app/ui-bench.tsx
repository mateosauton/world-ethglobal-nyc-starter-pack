"use client";

import { useEffect, useMemo, useState } from "react";

const apps = [
  {
    id: "claim",
    title: "Human-Gated Claim",
    deployedUrl:
      process.env.NEXT_PUBLIC_HUMAN_GATED_CLAIM_URL ??
      "http://localhost:3000",
    port: 3000,
    path: "Track A",
    summary: "Wallet auth, World ID proof, nullifier state, and claim transaction."
  },
  {
    id: "agent",
    title: "Human Agent Console",
    deployedUrl:
      process.env.NEXT_PUBLIC_HUMAN_AGENT_CONSOLE_URL ??
      "http://localhost:3001",
    port: 3001,
    path: "Track B",
    summary: "Agent challenge, protected resource, and Human-in-the-Loop approval."
  },
  {
    id: "hitl",
    title: "Verified Action Desk",
    deployedUrl:
      process.env.NEXT_PUBLIC_HUMAN_APPROVAL_DESK_URL ??
      "http://localhost:3003",
    port: 3003,
    path: "HITL",
    summary: "Official Human-in-the-Loop message context, World ID approval, and resume gate."
  }
] as const;

const checks = [
  "Hero communicates the track and product pattern in the first viewport.",
  "Primary actions fit on mobile without horizontal scroll.",
  "Generated visuals render with real dimensions.",
  "Empty states avoid placeholder tokens and explain the next meaningful state.",
  "Failure paths are visible: duplicate proof, missing agent, or disabled action.",
  "Submission evidence is obvious: proof path, contract path, agent path."
];

type Viewport = "desktop" | "mobile";

export function Bench() {
  const [selected, setSelected] = useState<(typeof apps)[number]["id"]>("claim");
  const [useLocalUrls, setUseLocalUrls] = useState(true);
  const [viewport, setViewport] = useState<Viewport>("desktop");

  useEffect(() => {
    setUseLocalUrls(isLocalHost(window.location.hostname));
  }, []);

  const app = useMemo(
    () => apps.find((candidate) => candidate.id === selected) ?? apps[0],
    [selected]
  );

  const frameClass = viewport === "desktop" ? "frame desktop" : "frame mobile";
  const appUrl = getAppUrl(app, useLocalUrls);

  return (
    <main>
      <section className="hero">
        <div>
          <p className="eyebrow">Local QA surface</p>
          <h1>World Starter UI Bench</h1>
          <p className="lead">
            Compare the starter apps, switch viewport frames, and run the same
            checks hackers and sponsors need before a live demo.
          </p>
        </div>
        <div className="statusStack" aria-label="Local app endpoints">
          {apps.map((candidate) => (
            <a
              href={getAppUrl(candidate, useLocalUrls)}
              key={candidate.id}
              target="_blank"
              rel="noreferrer"
            >
              <span>{candidate.path}</span>
              <strong>{formatEndpoint(getAppUrl(candidate, useLocalUrls), candidate.port)}</strong>
            </a>
          ))}
        </div>
      </section>

      <section className="controls" aria-label="Bench controls">
        <div className="segmented">
          {apps.map((candidate) => (
            <button
              className={selected === candidate.id ? "selected" : ""}
              key={candidate.id}
              onClick={() => setSelected(candidate.id)}
            >
              {candidate.title}
            </button>
          ))}
        </div>
        <div className="segmented compact">
          <button
            className={viewport === "desktop" ? "selected" : ""}
            onClick={() => setViewport("desktop")}
          >
            Desktop
          </button>
          <button
            className={viewport === "mobile" ? "selected" : ""}
            onClick={() => setViewport("mobile")}
          >
            Mobile
          </button>
        </div>
      </section>

      <section className="benchGrid">
        <div className="previewPanel">
          <div className="frameHeader">
            <div>
              <p className="eyebrow">{app.path}</p>
              <h2>{app.title}</h2>
            </div>
            <span>{viewport}</span>
          </div>
          <div className={frameClass}>
            <iframe title={`${app.title} ${viewport} preview`} src={appUrl} />
          </div>
        </div>

        <aside className="checkPanel">
          <p className="eyebrow">UX checks</p>
          <h2>Demo readiness</h2>
          <p>{app.summary}</p>
          <ul>
            {checks.map((check) => (
              <li key={check}>
                <span aria-hidden="true" />
                {check}
              </li>
            ))}
          </ul>
          <div className="commandBox">
            <code>pnpm test:ui</code>
            <small>captures screenshots and checks desktop/mobile flows</small>
          </div>
        </aside>
      </section>
    </main>
  );
}

function getAppUrl(app: (typeof apps)[number], useLocalUrls: boolean) {
  return useLocalUrls ? `http://localhost:${app.port}` : app.deployedUrl;
}

function isLocalHost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

function formatEndpoint(url: string, port: number) {
  try {
    return new URL(url).host;
  } catch {
    return `localhost:${port}`;
  }
}
