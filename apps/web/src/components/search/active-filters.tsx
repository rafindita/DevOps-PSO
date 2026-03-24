import {
	createContext,
	type ReactNode,
	useContext,
	useMemo,
	useState,
} from "react";
import type { SortBy } from "../../types/paper";

interface FilterContextValue {
	activeFilterCount: number;
	authorFilter: string;
	clearAllFilters: () => void;
	journalFilter: string[];
	keywordFilter: string[];
	setAuthorFilter: (value: string) => void;
	setJournalFilter: (values: string[]) => void;
	setKeywordFilter: (values: string[]) => void;
	setSortBy: (value: SortBy) => void;
	setYearRange: (from: number, to: number) => void;
	sortBy: SortBy;
	YEAR_MAX: number;
	YEAR_MIN: number;
	yearFrom: number;
	yearTo: number;
}

const FilterContext = createContext<FilterContextValue | null>(null);

export function useFilterContext() {
	const context = useContext(FilterContext);
	if (!context) {
		throw new Error("useFilterContext must be used within FilterProvider");
	}
	return context;
}

interface FilterProviderProps {
	children: ReactNode;
	search: {
		authorFilter?: string;
		journalFilter?: string[];
		keywordFilter?: string[];
		yearFrom?: number;
		yearTo?: number;
		sortBy?: SortBy;
	};
}

const YEAR_MIN = 1990;
const YEAR_MAX = new Date().getFullYear();

export function FilterProvider({ children, search }: FilterProviderProps) {
	const [authorFilter, setAuthorFilter] = useState(search.authorFilter ?? "");
	const [journalFilter, setJournalFilter] = useState(
		search.journalFilter ?? []
	);
	const [keywordFilter, setKeywordFilter] = useState(
		search.keywordFilter ?? []
	);
	const [yearFrom, setYearFrom] = useState(search.yearFrom ?? YEAR_MIN);
	const [yearTo, setYearTo] = useState(search.yearTo ?? YEAR_MAX);
	const [sortBy, setSortBy] = useState<SortBy>(search.sortBy ?? "relevance");

	const activeFilterCount = useMemo(() => {
		let count = 0;
		if (authorFilter) {
			count++;
		}
		if (yearFrom !== YEAR_MIN || yearTo !== YEAR_MAX) {
			count++;
		}
		count += journalFilter.length;
		count += keywordFilter.length;
		return count;
	}, [authorFilter, journalFilter, keywordFilter, yearFrom, yearTo]);

	function setYearRange(from: number, to: number) {
		setYearFrom(from);
		setYearTo(to);
	}

	function clearAllFilters() {
		setAuthorFilter("");
		setJournalFilter([]);
		setKeywordFilter([]);
		setYearRange(YEAR_MIN, YEAR_MAX);
	}

	const value: FilterContextValue = {
		authorFilter,
		journalFilter,
		keywordFilter,
		yearFrom,
		yearTo,
		sortBy,
		activeFilterCount,
		setAuthorFilter,
		setJournalFilter,
		setKeywordFilter,
		setYearRange,
		setSortBy,
		clearAllFilters,
		YEAR_MIN,
		YEAR_MAX,
	};

	return (
		<FilterContext.Provider value={value}>{children}</FilterContext.Provider>
	);
}

export { FilterContext };
