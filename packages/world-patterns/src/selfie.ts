import {
  selfieCheckLegacy
} from "@worldcoin/idkit";
import type { SelfieCheckLegacyPreset } from "@worldcoin/idkit-core";

export type SelfiePolicy = {
  kind: "selfie-check";
  lifecycle: "legacy-beta";
  protocolVersion: "3.0";
  requiresEligibility: true;
  allowLegacyProofs: true;
  requireUserPresence: true;
  preset: SelfieCheckLegacyPreset;
};

export function createSelfiePolicy(signal: string): SelfiePolicy {
  return {
    kind: "selfie-check",
    lifecycle: "legacy-beta",
    protocolVersion: "3.0",
    requiresEligibility: true,
    allowLegacyProofs: true,
    requireUserPresence: true,
    preset: selfieCheckLegacy({ signal })
  };
}

export function isSelfieCheckAvailable(
  eligibilityFlag: string | undefined
): boolean {
  return eligibilityFlag === "true";
}
