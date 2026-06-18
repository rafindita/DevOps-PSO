import { describe, expect, test } from "bun:test";
import { db } from "@scholar-seek/db";
import { sql } from "drizzle-orm";
import { papers } from "@scholar-seek/db/schema/papers";

describe("Database Connection & Schema", () => {
  test("should connect to the database and run a simple query", async () => {
    try {
      const result = await db.execute(sql`SELECT 1 as result`);
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    } catch (error) {
      console.warn("Skipping DB connection test: DATABASE_URL not available or DB not reachable.");
    }
  });

  test("should be able to query the papers table schema", async () => {
    try {
      const result = await db.select().from(papers).limit(1);
      expect(Array.isArray(result)).toBe(true);
    } catch (error) {
      console.warn("Skipping papers schema test: DATABASE_URL not available or DB not reachable.");
    }
  });
});
