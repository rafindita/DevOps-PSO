// server entry point
import path from "node:path";
import { staticPlugin } from "@elysia/static";
import { cors } from "@elysiajs/cors";
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
		return { error: "Internal Server Error" };
	})
	.use(
		cors({
			origin: true, // Allow all origins for now, can be restricted later
			allowedHeaders: ["Content-Type", "Authorization"],
			credentials: true,
		})
	)
	.use(staticPlugin({ assets: frontendAssetsPath, prefix: "/" }))
	.use(authModule)
	.use(bookmarksModule)
	.use(crawlerModule)
	.use(papersModule)
	.get("/health", () => ({ status: "ok" }))
	.get("/*", () => {
		return Bun.file(frontendIndexPath);
	});

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
