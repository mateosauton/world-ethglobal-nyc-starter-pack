import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "Verified Action Desk",
  description: "World ID human-in-the-loop starter app for agent approvals."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
