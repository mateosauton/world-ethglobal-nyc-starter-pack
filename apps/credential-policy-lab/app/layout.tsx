import type { Metadata } from "next";
import "@world-lisbon/demo-ui/styles.css";

export const metadata: Metadata = {
  title: "Credential Policy Lab · ETHGlobal Lisbon",
  description: "Choose the minimum sufficient World credential for a useful trust event."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
