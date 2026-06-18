// @ts-expect-error - dist is only available after build
import handler from "./dist/server/server.js";

const PORT = 3001;

Bun.serve({
	port: PORT,
	hostname: "0.0.0.0",
	fetch(req) {
		const url = new URL(req.url);

		// Proxy API requests to backend
		if (url.pathname.startsWith("/api/")) {
			const targetUrl = process.env.VITE_SERVER_URL || "http://localhost:3000";
			const apiUrl = new URL(url.pathname + url.search, targetUrl);
			return fetch(new Request(apiUrl, req));
		}

		// Jika request mengarah ke folder assets, layani file statis
		if (url.pathname.startsWith("/assets/")) {
			return new Response(Bun.file(`./dist/client${url.pathname}`));
		}
		// Jika tidak, biarkan SSR menangani request
		return handler.fetch(req);
	},
});

console.log(`Web server running at http://0.0.0.0:${PORT}`);
