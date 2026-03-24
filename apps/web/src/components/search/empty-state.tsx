import { FileSearch } from "lucide-react";

interface EmptyStateProps {
	hasActiveFilters: boolean;
	onClearFilters?: () => void;
	query: string;
}

export function EmptyState({
	query,
	hasActiveFilters,
	onClearFilters,
}: EmptyStateProps) {
	return (
		<div className="flex flex-col items-center justify-center py-16 text-center">
			<div className="mb-6 rounded-full bg-muted p-6">
				<FileSearch className="h-12 w-12 text-muted-foreground" />
			</div>
			<h3 className="mb-2 font-semibold text-lg">No results found</h3>
			<p className="mb-4 max-w-sm text-muted-foreground text-sm">
				We couldn&apos;t find any papers matching &ldquo;{query}&rdquo;
			</p>
			{hasActiveFilters && onClearFilters && (
				<button
					className="text-primary text-sm hover:underline"
					onClick={onClearFilters}
					type="button"
				>
					Clear all filters
				</button>
			)}
			{!hasActiveFilters && (
				<p className="text-muted-foreground text-sm">
					Try different keywords or check your spelling
				</p>
			)}
		</div>
	);
}
