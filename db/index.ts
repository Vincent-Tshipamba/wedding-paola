import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Supabase "Transaction pooler" URL (port 6543). `prepare: false` is required with that pooler.
// Reuse one client in dev so hot reloads don't exhaust connections.
const g = globalThis as unknown as { pg?: ReturnType<typeof postgres> };
const client = g.pg ?? postgres(process.env.DATABASE_URL!, { prepare: false });
if (process.env.NODE_ENV !== "production") g.pg = client;

export const db = drizzle(client, { schema });