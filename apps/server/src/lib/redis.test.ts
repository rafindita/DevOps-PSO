import { describe, expect, mock, test } from "bun:test";

// Mock ioredis
mock.module("ioredis", () => {
	return {
		default: class MockRedis {
			on() {
				// intentional empty block for mock
			}
		},
	};
});

import { getRedis } from "./redis";

describe("Redis Lib", () => {
	test("getRedis returns a redis client", () => {
		const redis = getRedis();
		expect(redis).toBeDefined();
		expect(redis).not.toBeNull();
	});

	test("getRedis returns the same client on subsequent calls", () => {
		const redis1 = getRedis();
		const redis2 = getRedis();
		expect(redis1).toBe(redis2);
	});
});
