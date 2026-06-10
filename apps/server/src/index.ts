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
if (process.env.NODE_ENV === "production") {
    const possiblePaths = [
        "apps/web/dist/server/server.js",        // Lokasi 1
        "apps/web/.output/server/index.mjs",    // Lokasi 2 (TanStack Start biasa)
        "apps/web/.output/server/server.js",    // Lokasi 3
        "dist/server/server.js"                 // Lokasi 4
    ];

    const webServerPath = possiblePaths.find(p => fs.existsSync(p));

    if (!webServerPath) {
        console.error("FATAL: File server.js/index.mjs tidak ditemukan!");
        // Cetak isi folder untuk debug
        console.error("Isi folder apps/web:", fs.existsSync("apps/web") ? fs.readdirSync("apps/web") : "Folder apps/web tidak ada");
    } else {
        console.log("Menemukan Frontend TanStack di:", webServerPath);
        Bun.spawn(["bun", "run", webServerPath], {
            env: {
                ...process.env,
                PORT: "3001",
                NODE_PATH: "/app/node_modules"
            },
            stdout: "inherit",
            stderr: "inherit"
        });
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