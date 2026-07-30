export const TRIAL_SIGNAL = "ethglobal-lisbon-builder-trial";
export type WorldEnvironment = "production" | "staging";

export type TrialEnvironment = {
  readonly [key: string]: string | undefined;
  WORLD_APP_ID?: string;
  WORLD_RP_ID?: string;
  WORLD_RP_SIGNING_KEY?: string;
  WORLD_TRIAL_ACTION?: string;
  WORLD_ID_ENVIRONMENT?: string;
  DATABASE_URL?: string;
};

export function trialAction(environment: TrialEnvironment): string | null {
  const action = environment.WORLD_TRIAL_ACTION?.trim();
  return action ? action : null;
}

export function worldEnvironment(
  environment: TrialEnvironment
): WorldEnvironment | null {
  return environment.WORLD_ID_ENVIRONMENT === "production" ||
    environment.WORLD_ID_ENVIRONMENT === "staging"
    ? environment.WORLD_ID_ENVIRONMENT
    : null;
}

export function isLiveTrialConfigured(environment: TrialEnvironment): boolean {
  return Boolean(
    environment.WORLD_APP_ID &&
      environment.WORLD_RP_ID &&
      environment.WORLD_RP_SIGNING_KEY &&
      trialAction(environment) &&
      worldEnvironment(environment) === "production" &&
      environment.DATABASE_URL
  );
}
