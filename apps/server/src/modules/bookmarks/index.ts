import { jwt } from "@elysiajs/jwt";
import { db } from "@scholar-seek/db";
import { bookmarks } from "@scholar-seek/db/schema/bookmarks";
import { collections } from "@scholar-seek/db/schema/collections";
import { papers } from "@scholar-seek/db/schema/papers";
import { and, desc, eq, sql } from "drizzle-orm";
import { Elysia, t } from "elysia";
export const bookmarksModule = new Elysia({ prefix: "/api" })
	.use(
		jwt({
			name: "jwt",
			secret: process.env.JWT_SECRET || "super-secret-jwt-key",
			exp: "7d",
		})
	)
	.derive(async ({ jwt, headers, set }) => {
		const auth = headers.authorization;
		const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;

		if (!token) {
			set.status = 401;
			throw new Error("Unauthorized");
		}

		const payload = await jwt.verify(token);
		if (!payload) {
			set.status = 401;
			throw new Error("Unauthorized");
		}
		if (!payload.id) {
			set.status = 401;
			throw new Error("Unauthorized");
		}

		return { userId: payload.id as string };
	})
	// ==========================================
	// COLLECTIONS ENDPOINTS
	// ==========================================
	.get(
		"/collections",
		async ({ userId }) => {
			const results = await db
				.select({
					id: collections.id,
					name: collections.name,
					createdAt: collections.created_at,
					bookmarkCount: sql<number>`count(${bookmarks.id})`.mapWith(Number),
				})
				.from(collections)
				.leftJoin(bookmarks, eq(collections.id, bookmarks.collection_id))
				.where(eq(collections.user_id, userId))
				.groupBy(collections.id)
				.orderBy(desc(collections.created_at));

			return { collections: results };
		},
		{
			detail: {
				summary: "Get all collections for the user",
				tags: ["collections"],
			},
		}
	)
	.post(
		"/collections",
		async ({ body, userId }) => {
			const [newCollection] = await db
				.insert(collections)
				.values({
					user_id: userId,
					name: body.name,
				})
				.returning();
			return { message: "Collection created", collection: newCollection };
		},
		{
			body: t.Object({
				name: t.String(),
			}),
			detail: {
				summary: "Create a new collection",
				tags: ["collections"],
			},
		}
	)
	.delete(
		"/collections/:id",
		async ({ params, userId, set }) => {
			const result = await db
				.delete(collections)
				.where(
					and(eq(collections.id, params.id), eq(collections.user_id, userId))
				)
				.returning();

			if (result.length === 0) {
				set.status = 404;
				return { error: "Collection not found" };
			}

			return { message: "Collection deleted" };
		},
		{
			params: t.Object({
				id: t.String(),
			}),
			detail: {
				summary: "Delete a collection",
				tags: ["collections"],
			},
		}
	)
	.get(
		"/collections/:id/papers",
		async ({ params, userId, set }) => {
			// Verify collection belongs to user
			const [col] = await db
				.select()
				.from(collections)
				.where(
					and(eq(collections.id, params.id), eq(collections.user_id, userId))
				);

			if (!col) {
				set.status = 404;
				return { error: "Collection not found" };
			}

			const results = await db
				.select({
					bookmark: bookmarks,
					paper: papers,
				})
				.from(bookmarks)
				.innerJoin(papers, eq(bookmarks.paper_id, papers.id))
				.where(
					and(
						eq(bookmarks.collection_id, params.id),
						eq(bookmarks.user_id, userId)
					)
				)
				.orderBy(desc(bookmarks.created_at));

			return {
				collection: col,
				total: results.length,
				bookmarks: results.map((r) => ({
					id: r.bookmark.id,
					createdAt: r.bookmark.created_at,
					paper: r.paper,
				})),
			};
		},
		{
			params: t.Object({
				id: t.String(),
			}),
			detail: {
				summary: "Get papers in a collection",
				tags: ["collections"],
			},
		}
	)
	// ==========================================
	// BOOKMARKS ENDPOINTS
	// ==========================================
	.get(
		"/bookmarks",
		async ({ userId }) => {
			const results = await db
				.select({
					bookmark: bookmarks,
					paper: papers,
				})
				.from(bookmarks)
				.innerJoin(papers, eq(bookmarks.paper_id, papers.id))
				.where(eq(bookmarks.user_id, userId))
				.orderBy(desc(bookmarks.created_at));

			return {
				total: results.length,
				bookmarks: results.map((r) => ({
					id: r.bookmark.id,
					createdAt: r.bookmark.created_at,
					collectionId: r.bookmark.collection_id,
					paper: r.paper,
				})),
			};
		},
		{
			detail: {
				summary: "Get bookmarks for authenticated user",
				tags: ["bookmarks"],
			},
		}
	)
	.post(
		"/bookmarks",
		async ({ body, userId, set }) => {
			try {
				const [newBookmark] = await db
					.insert(bookmarks)
					.values({
						user_id: userId,
						paper_id: body.paperId,
						collection_id: body.collectionId || null,
					})
					.returning();
				return { message: "Bookmarked successfully", bookmark: newBookmark };
			} catch (err: unknown) {
				// Handle unique constraint violation (duplicate bookmark)
				if (
					typeof err === "object" &&
					err !== null &&
					"code" in err &&
					err.code === "23505"
				) {
					set.status = 400;
					return { error: "Already bookmarked in this collection" };
				}
				throw err;
			}
		},
		{
			body: t.Object({
				paperId: t.String(),
				collectionId: t.Optional(t.String()),
			}),
			detail: {
				summary: "Bookmark a paper",
				tags: ["bookmarks"],
			},
		}
	)
	.delete(
		"/bookmarks/:id",
		async ({ params, userId, set }) => {
			const result = await db
				.delete(bookmarks)
				.where(and(eq(bookmarks.id, params.id), eq(bookmarks.user_id, userId)))
				.returning();

			if (result.length === 0) {
				set.status = 404;
				return { error: "Bookmark not found" };
			}

			return { message: "Bookmark removed" };
		},
		{
			params: t.Object({
				id: t.String(),
			}),
			detail: {
				summary: "Remove a bookmark by ID",
				tags: ["bookmarks"],
			},
		}
	)
	.delete(
		"/bookmarks/paper/:paperId",
		async ({ params, userId, set }) => {
			const result = await db
				.delete(bookmarks)
				.where(
					and(
						eq(bookmarks.paper_id, params.paperId),
						eq(bookmarks.user_id, userId)
					)
				)
				.returning();

			if (result.length === 0) {
				set.status = 404;
				return { error: "Bookmark not found" };
			}

			return { message: "All bookmarks for this paper removed" };
		},
		{
			params: t.Object({
				paperId: t.String(),
			}),
			detail: {
				summary: "Remove all bookmarks for a paper",
				tags: ["bookmarks"],
			},
		}
	);
