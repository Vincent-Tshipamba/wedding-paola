import { loadEnvConfig
} from "@next/env";
import { defineConfig
} from "drizzle-kit";

loadEnvConfig(process.cwd()); // reads .env.local like Next does

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
    // Migrations need a session/direct connection (not the transaction pooler)
  dbCredentials: { url: process.env.DIRECT_URL ?? process.env.DATABASE_URL!
    },
});