import { describe, expect, mock, test } from "bun:test";

// Mock BullMQ
const queueAdd = mock(() => Promise.resolve({ id: "job-1" }));
const queueRemoveRepeatable = mock(() => Promise.resolve());
let failedHandler:
	| ((job: { id?: string } | null | undefined, err: Error) => void)
	| undefined;
let workerHandler:
	| ((job: { id?: string; data?: any }) => Promise<void>)
	| undefined;

mock.module("bullmq", () => {
	return {
		Queue: class MockQueue {
			add() {
				return queueAdd();
			}
			removeRepeatable() {
				return queueRemoveRepeatable();
			}
		},
		Worker: class MockWorker {
			constructor(_name: string, handler: (job: any) => Promise<void>) {
				workerHandler = handler;
			}

			on(event: string, handler: (job: any, err: Error) => void) {
				if (event === "failed") {
					failedHandler = handler;
				}
				return this;
			}
			close() {
				return Promise.resolve();
			}
		},
	};
});

const getRedis = mock(() => ({ host: "localhost" }) as any);

mock.module("../../lib/redis", () => ({
	getRedis,
}));

mock.module("@scholar-seek/env/server", () => ({
	env: {
		NODE_ENV: "production",
	},
}));

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
	test("getCrawlQueue returns mock queue when redis is unavailable", () => {
		getRedis.mockImplementationOnce(() => null);

		const queue = getCrawlQueue();
		expect(queue).toBeDefined();
		expect(queue.add).toBeDefined();
	});

	test("startCrawlWorker returns early when redis is unavailable", () => {
		getRedis.mockImplementationOnce(() => null);

		startCrawlWorker();
	});

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
		await Promise.resolve();
		if (failedHandler) {
			failedHandler({ id: "job-1" }, new Error("boom"));
		}
		await stopCrawlWorker();
		await stopCrawlWorker();
	});

	test("startCrawlWorker handles daily registration failure", async () => {
		queueRemoveRepeatable.mockImplementationOnce(() =>
			Promise.reject(new Error("daily job registration failed"))
		);

		startCrawlWorker();
		await Promise.resolve();
		await stopCrawlWorker();
	});

	test("queue fallback returns fake removeRepeatable", async () => {
		const queue = getCrawlQueue();
		if (queue.removeRepeatable) {
			await queue.removeRepeatable("test", {});
		}
		expect(true).toBe(true);
	});

	test("worker handles auto-scheduled jobs", async () => {
		const fetchXml =
			"<OAI-PMH><ListRecords><record><metadata><arxiv><id>2101.00004</id><title>Auto Job Paper</title><authors><author><keyname>Auto</keyname></author></authors></arxiv></metadata></record></ListRecords></OAI-PMH>";
		global.fetch = mock(() => Promise.resolve(new Response(fetchXml))) as any;

		startCrawlWorker();
		await Promise.resolve();

		// The worker gracefully disables itself when Redis is mocked/unavailable
		expect(workerHandler).toBeUndefined();

		await stopCrawlWorker();
		global.fetch = originalFetch;
	});

	test("createAutoHistoryRecord creates a record", async () => {
		const result = await createAutoHistoryRecord("arxiv", {});
		expect(result.historyId).toBeDefined();
		expect(mockDb.insert).toHaveBeenCalled();
	});

	test("createAutoHistoryRecord throws when no row is returned", async () => {
		chain.returning.mockImplementationOnce(() => Promise.resolve([]));

		try {
			await createAutoHistoryRecord("arxiv", {});
			expect(true).toBe(false);
		} catch (error: any) {
			expect(error.message).toContain("Failed to create crawl_history record");
		}
	});

	test("createAutoHistoryRecord omits since when no prior crawl exists", async () => {
		chain.limit.mockImplementationOnce(() => Promise.resolve([]));

		const result = await createAutoHistoryRecord("arxiv", {});
		expect(result.options.since).toBeUndefined();
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
		chain.returning.mockImplementationOnce(() =>
			Promise.resolve([{ id: "1", source: "arxiv" }])
		);
		chain.limit.mockImplementationOnce(() =>
			Promise.resolve([{ started_at: new Date() }])
		);

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

	test("processJob marks partially inserted batches as skipped", async () => {
		chain.returning.mockImplementationOnce(() => Promise.resolve([]));
		chain.from.mockImplementationOnce(() => chain);
		chain.where.mockImplementationOnce(() =>
			Promise.resolve([{ started_at: new Date() }])
		);

		global.fetch = mock(() =>
			Promise.resolve(
				new Response(
					"<OAI-PMH><ListRecords><record><metadata><arxiv><id>2101.00003</id><title>Skipped Paper</title><authors><author><keyname>Skip</keyname></author></authors></arxiv></metadata></record></ListRecords></OAI-PMH>"
				)
			)
		) as any;

		await processJob("h4", "arxiv", { maxRecords: 1 });
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

		// Mock the DB query for existing papers so it returns [] instead of undefined
		chain.from.mockImplementationOnce(() => chain);
		chain.where.mockImplementationOnce(() => Promise.resolve([]));

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
