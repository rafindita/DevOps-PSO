import "../../test-setup";
import { describe, expect, mock, test } from "bun:test";

// Mock Link from TanStack Router
mock.module("@tanstack/react-router", () => ({
	Link: ({ children, to, className, onClick }: any) => (
		<a className={className} href={to} onClick={onClick}>
			{children}
		</a>
	),
}));

// Mock sessionStorage
const mockSessionStorage = {
	setItem: mock(),
	getItem: mock(),
};
(globalThis as any).sessionStorage = mockSessionStorage;

// Import after setup and mock
const { render } = require("@testing-library/react");
const { ResultCard } = require("./result-card");

const MOCK_PAPER = {
	id: "1",
	title: "Test Paper",
	abstract: "This is a test abstract.",
	authors: ["Author One", "Author Two"],
	publishedAt: "2021-01-01",
	journal: "Test Journal",
	doi: "10.1234/test",
	keywords: ["test"],
	sourceUrl: "https://example.com",
};

const TEST_JOURNAL_REGEX = /Test Journal/;

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

describe("ResultCard", () => {
	test("renders paper information correctly and saves state on click", () => {
		const queryClient = new QueryClient();
		const { getByText, getAllByRole } = render(
			<QueryClientProvider client={queryClient}>
				<ResultCard paper={MOCK_PAPER as any} />
			</QueryClientProvider>
		);

		expect(getByText("Test Paper")).toBeDefined();
		expect(getByText("Author One")).toBeDefined();
		expect(getByText("Author Two")).toBeDefined();
		expect(getByText(TEST_JOURNAL_REGEX)).toBeDefined();
		expect(getByText("View source")).toBeDefined();

		const links = getAllByRole("link");
		const { fireEvent } = require("@testing-library/react");
		fireEvent.click(links[0]);

		expect((globalThis as any).sessionStorage.setItem).toHaveBeenCalledWith(
			"lastSearchUrl",
			expect.any(String)
		);
	});
});
