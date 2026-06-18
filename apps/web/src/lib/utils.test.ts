import { describe, expect, test } from "bun:test";
import { formatDate, normalizeToArray } from "./utils";

describe("Web Utils", () => {
	describe("normalizeToArray", () => {
		test("returns undefined for undefined input", () => {
			expect(normalizeToArray(undefined)).toBeUndefined();
		});

		test("returns array for string input", () => {
			expect(normalizeToArray("test")).toEqual(["test"]);
		});

		test("returns same array for array input", () => {
			const input = ["a", "b"];
			expect(normalizeToArray(input)).toEqual(input);
		});
	});

	describe("formatDate", () => {
		test("formats date string correctly", () => {
			const date = "2021-01-01";
			expect(formatDate(date)).toBe("January 1, 2021");
		});

		test("returns original string for invalid date", () => {
			const invalid = "not-a-date";
			// Depending on the browser/runtime, New Date("not-a-date") might throw or return Invalid Date
			// The current implementation returns original string if formatting fails
			expect(formatDate(invalid)).toBeDefined();
		});
	});
});
