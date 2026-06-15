import { describe, expect, mock, test } from "bun:test";

// Mock DB with full chainable support
const chain: any = {
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

		chain.then.mockImplementationOnce((resolve: any) =>
			resolve([{ count: "1" }])
		);
		chain.then.mockImplementationOnce((resolve: any) => resolve(mockPapers));
		chain.then.mockImplementationOnce((resolve: any) => resolve(mockPapers));

		const result = await searchPapers({ q: "test", author: "A1" });

		expect(result.papers).toHaveLength(1);
		expect(result.facets.journals).toBeDefined();
	});

	test("searchPapers handles sorting and pagination", async () => {
		chain.then.mockImplementationOnce((resolve: any) =>
			resolve([{ count: "0" }])
		);
		chain.then.mockImplementationOnce((resolve: any) => resolve([]));
		chain.then.mockImplementationOnce((resolve: any) => resolve([]));

		await searchPapers({ page: 2, pageSize: 50, sortBy: "date_desc" });
		expect(chain.limit).toHaveBeenCalledWith(50);
	});

	test("searchPapers with journal and keyword filters (array params)", async () => {
		chain.then.mockImplementationOnce((resolve: any) =>
			resolve([{ count: "0" }])
		);
		chain.then.mockImplementationOnce((resolve: any) => resolve([]));
		chain.then.mockImplementationOnce((resolve: any) => resolve([]));

		await searchPapers({
			journal: ["Nature", "Science"],
			keyword: ["AI", "ML"],
			yearFrom: 2020,
			yearTo: 2023,
		});

		expect(chain.from).toHaveBeenCalled();
	});

	test("searchPapers with sortBy date_asc", async () => {
		chain.then.mockImplementationOnce((resolve: any) =>
			resolve([{ count: "0" }])
		);
		chain.then.mockImplementationOnce((resolve: any) => resolve([]));
		chain.then.mockImplementationOnce((resolve: any) => resolve([]));

		await searchPapers({ sortBy: "date_asc" });
		expect(chain.limit).toHaveBeenCalled();
	});

	test("searchPapers with sortBy title_asc", async () => {
		chain.then.mockImplementationOnce((resolve: any) =>
			resolve([{ count: "0" }])
		);
		chain.then.mockImplementationOnce((resolve: any) => resolve([]));
		chain.then.mockImplementationOnce((resolve: any) => resolve([]));

		await searchPapers({ sortBy: "title_asc" });
		expect(chain.limit).toHaveBeenCalled();
	});

	test("searchPapers with sortBy author_asc", async () => {
		chain.then.mockImplementationOnce((resolve: any) =>
			resolve([{ count: "0" }])
		);
		chain.then.mockImplementationOnce((resolve: any) => resolve([]));
		chain.then.mockImplementationOnce((resolve: any) => resolve([]));

		await searchPapers({ sortBy: "author_asc" });
		expect(chain.limit).toHaveBeenCalled();
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

	test("getPaper throws when not found", () => {
		chain.where.mockImplementationOnce(() => Promise.resolve([]));

		expect(getPaper("not-exist")).rejects.toThrow();
	});

	test("getRelatedPapers returns papers with similar keywords", async () => {
		const sourcePaper = { id: "1", keywords: ["AI"], authors: ["A1"] };
		const relatedPaper = {
			id: "2",
			title: "Related",
			keywords: ["AI"],
			authors: ["A2"],
		};

		chain.where.mockImplementationOnce(() => Promise.resolve([sourcePaper]));
		chain.limit.mockImplementationOnce(() => Promise.resolve([relatedPaper]));

		const result = await getRelatedPapers("1");
		expect(result).toHaveLength(1);
		expect(result[0]?.title).toBe("Related");
	});

	test("getRelatedPapers returns empty when source paper has no keywords", async () => {
		chain.where.mockImplementationOnce(() =>
			Promise.resolve([{ id: "1", keywords: null, authors: [] }])
		);

		const result = await getRelatedPapers("1");
		expect(result).toEqual([]);
	});

	test("getJournals returns list of journals", async () => {
		chain.orderBy.mockImplementationOnce(() =>
			Promise.resolve([{ journal: "Nature" }, { journal: "Science" }])
		);
		const result = await getJournals();
		expect(result).toEqual(["Nature", "Science"]);
	});
});