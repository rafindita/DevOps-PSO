// server entry point
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

// Menggunakan __dirname agar path selalu relatif terhadap file index.ts
// Kita naik 2 tingkat dari __dirname (src -> server -> apps) 
// kemudian turun ke web/dist
const frontendAssetsPath = path.join(__dirname, "..", "..", "web", "dist");
const frontendIndexPath = path.join(__dirname, "..", "..", "web", "dist", "index.html");

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
	// Menyajikan file statis dari folder web/dist yang telah diperbaiki path-nya
	.use(staticPlugin({ assets: frontendAssetsPath, prefix: "/" }))
	.use(crawlerModule)
	.use(papersModule)
	.get("/*", () => {
		return Bun.file(frontendIndexPath);
	});

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
