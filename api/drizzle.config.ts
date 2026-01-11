import { defineConfig } from "drizzle-kit";
import { config } from "./src/config/index";

export default defineConfig({
  dialect: "postgresql",
  out: "./src/drizzle/migrations",
  schema: "./src/drizzle/schema",
  verbose: true,
  strict: true,
  dbCredentials: {
    url: config.pgUrl,
  },
});
