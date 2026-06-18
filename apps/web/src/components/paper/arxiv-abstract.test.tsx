import "../../test-setup";
import { describe, expect, test } from "bun:test";
import { render } from "@testing-library/react";
import { ArxivAbstract } from "./arxiv-abstract";

describe("ArxivAbstract", () => {
	test("renders plain text", () => {
		const { container } = render(<ArxivAbstract text="Hello World" />);
		expect(container.textContent).toContain("Hello World");
	});

	test("renders math formulas", () => {
		const { container } = render(<ArxivAbstract text="Math: $\alpha$" />);
		expect(container.innerHTML).toContain("Math:");
		// KaTeX generates a lot of HTML, just verify it didn't crash and text is there
		expect(container.textContent).toContain("α");
	});
});
