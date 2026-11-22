import { drizzle } from "drizzle-orm/expo-sqlite";
import { openDatabaseSync } from "expo-sqlite";
import * as schema from "./schema";

const sqlite = openDatabaseSync("habits.db", { enableChangeListener: true });

export const appDb = drizzle(sqlite, { schema });
export type AppDb = typeof appDb;
