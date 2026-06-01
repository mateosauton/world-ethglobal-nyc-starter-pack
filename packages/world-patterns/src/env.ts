import { isAddress, type Address } from "viem";
import { z } from "zod";

export type WorldIdEnvironment = "staging" | "production";

export type WorldEnv = {
  worldAppId: `app_${string}`;
  rpId?: string;
  rpSigningKey?: `0x${string}`;
  worldIdAction: string;
  worldIdEnvironment: WorldIdEnvironment;
  worldChainId: number;
  claimContractAddress: Address;
  worldChainRpcUrl: string;
};

const rawEnvSchema = z.object({
  NEXT_PUBLIC_WORLD_APP_ID: z.string().regex(/^app_[a-zA-Z0-9_]+$/),
  WORLD_RP_ID: z.string().optional(),
  WORLD_RP_SIGNING_KEY: z.string().regex(/^0x[0-9a-fA-F]+$/).optional(),
  WORLD_ID_ACTION: z.string().min(1),
  WORLD_ID_ENVIRONMENT: z.enum(["staging", "production"]).default("staging"),
  NEXT_PUBLIC_WORLD_CHAIN_ID: z.coerce.number().int().positive(),
  NEXT_PUBLIC_CLAIM_CONTRACT_ADDRESS: z.string().refine(isAddress, {
    message: "must be an EVM address"
  }),
  WORLD_CHAIN_RPC_URL: z.string().url()
});

export function parseWorldEnv(input: Record<string, string | undefined>): WorldEnv {
  const parsed = rawEnvSchema.parse(input);

  if (parsed.WORLD_ID_ENVIRONMENT === "production" && !parsed.WORLD_RP_ID) {
    throw new Error("WORLD_RP_ID is required for production World ID verification");
  }

  if (
    parsed.WORLD_ID_ENVIRONMENT === "production" &&
    !parsed.WORLD_RP_SIGNING_KEY
  ) {
    throw new Error(
      "WORLD_RP_SIGNING_KEY is required for production World ID verification"
    );
  }

  return {
    worldAppId: parsed.NEXT_PUBLIC_WORLD_APP_ID as `app_${string}`,
    rpId: parsed.WORLD_RP_ID,
    rpSigningKey: parsed.WORLD_RP_SIGNING_KEY as `0x${string}` | undefined,
    worldIdAction: parsed.WORLD_ID_ACTION,
    worldIdEnvironment: parsed.WORLD_ID_ENVIRONMENT,
    worldChainId: parsed.NEXT_PUBLIC_WORLD_CHAIN_ID,
    claimContractAddress: parsed.NEXT_PUBLIC_CLAIM_CONTRACT_ADDRESS as Address,
    worldChainRpcUrl: parsed.WORLD_CHAIN_RPC_URL
  };
}

