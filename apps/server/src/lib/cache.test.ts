import { beforeEach, describe, expect, mock, test } from "bun:test";

// Mock redis
const mockRedis = {
	get: mock(() => Promise.resolve(null)),
	set: mock(() => Promise.resolve("OK")),
	keys: mock(() => Promise.resolve([])),
	del: mock(() => Promise.resolve(0)),
	on: mock(() => {
		// intentional empty block for mock
	}),
};

mock.module("./redis", () => ({
	getRedis: () => mockRedis,
}));

import { cacheDel, cacheGet, cacheSet } from "./cache";

describe("Cache Lib", () => {
	beforeEach(() => {
		mockRedis.get.mockClear();
		mockRedis.set.mockClear();
		mockRedis.keys.mockClear();
		mockRedis.del.mockClear();
	});

	test("cacheGet returns parsed JSON when key exists", async () => {
		mockRedis.get.mockImplementation(() =>
			Promise.resolve(JSON.stringify({ foo: "bar" }))
		);
		const result = await cacheGet("test-key");
		expect(result).toEqual({ foo: "bar" });
		expect(mockRedis.get).toHaveBeenCalledWith("test-key");
	});

	test("cacheGet returns null when key does not exist", async () => {
		mockRedis.get.mockImplementation(() => Promise.resolve(null));
		const result = await cacheGet("missing-key");
		expect(result).toBeNull();
	});

	test("cacheSet sets value as JSON string with TTL", async () => {
		await cacheSet("test-key", { bar: "baz" }, 60);
		expect(mockRedis.set).toHaveBeenCalledWith(
			"test-key",
			JSON.stringify({ bar: "baz" }),
			"EX",
			60
		);
	});

	test("cacheDel deletes multiple keys when pattern matches", async () => {
		mockRedis.keys.mockImplementation(() => Promise.resolve(["key1", "key2"]));
		await cacheDel("pattern:*");
		expect(mockRedis.keys).toHaveBeenCalledWith("pattern:*");
		expect(mockRedis.del).toHaveBeenCalledWith("key1", "key2");
	});

	test("cacheDel does nothing when no keys match pattern", async () => {
		mockRedis.keys.mockImplementation(() => Promise.resolve([]));
		await cacheDel("pattern:*");
		expect(mockRedis.del).not.toHaveBeenCalled();
	});
});
