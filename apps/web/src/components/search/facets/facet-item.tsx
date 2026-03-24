interface FacetItemProps {
	checked: boolean;
	count: number;
	onToggle: (value: string) => void;
	value: string;
}

export function FacetItem({ value, count, checked, onToggle }: FacetItemProps) {
	return (
		<label className="group flex cursor-pointer items-center justify-between gap-2 py-0.5">
			<div className="flex min-w-0 items-center gap-2">
				<input
					checked={checked}
					className="h-3.5 w-3.5 shrink-0 cursor-pointer rounded border-input accent-foreground"
					onChange={() => onToggle(value)}
					type="checkbox"
				/>
				<span className="truncate text-muted-foreground text-sm leading-tight group-hover:text-foreground">
					{value}
				</span>
			</div>
			<span className="shrink-0 text-muted-foreground text-xs tabular-nums">
				{count}
			</span>
		</label>
	);
}
