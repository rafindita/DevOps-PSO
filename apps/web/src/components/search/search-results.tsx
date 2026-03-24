import { Skeleton } from "@scholar-seek/ui/components/skeleton";
import { X } from "lucide-react";
import { createContext, type ReactNode, useContext, useState } from "react";
import { useSearchPapers } from "../../lib/hooks/use-papers";
import type { Facets, SortBy } from "../../types/paper";
import { FilterProvider, useFilterContext } from "./active-filters";
import { EmptyState } from "./empty-state";
import { FilterPanel } from "./filter-panel";
import { PageSizeSelector } from "./page-size-selector";
import { Pagination } from "./pagination";
import { ResultCard } from "./result-card";
import { SortDropdown } from "./sort-dropdown";

interface FacetsContextValue {
	facets: Facets | undefined;
	setFacets: (facets: Facets | undefined) => void;
}

const FacetsContext = createContext<FacetsContextValue>({
	facets: undefined,
	setFacets: () => {
		// default no-op
	},
});

function FacetsProvider({ children }: { children: ReactNode }) {
	const [facets, setFacets] = useState<Facets | undefined>(undefined);
	return (
		<FacetsContext.Provider value={{ facets, setFacets }}>
			{children}
		</FacetsContext.Provider>
	);
}

function useFacetsContext() {
	return useContext(FacetsContext);
}

function ActiveFiltersDisplay() {
	const {
		authorFilter,
		journalFilter,
		keywordFilter,
		yearFrom,
		yearTo,
		setAuthorFilter,
		setJournalFilter,
		setKeywordFilter,
		setYearRange,
		YEAR_MIN,
		YEAR_MAX,
	} = useFilterContext();

	const hasYearFilter = yearFrom !== YEAR_MIN || yearTo !== YEAR_MAX;
	const chips: { label: string; onRemove: () => void }[] = [];

	if (authorFilter) {
		chips.push({
			label: `Author: ${authorFilter}`,
			onRemove: () => setAuthorFilter(""),
		});
	}

	if (hasYearFilter) {
		chips.push({
			label: `Years: ${yearFrom}–${yearTo}`,
			onRemove: () => setYearRange(YEAR_MIN, YEAR_MAX),
		});
	}

	for (const journal of journalFilter) {
		chips.push({
			label: journal,
			onRemove: () =>
				setJournalFilter(journalFilter.filter((j) => j !== journal)),
		});
	}

	for (const keyword of keywordFilter) {
		chips.push({
			label: keyword,
			onRemove: () =>
				setKeywordFilter(keywordFilter.filter((k) => k !== keyword)),
		});
	}

	if (chips.length === 0) {
		return null;
	}

	return (
		<div className="flex flex-wrap gap-1.5">
			{chips.map((chip) => (
				<span
					className="inline-flex items-center gap-1 rounded-full border bg-muted px-2.5 py-0.5 text-muted-foreground text-xs"
					key={chip.label}
				>
					{chip.label}
					<button
						aria-label={`Remove filter: ${chip.label}`}
						className="ml-0.5 transition-colors hover:text-foreground"
						onClick={chip.onRemove}
						type="button"
					>
						<X className="h-3 w-3" />
					</button>
				</span>
			))}
		</div>
	);
}

function SkeletonItem() {
	return (
		<div className="space-y-3 rounded-lg border p-4">
			<Skeleton className="h-5 w-3/4" />
			<Skeleton className="h-4 w-full" />
			<Skeleton className="h-4 w-1/2" />
		</div>
	);
}

interface SearchResultsContentProps {
	onPageChange: (page: number) => void;
	onPageSizeChange: (size: number) => void;
	page: number;
	pageSize: number;
	query: string;
}

function SearchResultsContent({
	query,
	page,
	pageSize,
	onPageChange,
	onPageSizeChange,
}: SearchResultsContentProps) {
	const { setFacets } = useFacetsContext();
	const {
		authorFilter,
		journalFilter,
		keywordFilter,
		yearFrom,
		yearTo,
		sortBy,
		activeFilterCount,
		clearAllFilters,
		YEAR_MIN,
		YEAR_MAX,
	} = useFilterContext();

	const hasYearFilter = yearFrom !== YEAR_MIN || yearTo !== YEAR_MAX;

	const { data, isLoading, error } = useSearchPapers({
		q: query,
		page,
		pageSize,
		authorFilter: authorFilter || undefined,
		journalFilter: journalFilter.length > 0 ? journalFilter : undefined,
		keywordFilter: keywordFilter.length > 0 ? keywordFilter : undefined,
		yearFrom: hasYearFilter ? yearFrom : undefined,
		yearTo: hasYearFilter ? yearTo : undefined,
		sortBy,
	});

	// Update facets when data changes
	if (data?.facets) {
		setFacets(data.facets);
	}

	if (!query) {
		return (
			<p className="text-center text-muted-foreground">
				Enter a search term to find papers
			</p>
		);
	}

	if (isLoading) {
		return (
			<div className="grid gap-4">
				<SkeletonItem />
				<SkeletonItem />
				<SkeletonItem />
				<SkeletonItem />
				<SkeletonItem />
			</div>
		);
	}

	if (error) {
		return (
			<p className="text-center text-destructive">
				Error loading results. Please try again.
			</p>
		);
	}

	if (!data?.papers.length) {
		const hasActiveFilters = activeFilterCount > 0;
		return (
			<div className="space-y-4">
				<ActiveFiltersDisplay />
				<EmptyState
					hasActiveFilters={hasActiveFilters}
					onClearFilters={clearAllFilters}
					query={query}
				/>
			</div>
		);
	}

	const start = (page - 1) * pageSize + 1;
	const end = Math.min(page * pageSize, data.total);

	return (
		<div className="space-y-4">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<p className="text-muted-foreground text-sm">
					Showing {start}–{end} of {data.total} results
				</p>
				<div className="flex flex-wrap items-center gap-3">
					<PageSizeSelector
						onPageSizeChange={onPageSizeChange}
						pageSize={pageSize}
					/>
					<SortDropdown />
				</div>
			</div>

			<ActiveFiltersDisplay />

			<div className="grid gap-4">
				{data.papers.map((paper) => (
					<ResultCard key={paper.id} paper={paper} />
				))}
			</div>

			<div className="pt-2">
				<Pagination
					onPageChange={onPageChange}
					page={page}
					pageSize={pageSize}
					total={data.total}
				/>
			</div>
		</div>
	);
}

interface SearchResultsProps {
	facets?: Facets;
	initialFilters?: {
		authorFilter?: string;
		journalFilter?: string[];
		keywordFilter?: string[];
		yearFrom?: number;
		yearTo?: number;
		sortBy?: SortBy;
	};
	onPageChange: (page: number) => void;
	onPageSizeChange: (size: number) => void;
	page: number;
	pageSize: number;
	query: string;
}

export function SearchResults({
	query,
	page,
	pageSize,
	onPageChange,
	onPageSizeChange,
	initialFilters = {},
}: SearchResultsProps) {
	return (
		<FilterProvider search={initialFilters}>
			<FacetsProvider>
				<SearchResultsLayout
					onPageChange={onPageChange}
					onPageSizeChange={onPageSizeChange}
					page={page}
					pageSize={pageSize}
					query={query}
				/>
			</FacetsProvider>
		</FilterProvider>
	);
}

function SearchResultsLayout({
	query,
	page,
	pageSize,
	onPageChange,
	onPageSizeChange,
}: SearchResultsContentProps) {
	const { facets } = useFacetsContext();

	return (
		<div className="flex gap-6">
			<FilterPanel facets={facets} />

			<div className="min-w-0 flex-1">
				<SearchResultsContent
					onPageChange={onPageChange}
					onPageSizeChange={onPageSizeChange}
					page={page}
					pageSize={pageSize}
					query={query}
				/>
			</div>
		</div>
	);
}
