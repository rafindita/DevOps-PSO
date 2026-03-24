import { Button } from "@scholar-seek/ui/components/button";
import {
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
} from "lucide-react";

interface PaginationProps {
	onPageChange: (page: number) => void;
	page: number;
	pageSize: number;
	total: number;
}

function getPageSlots(
	page: number,
	totalPages: number
): (number | "ellipsis")[] {
	if (totalPages <= 7) {
		return Array.from({ length: totalPages }, (_, i) => i + 1);
	}

	const slots: (number | "ellipsis")[] = [1];

	if (page <= 4) {
		slots.push(2, 3, 4, 5, "ellipsis", totalPages);
	} else if (page >= totalPages - 3) {
		slots.push(
			"ellipsis",
			totalPages - 4,
			totalPages - 3,
			totalPages - 2,
			totalPages - 1,
			totalPages
		);
	} else {
		slots.push("ellipsis", page - 1, page, page + 1, "ellipsis", totalPages);
	}

	return slots;
}

export function Pagination({
	page,
	pageSize,
	total,
	onPageChange,
}: PaginationProps) {
	const totalPages = Math.ceil(total / pageSize);

	if (totalPages <= 1) {
		return null;
	}

	const slots = getPageSlots(page, totalPages);
	let ellipsisCount = 0;

	return (
		<div className="flex items-center justify-center gap-1">
			<Button
				aria-label="First page"
				className="h-8 w-8"
				disabled={page === 1}
				onClick={() => onPageChange(1)}
				size="icon"
				type="button"
				variant="outline"
			>
				<ChevronsLeft className="h-4 w-4" />
			</Button>

			<Button
				aria-label="Previous page"
				className="h-8 w-8"
				disabled={page === 1}
				onClick={() => onPageChange(page - 1)}
				size="icon"
				type="button"
				variant="outline"
			>
				<ChevronLeft className="h-4 w-4" />
			</Button>

			{slots.map((slot) =>
				slot === "ellipsis" ? (
					<span
						className="select-none px-1 text-muted-foreground"
						key={`ellipsis-${++ellipsisCount}`}
					>
						&hellip;
					</span>
				) : (
					<Button
						aria-current={slot === page ? "page" : undefined}
						aria-label={`Page ${slot}`}
						className="h-8 w-8"
						key={slot}
						onClick={() => onPageChange(slot)}
						size="icon"
						type="button"
						variant={slot === page ? "default" : "outline"}
					>
						{slot}
					</Button>
				)
			)}

			<Button
				aria-label="Next page"
				className="h-8 w-8"
				disabled={page === totalPages}
				onClick={() => onPageChange(page + 1)}
				size="icon"
				type="button"
				variant="outline"
			>
				<ChevronRight className="h-4 w-4" />
			</Button>

			<Button
				aria-label="Last page"
				className="h-8 w-8"
				disabled={page === totalPages}
				onClick={() => onPageChange(totalPages)}
				size="icon"
				type="button"
				variant="outline"
			>
				<ChevronsRight className="h-4 w-4" />
			</Button>
		</div>
	);
}
