import fs from "node:fs";
import path from "node:path";
import { cors } from "@elysiajs/cors";
import { Elysia } from "elysia";
import { crawlerModule } from "./modules/crawler";
import {
	cleanupStuckJobs,
	startCrawlWorker,
	stopCrawlWorker,
} from "./modules/crawler/queue";
import { papersModule } from "./modules/papers";

const app = new Elysia()
	.onError(({ code, error, set }) => {
		if (code === "VALIDATION") {
			set.status = 400;
			return { error: error.message };
		}
		console.error("Server Error:", error);
		set.status = 500;
		return { error: "Internal Server Error" };
	})
	.use(
		cors({
			origin: true,
			methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
			allowedHeaders: ["Content-Type", "Authorization"],
		})
	)
	.use(crawlerModule)
	.use(papersModule)
	// ========================================================
	// 🔥 TRIK PROXY: Lempar sisa traffic ke TanStack Server! 
	// ========================================================
	.all("*", async ({ request }) => {
		const url = new URL(request.url);
		url.port = "3001";
		url.hostname = "127.0.0.1"; // Arahkan ke server Tanstack lokal
		
		const proxyReq = new Request(url.toString(), request);
		proxyReq.headers.delete("host"); // Hapus host agar TanStack tidak bingung
		
		return fetch(proxyReq);
	});

const PORT = Number(process.env.PORT) || 3000;
const server = app.listen(PORT);
console.log(`Server API (Elysia) berjalan di http://${server.hostname}:${server.port}`);

// ========================================================
// 🔥 NYALAKAN SERVER FRONTEND SECARA OTOMATIS
// ========================================================
if (process.env.NODE_ENV === "production") {
	const webServerPath = path.join(process.cwd(), "apps/web/dist/server/server.js");
	console.log("Menyalakan Frontend TanStack Start di port 3001:", webServerPath);

	// Meminta Bun menjalankan server.js buatan Tanstack di balik layar
	Bun.spawn(["bun", webServerPath], {
		env: { ...process.env, PORT: "3001" },
		stdout: "inherit",
		stderr: "inherit"
	});
}

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
