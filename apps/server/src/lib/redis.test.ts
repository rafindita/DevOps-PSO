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

mock.module("@scholar-seek/env/server", () => {
	return {
		env: {
			REDIS_URL: "redis://localhost:6379",
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
		const consoleSpy = spyOn(console, "warn").mockImplementation(
			() => undefined
		);

		const redis = getRedis();
		const fakeError = new Error("connection refused");
		(redis as unknown as { emit: (e: string, err: Error) => void }).emit(
			"error",
			fakeError
		);

		expect(consoleSpy).toHaveBeenCalledWith(
			"[Redis] Connection error (gracefully handled):",
			fakeError.message
		);

		// Also emit connect to cover the recovery branch
		const consoleInfoSpy = spyOn(console, "info").mockImplementation(
			() => undefined
		);
		(redis as unknown as { emit: (e: string) => void }).emit("connect");

		expect(consoleInfoSpy).toHaveBeenCalledWith("[Redis] Connection restored.");

		// Second connect should not log since hasLoggedError is false
		consoleInfoSpy.mockClear();
		(redis as unknown as { emit: (e: string) => void }).emit("connect");
		expect(consoleInfoSpy).not.toHaveBeenCalled();

		consoleInfoSpy.mockRestore();
		consoleSpy.mockRestore();
	});
});
