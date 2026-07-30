import type { Metadata } from "next"
import "@world-lisbon/demo-ui/styles.css"

export const metadata: Metadata = {
  title: "Selfie Check Onboarding · ETHGlobal Lisbon",
  description: "Simulator-first Selfie Check beta onboarding and privacy-safe feedback.",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className="dark"><body>{children}</body></html>
}
