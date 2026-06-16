// server entry point
import path from "node:path";
import { staticPlugin } from "@elysia/static";
import { cors } from "@elysiajs/cors";
import { db } from "@scholar-seek/db";
import { sql } from "drizzle-orm";
import { Elysia } from "elysia";
import { authModule } from "./modules/auth";
import { bookmarksModule } from "./modules/bookmarks";
import { crawlerModule } from "./modules/crawler";
import {
	cleanupStuckJobs,
	startCrawlWorker,
	stopCrawlWorker,
} from "./modules/crawler/queue";
import { papersModule } from "./modules/papers";

process.on("uncaughtException", (err) => {
	if (
		err.message.includes("ETIMEDOUT") ||
		err.message.includes("Connection is closed")
	) {
		// Log gracefully without crashing
		return;
	}
	console.error("Uncaught Exception:", err);
	process.exit(1);
});

process.on("unhandledRejection", (reason: unknown) => {
	const msg = reason instanceof Error ? reason.message : String(reason);
	if (msg.includes("ETIMEDOUT") || msg.includes("Connection is closed")) {
		// Log gracefully without crashing
		return;
	}
	console.error("Unhandled Rejection:", reason);
});

import fs from "node:fs";

// Menggunakan __dirname agar path selalu relatif terhadap file index.ts
// Kita naik 2 tingkat dari __dirname (src -> server -> apps)
// kemudian turun ke web/dist
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

const app = new Elysia()
	.onError(({ code, error, set }) => {
		if (code === "VALIDATION") {
			set.status = 400;
			return { error: error.message };
		}
		console.error(error);
		set.status = 500;
		return {
			error: "Internal Server Error",
			detail: error.message,
			stack: error.stack,
		};
	})
	.use(cors())
	.use(authModule)
	.use(bookmarksModule)
	.use(crawlerModule)
	.use(papersModule)
	.get("/health", () => ({ status: "ok" }))
	.get("/health/db", async () => {
		try {
			await db.execute(sql`SELECT 1`);
			return { status: "ok", database: "connected" };
		} catch (err: unknown) {
			return {
				status: "error",
				database: "disconnected",
				error: err instanceof Error ? err.message : String(err),
			};
		}
	});

if (fs.existsSync(frontendAssetsPath)) {
	app
		.use(staticPlugin({ assets: frontendAssetsPath, prefix: "/" }))
		.get("/*", () => Bun.file(frontendIndexPath));
} else {
	app.get("/*", () => "Frontend dist folder not found. Running in dev mode.");
}

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
