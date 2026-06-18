import { describe, expect, mock, test } from "bun:test";
import { Elysia } from "elysia";
import { crawlerModule } from "./index";

// Mock service
mock.module("./service", () => ({
	startCrawl: mock(() => Promise.resolve({ jobId: "j1", historyId: "h1" })),
	getCrawlStatus: mock(() =>
		Promise.resolve({
			jobId: "1",
			historyId: "h1",
			source: "arxiv",
			status: "running",
			papersFound: 0,
			papersInserted: 0,
			papersSkipped: 0,
			errors: [],
			startedAt: new Date().toISOString(),
			completedAt: null,
			durationMs: null,
		})
	),
	getCrawlHistory: mock(() => Promise.resolve([])),
}));

describe("Crawler Routes", () => {
	const app = new Elysia().use(crawlerModule);

	test("POST /api/crawl/start starts a crawl", async () => {
		const req = new Request("http://localhost/api/crawl/start", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ source: "arxiv" }),
		});
		const res = await app.handle(req);
		expect(res.status).toBe(200);
	});

	test("GET /api/crawl/status/:jobId returns status", async () => {
		const req = new Request("http://localhost/api/crawl/status/1");
		const res = await app.handle(req);
		expect(res.status).toBe(200);
	});

	test("GET /api/crawl/history returns history", async () => {
		const req = new Request("http://localhost/api/crawl/history");
		const res = await app.handle(req);
		expect(res.status).toBe(200);
	});
});
