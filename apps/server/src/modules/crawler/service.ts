import { db } from "@scholar-seek/db";
import { crawlHistory } from "@scholar-seek/db/schema/crawl-history";
import { desc, eq } from "drizzle-orm";
import type { CrawlOptionsBodyType, CrawlStatusResponseType } from "./model";

export async function startCrawl(
	body: CrawlOptionsBodyType
): Promise<{ jobId: string; historyId: string }> {
	const source = body.source ?? "arxiv";
	const options = {
		since: body.since,
		until: body.until,
		categories: body.categories,
		maxRecords: body.maxRecords,
	};

	// Create history record up-front so the client can track progress immediately
	const [historyRow] = await db
		.insert(crawlHistory)
		.values({
			job_id: crypto.randomUUID(),
			source,
			status: "running",
			options,
		})
		.returning({ id: crawlHistory.id, job_id: crawlHistory.job_id });

	if (!historyRow) {
		throw new Error("Failed to create crawl history record");
	}

	// FORCE BYPASS QUEUE: Execute the job synchronously
	try {
		const { processJob } = await import("./queue");
		await processJob(historyRow.id, source, options);
	} catch (e: unknown) {
		console.error(
			`[CRAWLER WARNING] ${e instanceof Error ? e.message : String(e)}`
		);
		// Safe Mode: Return successfully so the frontend doesn't crash,
		// the database is already marked as 'failed' internally by processJob.
	}

	return { jobId: historyRow.job_id, historyId: historyRow.id };
}

export async function getCrawlStatus(
	jobId: string
): Promise<CrawlStatusResponseType | null> {
	// Look up by job_id in the DB (source of truth for completed/failed jobs)
	const rows = await db
		.select()
		.from(crawlHistory)
		.where(eq(crawlHistory.job_id, jobId))
		.limit(1);

	const row = rows[0];
	if (!row) {
		return null;
	}

	return {
		jobId,
		historyId: row.id,
		source: row.source,
		status: row.status,
		papersFound: row.papers_found,
		papersInserted: row.papers_inserted,
		papersSkipped: row.papers_skipped,
		errors: row.errors ?? [],
		startedAt: row.started_at.toISOString(),
		completedAt: row.completed_at?.toISOString() ?? null,
		durationMs: row.duration_ms,
	};
}

export async function getCrawlHistory(
	limit = 20
): Promise<CrawlStatusResponseType[]> {
	const rows = await db
		.select()
		.from(crawlHistory)
		.orderBy(desc(crawlHistory.started_at))
		.limit(Math.min(limit, 100));

	return rows.map((row) => ({
		jobId: row.job_id,
		historyId: row.id,
		source: row.source,
		status: row.status,
		papersFound: row.papers_found,
		papersInserted: row.papers_inserted,
		papersSkipped: row.papers_skipped,
		errors: row.errors ?? [],
		startedAt: row.started_at.toISOString(),
		completedAt: row.completed_at?.toISOString() ?? null,
		durationMs: row.duration_ms,
	}));
}

export async function getLastUpdated() {
	const rows = await db
		.select()
		.from(crawlHistory)
		.where(eq(crawlHistory.status, "completed"))
		.orderBy(desc(crawlHistory.completed_at))
		.limit(1);

	const row = rows[0];
	if (!row) {
		return null;
	}

	return {
		completedAt: row.completed_at?.toISOString() ?? null,
		papersFound: row.papers_found,
		papersInserted: row.papers_inserted,
		papersSkipped: row.papers_skipped,
		durationMs: row.duration_ms,
	};
}
