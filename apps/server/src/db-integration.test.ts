import { describe, expect, test, afterAll } from "bun:test";
import { db } from "@scholar-seek/db";
import { papers } from "@scholar-seek/db/schema/papers";
import { eq } from "drizzle-orm";

const testPaper = {
  id: "test:paper:123",
  title: "A Test Paper for Integration Testing",
  abstract: "This is a test abstract.",
  authors: ["Tester McTestface"],
  journal: "Journal of Tests",
  source: "test",
};

const canConnect = process.env.DATABASE_URL ? true : false;
const itif = (condition: boolean) => (condition ? test : test.skip);

describe("Database Integration Test", () => {
  afterAll(async () => {
    if (!canConnect) return;
    await db.delete(papers).where(eq(papers.id, testPaper.id)).catch(() => {});
  });

  itif(canConnect)("should INSERT, SELECT, and DELETE a paper", async () => {
    // 1. INSERT
    await db.insert(papers).values(testPaper).onConflictDoNothing();

    // 2. SELECT
    const selected = await db.select().from(papers).where(eq(papers.id, testPaper.id));
    expect(selected[0]?.title).toBe(testPaper.title);

    // 3. DELETE
    const deleted = await db.delete(papers).where(eq(papers.id, testPaper.id)).returning();
    expect(deleted).toHaveLength(1);
  });
});
