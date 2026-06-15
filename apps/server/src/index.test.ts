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

import { Elysia } from "elysia";

describe("Server basic tests", () => {
	test("Health check endpoint returns 200", async () => {
		const { app } = await import("./index");
		const response = await app.handle(new Request("http://localhost/health"));
		expect(response.status).toBe(200);
		const body = await response.json();
		expect(body).toEqual({ status: "ok" });
	});

	test("Non-existent route returns frontend index", async () => {
		const { app } = await import("./index");
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

		const testApp = new Elysia()
			.onError(({ code, error, set }) => {
				if (code === "VALIDATION") {
					set.status = 400;
					return { error: error.message };
				}
				console.error(error);
				set.status = 500;
				return { error: "Internal Server Error" };
			})
			.get("/trigger-error", () => {
				throw new Error("something went wrong");
			});

		const res = await testApp.handle(
			new Request("http://localhost/trigger-error")
		);
		const json = await res.json();

		expect(res.status).toBe(500);
		expect(json).toEqual({ error: "Internal Server Error" });

		consoleSpy.mockRestore();
	});
});