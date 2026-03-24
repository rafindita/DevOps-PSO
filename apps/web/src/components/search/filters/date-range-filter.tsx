import { useEffect, useRef, useState } from "react";

interface DateRangeFilterProps {
	onYearRangeChange: (from: number, to: number) => void;
	yearFrom: number;
	yearMax: number;
	yearMin: number;
	yearTo: number;
}

const DEBOUNCE_MS = 500;

export function DateRangeFilter({
	yearFrom,
	yearTo,
	yearMin,
	yearMax,
	onYearRangeChange,
}: DateRangeFilterProps) {
	const [localFrom, setLocalFrom] = useState(yearFrom);
	const [localTo, setLocalTo] = useState(yearTo);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		setLocalFrom(yearFrom);
		setLocalTo(yearTo);
	}, [yearFrom, yearTo]);

	const callbackRef = useRef(onYearRangeChange);
	useEffect(() => {
		callbackRef.current = onYearRangeChange;
	}, [onYearRangeChange]);

	useEffect(() => {
		if (debounceRef.current) {
			clearTimeout(debounceRef.current);
		}

		debounceRef.current = setTimeout(() => {
			if (localFrom !== yearFrom || localTo !== yearTo) {
				callbackRef.current(localFrom, localTo);
			}
		}, DEBOUNCE_MS);

		return () => {
			if (debounceRef.current) {
				clearTimeout(debounceRef.current);
			}
		};
	}, [localFrom, localTo, yearFrom, yearTo]);

	return (
		<div className="space-y-3">
			<p className="text-center text-muted-foreground text-sm">
				{localFrom} — {localTo}
			</p>

			<div className="space-y-1">
				<label className="text-muted-foreground text-xs" htmlFor="year-from">
					From
				</label>
				<input
					className="w-full cursor-pointer"
					id="year-from"
					max={yearMax}
					min={yearMin}
					onChange={(e) => {
						const val = Number.parseInt(e.target.value, 10);
						setLocalFrom(Math.min(val, localTo));
					}}
					type="range"
					value={localFrom}
				/>
			</div>

			<div className="space-y-1">
				<label className="text-muted-foreground text-xs" htmlFor="year-to">
					To
				</label>
				<input
					className="w-full cursor-pointer"
					id="year-to"
					max={yearMax}
					min={yearMin}
					onChange={(e) => {
						const val = Number.parseInt(e.target.value, 10);
						setLocalTo(Math.max(val, localFrom));
					}}
					type="range"
					value={localTo}
				/>
			</div>
		</div>
	);
}
