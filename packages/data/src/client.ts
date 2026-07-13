import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "./schema";

export function createDataClient(databaseUrl: string) {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }

  return drizzle(neon(databaseUrl), { schema });
}

export type DataClient = ReturnType<typeof createDataClient>;
