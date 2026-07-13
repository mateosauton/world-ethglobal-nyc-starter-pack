import type { Metadata } from "next";
import "@world-lisbon/demo-ui/styles.css";

export const metadata: Metadata = {
  title: "One-per-human trial · ETHGlobal Lisbon",
  description: "A production-shaped IDKit 4 one-per-human benefit starter."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
