import { describe, expect, mock, test } from "bun:test";

// Mock the dependencies
const mockDb = {
	insert: mock(() => ({
		values: mock(() => ({
			returning: mock(() =>
				Promise.resolve([{ id: "history-id", job_id: "job-id" }])
			),
		})),
	})),
	select: mock(() => ({
		from: mock(
			() =>
				({
					where: mock(() => ({
						limit: mock(() => Promise.resolve([])),
					})),
					orderBy: mock(() => ({
						limit: mock(() => Promise.resolve([])),
					})),
				}) as any
		),
	})),
};

mock.module("@scholar-seek/db", () => ({
	db: mockDb,
}));

mock.module("./queue", () => ({
	getCrawlQueue: () => ({
		add: () => Promise.resolve({ id: "job-id" }),
	}),
	processJob: mock(() => Promise.resolve()),
}));

import { getCrawlHistory, getCrawlStatus, startCrawl } from "./service";

describe("Crawler Service", () => {
	test("startCrawl enqueues a job and returns IDs", async () => {
		const result = await startCrawl({
			source: "arxiv",
			categories: ["cs.LG"],
		});

		expect(result).toEqual({
			jobId: "job-id",
			historyId: "history-id",
		});
	});

	test("getCrawlStatus returns status when row exists", async () => {
		const mockRow = {
			id: "h1",
			job_id: "j1",
			source: "arxiv",
			status: "completed",
			papers_found: 10,
			papers_inserted: 8,
			papers_skipped: 2,
			errors: [],
			started_at: new Date(),
			completed_at: new Date(),
			duration_ms: 1000,
		};
		mockDb.select.mockImplementationOnce(
			() =>
				({
					from: mock(() => ({
						where: mock(() => ({
							limit: mock(() => Promise.resolve([mockRow])),
						})),
					})),
				}) as any
		);

		const status = await getCrawlStatus("j1");
		expect(status?.status).toBe("completed");
		expect(status?.papersFound).toBe(10);
	});

	test("getCrawlHistory returns history list", async () => {
		mockDb.select.mockImplementationOnce(
			() =>
				({
					from: mock(() => ({
						orderBy: mock(() => ({
							limit: mock(() => Promise.resolve([])),
						})),
					})),
				}) as any
		);
		const history = await getCrawlHistory();
		expect(Array.isArray(history)).toBe(true);
	});

	test("startCrawl throws when DB returns no history row", async () => {
		mockDb.insert.mockImplementationOnce(() => ({
			values: mock(() => ({
				returning: mock(() => Promise.resolve([])),
			})),
		}));

		try {
			await startCrawl({ source: "arxiv" });
			expect(true).toBe(false);
		} catch (e: unknown) {
			expect((e as Error).message).toContain(
				"Failed to create crawl history record"
			);
		}
	});

	test("startCrawl handles queue addition or DB failure gracefully", async () => {
		mockDb.insert.mockImplementationOnce(() => ({
			values: mock(() => ({
				returning: mock(() => Promise.reject(new Error("DB Insert failed"))),
			})),
		}));

		try {
			await startCrawl({ source: "arxiv" });
			expect(true).toBe(false);
		} catch (e: unknown) {
			expect((e as Error).message).toBe("DB Insert failed");
		}
	});

	test("getCrawlStatus returns null when row does not exist", async () => {
		mockDb.select.mockImplementationOnce(
			() =>
				({
					from: mock(() => ({
						where: mock(() => ({
							limit: mock(() => Promise.resolve([])),
						})),
					})),
				}) as any
		);

		const status = await getCrawlStatus("unknown-j1");
		expect(status).toBeNull();
	});

	test("getLastUpdated returns stats", async () => {
		mockDb.select.mockImplementationOnce(
			() =>
				({
					from: mock(() => ({
						where: mock(() => ({
							orderBy: mock(() => ({
								limit: mock(() =>
									Promise.resolve([
										{
											completed_at: new Date(),
											papers_found: 10,
											papers_inserted: 10,
											papers_skipped: 0,
											duration_ms: 1000,
										},
									])
								),
							})),
						})),
					})),
				}) as any
		);

		const res = await (await import("./service")).getLastUpdated();
		expect(res?.papersFound).toBe(10);
	});

	test("getLastUpdated returns null when no rows", async () => {
		mockDb.select.mockImplementationOnce(
			() =>
				({
					from: mock(() => ({
						where: mock(() => ({
							orderBy: mock(() => ({
								limit: mock(() => Promise.resolve([])),
							})),
						})),
					})),
				}) as any
		);

		const res = await (await import("./service")).getLastUpdated();
		expect(res).toBeNull();
	});
});
