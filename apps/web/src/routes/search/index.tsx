import {
	createFileRoute,
	useNavigate,
	useSearch,
} from "@tanstack/react-router";
import { z } from "zod";
import { SearchBar } from "../../components/search/search-bar";
import { SearchResults } from "../../components/search/search-results";

const searchSchema = z.object({
	q: z.string().optional(),
	page: z.coerce.number().optional().default(1),
	pageSize: z.coerce.number().optional().default(10),
});

export const Route = createFileRoute("/search/")({
	component: SearchPage,
	validateSearch: searchSchema,
	head: ({ search }) => ({
		meta: [
			{
				title: search.q
					? `Search results for "${search.q}" - Scholar Seek`
					: "Search Papers - Scholar Seek",
			},
			{
				name: "description",
				content: search.q
					? `Find academic papers and articles related to ${search.q}.`
					: "Search for academic papers, articles, and publications.",
			},
		],
	}),
});

function SearchPage() {
	const navigate = useNavigate();
	const { q = "", page = 1, pageSize = 10 } = useSearch({ from: "/search/" });

	const handleSearch = (query: string) => {
		navigate({
			to: "/search",
			search: { q: query, page: 1, pageSize },
		});
	};

	const handlePageChange = (newPage: number) => {
		navigate({
			to: "/search",
			search: { q, page: newPage, pageSize },
		});
	};

	const handlePageSizeChange = (newSize: number) => {
		navigate({
			to: "/search",
			search: { q, page: 1, pageSize: newSize },
		});
	};

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mb-8">
				<div className="relative rounded-lg border bg-background shadow-sm">
					<SearchBar defaultValue={q} onSearch={handleSearch} />
				</div>
			</div>
			<SearchResults
				onPageChange={handlePageChange}
				onPageSizeChange={handlePageSizeChange}
				page={page}
				pageSize={pageSize}
				query={q}
			/>
		</div>
	);
}
