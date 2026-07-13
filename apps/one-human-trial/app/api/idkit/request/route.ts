import { createRpRequest } from "@world-lisbon/world-patterns";

import {
  TRIAL_ACTION,
  TRIAL_SIGNAL,
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

    if (!appId || !rpId || !signingKey) {
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
      action: TRIAL_ACTION,
      signingKey
    });

    return Response.json({
      app_id: appId,
      action: TRIAL_ACTION,
      signal: TRIAL_SIGNAL,
      rp_context: rpContext
    });
  };
}

export const POST = createRequestHandler();
