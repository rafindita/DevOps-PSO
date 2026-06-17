import { cors } from "@elysiajs/cors";
import { Elysia } from "elysia";
import { authModule } from "./modules/auth";
import { bookmarksModule } from "./modules/bookmarks";
import { crawlerModule } from "./modules/crawler";
import { papersModule } from "./modules/papers";

// Inisialisasi aplikasi Elysia
const app = new Elysia()
  .use(
    cors({
      // Ganti dengan IP publik Azure Anda atau domain yang digunakan
      origin: ["http://20.2.93.106:3001", "http://localhost:3001"],
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    })
  )
  .use(authModule)
  .use(bookmarksModule)
  .use(crawlerModule)
  .use(papersModule)
  .get("/health", () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
  }));

// Konfigurasi Port
const PORT = Number(process.env.PORT) || 3000;

/**
 * Karena kita berjalan di VM (bukan Serverless),
 * kita WAJIB memanggil .listen() agar server aktif.
 */
app.listen({ port: PORT, hostname: "0.0.0.0" }, (server) => {
  console.log(
    `API Server running at http://${server?.hostname}:${server?.port}`
  );
});

export default app;
