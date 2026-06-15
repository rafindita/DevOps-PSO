import { describe, expect, mock, test } from "bun:test";

// Mock BullMQ
mock.module("bullmq", () => {
	return {
		Queue: class MockQueue {
			constructor() {}
			add() {
				return Promise.resolve({ id: "job-1" });
			}
		},
		Worker: class MockWorker {
			constructor(name: string, processor: any) {}
			on() { return this; }
			close() {
				return Promise.resolve();
			}
		},
	};
});

// Mock redis
mock.module("../../lib/redis", () => ({
	getRedis: () => ({ on: () => {} }),
}));

// Mock DB
const chain = {
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

chain.limit.mockImplementation(() => Promise.resolve([{ started_at: new Date() }]));

const mockDb = {
	update: mock(() => chain),
	select: mock(() => chain),
	insert: mock(() => chain),
};

mock.module("@scholar-seek/db", () => ({
	db: mockDb,
}));

import { getCrawlQueue, cleanupStuckJobs, stopCrawlWorker, startCrawlWorker } from "./queue";

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
});
