import { describe, expect, mock, test } from "bun:test";

// Mock DB with full chainable support
const chain = {
	from: mock(() => chain),
	where: mock(() => chain),
	orderBy: mock(() => chain),
	limit: mock(() => chain),
	offset: mock(() => chain),
	// biome-ignore lint/suspicious/noThenProperty: required for mock chain
	then: mock((onFulfilled) => Promise.resolve([]).then(onFulfilled)),
	selectDistinct: mock(() => chain),
};

const mockDb = {
	select: mock(() => chain),
	selectDistinct: mock(() => chain),
	count: mock(() => ({ count: 1 })),
};

mock.module("@scholar-seek/db", () => ({
	db: mockDb,
}));

// Mock cache
mock.module("../../lib/cache", () => ({
	cacheGet: mock(() => Promise.resolve(null)),
	cacheSet: mock(() => Promise.resolve()),
}));

import {
	getJournals,
	getPaper,
	getRelatedPapers,
	searchPapers,
} from "./service";

describe("Papers Service", () => {
	test("searchPapers returns results with facets", async () => {
		const mockPapers = [
			{
				id: "1",
				title: "Paper 1",
				authors: ["A1"],
				journal: "J1",
				keywords: ["K1"],
				published_at: new Date("2023-01-01"),
			},
		];

		// 1. Count query
		chain.then.mockImplementationOnce((resolve) => resolve([{ count: "1" }]));
		// 2. Main query
		chain.then.mockImplementationOnce((resolve) => resolve(mockPapers));
		// 3. Facets query
		chain.then.mockImplementationOnce((resolve) => resolve(mockPapers));

		const result = await searchPapers({ q: "test", author: "A1" });

		expect(result.papers).toHaveLength(1);
		expect(result.facets.journals).toBeDefined();
	});

	test("searchPapers handles sorting and pagination", async () => {
		chain.then.mockImplementationOnce((resolve) => resolve([{ count: "0" }]));
		chain.then.mockImplementationOnce((resolve) => resolve([]));
		chain.then.mockImplementationOnce((resolve) => resolve([]));

		await searchPapers({ page: 2, pageSize: 50, sortBy: "date_desc" });
		expect(chain.limit).toHaveBeenCalledWith(50);
	});

	test("getPaper returns paper when found", async () => {
		const mockPaper = {
			id: "1",
			title: "Test Paper",
			authors: ["Author 1"],
			published_at: new Date(),
		};
		chain.where.mockImplementationOnce(() => Promise.resolve([mockPaper]));
		const result = await getPaper("1");
		expect(result?.title).toBe("Test Paper");
	});

	test("getRelatedPapers returns papers with similar keywords", async () => {
		const sourcePaper = { id: "1", keywords: ["AI"], authors: ["A1"] };
		const relatedPaper = {
			id: "2",
			title: "Related",
			keywords: ["AI"],
			authors: ["A2"],
		};

		// 1. Get source paper
		chain.where.mockImplementationOnce(() => Promise.resolve([sourcePaper]));
		// 2. Get related papers
		chain.limit.mockImplementationOnce(() => Promise.resolve([relatedPaper]));

		const result = await getRelatedPapers("1");
		expect(result).toHaveLength(1);
		expect(result[0].title).toBe("Related");
	});

	test("getJournals returns list of journals", async () => {
		chain.orderBy.mockImplementationOnce(() =>
			Promise.resolve([{ journal: "Nature" }, { journal: "Science" }])
		);
		const result = await getJournals();
		expect(result).toEqual(["Nature", "Science"]);
	});
});
