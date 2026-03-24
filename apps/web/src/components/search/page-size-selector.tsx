const PAGE_SIZES = [10, 25, 50];

interface PageSizeSelectorProps {
	onPageSizeChange: (size: number) => void;
	pageSize: number;
}

export function PageSizeSelector({
	pageSize,
	onPageSizeChange,
}: PageSizeSelectorProps) {
	return (
		<div className="flex items-center gap-2 text-muted-foreground text-sm">
			<label htmlFor="page-size-selector">Show</label>
			<select
				aria-label="Results per page"
				className="h-8 rounded-md border border-input bg-background px-2 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-ring"
				id="page-size-selector"
				onChange={(e) => onPageSizeChange(Number(e.target.value))}
				value={pageSize}
			>
				{PAGE_SIZES.map((size) => (
					<option key={size} value={size}>
						{size}
					</option>
				))}
			</select>
			<span>per page</span>
		</div>
	);
}
