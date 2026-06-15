import { describe, expect, mock, spyOn, test } from "bun:test";

// Mock ioredis
mock.module("ioredis", () => {
	return {
		default: class MockRedis {
			private handlers: Record<string, ((...args: unknown[]) => void)[]> = {};

			on(event: string, handler: (...args: unknown[]) => void) {
				if (!this.handlers[event]) {
					this.handlers[event] = [];
				}
				this.handlers[event].push(handler);
			}

			emit(event: string, ...args: unknown[]) {
				for (const handler of this.handlers[event] ?? []) {
					handler(...args);
				}
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

	test("logs error when redis emits error event", () => {
		const consoleSpy = spyOn(console, "error").mockImplementation(
			() => undefined
		);

		const redis = getRedis();
		const fakeError = new Error("connection refused");
		(redis as unknown as { emit: (e: string, err: Error) => void }).emit(
			"error",
			fakeError
		);

		expect(consoleSpy).toHaveBeenCalledWith(
			"[redis] connection error:",
			fakeError.message
		);

		consoleSpy.mockRestore();
	});
});
