import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { resolveDatabaseUrl } from "../env";
import * as schema from "./schema";

export function createDb(connectionString: string = resolveDatabaseUrl()) {
  // prepare: false is required for Cloudflare Hyperdrive / PgBouncer transaction pooling.
  const client = postgres(connectionString, {
    max: 5,
    prepare: false,
  });
  const db = drizzle(client, { schema });
  return { db, client };
}

const defaultInstance = createDb();
export const db = defaultInstance.db;
export type ApiDb = typeof db;
