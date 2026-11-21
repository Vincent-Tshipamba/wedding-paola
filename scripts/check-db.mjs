import nextEnv from "@next/env";
import postgres from "postgres";

nextEnv.loadEnvConfig(process.cwd());
const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
console.log("Using:", url?.replace(/:[^:@]+@/, ":****@")); // password hidden

const sql = postgres(url, { prepare: false });
try {
    console.log(await sql`select now()`);
    console.log(await sql`select table_name from information_schema.tables where table_schema = 'public'`);
} catch (e) {
    console.error("FAILED:", e.message ?? e);
} finally {
    await sql.end();
}