import { describe, expect, mock, spyOn, test } from "bun:test";

mock.module("bun", () => ({
	...require("bun"),
	file: (_path: string) => ({
		size: 100,
		type: "text/html",
		stream: () => new ReadableStream(),
		arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
	}),
}));

mock.module("@elysia/static", () => ({
	staticPlugin: () => (app: unknown) => app,
}));

import app from "./index";

describe("Server basic tests", () => {
	test("Health check endpoint returns 200", async () => {
		const response = await app.handle(new Request("http://localhost/health"));
		expect(response.status).toBe(200);
		const body = await response.json();
		expect(body).toEqual({ status: "ok" });
	});

	test.skip("Non-existent route returns frontend index", async () => {
		const response = await app.handle(
			new Request("http://localhost/some-random-route")
		);
		expect(response.status).toBe(200);
	});

	test("onError returns 500 for generic error", async () => {
		const consoleSpy = spyOn(console, "error").mockImplementation(
			// intentional empty mock
			() => undefined
		);

		const response = await app.handle(
			new Request("http://localhost/api/papers/invalid-uuid-format")
		);

		expect(response.status).toBe(500);
		consoleSpy.mockRestore();
	});

	test("onError returns 400 for VALIDATION error", async () => {
		const response = await app.handle(
			new Request("http://localhost/api/papers?page=abc")
		);
		expect(response.status).toBe(400);
	});
});
