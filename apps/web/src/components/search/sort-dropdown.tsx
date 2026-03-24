import type { SortBy } from "../../types/paper";
import { useFilterContext } from "./active-filters";

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
	{ value: "relevance", label: "Relevance" },
	{ value: "date_desc", label: "Date: Newest first" },
	{ value: "date_asc", label: "Date: Oldest first" },
	{ value: "title_asc", label: "Title: A–Z" },
	{ value: "author_asc", label: "Author: A–Z" },
];

export function SortDropdown() {
	const { sortBy, setSortBy } = useFilterContext();

	return (
		<div className="flex items-center gap-2 text-muted-foreground text-sm">
			<label className="shrink-0" htmlFor="sort-dropdown">
				Sort by
			</label>
			<select
				aria-label="Sort results"
				className="h-8 rounded-md border border-input bg-background px-2 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-ring"
				id="sort-dropdown"
				onChange={(e) => setSortBy(e.target.value as SortBy)}
				value={sortBy}
			>
				{SORT_OPTIONS.map((opt) => (
					<option key={opt.value} value={opt.value}>
						{opt.label}
					</option>
				))}
			</select>
		</div>
	);
}
