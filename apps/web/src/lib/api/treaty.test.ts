import { describe, expect, test } from "bun:test";
import { api } from "./treaty";

describe("Treaty API Client", () => {
	test("should export the api client instance", () => {
		expect(api).toBeDefined();
	});
});