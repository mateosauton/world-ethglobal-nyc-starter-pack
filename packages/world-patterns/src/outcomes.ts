export type WorldErrorCode =
  | "configuration_missing"
  | "eligibility_required"
  | "request_failed"
  | "verification_failed"
  | "user_rejected"
  | "unavailable";

export type LiveWorldResult<T> = {
  ok: true;
  mode: "live";
  value: T;
};

export type SimulatorResult<T> = {
  ok: true;
  mode: "simulator";
  value: T;
  fixture: string;
};

export type WorldFailure = {
  ok: false;
  code: WorldErrorCode;
  message: string;
  retryable: boolean;
};

export type WorldOutcome<T> =
  | LiveWorldResult<T>
  | SimulatorResult<T>
  | WorldFailure;

/** Live-only boundary accepted by benefit and persistence code. */
export type VerifiedWorldResult<T> = LiveWorldResult<T>;

export function isVerifiedWorldResult<T>(
  outcome: WorldOutcome<T>
): outcome is VerifiedWorldResult<T> {
  return outcome.ok && outcome.mode === "live";
}

export function createVerifiedWorldResult<T>(
  value: T
): VerifiedWorldResult<T> {
  return { ok: true, mode: "live", value };
}
