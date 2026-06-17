import handler from "./dist/server/server.js";

const PORT = 3001;

Bun.serve({
  port: PORT,
  hostname: "0.0.0.0",
  fetch(req) {
    const url = new URL(req.url);
    // Jika request mengarah ke folder assets, layani file statis
    if (url.pathname.startsWith("/assets/")) {
      return new Response(Bun.file(`./dist/client${url.pathname}`));
    }
    // Jika tidak, biarkan SSR menangani request
    return handler.fetch(req);
  },
});

console.log(`Web server running at http://0.0.0.0:${PORT}`);
