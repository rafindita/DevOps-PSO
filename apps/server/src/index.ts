import fs from "node:fs";
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

// Resolusi Path Vite SSR/Client:
// import.meta.dirname saat dijalankan dari apps/server/dist/index.mjs berada di apps/server/dist
// Path navigasi: apps/server/dist -> apps/server -> apps -> web -> dist -> client
const frontendAssetsPath = path.join(
	import.meta.dirname,
	"..",
	"..",
	"web",
	"dist",
	"client"
);

const frontendIndexPath = path.join(
	frontendAssetsPath,
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
			detail: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
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

// Validasi keberadaan direktori statis sebelum inisialisasi rute
if (fs.existsSync(frontendAssetsPath)) {
	app
		.use(staticPlugin({ assets: frontendAssetsPath, prefix: "/" }))
		.get("/*", () => Bun.file(frontendIndexPath));
} else {
	app.get("/*", () => "Frontend dist/client folder not found. Please ensure 'bun run build' was executed in apps/web.");
}

export type App = typeof app;
export { app };

if (process.env.NODE_ENV !== "test") {
	const PORT = Number(process.env.PORT) || 3000;
	app.listen({ port: PORT, hostname: "0.0.0.0" }, (server) => {
		console.log(`Server running at http://${server?.hostname}:${server?.port}`);
		console.log(`[Static Files] Serving from: ${frontendAssetsPath}`);
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
