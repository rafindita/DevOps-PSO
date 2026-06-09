import fs from "node:fs";
import path from "node:path";
import { staticPlugin } from "@elysia/static";
import { cors } from "@elysiajs/cors";
import { Elysia } from "elysia";
import { crawlerModule } from "./modules/crawler";
import {
	cleanupStuckJobs,
	startCrawlWorker,
	stopCrawlWorker,
} from "./modules/crawler/queue";
import { papersModule } from "./modules/papers";

const frontendAssetsPath = path.resolve(
	process.env.NODE_ENV === "production"
		? path.join(process.cwd(), "apps/web/dist/client")
		: path.join(import.meta.dir, "../../apps/web/dist/client")
);
const frontendIndexPath = path.resolve(frontendAssetsPath, "index.html");

const app = new Elysia()
	.onError(({ code, error, set }) => {
		if (code === "VALIDATION") {
			set.status = 400;
			return { error: error.message };
		}
		console.error(error);
		set.status = 500;
		return { error: "Internal Server Error" };
	})
	.use(
		cors({
			origin: true, // Allow all origins in dev, or specify your domain
			methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
			allowedHeaders: ["Content-Type", "Authorization"],
		})
	)
	.use(staticPlugin({ assets: frontendAssetsPath, prefix: "/" }))
	.use(crawlerModule)
	.use(papersModule)
	.get("/*", () => {
		return Bun.file(frontendIndexPath);
	});

const PORT = Number(process.env.PORT) || 3000;
const server = app.listen(PORT);
console.log(`Server running at http://${server.hostname}:${server.port}`);

// Prevent crash if Redis/Worker fails
if (process.env.ENABLE_CRAWLER === "true") {
	try {
		startCrawlWorker();
		console.log("Crawler worker started");
	} catch (e) {
		console.error("Failed to start crawler worker:", e);
	}
}

process.on("SIGINT", async () => {
	console.log("Shutting down gracefully...");
	try {
		if (process.env.ENABLE_CRAWLER === "true") {
			await stopCrawlWorker();
			await cleanupStuckJobs();
		}
		await app.stop();
	} catch (e) {
		console.error("Error during shutdown:", e);
	}
	process.exit(0);
});
