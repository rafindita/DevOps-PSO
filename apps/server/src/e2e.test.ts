import { beforeAll, describe, expect, test } from "bun:test";
import { db } from "@scholar-seek/db";
import { users } from "@scholar-seek/db/schema/users";
import { papers } from "@scholar-seek/db/schema/papers";
import { eq } from "drizzle-orm";
import app from "./index";

const canConnect = !!process.env.DATABASE_URL;
const itif = (condition: boolean) => (condition ? test : test.skip);

describe("True End-to-End Workflow", () => {
	let authToken = "";
	let createdUserId = "";
	const testUser = {
		username: `testuser_${Date.now()}`,
		password: "password123",
	};
	const testPaperId = "123e4567-e89b-12d3-a456-426614174000"; // Valid UUID
	const testPaper = {
		id: testPaperId,
		title: "E2E Test Paper",
		abstract: "E2E Test abstract.",
		authors: ["E2E Tester"],
		journal: "Journal of E2E",
		source: "test",
		source_url: "http://example.com/e2e",
	};

	// Cleanup hook
	beforeAll(async () => {
		if (createdUserId && canConnect) {
			await db.delete(users).where(eq(users.id, createdUserId)).catch(() => {});
		}
		if (canConnect) {
			await db.delete(papers).where(eq(papers.id, testPaperId)).catch(() => {});
		}
	});

	itif(canConnect)("1. User Registration & Setup", async () => {
		// Insert test paper so bookmarking works
		await db.insert(papers).values(testPaper).onConflictDoNothing();

		const res = await app.handle(
			new Request("http://localhost/api/auth/register", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(testUser),
			})
		);
		expect(res.status).toBe(200);
		const body: any = await res.json();
		expect(body.user).toHaveProperty("id");
		createdUserId = body.user.id;
	});

	itif(canConnect)("2. User Login", async () => {
		const res = await app.handle(
			new Request("http://localhost/api/auth/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(testUser),
			})
		);
		expect(res.status).toBe(200);
		const body: any = await res.json();
		expect(body).toHaveProperty("token");
		authToken = body.token;
	});

	itif(canConnect)("3. Bookmark a Paper (Protected Route)", async () => {
		expect(authToken).not.toBeEmpty();
		const res = await app.handle(
			new Request("http://localhost/api/bookmarks", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${authToken}`,
				},
				body: JSON.stringify({ paperId: testPaperId }),
			})
		);
		expect(res.status).toBe(200);
	});

	itif(canConnect)("4. Verify Bookmark", async () => {
		const res = await app.handle(
			new Request("http://localhost/api/bookmarks", {
				headers: { Authorization: `Bearer ${authToken}` },
			})
		);
		expect(res.status).toBe(200);
		const body: any = await res.json();
		expect(body.bookmarks.some((b: any) => b.paper.id === testPaperId)).toBe(
			true
		);
	});
});
