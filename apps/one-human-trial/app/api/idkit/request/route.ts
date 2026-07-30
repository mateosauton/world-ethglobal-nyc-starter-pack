import { createRpRequest } from "@world-lisbon/world-patterns";

import {
  TRIAL_SIGNAL,
  trialAction,
  worldEnvironment,
  type TrialEnvironment
} from "../../../../lib/trial-config";

type RequestDependencies = {
  environment?: TrialEnvironment;
  createContext?: typeof createRpRequest;
};

export function createRequestHandler({
  environment = process.env,
  createContext = createRpRequest
}: RequestDependencies = {}) {
  return async function post() {
    const appId = environment.WORLD_APP_ID;
    const rpId = environment.WORLD_RP_ID;
    const signingKey = environment.WORLD_RP_SIGNING_KEY;
    const action = trialAction(environment);
    const idkitEnvironment = worldEnvironment(environment);

    if (!appId || !rpId || !signingKey || !action || !idkitEnvironment) {
      return Response.json(
        {
          error: "Live IDKit is not configured",
          code: "missing_configuration"
        },
        { status: 503 }
      );
    }

    const rpContext = createContext({
      rpId,
      action,
      signingKey
    });

    return Response.json({
      app_id: appId,
      action,
      signal: TRIAL_SIGNAL,
      environment: idkitEnvironment,
      rp_context: rpContext
    });
  };
}

export const POST = createRequestHandler();
