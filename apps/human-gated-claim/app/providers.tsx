"use client";

import { MiniKitProvider } from "@worldcoin/minikit-js/provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MiniKitProvider
      props={{
        appId:
          process.env.NEXT_PUBLIC_WORLD_APP_ID ??
          "app_local_world_starter_claim"
      }}
    >
      {children}
    </MiniKitProvider>
  );
}
