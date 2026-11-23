import { migrate } from "drizzle-orm/postgres-js/migrator";
import { createDb } from "./client";

async function run() {
  const { db, client } = createDb();
  try {
    console.log("Applying PostgreSQL migrations...");
    await migrate(db, { migrationsFolder: "./src/db/migrations" });
    console.log("Migrations applied successfully.");
  } finally {
    await client.end({ timeout: 5 });
  }
}

run().catch((err) => {
  console.error("Migration failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
