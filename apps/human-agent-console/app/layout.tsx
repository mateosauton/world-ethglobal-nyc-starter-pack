import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "Human Agent Console",
  description: "AgentKit and Human-in-the-Loop starter app for World hackers."
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

