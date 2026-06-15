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
		from: mock(() => ({
			where: mock(() => ({
				limit: mock(() => Promise.resolve([])),
			})),
			orderBy: mock(() => ({
				limit: mock(() => Promise.resolve([])),
			})),
		})),
	})),
};

mock.module("@scholar-seek/db", () => ({
	db: mockDb,
}));

mock.module("./queue", () => ({
	getCrawlQueue: () => ({
		add: () => Promise.resolve({ id: "job-id" }),
	}),
}));

import { startCrawl, getCrawlStatus, getCrawlHistory } from "./service";

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
		mockDb.select.mockImplementationOnce(() => ({
			from: mock(() => ({
				where: mock(() => ({
					limit: mock(() => Promise.resolve([mockRow])),
				})),
			})),
		}));

		const status = await getCrawlStatus("j1");
		expect(status?.status).toBe("completed");
		expect(status?.papersFound).toBe(10);
	});

	test("getCrawlHistory returns history list", async () => {
		mockDb.select.mockImplementationOnce(() => ({
			from: mock(() => ({
				orderBy: mock(() => ({
					limit: mock(() => Promise.resolve([])),
				})),
			})),
		}));
		const history = await getCrawlHistory();
		expect(Array.isArray(history)).toBe(true);
	});
});
