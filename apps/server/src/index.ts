import { cors } from "@elysiajs/cors";
import { staticPlugin } from "@elysia/static";
import { env } from "@scholar-seek/env/server";
import { Elysia } from "elysia";
import { fileURLToPath } from "node:url";
import { crawlerModule } from "./modules/crawler";
import {
	cleanupStuckJobs,
	startCrawlWorker,
	stopCrawlWorker,
} from "./modules/crawler/queue";
import { papersModule } from "./modules/papers";

const frontendAssetsPath = fileURLToPath(
	new URL("../../web/dist/client/", import.meta.url)
);
const frontendIndexPath = fileURLToPath(
	new URL("../../web/dist/client/index.html", import.meta.url)
);

const app = new Elysia()
	.onError(({ code, error, set }) => {
		if (code === "VALIDATION") {
			set.status = 400;
			return { error: error.message };
		}
		if (code === "NOT_FOUND") {
			set.status = 404;
			return { error: "Not found" };
		}
		set.status = 500;
		return { error: "Internal server error" };
	})
	.use(
		staticPlugin({
			assets: frontendAssetsPath,
			prefix: "/",
		})
	)
	.use(
		cors({
			origin: env.CORS_ORIGIN,
			methods: ["GET", "POST", "OPTIONS"],
		})
	)
	.use(papersModule)
	.use(crawlerModule)
	.get("/health", () => "OK", {
		detail: {
			summary: "Health check",
			tags: ["health"],
		},
	})
	.get("/*", ({ path }) => {
		if (path.startsWith("/api")) {
			return new Response("Not found", { status: 404 });
		}

		return Bun.file(frontendIndexPath);
	});

app.listen(3000, () => {
	console.log(
		`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
	);
	cleanupStuckJobs().then(() => startCrawlWorker());
});

async function shutdown() {
	console.log("[server] shutting down...");
	await stopCrawlWorker();
	app.stop();
	process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

export type App = typeof app;
