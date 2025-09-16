// @ts-ignore - Bun built-in module
import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { logs } from "./schema";
import { sql } from "drizzle-orm";

// Initialize SQLite database
const sqlite = new Database("logs.db");
export const db = drizzle(sqlite);

// Initialize database schema
export function initializeDatabase() {
  // Create logs table if it doesn't exist
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  console.log("Database initialized");
}

// Graceful shutdown
process.on("SIGINT", () => {
  sqlite.close();
  process.exit(0);
});

process.on("SIGTERM", () => {
  sqlite.close();
  process.exit(0);
});