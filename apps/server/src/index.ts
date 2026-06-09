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

// Fungsi untuk mencari file secara rekursif (bongkar isi folder)
function findFile(dir: string, filename: string): string | null {
	if (!fs.existsSync(dir)) return null;
	const files = fs.readdirSync(dir);
	for (const file of files) {
		const fullPath = path.join(dir, file);
		if (fs.lstatSync(fullPath).isDirectory()) {
			const found = findFile(fullPath, filename);
			if (found) return found;
		} else if (file === filename) {
			return fullPath;
		}
	}
	return null;
}

const distPath = path.resolve(process.cwd(), "apps/web/dist");
console.log("🔍 Mencari index.html di dalam:", distPath);

const realIndexPath = findFile(distPath, "index.html");

if (realIndexPath) {
	console.log("✅ DITEMUKAN! File index.html ada di:", realIndexPath);
	// Gunakan realIndexPath ini untuk menyajikan file statis
} else {
	console.error("❌ TIDAK DITEMUKAN! Mari kita bongkar isi folder:");
	// Cetak struktur folder supaya kita tahu apa yang sebenarnya di-copy
	const execSync = require("node:child_process").execSync;
	try {
		console.log(execSync("find apps/web/dist -maxdepth 3").toString());
	} catch (error) {
		console.error("Gagal menjalankan perintah find");
	}
}

const frontendAssetsPath = distPath;
const frontendIndexPath = realIndexPath ?? path.resolve(distPath, "index.html");

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
