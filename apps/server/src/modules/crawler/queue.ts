import { db } from "@scholar-seek/db";
import { crawlHistory } from "@scholar-seek/db/schema/crawl-history";
import { papers } from "@scholar-seek/db/schema/papers";
import { Queue, type Worker } from "bullmq";
import { desc, eq } from "drizzle-orm";
import { cacheDel } from "../../lib/cache";
import { getRedis } from "../../lib/redis";
import { arxivAdapter } from "./sources/arxiv";
import type { CrawlOptions, SourceAdapter } from "./sources/types";

export interface CrawlJobData {
	/** UUID of the crawl_history row. Created by the service before enqueuing. */
	historyId: string;
	options: CrawlOptions;
	source: string;
}

const QUEUE_NAME = "crawl-jobs";

const adapters: Record<string, SourceAdapter> = {
	arxiv: arxivAdapter,
};

let queue: Queue | null = null;

export function getCrawlQueue(): Queue<CrawlJobData> {
	if (!queue) {
		const redis = getRedis();
		if (!redis) {
			console.warn("[crawler] Redis connection unavailable. Using mock queue.");
			queue = {
				add: () => {
					console.log("[mock queue] Simulated job enqueue. Redis is offline.");
					return Promise.resolve({ id: "mock-job-id" });
				},
				removeRepeatable: () => undefined,
			} as unknown as Queue;
			return queue as unknown as Queue<CrawlJobData>;
		}
		const newQueue = new Queue(QUEUE_NAME, {
			connection: redis,
			defaultJobOptions: {
				attempts: 2,
				backoff: { type: "exponential", delay: 5000 },
				removeOnComplete: 200,
				removeOnFail: 100,
			},
		});

		newQueue.on("error", (err) => {
			console.warn(
				"[BullMQ] Queue connection error gracefully handled:",
				err.message
			);
		});

		queue = newQueue as unknown as Queue;
	}
	return queue as unknown as Queue<CrawlJobData>;
}

export async function processJob(
	historyId: string,
	source: string,
	options: CrawlOptions
): Promise<void> {
	const adapter = adapters[source];
	if (!adapter) {
		throw new Error(`Unknown source: ${source}`);
	}

	let papersFound = 0;
	let papersInserted = 0;
	let papersSkipped = 0;
	const errors: string[] = [];

	try {
		// 1. SMART DIFF PROBE: Pre-load all existing IDs into memory for O(1) lookup
		console.log(
			`[crawler] Executing Smart Diff Probe for source: ${source}...`
		);
		const allExisting = await db
			.select({ source_id: papers.source_id })
			.from(papers)
			.where(eq(papers.source, source));
		const existingSet = new Set(allExisting.map((p) => p.source_id));
		console.log(
			`[crawler] Probe complete: ${existingSet.size} existing papers cached in memory.`
		);

		for await (const batch of adapter.crawl(options)) {
			papersFound += batch.length;

			try {
				// 2. PRE-FILTERING
				const duplicates = batch.filter((p) =>
					existingSet.has(p.source_id ?? null)
				);
				const newPapers = batch.filter(
					(p) => !existingSet.has(p.source_id ?? null)
				);

				// 3. PERFORMANCE LOGGING
				console.log(
					`[CRAWLER] Found ${batch.length} total papers from source.`
				);
				console.log(
					`[CRAWLER] Found ${duplicates.length} duplicates, skipping.`
				);
				console.log(
					`[CRAWLER] Proceeding to insert ${newPapers.length} new papers.`
				);

				papersSkipped += duplicates.length;

				// Update memory set so we don't insert duplicates within the same run
				for (const p of newPapers) {
					existingSet.add(p.source_id ?? null);
				}

				if (newPapers.length > 0) {
					const result = await db
						.insert(papers)
						.values(newPapers)
						.returning({ id: papers.id });

					papersInserted += result.length;
				}
			} catch (err) {
				const msg = err instanceof Error ? err.message : String(err);
				errors.push(`Batch insert failed: ${msg}`);
				papersSkipped += batch.length;
			}

			// Update progress in DB periodically
			await db
				.update(crawlHistory)
				.set({
					papers_found: papersFound,
					papers_inserted: papersInserted,
					papers_skipped: papersSkipped,
				})
				.where(eq(crawlHistory.id, historyId));
		}

		const completedAt = new Date();
		const startedRow = await db
			.select({ started_at: crawlHistory.started_at })
			.from(crawlHistory)
			.where(eq(crawlHistory.id, historyId));

		const startedAt = startedRow[0]?.started_at ?? completedAt;
		const durationMs = completedAt.getTime() - startedAt.getTime();

		await db
			.update(crawlHistory)
			.set({
				status:
					errors.length > 0 && papersInserted === 0 ? "failed" : "completed",
				completed_at: completedAt,
				papers_found: papersFound,
				papers_inserted: papersInserted,
				papers_skipped: papersSkipped,
				errors: errors.length > 0 ? errors : null,
				duration_ms: durationMs,
			})
			.where(eq(crawlHistory.id, historyId));

		// Invalidate paper search/journals caches now that new data exists
		await cacheDel("papers:*");
		await cacheDel("journals:*");
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);

		await db
			.update(crawlHistory)
			.set({
				status: "failed",
				completed_at: new Date(),
				papers_found: papersFound,
				papers_inserted: papersInserted,
				papers_skipped: papersSkipped,
				errors: [...errors, msg],
			})
			.where(eq(crawlHistory.id, historyId));

		throw err;
	}
}

async function getLastSuccessfulCrawlDate(
	source: string
): Promise<string | undefined> {
	const rows = await db
		.select({ completed_at: crawlHistory.completed_at })
		.from(crawlHistory)
		.where(eq(crawlHistory.source, source))
		.orderBy(desc(crawlHistory.started_at))
		.limit(1);

	const date = rows[0]?.completed_at;
	if (!date) {
		return undefined;
	}
	return date.toISOString().slice(0, 10);
}

/**
 * On startup, any crawl_history row still in "running" status means the server
 * was killed mid-crawl. Mark them failed so they don't appear stuck forever.
 */
export async function cleanupStuckJobs(): Promise<void> {
	const stuck = await db
		.update(crawlHistory)
		.set({
			status: "failed",
			completed_at: new Date(),
			errors: ["Server stopped unexpectedly — crawl was interrupted"],
		})
		.where(eq(crawlHistory.status, "running"))
		.returning({ id: crawlHistory.id, source: crawlHistory.source });

	if (stuck.length > 0) {
		console.warn(
			`[crawler] marked ${stuck.length} interrupted job(s) as failed:`,
			stuck.map((r) => r.id).join(", ")
		);
	}
}

let worker: Worker | null = null;

export async function stopCrawlWorker(): Promise<void> {
	if (!worker) {
		return;
	}
	console.log(
		"[crawler] shutting down worker — waiting for current batch to finish..."
	);
	await worker.close();
	worker = null;
	console.log("[crawler] worker stopped");
}

export function startCrawlWorker(): void {
	console.log(
		"[crawler] Worker initialization FORCEFULLY DISABLED. Running in sync mode."
	);
}

/**
 * Called by the auto-scheduled worker before processJob when historyId === "__auto__".
 * Creates a fresh crawl_history row using the last successful crawl date as `since`.
 */
export async function createAutoHistoryRecord(
	source: string,
	options: CrawlOptions
): Promise<{ historyId: string; options: CrawlOptions }> {
	const since = await getLastSuccessfulCrawlDate(source);
	const resolvedOptions: CrawlOptions = { ...options, since };

	const [row] = await db
		.insert(crawlHistory)
		.values({
			job_id: crypto.randomUUID(),
			source,
			status: "running",
			options: resolvedOptions,
		})
		.returning({ id: crawlHistory.id });

	if (!row) {
		throw new Error("Failed to create crawl_history record");
	}
	return { historyId: row.id, options: resolvedOptions };
}
