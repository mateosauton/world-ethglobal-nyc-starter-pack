import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "World Starter UI Bench",
  description: "Local UI and UX test bench for the World ETHGlobal starter pack."
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

