import { describe, expect, it } from "vitest";
import { parseWorldEnv } from "./env";

describe("parseWorldEnv", () => {
  it("parses World app, RP, and chain settings from process-style env", () => {
    const env = parseWorldEnv({
      NEXT_PUBLIC_WORLD_APP_ID: "app_c1c1e3cf2cf434412f9792de9e4592cb",
      WORLD_RP_ID: "rp_test_123",
      WORLD_RP_SIGNING_KEY: "0xabc123",
      WORLD_ID_ACTION: "one-human-one-claim",
      WORLD_ID_ENVIRONMENT: "staging",
      NEXT_PUBLIC_WORLD_CHAIN_ID: "4801",
      NEXT_PUBLIC_CLAIM_CONTRACT_ADDRESS:
        "0x1111111111111111111111111111111111111111",
      WORLD_CHAIN_RPC_URL: "https://worldchain-sepolia.g.alchemy.com/public"
    });

    expect(env.worldAppId).toBe("app_c1c1e3cf2cf434412f9792de9e4592cb");
    expect(env.worldIdAction).toBe("one-human-one-claim");
    expect(env.worldIdEnvironment).toBe("staging");
    expect(env.worldChainId).toBe(4801);
    expect(env.claimContractAddress).toBe(
      "0x1111111111111111111111111111111111111111"
    );
  });

  it("rejects production-looking configs that are missing RP credentials", () => {
    expect(() =>
      parseWorldEnv({
        NEXT_PUBLIC_WORLD_APP_ID: "app_c1c1e3cf2cf434412f9792de9e4592cb",
        WORLD_ID_ACTION: "one-human-one-claim",
        WORLD_ID_ENVIRONMENT: "production",
        NEXT_PUBLIC_WORLD_CHAIN_ID: "480",
        NEXT_PUBLIC_CLAIM_CONTRACT_ADDRESS:
          "0x1111111111111111111111111111111111111111",
        WORLD_CHAIN_RPC_URL: "https://worldchain-mainnet.g.alchemy.com/public"
      })
    ).toThrow(/WORLD_RP_ID/);
  });
});

