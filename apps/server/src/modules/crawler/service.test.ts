import { expect, test, describe, mock } from "bun:test";
import { startCrawl } from "./service";

// Mock the dependencies
mock.module("@scholar-seek/db", () => ({
  db: {
    insert: () => ({
      values: () => ({
        returning: () => Promise.resolve([{ id: "history-id", job_id: "job-id" }])
      })
    })
  }
}));

mock.module("./queue", () => ({
  getCrawlQueue: () => ({
    add: () => Promise.resolve({ id: "job-id" })
  })
}));

describe("Crawler Service", () => {
  test("startCrawl enqueues a job and returns IDs", async () => {
    const result = await startCrawl({
      source: "arxiv",
      categories: ["cs.LG"]
    });

    expect(result).toEqual({
      jobId: "job-id",
      historyId: "history-id"
    });
  });
});
