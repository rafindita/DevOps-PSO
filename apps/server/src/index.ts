import path from "node:path";
import { staticPlugin } from "@elysia/static";
import { cors } from "@elysiajs/cors";
import { Elysia } from "elysia";

import { authPlugin } from "./lib/auth";
import { authModule } from "./modules/auth";
import { bookmarksModule } from "./modules/bookmarks";
import { crawlerModule } from "./modules/crawler";
import {
	cleanupStuckJobs,
	startCrawlWorker,
	stopCrawlWorker,
} from "./modules/crawler/queue";
import { papersModule } from "./modules/papers";

const frontendAssetsPath = path.join(
	import.meta.dirname,
	"..",
	"..",
	"web",
	"dist"
);
const frontendIndexPath = path.join(
	import.meta.dirname,
	"..",
	"..",
	"web",
	"dist",
	"index.html"
);

import fs from "node:fs";

const app = new Elysia()
	.use(authPlugin)
	.onError(({ code, error, set }) => {
		if (code === "VALIDATION") {
			set.status = 400;
			return { error: error.message };
		}
		if (code === "NOT_FOUND") {
			set.status = 404;
			return { error: "Not Found" };
		}
		console.error(error);
		set.status = 500;
		return { error: "Internal Server Error" };
	})
	.use(
		cors({
			origin: true,
			allowedHeaders: ["Content-Type", "Authorization"],
			credentials: true,
		})
	)
	.use(authModule)
	.use(bookmarksModule)
	.use(crawlerModule)
	.use(papersModule)
	.get("/health", () => ({ status: "ok" }))
	.get("/api/db-test", async () => {
		try {
			const { db } = await import("@scholar-seek/db");
			const { papers } = await import("@scholar-seek/db/schema/papers");
			const { sql } = await import("drizzle-orm");
			
			// Test 1: Simple select
			const result = await db.select().from(papers).limit(1);
			
			// Test 2: JSONB casting which might be failing
			const testJsonb = await db.execute(sql`SELECT '["test"]'::jsonb::text`);
			
			return { 
				status: "db_ok", 
				papersFound: result.length,
				jsonbCastWorks: !!testJsonb
			};
		} catch (error: unknown) {
			return { 
				status: "db_error", 
				message: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack : undefined
			};
		}
	});

if (fs.existsSync(frontendAssetsPath)) {
	app.use(staticPlugin({ assets: frontendAssetsPath, prefix: "/" }));
}

if (fs.existsSync(frontendIndexPath)) {
	app.get("/*", () => {
		return Bun.file(frontendIndexPath);
	});
}

export default app;
export type App = typeof app;
export { app };

if (process.env.NODE_ENV !== "test") {
	const PORT = Number(process.env.PORT) || 3000;
	app.listen({ port: PORT, hostname: "0.0.0.0" }, (server) => {
		console.log(`Server running at http://${server?.hostname}:${server?.port}`);
	});

	startCrawlWorker();

	process.on("SIGINT", async () => {
		console.log("Shutting down gracefully...");
		await stopCrawlWorker();
		await cleanupStuckJobs();
		await app.stop();
		process.exit(0);
	});
}
