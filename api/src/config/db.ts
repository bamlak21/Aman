import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { config } from ".";
import * as schema from "../drizzle/schema";

const pool = new Pool({
  connectionString: config.pgUrl,
});

export const db = drizzle(pool, { schema });

// Postgres Drizzle connection function
export async function connectDB() {
  try {
    await pool.connect();
    console.log("Database connected");
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1); // Stop the server if DB fails
  }
}
