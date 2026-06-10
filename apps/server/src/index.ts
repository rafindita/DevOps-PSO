import { cors } from "@elysiajs/cors";
import { Elysia } from "elysia";
import { crawlerModule } from "./modules/crawler";
import {
    cleanupStuckJobs,
    startCrawlWorker,
    stopCrawlWorker,
} from "./modules/crawler/queue";
import { papersModule } from "./modules/papers";
import fs from "node:fs";
import path from "node:path";

const app = new Elysia()
    .onError(({ code, error, set }) => {
        console.error("Elysia Error:", error);
        set.status = 500;
        return { error: "Internal Server Error" };
    })
    .use(cors({ origin: true }))
    .use(crawlerModule)
    .use(papersModule)
    // Proxy semua traffic ke TanStack (Port 3001)
    .all("*", async ({ request }) => {
        const url = new URL(request.url);
        url.port = "3001";
        url.hostname = "127.0.0.1";

        const proxyReq = new Request(url.toString(), request);
        proxyReq.headers.delete("host");

        return fetch(proxyReq);
    });

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => {
    console.log(`Server API (Elysia) berjalan di port ${PORT}`);
});

// 🔥 DETEKSI LOKASI SERVER.JS SECARA OTOMATIS
// Ganti bagian ini di index.ts
if (process.env.NODE_ENV === "production") {
    // TanStack Start/Vinxi biasanya meletakkan server di sini:
    const webServerPath = "apps/web/.output/server/index.mjs";

    if (fs.existsSync(webServerPath)) {
        console.log("Menemukan Frontend di:", webServerPath);
        Bun.spawn(["bun", "run", webServerPath], {
            env: { ...process.env, PORT: "3001" },
            stdout: "inherit",
            stderr: "inherit"
        });
    } else {
        // Jika tidak ada di .output, maka file server.js mungkin tidak ter-build
        console.error("GAGAL: File server tidak ditemukan di .output/server/index.mjs");
        process.exit(1);
    }
}

// Crawler setup
if (process.env.ENABLE_CRAWLER === "true") {
    try {
        startCrawlWorker();
    } catch (e) { console.error(e); }
}

process.on("SIGINT", async () => {
    await app.stop();
    process.exit(0);
});