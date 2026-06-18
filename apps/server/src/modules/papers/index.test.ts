import { describe, expect, mock, test } from "bun:test";
import { Elysia } from "elysia";
import { papersModule } from "./index";

const mockPaper = {
	id: "1",
	title: "Test",
	abstract: "Abstract",
	authors: ["Author"],
	publishedAt: new Date().toISOString(),
	journal: "Journal",
	doi: "10.0/1",
	keywords: ["K1"],
	sourceUrl: "https://arxiv.org/abs/1",
};

// Mock service
mock.module("./service", () => ({
	searchPapers: mock(() =>
		Promise.resolve({
			total: 0,
			page: 1,
			pageSize: 10,
			papers: [],
			facets: { journals: [], keywords: [], authors: [], years: [] },
		})
	),
	getPaper: mock(() => Promise.resolve(mockPaper)),
	getRelatedPapers: mock(() => Promise.resolve([mockPaper])),
	getJournals: mock(() => Promise.resolve(["Nature"])),
}));

describe("Papers Routes", () => {
	const app = new Elysia().use(papersModule);

	test("GET /api/papers returns search results", async () => {
		const req = new Request("http://localhost/api/papers?q=test");
		const res = await app.handle(req);
		expect(res.status).toBe(200);
	});

	test("GET /api/papers/:id returns a paper", async () => {
		const req = new Request("http://localhost/api/papers/1");
		const res = await app.handle(req);
		expect(res.status).toBe(200);
	});

	test("GET /api/papers/:id/related returns related papers", async () => {
		const req = new Request("http://localhost/api/papers/1/related");
		const res = await app.handle(req);
		expect(res.status).toBe(200);
	});

	test("GET /api/journals returns journals", async () => {
		const req = new Request("http://localhost/api/journals");
		const res = await app.handle(req);
		expect(res.status).toBe(200);
	});
});
