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
        console.error(error);
        set.status = 500;
        return { error: "Internal Server Error" };
    })
    .use(cors({ origin: true }))
    .use(crawlerModule)
    .use(papersModule)
    // 🔥 PROXY KE TANSTACK START:
    // Apapun yang tidak ditangani oleh Elysia (API), lempar ke Port 3001
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

// 🔥 NYALAKAN SERVER FRONTEND DI PORT 3001
if (process.env.NODE_ENV === "production") {
    const webServerPath = "apps/web/dist/server/server.js";
    console.log("Menyalakan Frontend TanStack di port 3001...");
    Bun.spawn(["bun", webServerPath], {
        env: { ...process.env, PORT: "3001" },
        stdout: "inherit",
        stderr: "inherit"
    });
}