import { describe, expect, mock, test } from "bun:test";

// Mock BullMQ
mock.module("bullmq", () => {
	return {
		Queue: class MockQueue {
			add() {
				return Promise.resolve({ id: "job-1" });
			}
			removeRepeatable() {
				return Promise.resolve();
			}
		},
		Worker: class MockWorker {
			on() {
				return this;
			}
			close() {
				return Promise.resolve();
			}
		},
	};
});

// Mock cache
mock.module("../../lib/cache", () => ({
	cacheDel: () => Promise.resolve(),
	cacheSet: () => Promise.resolve(),
	cacheGet: () => Promise.resolve(null),
}));

// Mock DB
const chain: any = {
	set: mock(() => chain),
	where: mock(() => chain),
	returning: mock(() => Promise.resolve([{ id: "1", source: "arxiv" }])),
	orderBy: mock(() => chain),
	limit: mock(() => chain),
	select: mock(() => chain),
	insert: mock(() => chain),
	values: mock(() => chain),
	onConflictDoUpdate: mock(() => chain),
	from: mock(() => chain),
};

chain.limit.mockImplementation(() =>
	Promise.resolve([{ started_at: new Date(), completed_at: new Date() }])
);

const mockDb = {
	update: mock(() => chain),
	select: mock(() => chain),
	insert: mock(() => chain),
};

mock.module("@scholar-seek/db", () => ({
	db: mockDb,
}));

const originalFetch = global.fetch;

import {
	cleanupStuckJobs,
	createAutoHistoryRecord,
	getCrawlQueue,
	processJob,
	startCrawlWorker,
	stopCrawlWorker,
} from "./queue";

describe("Crawler Queue", () => {
	test("getCrawlQueue returns a queue", () => {
		const queue = getCrawlQueue();
		expect(queue).toBeDefined();
	});

	test("cleanupStuckJobs updates running jobs to failed", async () => {
		await cleanupStuckJobs();
		expect(mockDb.update).toHaveBeenCalled();
	});

	test("start/stop worker", async () => {
		startCrawlWorker();
		await stopCrawlWorker();
	});

	test("createAutoHistoryRecord creates a record", async () => {
		const result = await createAutoHistoryRecord("arxiv", {});
		expect(result.historyId).toBeDefined();
		expect(mockDb.insert).toHaveBeenCalled();
	});

	test("processJob crawls and updates DB successfully", async () => {
		global.fetch = mock(() =>
			Promise.resolve(
				new Response(
					"<OAI-PMH><ListRecords><record><metadata><arxiv><id>2101.00001</id><title>Test Title</title><authors><author><keyname>Author</keyname><forenames>A</forenames></author></authors></arxiv></metadata></record></ListRecords></OAI-PMH>"
				)
			)
		) as any;

		chain.from.mockImplementationOnce(() => chain);
		chain.where.mockImplementationOnce(() =>
			Promise.resolve([{ started_at: new Date() }])
		);

		await processJob("h1", "arxiv", { maxRecords: 1 });

		expect(mockDb.insert).toHaveBeenCalled();
		expect(mockDb.update).toHaveBeenCalled();

		global.fetch = originalFetch;
	});

	test("processJob handles DB insert errors without crashing", async () => {
		global.fetch = mock(() =>
			Promise.resolve(
				new Response(
					"<OAI-PMH><ListRecords><record><metadata><arxiv><id>2101.00002</id><title>Error Paper</title><authors><author><keyname>Error</keyname></author></authors></arxiv></metadata></record></ListRecords></OAI-PMH>"
				)
			)
		) as any;

		// Mock insert to throw
		chain.returning.mockImplementationOnce(() =>
			Promise.reject(new Error("DB Insert failed"))
		);
		chain.from.mockImplementationOnce(() => chain);
		chain.where.mockImplementationOnce(() =>
			Promise.resolve([{ started_at: new Date() }])
		);

		await processJob("h2", "arxiv", { maxRecords: 1 });
		// Should not throw, should capture error
		expect(mockDb.update).toHaveBeenCalled();

		global.fetch = originalFetch;
	});

	test("processJob throws on adapter error", async () => {
		// Mock fetch to return an OAI-PMH error which throws immediately in the adapter
		global.fetch = mock(() =>
			Promise.resolve(
				new Response(
					'<OAI-PMH><error code="badArgument">Network Error</error></OAI-PMH>'
				)
			)
		) as any;

		try {
			await processJob("h3", "arxiv", { maxRecords: 1 });
			expect(true).toBe(false);
		} catch (e: any) {
			expect(e.message).toContain("Network Error");
		}

		global.fetch = originalFetch;
	});

	test("processJob handles unknown source", async () => {
		try {
			await processJob("h1", "unknown", {});
			expect(true).toBe(false);
		} catch (e: any) {
			expect(e.message).toContain("Unknown source");
		}
	});
});
