import {
  createPassportPolicy,
  createProofOfHumanPolicy,
  createProofOfHumanWithPresencePolicy,
  createSelfiePolicy
} from "@world-lisbon/world-patterns";

export const TRUST_EVENT_QUESTION =
  "What specific event in your product requires trust, what abuse becomes possible without it, and why is this World credential the minimum sufficient assurance?";

export const compareIntegrations = {
  strong:
    "Name the product event, choose the minimum sufficient credential, bind action and signal on the server, verify the proof server-side, and make the verified outcome change what the product allows.",
  weak:
    "Add a verify button with no useful consequence, treat wallet ownership as humanity, trust client state, or request a stronger credential than the event needs."
} as const;

export type TrustEventId =
  | "one-per-human-promotion"
  | "passport-holder-access"
  | "sensitive-human-approval"
  | "age-eligibility"
  | "low-friction-liveness";

export type PolicyGates = {
  identityCheckEnabled?: boolean;
  selfieCheckEnabled?: boolean;
};

export type PolicyRecommendation = {
  id: TrustEventId;
  event: string;
  credential: string;
  protocol: "World ID 4.0" | "World ID 3.0 legacy";
  availability: "ready" | "preview" | "legacy-beta";
  enabled: boolean;
  minimumAssurance: string;
  abusePrevented: string;
  signal: string;
  policy: unknown;
  generatedCode: string;
  warnings: string[];
};

const identityCheckWarning =
  "Identity Check is currently in preview. Enable this example only after World confirms access for your RP.";
const selfieCheckWarning =
  "Selfie Check is a gated beta and selfieCheckLegacy still requires a v3 legacy proof with allow_legacy_proofs: true.";

const policyBuilders: Record<
  TrustEventId,
  (gates: PolicyGates) => PolicyRecommendation
> = {
  "one-per-human-promotion": () => {
    const signal = "promotion-claim";
    return {
      id: "one-per-human-promotion",
      event: "Claim a one-per-human promotion",
      credential: "Proof of Human",
      protocol: "World ID 4.0",
      availability: "ready",
      enabled: true,
      minimumAssurance: "High-assurance uniqueness for one human, one claim.",
      abusePrevented: "Duplicate accounts and automated reward farming.",
      signal,
      policy: createProofOfHumanPolicy(signal),
      generatedCode: `const trustEvent = { signal: "${signal}" } as const
const policy = createProofOfHumanPolicy(trustEvent.signal)

// IDKit 4 request: allow_legacy_proofs: false
// Consume the verified one-time nullifier atomically on the server.`,
      warnings: [
        "World ID 4 nullifiers are one-time replay protection, not persistent user IDs."
      ]
    };
  },
  "passport-holder-access": () => {
    const signal = "passport-access";
    return {
      id: "passport-holder-access",
      event: "Unlock document-backed access",
      credential: "Passport",
      protocol: "World ID 4.0",
      availability: "ready",
      enabled: true,
      minimumAssurance: "Proof of valid passport document possession.",
      abusePrevented: "Access without the required document-grade credential.",
      signal,
      policy: createPassportPolicy(signal),
      generatedCode: `const trustEvent = { signal: "${signal}" } as const
const policy = createPassportPolicy(trustEvent.signal)

// Request only possession. Do not collect the passport or identity fields.`,
      warnings: [
        "Passport possession does not automatically prove an age, country, or name policy."
      ]
    };
  },
  "sensitive-human-approval": () => {
    const signal = "sensitive-approval";
    return {
      id: "sensitive-human-approval",
      event: "Approve a sensitive human action",
      credential: "Proof of Human + fresh presence",
      protocol: "World ID 4.0",
      availability: "ready",
      enabled: true,
      minimumAssurance:
        "Unique human assurance plus user presence at the moment of approval.",
      abusePrevented: "Replayed or unattended approvals for a sensitive action.",
      signal,
      policy: createProofOfHumanWithPresencePolicy(signal),
      generatedCode: `const trustEvent = { signal: "${signal}" } as const
const policy = createProofOfHumanWithPresencePolicy(trustEvent.signal)

<IDKitRequestWidget require_user_presence {...request} />`,
      warnings: [
        "Fresh presence is extra friction; reserve it for an event that truly needs contemporaneous consent."
      ]
    };
  },
  "age-eligibility": (gates) => {
    const signal = "age-18-access";
    return {
      id: "age-eligibility",
      event: "Confirm an 18+ eligibility rule",
      credential: "Identity Check: minimum age 18",
      protocol: "World ID 4.0",
      availability: "preview",
      enabled: gates.identityCheckEnabled === true,
      minimumAssurance:
        "Document-backed attestation that the minimum-age policy matched.",
      abusePrevented: "Under-age access without collecting birth date or document data.",
      signal,
      policy: null,
      generatedCode: `const preset = identityCheck({
  attributes: [{ type: "minimum_age", value: 18 }],
})

const request = IDKit.request({
  ...config,
  action: "age-18-access",
  allow_legacy_proofs: false,
}).preset(preset)

// Server: require a verified response with identity_attested === true.`,
      warnings: [identityCheckWarning]
    };
  },
  "low-friction-liveness": (gates) => {
    const signal = "onboarding-liveness";
    return {
      id: "low-friction-liveness",
      event: "Add low-friction liveness during onboarding",
      credential: "Selfie Check",
      protocol: "World ID 3.0 legacy",
      availability: "legacy-beta",
      enabled: gates.selfieCheckEnabled === true,
      minimumAssurance:
        "A low-friction selfie liveness and uniqueness signal for bot deterrence.",
      abusePrevented: "Automated sign-ups where Orb-level assurance is unnecessary.",
      signal,
      policy: createSelfiePolicy(signal),
      generatedCode: `const preset = selfieCheckLegacy({ signal: "${signal}" })

const request = IDKit.request({
  ...config,
  allow_legacy_proofs: true,
}).preset(preset)

// Keep behind your explicit beta eligibility flag.`,
      warnings: [selfieCheckWarning]
    };
  }
};

export const trustEvents = [
  { id: "one-per-human-promotion", label: "One-per-human promotion" },
  { id: "passport-holder-access", label: "Passport holder access" },
  { id: "sensitive-human-approval", label: "Sensitive human approval" },
  { id: "age-eligibility", label: "18+ eligibility (preview)" },
  { id: "low-friction-liveness", label: "Low-friction liveness (beta)" }
] as const satisfies ReadonlyArray<{ id: TrustEventId; label: string }>;

export function getPolicyRecommendation(
  event: TrustEventId,
  gates: PolicyGates = {}
): PolicyRecommendation {
  return policyBuilders[event](gates);
}
