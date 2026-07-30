import {
  all,
  any,
  CredentialRequest,
  passport,
  proofOfHuman,
  type ConstraintNode,
  type PassportPreset,
  type ProofOfHumanPreset
} from "@worldcoin/idkit";

type V4PolicyBase<TPresence extends boolean = false> = {
  protocolVersion: "4.0";
  allowLegacyProofs: false;
  requireUserPresence: TPresence;
};

const v4PolicyBase = {
  protocolVersion: "4.0",
  allowLegacyProofs: false,
  requireUserPresence: false
} as const;

export type ProofOfHumanPolicy = V4PolicyBase & {
  kind: "proof-of-human";
  preset: ProofOfHumanPreset;
};

export type ProofOfHumanWithPresencePolicy = V4PolicyBase<true> & {
  kind: "proof-of-human-with-presence";
  preset: ProofOfHumanPreset;
};

export type PassportPolicy = V4PolicyBase & {
  kind: "passport";
  preset: PassportPreset;
};

export type CompoundCredentialPolicy = V4PolicyBase & {
  kind: "proof-of-human-or-passport" | "proof-of-human-and-passport";
  constraints: ConstraintNode;
};

export function createProofOfHumanPolicy(signal: string): ProofOfHumanPolicy {
  return {
    kind: "proof-of-human",
    ...v4PolicyBase,
    preset: proofOfHuman({ signal })
  };
}

export function createProofOfHumanWithPresencePolicy(
  signal: string
): ProofOfHumanWithPresencePolicy {
  return {
    kind: "proof-of-human-with-presence",
    protocolVersion: "4.0",
    allowLegacyProofs: false,
    requireUserPresence: true,
    preset: proofOfHuman({ signal })
  };
}

export function createPassportPolicy(signal: string): PassportPolicy {
  return {
    kind: "passport",
    ...v4PolicyBase,
    preset: passport({ signal })
  };
}

export function createProofOfHumanOrPassportPolicy(
  signal: string
): CompoundCredentialPolicy {
  return {
    kind: "proof-of-human-or-passport",
    ...v4PolicyBase,
    constraints: any(
      CredentialRequest("proof_of_human", { signal }),
      CredentialRequest("passport", { signal })
    )
  };
}

export function createProofOfHumanAndPassportPolicy(
  signal: string
): CompoundCredentialPolicy {
  return {
    kind: "proof-of-human-and-passport",
    ...v4PolicyBase,
    constraints: all(
      CredentialRequest("proof_of_human", { signal }),
      CredentialRequest("passport", { signal })
    )
  };
}
