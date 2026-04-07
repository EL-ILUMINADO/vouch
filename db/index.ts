// db/index.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";

if (typeof window === "undefined") {
  neonConfig.webSocketConstructor = ws;
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is strictly required for system operation.");
}

// We use a Pool for better performance with multiple queries
const pool = new Pool({ connectionString });
export const db = drizzle(pool);
