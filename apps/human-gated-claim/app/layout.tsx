import type { Metadata } from "next";
import "./styles.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Human-Gated Claim",
  description: "World ID and MiniKit starter app for one-human-one-claim flows."
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

