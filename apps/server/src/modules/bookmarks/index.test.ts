import { beforeAll, describe, expect, mock, test } from "bun:test";
import { jwt } from "@elysiajs/jwt";
import { Elysia } from "elysia";
import { bookmarksModule } from "./index";

// Mock the database
mock.module("@scholar-seek/db", () => ({
	db: {
		select: mock().mockReturnValue({
			from: mock().mockReturnValue({
				leftJoin: mock().mockReturnValue({
					where: mock().mockReturnValue({
						groupBy: mock().mockReturnValue({
							orderBy: mock().mockResolvedValue([]),
						}),
					}),
				}),
				innerJoin: mock().mockReturnValue({
					where: mock().mockReturnValue({
						orderBy: mock().mockResolvedValue([]),
					}),
				}),
				where: mock().mockResolvedValue([{ id: "1", user_id: "1" }]),
			}),
		}),
		insert: mock().mockReturnValue({
			values: mock().mockReturnValue({
				returning: mock().mockResolvedValue([
					{ id: "col_1", name: "My Collection" },
				]),
			}),
		}),
		delete: mock().mockReturnValue({
			where: mock().mockReturnValue({
				returning: mock().mockResolvedValue([{ id: "1" }]),
			}),
		}),
	},
}));

let validToken: string;

describe("Bookmarks Module", () => {
	beforeAll(async () => {
		const testApp = new Elysia()
			.use(
				jwt({
					name: "jwt",
					secret: process.env.JWT_SECRET || "super-secret-jwt-key",
				})
			)
			.get("/sign", async ({ jwt }) => await jwt.sign({ id: "1" }));

		const response = await testApp.handle(new Request("http://localhost/sign"));
		validToken = await response.text();
	});

	test("GET /api/collections requires auth", async () => {
		const response = await bookmarksModule.handle(
			new Request("http://localhost/api/collections", {
				method: "GET",
			})
		);
		expect(response.status).toBe(401);
	});

	test("GET /api/collections returns collections", async () => {
		const response = await bookmarksModule.handle(
			new Request("http://localhost/api/collections", {
				method: "GET",
				headers: { Authorization: `Bearer ${validToken}` },
			})
		);
		expect(response.status).toBe(200);
		const data = (await response.json()) as any;
		expect(data.collections).toBeDefined();
	});

	test("POST /api/collections creates a collection", async () => {
		const response = await bookmarksModule.handle(
			new Request("http://localhost/api/collections", {
				method: "POST",
				headers: {
					Authorization: `Bearer ${validToken}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ name: "Test Collection" }),
			})
		);
		expect(response.status).toBe(200);
	});

	test("DELETE /api/collections/:id deletes a collection", async () => {
		const response = await bookmarksModule.handle(
			new Request("http://localhost/api/collections/1", {
				method: "DELETE",
				headers: { Authorization: `Bearer ${validToken}` },
			})
		);
		expect(response.status).toBe(200);
	});

	test("GET /api/bookmarks returns bookmarks", async () => {
		const response = await bookmarksModule.handle(
			new Request("http://localhost/api/bookmarks", {
				method: "GET",
				headers: { Authorization: `Bearer ${validToken}` },
			})
		);
		expect(response.status).toBe(200);
	});

	test("POST /api/bookmarks creates a bookmark", async () => {
		const response = await bookmarksModule.handle(
			new Request("http://localhost/api/bookmarks", {
				method: "POST",
				headers: {
					Authorization: `Bearer ${validToken}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ paperId: "paper_1" }),
			})
		);
		expect(response.status).toBe(200);
	});

	test("DELETE /api/bookmarks/:id deletes a bookmark", async () => {
		const response = await bookmarksModule.handle(
			new Request("http://localhost/api/bookmarks/1", {
				method: "DELETE",
				headers: { Authorization: `Bearer ${validToken}` },
			})
		);
		expect(response.status).toBe(200);
	});

	test("DELETE /api/collections/:id with non-existent collection", async () => {
		mock.module("@scholar-seek/db", () => ({
			db: {
				delete: mock().mockReturnValue({
					where: mock().mockReturnValue({
						returning: mock().mockResolvedValue([]),
					}),
				}),
			},
		}));

		const response = await bookmarksModule.handle(
			new Request("http://localhost/api/collections/999", {
				method: "DELETE",
				headers: { Authorization: `Bearer ${validToken}` },
			})
		);
		expect(response.status).toBe(404);
	});

	test("DELETE /api/bookmarks/:id with non-existent bookmark", async () => {
		mock.module("@scholar-seek/db", () => ({
			db: {
				delete: mock().mockReturnValue({
					where: mock().mockReturnValue({
						returning: mock().mockResolvedValue([]),
					}),
				}),
			},
		}));

		const response = await bookmarksModule.handle(
			new Request("http://localhost/api/bookmarks/999", {
				method: "DELETE",
				headers: { Authorization: `Bearer ${validToken}` },
			})
		);
		expect(response.status).toBe(404);
	});

	test("POST /api/bookmarks with duplicate bookmark", async () => {
		mock.module("@scholar-seek/db", () => ({
			db: {
				insert: mock().mockReturnValue({
					values: mock().mockReturnValue({
						returning: mock().mockRejectedValue({ code: "23505" }),
					}),
				}),
			},
		}));

		const response = await bookmarksModule.handle(
			new Request("http://localhost/api/bookmarks", {
				method: "POST",
				headers: {
					Authorization: `Bearer ${validToken}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ paperId: "paper_dup" }),
			})
		);
		expect(response.status).toBe(400);
	});

	test("DELETE /api/bookmarks/paper/:paperId deletes all paper bookmarks", async () => {
		mock.module("@scholar-seek/db", () => ({
			db: {
				delete: mock().mockReturnValue({
					where: mock().mockReturnValue({
						returning: mock().mockResolvedValue([{ id: "1" }]),
					}),
				}),
			},
		}));

		const response = await bookmarksModule.handle(
			new Request("http://localhost/api/bookmarks/paper/123", {
				method: "DELETE",
				headers: { Authorization: `Bearer ${validToken}` },
			})
		);
		expect(response.status).toBe(200);
	});

	test("DELETE /api/bookmarks/paper/:paperId non-existent", async () => {
		mock.module("@scholar-seek/db", () => ({
			db: {
				delete: mock().mockReturnValue({
					where: mock().mockReturnValue({
						returning: mock().mockResolvedValue([]),
					}),
				}),
			},
		}));

		const response = await bookmarksModule.handle(
			new Request("http://localhost/api/bookmarks/paper/123", {
				method: "DELETE",
				headers: { Authorization: `Bearer ${validToken}` },
			})
		);
		expect(response.status).toBe(404);
	});
});
