export const TRIAL_ACTION = "lisbon-one-human-trial";
export const TRIAL_SIGNAL = "ethglobal-lisbon-builder-trial";

export type TrialEnvironment = {
  readonly [key: string]: string | undefined;
  WORLD_APP_ID?: string;
  WORLD_RP_ID?: string;
  WORLD_RP_SIGNING_KEY?: string;
  DATABASE_URL?: string;
};

export function isLiveTrialConfigured(environment: TrialEnvironment): boolean {
  return Boolean(
    environment.WORLD_APP_ID &&
      environment.WORLD_RP_ID &&
      environment.WORLD_RP_SIGNING_KEY &&
      environment.DATABASE_URL
  );
}
