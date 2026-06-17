import { cors } from "@elysiajs/cors";
import { Elysia } from "elysia";
import { authModule } from "./modules/auth";
import { bookmarksModule } from "./modules/bookmarks";
import { crawlerModule } from "./modules/crawler";
import { papersModule } from "./modules/papers";

const app = new Elysia()
    .use(cors())
    .use(authModule)
    .use(bookmarksModule)
    .use(crawlerModule)
    .use(papersModule)
    .get("/health", () => ({ status: "ok" }));

const PORT = Number(process.env.PORT) || 3000;

// Logika perbaikan: Hanya jalankan .listen() jika bukan dalam mode production
// Mode production di Bun biasanya menggunakan export default untuk di-serve oleh runner
if (process.env.NODE_ENV !== "production") {
    app.listen({ port: PORT, hostname: "0.0.0.0" }, (server) => {
        console.log(`API Server running at http://${server?.hostname}:${server?.port}`);
    });
}

export default app;
