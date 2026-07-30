import type { Metadata } from "next";
import type { ReactNode } from "react";

import "@world-lisbon/demo-ui/styles.css";

export const metadata: Metadata = {
  title: "AgentKit + x402 | ETHGlobal Lisbon",
  description: "Human-backed API access with a scoped x402 v2 payment fallback.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
