import { afterAll, describe, expect, test } from "bun:test";
import { db } from "@scholar-seek/db";
import { papers } from "@scholar-seek/db/schema/papers";
import { eq } from "drizzle-orm";

const testPaper = {
	id: "123e4567-e89b-12d3-a456-426614174001",
	title: "A Test Paper for Integration Testing",
	abstract: "This is a test abstract.",
	authors: ["Tester McTestface"],
	journal: "Journal of Tests",
	source: "test",
	source_url: "http://example.com/test", // Add required field
};

const canConnect = !!process.env.DATABASE_URL;
const itif = (condition: boolean) => (condition ? test : test.skip);

describe("Database Integration Test", () => {
	afterAll(async () => {
		if (!canConnect) {
			return;
		}
		await db
			.delete(papers)
			.where(eq(papers.id, testPaper.id))
			.catch(() => {
				/* Ignore errors during cleanup */
			});
	});

	itif(canConnect)("should INSERT, SELECT, and DELETE a paper", async () => {
		// 1. INSERT
		await db.insert(papers).values(testPaper).onConflictDoNothing();

		// 2. SELECT
		const selected = await db
			.select()
			.from(papers)
			.where(eq(papers.id, testPaper.id));
		expect(selected[0]?.title).toBe(testPaper.title);

		// 3. DELETE
		const deleted = await db
			.delete(papers)
			.where(eq(papers.id, testPaper.id))
			.returning();
		expect(deleted).toHaveLength(1);
	});
});
