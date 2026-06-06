import { fileURLToPath } from "node:url";
import { staticPlugin } from "@elysia/static";
import { cors } from "@elysiajs/cors";
import { env } from "@scholar-seek/env/server";
import { Elysia } from "elysia";
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
		console.error(error);
		set.status = 500;
		return { error: "Internal Server Error" };
	})
	.use(cors())
	.use(staticPlugin({ assets: frontendAssetsPath, prefix: "/" }))
	.use(crawlerModule)
	.use(papersModule)
	.get("/*", () => {
		return Bun.file(frontendIndexPath);
	});

const server = app.listen(env.PORT);

console.log(`🚀 Server running at http://${server.hostname}:${server.port}`);

startCrawlWorker();

process.on("SIGINT", async () => {
	console.log("Shutting down gracefully...");
	await stopCrawlWorker();
	await cleanupStuckJobs();
	await app.stop();
	process.exit(0);
});
